import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { historicalMedia, mimoUsage } from '../src/history.js'
import { inventory, mcpFamily } from '../src/inventory.js'

test('available services, plan and MCP recognition follow additions, removals and disabled state', () => {
  const original = [
    { id: 'my-mimo', settings: { baseURL: 'https://token-plan-cn.xiaomimimo.com/v1' } },
    { id: 'xiaomi-payg', settings: { baseURL: 'https://api.xiaomimimo.com/v1' } },
    { id: 'alias', canonical: 'kimi-for-coding' },
    { id: 'qwen', activation: 'disabled' },
    { id: 'gateway', name: 'Generic router' },
  ]
  const media = mcpFamily('studio', { type: 'local' }, true)
  const read = inventory(original, [{ name: 'studio', family: media }])
  assert.deepEqual(
    read.map((x) => x.family),
    ['kimi', 'mimo', 'minimax'],
  )
  assert.deepEqual(read[1].plans, ['my-mimo'])
  assert.deepEqual(inventory([], []), [])
  assert.equal(mcpFamily('minimax', { disabled: true }, true), undefined)
})
test('historical projections include nested media and price only recognized plan data', () => {
  const db = new DatabaseSync(':memory:')
  try {
    db.exec(`CREATE TABLE session_message(id,type,time_created,session_id,data);
      CREATE TABLE session_part(message_id,type,data);
      CREATE TABLE session_v2(id,fork_session_id,time_created);
      INSERT INTO session_v2 VALUES ('s',null,0),('fork','s',9999999999999);`)
    const insert = db.prepare("INSERT INTO session_message VALUES (?,'assistant',?,?,?)")
    const start = Date.UTC(2026, 10, 15),
      today = start + 86400000,
      to = today + 86400000
    const model = { providerID: 'plan', id: 'mimo-v2.6-flash' }
    const tokens = { input: 10, output: 1, reasoning: 2, cache: { read: 50, write: 1 } }
    const tool = (name, metadata, status = 'completed') => ({
      type: 'tool',
      name,
      state: { status, metadata },
    })
    const nested = tool('execute', {
      toolCalls: [
        { tool: 'minimax-media.text_to_audio', status: 'completed' },
        { tool: 'art.text_to_image', status: 'error' },
        { tool: 'other.text_to_audio', status: 'completed' },
        { tool: 'art.text_to_audio', status: 'running' },
      ],
    })
    const add = (id, at, model, content = [], session = 's') =>
      insert.run(id, at, session, JSON.stringify({ model, tokens, content }))
    add('offpeak', start + 16 * 3600000, model, [nested])
    add('peak', today + 15 * 3600000, model)
    add('forked', today, model, [nested], 'fork')
    add('different', today, { ...model, providerID: 'payg' })
    add('future', to, model, [nested])
    db.prepare("INSERT INTO session_part VALUES (?,'tool',?)").run(
      'peak',
      JSON.stringify(tool('art.text_to_image', {})),
    )
    const span = { from: start, today, to }
    assert.deepEqual(
      historicalMedia(db, span, ['art']).map((r) => [r.calls, r.failed]),
      [
        [2, 1],
        [1, 0],
      ],
    )
    const ratio = (1800 / 11_000_000_000) * 100
    let result = mimoUsage(db, span, ['plan'])
    assert.equal(result.today.percent, ratio)
    assert.equal(result.week.percent, ((1800 + 1440) / 11_000_000_000) * 100)
    assert.equal(result.week.partial, false)
    add('unpriced', start, { ...model, id: 'unpriced' })
    result = mimoUsage(db, span, ['plan'])
    assert.equal(result.week.partial, true)
    assert.equal(result.today.partial, false)
    assert.equal(mimoUsage(db, span, ['other']).week.percent, 0)
    assert.ok(mimoUsage(db, span, []).problem)
  } finally {
    db.close()
  }
})
