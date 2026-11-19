import { build } from 'esbuild'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const dir=new URL('../preview/',import.meta.url)
const compiled=await build({entryPoints:[fileURLToPath(new URL('./demo.js',import.meta.url))],bundle:true,format:'iife',write:false})
const css=await readFile(new URL('../src/rail.css',import.meta.url),'utf8')
const shell=await readFile(new URL('./shell.html',import.meta.url),'utf8')
await mkdir(dir,{recursive:true})
await writeFile(new URL('index.html',dir),shell.replace('/* RAIL */',()=>css).replace('/* DEMO */',()=>compiled.outputFiles[0].text))
