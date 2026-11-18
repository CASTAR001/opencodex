import { Plugin, Panel, MenuItem, Style } from '@opencode/plugin/gui'
import { panel } from './panel.js'
import { en, zh } from './labels.js'
import css from './panel.css'

export default Plugin.define({
  i18n: { en, zh },
  setup(ctx) {
    const tab = { id: 'metrics', get title() { return ctx.t('title') } }
    ctx.add(Style, css)
    ctx.add(Panel, {
      id: tab.id, region: 'side', width: 320,
      mobile: { get title() { return tab.title }, kind: 'menu', order: 55, icon: 'status' },
      list: ({ open }) => open.includes(tab.id) ? [tab] : [],
      render: props => panel(ctx, props),
    })
    ctx.add(MenuItem, {
      menu: 'session.panel', id: 'open', get title() { return tab.title }, icon: 'status', order: 55,
      run() {
        const session = ctx.sessions.current()
        if (session) ctx.layout.open(ctx.id + ':' + tab.id, session)
      },
    })
  },
})
