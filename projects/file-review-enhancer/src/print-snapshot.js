// Freeze the visible reader at export time. The detached document never imports a
// host stylesheet or executes article markup. All boxes can paginate independently.
const htmlTags = new Set(('article section div span p h1 h2 h3 h4 h5 h6 header footer aside blockquote pre code kbd samp var b strong i em s del u mark sub sup small a ul ol li dl dt dd table caption thead tbody tfoot tr td th col colgroup hr br wbr img input details summary figure figcaption abbr time bdi bdo').split(' '))
const svgTags = new Set('svg g path rect circle ellipse line polyline polygon title desc'.split(' '))
const skip = 'button,[role="button"]:not(img),[data-slot="markdown-code-toolbar"],[data-slot="markdown-code-actions"],[data-slot="markdown-copy-button"],[data-ocx-scroll-track],[data-ocx-code-gutter],.katex-mathml'
const paint = ('display box-sizing position top right bottom left vertical-align float clear padding margin border border-top border-right border-bottom border-left border-radius border-collapse border-spacing table-layout caption-side background-color color opacity box-shadow ' +
  'font-family font-size font-weight font-style font-stretch font-variant font-feature-settings font-variation-settings font-kerning font-optical-sizing line-height letter-spacing word-spacing text-align text-indent text-transform text-decoration text-underline-offset text-wrap-style white-space overflow-wrap word-break hyphens direction writing-mode tab-size list-style-type list-style-position ' +
  'align-items align-self justify-content justify-items justify-self gap flex-direction flex-wrap flex-grow flex-shrink flex-basis grid-template-columns grid-template-rows grid-column grid-row transform transform-origin aspect-ratio object-fit appearance accent-color background-image background-size background-position background-repeat mask-image mask-size mask-position mask-repeat fill stroke stroke-width stroke-linecap stroke-linejoin').split(' ')
