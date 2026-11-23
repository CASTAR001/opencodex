const { Plugin, Slot } = require('@opencode/plugin/gui')
const { onCleanup } = require('solid-js')

exports.default = Plugin.define({
  setup(ctx) {
    // Only this release's transcript and toggle markup have been verified.
    if (ctx.app.platform !== 'desktop' || ctx.app.version !== '2.3.2') return
    ctx.add(Slot, { at: 'window.bottom', render() {
      function reveal(event) {
        if (!event.isTrusted || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
        if (event.type === 'click' ? event.button !== 0 : event.key !== 'Enter' || event.repeat) return
        const target = event.target
        if (!(target instanceof Element)) return
        const link = target.closest('a[data-local-link], :not(pre) > code[data-inline-code-kind="path"]')
        const chat = link?.closest('[data-component="markdown"]')?.closest('[data-slot="session-chat-panel"]')
        if (!chat || ctx.layout.narrow() || link.closest('[inert], [aria-hidden="true"]')) return
        const session = ctx.sessions.current()
        if (!session) return
        const toggle = chat.closest('[data-pane-row]')?.querySelector('[data-slot="session-review-toggle"] button[aria-controls="review-panel"]')
        // The shell can report "closed" for preview sessions even when the pane is open.
        if (toggle?.getAttribute('aria-expanded') !== 'false') return
        if (!event.defaultPrevented) {
          // The sanitized anchor can be visible before its Markdown listener attaches.
          if (event.type === 'keydown' && !link.matches('a[data-local-link]')) return
          const href = link.dataset.localLink ?? link.textContent.trim()
          if (!href || !ctx.links.open({ href, session })) return
          event.preventDefault()
        }
        if (toggle.getAttribute('aria-expanded') === 'false') ctx.commands.run('review.toggle')
      }
      // Let the native Markdown handler take the gesture first.
      document.addEventListener('click', reveal)
      document.addEventListener('keydown', reveal)
      onCleanup(() => {
        document.removeEventListener('click', reveal)
        document.removeEventListener('keydown', reveal)
      })
      return null
    } })
  },
})
