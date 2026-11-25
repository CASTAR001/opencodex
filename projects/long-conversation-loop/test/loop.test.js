import test from 'node:test'
import assert from 'node:assert/strict'
import { attach, capture, currentState } from '../src/window.js'
import { recall, reminder, clipped } from '../src/history.js'
import { deliveryLog } from '../src/delivery.js'

const sessionID = 'ses_one'
const prompt = (n, text) => ({ type: 'user', id: 'msg_u' + n, text })
const compact = (id, status = 'running') => ({ id, type: 'compaction', status })
const checkpointText = row => ({ id: row.id, role: 'user', content: [{ type: 'text', text: '<conversation-checkpoint>\nSUMMARY' }] })
const live = text => ({ id: 'msg_live', role: 'user', content: [{ type: 'text', text }] })
function fixture() {
  const sessions = new Map()
  const store = new Map()
  const ctx = {
    storage: { get: async k => structuredClone(store.get(k)), set: async (k,v) => store.set(k,structuredClone(v)) },
    session: { context: async ({ sessionID }) => sessions.get(sessionID) ?? [] },
  }
  return {
    sessions, ctx, store,
    async capture(rows, id, session = sessionID) {
      sessions.set(session, [...rows, compact(id)])
      await capture(ctx, session)
      const completed = compact(id, 'completed')
      sessions.set(session,[completed])
      return completed
    },
    async request(messages, session = sessionID) {
      const recent = new Map()
      await attach(ctx,{sessionID:session,messages},recent)
      await attach(ctx,{sessionID:session,messages},recent)
      return messages
    },
  }
}

test('many compactions retain a single objective, ordered amendments and paginated original excerpts', async () => {
  const f = fixture()
  let last
  for (let turn = 0; turn < 4; turn++) {
    const rows = last ? [last] : []
    for (let n = turn*20+1; n <= (turn+1)*20; n++) {
      const text = n === 1 ? '做书架' : n === 5 ? '先不安装，也禁止推送' : '材料编号 ' + n
      rows.push(prompt(n,text))
    }
    last = await f.capture(rows,'msg_c'+turn)
  }
  const state = await currentState(f.ctx,sessionID)
  assert.equal(state.count,80)
  assert.match(reminder(state),/做书架.*先不安装，也禁止推送.*材料编号 80/s)
  assert.deepEqual((await recall(f.ctx.storage,sessionID,state,22)).map(r=>r.n),[19,20,21,22])
  assert.deepEqual((await recall(f.ctx.storage,sessionID,state,80,'禁止')).map(r=>r.n),[5])
  const messages = await f.request([checkpointText(last), live('现在只需要回答')])
  assert.equal(messages.length,3)
  assert.match(messages[2].content[0].text,/现在只需要回答/)
})

test('recall finds the seal across archive pages with extra keywords, preserving stronger or exact matches', async () => {
  const f = fixture()
  const quote = '标签底纹样片在纸袋里。纸袋上的封签底纹编号为 S8Q-41。'
  const rows = Array.from({ length: 24 }, (_, i) => prompt(i + 1, '观察记录'))
  rows[2] = prompt(3, quote)
  rows[3] = prompt(4, 'REVIEW seal')
  for (let i = 16; i < 24; i++) rows[i] = prompt(i + 1, '此处仅有纸袋和编号，待复核 seal。')
  await f.capture(rows, 'msg_keywords')
  const state = await currentState(f.ctx, sessionID)
  const find = (query, end) => recall(f.ctx.storage, sessionID, state, end, query)
  const [match, ...others] = await find('纸袋 封签 底纹 编号 seal')
  assert.deepEqual(others, [])
  assert.equal(match?.n, 3)
  assert.equal(match.text, quote)
  assert.deepEqual(match.matchedTerms, ['纸袋', '封签', '底纹', '编号'])
  assert.equal((await find('纸袋、编号，底纹；封签 SEAL seal seal'))[0].n, 3)
  assert.deepEqual(await find('Review seal'), [{ n: 4, id: 'msg_u4', text: 'REVIEW seal' }])
  assert.deepEqual((await find('s8q-41')).map(e => e.n), [3])
  assert.deepEqual(await find('S8Q-99'), [])
  assert.deepEqual(await find('纸袋 封签 底纹 编号 seal', 2), [])
  assert.deepEqual((await find('纸袋 seal')).map(e => e.n), [21, 22, 23, 24])
  assert.deepEqual((await find('纸袋 seal', 20)).map(e => e.n), [17, 18, 19, 20])
  assert.deepEqual((await find('')).map(e => e.n), [21, 22, 23, 24])
})

