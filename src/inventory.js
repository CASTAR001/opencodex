import { families } from './contract.js'
import { routeFor } from './providers.js'

// Use whole name segments so that a router offering a vendor's model is not itself a vendor.
const patterns = {
  kimi: /(?:^|-)(?:kimi|moonshot(?:ai)?)(?:-|$)/,
  mimo: /(?:^|-)(?:xiaomi|mimo)(?:-|$)/,
  glm: /(?:^|-)(?:glm|zhipu(?:ai)?|bigmodel|zai)(?:-|$)/,
  deepseek: /(?:^|-)deepseek(?:-|$)/,
  minimax: /(?:^|-)mini-?max(?:-|$)/,
  qwen: /(?:^|-)(?:qwen|dashscope|alibaba|bailian)(?:-|$)/,
}
function byName(value) {
  const name = String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
  return Object.keys(patterns).find((family) => patterns[family].test(name))
}
function hostname(url) {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}
function byUrl(url) {
  const host = hostname(url)
  if (/(^|\.)xiaomimimo\.com$/.test(host)) return 'mimo'
  if (
    /^dashscope(?:-[a-z0-9-]+)?\.aliyuncs\.com$/.test(host) ||
    host === 'coding.dashscope.aliyuncs.com'
  )
    return 'qwen'
  return routeFor('', url)?.family
}
export function mcpFamily(name, config, officialMini) {
  if (config.disabled) return
  return officialMini ? 'minimax' : byUrl(config.url) || byName(name)
}
export function inventory(providers, servers) {
  const result = new Map()
  function add(family) {
    if (!result.has(family)) result.set(family, { family, providers: [], plans: [], mcp: [] })
    return result.get(family)
  }
  for (const p of providers) {
    if (p.activation === 'disabled') continue
    const url = p.settings?.baseURL
    const family = byUrl(url) || byName(p.canonical) || byName(p.id) || byName(p.name)
    if (!family) continue
    const item = add(family)
    item.providers.push(p.id)
    if (
      family === 'mimo' &&
      (url
        ? /^token-plan(?:-[a-z0-9-]+)?\.xiaomimimo\.com$/.test(hostname(url))
        : /(?:token|coding)[- ]?plan/i.test([p.id, p.name, p.canonical].join(' ')))
    )
      item.plans.push(p.id)
  }
  for (const { name, family } of servers) if (family) add(family).mcp.push(name)
  for (const row of result.values()) {
    row.providers.sort()
    row.plans.sort()
    row.mcp.sort()
  }
  return Object.keys(families)
    .filter((id) => result.has(id))
    .map((id) => result.get(id))
}
