// The same delegated handler is also used in the downloadable offline comparison.
export function bindFootnotes(root) {
  function follow(event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const link = event.target.closest?.('a[href^="#"]')
    if (!link || !root.contains(link)) return
    const name = link.hash.slice(1)
    const scope = root.dataset.noteScope
    if (!name.startsWith(scope + '-')) return
    const match = /^(to|from)-(\d+)-(\d+)$/.exec(name.slice(scope.length + 1))
    if (!match) return
    const [, direction, number, occurrence] = match
    const target = direction === 'to'
      ? root.querySelector('[data-note-number="' + number + '"]')
      : root.querySelector('a[href="#' + scope + '-to-' + number + '-' + occurrence + '"]')
    if (!target) return
    event.preventDefault()
    event.stopPropagation()
    if (direction === 'to') link.id = scope + '-from-' + number + '-' + occurrence
    const rail = root.closest('[data-reader-scroll]') || root
    rail.scrollTop += target.getBoundingClientRect().top - rail.getBoundingClientRect().top - 28
    target.focus({ preventScroll: true })
  }
  root.addEventListener('click', follow, true)
  return () => root.removeEventListener('click', follow, true)
}
