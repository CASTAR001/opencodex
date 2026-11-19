import { Plugin, Slot, Style, TitlebarItem } from '@opencode/plugin/gui'
import { createComponent, createEffect, onCleanup } from 'solid-js'
import { families, contract, unavailable } from './contract.js'
import css from './style.css'

const number = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 })
const fmt = (n) => (Number.isFinite(n) ? number.format(n) : '—')
const quotaNumber = new Intl.NumberFormat('zh-CN', { maximumSignificantDigits: 21 })
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
function range(days, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  start.setDate(start.getDate() - Math.max(0, days - 1))
  return { from: days ? start.getTime() : 0, to: now.getTime() + 1 }
}
function total(t) {
  return t.input + t.output + t.reasoning + t.cache.read + t.cache.write
}
function usageView(stats, media, providers, showMini) {
  const box = el('div')
  const models = stats.models.filter((m) => providers.includes(m.model.providerID))
  const counters = el('div', null, 'pq-counters')
  for (const [name, value] of [
    ['Token 总量', models.reduce((n, m) => n + total(m.tokens), 0)],
    ['模型步骤', models.reduce((n, m) => n + m.steps, 0)],
  ]) {
    const item = el('div')
    item.append(el('span', name), el('strong', fmt(value)))
    counters.append(item)
  }
  if (providers.length)
    box.append(
      counters,
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
  if (showMini) {
    box.append(el('h3', 'MiniMax MCP'))
    if (media) {
      box.append(
        table(
          ['工具', '成功', '失败'],
          media.map((r) => [r.kind, fmt(r.calls - r.failed), fmt(r.failed)]),
        ),
        el(
          'small',
          media[0]?.source === 'history'
            ? '来自本机历史，含 Code Mode 内层调用。'
            : '宿主历史不可用，仅显示插件启用后观察到的调用。',
          'pq-muted',
        ),
      )
    } else box.append(el('p', '工具计数暂不可用。', 'pq-muted'))
    box.append(el('p', 'MCP 记录没有逐笔扣额，实际消耗请以 MiniMax 账单为准。', 'pq-muted'))
  }
  return box
}
function dashboard(ctx, session) {
  const root = el('div', null, 'pq-page')
  const toolbar = el('div', null, 'pq-toolbar'),
    nav = el('nav'),
    controls = el('div', null, 'pq-controls'),
    content = el('div'),
    status = el('p', null, 'pq-muted')
  status.setAttribute('role', 'status')
  const pages = { quota: '剩余额度', usage: '用量统计' }
  let index = 'quota',
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
  const lifetime = new AbortController()
  const history = new Map()
  const busy = new Map()
  const keys = Object.keys(pages)
  const buttons = keys.map(key => btn(pages[key], () => {
    if (key !== index) switchTo(key)
  }))
  nav.append(...buttons)
  toolbar.append(nav, controls)
  root.append(toolbar, content, status)
  function selection(label, options, value, change) {
    const select = el('select')
    select.setAttribute('aria-label', label)
    for (const [id, name] of options) select.add(new Option(name, String(id)))
    select.value = String(value)
    select.onchange = () => change(select.value)
    return select
  }
  let configured = [],
    discovered = false,
    inventorySerial = 0,
    mimo
  const has = (id) => configured.some((row) => row.family === id)
  const options = () => configured.map((row) => [row.family, families[row.family]])
  function mimoCard() {
    const card = el('section', null, 'pq-card')
    card.append(el('h3', '小米 MiMo · Standard'), el('small', '¥99/月 · 110 亿 Credits · 本机估算'))
    for (const [key, label] of [
      ['today', '今天'],
      ['week', '近 7 天'],
    ]) {
      const reading = mimo?.[key]
      const n = reading?.percent
      const value = Number.isFinite(n) ? (n > 0 && n < 0.01 ? '<0.01%' : fmt(n) + '%') : '—'
      card.append(
        el('div', label + '　' + value + (reading?.partial ? '（部分记录缺少可换算用量）' : '')),
      )
    }
    if (mimo?.problem) card.append(el('small', mimo.problem))
    return card
  }
  function drawUsage() {
    if (!discovered || !configured.length || index !== 'usage') return
    const general = configured.filter((r) => r.family !== 'mimo' && (!filter || r.family === filter))
    const period = controls.querySelector('[aria-label="统计时段"]')
    if (period) period.hidden = !general.length
    const nodes = []
    if (general.length && stats)
      nodes.push(
        usageView(
          stats,
          media,
          general.flatMap((r) => r.providers),
          general.some((r) => r.family === 'minimax'),
        ),
      )
    if (has('mimo') && (!filter || filter === 'mimo')) nodes.push(mimoCard())
    content.replaceChildren(...nodes)
  }
  async function discover() {
    if (!alive || document.hidden) return
    const ticket = ++inventorySerial
    try {
      const list = await api.inventory({}, { location, signal: AbortSignal.any([lifetime.signal, AbortSignal.timeout(12000)]) })
      if (!alive || ticket !== inventorySerial) return
      const changed = !discovered || JSON.stringify(list) !== JSON.stringify(configured)
      discovered = true
      if (!changed) return
      for (const [id, cached] of history) {
        if (JSON.stringify(list.find((r) => r.family === id)) !== cached.connection) history.delete(id)
      }
      const changedAccounts = list.filter(row =>
        JSON.stringify(configured.find(previous => previous.family === row.family)) !== JSON.stringify(row))
      configured = list
      if (!has(filter)) filter = ''
      stats = media = mimo = lastRead = undefined
      switchTo(index, changedAccounts)
    } catch {
      if (alive && ticket === inventorySerial) status.textContent = '暂时无法读取当前服务商配置。'
    }
  }
  async function readUsage() {
    if (!alive || !discovered || !configured.length || document.hidden || active) return
    const token = ++serial,
      controller = new AbortController()
    active = controller
    const now = new Date(),
      span = range(days, now),
      week = range(7, now)
    const general = index === 'usage' && configured.some((r) => r.family !== 'mimo')
    const readOptions = { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) }
    const local = { ...readOptions, location }
    try {
      const [data, calls, estimate] = await Promise.allSettled([
        general &&
          client.experimental.session.stats(
            {
              ...span,
              from: span.from || undefined,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              tools: 'none',
            },
            readOptions,
          ),
        general && has('minimax') && api.media(span, local),
        has('mimo') && api.mimo({ ...week, today: range(1, now).from }, local),
      ])
      if (!alive || token !== serial) return
      media = calls.status === 'fulfilled' ? calls.value : undefined
      mimo = estimate.status === 'fulfilled' ? estimate.value : { problem: '暂时无法读取本机用量' }
      if (data.status === 'fulfilled' && general) stats = data.value
      if (index === 'usage') drawUsage()
      else drawQuotas()
      if (data.status === 'rejected') status.textContent = '暂时无法读取模型统计。'
      else if (index === 'usage') {
        lastRead = Date.now()
        status.textContent = '当前服务器 · 所有项目 · 更新于 ' + time(lastRead)
      }
    } finally {
      if (active === controller) active = undefined
    }
  }
  function drawQuotas() {
    if (!alive || index !== 'quota') return
    const cards = options().map(([id, name]) => {
      if (id === 'mimo') return mimoCard()
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
      const entries = history.get(id)?.rows
      if (!entries) card.append(el('p', unavailable[id] || (busy.has(id) ? '正在查询额度…' : '等待查询'), 'pq-muted'))
      for (const entry of entries || []) {
        for (const row of entry.values || []) {
          const reset = row.reset ? '　重置 ' + time(row.reset) : ''
          const amounts = []
          const unit = row.unit === '%' ? '%' : row.unit ? ' ' + row.unit : ''
          const fraction = row.total != null ? ' / ' + quotaNumber.format(row.total) : ''
          if (row.remaining != null) amounts.push((unit === '%' || !unit ? '剩余 ' : '') + quotaNumber.format(row.remaining) + unit + (!unit ? fraction : ''))
          if (row.used != null) amounts.push('已用 ' + quotaNumber.format(row.used) + unit + fraction)
          if (row.count != null) amounts.push('计数 ' + quotaNumber.format(row.count) + fraction)
          if (row.state) amounts.push(row.state)
          card.append(el('div', row.label + '　' + amounts.join('　') + reset))
        }
        if (entry.problem) card.append(el('p', entry.problem, 'pq-muted'))
        if (entry.select) {
          const one = btn('查询 ' + entry.source, () => refresh(id, entry.source))
          one.disabled = busy.has(id)
          card.append(one)
        }
        if (entry.at) card.append(el('small', '查询于 ' + time(entry.at)))
      }
      return card
    })
    content.replaceChildren(...cards)
    const all = controls.querySelector('button')
    if (all) all.disabled = busy.size > 0 || !configured.some((r) => !unavailable[r.family])
  }
  async function refresh(id, source) {
    if (unavailable[id] || !has(id)) return
    const connection = JSON.stringify(configured.find((r) => r.family === id))
    if (busy.get(id) === connection) return
    const valid = () => alive && connection === JSON.stringify(configured.find((r) => r.family === id))
    busy.set(id, connection)
    drawQuotas()
    try {
      const rows = await api.refresh(
        { family: id, ...(source && { source }) },
        { location, signal: AbortSignal.any([lifetime.signal, AbortSignal.timeout(15000)]) },
      )
      if (valid())
        history.set(id, {
          connection,
          rows: source
            ? [...(history.get(id)?.rows || []).filter((p) => p.source !== source), ...rows]
            : rows,
        })
    } catch {
      if (valid()) history.set(id, { connection, rows: [{ problem: '额度服务未连接，请稍后手动刷新' }] })
    } finally {
      if (busy.get(id) === connection) busy.delete(id)
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
  function switchTo(i, refreshAccounts = configured) {
    cancelUsage()
    index = i
    buttons.forEach((b, n) => b.setAttribute('aria-pressed', String(i === keys[n])))
    controls.replaceChildren()
    content.replaceChildren()
    status.textContent = ''
    if (!discovered || !configured.length) {
      status.textContent = discovered ? '当前工作区尚未配置支持的服务商。' : '正在读取当前服务商…'
      return
    }
    if (i === 'usage') {
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
            switchTo('usage')
          },
        ),
        selection('模型服务商', [['', '全部服务商'], ...options()], filter, (v) => {
          filter = v
          drawUsage()
        }),
      )
      drawUsage()
    } else {
      controls.append(btn('刷新全部额度', () => Promise.all(configured.map((r) => refresh(r.family)))))
      drawQuotas()
      for (const row of refreshAccounts) void refresh(row.family)
    }
    void readUsage()
    clock = setInterval(readUsage, 60000)
  }
  const visible = () => {
    void discover()
    void readUsage()
  }
  const inventoryClock = setInterval(discover, 30000)
  document.addEventListener('visibilitychange', visible)
  const stop = session.server.data?.listen(({ name }) => {
    if (
      [
        'provider.updated',
        'model.updated',
        'integration.updated',
        'config.updated',
        'mcp.status.changed',
        'mcp.tools.changed',
        'server.connected',
      ].includes(name)
    )
      void discover()
    if (
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
    lifetime.abort()
    cancelUsage()
    stop?.()
    clearInterval(inventoryClock)
    document.removeEventListener('visibilitychange', visible)
  })
  switchTo('quota')
  void discover()
  return createComponent(ctx.ui.Dialog, { title: session.location ? '用量与额度' : '用量与额度 · 本机全局', size: 'large', children: root })
}
export default Plugin.define({
  setup(ctx) {
    ctx.add(Style, css)
    const draft = () => ctx.router.path().split('?')[0] === '/new-session'
    const localAccount = () => {
      const server = ctx.servers.list().map(id => ctx.servers.get(id)).find(server => server?.builtin)
      if (server) return { server }
    }
    const show = account => ctx.dialogs.open(() => dashboard(ctx, account))
    const wallet = (open, global) => {
      const button = btn(null, open)
      button.className = 'pq-open'
      button.title = global ? '查看本机全局额度' : '查看用量与额度'
      button.setAttribute('aria-label', button.title)
      return button
    }
    // The draft's public route has no project location.
    ctx.add(TitlebarItem, () => {
      if (!draft()) return
      const account = localAccount()
      if (account) return { id: 'draft-quota', icon: 'providers', label: '剩余额度',
        title: '查看本机全局额度', run: () => show(account) }
    })
    // The narrow shell replaces the timeline header with native mobile navigation.
    ctx.add(Slot, { at: 'window.bottom', render() {
      const dock = el('div', null, 'pq-narrow-entry')
      createEffect(() => {
        const global = draft()
        const account = global ? localAccount() : ctx.sessions.current()
        dock.replaceChildren(...(account ? [wallet(() => show(account), global)] : []))
      })
      return dock
    } })
    ctx.add(Slot, {
      at: 'session.header',
      order: 8,
      render(input) {
        const button = wallet(() => show(input.session), false)
        createEffect(() => {
          button.hidden = !input.active
        })
        return button
      },
    })
  },
})
