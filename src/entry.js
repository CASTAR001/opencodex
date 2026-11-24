import { Plugin, Slot, Style } from '@opencode/plugin/gui'
import { createEffect, onCleanup } from 'solid-js'
import css from './body.css'

export default Plugin.define({setup(ctx) {
  ctx.add(Style, css)
  ctx.add(Slot, {at:'window.bottom', render() {
    createEffect(() => {
      const session = ctx.sessions.current()
      if (!session || session.pending) return
      const { watch } = require('./watch.js')
      onCleanup(watch(session))
    })
    return null
  }})
}})
