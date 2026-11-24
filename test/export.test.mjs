import test from 'node:test'
import assert from 'node:assert/strict'
import {projectDocument} from '../src/document.js'
import {exportDocument} from '../src/export-document.js'
import {writeAtomic} from '../src/export-native.cjs'
import {readFile,writeFile,mkdtemp,rm,readdir} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'

test('sidebar corrects CJK boundaries only on the viewing projection',()=>{
  assert.equal(projectDocument('**结论。**紧接','n').body,'<strong>结论。</strong>紧接')
  assert.match(projectDocument('https://example.org/资料。下一句','n').body,/<https:\/\/example.org\/资料>\)。下一句/)
  for(const s of ['`**结论。**紧接`','\\*\\*结论。\\*\\*紧接','[命名](https://example.org/中文。下一句)'])
    assert.equal(projectDocument(s,'n').body,s)
})
test('export keeps semantic math, original code, repeated notes and safe offline resources',async()=>{
  const seen=[]
  const md='**结论。**紧接 $a^2$[^n] 和第二次[^n]\n\n![本地](a.png) ![外部](https://example.org/p.png) ![上层](../../outside.png)\n\n<script>alert(1)</script>\n\n```diff\n-old\n+new\n```\n\n[^n]: 说明'
  const html=await exportDocument(md,'docs/n.md',async url=>{seen.push(url);return 'data:image/png;base64,aQ=='})
  assert.deepEqual(seen,['docs/a.png'])
  for(const expected of ['<strong>结论。</strong>紧接','<math ','id="fnref1-2"','href="#fnref1-2"','<pre><code>-old\n+new','src="data:image/png;','外部','上层'])
    assert.ok(html.includes(expected),expected)
  assert.doesNotMatch(html,/<script|https:\/\/example.org|outside.png/)
})
test('saving over an existing destination leaves only the selected complete file',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'reader-write-'))
  try{
    const file=path.join(dir,'document.docx')
    await writeFile(file,'old');await writeAtomic(file,Buffer.from('new'))
    assert.equal(await readFile(file,'utf8'),'new')
    assert.deepEqual(await readdir(dir),['document.docx'])
  }finally{await rm(dir,{recursive:true,force:true})}
})
