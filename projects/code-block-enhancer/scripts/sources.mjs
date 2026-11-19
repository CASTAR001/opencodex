import { readFileSync } from 'node:fs'
const root = new URL('../', import.meta.url)
export const read = name => readFileSync(new URL(name, root), 'utf8')
export function controlsSource() {
  return read('src/controls.cjs').replace("const { parsePatch, createPatchView } = require('./patch.cjs')",
    () => read('src/patch.cjs').replace('module.exports = { parsePatch, createPatchView }', ''))
}
