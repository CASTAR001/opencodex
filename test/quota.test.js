import test from 'node:test'
import assert from 'node:assert/strict'
import { parseQuota, routeFor } from '../src/providers.js'
import { quotaService } from '../src/accounts.js'
import { mediaKind, observeMedia, officialMiniMcp, mediaTotals } from '../src/media.js'
const now = Date.UTC(2026, 10, 19)
test('balance and plan routes distinguish official regions, custom hosts and zero', () => {
  const ds = routeFor('custom', 'https://api.deepseek.com/v1')
  assert.equal(routeFor('deepseek', 'https://api.deepseek.com.attacker.test'), undefined)
  assert.equal(routeFor('deepseek', 'https://api.deepseek.com:444'), undefined)
  assert.equal(routeFor('kimi-for-coding', 'https://api.kimi.com/not-coding'), undefined)
  assert.equal(routeFor('__proto__'), undefined)
  assert.deepEqual(
    parseQuota(
      ds,
      {
        balance_infos: [
          { currency: 'CNY', total_balance: '0.00' },
          { currency: 'USD', total_balance: '1.50' },
        ],
      },
      now,
    ).map((x) => x.remaining),
    [0, 1.5],
  )
  assert.equal(
    parseQuota(routeFor('moonshotai-cn'), { data: { available_balance: '0' } }, now)[0].unit,
    'CNY',
  )
  assert.equal(
    parseQuota(routeFor('moonshotai'), { data: { available_balance: '-1.2' } }, now)[0].remaining,
    -1.2,
  )
  for (const v of [null, '', false, {}, Infinity])
    assert.deepEqual(parseQuota(ds, { balance_infos: [{ currency: 'CNY', total_balance: v }] }, now), [])
})
test('Kimi Code ratios and legacy windows preserve uncertainty and timestamps', () => {
  const route = routeFor('kimi-for-coding')
  assert.equal(
    parseQuota(
      route,
      { data: { quota: { usages: { limit5h: { usedRatio: 0.25, resetAt: '2026-11-19T14:00:00Z' } } } } },
      now,
    )[0].remaining,
    75,
  )
  assert.deepEqual(
    parseQuota(
      route,
      {
        usages: { limit5h: { usedRatio: 0 } },
        limits: [
          {
            window: { duration: 300, timeUnit: 'TIME_UNIT_MINUTE' },
            detail: { limit: '100', used: '100' },
          },
        ],
      },
      now,
    ),
    [],
  )
  assert.equal(
    parseQuota(
      route,
      {
        limits: [
          { window: { duration: 7, timeUnit: 'TIME_UNIT_DAY' }, detail: { limit: 20, remaining: 0 } },
        ],
      },
      now,
    )[0].remaining,
    0,
  )
})
test('GLM and MiniMax window meanings and units', () => {
  assert.equal(
    parseQuota(
      routeFor('zhipuai'),
      { code: 200, data: { limits: [{ type: 'TOKENS_LIMIT', percentage: 100, nextResetTime: now }] } },
      now,
    )[0].remaining,
    0,
  )
  const mini = {
    base_resp: { status_code: 0 },
    model_remains: [
      {
        model_name: 'Model',
        current_interval_total_count: 40,
        current_interval_usage_count: 10,
        remains_time: 5000,
        current_weekly_remaining_percent: 0,
        weekly_remains_time: 10000,
      },
    ],
  }
  const cn = parseQuota(routeFor('minimax-cn'), mini, now),
    intl = parseQuota(routeFor('minimax'), mini, now)
  assert.equal(cn[0].remaining, 75)
  assert.equal(intl[0].remaining, 25)
  assert.equal(cn[1].remaining, 0)
  assert.equal(cn[1].reset, now + 10000)
  assert.deepEqual(parseQuota(routeFor('minimax'), { ...mini, base_resp: { status_code: 1 } }, now), [])
})
test('manual-only API keys, no OAuth resolution, no cross-host fallback, no secrets returned', async () => {
  let calls = 0,
    lookups = 0,
    credentials = 0
  const ctx = {
    provider: {
      list: async () => {
        lookups++
        return {
          data: [
            { id: 'ds-alias', settings: { baseURL: 'https://api.deepseek.com', apiKey: 'synthetic' } },
            { id: 'ds-other', settings: { baseURL: 'https://api.deepseek.com' } },
            { id: 'deepseek', settings: { baseURL: 'https://local.test', apiKey: 'wrong' } },
          ],
        }
      },
    },
    integration: {
      connection: {
        active: async () => ({ type: 'credential', method: 'oauth' }),
        resolve: async () => {
          credentials++
        },
      },
    },
  }
  const fn = quotaService(
    ctx,
    () => [],
    async (url, opts) => {
      calls++
      assert.equal(url, 'https://api.deepseek.com/user/balance')
      assert.equal(opts.headers.Authorization, 'Bearer synthetic')
      assert.equal(opts.redirect, 'error')
      return Response.json({ balance_infos: [{ currency: 'USD', total_balance: 0 }] })
    },
    () => now,
  )
  assert.equal(calls, 0)
  await fn('qwen')
  await fn('mimo')
  assert.equal(lookups, 0)
  const [first, second] = await Promise.all([fn('deepseek'), fn('deepseek')])
  assert.equal(calls, 1)
  assert.equal(credentials, 0)
  assert.equal(first[0].values[0].remaining, 0)
  assert.equal(second[1].values, undefined)
  assert.ok(!JSON.stringify(first).includes('synthetic'))
})
test('manual retry respects 429 and never retries automatically', async () => {
  let t = now,
    calls = 0
  const fn = quotaService(
    { provider: { list: async () => ({ data: [] }) } },
    () => [{ route: routeFor('minimax'), source: 'MCP', key: () => 'synthetic' }],
    async () => {
      calls++
      return new Response('', { status: 429, headers: { 'retry-after': '60' } })
    },
    () => t,
  )
  assert.match((await fn('minimax'))[0].problem, /限流/)
  t += 50000
  await fn('minimax')
  assert.equal(calls, 1)
  t += 11000
  await fn('minimax')
  assert.equal(calls, 2)
})
test('media records are idempotent, paginated, date-bound and contain no prompts or media', async () => {
  const data = new Map()
  const storage = {
    set: async (k, v) => data.set(k, v),
    scan: async ({ after }) => {
      const keys = [...data.keys()].sort().filter((k) => !after || k > after)
      return {
        entries: keys.slice(0, 1).map((key) => ({ key, value: data.get(key) })),
        next: keys.length > 1 ? keys[0] : undefined,
      }
    },
  }
  assert.ok(officialMiniMcp('studio', { type: 'local', command: ['uvx', 'minimax-mcp'] }))
  assert.equal(mediaKind('other_text_to_image'), undefined)
  const e = {
    sessionID: 's',
    id: 'a',
    tool: 'studio_text_to_image',
    status: 'completed',
    input: { secret: 'SAMPLE' },
    result: 'SAMPLE',
  }
  await observeMedia(storage, e, ['studio'], 10)
  await observeMedia(storage, e, ['studio'], 10)
  await observeMedia(storage, { ...e, id: 'b', tool: 'MiniMax-MCP_text_to_audio', status: 'error' }, [], 11)
  const all = await mediaTotals(storage, { from: 10, to: 12 })
  assert.deepEqual(all, [
    { kind: '生图', calls: 1, failed: 0 },
    { kind: '语音', calls: 1, failed: 1 },
  ])
  assert.equal((await mediaTotals(storage, { from: 11, to: 12 }))[0].calls, 0)
  assert.ok(!JSON.stringify([...data.values()]).includes('SAMPLE'))
})
test('shared regional keys require a deliberate choice of destination', async () => {
  const urls = []
  const service = quotaService(
    {
      provider: {
        list: async () => ({
          data: ['kimi-code-plan-cn', 'kimi-code-plan-global'].map((id) => ({
            id,
            settings: { apiKey: 'same' },
          })),
        }),
      },
    },
    () => [],
    async (url) => {
      urls.push(url)
      return Response.json({ data: { quota: { usages: { limit5h: { usedRatio: 0.2 } } } } })
    },
    () => now,
  )
  const both = await service('kimi')
  assert.equal(urls.length, 0)
  assert.ok(both.every((x) => x.select))
  assert.equal((await service('kimi', undefined, 'kimi-code-plan-cn'))[0].values[0].remaining, 80)
  assert.deepEqual(urls, ['https://api.kimi.com/coding/v1/usages'])
  await service('kimi', undefined, 'https://foreign.test')
  assert.equal(urls.length, 1)
})
test('active integration keys are resolved only when inline credentials are absent', async () => {
  let resolved = 0
  const ctx = {
    provider: {
      list: async () => ({
        data: [
          {
            id: 'account',
            integrationID: 'official-key',
            settings: { baseURL: 'https://open.bigmodel.cn/api/coding/paas/v4' },
          },
        ],
      }),
    },
    integration: {
      connection: {
        active: async (id) => {
          assert.equal(id, 'official-key')
          return { type: 'credential', method: 'key', id: 'one' }
        },
        resolve: async () => {
          resolved++
          return { type: 'key', key: 'test-key' }
        },
      },
    },
  }
  const read = quotaService(
    ctx,
    () => [],
    async (url, opts) => {
      assert.equal(opts.headers.Authorization, 'test-key')
      return new Response('', { status: 401 })
    },
    () => now,
  )
  assert.equal(resolved, 0)
  assert.match((await read('glm'))[0].problem, /Key/)
  assert.equal(resolved, 1)
})
test('server hook records a closed-dashboard MiniMax call and resolves the MCP account only on manual refresh', async () => {
  const { default: plugin } = await import('../src/server.js')
  const data = new Map(),
    handlers = {}
  let after
  const env = Proxy.revocable(
    { MINIMAX_API_HOST: 'https://api.minimaxi.com', MINIMAX_API_KEY: 'fake-only' },
    {},
  )
  const ctx = {
    storage: {
      set: async (k, v) => data.set(k, v),
      scan: async () => ({ entries: [...data].map(([key, value]) => ({ key, value })) }),
    },
    mcp: {
      transform: async (callback) => {
        callback({
          list: () => [['art', { type: 'local', command: ['uvx', 'minimax-mcp'], environment: env.proxy }]],
        })
        env.revoke()
      },
    },
    tool: {
      hook: async (name, callback) => {
        assert.equal(name, 'execute.after')
        after = callback
      },
    },
    provider: { list: async () => ({ data: [] }) },
    rpc: { register: async (_def, routes) => Object.assign(handlers, routes) },
  }
  const original = globalThis.fetch
  let count = 0
  globalThis.fetch = async (url) => {
    count++
    assert.equal(url, 'https://www.minimaxi.com/v1/token_plan/remains')
    return Response.json({
      model_remains: [{ model_name: 'speech', current_interval_remaining_percent: 90 }],
    })
  }
  try {
    await plugin.setup(ctx)
    await after({
      sessionID: 'local',
      id: 'inside-code-mode',
      tool: 'art.text_to_audio',
      status: 'completed',
    })
    const totals = await handlers.media({ from: 0, to: Date.now() + 10 })
    assert.equal(totals[1].calls, 1)
    assert.equal(count, 0)
    const [snapshot] = await handlers.refresh({ family: 'minimax' }, {})
    assert.equal(snapshot.values[0].remaining, 90)
    assert.equal(count, 1)
  } finally {
    globalThis.fetch = original
  }
})
