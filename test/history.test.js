import test from 'node:test'
import assert from 'node:assert/strict'
import { historyPrefix } from '../src/history.js'

const row = id => ({ id, type: 'user', time: { created: 1 }, content: ['private fixture text'] })
test('follows server cursors, de-duplicates overlap, and stops before the live suffix', async () => {
  const queries = []
  const client = { message: { list(query) {
    queries.push(query)
    return query.cursor ? { data: ['b','c','d'].map(row), cursor: { next: 'unneeded' } }
      : { data: ['a','b'].map(row), cursor: { next: 'page2' } }
  } } }
  const rows = await historyPrefix(client, 's', 'd', new AbortController().signal)
  assert.deepEqual(rows.map(x => x.id), ['a','b','c'])
  assert.ok(rows.every(x => !('content' in x)))
  assert.equal(queries.length, 2)
  assert.equal(queries[0].order, 'asc')
  assert.equal(queries[1].cursor, 'page2')
})
test('cancelled responses, unknown boundary and stuck cursor never produce complete totals', async () => {
  const abort = new AbortController()
  const cancelled = { message: { list() { abort.abort(); return { data: [], cursor: {} } } } }
  await assert.rejects(historyPrefix(cancelled, 'other-server', 'b', abort.signal), { name: 'AbortError' })
  const signal = new AbortController().signal
  const pages = next => ({ message: { list: () => ({ data: [], cursor: { next } }) } })
  await assert.rejects(historyPrefix(pages(), 's', 'missing', signal), /changed/)
  await assert.rejects(historyPrefix(pages('same'), 's', 'missing', signal), /Repeated/)
})
