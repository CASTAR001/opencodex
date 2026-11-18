import { createEffect, createSignal, onCleanup, untrack } from 'solid-js'
import { usePanel } from '@opencode/plugin/gui'
import { observeSession } from './session.js'
import { summarize } from './metrics.js'
import { visibleRate } from './stream.js'

function element(tag, text) {
  const node = document.createElement(tag)
  if (text !== undefined) node.textContent = text
  return node
}

function select(label, entries) {
  const field = element('label')
  const control = element('select')
  for (const [value, text] of entries) control.add(new Option(text, value))
  field.append(element('span', label), control)
  return { field, control }
}

function stat(grid, label, hint) {
  const field = element('div')
  const title = element('dt', label)
  const value = element('dd', '—')
  field.title = hint
  field.append(title, value)
  grid.append(field)
  return { title, value }
}

function mount(root, ctx, session, connected, locale) {
  const t = key => ctx.t(key)
  const digits = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const ratio = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })
  const source = observeSession(session, connected)
  const [model, setModel] = createSignal('')
  const [period, setPeriod] = createSignal('session')
  const [now, setNow] = createSignal(Date.now())
  const cutoff = () => period() === 'hour' ? now() - 3600000 : -Infinity
  const liveRate = visibleRate(session, connected, model, cutoff)
  const modelName = id => id === '?' ? t('unknown') : id || '—'

  const modelLine = element('p')
  modelLine.className = 'ocx-metrics-model'
  const modelValue = element('strong')
  modelLine.append(element('span', t('recentModel')), modelValue)
  const filters = element('div')
  filters.className = 'ocx-metrics-filters'
  const models = select(t('model'), [['', t('all')]])
  const range = select(t('range'), [['session', t('session')], ['hour', t('hour')]])
  models.control.onchange = () => setModel(models.control.value)
  range.control.onchange = () => { setNow(Date.now()); setPeriod(range.control.value) }
  filters.append(models.field, range.field)
  const stats = element('dl')
  stats.className = 'ocx-metrics-stats'
  const hit = stat(stats, t('hit'), t('hitHint'))
  const speed = stat(stats, t('recent') + ' TPS', t('speedHint'))
  const bar = element('meter')
  bar.min = 0
  bar.max = 1
  bar.setAttribute('aria-label', t('hit'))
  hit.value.after(bar)
  const estimate = element('p')
  estimate.className = 'ocx-metrics-estimate'
  estimate.title = t('estimateHint')
  createEffect(() => {
    const rate = liveRate()
    estimate.hidden = rate == null
    estimate.textContent = rate == null ? '' : t('estimated') + ' · ' + digits.format(rate) + ' TPS'
  })
  const status = element('p')
  status.setAttribute('role', 'status')
  const retry = element('button', t('retry'))
  retry.type = 'button'
  retry.onclick = source.retry
  const details = element('details')
  details.open = true
  const list = element('dl')
  const counters = new Map()
  for (const key of ['total','input','read','write','output','reasoning','compaction']) {
    const value = element('dd')
    list.append(element('dt', t(key)), value)
    counters.set(key, value)
  }
  details.append(element('summary', t('reported')), list)
  root.replaceChildren(modelLine, stats, estimate, filters, status, retry, details)

  createEffect(() => {
    if (period() !== 'hour') return
    const instant = Date.now()
    const boundary = source.rows().reduce((next, row) => {
      const expiry = row.created + 3600001
      return expiry > instant ? Math.min(next, expiry) : next
    }, Infinity)
    // Wake when a measured row leaves the hour, even while the session is idle.
    now()
    if (boundary === Infinity) return
    const timer = setTimeout(() => setNow(Date.now()), Math.min(2147483647, boundary - instant))
    onCleanup(() => clearTimeout(timer))
  })
  let modelOptions = ''
  let timer
  let lastPaint = -Infinity
  createEffect(() => {
    const rows = source.rows()
    const selected = model()
    const hour = period() === 'hour'
    const end = hour ? Math.max(now(), Date.now()) + 1 : Infinity
    const running = source.running()
    const coverage = source.coverage()
    function paint() {
      lastPaint = performance.now()
      const r = summarize(rows, { model: selected, since: hour ? end - 1 - 3600000 : -Infinity, until: end,
        running, complete: coverage === 'complete' })
      const options = JSON.stringify(r.models)
      if (options !== modelOptions) {
        modelOptions = options
        models.control.replaceChildren(new Option(t('all'), ''), ...r.models.map(id => new Option(modelName(id), id)))
        if (selected && !r.models.includes(selected)) { setModel(''); return }
        models.control.value = selected
      }
      modelValue.textContent = modelName(r.latestModel)
      hit.value.textContent = r.hit == null ? '—' : ratio.format(r.hit)
      bar.hidden = r.hit == null
      bar.value = r.hit ?? 0
      speed.title.textContent = t(r.previous ? 'previous' : 'recent') + ' TPS'
      speed.value.textContent = r.speed ? digits.format(r.speed.tps) : '—'
      const notes = []
      if (coverage !== 'complete') notes.push(t(coverage))
      if (running) notes.push(t('generating'))
      if (r.speed?.includesWait) notes.push(t('wait'))
      if (r.missing) notes.push(t('missing') + ' · ' + r.missing)
      if (!r.counted && coverage === 'complete' && !running) notes.push(t('empty'))
      const note = notes.join(' · ')
      if (status.textContent !== note) status.textContent = note
      status.hidden = !note
      retry.hidden = coverage !== 'error'
      const counts = { ...r.totals, total: r.inputTotal, compaction: r.compactionTokens }
      for (const [key, node] of counters) node.textContent = r.counted ? digits.format(counts[key]) : '—'
    }
    clearTimeout(timer)
    const delay = running ? 250 - (performance.now() - lastPaint) : 0
    if (delay > 0) timer = setTimeout(paint, delay)
    else paint()
  })
  onCleanup(() => clearTimeout(timer))
}

export function panel(ctx, props) {
  const frame = usePanel()
  const root = element('section')
  root.className = 'ocx-session-metrics'
  createEffect(() => {
    if (!frame.visible()) { root.replaceChildren(); return }
    const session = props.session
    const locale = ctx.locale.locale()
    const { data, client, connected } = session.server
    const target = { id: session.id, key: session.key, server: { data, client } }
    untrack(() => mount(root, ctx, target, connected, locale))
  })
  return root
}
