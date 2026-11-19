import test from 'node:test'
import assert from 'node:assert/strict'
import { projectDocument, linkName } from '../src/document.js'

test('document-relative inline and reference images share the workspace image loader', () => {
  const doc = projectDocument('![海](../img/sea.png "海边")\n\n![图][photo]\n\n[photo]: ./pic.svg\n\n![远](https://example.org/pic.png)', 'id', 'notes/第二章/readme.md')
  assert.ok(doc.body.includes('![海](<notes/img/sea.png> "海边")'))
  assert.ok(doc.body.includes('![图](<notes/' + encodeURIComponent('第二章') + '/pic.svg>)'))
  assert.ok(doc.body.includes('![远](https://example.org/pic.png)'))
})

test('formats a GFM alert marker only at the head of a quote', () => {
  const result = projectDocument('> [!NOTE]\n> Observation[^n]\n\n`[!NOTE]`\n\n[^n]: data','test')
  assert.match(result.body, /> \*\*说明\*\* {2}\n>/)
  assert.match(result.body, /`\[!NOTE\]`/)
  assert.equal(result.notes.length, 1)
})

test('numbers by first reference, retains each origin and note paragraph', () => {
  const doc = projectDocument('A[^b] B[^a] C[^B] D[^missing]\r\n\r\n[^a]: second\r\n\r\n[^b]: first *note*\r\n\r\n    second paragraph', 'test')
  assert.deepEqual(doc.notes.map(n => n.key), ['b','a'])
  assert.equal(doc.notes[0].text, 'first *note*\n\nsecond paragraph')
  assert.deepEqual(doc.notes[0].references, ['test-to-1-1','test-to-1-2'])
  assert.match(doc.body, /test-to-2-1/)
  assert.match(doc.body, /\[\^missing\]/)
})
test('literal syntax stays in markup examples, math, escaped text, metadata and author links', () => {
  const source = '---\ntitle: "[^n]"\n---\n' + [
    '`[^n] https://example.org/a`', '\\[^n]', '$a[^n]$', '```md\n[^n] https://example.org/b\n```',
    '[作者的简介](https://example.org/path)', '[资料][src]', '[src]: https://example.org/path', '正文[^n]', '[^n]: [资料][src]'
  ].join('\n\n')
  const doc = projectDocument(source,'id')
  assert.equal(doc.properties, 'title: "[^n]"\n')
  assert.equal(doc.notes.length, 1)
  assert.equal(doc.notes[0].references.length, 1)
  assert.ok(doc.notes[0].text.includes('[src]: https://example.org/path'))
  assert.ok(doc.body.includes('`[^n] https://example.org/a`'))
  assert.ok(doc.body.includes('[作者的简介](https://example.org/path)'))
})
test('bare and angle links get truthful offline labels and preserve the destination', () => {
  const href = 'https://example.org/docs/guide?a=1&b=2#part'
  const {body} = projectDocument('<' + href + '>\n\nhttps://github.com/Zettlr/Zettlr', 'id')
  assert.ok(body.includes('[example.org · docs / guide](<' + href.replace('&','&amp;') + '>)'))
  assert.ok(body.includes('[GitHub · Zettlr/Zettlr]'))
  assert.equal(linkName('https://example.org/%E6%B5%B7'), 'example.org · 海')
  assert.equal(linkName('https://github.com:8443/org/project'), 'github.com:8443 · org / project')
})
test('definitions can link to later notes without recursing forever', () => {
  const doc = projectDocument('a[^one]\n\n[^one]: see [^two]\n\n[^two]: see [^one]', 'id')
  assert.deepEqual(doc.notes.map(n => n.references.length), [2,1])
})
