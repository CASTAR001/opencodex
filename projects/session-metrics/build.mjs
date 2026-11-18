import { build } from 'esbuild'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
const root = fileURLToPath(new URL('.', import.meta.url))
const target = new URL('gui-experimental.cjs', import.meta.url)
const worker = await build({ absWorkingDir: root, entryPoints: ['src/tokenizer.worker.js'], bundle: true,
  platform: 'browser', format: 'iife', minify: true, write: false, target: 'es2022' })
const packed = gzipSync(worker.outputFiles[0].contents, { level: 9 }).toString('base64')
const result = await build({ absWorkingDir: root, entryPoints: ['src/plugin.js'], bundle: true,
  define: { __OCX_WORKER_GZIP__: JSON.stringify(packed) }, external: ['@opencode/plugin/gui', 'solid-js'], platform: 'browser', format: 'cjs',
  loader: { '.css': 'text' }, write: false, target: 'es2022' })
const bundle = result.outputFiles[0].text
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8') !== bundle) throw Error('Run npm run build to update the GUI bundle')
} else await writeFile(target, bundle)
