const test = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const vm = require('node:vm')

const code = readFileSync(require.resolve('../gui-experimental.cjs'), 'utf8')
function mount(version = '2.3.2', platform = 'desktop') {
  const listeners = new Map()
  const commands = []
  const opens = []
  let frame
  let cleanup
  let slots = 0
  const doc = {
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: (name, fn) => { if (listeners.get(name) === fn) listeners.delete(name) },
  }
  class Element {}
  const sandbox = { exports: {}, document: doc, Element, requestAnimationFrame: fn => { frame = fn; return 1 },
    cancelAnimationFrame: () => { frame = undefined }, require(name) {
    if (name === 'solid-js') return { onCleanup: fn => { cleanup = fn } }
    if (name === '@opencode/plugin/gui') return { Plugin: { define: x => x }, Slot: 'Slot' }
    throw Error(name)
  } }
  vm.runInNewContext(code, sandbox)
  const state = { narrow: false, session: {key:'test'}, expanded: 'false', transcript: true, local: true, file:undefined }
  const toggle = { isConnected:true, getAttribute: () => state.expanded }
  const chat = { closest: () => ({ querySelector: () => toggle }) }
  const link = { dataset: {localLink: 'notes.md'}, matches: () => true,
    closest: selector => selector.startsWith('[data-component') && state.transcript ? { closest: () => chat } : null }
  const target = new Element()
  target.closest = () => state.local && link || null
  sandbox.exports.default.setup({
    app: { platform, version }, screen: {current: () => ({file:state.file})}, layout: { narrow: () => state.narrow }, sessions: { current: () => state.session },
    commands: { run: id => { commands.push(id); state.expanded = 'true'; return true } },
    links: { open: ({href,exact}) => { opens.push({href,exact}); return true } },
    add(_, slot) { slots++; slot.render() },
  })
  return { slots, state, commands, opens, link, listeners, cleanup, flush() { const fn = frame; frame = undefined; return fn?.() }, fire(changes = {}) {
    const event = { type: 'click', target, preventDefault() { this.defaultPrevented = true }, isTrusted: true, defaultPrevented: false, button: 0, ...changes }
    listeners.get(event.type)?.(event)
  } }
}
test('upgraded, unknown, older and web hosts register nothing', () => {
  for (const [version, platform] of [['2.3.3'], ['2.4.0'], ['2.3.2-beta'], [''], ['2.3.1'], ['2.3.2', 'web']]) {
    const host = mount(version, platform)
    assert.equal(host.slots, 0)
    assert.equal(host.listeners.size, 0)
  }
})
test('only a local foreground gesture in a closed desktop pane requests reveal', () => {
  const host = mount()
  host.fire()
  host.flush()
  host.state.expanded = 'false'
  host.fire({type: 'keydown', key: 'Enter'})
  host.flush()
  host.state.expanded = 'false'
  for (const changes of [{button: 2}, {defaultPrevented:true}, {ctrlKey: true}, {metaKey: true}, {shiftKey: true},
    {altKey: true}, {isTrusted: false}, {type: 'keydown', key: 'Tab'}, {type: 'keydown', key: 'Enter', repeat: true}]) host.fire(changes)
  for (const [key, value] of Object.entries({narrow: true, session: null, expanded: 'true', local: false, transcript: false})) {
    const previous = host.state[key]
    host.state[key] = value
    host.fire()
    host.state[key] = previous
  }
  assert.deepEqual(host.commands, ['review.toggle', 'review.toggle'])
  assert.deepEqual(host.opens, Array(2).fill({href:'notes.md',exact:false}))
  host.fire()
  host.state.session = {key:'another'}
  host.flush()
  assert.equal(host.opens.length, 2)
  host.cleanup()
  assert.equal(host.listeners.size, 0)
})
test('verified literal files open exactly once, line references keep native resolution', async () => {
  const host = mount()
  let checks = 0
  host.state.file = {resolve: path => path, exists: async path => { checks++; return path === 'notes.md' }}
  for (const href of ['notes.md', 'missing.md', 'notes.md#L16', 'guide.html']) {
    host.link.dataset.localLink = href
    host.state.expanded = 'false'
    host.fire()
    await host.flush()
  }
  assert.equal(checks, 2)
  assert.deepEqual(host.opens.map(x => x.exact), [true,false,false,false])
})
test('a pending file check cannot reopen a pane or outlive the plugin', async () => {
  for (const finish of [host => { host.state.expanded = 'false' }, host => host.cleanup()]) {
    const host = mount()
    let resolve
    host.state.file = {resolve: x => x, exists: () => new Promise(done => { resolve = done })}
    host.fire()
    const pending = host.flush()
    finish(host)
    resolve(true)
    await pending
    assert.deepEqual(host.opens, [])
  }
})
