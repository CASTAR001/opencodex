import test from 'node:test'
import assert from 'node:assert/strict'
import {promptRow,mergePrompts,historyIndex} from '../src/model.js'

const user = (id,text,time=1) => ({id,type:'user',text,time:{created:time}})
test('typed text, display text, and attachment-only prompts',()=>{
  assert.equal(promptRow(user('a','a\n b')).label,'a b')
  assert.equal(promptRow({...user('b','wire wrapper'),metadata:{displayText:'显示的原文',comments:[]}}).label,'显示的原文')
  assert.equal(promptRow({...user('c',''),files:[{name:'岸线.md'}]}).label,'岸线.md')
  assert.equal(promptRow({type:'assistant',id:'d'}),undefined)
})
test('merge by ID; keep identical questions and steers, filter queued and reverted rows',()=>{
  const rows = ['01','02','03','04','05'].map(id=>promptRow(user(id,'继续')))
  const recent = [{...rows[1],label:'追加'},rows[0]]
  assert.deepEqual(mergePrompts(rows,recent,['04'],'05').map(r=>[r.id,r.label]),[
    ['01','继续'],['02','追加'],['03','继续']])
})
test('user-only history follows cursors with cancellation; duplicate cursors fail visibly',async()=>{
  const rows=Array.from({length:211},(_,i)=>user(String(i),'prompt'))
  const opts=[]
  const client={message:{list:async (query,{signal})=>{
    opts.push(query)
    signal.throwIfAborted()
    return query.cursor ? {data:rows.slice(200),cursor:{}} : {data:rows.slice(0,200),cursor:{next:'next'}}
  }}}
  assert.equal((await historyIndex(client,'s',new AbortController().signal)).length,211)
  assert.deepEqual(opts.map(q=>q.type),['user','user'])
  await assert.rejects(historyIndex(client,'s',AbortSignal.abort()))
  await assert.rejects(historyIndex({message:{list:async()=>({data:[],cursor:{next:'same'}})}},'s',new AbortController().signal),/Repeated/)
})
