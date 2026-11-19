import { edgeScroll } from './edge-scroll.js'

function el(tag, cls) {
  const node = document.createElement(tag)
  node.className = cls
  return node
}

export function createRail({ href, jump, star, retry }) {
  const nav = el('nav','ocx-prompt-nav')
  nav.inert = true
  nav.setAttribute('aria-label','提示词导航')
  const list = el('ol','pn-ticks')
  list.setAttribute('aria-label','当前会话的提示词')
  const pop = el('div','pn-pop')
  pop.hidden = true
  const info = el('div','pn-info')
  const number = el('span','pn-index')
  const flag = el('button','pn-star')
  flag.type = 'button'
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg')
  svg.setAttribute('viewBox','0 0 24 24')
  svg.setAttribute('aria-hidden','true')
  const path = document.createElementNS(svg.namespaceURI,'path')
  path.setAttribute('d','m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4L2.8 9.7l6.4-.9Z')
  svg.append(path); flag.append(svg)
  info.append(number,flag)
  const text = el('p','pn-text')
  text.dir = 'auto'
  pop.append(info,text)
  const notice = el('div','pn-notice')
  notice.setAttribute('role','status')
  const message = el('span','')
  const again = el('button','pn-retry')
  again.type = 'button'
  again.textContent = '重试'
  again.onclick = retry
  notice.append(message,again)
  nav.append(list,pop,notice)
  const entries = new Map()
  let active, shown, stars = new Set(), order = [], idle
  let roving
  function position() {
    const entry = entries.get(shown)
    if (!entry || pop.hidden) return
    const tick = entry.link.getBoundingClientRect()
    const rect = nav.getBoundingClientRect()
    const visible = list.getBoundingClientRect()
    if (tick.bottom <= visible.top || tick.top >= visible.bottom) { close(); return }
    pop.style.top = Math.max(0, Math.min(rect.height-pop.offsetHeight,
      tick.top-rect.top + tick.height/2-pop.offsetHeight/2))+'px'
  }
  function close() {
    clearTimeout(idle)
    if (shown) entries.get(shown)?.link.removeAttribute('data-preview')
    shown = undefined
    pop.hidden = true
  }
  const edges = edgeScroll(list,nav,close)
  function show(id) {
    clearTimeout(idle)
    const entry = entries.get(id)
    if (!entry) return
    if (shown !== id) entries.get(shown)?.link.removeAttribute('data-preview')
    shown = id
    entry.link.setAttribute('data-preview','')
    number.textContent = '第 ' + (entry.index+1) + ' 条提示'
    text.textContent = entry.label
    flag.title = stars.has(id) ? '取消星标' : '标星'
    flag.setAttribute('aria-label',flag.title)
    flag.setAttribute('aria-pressed',String(stars.has(id)))
    pop.hidden = false
    position()
  }
  function leave() {
    if (!shown) return
    clearTimeout(idle)
    idle = setTimeout(()=>{
      if (!pop.matches(':hover, :focus-within') && !entries.get(shown)?.link.matches(':hover, :focus-visible')) close()
    },130)
  }
  pop.onpointerenter = () => clearTimeout(idle)
  pop.onpointerleave = leave
  nav.onfocusout = leave
  flag.onclick = () => { if (shown) star(shown) }
  function setRoving(id) {
    if (roving === id) return
    const old = entries.get(roving)
    if (old) old.link.tabIndex = -1
    roving = id
    const next = entries.get(id)
    if (next) next.link.tabIndex = 0
  }
  nav.addEventListener('keydown',event=>{
    if (event.key === 'Escape') {
      if (shown) {
        entries.get(shown)?.link.focus({preventScroll:true})
        close()
        event.stopPropagation()
      }
      return
    }
    if (!shown || !order.length) return
    const index = entries.get(shown).index
    if (event.key === 'ArrowRight' || (event.key === 'Tab' && !event.shiftKey && event.target !== flag)) {
      event.preventDefault(); flag.focus(); return
    }
    if (event.target === flag && (event.key === 'ArrowLeft' || (event.key === 'Tab' && event.shiftKey))) {
      event.preventDefault(); entries.get(shown).link.focus(); return
    }
    const next = {ArrowDown: index+1, ArrowUp: index-1, Home: 0, End: order.length-1}[event.key]
    if (next == null) return
    event.preventDefault()
    entries.get(order[Math.min(order.length-1,Math.max(0,next))].id).link.focus()
  })
  function make(id) {
    const row = el('li','pn-row')
    row.dataset.promptId = id
    const link = el('a','pn-tick')
    for (const attr of ['noscroll','replace','link']) link.setAttribute(attr,'')
    link.setAttribute('preload','false')
    link.tabIndex = -1
    link.onfocus = () => {setRoving(id); show(id)}
    link.onpointerenter = event => {if (event.pointerType !== 'touch' && !edges.moving) show(id)}
    link.onpointerleave = leave
    link.onclick = event => {
      if (event.button !== 0 || event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) { event.preventDefault(); return }
      // A touch user can tap the visible star immediately after jumping.
      show(id)
      jump(id,event,link)
    }
    row.append(link)
    return {row,link,index:0,label:''}
  }
  function current(id) {
    const view = entries.get(id)
    if (!view || id === active) return
    entries.get(active)?.link.removeAttribute('aria-current')
    active = id
    view.link.setAttribute('aria-current','location')
    if (!nav.matches(':hover, :focus-within')) {
      setRoving(id)
      reveal(view.row)
    }
  }
  function reveal(row) {
    const delta = row.getBoundingClientRect().top-list.getBoundingClientRect().top
    if (delta < -0.5 || delta + row.offsetHeight > list.clientHeight + 0.5)
      list.scrollTop += delta - list.clientHeight / 2
  }
  list.addEventListener('scroll',() => { edges.sync(); position() },{passive:true})
  function size(followTail = false) {
    const wasAtTail = !list.hasAttribute('data-more-after')
    const resized = edges.size(nav.clientHeight)
    if (followTail) list.scrollTop = list.scrollHeight
    else if (resized && !nav.inert && !nav.matches(':hover, :focus-within')) {
      if (wasAtTail) list.scrollTop = list.scrollHeight
      else if (active) reveal(entries.get(active).row)
    }
    edges.sync()
    position()
  }
  // The panel can shrink with the window held still. Track a native transcript
  // column and its containing block, including while the virtualizer holds its width.
  function observeGutter(panel, content, findColumn) {
    let column, container
    const resize = new ResizeObserver(measure)
    const waiting = new MutationObserver(measure)
    function measure() {
      const next = column?.isConnected && column.getClientRects().length ? column : findColumn()
      if (next !== column) {
        if (column) resize.unobserve(column)
        if (container) resize.unobserve(container)
        column = next
        container = column?.parentElement
        if (column) {
          resize.observe(column)
          if (container) resize.observe(container)
        }
      }
      if (column) waiting.disconnect()
      else waiting.observe(content,{childList:true,subtree:true})
      const room = column?.getBoundingClientRect()
      // The title bar can put the panel's midpoint below the page's midpoint.
      const bounds = panel.getBoundingClientRect()
      const pageOffset = (document.documentElement.clientHeight - bounds.top - bounds.bottom) / 2
      nav.style.setProperty('--pn-page-offset', pageOffset+'px')
      const track = nav.getBoundingClientRect()
      const hide = !room?.width || !track.width || track.right + 8 > room.left
      if (nav.inert !== hide) {
        nav.inert = hide
        if (hide) { edges.stop(); close() }
      }
      size()
    }
    resize.observe(document.documentElement)
    resize.observe(panel)
    resize.observe(nav)
    measure()
    return () => { resize.disconnect(); waiting.disconnect() }
  }
  function update(items,saved,status) {
    const followTail = items.length !== order.length && !nav.matches(':hover, :focus-within') &&
      list.scrollHeight - list.clientHeight - list.scrollTop < 1
    stars = new Set(saved)
    order = items
    let before = list.firstElementChild
    const keep = new Set()
    for (const [i,item] of items.entries()) {
      const id = item.id
      keep.add(id)
      let entry = entries.get(id)
      if (!entry) { entry = make(id); entries.set(id,entry) }
      entry.label = item.label
      entry.index = i
      entry.link.setAttribute('href',href(id))
      entry.link.setAttribute('aria-label','第 '+(i+1)+' 条提示，'+item.label+(stars.has(id)?'，已标星':''))
      entry.link.toggleAttribute('data-starred',stars.has(id))
      if (before !== entry.row) list.insertBefore(entry.row,before)
      before = entry.row.nextElementSibling
    }
    for (const [id,entry] of entries) if (!keep.has(id)) { entry.row.remove(); entries.delete(id) }
    if (!keep.has(roving)) setRoving(items[0]?.id)
    if (!keep.has(active)) active = undefined
    message.textContent = status === 'error' ? '较早的提示未能加载' : status === 'miss' ? '定位失败，点击刻度重试'
      : status === 'opening' ? '正在定位…' : ''
    notice.hidden = !message.textContent
    again.hidden = status !== 'error'
    nav.hidden = !items.length && notice.hidden
    if (shown && keep.has(shown)) show(shown)
    else close()
    size(followTail)
  }
  return {nav,list,observeGutter,update,current,close,dispose() { clearTimeout(idle); edges.dispose() }}
}
