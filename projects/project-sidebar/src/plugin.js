import { Ipc, Plugin, Slot, Store, Style } from '@opencode/plugin/gui'
import { Schema } from 'effect'
import { createComponent, createEffect, createMemo, createRoot, createSignal, onCleanup } from 'solid-js'
import { projectGroups, setFolderHidden } from './model.js'
import { closeHelp, closeQuestion, nativeProjectRow, selectNativeClose } from './native-close.js'
import { defaultCloseHint, isDefaultProjectPath } from './default-project.js'
import { createTree } from './tree.js'
import { watchSideList } from './host.js'
import css from './tree.css'

const homeDirectory = Ipc.define({id:'project-sidebar.home', state:Schema.String, methods:{}})
const documentsDirectory = Ipc.define({id:'project-sidebar.documents', state:Schema.String, methods:{}})
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
  const folders = ctx.stores.folders
  const documents = ctx.main(documentsDirectory)
  const protectedFolder = group => ctx.servers.get(group.server)?.builtin && isDefaultProjectPath(group.path,documents.state())
  const resolveRow = group => protectedFolder(group) ? undefined : nativeProjectRow(list,group,ctx.servers.list().map(id=>ctx.servers.get(id)))
  let dialog, closing = false
  function closeProject(group) {
    const original = resolveRow(group)
    if (!original || closing) return
    dialog?.close()
    const question = closeQuestion(group)
    dialog = ctx.dialogs.open(handle => {
      onCleanup(() => { if (dialog === handle) dialog = undefined })
      return createComponent(ctx.ui.Dialog,{title:question.title,description:question.description,closable:false,
        get footer() { return [
          createComponent(ctx.ui.Button,{variant:'ghost',autofocus:true,children:question.cancel,onClick:() => handle.close()}),
          createComponent(ctx.ui.Button,{variant:'danger',class:'ps-confirm-close',children:question.confirm,onClick:() => {
            handle.close()
            void finishClose(group,original)
          }}),
        ] }})
    })
  }
  async function finishClose(group,original) {
    if (closing || protectedFolder(group)) return
    closing = true
    try {
      if (!list.isConnected || !await selectNativeClose(() => resolveRow(group),original)) {
        await ctx.dialogs.alert({title:'未能关闭此项目',description:closeHelp})
        return
      }
      folders.update(draft => {
        draft.closed = setFolderHidden(draft.closed ?? [],group.id,true)
        draft.hidden = setFolderHidden(draft.hidden,group.id,false)
      })
    } finally { closing = false }
  }
  const tree = createTree({open:(server,id) => ctx.tabs.open({server,id},{focus:true}),
    closeProject, closeHint:group => {
      if (protectedFolder(group)) return defaultCloseHint
      return resolveRow(group) ? '' : '原生列表中未找到唯一匹配项。'+closeHelp
    },
    setHidden:(id,hide) => folders.update(draft => {
      draft.hidden = setFolderHidden(draft.hidden,id,hide)
    }),
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
  // The host retains the server record after Close. Keep the tree in sync
  // until the native row returns, or the user opens a session in this folder.
  let previousSelection
  createEffect(() => {
    const closed = folders.value.closed ?? []
    if (!closed.length) return
    const candidates = data().groups.filter(group=>closed.includes(group.id))
    function reconcile() {
      const returned = candidates.filter(group => resolveRow(group)).map(group => group.id)
      if (returned.length) folders.update(draft => {
        draft.closed = (draft.closed ?? []).filter(id => !returned.includes(id))
      })
    }
    reconcile()
    const observer = new MutationObserver(reconcile)
    observer.observe(list,{childList:true,subtree:true,characterData:true})
    onCleanup(() => observer.disconnect())
  })
  createEffect(() => {
    const selected = ctx.tabs.list().find(t => t.active)?.session
    const closed = folders.value.closed ?? []
    if (previousSelection !== undefined && previousSelection !== selected?.key && selected) {
      const group = data().groups.find(g => g.server === selected.server.id && g.sessions.some(s => s.id === selected.id))
      if (group && closed.includes(group.id)) folders.update(draft => {
        draft.closed = setFolderHidden(draft.closed ?? [],group.id,false)
      })
    }
    previousSelection = selected?.key ?? null
    tree.update(data().groups.filter(g=>!closed.includes(g.id)),selected && {id:selected.id,server:selected.server.id},data().status,folders.value.hidden)
  })
  onCleanup(() => {
    dialog?.close()
    for (const record of histories.values()) record.dispose()
    list.removeAttribute('data-ocx-project-sidebar-hidden')
    const focused = tree.root.contains(document.activeElement) || (showNative && document.activeElement === back)
    tree.root.remove()
    back.remove()
    if (focused && list.isConnected) list.querySelector('button')?.focus({preventScroll:true})
  })
}

export default Plugin.define({
  stores:{folders:Store.global(Schema.Struct({hidden:Schema.Array(Schema.String),closed:Schema.optional(Schema.Array(Schema.String))}),{hidden:[]})},
  main(ctx) {
    const home = require('node:os').homedir()
    ctx.provide(homeDirectory,{state:() => home})
    const documents = require('electron').app.getPath('documents')
    ctx.provide(documentsDirectory,{state:() => documents})
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
