import { createEffect } from 'solid-js'

export function header(ctx, input, useSession, open) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'ocx-metrics-header'
  const label = document.createElement('span')
  const hit = document.createElement('strong')
  const speed = document.createElement('span')
  const windowUsage = document.createElement('span')
  button.append(label, hit, speed, windowUsage)
  button.onclick = () => open(input.session)

  createEffect(() => {
    button.hidden = !input.active || input.compact
  })
  createEffect(() => {
    if (!input.active) return
    const source = useSession(input.session)
    const locale = ctx.locale.locale()
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 })
    const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 })
    createEffect(() => {
      const { hit: ratio, speed: turn, previous, missing } = source.overall()
      const estimate = source.estimate()
      const context = source.context()
      const coverage = source.coverage()
      const t = key => ctx.t(key)
      const cache = ratio == null ? '—' : percent.format(ratio)
      const rate = estimate?.tps ?? turn?.tps
      const value = (rate == null ? '—' : number.format(rate)) + ' TPS'
      const partial = coverage !== 'complete'
      label.textContent = t('cacheLabel')
      hit.textContent = cache + (partial && ratio != null ? '*' : '')
      speed.textContent = (estimate ? '≈' : previous && turn ? t('prevShort') + ' ' : '') + value
      const used = context?.percent == null ? '—' : percent.format(context.percent / 100)
      windowUsage.textContent = t('context') + ' ' + used
      const hint = [t('hit') + ' ' + cache, t(estimate ? 'estimated' : previous ? 'previous' : 'recent') + ' ' + value]
      hint.push(t('context') + ' ' + used + (context ? ' (' + number.format(context.used) + ' / ' + (context.limit > 0 ? number.format(context.limit) : '—') + ')' : ''))
      if (partial) hint.push(t(coverage))
      if (source.running()) hint.push(t('generating'))
      if (turn?.includesWait && !estimate) hint.push(t('wait'))
      if (missing) hint.push(t('missing') + ' · ' + missing)
      button.title = [t('title'), ...hint].join(' · ')
      button.setAttribute('aria-label', button.title)
    })
  })
  return button
}
