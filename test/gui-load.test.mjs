import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

test('Desktop main can evaluate the distributed GUI entry without a document', async () => {
  const code = await readFile(new URL('../dist/gui-experimental.cjs', import.meta.url), 'utf8')
  const module = {exports:{}}
  runInNewContext(code, {module, require(id) {
    if (id === '@opencode/plugin/gui') return {Plugin:{define: definition => definition}}
    if (id === 'solid-js' || id === 'solid-js/web') return {}
    throw Error('Unexpected external module: ' + id)
  }})
  assert.equal(typeof module.exports.default.setup,'function')
})
