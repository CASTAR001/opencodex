import { Plugin, Slot, Store, Style } from '@opencode/plugin/gui'
import { Schema } from 'effect'
import { createEffect, createSignal, on, onCleanup } from 'solid-js'
import { historyIndex, mergePrompts, promptRow } from './model.js'
import { createRail } from './rail.js'
import css from './rail.css'

const paneSelector = '[data-slot="session-chat-panel"]'
const viewportSelector = '[data-slot="session-timeline-scroll"] > [data-scrollable]'

// Only this adapter knows the Desktop frame and virtual row attributes. Own no transcript nodes.
function mount(ctx, session, marker) {
  const host = marker.closest(paneSelector)
  if (!host) return
  const frame = [...host.children].find(child => child.contains(marker))
  if (!frame || host.querySelector(':scope > .ocx-prompt-nav')) return
  const id = session.id
  const data = session.server.data.session
  const store = ctx.stores.bookmarks(session)
  const [prefix, setPrefix] = createSignal([])
  const [status, setStatus] = createSignal('loading')
  const [jumpState, setJumpState] = createSignal('')
  const [retry, setRetry] = createSignal(0)
  let lastJump
  let seeking
  let sampleFrame = 0
  let repeatFrame = 0
  const rail = createRail({
    href: target => ctx.router.path() + '#message-' + encodeURIComponent(target),
    star: target => store.update(draft => {
      if (draft.ids.includes(target)) draft.ids = draft.ids.filter(id => id !== target)
      else draft.ids.push(target)
    }),
    retry: () => setRetry(n => n+1),
    async jump(target, event, link) {
      event.preventDefault()
      if (!ctx.router.path() || ctx.sessions.current()?.key !== session.key) return
      seeking?.abort()
      const controller = new AbortController()
      seeking = controller
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(60000)])
      cancelAnimationFrame(repeatFrame)
      // Follow the native jump dialog: load only to the target, then give its ID to the virtualizer.
      try {
        if (!data.message.get(id,target)) setJumpState('opening')
        while (!data.message.get(id,target)) {
          if (!data.message.more(id)) throw new Error('Prompt unavailable')
          const first = data.message.list(id)[0]?.id
          await data.message.loadMore(id,{signal})
          signal.throwIfAborted()
          if (first === data.message.list(id)[0]?.id && !data.message.get(id,target))
            throw new Error('History did not advance')
        }
      } catch {
        if (!controller.signal.aborted) setJumpState('miss')
        return
      }
      if (signal.aborted || !link.isConnected || ctx.sessions.current()?.key !== session.key) return
      setJumpState('')
      function navigate(href) {
        const bridge = document.createElement('a')
        bridge.href = href
        bridge.setAttribute('replace','')
        bridge.setAttribute('noscroll','')
        bridge.hidden = true
        host.append(bridge)
        bridge.click()
        bridge.remove()
      }
      if (lastJump === target) {
        navigate(ctx.router.path() + '#ocx-prompt-navigation')
        repeatFrame = requestAnimationFrame(() => { if (!signal.aborted) navigate(link.href) })
      } else navigate(link.href)
      lastJump = target
      rail.current(target)
    },
  })
  host.append(rail.nav)
  const stopGutter = rail.observeGutter(host,frame,() =>
    frame.querySelector('[data-timeline-virtual-content] [data-timeline-row][data-message-id]'))
  function sample() {
    sampleFrame = 0
    const viewport = marker.closest('[data-scrollable]') ||
      [...frame.querySelectorAll(viewportSelector)].find(el => el.clientHeight && el.checkVisibility())
    if (!viewport) return
    const box = viewport.getBoundingClientRect()
    let found
    for (const node of viewport.querySelectorAll('[data-message-id]')) {
      const row = node.getBoundingClientRect()
      if (row.height && row.top <= box.top + 100) found = node.dataset.messageId
      else if (!found && row.height && row.top < box.bottom) { found = node.dataset.messageId; break }
    }
    if (found) rail.current(found)
  }
  function schedule() { if (!sampleFrame) sampleFrame = requestAnimationFrame(sample) }
  function scrolling(e) { if (e.target.matches?.(viewportSelector)) schedule() }
  function outside(e) { if (!rail.nav.contains(e.target)) rail.close() }
  frame.addEventListener('scroll',scrolling,true)
  host.addEventListener('pointerdown',outside)
  createEffect(on(retry, () => {
    const cancel = new AbortController()
    onCleanup(() => cancel.abort())
    setStatus('loading')
    async function read() {
      await data.message.sync(id)
      cancel.signal.throwIfAborted()
      if (data.message.more(id)) setPrefix(await historyIndex(session.server.client,id,cancel.signal))
      if (!cancel.signal.aborted) setStatus('ready')
    }
    read().catch(() => { if (!cancel.signal.aborted) setStatus('error') })
  }))
  createEffect(() => {
    const recent = data.message.list(id).filter(m => m.type === 'user').map(promptRow).filter(Boolean)
    const rows = mergePrompts(prefix(),recent,data.input.list(id),data.get(id)?.revert?.messageID)
    rail.update(rows,store.value?.ids ?? [],jumpState() || status())
    schedule()
  })
  onCleanup(() => {
    cancelAnimationFrame(sampleFrame)
    seeking?.abort()
    cancelAnimationFrame(repeatFrame)
    stopGutter()
    frame.removeEventListener('scroll',scrolling,true)
    host.removeEventListener('pointerdown',outside)
    rail.dispose()
    rail.nav.remove()
  })
}
export default Plugin.define({
  stores: { bookmarks: Store.session(Schema.Struct({ids: Schema.Array(Schema.String)}), {ids: []}) },
  setup(ctx) {
    ctx.add(Style,css)
    // Under 768px Desktop replaces the session header with its mobile location bar.
    ctx.add(Slot,{at:'window.bottom',render() {
      const marker = document.createElement('span')
      marker.hidden = true
      createEffect(on(() => ctx.layout.narrow() && ctx.sessions.current(), session => {
        if (!session || session.pending) return
        const [bar,setBar] = createSignal()
        function locate() {
          const candidate = document.querySelector(paneSelector+' [data-slot="session-location-bar"]')
          if (candidate) { observer.disconnect(); setBar(candidate) }
        }
        const observer = new MutationObserver(locate)
        observer.observe(document.body,{subtree:true,childList:true})
        const tick = requestAnimationFrame(locate)
        onCleanup(() => { cancelAnimationFrame(tick); observer.disconnect() })
        createEffect(on(bar, el => { if (el) mount(ctx,session,el) }))
      }))
      return marker
    }})
    ctx.add(Slot,{at:'session.header',render(input) {
      const marker = document.createElement('span')
      marker.hidden = true
      const [ready,setReady] = createSignal(false)
      // A slot's children can be built before Solid attaches the session frame.
      const frame = requestAnimationFrame(() => setReady(true))
      onCleanup(() => cancelAnimationFrame(frame))
      createEffect(on(() => ready() && input.active && !input.session.pending && input.session, session => {
        if (session) mount(ctx,session,marker)
      }))
      return marker
    }})
  },
})
