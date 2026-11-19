// Let the host handle the context menu and modified clicks on real links.
export function bindWebLinks(root, open) {
  function activate(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
    const link = event.target.closest?.('a[href]')
    if (!link || !root.contains(link) || !/^https?:\/\//i.test(link.getAttribute('href'))) return
    event.preventDefault()
    event.stopPropagation()
    open(link.href)
  }
  root.addEventListener('click', activate, true)
  return () => root.removeEventListener('click', activate, true)
}
