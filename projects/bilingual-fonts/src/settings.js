import { createComponent, createEffect, onCleanup } from 'solid-js'
import { defaults, fields, presets } from './fonts.js'

function field(ctx, store, faces, resolve, key) {
  const group = key.startsWith('text') ? 'text' : 'code'
  const lang = key.endsWith('Zh') ? 'zh' : 'en'
  const label = ctx.t(group) + ' · ' + ctx.t(lang)
  const wrap = document.createElement('div')
  wrap.className = 'ocx-font-control'
  const select = document.createElement('select')
  select.setAttribute('aria-label', label)
  const custom = document.createElement('input')
  custom.type = 'text'
  custom.maxLength = 128
  custom.spellcheck = false
  custom.autocomplete = 'off'
  custom.placeholder = ctx.t('example')
  custom.setAttribute('aria-label', label + ' · ' + ctx.t('name'))
  const note = document.createElement('small')
  note.setAttribute('role','status')
  wrap.append(select,custom,note)

  let available = []
  let editing = false
  let mounted = true
  let synced
  onCleanup(() => { mounted = false })
  const current = () => store.value?.[key] || ''
  function refresh() {
    const value = current()
    const other = editing || (value && !available.includes(value))
    select.value = other ? 'custom' : value
    custom.hidden = !other
    if (value !== synced || document.activeElement !== custom) custom.value = value
    synced = value
  }
  function options() {
    select.replaceChildren(new Option(ctx.t('native'), ''), ...available.map(name => new Option(name,name)),
      new Option(ctx.t('custom'), 'custom'))
    refresh()
  }
  options()
  Promise.all(presets[key].map(async name => (await resolve(name)).length ? name : undefined)).then(names => {
    if (!mounted) return
    available = names.filter(Boolean)
    options()
  })
  function save(value) {
    if (current() !== value) store.update(draft => { draft[key] = value })
  }
  select.onchange = () => {
    editing = select.value === 'custom'
    if (editing) {
      custom.hidden = false
      custom.value = current()
      custom.focus()
      custom.select()
    } else {
      save(select.value)
      refresh()
    }
  }
  const commit = () => {
    if (custom.hidden || !mounted) return
    const name = custom.value.trim()
    editing = false
    save(name)
    custom.value = name
    refresh()
  }
  custom.onchange = commit
  custom.onkeydown = event => {
    if (event.isComposing) return
    if (event.key === 'Enter') { event.preventDefault(); commit(); select.focus() }
    if (event.key === 'Escape') { custom.value = current(); editing = false; refresh(); select.focus() }
  }
  createEffect(() => {
    const value = current()
    if (value !== synced) editing = false
    refresh()
    const result = faces()[key]
    note.textContent = value && result?.name === value && !result.variants.length ? ctx.t('missing') : ''
    note.hidden = !note.textContent
  })
  return createComponent(ctx.ui.SettingsRow,{title:ctx.t(lang), children:wrap})
}

export function settingsPage(ctx, store, faces, resolve) {
  const sections = ['text','code'].map(group => {
    const preview = document.createElement(group === 'text' ? 'p' : 'pre')
    preview.className = 'ocx-font-preview'
    preview.setAttribute('aria-label',ctx.t(group) + ' · ' + ctx.t('preview'))
    preview.textContent = group === 'text' ? ctx.t('textPreview') : 'const 问候 = "Hello，世界";  // 0123456789'
    return createComponent(ctx.ui.SettingsSection,{
      title:ctx.t(group), footer:preview,
      get children() { return fields.filter(key => key.startsWith(group)).map(key => field(ctx,store,faces,resolve,key)) },
    })
  })
  const reset = createComponent(ctx.ui.Button,{
    children:ctx.t('reset'), size:'small',
    get disabled() { return !fields.some(key => store.value?.[key]) },
    onClick:() => store.set({...defaults}),
  })
  return createComponent(ctx.ui.SettingsLayout,{
    title:ctx.t('title'), description:ctx.t('intro'), actions:reset, children:sections,
  })
}
