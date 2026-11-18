import { Plugin, Slot, Style } from '@opencode/plugin/gui'
import { createComponent, createEffect, onCleanup } from 'solid-js'
import { families, contract, unavailable } from './contract.js'
import { mediaKind } from './media.js'
import css from './style.css'

const number = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 })
const fmt = (n) => (Number.isFinite(n) ? number.format(n) : '—')
const time = (t) =>
  new Date(t).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
function el(tag, text, cls) {
  const n = document.createElement(tag)
  if (text != null) n.textContent = text
  if (cls) n.className = cls
  return n
}
function btn(text, action) {
  const n = el('button', text)
  n.type = 'button'
  n.onclick = action
  return n
}
function table(headers, rows) {
  const t = el('table'),
    head = t.createTHead().insertRow()
  for (const h of headers) head.append(el('th', h))
  const body = t.createTBody()
  for (const values of rows) {
    const row = body.insertRow()
    for (const value of values) row.insertCell().textContent = value
  }
  const scroll = el('div', null, 'pq-scroll')
  scroll.append(t)
  return scroll
}
function range(days) {
  const now = new Date(),
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  start.setDate(start.getDate() - Math.max(0, days - 1))
  return { from: days ? start.getTime() : 0, to: now.getTime() + 1 }
}
const familyPatterns = {
  kimi: /kimi|moonshot/i,
  mimo: /mimo|xiaomi/i,
  glm: /zhipu|bigmodel|\bglm|^zai/i,
  deepseek: /deepseek/i,
  minimax: /minimax|mini-max/i,
  qwen: /qwen|dashscope|alibaba|bailian/i,
}
function modelFamily(model) {
  return Object.keys(familyPatterns).find(
    (k) => familyPatterns[k].test(model.providerID) || familyPatterns[k].test(model.id),
  )
}
function total(t) {
  return t.input + t.output + t.reasoning + t.cache.read + t.cache.write
}
function usageView(stats, media, filter) {
  const box = el('div')
  const models = stats.models.filter((m) => !filter || modelFamily(m.model) === filter)
  const counters = el('div', null, 'pq-counters')
  for (const [name, value] of [
    ['Token 总量', models.reduce((n, m) => n + total(m.tokens), 0)],
    ['模型步骤', models.reduce((n, m) => n + m.steps, 0)],
  ]) {
    const item = el('div')
    item.append(el('span', name), el('strong', fmt(value)))
    counters.append(item)
  }
  box.append(counters)
  box.append(
    models.length
      ? table(
          ['模型 / 服务商', '输入', '输出', '推理', '缓存读', '缓存写'],
          models.map(({ model, tokens: t }) => [
            model.id + (model.variant ? ' · ' + model.variant : '') + ' / ' + model.providerID,
            ...[t.input, t.output, t.reasoning, t.cache.read, t.cache.write].map(fmt),
          ]),
        )
      : el('p', '时段内没有匹配的模型记录。', 'pq-muted'),
  )
  if (!filter || filter === 'minimax') {
    box.append(
      el('h3', 'MiniMax MCP'),
      el('p', '插件启用后完成的工具调用，包含 Code Mode。一次调用按一次计数。', 'pq-muted'),
    )
    box.append(
      media
        ? table(
            ['工具', '成功', '失败'],
            media.map((row) => [row.kind, fmt(row.calls - row.failed), fmt(row.failed)]),
          )
        : el('p', '工具计数暂不可用。', 'pq-muted'),
    )
    const direct = (stats.tools?.usage || []).filter((tool) => mediaKind(tool.name))
    if (direct.length) {
      const details = el('details')
      details.append(
        el('summary', 'OpenCode 历史中单独列出的工具调用'),
        table(
          ['原始工具名', '调用', '失败'],
          direct.map((t) => [t.name, fmt(t.calls), fmt(t.failed)]),
        ),
      )
      box.append(details)
    }
  }
  return box
}
function dashboard(ctx, session, cache) {
  const root = el('div', null, 'pq-page')
  const nav = el('nav'),
    controls = el('div', null, 'pq-controls'),
    content = el('div'),
    status = el('p', null, 'pq-muted')
  status.setAttribute('role', 'status')
  const pages = ['用量统计', '账户额度']
  let index = 0,
    days = 7,
    filter = '',
    alive = true,
    serial = 0,
    active,
    clock,
    queued,
    stats,
    media,
    lastRead
  const location = session.location
  const client = session.server.client
  const api = client.rpc(contract)
  const accountKey =
    session.server.id + '\n' + (location?.workspaceID || '') + '\n' + (location?.directory || '')
  if (!cache.has(accountKey)) cache.set(accountKey, new Map())
  const history = cache.get(accountKey)
  const busy = new Set()
  const buttons = pages.map((label, i) => btn(label, () => switchTo(i)))
  nav.append(...buttons)
  root.append(nav, controls, content, status)
  function selection(label, options, value, change) {
    const select = el('select')
    select.setAttribute('aria-label', label)
    for (const [id, name] of options) select.add(new Option(name, String(id)))
    select.value = String(value)
    select.onchange = () => change(select.value)
    return select
  }
  function drawUsage() {
    if (stats) content.replaceChildren(usageView(stats, media, filter))
  }
  async function readUsage() {
    if (!alive || index !== 0 || document.hidden || active) return
    const token = ++serial,
      controller = new AbortController()
    active = controller
    const span = range(days)
    if (!stats) status.textContent = '正在读取本地用量…'
    try {
      const options = { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }
      const [data, calls] = await Promise.allSettled([
        client.experimental.session.stats(
          {
            ...span,
            from: span.from || undefined,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            tools: 'detail',
          },
          options,
        ),
        api.media(span, { ...options, location }),
      ])
      if (!alive || token !== serial) return
      if (data.status !== 'fulfilled') throw Error()
      stats = data.value
      media = calls.status === 'fulfilled' ? calls.value : null
      lastRead = Date.now()
      drawUsage()
      status.textContent = '当前服务器 · 所有项目 · 更新于 ' + time(lastRead)
    } catch {
      if (alive && token === serial)
        status.textContent =
          (lastRead ? '保留 ' + time(lastRead) + ' 的统计。' : '') + '暂时无法读取本地用量。'
    } finally {
      if (active === controller) active = undefined
    }
  }
  function drawQuotas() {
    if (!alive || index !== 1) return
    const cards = Object.entries(families).map(([id, name]) => {
      const card = el('section', null, 'pq-card'),
        top = el('div', null, 'pq-top')
      top.append(el('h3', name))
      if (!unavailable[id]) {
        const b = btn(busy.has(id) ? '查询中…' : '刷新', () => refresh(id))
        b.disabled = busy.has(id)
        b.setAttribute('aria-label', '刷新 ' + name)
        top.append(b)
      }
      card.append(top)
      const entries = history.get(id)
      if (!entries) card.append(el('p', unavailable[id] || '尚未手动查询', 'pq-muted'))
      for (const entry of entries || []) {
        if (entry.source) card.append(el('small', entry.source + ' · ' + entry.host))
        for (const row of entry.values || []) {
          const reset = row.reset
            ? row.reset <= Date.now()
              ? '　窗口已到期，待刷新'
              : '　重置 ' + time(row.reset)
            : ''
          card.append(
            el(
              'div',
              row.label +
                '　' +
                (row.unit === '%' ? '剩余 ' : '') +
                fmt(row.remaining) +
                (row.unit === '%' ? '%' : ' ' + row.unit) +
                reset,
            ),
          )
        }
        if (entry.problem) card.append(el('p', entry.problem, 'pq-muted'))
        if (entry.select) {
          const one = btn('查询此连接', () => refresh(id, entry.source))
          one.disabled = busy.has(id)
          card.append(one)
        }
        if (entry.at) card.append(el('small', '查询于 ' + time(entry.at)))
      }
      return card
    })
    content.replaceChildren(...cards)
    const all = controls.querySelector('button')
    if (all) all.disabled = busy.size > 0
  }
  async function refresh(id, source) {
    if (busy.has(id) || unavailable[id]) return
    busy.add(id)
    drawQuotas()
    try {
      const rows = await api.refresh(
        { family: id, ...(source && { source }) },
        { location, signal: AbortSignal.timeout(15000) },
      )
      history.set(
        id,
        source ? [...(history.get(id) || []).filter((p) => p.source !== source), ...rows] : rows,
      )
    } catch {
      history.set(id, [{ problem: '额度服务未连接，请稍后手动刷新' }])
    } finally {
      busy.delete(id)
      drawQuotas()
    }
  }
  function cancelUsage() {
    ++serial
    active?.abort()
    active = undefined
    clearInterval(clock)
    clearTimeout(queued)
    queued = undefined
  }
  function switchTo(i) {
    cancelUsage()
    index = i
    buttons.forEach((b, n) => b.setAttribute('aria-pressed', String(i === n)))
    controls.replaceChildren()
    content.replaceChildren()
    status.textContent = ''
    if (i === 0) {
      controls.append(
        selection(
          '统计时段',
          [
            [1, '今天'],
            [7, '近 7 天'],
            [30, '近 30 天'],
            [0, '全部时间'],
          ],
          days,
          (v) => {
            days = Number(v)
            stats = media = lastRead = undefined
            switchTo(0)
          },
        ),
        selection('模型服务商', [['', '全部服务商'], ...Object.entries(families)], filter, (v) => {
          filter = v
          drawUsage()
        }),
      )
      drawUsage()
      void readUsage()
      clock = setInterval(readUsage, 60000)
    } else {
      controls.append(
        btn('刷新全部额度', () => Promise.all(Object.keys(families).map((id) => refresh(id)))),
      )
      drawQuotas()
    }
  }
  document.addEventListener('visibilitychange', readUsage)
  const stop = session.server.data?.listen(({ name }) => {
    if (
      index !== 0 ||
      document.hidden ||
      queued ||
      ![
        'session.step.ended',
        'session.step.failed',
        'session.compaction.ended',
        'server.connected',
      ].includes(name)
    )
      return
    queued = setTimeout(() => {
      queued = undefined
      void readUsage()
    }, 1000)
  })
  onCleanup(() => {
    alive = false
    cancelUsage()
    stop?.()
    document.removeEventListener('visibilitychange', readUsage)
  })
  switchTo(0)
  return createComponent(ctx.ui.Dialog, { title: '用量与额度', size: 'large', children: root })
}
export default Plugin.define({
  setup(ctx) {
    const cache = new Map()
    ctx.add(Style, css)
    ctx.add(Slot, {
      at: 'session.header',
      order: 8,
      render(input) {
        const button = btn('用量', () => ctx.dialogs.open(() => dashboard(ctx, input.session, cache)))
        button.className = 'pq-open'
        button.title = '查看用量与额度'
        button.setAttribute('aria-label', button.title)
        createEffect(() => {
          button.hidden = !input.active
        })
        return button
      },
    })
  },
})
