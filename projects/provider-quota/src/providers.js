// Regions are fixed destinations. A custom inference proxy never becomes a quota endpoint.
const routes = {
  'token-plan-cn.xiaomimimo.com': ['mimo', 'mimo-plan', 'https://token-plan-cn.xiaomimimo.com/v1/platform/token_plan'],
  'api.deepseek.com': ['deepseek', 'balance', 'https://api.deepseek.com/user/balance'],
  'api.moonshot.cn': ['kimi', 'moon', 'https://api.moonshot.cn/v1/users/me/balance', 'CNY'],
  'api.moonshot.ai': ['kimi', 'moon', 'https://api.moonshot.ai/v1/users/me/balance', 'USD'],
  'api.kimi.com': ['kimi', 'coding', 'https://api.kimi.com/coding/v1/usages'],
  'api.kimi.ai': ['kimi', 'coding', 'https://api.kimi.ai/coding/v1/usages'],
  'open.bigmodel.cn': ['glm', 'glm', 'https://open.bigmodel.cn/api/monitor/usage/quota/limit'],
  'api.z.ai': ['glm', 'glm', 'https://api.z.ai/api/monitor/usage/quota/limit'],
  'api.minimaxi.com': ['minimax', 'mini', 'https://www.minimaxi.com/v1/token_plan/remains', 'CN'],
  'api.minimax.io': ['minimax', 'mini', 'https://www.minimax.io/v1/token_plan/remains', 'INTL'],
  'api.minimaxi.chat': ['minimax', 'mini', 'https://www.minimaxi.com/v1/token_plan/remains', 'CN'],
  'api.minimax.chat': ['minimax', 'mini', 'https://www.minimax.io/v1/token_plan/remains', 'INTL'],
}
const defaults = {
  'xiaomi-token-plan-cn': 'token-plan-cn.xiaomimimo.com',
  deepseek: 'api.deepseek.com',
  moonshotai: 'api.moonshot.ai',
  'moonshotai-cn': 'api.moonshot.cn',
  'kimi-for-coding': 'api.kimi.com',
  'kimi-code-plan-cn': 'api.kimi.com',
  'kimi-code-plan-global': 'api.kimi.ai',
  zhipuai: 'open.bigmodel.cn',
  'zhipuai-coding-plan': 'open.bigmodel.cn',
  zai: 'api.z.ai',
  'zai-coding-plan': 'api.z.ai',
  minimax: 'api.minimax.io',
  'minimax-cn': 'api.minimaxi.com',
  'minimax-coding-plan': 'api.minimax.io',
  'minimax-cn-coding-plan': 'api.minimaxi.com',
}
export function routeFor(id, base, canonical) {
  const provider = canonical === 'xiaomi-token-plan-cn' ? canonical : id
  let host = Object.hasOwn(defaults, provider) ? defaults[provider] : undefined
  if (base != null && base !== '') {
    let url
    try {
      url = new URL(base)
    } catch {
      return
    }
    if (url.protocol !== 'https:' || url.port || url.username || url.password) return
    host = url.hostname
    if ((host === 'api.kimi.com' || host === 'api.kimi.ai') && !/^\/coding(?:\/|$)/.test(url.pathname))
      return
  }
  if (!Object.hasOwn(routes, host)) return
  const [family, kind, endpoint, region] = routes[host]
  return { family, kind, endpoint, region, host }
}
function numeric(value) {
  if (typeof value !== 'number' && (typeof value !== 'string' || !/^-?\d+(\.\d+)?$/.test(value))) return
  const n = Number(value)
  if (Number.isFinite(n)) return n
}
function date(value) {
  if (!value) return
  const ms = typeof value === 'string' && !/^\d+$/.test(value) ? Date.parse(value) : Number(value)
  if (Number.isFinite(ms) && ms >= 1e12 && ms < 9e12) return ms
}
function windowRow(label, remaining, resets, unit = '%') {
  if (remaining == null || !Number.isFinite(remaining)) return []
  return [{ label, remaining, unit, ...(resets && { reset: resets }) }]
}
function kimiWindows(body) {
  const source = body.data?.quota ?? body.data ?? body
  const names = {
    limit5h: '5 小时', limit7d: '7 天', limitMonthTotal: '月度', limitMonthCode: '月度代码',
    monthTotal: '月度', monthCode: '月度代码',
    limit_5h: '5 小时', limit_7d: '7 天', limit_month_total: '月度', limit_month_code: '月度代码',
  }
  const rows = new Map()
  for (const [key, item] of Object.entries(source.usages ?? body.usages ?? {})) {
    if (!Object.hasOwn(names, key)) continue
    const label = names[key]
    const ratio = numeric(item?.usedRatio ?? item?.used_ratio)
    const reset = date(item?.resetAt ?? item?.reset_at ?? item?.reset_time)
    rows.set(label, ratio != null
      ? { label, used: Number((ratio * 100).toPrecision(15)), unit: '%', reset }
      : { label, state: '未返回读数', reset })
  }
  function detail(label, data) {
    if (!data) return
    const total = numeric(data.limit)
    const remaining = numeric(data.remaining)
    const used = numeric(data.used)
    const previous = rows.get(label)
    const reset = date(data.resetTime ?? data.reset_time) ?? previous?.reset
    if (remaining != null || used != null) {
      rows.set(label, {label, remaining, used, total, reset})
    } else if (!previous && reset) {
      rows.set(label, {label, state:'未返回读数', reset})
    }
  }
  detail('7 天', source.usage ?? body.usage)
  const limits = source.limits ?? body.limits
  for (const item of Array.isArray(limits) ? limits : []) {
    const w = item?.window
    const unit = String(w?.timeUnit ?? w?.time_unit ?? '').replace(/^TIME_UNIT_/i,'').toUpperCase()
    const duration = numeric(w?.duration)
    if (!(duration > 0) || !unit) continue
    const hours = duration * ({ MINUTE: 1/60, HOUR: 1, DAY: 24, WEEK: 168 }[unit] ?? 0)
    const label = hours === 5 ? '5 小时' : hours === 168 ? '7 天' : duration + ' ' + unit
    detail(label, item.detail)
  }
  if (!rows.size) return []
  return ['5 小时','7 天', ...[...rows.keys()].filter(k => k !== '5 小时' && k !== '7 天')]
    .map(label => rows.get(label) ?? { label, state: '接口未返回此窗口' })
}

