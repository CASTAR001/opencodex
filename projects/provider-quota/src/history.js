// OpenCode 2.3.2's public aggregates omit Code Mode calls and the timestamp of each model step.
// Keep the two projections here, read-only, in the sidecar that owns the database.
import path from 'node:path'
import os from 'node:os'
import { mediaKind } from './media.js'

export async function withHistory(app, read) {
  if (!app?.channel) throw Error('宿主历史不可用')
  const channel = app.channel
  const plain =
    ['latest', 'dev', 'beta', 'next', 'prod'].includes(channel) ||
    ['1', 'true'].includes(process.env.OPENCODE_DISABLE_CHANNEL_DB)
  const file =
    process.env.OPENCODE_DB ??
    (plain ? 'opencode.db' : 'opencode-' + channel.replace(/[^a-zA-Z0-9._-]/g, '-') + '.db')
  if (file === ':memory:') throw Error('宿主使用内存数据库')
  const data = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share')
  const filename = path.resolve(data, 'opencode', file)
  const db = process.versions.bun
    ? new (await import('bun:sqlite')).Database(filename, { readonly: true })
    : new (await import('node:sqlite')).DatabaseSync(filename, { readOnly: true })
  try {
    return read(db)
  } finally {
    db.close()
  }
}
const messages = `
  FROM session_message m JOIN session_v2 s ON s.id=m.session_id
  WHERE m.type='assistant' AND m.time_created >= ? AND m.time_created < ?
    AND (s.fork_session_id IS NULL OR m.time_created >= s.time_created)`
export function historicalMedia(db, { from, to }, names) {
  const rows = db
    .prepare(
      `WITH recent AS (
    SELECT m.id, m.data ${messages}
  ), parts AS (
    SELECT p.data AS data FROM recent r JOIN session_part p ON p.message_id=r.id WHERE p.type='tool'
    UNION ALL
    SELECT c.value FROM recent r,json_each(r.data,'$.content') c WHERE json_extract(c.value,'$.type')='tool'
  ), calls AS (
    SELECT json_extract(data,'$.name') AS name, json_extract(data,'$.state.status') AS status FROM parts
    UNION ALL
    SELECT json_extract(c.value,'$.tool'),json_extract(c.value,'$.status') FROM parts,
      json_each(data,'$.state.metadata.toolCalls') c
    WHERE json_extract(data,'$.name')='execute'
  ) SELECT name,status,count(*) AS count FROM calls WHERE status IN ('completed','error') GROUP BY name,status`,
    )
    .all(from, to)
  const totals = ['生图', '语音'].map((kind) => ({ kind, calls: 0, failed: 0, source: 'history' }))
  for (const row of rows) {
    const kind = mediaKind(row.name, names)
    const total = totals.find((t) => t.kind === kind)
    if (!total) continue
    total.calls += row.count
    if (row.status === 'error') total.failed += row.count
  }
  return totals
}

const rates = new Map([
  ['mimo-v2.6-pro', [2.5, 300, 600]],
  ['mimo-v2.6-flash', [2, 100, 200]],
  ['mimo-v2.5-pro', [2.5, 300, 600]],
  ['mimo-v2.5', [2, 100, 200]],
])
const tts = new Set(['mimo-v2.5-tts', 'mimo-v2.5-tts-voiceclone', 'mimo-v2.5-tts-voicedesign'])
const monthly = 11_000_000_000
export function mimoUsage(db, { from, today, to }, plans) {
  if (!plans.length) return { problem: '未识别到 MiMo Token Plan 连接' }
  const rows = db
    .prepare(
      `SELECT m.time_created AS at, json_extract(m.data,'$.model.id') AS model,
    json_extract(m.data,'$.tokens.input') AS input, json_extract(m.data,'$.tokens.cache.read') AS cacheRead,
    json_extract(m.data,'$.tokens.cache.write') AS cacheWrite, json_extract(m.data,'$.tokens.output') AS output,
    json_extract(m.data,'$.tokens.reasoning') AS reasoning ${messages}
    AND json_extract(m.data,'$.model.providerID') IN (SELECT value FROM json_each(?))`,
    )
    .all(from, to, JSON.stringify(plans))
  const result = { today: 0, week: 0 }
  const partial = { today: false, week: false },
    counted = { today: 0, week: 0 }
  for (const r of rows) {
    const rate = rates.get(r.model)
    const valid =
      rate &&
      [r.input, r.cacheRead, r.cacheWrite, r.output, r.reasoning].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      )
    // OpenCode reports cache writes as a separate component of non-hit input.
    const offPeak = new Date(r.at).getUTCHours() >= 16
    const credits = tts.has(r.model)
      ? 0
      : valid
        ? (r.cacheRead * rate[0] +
            (r.input + r.cacheWrite) * rate[1] +
            (r.output + r.reasoning) * rate[2]) *
          (offPeak ? 0.8 : 1)
        : null
    for (const key of r.at >= today ? ['week', 'today'] : ['week']) {
      if (credits === null) partial[key] = true
      else {
        result[key] += credits
        counted[key]++
      }
    }
  }
  for (const key of ['week', 'today'])
    result[key] = {
      percent: partial[key] && !counted[key] ? null : (result[key] / monthly) * 100,
      partial: partial[key],
    }
  return result
}
