import { Plugin } from '@opencode/plugin/gui'

export default Plugin.define({
  setup(ctx) {
    // Desktop also evaluates this bundle in Electron main. Load the bundled
    // Markdown parser and its browser entity decoder only in window setup.
    require('./plugin.js').registerReader(ctx)
  },
})
