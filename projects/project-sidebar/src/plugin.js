import { Ipc, Plugin, Slot, Style } from '@opencode/plugin/gui'
import { Schema } from 'effect'
import { createEffect, createMemo, createRoot, createSignal, onCleanup } from 'solid-js'
import { projectGroups } from './model.js'
import { createTree } from './tree.js'
import { watchSideList } from './host.js'
import css from './tree.css'

const homeDirectory = Ipc.define({id:'project-sidebar.home', state:Schema.String, methods:{}})
const historyEvents = new Set(['session.created','session.deleted','session.archived','session.unarchived','session.renamed','session.moved'])

function serverHistory(server) {
  const [rows,setRows] = createSignal([])
  const [state,setState] = createSignal('loading')
  const [revision,refresh] = createSignal(0)
  createEffect(() => {
    if (!server.connected) { setState('offline'); return }
    revision()
    setState('loading')
    const request = new AbortController()
    server.client.session.list({limit:500,order:'desc',parentID:null},{signal:request.signal}).then(response => {
      if (!request.signal.aborted) { setRows(response.data); setState('ready') }
    }).catch(() => { if (!request.signal.aborted) setState('error') })
    onCleanup(() => request.abort())
  })
  createEffect(() => {
    if (!server.connected) return
    // Hydrate known roots even when they have no sessions in the recent index.
    void server.data.project.sync().catch(() => {})
  })
  createEffect(() => {
    const data = server.data
    let timer
    const stop = data.listen(({details}) => {
      if (!historyEvents.has(details.type)) return
      clearTimeout(timer)
      timer = setTimeout(() => refresh(n => n+1),150)
    })
    onCleanup(() => { clearTimeout(timer); stop() })
  })
  return {rows, state}
}

function attach(ctx, list) {
  const back = document.createElement('button')
  back.type = 'button'
  back.className = 'ps-return'
  back.textContent = '返回项目树'
  let showNative = false
  function mode(native) {
    showNative = native
    tree.root.hidden = native
    back.hidden = !native
    list.toggleAttribute('data-ocx-project-sidebar-hidden',!native)
  }
  const tree = createTree({open:(server,id) => ctx.tabs.open({server,id},{focus:true}),
    native:() => { mode(true); back.focus() }})
  back.onclick = () => { mode(false); tree.root.querySelector('.ps-native').focus() }
  list.before(tree.root,back)
  mode(false)

  const histories = new Map()
  const [generation,changed] = createSignal(0)
  createEffect(() => {
    const servers = ctx.servers.list().map(id => ctx.servers.get(id)).filter(Boolean)
    for (const [server,record] of histories) {
      if (!servers.includes(server)) { record.dispose(); histories.delete(server) }
    }
    for (const server of servers) if (!histories.has(server)) {
      const record = createRoot(dispose => ({dispose,...serverHistory(server)}))
      histories.set(server,record)
    }
    changed(n => n + 1)
  })
  const home = ctx.main(homeDirectory)
  const data = createMemo(() => {
    generation()
    const sources = [...histories].map(([server,history]) => ({
      id:server.id, name:server.name, home:server.builtin ? home.state() : undefined,
      projects:server.data.project.list(), known:server.data.session.list(), history:history.rows(), state:history.state(),
    }))
    const groups = projectGroups(sources)
    const status = sources.some(s => s.state === 'error' || s.state === 'offline') ? '部分会话暂时无法读取'
      : !groups.length && sources.some(s => s.state === 'loading') ? '正在读取项目…' : ''
    return {groups,status}
  })
  createEffect(() => {
    const selected = ctx.tabs.list().find(t => t.active)?.session
    tree.update(data().groups,selected && {id:selected.id,server:selected.server.id},data().status)
  })
  onCleanup(() => {
    for (const record of histories.values()) record.dispose()
    list.removeAttribute('data-ocx-project-sidebar-hidden')
    const focused = tree.root.contains(document.activeElement) || (showNative && document.activeElement === back)
    tree.root.remove()
    back.remove()
    if (focused && list.isConnected) list.querySelector('button')?.focus({preventScroll:true})
  })
}

export default Plugin.define({
  main(ctx) {
    const home = require('node:os').homedir()
    ctx.provide(homeDirectory,{state:() => home})
  },
  setup(ctx) {
    ctx.add(Style,css)
    ctx.add(Slot,{at:'window.bottom', render() {
      const anchor = document.createElement('span')
      anchor.hidden = true
      const [list,setList] = createSignal(null)
      const stop = watchSideList(setList)
      onCleanup(stop)
      createEffect(() => { const target = list(); if (target) attach(ctx,target) })
      return anchor
    }})
  },
})
