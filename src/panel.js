import { createEffect, createSignal, onCleanup, untrack } from 'solid-js'
import { usePanel } from '@opencode/plugin/gui'
import { summarize } from './metrics.js'

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

function mount(root, ctx, source, locale) {
  const t = key => ctx.t(key)
  const digits = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
  const ratio = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })
  const [model, setModel] = createSignal('')
  const [period, setPeriod] = createSignal('session')
  const [now, setNow] = createSignal(Date.now())
  const cutoff = () => period() === 'hour' ? now() - 3600000 : -Infinity
  const modelName = id => id === '?' ? t('unknown') : id || '—'

  const modelLine = element('p')
  modelLine.className = 'ocx-metrics-model'
  const modelValue = element('strong')
  modelLine.append(element('span', t('recentModel')), modelValue)
  const windowUsage = element('span')
  windowUsage.title = t('contextHint')
  modelLine.append(windowUsage)
  createEffect(() => {
    const value = source.context()
    windowUsage.textContent = t('context') + ' ' + (value?.percent == null ? '—' : ratio.format(value.percent / 100)) +
      (value ? ' · ' + digits.format(value.used) + ' / ' + (value.limit > 0 ? digits.format(value.limit) : '—') : '')
  })
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
    const sample = source.estimate()
    const rate = sample && (!model() || sample.model === model()) && sample.created >= cutoff() ? sample.tps : undefined
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
  for (const key of ['lastHit','average','ttft','trend','total','input','read','write','output','reasoning','compaction']) {
    const value = element('dd')
    const label = element('dt', t(key))
    if (key === 'lastHit') label.title = t('callHint')
    list.append(label, value)
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
      const r = !selected && !hour ? source.overall() : summarize(rows, { model: selected, since: hour ? end - 1 - 3600000 : -Infinity, until: end,
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
      for (const [key, count] of Object.entries(counts)) counters.get(key).textContent = r.counted ? digits.format(count) : '—'
      const delta = r.hitChange == null || Math.abs(r.hitChange) < 0.0005 ? '' :
        ' ' + (r.hitChange > 0 ? '↑' : '↓') + digits.format(Math.abs(r.hitChange) * 100) + ' pp'
      counters.get('lastHit').textContent = r.lastHit == null ? '—' : ratio.format(r.lastHit) + delta
      counters.get('average').textContent = r.average == null ? '—' : digits.format(r.average) + ' TPS'
      counters.get('ttft').textContent = r.ttft == null ? '—' : digits.format(r.ttft) + ' ms'
      const rates = r.recentRates
      const trend = counters.get('trend')
      const max = Math.max(...rates)
      trend.textContent = rates.length < 2 ? '—' : rates.map(rate => '▁▂▃▄▅▆▇█'[Math.round(rate / max * 7)]).join('')
      trend.title = rates.map(rate => digits.format(rate)).join(' → ') + (rates.length ? ' TPS' : '')
      trend.setAttribute('aria-label', trend.title || '—')
    }
    clearTimeout(timer)
    const delay = running ? 250 - (performance.now() - lastPaint) : 0
    if (delay > 0) timer = setTimeout(paint, delay)
    else paint()
  })
  onCleanup(() => clearTimeout(timer))
}

export function panel(ctx, props, useSession) {
  const frame = usePanel()
  const root = element('section')
  root.className = 'ocx-session-metrics'
  createEffect(() => {
    if (!frame.visible()) { root.replaceChildren(); return }
    const session = props.session
    const locale = ctx.locale.locale()
    const source = useSession(session)
    untrack(() => mount(root, ctx, source, locale))
  })
  return root
}
