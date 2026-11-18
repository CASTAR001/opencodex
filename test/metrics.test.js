import test from 'node:test'
import assert from 'node:assert/strict'
import { measurement, mergeHistory, summarize } from '../src/metrics.js'

const prompt = { type: 'user', id: 'u', created: 0 }
const idle = { type: 'idle', id: 'i', created: 10000 }
export function step(id, created, ms, counts, model = 'p/a') {
  const [input, read, write, output, reasoning] = counts
  return { id, type: 'assistant', created, first: created + 100, streamed: created + 100 + ms,
    ended: true, model, usage: { input, read, write, output, reasoning } }
}
const a = step('a', 10, 2000, [20, 70, 10, 100, 20])
const b = step('b', 9000, 1000, [200, 0, 0, 20, 10], 'q/b')

test('aggregate token-weighted hits and duration-weighted visible plus reasoning TPS', () => {
  const r = summarize([prompt, a, b, idle])
  assert.equal(r.hit, 70 / 300)
  assert.equal(r.speed.tps, 50)
  assert.equal(r.speed.includesWait, false)
  assert.deepEqual(r.models, ['p/a', 'q/b'])
  assert.equal(r.totals.output, 120)
})
test('filters use a half-open time range and never report half a turn as its speed', () => {
  assert.equal(summarize([prompt, a, b, idle], { model: a.model }).speed, undefined)
  const r = summarize([prompt, a, b, idle], { since: b.created, until: b.created + 1 })
  assert.equal(r.hit, 0)
  assert.equal(r.speed, undefined)
  assert.equal(summarize([prompt, a], { until: a.created }).counted, 0)
})
test('zero, missing, interrupted and unattributed compaction usage', () => {
  const failed = measurement({ id: 'f', type: 'assistant', error: {}, time: { created: 1 } })
  const compaction = measurement({ id: 'c', type: 'compaction', status: 'completed', time: { created: 2 },
    tokens: { input: 0, cache: { read: 0, write: 0 }, output: 8, reasoning: 2 } })
  const r = summarize([failed, compaction])
  assert.equal(r.missing, 1)
  assert.equal(r.models[0], '?')
  assert.equal(r.compactionTokens, 10)
  assert.equal(r.hit, undefined)
  assert.equal(r.speed, undefined)
})
test('modern idle boundary groups steered prompts; legacy history and first-token fallback', () => {
  const legacy = [{ ...a, first: undefined }]
  assert.equal(summarize(legacy).speed.includesWait, true)
  assert.equal(summarize([a, prompt, b]).speed.tps, 30)
  assert.equal(summarize([prompt, a, { ...prompt, id: 'steer' }, b, idle]).speed.tps, 50)
  assert.equal(summarize([a, { ...b, usage: undefined }, idle]).speed, undefined)
  assert.equal(summarize([a, { ...b, streamed: undefined }, idle]).speed, undefined)
  assert.equal(summarize([a], { complete: false }).speed, undefined)
  const running = summarize([a, idle, prompt, { ...b, ended: false, usage: undefined }], { running: true })
  assert.equal(running.speed.tps, 60)
  assert.equal(running.previous, true)
})
test('a retry snapshot is replaced, replay and truncated live suffix do not resurrect rows', () => {
  assert.deepEqual(mergeHistory([prompt, a, b], [a, a]), [prompt, a])
  const updated = { ...a, usage: b.usage }
  assert.deepEqual(mergeHistory([prompt, a], [updated]), [prompt, updated])
})
