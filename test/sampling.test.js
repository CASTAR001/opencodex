import test from 'node:test'
import assert from 'node:assert/strict'
import { generatedLength, streamingSpeed } from '../src/sampling.js'

test('TUI character estimate uses first-token timing, 500 ms warmup and mixed UTF-16 text', () => {
  const text = '你好🌞abcd'
  assert.equal(streamingSpeed(text.length, 100, 1100, 1599), undefined)
  assert.equal(streamingSpeed(text.length, 100, 1100, 1600), 4)
  assert.equal(streamingSpeed(1, 100, undefined, 1100), 1)
  assert.equal(streamingSpeed(4, 100, 90, 1100), 1)
  assert.equal(streamingSpeed(0, 100, 200, 1100), undefined)
})
test('reasoning, text and streamed tool arguments count without execution results or replayed prefixes', () => {
  const parts = [{type:'reasoning', text:'12345'}, {type:'text', text:'abc'}]
  const tool = { type:'tool', id:'t', state:{status:'streaming',input:'xyz'} }
  const lengths = new Map()
  assert.equal(generatedLength([...parts,tool],lengths), 11)
  tool.state = {status:'completed',input:{},content:[{type:'text',text:'a'.repeat(5000)}]}
  assert.equal(generatedLength([...parts,tool],lengths), 11)
  assert.equal(generatedLength([...parts,tool],new Map()), 8)
})
