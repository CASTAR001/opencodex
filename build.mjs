import { build } from 'esbuild'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
const result = await build({ entryPoints: ['src/entry.js'], outfile: 'dist/gui-experimental.cjs', bundle: true,
  format: 'cjs', platform: 'browser', target: 'es2022', external: ['solid-js', 'solid-js/web', '@opencode/plugin/gui', 'node:*', 'effect', 'electron'],
  loader: { '.css': 'text' }, legalComments: 'inline', metafile: true })
const packages = new Set(Object.keys(result.metafile.inputs).filter(p => p.startsWith('node_modules/')).map(p => p.split('/')[1]))
const notices = []
for (const name of [...packages].sort()) {
  const folder = path.join('node_modules', name)
  for (const file of ['license', 'LICENSE', 'LICENSE.md', 'LICENSE.txt']) {
    try { notices.push(name + '\n' + await readFile(path.join(folder, file), 'utf8')); break }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
}
await mkdir('dist', { recursive: true })
await writeFile('dist/THIRD_PARTY_NOTICES.txt', notices.join('\n\n'))
