import { createHash } from 'node:crypto'
import { routeFor, parseQuota } from './providers.js'
import { unavailable } from './contract.js'
const reasons = {
  401: 'Key 无效或不适用于此账户接口',
  403: '该 Key 没有额度查询权限',
  429: '服务商限流，请稍后手动重试',
}
function apiKey(value) {
  return typeof value === 'string' &&
    value.length &&
    !/[\r\n]/.test(value) &&
    !value.startsWith('{') &&
    !value.startsWith('$')
    ? value
    : undefined
}
async function providerKey(ctx, p) {
  const inline = apiKey(p.settings?.apiKey)
  if (inline) return inline
  const header = Object.entries(p.headers || {}).find(([name]) =>
    /^authorization$|^x-api-key$|^api-key$/i.test(name),
  )?.[1]
  if (header) return apiKey(header.replace(/^Bearer\s+/i, ''))
  const conn = await ctx.integration.connection.active(p.integrationID ?? p.id)
  if (!conn || (conn.type === 'credential' && conn.method !== 'key')) return
  const value = await ctx.integration.connection.resolve(conn)
  if (value?.type === 'key') return apiKey(value.key)
}
export function quotaService(ctx, mcpAccounts, request = fetch, clock = Date.now) {
  const pending = new Map(),
    cooldown = new Map()
  async function read(account, key, signal) {
    const { route } = account
    if (!key) return { problem: '未找到可用的 API Key' }
    if (route.kind === 'mimo-plan' && !key.startsWith('tp-'))
      return { problem: '请使用 MiMo 个人 Token Plan 专属密钥（tp-）。' }
    const id = route.endpoint + ' ' + createHash('sha256').update(key).digest('hex')
    if (pending.has(id)) return pending.get(id)
    const recent = cooldown.get(id)
    if (recent > clock())
      return {
        problem: '请在 ' + new Date(recent).toLocaleTimeString() + ' 后再手动刷新',
      }
    const promise = (async () => {
      const at = clock()
      cooldown.delete(id)
      try {
        const timeout = AbortSignal.timeout(8000)
        const res = await request(route.endpoint, {
          method: 'GET',
          headers: {
            Authorization: route.kind === 'glm' ? key : 'Bearer ' + key,
            Accept: 'application/json',
          },
          redirect: 'error',
          signal: signal ? AbortSignal.any([timeout, signal]) : timeout,
        })
        if (!res.ok) {
          if (res.status === 429) {
            const hint = res.headers.get('retry-after'),
              delay = hint && /^\d+$/.test(hint) ? at + Number(hint) * 1000 : Date.parse(hint)
            cooldown.set(id, Math.max(at + 5000, Number.isFinite(delay) ? delay : at + 60000))
          }
          return { at, problem: reasons[res.status] || '额度接口返回 HTTP ' + res.status }
        }
        const values = parseQuota(route, await res.json(), at).map(row =>
          // OpenCode validates the result before JSON serialization, including optional fields.
          Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)),
        )
        return values.length ? { at, values } : { at, problem: '接口未返回余额或套餐窗口' }
      } catch {
        return { at, problem: '额度查询未完成，请稍后手动重试' }
      }
    })()
    pending.set(id, promise)
    try {
      return await promise
    } finally {
      pending.delete(id)
    }
  }
  return async (family, signal, source) => {
    if (Object.hasOwn(unavailable, family)) return [{ problem: unavailable[family] }]
    const { data } = await ctx.provider.list()
    const accounts = []
    for (const p of data) {
      const route = routeFor(p.id, p.settings?.baseURL, p.canonical)
      if (route?.family === family && p.activation !== 'disabled')
        accounts.push({ route, source: p.id, key: () => providerKey(ctx, p) })
    }
    if (family === 'minimax') accounts.push(...mcpAccounts())
    const selected = source ? accounts.filter((a) => a.source === source) : accounts
    if (!selected.length) return [{ problem: family === 'mimo'
      ? '当前工作区没有可查询的 MiMo 中国区个人 Token Plan 连接。'
      : '当前工作区没有可用于该额度接口的官方 API 连接' }]
    const resolved = await Promise.all(
      selected.map(async (account) => {
        let key
        try {
          key = apiKey(await account.key())
        } catch {
          /* This connection cannot supply a key. */
        }
        return { account, key }
      }),
    )
    return Promise.all(
      resolved.map(({ account, key }) => {
        const ambiguous =
          key &&
          resolved.some(
            (other) => other.key === key && other.account.route.endpoint !== account.route.endpoint,
          )
        if (ambiguous)
          return {
            source: account.source,
            select: true,
            problem: '同一 Key 对应多个站点，请选择实际使用的连接。',
          }
        return read(account, key, signal)
      }),
    )
  }
}
