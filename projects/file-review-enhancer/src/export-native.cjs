const {spawn} = require('node:child_process')
const {open,rename,unlink,access} = require('node:fs/promises')
const {constants} = require('node:fs')
const {randomUUID} = require('node:crypto')
const path = require('node:path')
const os = require('node:os')

async function pandocPath() {
  const candidates = process.platform === 'win32'
    ? [process.env.ProgramFiles,process.env.LOCALAPPDATA].filter(Boolean).map(p=>path.join(p,'Pandoc','pandoc.exe'))
    : ['/opt/homebrew/bin/pandoc','/usr/local/bin/pandoc','/usr/bin/pandoc']
  const exe = process.platform === 'win32' ? 'pandoc.exe' : 'pandoc'
  candidates.push(...(process.env.PATH || '').split(path.delimiter).filter(p=>path.isAbsolute(p)).map(p=>path.join(p,exe)))
  for (const file of candidates) {
    try {await access(file,constants.X_OK);return file} catch {}
  }
  throw Error('Word 导出需要本机安装 Pandoc。')
}
function convert(exe,from,to,input,signal) {
  return new Promise((resolve,reject) => {
    const child = spawn(exe,['--sandbox','--from='+from,'--to='+to],{cwd:os.tmpdir(),windowsHide:true,signal,stdio:['pipe','pipe','ignore']})
    const parts = []
    child.once('error',reject)
    child.stdout.on('data',data=>parts.push(data))
    child.stdin.on('error',error=>{if(error.code!=='EPIPE')reject(error)})
    const timer = setTimeout(()=>child.kill(),60000)
    child.once('close',code=>{clearTimeout(timer); if(code===0) resolve(Buffer.concat(parts)); else reject(Error('Pandoc 未能完成 Word 转换。'))})
    child.stdin.end(input)
  })
}
async function word(html,signal) {
  const exe = await pandocPath()
  // Pandoc normally allocates a new Word footnote for every occurrence. Keep an
  // addressable Word bookmark on the first note and cross-reference it thereafter.
  const marked = html.replace(/<a href="#fn(\d+)" id="fnref\1-(\d+)" role="doc-noteref"[^>]*>\d+<\/a>/g,
    (anchor,number,occurrence) => '<span id="ocxnote'+number+'at'+occurrence+'">'+anchor+'</span>')
    .replace('<section role="doc-endnotes" class="footnotes"><h2>注释</h2>', '<section role="doc-endnotes" class="footnotes">')
  const doc = JSON.parse(await convert(exe,'html','json',marked,signal))
  delete doc.meta.title
  function visit(node) {
    if (!node || typeof node !== 'object') return
    if (node.t === 'Span' && node.c[1][0]?.t === 'Note') {
      const ref = /^ocxnote(\d+)at(\d+)$/.exec(node.c[0][0])
      if (ref && ref[2] === '1') {
        const bookmark = 1000000000 + Number(ref[1])
        node.c[0][0] = ''
        node.c[1].unshift({t:'RawInline',c:['openxml','<w:bookmarkStart w:id="'+bookmark+'" w:name="ocxnote'+ref[1]+'at1"/>']})
        node.c[1].push({t:'RawInline',c:['openxml','<w:bookmarkEnd w:id="'+bookmark+'"/>']})
      }
      if (ref && ref[2] !== '1') {
        node.t = 'RawInline'
        node.c = ['openxml','<w:fldSimple w:instr=" NOTEREF ocxnote'+ref[1]+'at1 \\h \\f "><w:r><w:rPr><w:rStyle w:val="FootnoteReference"/></w:rPr><w:t>'+ref[1]+'</w:t></w:r></w:fldSimple>']
        return
      }
    }
    for (const child of Object.values(node)) visit(child)
  }
  visit(doc.blocks)
  return convert(exe,'json','docx',JSON.stringify(doc),signal)
}
// Electron keeps partitions alive for the process lifetime. Reuse one memory-only
// partition and serve only the active, unguessable document URLs, including large images.
let printSession
const pages = new Map()
function printer() {
  if (printSession) return printSession
  printSession = require('electron').session.fromPartition('ocx-reader-print-'+randomUUID(),{cache:false})
  printSession.protocol.handle('https', req => {
    const html = pages.get(req.url)
    return html === undefined ? new Response(null,{status:404}) :
      new Response(html,{headers:{'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store',
        'Content-Security-Policy':"default-src 'none'; img-src data:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"}})
  })
  printSession.webRequest.onBeforeRequest((req,done)=>done({cancel:!(pages.has(req.url) || req.url.startsWith('data:'))}))
  printSession.setPermissionRequestHandler((_wc,_perm,callback)=>callback(false))
  return printSession
}
async function pdf(html,signal) {
  const {BrowserWindow} = require('electron')
  signal.throwIfAborted()
  const win = new BrowserWindow({show:false,webPreferences:{session:printer(),sandbox:true,nodeIntegration:false,contextIsolation:true,javascript:false,webSecurity:true}})
  const url = 'https://export.invalid/'+randomUUID()
  pages.set(url,html)
  const stop = () => {if(!win.isDestroyed())win.destroy()}
  signal.addEventListener('abort',stop,{once:true})
  try {
    win.webContents.setWindowOpenHandler(()=>({action:'deny'}))
    await win.loadURL(url)
    return await win.webContents.printToPDF({pageSize:'A4',preferCSSPageSize:true,printBackground:true})
  } finally {signal.removeEventListener('abort',stop);pages.delete(url);stop()}
}
async function writeAtomic(file,bytes) {
  const tmp = path.join(path.dirname(file),'.ocx-export-'+randomUUID()+'.tmp')
  const handle = await open(tmp,'wx',0o600)
  try {
    try { await handle.writeFile(bytes) } finally { await handle.close() }
    await rename(tmp,file)
  } finally {await unlink(tmp).catch(error=>{if(error.code!=='ENOENT')throw error})}
}
function register(ctx,token) {
  const {dialog} = require('electron')
  const busy = new Set()
  ctx.provide(token,{async save({name,html,format},caller) {
    if (!['pdf','docx'].includes(format) || html.length>48_000_000) throw Error('不支持的导出格式或文档过大。')
    const parent = ctx.windows.get(caller.window)
    if (!parent || busy.has(caller.window)) return false
    busy.add(caller.window)
    try {
      const filename = path.basename(name).replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_')
      const res = await dialog.showSaveDialog(parent,{defaultPath:filename,filters:[{name:format.toUpperCase(),extensions:[format]}]})
      if (res.canceled || !res.filePath) return false
      if (path.extname(res.filePath).toLowerCase()!=='.'+format) throw Error('请使用 .'+format+' 扩展名。')
      caller.signal.throwIfAborted()
      const bytes = await (format==='pdf'?pdf:word)(html,caller.signal)
      caller.signal.throwIfAborted()
      await writeAtomic(res.filePath,bytes)
      return true
    } finally {busy.delete(caller.window)}
  }})
}
module.exports = {register,word,pdf,writeAtomic}