const unquote = s => s.trim().replace(/^(['"])(.*)\1$/, '$2')
const fontKey = s => unquote(s).toLowerCase()
const printableFont = /^[\w-][\w.-]*\.(?:woff2?|otf|ttf)$/i

function fontStyles(doc, families) {
  const faces = new Set()
  function visit(rules, base) {
    for (const rule of rules) {
      if (rule.type !== CSSRule.FONT_FACE_RULE) {
        if (rule.cssRules) visit(rule.cssRules, base)
        continue
      }
      const {style} = rule
      if (!families.has(fontKey(style.fontFamily))) continue
      const sources = []
      // Preserve the local aliases' unicode ranges and individual bold/italic faces.
      for (const part of style.getPropertyValue('src').matchAll(/(local|url)\(("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|[^)]*)\)/gi)) {
        if (part[1].toLowerCase() === 'local') { sources.push(part[0]); continue }
        try {
          const url = new URL(unquote(part[2]), base)
          const name = url.pathname.split('/').pop()
          if (url.origin === doc.location.origin && url.pathname.includes('/assets/') && printableFont.test(name))
            sources.push('url("/fonts/' + name + '")')
        } catch { /* Ignore unresolved and non-bundled resources. */ }
      }
      if (!sources.length) continue
      const descriptors = ['font-family','font-weight','font-style','font-stretch','unicode-range','size-adjust','ascent-override','descent-override','line-gap-override']
      faces.add('@font-face{' + descriptors.map(k => style.getPropertyValue(k) ? k+':'+style.getPropertyValue(k)+';' : '').join('') + 'src:'+sources.join(',')+';}')
    }
  }
  for (const sheet of [...doc.styleSheets,...doc.adoptedStyleSheets]) {
    try { visit(sheet.cssRules, sheet.href || doc.baseURI) } catch { /* Opaque external stylesheets cannot be read. */ }
  }
  return [...faces].join('\n')
}

function bitmap(img) {
  if (!img.complete || !img.naturalWidth) return
  if (/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z\d+/=\s]+$/i.test(img.currentSrc)) return img.currentSrc
  const scale = Math.min(1, 3072 / Math.max(img.naturalWidth,img.naturalHeight))
  const canvas = img.ownerDocument.createElement('canvas')
  canvas.width = Math.max(1,Math.round(img.naturalWidth*scale))
  canvas.height = Math.max(1,Math.round(img.naturalHeight*scale))
  try {
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height)
    return canvas.toDataURL('image/png')
  } catch { /* Cross-origin images can disallow reading their pixels. */ }
}

// The live code gutter only contains labels in the scroll viewport. Put each
// printed number at its logical line start so wrapped continuations stay empty.
function numberCode(code, gutter) {
  const doc = code.ownerDocument
  const walker = doc.createTreeWalker(code, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  let number = 0, start = true
  for (const text of nodes) {
    if (!text.length) continue
    const span = doc.createDocumentFragment()
    for (const part of text.data.match(/[^\n]*\n|[^\n]+$/g) || []) {
      if (start) {
        const mark = doc.createElement('span')
        mark.className = 'printed-line-number'
        mark.setAttribute('data-line', String(++number))
        span.append(mark)
      }
      span.append(part)
      start = part.endsWith('\n')
    }
    text.replaceWith(span)
  }
  code.style.setProperty('--number-color', gutter.color)
  code.style.setProperty('--number-size', gutter.fontSize)
}

export async function snapshotReader(article, title, loadImage) {
  const doc = article.ownerDocument
  await doc.fonts.ready
  const width = article.getBoundingClientRect().width
  if (!width || !article.querySelector('[data-component="markdown"]'))
    throw Error('阅读页尚未显示内容，请在渲染完成后再导出。')
  const page = doc.implementation.createHTMLDocument(title)
  page.documentElement.lang = article.closest('[lang]')?.lang || doc.documentElement.lang || 'zh-CN'
  const ink = doc.defaultView.getComputedStyle.bind(doc.defaultView)
  let paper = 'white'
  for (let el=article; el; el=el.parentElement) {
    const color = ink(el).backgroundColor
    if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') { paper=color; break }
  }
  const styleIds = new Map(), families = new Set(), css = [], jobs = [], images = new Map()
  function declarations(style, sized) {
    const out = []
    for (const key of sized ? [...paint,'width','height'] : paint) {
      const value = style.getPropertyValue(key)
      if (!value) continue
      if (/url\(/i.test(value) && !/^url\("data:image\/(?:svg\+xml|png|webp)(?:;[^"]*)?,[^"]*"\)$/i.test(value)) continue
      out.push(key+':'+value)
    }
    for (const name of style.fontFamily.split(',')) families.add(fontKey(name))
    return out.join(';')
  }
  function rule(body, pseudo='') {
    const key = pseudo+'{'+body+'}'
    if (!styleIds.has(key)) {
      const name='p'+styleIds.size
      styleIds.set(key,name); css.push('.'+name+pseudo+'{'+body+'}')
    }
    return styleIds.get(key)
  }
  function copy(node, parent, math=false) {
    if (node.nodeType === 3) { parent.append(node.data); return }
    if (node.nodeType !== 1 || node.matches(skip)) return
    const tag = node.localName, svg = node.namespaceURI === 'http://www.w3.org/2000/svg'
    if (!(svg ? svgTags : htmlTags).has(tag) || tag==='input' && node.type!=='checkbox') return
    const style = ink(node)
    if (style.display === 'none' || style.visibility === 'hidden' || node.hidden) return
    math ||= node.classList.contains('katex')
    const el = svg ? page.createElementNS(node.namespaceURI,tag) : page.createElement(tag)
    parent.append(el)
    const sized = math || svg || ['img','input','td','th','col','table'].includes(tag) || ['inline-grid','inline-flex','inline-block'].includes(style.display) || style.position==='absolute'
    el.classList.add(rule(declarations(style,sized)))
    if (node.id) el.id=node.id
    for (const key of (svg ? ['viewBox','d','x','y','x1','y1','x2','y2','cx','cy','rx','ry','r','points','transform','preserveAspectRatio','fill-rule','clip-rule'] : ['start','value','reversed','colspan','rowspan','dir','lang','open'])) {
      if (node.hasAttribute(key)) el.setAttribute(key,node.getAttribute(key))
    }
    if (tag==='a') {
      const href=node.getAttribute('href') || ''
      if (/^(?:https?:\/\/|mailto:|#)/i.test(href)) el.setAttribute('href',href)
      const scope=node.closest('[data-note-scope]')?.dataset.noteScope
      if (scope && href.startsWith('#'+scope+'-to-')) el.id=href.slice(1).replace(scope+'-to-',scope+'-from-')
    }
    if (/^h[1-6]$/.test(tag) && !el.id) {
      const slug = node.textContent.trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu,'').replace(/\s+/g,'-')
      if (slug) {
        let id=slug, index=0
        while (page.getElementById(id)) id=slug+'-'+ ++index
        el.id=id
      }
    }
    if (tag==='input') { el.type='checkbox'; el.checked=node.checked; el.toggleAttribute('checked',node.checked); el.disabled=true }
    if (tag==='img') {
      el.alt=node.alt
      const src=bitmap(node)
      if (src) el.src=src
      else if (node.dataset.localImage) {
        const key=node.dataset.localImage
        if (!images.has(key)) images.set(key,loadImage(key).catch(()=>undefined))
        jobs.push(images.get(key).then(data=>{if(data) el.src=data; else el.replaceWith(node.alt)}))
      } else el.replaceWith(node.alt)
      return
    }
    const fence=node.matches('[data-component="markdown-code"]')
    if (fence) el.classList.add('fence')
    if (node.hasAttribute('data-ocx-code-header')) el.classList.add('fence-head')
    const token = tag==='span' && node.closest('pre') && !node.matches('[data-ocx-patch-row],[data-ocx-deleted]')
    if (!svg && !fence && !token) {
      for (const pseudo of ['::before','::after']) {
        const ps=ink(node,pseudo)
        if (ps.content==='none' || ps.content==='normal' || ps.display==='none' || !/^"[^"]*"$/.test(ps.content)) continue
        el.classList.add(rule(declarations(ps,true)+';content:'+ps.content,pseudo))
      }
    }
    if (node.matches('[data-component="markdown-table"],.katex-display') && node.clientWidth && node.scrollWidth>node.clientWidth+1) {
      el.classList.add('oversize')
      el.style.setProperty('--fit', node.clientWidth/node.scrollWidth)
    }
    for (const child of node.childNodes) {
      if (tag!=='details' || node.open || child.localName==='summary') copy(child,el,math)
    }
    if (fence) {
      // Desktop puts the header after the pre in the DOM and overlays a grid.
      // On paper it must come first and stay with the beginning of the code.
      const head = el.querySelector('.fence-head')
      if (head) el.prepend(head)
      const gutter = node.querySelector('[data-ocx-code-gutter]:not([hidden])')
      const code = el.querySelector('pre > code')
      if (gutter && code) numberCode(code,ink(gutter))
    }
  }
  copy(article,page.body)
  await Promise.all(jobs)
  const printableWidth = 190 * 96 / 25.4
  const scale = Math.min(1, printableWidth/width)
  const style = page.createElement('style')
  style.textContent = (fontStyles(doc,families)+'\n'+css.join('\n')+`
@page { size:A4; margin:10mm; background-color:${paper} }
html,body { margin:0; padding:0; background-color:${paper}; print-color-adjust:exact; -webkit-print-color-adjust:exact }
body>article[class] { width:${width}px; max-width:none; box-sizing:border-box; margin:0 auto; zoom:${scale} }
h1,h2,h3,h4,h5,h6,summary,.fence-head { break-after:avoid }
thead { display:table-header-group } tr,img { break-inside:avoid }
.fence { display:block; } .fence .fence-head { position:static; min-height:34px; justify-content:flex-start; }
.fence pre { margin-top:0; } pre[class],pre code[class],pre code span[class] {white-space:pre-wrap;overflow-wrap:anywhere}
.printed-line-number { position:relative; display:inline; }
.printed-line-number::before { content:attr(data-line); position:absolute; right:18px; width:max-content; white-space:pre; overflow-wrap:normal; color:var(--number-color); font-size:var(--number-size); font-weight:normal }
pre,blockquote { box-decoration-break:clone } .oversize>* { zoom:var(--fit) }
`).replaceAll('<','\\3c ')
  page.head.append(style)
  return '<!doctype html>'+page.documentElement.outerHTML
}
