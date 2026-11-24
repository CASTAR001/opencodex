import { Plugin } from '@opencode/plugin/gui'

export default Plugin.define({
  main(ctx) {
    require('./export-native.cjs').register(ctx, require('./export-ipc.js').ExportIpc)
  },
  setup(ctx) {
    // Desktop also evaluates this bundle in Electron main. Load the bundled
    // Markdown parser and its browser entity decoder only in window setup.
    require('./plugin.js').registerReader(ctx)
  },
})
