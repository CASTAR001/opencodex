// Regions are fixed destinations. A custom inference proxy never becomes a quota endpoint.
const routes = {
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
export function routeFor(id, base) {
  let host = Object.hasOwn(defaults, id) ? defaults[id] : undefined
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
function percent(value) {
  const n = numeric(value)
  if (n != null && n >= 0 && n <= 100) return n
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
  const source = body.data?.quota ?? body
  const keys = {
    limit5h: '5 小时',
    limit7d: '7 天',
    limitMonthTotal: '月度',
    limitMonthCode: '月度代码',
    limit_5h: '5 小时',
    limit_7d: '7 天',
    limit_month_total: '月度',
    limit_month_code: '月度代码',
  }
  const result = new Map()
  for (const [id, item] of Object.entries(source.usages || {})) {
    const ratio = numeric(item?.usedRatio ?? item?.used_ratio)
    if (Object.hasOwn(keys, id) && ratio != null && ratio >= 0 && ratio <= 1)
      result.set(keys[id], windowRow(keys[id], (1 - ratio) * 100, date(item.resetAt ?? item.reset_time))[0])
  }
  for (const item of source.limits || []) {
    const w = item.window,
      d = item.detail
    if (!w || !d) continue
    const total = numeric(d.limit),
      used = numeric(d.used),
      left = numeric(d.remaining)
    if (!(total > 0) || (left == null && used == null)) continue
    const n = percent(((left ?? total - used) / total) * 100)
    if (n == null) continue
    const label =
      w.duration == 300 && /MINUTE/i.test(w.timeUnit)
        ? '5 小时'
        : w.duration == 7 && /DAY/i.test(w.timeUnit)
          ? '7 天'
          : String(w.duration) + ' ' + String(w.timeUnit || '').replace('TIME_UNIT_', '')
    // Two generations of this endpoint can disagree. Never silently pick the greater balance.
    const previous = result.get(label)
    if (previous && Math.abs(previous.remaining - n) > 0.1) {
      result.delete(label)
      continue
    }
    result.set(label, windowRow(label, n, date(d.resetTime))[0])
  }
  return [...result.values()]
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
  if (route.kind === 'glm')
    return (body.data?.limits || []).flatMap((item) => {
      const used = percent(item.percentage)
      const type = { TOKENS_LIMIT: '模型用量', TIME_LIMIT: '工具调用', CREDIT_LIMIT: '点数' }[item.type]
      if (!type || used == null) return []
      const unit = { 3: '小时', 4: '天', 5: '月', 6: '周' }[item.unit]
      return windowRow(
        type + (unit && item.number ? ' · ' + item.number + ' ' + unit : ''),
        100 - used,
        date(item.nextResetTime),
      )
    })
  if (route.kind === 'mini')
    return (body.model_remains || []).flatMap((m) =>
      ['interval', 'weekly'].flatMap((period) => {
        const prefix = 'current_' + period + '_'
        const total = numeric(m[prefix + 'total_count']),
          raw = numeric(m[prefix + 'usage_count'])
        const offset = numeric(m[period === 'weekly' ? 'weekly_remains_time' : 'remains_time'])
        let remaining = percent(m[prefix + 'remaining_percent'])
        if (remaining == null && total > 0 && raw != null && raw >= 0 && raw <= total)
          remaining = (100 * (route.region === 'CN' ? total - raw : raw)) / total
        return windowRow(
          String(m.model_name || '套餐') + ' · ' + (period === 'weekly' ? '周窗口' : '周期窗口'),
          remaining,
          offset >= 0 ? date(now + offset) : undefined,
        )
      }),
    )
  return []
}
