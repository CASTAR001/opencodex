// Bind only web links. Relative files, headings, footnotes and code keep their own handlers.
export function bindWebLinks(root, { open, copy }) {
  let popup, trigger, anchorLeft, anchorTop
  const webLink = target => {
    const link = target?.closest?.('a[href]')
    if (root.contains(link) && /^https?:\/\//i.test(link?.getAttribute('href') ?? '')) return link
  }
  function dismiss(restore = false) {
    if (!popup) return
    popup.remove()
    popup = undefined
    document.removeEventListener('pointerdown', outside, true)
    document.removeEventListener('focusin', outside, true)
    document.removeEventListener('scroll', moved, true)
    window.removeEventListener('resize', resized)
    if (restore && trigger?.isConnected) trigger.focus({ preventScroll: true })
    trigger = undefined
  }
  function outside(event) { if (!popup?.contains(event.target)) dismiss() }
  function moved() {
    const rect = trigger?.getBoundingClientRect()
    if (rect && (rect.left !== anchorLeft || rect.top !== anchorTop)) dismiss()
  }
  function resized() { dismiss() }
  function activate(event) {
    const link = webLink(event.target)
    if (!link || !open || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
    event.preventDefault()
    event.stopPropagation()
    open(link.href)
  }
  function menu(event) {
    const link = webLink(event.target)
    if (!link) return
    if (event.type === 'keydown' && !(event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey))) return
    event.preventDefault()
    event.stopPropagation()
    dismiss()
    trigger = link
    const panel = document.createElement('div')
    panel.dataset.readerLinkMenu = ''
    panel.setAttribute('role', 'menu')
    panel.setAttribute('aria-label', '链接')
    const button = document.createElement('button')
    button.type = 'button'
    button.setAttribute('role', 'menuitem')
    button.textContent = '复制网址'
    panel.append(button)
    // The top layer keeps a fixed-position menu outside the scroll pane's clipping.
    panel.setAttribute('popover', 'manual')
    root.append(panel)
    popup = panel
    panel.showPopover()
    const pointer = event.type === 'contextmenu' && (event.clientX || event.clientY)
    const point = link.getBoundingClientRect()
    anchorLeft = point.left
    anchorTop = point.top
    const x = pointer ? event.clientX : point.left
    const y = pointer ? event.clientY : point.bottom
    panel.style.left = Math.max(4, Math.min(x, innerWidth - panel.offsetWidth - 4)) + 'px'
    panel.style.top = Math.max(4, Math.min(y, innerHeight - panel.offsetHeight - 4)) + 'px'
    button.focus({ preventScroll: true })
    button.onclick = async () => {
      try { await copy(link.href); if (popup === panel) dismiss(true) }
      catch { if (popup === panel) { button.textContent = '复制失败，重试'; button.title = link.href } }
    }
    panel.onkeydown = event => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        dismiss(true)
      }
    }
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('focusin', outside, true)
    document.addEventListener('scroll', moved, true)
    window.addEventListener('resize', resized)
  }
  root.addEventListener('click', activate, true)
  root.addEventListener('contextmenu', menu, true)
  root.addEventListener('keydown', menu, true)
  return () => {
    dismiss()
    root.removeEventListener('click', activate, true)
    root.removeEventListener('contextmenu', menu, true)
    root.removeEventListener('keydown', menu, true)
  }
}
