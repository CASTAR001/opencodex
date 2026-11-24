import { createComponent, createMemo, onCleanup } from 'solid-js'
import { insert } from 'solid-js/web'
import { projectDocument } from './document.js'
import { bindFootnotes } from './navigation.js'
import { bindWebLinks } from './links.js'
import { exportMenu } from './export-menu.js'

export function reader(ctx, source, path, session, files) {
  const rail = document.createElement('div')
  rail.dataset.readerScroll = ''
  const article = document.createElement('article')
  article.dataset.ocxReader = ''
  const scope = 'ocx-fn-' + crypto.randomUUID()
  article.dataset.noteScope = scope
  rail.append(exportMenu(ctx,source,path,files,article),article)
  const model = createMemo(() => projectDocument(source(), scope, path))
  const markdown = getText => createComponent(ctx.ui.Markdown, { get text() { return getText() } })
  const body = document.createElement('div')
  const endnotes = document.createElement('div')
  const metadata = document.createElement('div')
  article.append(metadata, body, endnotes)
  insert(metadata, () => {
    const value = model().properties
    if (value === undefined) return
    const details = document.createElement('details')
    const summary = document.createElement('summary')
    summary.textContent = '文档属性'
    const pre = document.createElement('pre')
    pre.textContent = value
    details.append(summary, pre)
    return details
  })
  insert(body, markdown(() => model().body))
  insert(endnotes, () => {
    const notes = model().notes
    if (!notes.length) return
    const section = document.createElement('section')
    section.dataset.footnotes = ''
    const title = document.createElement('h2')
    title.textContent = '注释'
    const list = document.createElement('ol')
    section.append(title, list)
    for (const note of notes) {
      const li = document.createElement('li')
      li.dataset.noteNumber = String(note.number)
      li.tabIndex = -1
      insert(li, markdown(() => note.text))
      note.references.forEach((ref, index) => {
        const target = document.createElement('span')
        target.id = ref
        target.setAttribute('aria-hidden', 'true')
        const back = document.createElement('a')
        back.href = '#' + ref.replace(scope + '-to-', scope + '-from-')
        back.textContent = note.references.length > 1 ? '↩' + (index + 1) : '↩'
        back.setAttribute('aria-label', '返回脚注 ' + note.number + ' 的第 ' + (index + 1) + ' 处引用')
        li.append(target, back)
      })
      list.append(li)
    }
    return section
  })
  onCleanup(bindFootnotes(article))
  onCleanup(bindWebLinks(article, url => ctx.system.openExternal(url)))
  function openLocalFile(event) {
    if (event.type === 'keydown' && event.key !== 'Enter') return
    const href = event.target.closest?.('a[data-local-link]')?.dataset.localLink
    if (!href || !ctx.links || !session) return
    event.preventDefault()
    event.stopPropagation()
    const slash = path.lastIndexOf('/')
    void ctx.links.open({ href, base: slash < 0 ? '' : path.slice(0, slash), session: session() })
  }
  article.addEventListener('click', openLocalFile, true)
  article.addEventListener('keydown', openLocalFile, true)
  return rail
}
