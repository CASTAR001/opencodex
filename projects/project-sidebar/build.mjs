import { build } from 'esbuild'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('.',import.meta.url))
const bundle = async (file,options) => (await build({absWorkingDir:dir,entryPoints:[file],bundle:true,
  target:'es2022',platform:'browser',write:false,loader:{'.css':'text'},...options})).outputFiles[0].text
const gui = await bundle('src/plugin.js',{format:'cjs',external:['@opencode/plugin/gui','effect','solid-js','node:os','electron']})
const demo = await bundle('preview/demo.js',{format:'iife'})
const css = await readFile(new URL('./src/tree.css',import.meta.url),'utf8')
const template = await readFile(new URL('./preview/template.html',import.meta.url),'utf8')
for (const [file,content] of [['gui-experimental.cjs',gui],['preview/index.html',
  template.replace('/* TREE */',() => css).replace('/* DEMO */',() => demo)]]) {
  const path = new URL(file,import.meta.url)
  if (!process.argv.includes('--check')) await writeFile(path,content)
  else if (await readFile(path,'utf8') !== content) throw Error('Rebuild '+file)
}
