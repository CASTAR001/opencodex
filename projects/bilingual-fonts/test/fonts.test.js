import test from 'node:test'
import assert from 'node:assert/strict'
import { cssString, defaults, faceSource, fontCSS, localFaces } from '../src/fonts.js'
test('native defaults emit no font declarations', () => {
  assert.deepEqual(Object.values(defaults),['','','',''])
  assert.equal(fontCSS({}), '')
  assert.equal(fontCSS({textZh:[]}), '')
})
test('a font name is always a quoted local source', () => {
  const value = 'A");} @import url("https://example.com");/*'
  assert.doesNotMatch(cssString(value), /[{};:@/]/)
  assert.doesNotMatch(faceSource(value,'regular'), /url\(/)
  assert.match(faceSource('Example SC','regular'), /STExample-SC-Regular/)
  assert.match(faceSource('Example TC','bold'), /STExample-TC-Bold/)
})
test('each script can be set independently and retains the native stack', () => {
  const regular = [{src:'local("Example")',weight:400,style:'normal'}]
  const css = fontCSS({codeZh:regular})
  assert.match(css,/unicode-range:.*U\+4E00-9FFF/)
  assert.doesNotMatch(css,/ocx-bilingual-codeEn|--font-family-sans|terminal/)
  assert.match(css,/--ocx-bilingual-native-mono: var\(--font-family-mono\)/)
  assert.match(css,/--font-family-mono: "ocx-bilingual-codeZh", var\(--ocx-bilingual-native-mono\)/)
})
test('missing or oversized names fall back; missing bold permits browser synthesis', async () => {
  let attempts=0
  globalThis.FontFace=class {
    constructor(_id,source){this.source=source}
    async load(){attempts++; if(!this.source.includes('"Test"')) throw Error('missing')}
  }
  try {
    const resolve=localFaces()
    const faces=await resolve('Test')
    assert.equal(faces.length,1)
    assert.equal(faces[0].weight,400)
    await resolve('Test')
    assert.equal(attempts,4)
    assert.deepEqual(await resolve('Absent'),[])
    assert.deepEqual(await resolve('x'.repeat(129)),[])
    assert.equal(attempts,5)
  } finally {delete globalThis.FontFace}
})
