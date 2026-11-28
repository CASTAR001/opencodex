import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { callMailbox, exchangeAdapter } from '../src/exchange.js'

test('real Python bridge, offline question, independent conversations and unchanged user priority', async t => {
  const root = await mkdtemp(join(tmpdir(), '共享 workspace '))
  t.after(() => rm(root, { recursive: true, force: true }))
  const storage = new Map()
  let calls = 0
  const make = () => exchangeAdapter({ location: {directory: root}, storage }, (...args) => {
    calls++
    return callMailbox(...args)
  })
  let client = make()
  const invoke = async (id, args) => {
    const response = JSON.parse((await client.tool.execute(args, {sessionID: id})).content)
    assert.equal(response.ok, true, JSON.stringify(response))
    return response.data
  }
  for (const alias of ['主线','实现','审核']) await invoke(alias, {op:'join', task:'导出', alias})
  for (const peer of ['实现','审核']) {
    await invoke('主线', {op:'link', peer})
    await invoke(peer, {op:'link', peer:'主线', fields:['done']})
  }
  await client.checkpoint('实现', {done:['PDF 已验'], constraints:['私人注释'], next:['Word']})
  const sync = await invoke('审核', {op:'sync', peer:'主线'})
  await invoke('审核', {op:'publish', peer:'主线', kind:'question', key:'review-1', body:'Word 要先验收吗？',basis:{主线:sync.basis}})
  client = make()
  const latest = {role:'user', content:[{type:'text',text:'只做本地验收'}]}
  const resumed = {sessionID:'主线',messages:[latest]}
  await client.context(resumed)
  assert.equal(resumed.messages.length,2)
  assert.equal(resumed.messages.at(-1), latest)
  assert.ok(!JSON.stringify(resumed.messages).includes('Word'))
  const start = calls
  for(let step=0;step<100;step++) await client.context({sessionID:'主线',messages:[latest]})
  assert.equal(calls, start)
  await client.context({sessionID:'主线',messages:[latest]},'adopted-1')
  await client.context({sessionID:'主线',messages:[latest]},'adopted-1')
  assert.equal(calls,start+1)
  const state = await invoke('主线', {op:'sync'})
  assert.deepEqual(state.peers.map(p=>p.pending),[true,true])
  const page = await invoke('主线', {op:'sync', peer:'实现'})
  assert.deepEqual(JSON.parse(page.entries[0].body), {done:['PDF 已验']})
  await invoke('主线',{op:'ack',peer:'实现',seqs:page.entries.map(e=>e.seq),receipt:page.receipt})
  assert.equal((await invoke('主线', {op:'sync', peer:'实现'})).entries.length,0)
  assert.equal((await invoke('主线', {op:'sync', peer:'审核'})).entries[0].kind,'question')
  const denied = JSON.parse((await client.tool.execute({op:'sync', directory:root}, {sessionID:'主线'})).content)
  assert.equal(denied.ok,false)
})

test('packaged helper matches the pinned protocol reference', async () => {
  const source = new URL('../exchange/exchange.py', import.meta.url)
  const pin = JSON.parse(await readFile(new URL('./upstream.json', source), 'utf8'))
  assert.equal(createHash('sha256').update(await readFile(source)).digest('hex'), pin.sha256)
  assert.equal(pin.protocol, 1)
})