function miniWindows(model, now) {
  if (!model || typeof model !== 'object') return []
  const name = String(model.model_name || '套餐')
  return ['interval','weekly'].map(period => {
    const weekly = period === 'weekly'
    const prefix = 'current_' + period + '_'
    const start = date(model[weekly ? 'weekly_start_time' : 'start_time'])
    const end = date(model[weekly ? 'weekly_end_time' : 'end_time'])
    const hours = (end - start) / 3600000
    const duration = Number.isInteger(hours) && hours > 0
      ? (hours % 24 === 0 ? hours / 24 + ' 天' : hours + ' 小时') : '周期窗口'
    const label = name + ' · ' + (weekly ? '周窗口' : duration)
    const offset = numeric(model[weekly ? 'weekly_remains_time' : 'remains_time'])
    const reset = end ?? (offset >= 0 ? date(now + offset) : undefined)
    const remaining = numeric(model[prefix + 'remaining_percent'])
    const count = numeric(model[prefix + 'usage_count'])
    const total = numeric(model[prefix + 'total_count'])
    const status = numeric(model[prefix + 'status'])
    return { label, remaining, unit: '%', count, total, reset,
      state: remaining == null && count == null ? (status == null ? '未返回读数' : '状态 ' + status) : undefined }
  })
}
export function parseQuota(route, body, now) {
  if (
    !body ||
    typeof body !== 'object' ||
    body.base_resp?.status_code > 0 ||
    body.status === false ||
    body.success === false ||
    (body.code != null && ![0, 200, '0', '200'].includes(body.code))
  )
    return []
  if (route.kind === 'balance')
    return (body.balance_infos || []).flatMap((b) =>
      typeof b.currency === 'string' && /^[A-Z]{3}$/.test(b.currency)
        ? windowRow('可用余额', numeric(b.total_balance), null, b.currency)
        : [],
    )
  if (route.kind === 'moon')
    return windowRow('可用余额', numeric(body.data?.available_balance), null, route.region)
  if (route.kind === 'coding') return kimiWindows(body)
  if (route.kind === 'mimo-plan') {
    const remaining = numeric(body.quota?.remaining_credits)
    if (remaining == null) return []
    // The provider's timezone-less "YYYY-MM-DD HH:mm:ss" is specified in UTC.
    const end = body.period?.end_at
    const endsAt = typeof end === 'string'
      ? date(end.replace(/^(\d{4}-\d\d-\d\d)[ T](\d\d:\d\d:\d\d)$/, '$1T$2Z')) : undefined
    return [{ label: '本期', remaining, total: numeric(body.quota?.total_credits), unit: 'Credits', endsAt }]
  }
  if (route.kind === 'glm')
    return (body.data?.limits || []).flatMap((item) => {
      const used = numeric(item.percentage)
      const type = { TOKENS_LIMIT: '模型用量', TIME_LIMIT: '工具调用', CREDIT_LIMIT: '点数' }[item.type]
      if (!type || used == null) return []
      const unit = { 3: '小时', 4: '天', 5: '月', 6: '周' }[item.unit]
      return [{ label: type + (unit && item.number ? ' · ' + item.number + ' ' + unit : ''),
        used, unit: '%', reset: date(item.nextResetTime) }]
    })
  if (route.kind === 'mini')
    return Array.isArray(body.model_remains) ? body.model_remains.flatMap(model => miniWindows(model, now)) : []
  return []
}
