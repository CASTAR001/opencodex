const test = require('node:test')
const assert = require('node:assert/strict')
const { parsePatch } = require('../src/patch.cjs')

test('unified coordinates, indentation and header-looking content survive across files and hunks', () => {
  const source = ['diff --git a/a b/a','index abc..def 100644','--- a/a','+++ b/a',
    '@@ -90,2 +43,2 @@ f',' one','--- old','+++ new','@@ -99,0 +52 @@','+\tadded',
    '--- a/b','+++ /dev/null','@@ -1 +0,0 @@','-gone','\\ No newline at end of file',''].join('\r\n')
  const { hunks, numbered } = parsePatch(source)
  assert.ok(numbered)
  assert.deepEqual(hunks.map(rows=>rows.map(r=>[r.kind,r.text,r.oldLine,r.newLine])),[
    [['context','one',90,43],['delete','-- old',91,undefined],['add','++ new',undefined,44]],
    [['add','\tadded',undefined,52]],[['delete','gone',1,undefined]]])
})
test('simple additions and deletions have no fabricated file coordinates', () => {
  assert.deepEqual(parsePatch('-before\n+after').hunks[0].map(row=>row.text), ['before','after'])
  assert.equal(parsePatch('+  added').numbered,false)
  assert.ok(parsePatch('-removed'))
  assert.deepEqual(parsePatch('@@ -3,2 +3,2 @@\n \n-a\n+').hunks[0].map(r=>r.text),['','a',''])
})
test('unrecognized, partial or metadata-only fences stay raw as a whole', () => {
  for (const source of ['', 'context', ' no changes', '--- a/a\n+++ b/a',
    '-old\n--- a/a\n+++ b/b', 'diff --git a/a b/a\nBinary files a and b differ','@@@ -1 -2 +3 @@@\n+foo',
    '@@ -1 +1 @@\n-a', '@@ -0 +1 @@\n-x\n+y', '@@ -1 +1 @@\n-x\n+y\n?',
    '@@ -1 +1 @@\n-x\n+y\n@@ -7,3 +7,3 @@\n x', '@@ -1 +1 @@\n same',
    '@@ -1,1 +1,0 @@\n x','@@ -9007199254740993 +1 @@\n-a\n+b']) assert.equal(parsePatch(source),undefined,source)
})
