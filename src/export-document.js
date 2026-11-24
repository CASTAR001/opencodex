import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'
import katex from 'katex'
import { parseDocument, projectDocument } from './document.js'

const escape = value => toHtml({type:'text',value})
const element = (tagName, properties, children=[]) => ({type:'element',tagName,properties,children})
const text = value => ({type:'text',value})
const styles = `
:root{color-scheme:light}body{max-width:47rem;margin:2.5rem auto;padding:0 1.25rem;color:#302d2b;background:white;font:16px/1.7 system-ui,sans-serif;overflow-wrap:anywhere}h1,h2,h3{line-height:1.3;break-after:avoid}h1{font-size:2em}h2{font-size:1.45em}h3{font-size:1.15em}a{color:#914816}blockquote{margin-inline:0;border-inline-start:3px solid #eea366;padding-inline-start:1em}table{border-collapse:collapse;max-width:100%}th,td{border:1px solid #ccc4bb;padding:.3em .65em;vertical-align:top}th{background:#f7f4ee}pre{white-space:pre-wrap;overflow-wrap:anywhere;padding:1em;background:#faf8f4;border:1px solid #ddd6cc;border-radius:.4em}img{max-width:100%;height:auto}math[display=block]{margin:1em auto}section[role=doc-endnotes]{border-top:1px solid #ccc;margin-top:2em}.footnote-ref{vertical-align:super;font-size:.8em}.footnote-back{margin-inline-start:.4em}
@page{size:A4;margin:17mm}@media print{body{max-width:none;margin:0;padding:0;font-size:10.5pt;line-height:1.52}thead{display:table-header-group}tr,img,math,section[role=doc-endnotes] li{break-inside:avoid}pre{box-decoration-break:clone}a{color:inherit}h1,h2,h3{page-break-after:avoid}}
`
const policy = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"
const mimeTypes = {png:'image/png',jpeg:'image/jpeg',jpg:'image/jpeg',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml'}
function resourcePath(url) {
  try {
    const path = decodeURIComponent(url)
    if (/[\\:\u0000-\u001f?#]/.test(path) || path.startsWith('/') || path.split('/').includes('..')) return
    return path.replace(/^\.\//,'')
  } catch { return }
}
export async function workspaceImage(files,url) {
  const path = resourcePath(url)
  const mime = path && mimeTypes[path.split('.').at(-1)?.toLowerCase()]
  if (!files || !mime) return
  const existing = files.get(path)
  if (!existing?.loaded) await files.sync(path,{silent:true})
  const data = files.get(path)?.content
  if (!data || data.content?.length > 12_000_000) return
  let base64 = data.content
  if (data.encoding !== 'base64') {
    if (mime !== 'image/svg+xml' || typeof base64 !== 'string') return
    const bytes = new TextEncoder().encode(base64)
    base64 = bytes.toBase64()
  }
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(base64)) return
  const src = 'data:'+mime+';base64,'+base64
  if (mime !== 'image/svg+xml') return src
  // Rasterizing SVG in image mode keeps scripted content out of all three formats.
  const img = new Image()
  img.src = src
  await img.decode()
  const canvas = document.createElement('canvas')
  const factor = Math.min(1,2048 / Math.max(img.naturalWidth,img.naturalHeight))
  canvas.width = Math.max(1,Math.round(img.naturalWidth * factor))
  canvas.height = Math.max(1,Math.round(img.naturalHeight * factor))
  canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height)
  return canvas.toDataURL()
}
export async function exportDocument(source,path,loadImage = async () => undefined) {
  const scope = 'reader-note'
  const model = projectDocument(source,scope,path,true)
  const handlers = {}
  const math = displayMode => (_,node) => {
    try {
      const html = katex.renderToString(node.value,{displayMode,output:'mathml',throwOnError:true,trust:false,maxSize:20})
      // Only include the MathML produced by KaTeX; Word imports it as editable equations.
      return {type:'raw',value:html.slice(html.indexOf('<math'),html.lastIndexOf('</math>')+7)}
    } catch {return element('code',{},[text(node.value)])}
  }
  handlers.math = math(true); handlers.inlineMath = math(false)
  handlers.code = (state,node) => /^(?:math|latex|tex)$/i.test(node.lang ?? '') ? math(true)(state,node)
    : element('pre',{},[element('code',{},[text(node.value)])])
  const images = new Map(), headings = new Set()
  async function process(node) {
    if (node.tagName === 'img') {
      const {src,alt} = node.properties
      let data
      if (resourcePath(src)) {
        if (!images.has(src)) images.set(src,Promise.resolve().then(() => loadImage(src)).catch(()=>undefined))
        data = await images.get(src)
      }
      if (!/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z\d+/=\s]+$/i.test(data ?? '')) return text(alt || '〔图片〕')
      return element('img',{src:data,alt})
    }
    if (node.tagName === 'a') {
      const href = node.properties.href ?? ''
      const ref = /^#reader-note-to-(\d+)-(\d+)$/.exec(href)
      if (ref) node.properties = {href:'#fn'+ref[1],id:'fnref'+ref[1]+'-'+ref[2],role:'doc-noteref',className:['footnote-ref']}
      else if (!/^(?:https?:\/\/|mailto:|#)/i.test(href)) delete node.properties.href
    }
    if (/^h[1-6]$/.test(node.tagName)) {
      function value(n) {return n.value ?? n.children?.map(value).join('') ?? ''}
      const slug = value(node).toLowerCase().trim().replace(/[^\p{L}\p{N}\s_-]/gu,'').replace(/\s+/g,'-') || 'section'
      let id = slug, count = 0
      while (headings.has(id)) id = slug+'-'+ ++count
      headings.add(id); node.properties.id = id
    }
    if (node.children) {
      const children = []
      for (const child of node.children) children.push(await process(child))
      node.children = children
    }
    return node
  }
  const render = async value => toHtml(await process(toHast(parseDocument(value),{handlers})),{allowDangerousHtml:true})
  let content = await render(model.body)
  if (model.notes.length) {
    const notes = []
    for (const note of model.notes) {
      const backlinks = note.references.map((_,i) => '<a class="footnote-back" role="doc-backlink" href="#fnref'+note.number+'-'+(i+1)+'">↩'+(note.references.length>1?i+1:'')+'</a>').join(' ')
      const noteHtml = await render(note.text)
      const linked = noteHtml.endsWith('</p>') ? noteHtml.slice(0,-4)+' '+backlinks+'</p>' : noteHtml+backlinks
      notes.push('<li id="fn'+note.number+'">'+linked+'</li>')
    }
    content += '<section role="doc-endnotes" class="footnotes"><h2>注释</h2><ol>'+notes.join('')+'</ol></section>'
  }
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="'+policy+'"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(path.split('/').at(-1))+'</title><style>'+styles+'</style></head><body>'+content+'</body></html>'
}
