import {onCleanup} from 'solid-js'

export function exportMenu(ctx, source, path, files) {
  const toolbar = document.createElement('div')
  toolbar.className = 'ocx-reader-export'
  const trigger = document.createElement('button')
  trigger.type = 'button'
  trigger.setAttribute('aria-label','导出为')
  trigger.setAttribute('aria-haspopup','menu')
  trigger.title = '导出为'
  trigger.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3m-4 4 4-4 4 4M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>'
  const menu = document.createElement('div')
  menu.setAttribute('role','menu'); menu.hidden = true
  let live = true
  const controls = []
  function close(focus=false) {
    menu.hidden = true; trigger.setAttribute('aria-expanded','false')
    if (focus) trigger.focus()
  }
  function show(index=0) {
    menu.hidden = false; trigger.setAttribute('aria-expanded','true'); controls.at(index).focus()
  }
  for (const [format,label] of [['html','HTML'],['pdf','PDF'],['docx','Word (.docx)']]) {
    const item = document.createElement('button')
    item.type = 'button'; item.setAttribute('role','menuitem');item.textContent=label
    item.onclick = async () => {
      close(true);trigger.disabled = true
      try {
        const name = path.split('/').at(-1).replace(/\.md$/i,'.'+format)
        const {exportDocument,workspaceImage} = require('./export-document.js')
        const html = await exportDocument(source(),path,url=>workspaceImage(files,url))
        if (!live) return
        if (format==='html') await ctx.system.save({name,content:html})
        else await ctx.main(require('./export-ipc.js').ExportIpc).save({name,html,format})
      } catch(error) {
        if(live) await ctx.dialogs.alert({title:'导出失败',description:error?.message || String(error)})
      } finally {trigger.disabled = false}
    }
    controls.push(item);menu.append(item)
  }
  trigger.onclick = () => menu.hidden ? show() : close()
  toolbar.onkeydown = e => {
    if(e.key==='Escape' && !menu.hidden){ e.preventDefault(); e.stopPropagation(); close(true); return }
    if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return
    e.preventDefault();e.stopPropagation()
    const i = controls.indexOf(document.activeElement)
    if(e.key==='Home')show()
    else if(e.key==='End')show(-1)
    else show(i<0?(e.key==='ArrowDown'?0:-1):(i+controls.length+(e.key==='ArrowDown'?1:-1))%controls.length)
  }
  toolbar.onfocusout = e => {if (!toolbar.contains(e.relatedTarget))close()}
  const outside = e => {if(!menu.hidden && !toolbar.contains(e.target))close()}
  document.addEventListener('pointerdown',outside,true)
  onCleanup(()=>{live=false;document.removeEventListener('pointerdown',outside,true)})
  toolbar.append(trigger,menu);close()
  return toolbar
}
