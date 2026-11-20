import test from 'node:test'
import assert from 'node:assert/strict'
import {displayPath,projectGroups,setFolderHidden} from '../src/model.js'

test('only the known home prefix is abbreviated, on a directory boundary',() => {
  for (const [path,home,want] of [
    ['/Users/demo','/Users/demo','~'],['/Users/demo/work','/Users/demo/','~/work'],
    ['/Users/demo2/work','/Users/demo','/Users/demo2/work'],['/Volumes/Data/demo','/Users/demo','/Volumes/Data/demo'],
    ['/Users/demo/work',undefined,'/Users/demo/work'],['/tmp','/','/tmp'],
    ['C:\\Users\\Demo\\work','c:\\users\\demo','~\\work'],
  ]) assert.equal(displayPath(path,home),want)
})
const row = (id,projectID,path,fields={}) => ({id,projectID,title:id,location:{directory:path},time:{updated:0},...fields})
test('uses canonical repo paths, keeps same-name and cross-server groups distinct',() => {
  const source = {id:'local',name:'Local',home:'/users/demo',projects:[{id:'a',canonical:'/users/demo/work/tree'},
    {id:'b',canonical:'/archive/tree'},{id:'global',canonical:'/'},{id:'empty',canonical:'/empty'}],
    known:[row('1','a','/worktrees/fix'),row('2','b','/archive/tree'),row('3','global','/notes')],history:[]}
  const groups = projectGroups([source,{...source,id:'remote',home:undefined}])
  assert.equal(new Set(groups.map(g=>g.id)).size,8)
  assert.deepEqual(groups.slice(0,4).map(g=>[g.label,g.sessions.map(s=>s.id)]),[
    ['~/work/tree',['1']],['/archive/tree',['2']],['/empty',[]],['/notes',['3']]])
  assert.equal(groups[4].label,'/users/demo/work/tree')
})
test('local updates override bounded history, and children and archived sessions stay out',() => {
  const history = [row('a','global','/r1'),row('b','global','/r1'),row('c','global','/r2',{parentID:'a'})]
  const known = [row('a','global','/r2',{title:'renamed',time:{updated:5}}),row('b','global','/r1',{time:{archived:8}})]
  const [group] = projectGroups([{id:'s',known,history,projects:[]}])
  assert.deepEqual(group.sessions,[{id:'a',title:'renamed',time:5}])
  assert.equal(group.path,'/r2')
})

test('the desktop main entry supplies its exact home, without loading Node modules in the window', async () => {
  const {readFile} = await import('node:fs/promises')
  const {runInNewContext} = await import('node:vm')
  const gui = await readFile(new URL('../gui-experimental.cjs',import.meta.url),'utf8')
  let main = false
  const context = {module:{exports:{}},require(id) {
    if (id === '@opencode/plugin/gui') return {Store:{global:()=>({})},Ipc:{define:t=>t},Plugin:{define:t=>t}}
    if (id === 'effect') return {Schema:{String:'string',Array:()=>({}),optional:()=>({}),Struct:()=>({})}}
    if (id === 'solid-js') return {}
    assert.ok(main && id === 'node:os')
    return {homedir:()=>'/fixture/current-user'}
  }}
  runInNewContext(gui,context)
  main = true
  let snapshot
  context.module.exports.default.main({provide(token,impl) {
    assert.equal(token.id,'project-sidebar.home')
    snapshot = impl.state()
  }})
  assert.equal(snapshot,'/fixture/current-user')
})

test('hiding and restoring one directory preserves other servers and folders',() => {
  const key = (server,path) => JSON.stringify([server,path])
  const folder = key('local','/work/demo')
  const others = [key('remote','/work/demo'),key('local','/tmp/demo')]
  const hidden = setFolderHidden(others,folder,true)
  assert.deepEqual(setFolderHidden(hidden,folder,true),[...others,folder])
  assert.deepEqual(setFolderHidden(hidden,folder,false),others)
  assert.deepEqual(setFolderHidden(others,folder,false),others)
})
