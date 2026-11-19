import { createRail } from '../src/rail.js'
import { prompts, replies, title } from './conversation.js'

const stage = document.querySelector('main')
const paper = document.querySelector('article')
document.querySelector('h1').textContent = title
const labels = [...prompts,...Array.from({length:40},(_,i)=>'复核第 '+(i+1)+' 组海岸样本。')]
const rows = labels.map((label,index)=>({label,id:'prompt-'+(index+1)}))
const key = 'ocx-prompt-nav-offline-example-v1'
let saved
try { saved = JSON.parse(localStorage.getItem(key)) } catch { /* Private browsing may be read-only. */ }
if (!Array.isArray(saved)) saved = [rows[0].id,rows[4].id,rows[8].id]
const sections = new Map()
const rail = createRail({
  href: id => '#'+id,
  jump(id,event) { event.preventDefault(); paper.scrollTop += sections.get(id).getBoundingClientRect().top - paper.getBoundingClientRect().top - 20; rail.current(id) },
  star(id) {
    saved = saved.includes(id) ? saved.filter(other=>id!==other) : [...saved,id]
    try { localStorage.setItem(key,JSON.stringify(saved)) } catch {}
    rail.update(rows,saved,'ready')
  },
  retry() {},
})
function add(parent,tag,text,cls) {
  const box = document.createElement(tag)
  box.textContent = text
  if (cls) box.className = cls
  parent.append(box)
  return box
}
for (const [i, row] of rows.entries()) {
  const s = add(paper,'section','')
  s.id = row.id
  sections.set(row.id,s)
  add(s,'p',row.label,'prompt')
  if (i===5) continue
  for (const block of replies[i%replies.length].split('\n\n')) {
    if (block.startsWith('## ')) add(s,'h2',block.slice(3))
    else if (block.startsWith('|')) {
      const table=add(s,'table','')
      for (const [j,line] of block.split('\n').entries()) {
        if(j===1) continue
        const tr=add(table,'tr','')
        for(const cell of line.slice(1,-1).split('|')) add(tr,j?'td':'th',cell.trim())
      }
    } else add(s,'p',block)
  }
}
stage.append(rail.nav)
rail.update(rows,saved,'ready')
rail.observeGutter(stage,paper,()=>paper.querySelector('section'))
document.addEventListener('pointerdown',e=>{if (!rail.nav.contains(e.target)) rail.close()})
function track() {
  const line = paper.getBoundingClientRect().top+42
  let id = rows[0].id
  for (const [key,el] of sections) { if(el.getBoundingClientRect().top>line) break; id=key }
  rail.current(id)
}
paper.addEventListener('scroll',track,{passive:true})
track()
