import {projectGroups} from '../src/model.js'
import {createTree} from '../src/tree.js'

const home = '/Users/demo'
const projects = [
  ['ui','/Users/demo/work/opencodex','审计 OpenCode UI 插件可行性','先看一下侧边标签页能提供哪些接口。','侧边标签页可以按项目组织会话。展开左侧的文件夹，就能直接打开这个目录下的讨论。'],
  ['pre','/Users/demo/work/pre-design'],
  ['skills','/Users/demo/work/agentskills','初始化两份全局技能仓库','整理可复用的技能目录。','两份技能仓库已经分别建立索引，可以按用途查看。'],
  ['gift','/Users/demo/studio/sunup-gift','继续东异聚变文创项目','沿着上一版草图继续。','这次从包装的展开方式开始，保留草图里折页的结构。'],
  ['notes','/Users/demo/notes/obsidian','适配 Obsidian 的 macOS 迁移','检查笔记库迁移后使用的路径。','已将附件、模板和笔记放在同一目录下，可以逐项核对。'],
  ['archive','/Volumes/Archive/fieldwork/2026/autumn/opencodex','整理归档版本的变更','这里是同名的另一个仓库。','这个会话位于外置卷的归档目录，和工作目录中的同名仓库分别显示。'],
]
let active = {server:'sidecar',id:'s-ui'}
let counter = 0
const sessions = projects.filter(row => row[2]).map(([id,path,title],i) => ({
  id:'s-'+id,title,projectID:id,location:{directory:path},time:{updated:50-i},
}))
const groups = () => projectGroups([{id:'sidecar',name:'本机',home,projects:projects.map(([id,canonical]) => ({id,canonical})),known:sessions,history:[]}])
const $ = s => document.querySelector(s)
const native = $('#native'), dialog = $('dialog')
const tree = createTree({open:select,native:() => {tree.root.hidden = true;native.hidden = false;drawNative()}})
$('aside').append(tree.root)
function link(container,text,fn) {
  const node = document.createElement('button')
  node.textContent = text
  node.onclick = fn
  container.append(node)
}
function drawNative() {
  native.replaceChildren()
  link(native,'返回项目树',() => {native.hidden = true;tree.root.hidden = false})
  const heading = document.createElement('p')
  heading.className = 'native-title'
  heading.textContent = '打开的标签页'
  native.append(heading)
  for (const row of sessions) link(native,row.title,() => select('sidecar',row.id))
}
function select(server,id) {
  const session = sessions.find(row => row.id === id)
  if (!session) return
  active = {server,id}
  const group = groups().find(g => g.sessions.some(s => s.id === id))
  const source = projects.find(row => row[0] === session.projectID)
  $('#crumb').textContent = group.label
  $('#subtitle').textContent = $('h1').textContent = session.title
  const original = id === 's-' + source[0]
  $('.bubble').textContent = original ? source[3] : '开始一个新会话。'
  $('#answer').textContent = original ? source[4] : '这个会话已加入左侧对应的项目。'
  tree.update(groups(),active)
  if (!native.hidden) drawNative()
}
function search() {
  const results = $('#results')
  results.replaceChildren()
  const match = $('input').value.toLowerCase()
  for (const row of sessions.filter(row => row.title.toLowerCase().includes(match))) {
    link(results,row.title,() => {dialog.close();select('sidecar',row.id)})
  }
  if (!results.children.length) results.textContent = '未找到会话'
}
$('#search').onclick = () => { $('input').value = ''; search(); dialog.showModal(); $('input').focus() }
$('input').oninput = search
dialog.addEventListener('click',e => {if (e.target === dialog) dialog.close()})
$('#new').onclick = () => {
  const parent = sessions.find(row => row.id === active.id)
  const id = 'draft-'+ ++counter
  sessions.unshift({...parent,id,title:'新会话 '+counter,time:{updated:100+counter}})
  select('sidecar',id)
}
select(active.server,active.id)
