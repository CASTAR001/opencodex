import { Plugin, Panel, MenuItem, Slot, Style } from '@opencode/plugin/gui'
import { createEffect, createMemo, onCleanup } from 'solid-js'
import { insert } from 'solid-js/web'
import { reader } from './reader.js'
import { filePreviewSlot } from './file-preview.js'
import styles from './reader.css'

const prefix = 'read/'
function workspaceMarkdown(files, path) {
  return /\.md$/i.test(path) && !files.absolute(path) && !path.split(/[\\/]/).includes('..')
}
function filePath(id) {
  if (!id.startsWith(prefix)) return
  try {
    const path = decodeURIComponent(id.slice(prefix.length))
    if (/\.md$/i.test(path)) return path
  } catch { /* Ignore stale tab IDs. */ }
}
function content(ctx, props) {
  const container = document.createElement('div')
  container.className = 'ocx-reader-panel'
  const selected = createMemo(() => filePath(props.tab.id))
  createEffect(() => {
    const path = selected()
    const session = props.session
    const files = props.screen.file
    if (!path || !files.ready() || !workspaceMarkdown(files, files.resolve(path))) return
    void files.sync(path, { silent: true }).catch(() => {})
    onCleanup(() => {
      const fileKey = 'file://' + path.split('/').map(encodeURIComponent).join('/')
      if (ctx.layout.state(fileKey, session) === 'closed') files.unwatch(path)
    })
  })
  const status = createMemo(() => {
    const path = selected()
    const files = props.screen.file
    if (!path || !files.ready() || !workspaceMarkdown(files, files.resolve(path))) return '等待工作区文件'
    const state = () => files.get(path)
    if (state()?.error || state()?.notFound) return '无法读取这份 Markdown 文件。'
    if (!state()?.loaded) return '正在读取文档…'
    if (state().content?.type !== 'text' || state().content?.encoding === 'base64') return '这份文件没有可预览的文本。'
    return path
  })
  insert(container, () => {
    const path = selected()
    const result = status()
    if (!path || result !== path) return result
    return reader(ctx, () => props.screen.file.get(path)?.content?.content ?? '', path, () => props.session)
  })
  return container
}
export default Plugin.define({
  setup(ctx) {
    const tabs = new Map()
    ctx.add(Style, styles)
    ctx.add(Slot, { at: 'session.panel.end', render: props => filePreviewSlot(ctx, props) })
    ctx.add(Panel, {
      id: 'reader', region: 'side',
      list: ({ open }) => open.flatMap(id => {
        const path = filePath(id)
        if (!path) return []
        if (!tabs.has(id)) tabs.set(id, { id, title: path.split('/').at(-1) + ' · 阅读' })
        return [tabs.get(id)]
      }),
      render: props => content(ctx, props),
      close: ({ tab }) => tabs.delete(tab.id),
    })
    ctx.add(MenuItem, { menu: 'session.panel', id: 'read-markdown', title: '阅读 Markdown 文件…',
      async run() {
        const screen = ctx.screen.current()
        const session = ctx.sessions.current()
        if (!screen || !session) return
        const input = await ctx.dialogs.prompt({ title: '阅读 Markdown 文件', placeholder: '工作区内的 .md 文件路径' })
        if (!input || ctx.sessions.current()?.key !== session.key) return
        const path = screen.file.resolve(input.trim())
        if (!workspaceMarkdown(screen.file, path)) {
          await ctx.dialogs.alert({ title: '请选择工作区内的 .md 文件。' })
          return
        }
        ctx.layout.open(ctx.id + ':' + prefix + encodeURIComponent(path), session)
      },
    })
  },
})
