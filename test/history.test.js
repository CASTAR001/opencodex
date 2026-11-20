import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { historicalMedia } from '../src/history.js'
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
test('historical media counts include nested calls and exclude forks and out-of-range records', () => {
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
    const add = (id, at, content, session = 's') =>
      insert.run(id, at, session, JSON.stringify({ content }))
    add('nested', start, [nested])
    add('direct', today, [])
    add('forked', today, [nested], 'fork')
    add('future', to, [nested])
    db.prepare("INSERT INTO session_part VALUES (?,'tool',?)").run(
      'direct',
      JSON.stringify(tool('art.text_to_image', {})),
    )
    const span = { from: start, to }
    assert.deepEqual(
      historicalMedia(db, span, ['art']).map((r) => [r.calls, r.failed]),
      [
        [2, 1],
        [1, 0],
      ],
    )
  } finally {
    db.close()
  }
})
