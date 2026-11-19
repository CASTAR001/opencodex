const { parsePatch, createPatchView } = require('./patch.cjs')

// A split pane can resize without the window resizing. All fences in it share one observation.
const panes = new WeakMap()
function watchPane(fence) {
  const pane = fence.closest('[data-reader-scroll], [data-scrollable], [data-slot="artifact-document-stage"]')
  if (!pane) return () => {}
  let entry = panes.get(pane)
  if (!entry) {
    const visible = pane.parentElement?.matches('[data-slot="session-timeline-scroll"]')
      ? pane.parentElement.parentElement.querySelector('[data-slot="session-timeline-visible"]') : null
    const area = visible || pane
    function measure() {
      const height = area.clientHeight
      if (height) pane.style.setProperty('--ocx-code-cap', Math.round(height * 0.55) + 'px')
    }
    const observer = new ResizeObserver(measure)
    observer.observe(area)
    measure()
    entry = { observer, count: 0 }
    panes.set(pane, entry)
  }
  entry.count++
  return () => {
    if (--entry.count) return
    entry.observer.disconnect()
    pane.style.removeProperty('--ocx-code-cap')
    panes.delete(pane)
  }
}

// Measure the first character of each logical line in the host's actual highlighted text.
// Line numbers never enter the source DOM, the selection or the native Copy payload.
function numberLines(pre, gutter) {
  const fence = gutter.closest('[data-component="markdown-code"]')
  const range = document.createRange()
  let starts = [], dirty = true, frame = 0
  function index() {
    starts = []
    const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT)
    let atStart = true, node
    while ((node = walker.nextNode())) {
      const text = node.data
      if (!text.length) continue
      if (atStart) starts.push([node, 0])
      for (let i = text.indexOf('\n'); i >= 0; i = text.indexOf('\n', i + 1))
        if (i + 1 < text.length) starts.push([node, i + 1])
      atStart = text.endsWith('\n')
    }
    fence.style.setProperty('--ocx-number-digits', String(Math.max(2, String(starts.length).length)))
    dirty = false
  }
  function rect(i) {
    const [node, offset] = starts[i]
    range.setStart(node, offset)
    range.setEnd(node, offset + 1)
    return range.getBoundingClientRect()
  }
  function paint() {
    frame = 0
    if (dirty) index()
    const box = gutter.getBoundingClientRect()
    if (!box.height) return
    let lo = 0, hi = starts.length
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (rect(mid).bottom <= box.top) lo = mid + 1
      else hi = mid
    }
    // Complete layout reads before reusing the small pool of visible labels.
    const visible = []
    for (let i = lo; i < starts.length; i++) {
      const line = rect(i)
      if (line.top >= box.bottom) break
      visible.push([i + 1, line.top + line.height / 2 - box.top])
    }
    visible.forEach(([n, y], i) => {
      const label = gutter.children[i] || gutter.appendChild(document.createElement('i'))
      label.dataset.line = n
      label.style.top = y + 'px'
    })
    while (gutter.childElementCount > visible.length) gutter.lastChild.remove()
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(paint) }
  const edits = new MutationObserver(() => { dirty = true; schedule() })
  edits.observe(pre, { childList: true, characterData: true, subtree: true })
  const size = new ResizeObserver(schedule)
  size.observe(pre)
  if (pre.firstElementChild) size.observe(pre.firstElementChild)
  pre.addEventListener('scroll', schedule, { passive: true })
  document.fonts?.addEventListener('loadingdone', schedule)
  schedule()
  return { schedule, stop() {
    edits.disconnect()
    size.disconnect()
    pre.removeEventListener('scroll', schedule)
    document.fonts?.removeEventListener('loadingdone', schedule)
    cancelAnimationFrame(frame)
    gutter.replaceChildren()
    fence.style.removeProperty('--ocx-number-digits')
  } }
}

// Keep wheel, keyboard and touch scrolling native. A hover thumb also works on
// systems that suppress native overlay scrollbars until the first scroll.
function scrollThumb(fence, pre, track) {
  const thumb = document.createElement('div')
  track.append(thumb)
  let watching = false, grab, frame = 0
  function draw() {
    frame = 0
    const full = pre.scrollHeight, view = pre.clientHeight, height = track.clientHeight
    const travel = full - view
    const length = Math.min(height, Math.max(22, height * view / (full || 1)))
    track.toggleAttribute('data-overflow', travel > 1)
    thumb.style.height = length + 'px'
    thumb.style.transform = 'translateY(' + (travel > 0 ? pre.scrollTop / travel * (height - length) : 0) + 'px)'
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(draw) }
  const resize = new ResizeObserver(schedule)
  function start() {
    if (watching) return
    watching = true
    resize.observe(pre)
    if (pre.firstElementChild) resize.observe(pre.firstElementChild)
    pre.addEventListener('scroll', schedule, {passive:true})
    draw()
  }
  function stop() {
    watching = false
    resize.disconnect()
    pre.removeEventListener('scroll', schedule)
    cancelAnimationFrame(frame)
    frame = 0
    track.removeAttribute('data-overflow')
  }
  function leave() {
    if (grab === undefined && !fence.matches(':hover, :focus-within')) stop()
  }
  function drag(event) {
    if (grab === undefined) return
    const offset = event.clientY - track.getBoundingClientRect().top - grab
    pre.scrollTop = offset / Math.max(1,track.clientHeight-thumb.offsetHeight) * (pre.scrollHeight-pre.clientHeight)
  }
  track.onpointerdown = event => {
    if (event.button !== 0) return
    event.preventDefault()
    grab = event.target === thumb ? event.clientY-thumb.getBoundingClientRect().top : thumb.offsetHeight/2
    track.setPointerCapture(event.pointerId)
    track.dataset.dragging = ''
    drag(event)
  }
  track.onpointermove = drag
  track.onlostpointercapture = () => { grab = undefined; delete track.dataset.dragging; leave() }
  fence.addEventListener('pointerenter', start)
  fence.addEventListener('pointerleave', leave)
  fence.addEventListener('focusin', start)
  const blur = event => { if (!fence.contains(event.relatedTarget) && !fence.matches(':hover') && grab === undefined) stop() }
  fence.addEventListener('focusout', blur)
  if (fence.matches(':hover, :focus-within')) start()
  return { changed() { if (watching) schedule() }, dispose() {
    stop()
    fence.removeEventListener('pointerenter', start)
    fence.removeEventListener('pointerleave', leave)
    fence.removeEventListener('focusin', start)
    fence.removeEventListener('focusout', blur)
    track.remove()
  } }
}