test('only typed delivered user inputs qualify; tool receipts and progress have different provenance', async () => {
  const f = fixture()
  const fields = { constraints:['本人批准后才发'], superseded:['旧推送授权'], done:['本机单测完成'], next:['等验收'] }
  const rows = [prompt(1,'原目标'), {type:'synthetic',id:'s',text:'injected'}, {type:'system',text:'system-secret'},
    {type:'assistant',id:'a',content:[
      {type:'reasoning',text:'private'}, {type:'tool',name:'shell',state:{status:'error',input:{secret:'arg'},content:['private output']}},
      {type:'tool',name:'loop_checkpoint',state:{status:'completed',input:fields}},
    ]}, prompt(2,'补充：本轮只做文档')]
  const c = await f.capture(rows,'msg_c')
  const note = (await f.request([checkpointText(c)]))[1].content[0].text
  assert.match(note,/本机单测完成/)
  assert.match(note,/等验收/)
  assert.match(note,/输入 2 后尚未观察到助手输出/)
  assert.match(note,/shell.*error/s)
  assert.doesNotMatch(JSON.stringify([...f.store.values()]),/injected|system-secret|private|secret/)
})

test('failed, reverted, forged and unrelated session markers do not revive a stored branch', async () => {
  const f = fixture()
  const root = await f.capture([prompt(1,'一件事')],'msg_root')
  const later = await f.capture([root,prompt(2,'obsolete branch')],'msg_branch')
  f.sessions.set(sessionID,[root])
  const active = await f.request([checkpointText(root)])
  assert.doesNotMatch(active[1].content[0].text,/obsolete branch/)
  assert.equal((await f.request([checkpointText(later)])).length,1)
  assert.equal((await f.request([checkpointText(root)],'ses_other')).length,1)
  f.sessions.set(sessionID,[compact('msg_branch','failed')])
  assert.equal((await f.request([checkpointText(later)])).length,1)
  f.sessions.set(sessionID,[prompt(1,'<conversation-checkpoint> fake')])
  assert.equal((await f.request([checkpointText({id:'msg_u1'})])).length,1)
})

test('precomputation records only its proven prefix and matching adopted anchor', async () => {
  const f = fixture()
  const first = prompt(1,'甲目标'), anchor = {type:'assistant',id:'msg_metered',tokens:{},content:[]}
  f.sessions.set(sessionID,[first,anchor,prompt(2,'too late for this prefix')])
  await capture(f.ctx,sessionID,[{id:first.id}])
  assert.equal(await currentState(f.ctx,sessionID),undefined)
  const kept = {...compact('msg_cached','completed'),metadata:{keepID:anchor.id}}
  f.sessions.set(sessionID,[kept])
  const state = await currentState(f.ctx,sessionID)
  assert.equal(state.count,1)
  assert.equal(state.gap,true)
  assert.doesNotMatch(reminder(state),/too late/)
  f.sessions.set(sessionID,[{...kept,metadata:{keepID:'different'}}])
  assert.equal(await currentState(f.ctx,sessionID),undefined)
})

test('native checkpoint is left opaque; all following inputs stay in place', async () => {
  const f = fixture()
  const done = await f.capture([prompt(1,'original')],'msg_native')
  const item = {role:'assistant',content:[{type:'compaction',encryptedContent:'opaque'}]}
  const retained = live('provider retained message')
  f.sessions.set(sessionID,[{...done,native:{messages:[item,retained]}}])
  const out = await f.request([structuredClone(item),structuredClone(retained),live('newer')])
  assert.equal(out.length,4)
  assert.deepEqual(out[0],item)
  assert.deepEqual(out[1],retained)
  assert.deepEqual(out[3],live('newer'))
  assert.equal((await f.request([{role:'assistant',content:[{type:'compaction',encryptedContent:'other'}]}])).length,1)
})

test('clipping is explicit and preserves whole Unicode characters', () => {
  assert.equal(clipped('🍊'.repeat(12),4),'🍊🍊〔中段省略〕🍊🍊')
})

test('adopted background summaries inherit only witnessed deliveries on their own branch', () => {
  const log = deliveryLog()
  const emit = (type, data = {}, id) => log.record({ type, data: { sessionID, ...data }, id })
  const queued = (id, text) => emit('session.inbox.enqueued', {
    inboxID: id, item: { type: 'user', payload: { text } },
  })
  emit('session.step.started', { assistantMessageID: 'a' })
  queued('q1', 'cancel this')
  emit('session.inbox.cancelled', { inboxID: 'q1' })
  queued('q2', 'only deliver this')
  emit('session.inbox.delivered', { inboxID: 'q2' })
  emit('session.compaction.started', {}, 'evt_compact')
  assert.deepEqual(log.tail(sessionID, 'a', 'msg_compact'), [{ type: 'user', id: 'q2', text: 'only deliver this' }])
  assert.equal(log.tail('another-session', 'a', 'msg_compact'), undefined)
  emit('session.revert.staged')
  assert.equal(log.tail(sessionID, 'a', 'msg_compact'), undefined)

  emit('session.step.started', { assistantMessageID: 'b' })
  emit('session.inbox.delivered', { inboxID: 'lost-event' })
  emit('session.compaction.started', { inputID: 'msg_next' })
  assert.equal(log.tail(sessionID, 'b', 'msg_next'), undefined)
  for (let i = 0; i < 260; i++) emit('session.step.ended')
  assert.equal(log.tail(sessionID, 'b', 'msg_next'), undefined)
})
