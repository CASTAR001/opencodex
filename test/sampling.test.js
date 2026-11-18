import test from 'node:test'
import assert from 'node:assert/strict'
import { Tiktoken } from 'js-tiktoken/lite'
import ranks from 'js-tiktoken/ranks/o200k_base'
import { sampleText, supportedModel } from '../src/sampling.js'

test('o200k_base agrees with the public OpenAI cookbook reference counts', () => {
  const encoder = new Tiktoken(ranks)
  for (const [text, count] of [['お誕生日おめでとう',8],['2 + 2 = 4',7],['antidisestablishmentarianism',6]]) {
    assert.equal(encoder.encode(text, [], []).length, count)
  }
})
test('stream estimates require a recognised provider and model and fresh append-only text', () => {
  assert.ok(supportedModel({ providerID:'openai', id:'gpt-4o-mini-2024-07-18' }))
  assert.ok(supportedModel({ providerID:'openai', id:'gpt-5.3-codex' }))
  assert.ok(!supportedModel({ providerID:'proxy', id:'gpt-4o' }))
  assert.ok(!supportedModel({ providerID:'openai', id:'custom' }))
  const first = sampleText(undefined, '已经生成', 1)
  assert.equal(first.delta, undefined)
  const append = sampleText(first.next, '已经生成一行', 1001)
  assert.equal(append.delta, '一行')
  assert.equal(append.elapsed, 1000)
  assert.equal(sampleText(first.next,'替换整段文字',1001).delta,undefined)
  assert.equal(sampleText(first.next,'已经生成一行',6001).delta,undefined)
  assert.equal(sampleText(first.next,'已经生成' + 'x'.repeat(3000),1001).delta,undefined)
})