function iconButton(name) {
  const button = document.createElement('button')
  button.type = 'button'
  button.dataset.ocxToggle = name
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(svg.namespaceURI, 'path')
  svg.append(path)
  button.append(svg)
  return { button, path }
}

function mountControls(header, fence, language) {
  const nativePre = fence.querySelector(':scope > pre')
  const model = language === 'Diff' ? parsePatch(nativePre.textContent) : undefined
  const patch = model && createPatchView(model)
  const pre = patch ? patch.pre : nativePre
  const title = document.createElement('span')
  title.textContent = language
  const number = iconButton('numbers')
  number.path.setAttribute('d','M2 2.5h1v3 M1.8 5.5h2.4 M1.7 9c.4-1.4 2.8-1.2 2.8.4 0 .9-1.7 1.8-2.6 3.1h2.8 M7 4h7 M7 8h7 M7 12h7')
  number.button.disabled = !!model && !model.numbered
  const wrap = iconButton('wrap')
  header.replaceChildren(title, number.button, wrap.button)
  header.dataset.ocxCodeHeader = ''
  const track = document.createElement('div')
  track.dataset.ocxScrollTrack = ''
  track.setAttribute('aria-hidden','true')
  header.after(track)
  let review = false, numbered = false, wrapped = true
  let diff, copy, gutter, numbering, labels
  if (patch) {
    diff = iconButton('diff')
    diff.path.setAttribute('d','M3 5.5h10 M8 1v9 M3 13.5h10')
    number.button.before(diff.button)
    // Delegate to the native copy action with the untouched original code still in place.
    copy = iconButton('copy')
    copy.button.removeAttribute('data-ocx-toggle')
    copy.button.dataset.ocxCopyPatch = ''
    copy.path.setAttribute('d','M6 5.5V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-2.5 M3 5.5h6.5a1 1 0 0 1 1 1V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z')
    const check = document.createElementNS(copy.path.namespaceURI, 'path')
    check.dataset.ocxCopyCheck = ''
    check.setAttribute('d','M2.5 8.5 6.5 12 14 4')
    copy.path.after(check)
    copy.button.onclick = () => fence.querySelector(':scope > [data-slot="markdown-copy-button"] button')?.click()
    header.after(copy.button, pre)
    patch.show(false)
    diff.button.onclick = () => { review = !review; patch.show(review); render(); scroll.changed() }
  } else {
    gutter = document.createElement('div')
    gutter.dataset.ocxCodeGutter = ''
    gutter.setAttribute('aria-hidden','true')
    gutter.hidden = true
    header.after(gutter)
  }
  const scroll = scrollThumb(fence,pre,track)
  let release, mountFrame = 0
  const bind = () => { release = watchPane(fence) }
  if (fence.isConnected) bind()
  else mountFrame = requestAnimationFrame(bind)
  function render() {
    if (patch) {
      patch.label(labels.deleted)
      diff.button.setAttribute('aria-label', labels.diff)
      diff.button.setAttribute('aria-pressed', String(review))
      diff.button.title = review ? labels.hideDiff : labels.diff
      copy.button.setAttribute('aria-label', labels.copyPatch)
      copy.button.title = labels.copyPatch
    }
    number.button.setAttribute('aria-pressed',String(numbered))
    number.button.setAttribute('aria-label',labels.numbers)
    number.button.title = number.button.disabled ? labels.noCoordinates : numbered ? labels.hideNumbers : labels.numbers
    wrap.button.setAttribute('aria-pressed',String(wrapped))
    wrap.button.setAttribute('aria-label',labels.wrap)
    wrap.button.title = wrapped ? labels.keepLines : labels.wrap
    wrap.path.setAttribute('d', wrapped
      ? 'M2 3.5h12 M2 7.5h9.5a2.5 2.5 0 0 1 0 5h-4 M9.5 10.5l-2 2 2 2 M2 12.5h2.5'
      : 'M2 3.5h8 M2 8h12 M11.5 5.5 14 8l-2.5 2.5 M2 12.5h8')
  }
  number.button.onclick = () => {
    numbered = !numbered
    if (gutter) {
      gutter.hidden = !numbered
      if (numbered) numbering = numberLines(pre, gutter)
      else { numbering.stop(); numbering = undefined }
    }
    render()
    scroll.changed()
  }
  wrap.button.onclick = () => { wrapped = !wrapped; render(); numbering?.schedule(); scroll.changed() }
  return {
    labels(value) { labels = value; render() },
    dispose() {
      numbering?.stop(); patch?.pre.remove(); copy?.button.remove(); gutter?.remove()
      scroll.dispose(); cancelAnimationFrame(mountFrame); release?.()
    }
  }
}
module.exports = { mountControls }
