import { createEffect, createMemo, createRoot } from 'solid-js'
import { repairs, partInfo, completedParts } from './model.js'

const selector = '[data-slot="session-turn-assistant-content"] [data-component="text-part"][data-timeline-part-id]'
const skip = 'pre,code,a,math,.katex,svg,button,textarea,[contenteditable=true]'
function decorate(root, item, undo) {
  if (item.kind === 'link') {
    if (!URL.canParse(item.literal) || !URL.canParse(item.value)) return
    for (const a of root.querySelectorAll('a.external-link[href]')) {
      if (a.textContent !== item.literal || a.href !== new URL(item.literal).href) continue
      const label = a.lastChild
      if (label?.nodeType !== 3 || label.data !== item.literal) continue
      const old = a.getAttribute('href')
      const tail = document.createTextNode(item.literal.slice(item.value.length))
      a.after(tail)
      a.href = item.value
      label.data = item.value
      undo.push(() => {
        if (a.getAttribute('href') === item.value && label.data === item.value && a.nextSibling === tail) {
          a.setAttribute('href',old); label.data = item.literal; tail.remove()
        }
      })
    }
    return
  }
  const nodes = document.createTreeWalker(root,NodeFilter.SHOW_TEXT)
  let node
  while ((node = nodes.nextNode())) {
    if (!node.data.includes(item.literal) || node.parentElement.closest(skip)) continue
    const prefix = node
    const after = prefix.splitText(prefix.data.indexOf(item.literal))
    const rest = after.splitText(item.literal.length)
    const strong = document.createElement('strong')
    strong.textContent = item.value
    after.replaceWith(strong)
    undo.push(() => { if (strong.parentNode && strong.textContent === item.value) {
      strong.replaceWith(after)
      // Keep host-owned text nodes and any newer siblings intact.
      if (rest.previousSibling === after && after.previousSibling === prefix) {
        prefix.appendData(after.data + rest.data); after.remove(); rest.remove()
      }
    } })
    return
  }
}

export function watch(session) {
  const mounted = new Map()
  const history = session.server.data.session.message
  const completed = createMemo(() => completedParts(history.list(session.id)))
  let pending = false
  const enqueue = () => {
    if (pending) return
    pending = true
    queueMicrotask(() => { if (pending) refresh(); pending = false })
  }
  function refresh() {
    const visible = new Set(document.querySelectorAll(selector))
    for (const [el,dispose] of mounted) if (!visible.has(el)) {dispose(); mounted.delete(el)}
    for (const el of visible) {
      if (mounted.has(el)) continue
      const match = /^(.+):text:(\d+)$/.exec(el.dataset.timelinePartId)
      if (!match) continue
      const dispose = createRoot(dispose => {
        let changes = [], lastText, items = []
        const clear = () => { changes.reverse().forEach(fn => fn()); changes = []; el.removeAttribute('data-ocx-completed') }
        let current
        const render = () => {
          if (lastText !== current?.source) {
            clear(); lastText = current?.source; items = lastText ? repairs(lastText) : []
          }
          el.toggleAttribute('data-ocx-completed', completed().has(el.dataset.timelinePartId))
          const root = el.querySelector('[data-slot="text-part-body"] > [data-component="markdown"]')
          if (root) for (const item of items) decorate(root,item,changes)
        }
        const observer = new MutationObserver(render)
        observer.observe(el,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-interrupted']})
        createEffect(() => {
          const data = session.server.data.session.message
          const msg = data.get ? data.get(session.id,match[1]) : data.list(session.id).find(m => m.id === match[1])
          current = partInfo(msg, Number(match[2]))
          render()
        })
        return () => {observer.disconnect(); clear(); dispose()}
      })
      mounted.set(el,dispose)
    }
  }
  const observer = new MutationObserver(records => {
    if (records.some(r => [...r.addedNodes,...r.removedNodes].some(n => n.nodeType === 1 && (n.matches(selector) || n.querySelector(selector) || n.matches('[data-component="text-part"]'))))) enqueue()
  })
  observer.observe(document.body,{childList:true,subtree:true})
  refresh()
  return () => { observer.disconnect(); pending = false; for (const dispose of mounted.values()) dispose(); mounted.clear() }
}
