const { Plugin, Slot } = require('@opencode/plugin/gui')
const { onCleanup } = require('solid-js')

exports.default = Plugin.define({
  setup(ctx) {
    // Only this release's transcript and toggle markup have been verified.
    if (ctx.app.platform !== 'desktop' || ctx.app.version !== '2.3.2') return
    ctx.add(Slot, { at: 'window.bottom', render() {
      let frame
      let generation = 0
      function reveal(event) {
        if (!event.isTrusted || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
        if (event.type === 'click' ? event.button !== 0 : event.key !== 'Enter' || event.repeat) return
        const target = event.target
        if (!(target instanceof Element)) return
        const link = target.closest('a[data-local-link], :not(pre) > code[data-inline-code-kind="path"]')
        const chat = link?.closest('[data-component="markdown"]')?.closest('[data-slot="session-chat-panel"]')
        if (!chat || ctx.layout.narrow() || link.closest('[inert], [aria-hidden="true"]')) return
        const session = ctx.sessions.current()
        if (!session) return
        const click = ++generation
        cancelAnimationFrame(frame)
        const toggle = chat.closest('[data-pane-row]')?.querySelector('[data-slot="session-review-toggle"] button[aria-controls="review-panel"]')
        // The shell can report "closed" for preview sessions even when the pane is open.
        if (toggle?.getAttribute('aria-expanded') !== 'false') return
        if (event.type === 'keydown' && !link.matches('a[data-local-link]')) return
        const href = link.dataset.localLink ?? link.textContent.trim()
        if (!href || !ctx.commands.run('review.toggle')) return
        // Markdown honors defaultPrevented. Give a single open to the screen after the
        // layout change: the native file resolver discards work started on an older screen.
        event.preventDefault()
        frame = requestAnimationFrame(async () => {
          const current = ctx.sessions.current()
          if (current?.key !== session.key) return
          const file = ctx.screen.current()?.file
          // Use the same exact-open route as the native file picker when the literal
          // file exists. Otherwise let Desktop resolve basename matches and line links.
          const literal = !/[:#?%~\\]|^\/\/|\.html?$/i.test(href)
          let exact = false
          if (file && literal) {
            try { exact = await file.exists(file.resolve(href)) } catch { /* Use normal resolution. */ }
          }
          if (click !== generation || ctx.sessions.current()?.key !== session.key ||
              !toggle.isConnected || toggle.getAttribute('aria-expanded') !== 'true') return
          ctx.links.open({ href, session: current, exact })
        })
      }
      document.addEventListener('click', reveal, true)
      document.addEventListener('keydown', reveal, true)
      onCleanup(() => {
        generation++
        cancelAnimationFrame(frame)
        document.removeEventListener('click', reveal, true)
        document.removeEventListener('keydown', reveal, true)
      })
      return null
    } })
  },
})
