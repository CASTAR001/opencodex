const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const root = join(__dirname, '..')
const manifest = require('../package.json')

test('the shipped entry registers one explicit language renderer and a scoped stylesheet', () => {
  const sdk = { Plugin: { define: data => data }, Style: Symbol(), CodeBlock: Symbol() }
  const context = { exports: {}, require(name) {
    if (name === '@opencode/plugin/gui') return sdk
    assert.ok(['solid-js', 'solid-js/web'].includes(name))
    return {}
  } }
  vm.runInNewContext(readFileSync(join(root, manifest.exports['./gui-experimental']), 'utf8'), context)
  const contribution = new Map()
  const plugin = context.exports.default
  plugin.setup({ add(key, value) { assert.ok(!contribution.has(key)); contribution.set(key, value) } })
  assert.equal(contribution.size, 2)
  assert.deepEqual(Array.from(contribution.get(sdk.CodeBlock).languages).sort(),
    ['','bash','javascript','js','jsx','py','python','sh','shell','text','ts','tsx','typescript','zsh'].sort())
  assert.equal(typeof contribution.get(sdk.CodeBlock).render, 'function')
  assert.equal(contribution.get(sdk.Style), readFileSync(join(root, 'src/toolbar.css'), 'utf8'))
  assert.equal(plugin.i18n.zh.wrap, '自动换行')
  assert.deepEqual(Object.keys(manifest.exports), ['./gui-experimental'])
})
