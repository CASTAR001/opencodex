// Keep the native list scrollable for wheels, touch and keyboard. Hover changes
// only its scroll offset, never the transcript, the prompt index or the route.
const step = 10
const dwellMs = 550
const repeatMs = 140

export function edgeScroll(list, nav, closePreview) {
  const events = new AbortController()
  const options = {signal: events.signal}
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let timer, direction = 0, moving = false, edge = 0, capacity = -1
  function stop() {
    clearTimeout(timer)
    direction = 0
    if (moving) list.scrollTo({top:list.scrollTop,behavior:'instant'})
    moving = false
  }
  function sync() {
    const top = list.scrollTop
    const end = list.scrollHeight - list.clientHeight
    const before = edge > 0 && top > 0.5
    const after = edge > 0 && end - top > 0.5
    list.toggleAttribute('data-more-before', before)
    list.toggleAttribute('data-more-after', after)
    if ((direction < 0 && !before) || (direction > 0 && !after)) stop()
  }
  function size(height) {
    const slots = Math.floor(height / step)
    const resized = slots !== capacity
    if (resized) {
      stop()
      capacity = slots
      // On unusually short panels keep at least one tick outside the two fades.
      edge = step * Math.min(3, Math.max(0, Math.floor((slots - 1) / 2)))
      list.style.maxHeight = slots * step + 'px'
      list.style.setProperty('--pn-edge', edge + 'px')
    }
    return resized
  }
  function advance() {
    if (!direction || nav.inert || nav.hidden || document.hidden) return stop()
    if (!moving) { moving = true; closePreview() }
    list.scrollBy({top:direction * step,behavior:reducedMotion.matches ? 'instant' : 'smooth'})
    sync()
    if (direction) timer = setTimeout(advance, repeatMs)
  }
  function hover(event) {
    if (event.pointerType !== 'mouse' || event.buttons || nav.inert ||
        !(list.hasAttribute('data-more-before') || list.hasAttribute('data-more-after'))) return stop()
    const rect = list.getBoundingClientRect()
    let next = 0
    if (event.clientY < rect.top + edge && list.hasAttribute('data-more-before')) next = -1
    else if (event.clientY >= rect.bottom - edge && list.hasAttribute('data-more-after')) next = 1
    if (next === direction) return
    stop()
    direction = next
    if (next) timer = setTimeout(advance, dwellMs)
  }
  list.style.setProperty('--pn-step',step+'px')
  list.addEventListener('pointermove',hover,options)
  for (const event of ['pointerleave','pointerdown','pointercancel','wheel']) {
    list.addEventListener(event,stop,{...options,passive:true})
  }
  nav.addEventListener('keydown',stop,options)
  window.addEventListener('blur',stop,options)
  document.addEventListener('visibilitychange',stop,options)
  return {size,sync,stop,get moving() { return moving },dispose() { stop(); events.abort() }}
}
