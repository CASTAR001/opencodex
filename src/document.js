import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { mathFromMarkdown } from 'mdast-util-math'
import { gfm } from 'micromark-extension-gfm'
import { math } from 'micromark-extension-math'

const parser = { extensions: [gfm(), math()], mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()] }
const calloutLabels = { NOTE: '说明', TIP: '提示', IMPORTANT: '重要', WARNING: '警告', CAUTION: '注意' }

export function linkName(href) {
  const url = new URL(href)
  const path = url.pathname.split('/').filter(Boolean).map(part => {
    try { return decodeURIComponent(part).replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, '') }
    catch { return part }
  })
  if (url.host === 'github.com' && path.length === 2) return 'GitHub · ' + path.join('/')
  return url.host + (path.length ? ' · ' + path.join(' / ') : '')
}

function applyEdits(text, edits, start = 0, end = text.length) {
  let cursor = start
  const result = []
  for (const edit of edits.toSorted((a, b) => a.start - b.start)) {
    result.push(text.slice(cursor, edit.start), edit.value)
    cursor = edit.end
  }
  result.push(text.slice(cursor, end))
  return result.join('')
}

// Read source offsets from a real Markdown syntax tree. All replacements are display-only.
export function projectDocument(text, scope, path = '') {
  const frontmatter = /^(?:\uFEFF)?---[ \t]*\r?\n([\s\S]*?)^(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/m
  const prefix = frontmatter.exec(text)
  const properties = prefix?.index === 0 ? prefix[1] : undefined
  if (properties !== undefined) text = text.slice(prefix[0].length)
  const tree = fromMarkdown(text, parser)
  const definitions = new Map()
  const destinations = new Map()
  const linkDefinitions = []
  const notes = []
  const numbers = new Map()
  const slice = node => text.slice(node.position.start.offset, node.position.end.offset)
  function collect(node) {
    if (node.type === 'footnoteDefinition' && !definitions.has(node.identifier)) definitions.set(node.identifier, node)
    if (node.type === 'definition') {
      linkDefinitions.push(slice(node))
      if (!destinations.has(node.identifier)) destinations.set(node.identifier, node)
    }
    node.children?.forEach(collect)
  }
  collect(tree)
  function rewrite(node, edits) {
    let value
    if (node.type === 'blockquote') {
      const first = node.children[0]?.children?.[0]
      const marker = first?.type === 'text' && /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?=\r?\n|$)/.exec(slice(first))
      if (marker) {
        const start = first.position.start.offset
        edits.push({ start, end: start + marker[0].length, value: '**' + calloutLabels[marker[1]] + '**  ' })
      }
    }
    if (node.type === 'footnoteDefinition') value = ''
    else if (node.type === 'footnoteReference' && definitions.has(node.identifier)) {
      let note = numbers.get(node.identifier)
      if (!note) {
        note = { key: node.identifier, number: notes.length + 1, references: [], text: '' }
        numbers.set(node.identifier, note)
        notes.push(note)
      }
      const target = scope + '-to-' + note.number + '-' + (note.references.length + 1)
      note.references.push(target)
      value = '[' + note.number + '](#' + target + ' "脚注 ' + note.number + '")'
    } else if (node.type === 'image' || node.type === 'imageReference') {
      // The slot inherits the workspace image loader. Resolve images relative to this document.
      const image = node.type === 'image' ? node : destinations.get(node.identifier)
      const slash = path.lastIndexOf('/')
      if (image?.url && slash >= 0 && !/^(?:[a-z][a-z\d+.-]*:|[\\/#?])/i.test(image.url)) {
        const segments = path.slice(0, slash).split('/').map(encodeURIComponent)
        for (const part of image.url.split('/')) {
          if (part === '..' && segments.length && segments.at(-1) !== '..') segments.pop()
          else if (part && part !== '.') segments.push(part)
        }
        const target = segments.join('/').replace(/[<>\s\\]/g, encodeURIComponent).replaceAll('&', '&amp;')
        const alt = (node.alt ?? '').replace(/[\\\[\]]/g, '\\$&')
        const title = image.title ? ' "' + image.title.replace(/["\\]/g, '\\$&') + '"' : ''
        value = '![' + alt + '](<' + target + '>' + title + ')'
      }
    } else if (node.type === 'link') {
      const raw = slice(node)
      if (/^<?https?:\/\//i.test(raw) && /^https?:\/\//i.test(node.url)) {
        let label
        try { label = linkName(node.url) } catch { return }
        const escapeLabel = label.replace(/[\\\[\]*_`<>&|~$!]/g, ch => '&#' + ch.codePointAt(0) + ';')
        const destination = node.url.replace(/[\\<>\s]/g, ch => encodeURIComponent(ch)).replaceAll('&', '&amp;')
        value = '[' + escapeLabel + '](<' + destination + '>)'
      }
    }
    if (value !== undefined) {
      edits.push({ start: node.position.start.offset, end: node.position.end.offset, value })
    } else if (!['link', 'linkReference', 'image', 'definition'].includes(node.type)) node.children?.forEach(child => rewrite(child, edits))
  }
  const edits = []
  rewrite(tree, edits)
  // Notes may themselves reference another note. Allocate those after all main-text references.
  for (const note of notes) {
    const definition = definitions.get(note.key)
    note.text = definition.children.map(block => {
      const local = []
      rewrite(block, local)
      return applyEdits(text, local, block.position.start.offset, block.position.end.offset).replace(/\r?\n(?: {4}|\t)/g, '\n')
    }).join('\n\n')
    if (linkDefinitions.length) note.text += '\n\n' + linkDefinitions.join('\n\n')
  }
  return { body: applyEdits(text, edits), notes, properties }
}
