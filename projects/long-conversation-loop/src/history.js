import { createHash } from 'node:crypto'

const PAGE_SIZE = 12
const EXCERPT = 1600
const TAIL = 6
// Select extra verbatim quotations for the small reminder. Matching a word
// never decides what is authorized, finished or superseded.
const changeLanguage = /改为|改成|改用|更正|纠正|取消|撤回|撤销|暂缓|暂停|恢复|优先|仅限|只[能许做要]|等.{0,14}(?:验收|确认|同意)|不[要许再能]|先不|暂不|禁止|不用|必须|\b(?:instead|cancel|revoke|withdraw|pause|resume|only|never|must|approval|permission|correction|do not|don't|no longer)\b/iu

export function clipped(text, limit) {
  if (text.length <= limit) return text
  if (text.length <= limit * 2 && Array.from(text).length <= limit) return text
  const half = Math.floor(limit / 2)
  return Array.from(text.slice(0, limit + 2)).slice(0, half).join('') + '〔中段省略〕' +
    Array.from(text.slice(-limit - 2)).slice(-half).join('')
}

// Pages are immutable and scoped to a single session. Publishing the boundary
// last makes a partial write harmless and a retried capture idempotent.
function pageKey(previous, entries) {
  return createHash('sha256').update(JSON.stringify([previous, entries])).digest('hex')
}

export const key = (session, type, id) => JSON.stringify([session, type, id])
export const sessionPrefix = session => JSON.stringify([session]).slice(0, -1) + ','
const progressFields = ['constraints', 'superseded', 'done', 'next']
export const progressInput = {
  type: 'object', additionalProperties: false, required: progressFields,
  properties: Object.fromEntries(progressFields.map(k => [k, {
    type: 'array', maxItems: 5, items: { type: 'string', maxLength: 180 },
  }])),
}

function readProgress(input) {
  if (!progressFields.every(k => Array.isArray(input?.[k]) && input[k].length <= 5 &&
    input[k].every(v => typeof v === 'string' && v.length <= 360))) return
  return Object.fromEntries(progressFields.map(k => [k, input[k].map(v => clipped(v, 180))]))
}
export const boundary = rows => rows.find(row => row.type === 'compaction' && row.status === 'completed')

export async function readBoundary(storage, session, marker, journal) {
  if (!marker) return
  const exact = await storage.get(key(session, 'compact', marker.id))
  if (exact) return exact
  // 2.4.0 adopts a background summary with the first retained assistant's
  // ID as keepID. Only the prefix tied to that precise anchor can be reused.
  const anchor = marker.metadata?.keepID
  if (!anchor) return
  const joinedKey = key(session, 'joined', marker.id)
  const joined = await storage.get(joinedKey)
  if (joined) return joined
  const base = await storage.get(key(session, 'background', anchor))
  if (!base) return
  const tail = journal?.tail(session, anchor, marker.id)
  if (tail) return saveWindow(storage, session, base, tail, false, joinedKey)
  return { ...base, gap: true, unanswered: null }
}

export async function saveWindow(storage, session, previous, rows, gap, target) {
  const state = {
    count: previous?.count ?? 0, head: previous?.head ?? null,
    first: previous?.first ?? null, latest: [...(previous?.latest ?? [])],
    changes: [...(previous?.changes ?? [])], unanswered: previous?.unanswered ?? null,
    calls: [...(previous?.calls ?? [])], progress: previous?.progress ?? null, gap: Boolean(previous?.gap || gap),
  }
  let page = []
  async function flush() {
    const hash = pageKey(state.head, page)
    await storage.set(key(session, 'page', hash), { previous: state.head, entries: page })
    state.head = hash
    page = []
  }
  for (const row of rows) {
    if (row.type === 'user' && typeof row.text === 'string' && row.text.trim()) {
      const entry = { n: ++state.count, id: row.id, text: clipped(row.text, EXCERPT) }
      state.first ??= entry
      state.latest = [...state.latest, entry].slice(-TAIL)
      if (changeLanguage.test(row.text)) state.changes = [...state.changes, entry].slice(-4)
      state.unanswered = entry.n
      page.push(entry)
      if (page.length === PAGE_SIZE) await flush()
    }
    if (row.type === 'assistant') {
      if (row.content?.length) state.unanswered = null
      for (const part of row.content ?? []) {
        if (part.type !== 'tool' || !['completed', 'error'].includes(part.state?.status)) continue
        if (part.name === 'loop_checkpoint' && part.state.status === 'completed') {
          const fields = readProgress(part.state.input)
          if (fields) state.progress = { through: state.count, fields }
          continue
        }
        if (part.name === 'loop_recall') continue
        state.calls.push({ name: clipped(String(part.name), 48), status: part.state.status })
        if (state.calls.length > 4) state.calls.shift()
      }
    }
  }
  if (page.length) await flush()
  await storage.set(target, state)
  return state
}

export async function recall(storage, session, state, endingAt, query = '') {
  if (!state?.count) return []
  const end = Math.min(endingAt ?? state.count, state.count)
  const needle = query.trim().toLowerCase()
  const found = []
  for (let cursor = state.head; cursor;) {
    const page = await storage.get(key(session, 'page', cursor))
    if (!page) break
    const matches = page.entries.filter(entry => entry.n <= end && (!needle || entry.text.toLowerCase().includes(needle)))
    found.unshift(...matches.slice(-(4 - found.length)))
    if (found.length === 4) break
    cursor = page.previous
  }
  return found
}

export function reminder(state) {
  if (!state?.count) return
  const selected = new Map([state.first, ...(state.changes ?? []), ...state.latest].map(entry => [entry.n, entry]))
  const entries = [...selected.values()].sort((a, b) => a.n - b.n)
  const lines = entries.map(entry => ({
    n: entry.n, text: clipped(entry.text, entry.n === state.count ? 360 : 190),
  }))
  return [
    '【长对话续接 · 历史资料】以下引文来自本会话已投递的输入，按时间排列。首条用于定位任务；同一事项以后续修改为准。以宿主摘要、已发生的动作及之后的真实输入核对现状。旧引文不重新授予权限，也不要求重做。',
    state.gap ? '本记录只覆盖能核对的部分。较早历史或后台压缩后段可在原生上下文中核对。' : '',
    state.unanswered ? '截至这个压缩边界，输入 ' + state.unanswered + ' 后尚未观察到助手输出；结合边界后新消息判断待办。' : '',
    state.count > entries.length ? '中间有未列出的追加要求。权限、范围或数字有疑问时先用 loop_recall 按编号或关键词核对。' : '',
    state.progress ? '执行者上次记录（截至输入 ' + state.progress.through + '，后续修订优先，完成项按证据核实） ' +
      JSON.stringify(Object.fromEntries(progressFields.map(k => [k, state.progress.fields[k].map(v => clipped(v, 70))]))) : '',
    '输入摘录（编号可供 loop_recall 回查，共 ' + state.count + ' 条） ' + JSON.stringify(lines),
    state.calls.length ? '近期工具回执（只表示调用结果） ' + JSON.stringify(state.calls) : '',
  ].filter(Boolean).join('\n')
}
