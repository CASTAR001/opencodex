import { build } from 'esbuild'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('.', import.meta.url))
const target = new URL('gui-experimental.cjs', import.meta.url)
const result = await build({ absWorkingDir: root, entryPoints: ['src/plugin.js'], bundle: true,
  external: ['@opencode/plugin/gui', 'effect', 'solid-js'], platform: 'browser', format: 'cjs',
  loader: { '.css': 'text' }, write: false, target: 'es2022' })
const bundle = result.outputFiles[0].text
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== bundle) throw Error('Run npm run build to update the GUI bundle')
} else await writeFile(target, bundle)
