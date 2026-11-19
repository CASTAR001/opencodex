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

// File headers also begin with --- and +++. Inside a unified hunk those same
// prefixes can be real source lines. The hunk lengths distinguish the two.
function diffKinds(source) {
  let oldLeft = 0, newLeft = 0
  return source.split('\n').map(line => {
    const hunk = /^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/.exec(line)
    if (hunk) {
      oldLeft = Number(hunk[1] ?? 1)
      newLeft = Number(hunk[2] ?? 1)
      return
    }
    if (oldLeft || newLeft) {
      if (line.startsWith('\\')) return
      if (line.startsWith(' ') && oldLeft && newLeft) { oldLeft--; newLeft--; return }
      if (line.startsWith('-') && oldLeft) { oldLeft--; return 'delete' }
      if (line.startsWith('+') && newLeft) { newLeft--; return 'add' }
      oldLeft = newLeft = 0
    }
    if (/^(?:---|\+\+\+)(?:\s|$)/.test(line)) return
    if (line.startsWith('+')) return 'add'
    if (line.startsWith('-')) return 'delete'
  })
}

// Anchor both overlays to the original highlighted text. Only visible rows
// get decoration nodes, and native selections and Copy still see pure source.
function decorateLines(pre, gutter, bands, state) {
  const fence = pre.parentElement
  const range = document.createRange()
  let starts = [], last, kinds, dirty = true, frame = 0
  function index() {
    starts = []
    last = undefined
    kinds = undefined
    const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT)
    let atStart = true, node
    while ((node = walker.nextNode())) {
      const text = node.data
      if (!text.length) continue
      if (atStart) starts.push([node, 0])
      for (let i = text.indexOf('\n'); i >= 0; i = text.indexOf('\n', i + 1))
        if (i + 1 < text.length) starts.push([node, i + 1])
      atStart = text.endsWith('\n')
      last = [node, text.length - 1]
    }
    fence.style.setProperty('--ocx-number-digits', String(Math.max(2, String(starts.length).length)))
    dirty = false
  }
  function rect([node, offset]) {
    range.setStart(node, offset)
    range.setEnd(node, offset + 1)
    return range.getBoundingClientRect()
  }
  function paint() {
    frame = 0
    if (dirty) index()
    if (state.diff && !kinds) kinds = diffKinds(pre.textContent)
    const box = pre.getBoundingClientRect()
    if (!box.height) return
    const lineHeight = parseFloat(getComputedStyle(pre).lineHeight) || 20
    let lo = 0, hi = starts.length
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (rect(starts[mid]).bottom <= box.top) lo = mid + 1
      else hi = mid
    }
    // A wrapped line may begin above the viewport and still fill it.
    const visible = [], fills = []
    for (let i = Math.max(0,lo - 1); i < starts.length; i++) {
      const line = rect(starts[i])
      const center = line.top + line.height / 2 - box.top
      if (center - lineHeight / 2 >= box.height) break
      if (state.numbers && line.bottom > box.top) visible.push([i + 1, center])
      if (state.diff && kinds[i]) {
        const next = starts[i + 1]
        const end = rect(next || last)
        const bottom = end.top + end.height / 2 - box.top + (next ? -lineHeight : lineHeight) / 2
        const y = Math.max(0, center - lineHeight / 2)
        const height = Math.min(box.height, bottom) - y
        if (height > 0) fills.push([kinds[i], y, height])
      }
    }
    visible.forEach(([n, y], i) => {
      const label = gutter.children[i] || gutter.appendChild(document.createElement('i'))
      label.dataset.line = n
      label.style.top = y + 'px'
    })
    while (gutter.childElementCount > visible.length) gutter.lastChild.remove()
    fills.forEach(([kind,y,height], i) => {
      const fill = bands.children[i] || bands.appendChild(document.createElement('i'))
      fill.dataset.change = kind
      fill.style.top = y + 'px'
      fill.style.height = height + 'px'
    })
    while (bands.childElementCount > fills.length) bands.lastChild.remove()
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
    bands.replaceChildren()
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
  const pre = fence.querySelector(':scope > pre')
  const title = document.createElement('span')
  title.textContent = language
  const diff = iconButton('diff')
  diff.path.setAttribute('d','M2.5 4.5h6 M5.5 1.5v6 M7.5 11.5h6')
  diff.button.disabled = language !== 'Diff'
  const number = iconButton('numbers')
  number.path.setAttribute('d','M2 2.5h1v3 M1.8 5.5h2.4 M1.7 9c.4-1.4 2.8-1.2 2.8.4 0 .9-1.7 1.8-2.6 3.1h2.8 M7 4h7 M7 8h7 M7 12h7')
  const wrap = iconButton('wrap')
  header.replaceChildren(title, diff.button, number.button, wrap.button)
  header.dataset.ocxCodeHeader = ''
  const gutter = document.createElement('div')
  gutter.dataset.ocxCodeGutter = ''
  gutter.setAttribute('aria-hidden','true')
  gutter.hidden = true
  header.after(gutter)
  const bands = document.createElement('div')
  bands.dataset.ocxDiffBands = ''
  bands.setAttribute('aria-hidden','true')
  bands.hidden = true
  gutter.before(bands)
  const track = document.createElement('div')
  track.dataset.ocxScrollTrack = ''
  track.setAttribute('aria-hidden','true')
  gutter.after(track)
  const scroll = scrollThumb(fence,pre,track)
  // A streaming fence may be decorated in a fragment before its row is attached.
  let release
  const bind = () => { release = watchPane(fence) }
  let mountFrame = 0
  if (fence.isConnected) bind()
  else mountFrame = requestAnimationFrame(bind)
  const state = { numbers: false, diff: false }
  let decorations, wrapped = true, labels
  function render() {
    diff.button.setAttribute('aria-label',labels.diff)
    diff.button.setAttribute('aria-pressed',String(state.diff))
    diff.button.title = diff.button.disabled ? labels.diffOnly : state.diff ? labels.hideDiff : labels.diff
    number.button.setAttribute('aria-pressed',String(state.numbers))
    number.button.setAttribute('aria-label',labels.numbers)
    number.button.title = state.numbers ? labels.hideNumbers : labels.numbers
    wrap.button.setAttribute('aria-pressed',String(wrapped))
    wrap.button.setAttribute('aria-label',labels.wrap)
    wrap.button.title = wrapped ? labels.keepLines : labels.wrap
    wrap.path.setAttribute('d', wrapped
      ? 'M2 3.5h12 M2 7.5h9.5a2.5 2.5 0 0 1 0 5h-4 M9.5 10.5l-2 2 2 2 M2 12.5h2.5'
      : 'M2 3.5h8 M2 8h12 M11.5 5.5 14 8l-2.5 2.5 M2 12.5h8')
  }
  function toggleDecoration(key) {
    state[key] = !state[key]
    render()
    gutter.hidden = !state.numbers
    bands.hidden = !state.diff
    if (state.diff || state.numbers) {
      decorations ??= decorateLines(pre, gutter, bands, state)
      decorations.schedule()
    } else {
      decorations.stop()
      decorations = undefined
    }
    scroll.changed()
  }
  diff.button.onclick = () => toggleDecoration('diff')
  number.button.onclick = () => toggleDecoration('numbers')
  wrap.button.onclick = () => { wrapped = !wrapped; render(); decorations?.schedule(); scroll.changed() }
  return {
    labels(value) { labels = value; render() },
    dispose() { decorations?.stop(); bands.remove(); scroll.dispose(); cancelAnimationFrame(mountFrame); release?.(); gutter.remove() }
  }
}
module.exports = { mountControls }
