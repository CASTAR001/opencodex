// OpenCode 2.3.2 exposes side tabs and Inbox under the same mount. Only the list
// between the native actions and footer is replaced; unknown structures stay native.
export function watchSideList(change) {
  let current, pending = 0
  const watch = new MutationObserver(() => {
    if (!pending) pending = requestAnimationFrame(locate)
  })
  function locate() {
    pending = 0
    watch.disconnect()
    const header = document.querySelector('[data-slot="titlebar-v2"]')
    const shellRow = header?.nextElementSibling
    const mount = document.querySelector('[data-slot="vertical-tabs-mount"]')
    const portal = mount?.firstElementChild
    const list = Array.from(portal?.children ?? []).find(el =>
      el.classList.contains('flex-1') && el.classList.contains('min-h-0') && el.classList.contains('gap-1'))
    const next = list && !list.querySelector('[data-slot="sidebar-inbox"]') ? list : null
    if (next !== current) { current = next; change(next) }
    if (!header) { watch.observe(document.body,{childList:true, subtree:true}); return }
    // Follow only the shell's direct structural children. Streaming transcript
    // tokens never reach this observer.
    const ancestors = new Set()
    for (const node of [header,shellRow,mount,portal,list]) {
      for (let el = node; el && !ancestors.has(el); el = el.parentElement) ancestors.add(el)
    }
    for (const node of ancestors) watch.observe(node,{childList:true})
  }
  locate()
  return () => { watch.disconnect(); cancelAnimationFrame(pending) }
}
