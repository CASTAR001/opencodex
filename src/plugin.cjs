const { Plugin, CodeBlock, Style } = require('@opencode/plugin/gui')
const { createComponent, createEffect, createSignal, onMount } = require('solid-js')
const { insert } = require('solid-js/web')
const styles = require('./toolbar.css')

const labels = {
  ts: 'TypeScript', typescript: 'TypeScript', tsx: 'TSX',
  js: 'JavaScript', javascript: 'JavaScript', jsx: 'JSX',
  py: 'Python', python: 'Python',
  sh: 'Shell', shell: 'Shell', bash: 'Bash', zsh: 'Zsh',
}

function toolbar(ctx, block) {
  const header = document.createElement('div')
  const language = document.createElement('span')
  language.textContent = labels[block.language]
  const wrap = document.createElement('button')
  wrap.type = 'button'
  const [wrapped, setWrapped] = createSignal(true)
  wrap.onclick = () => setWrapped(value => !value)
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('aria-hidden', 'true')
  const lines = document.createElementNS(svg.namespaceURI, 'path')
  svg.append(lines)
  wrap.append(svg)
  createEffect(() => {
    const label = ctx.t('wrap')
    const softWrap = wrapped()
    lines.setAttribute('d', softWrap
      ? 'M2 3.5h12 M2 7.5h9.5a2.5 2.5 0 0 1 0 5h-4 M9.5 10.5l-2 2 2 2 M2 12.5h2.5'
      : 'M2 3.5h8 M2 8h12 M11.5 5.5 14 8l-2.5 2.5 M2 12.5h8')
    wrap.setAttribute('aria-label', label)
    wrap.setAttribute('aria-pressed', String(softWrap))
    wrap.title = softWrap ? ctx.t('keepLines') : label
  })
  header.append(language, wrap)
  onMount(() => {
    // Desktop keeps the highlighted pre and native Copy when it mounts our renderer.
    const slot = header.closest('[data-slot="markdown-code-content"]')
    const fence = slot?.parentElement
    if (fence?.matches('[data-component="markdown-code"]') &&
        fence.querySelector(':scope > pre > code') && fence.querySelector(':scope > [data-slot="markdown-copy-button"]')) {
      header.dataset.ocxCodeHeader = ''
      return
    }
    // A different host layout must still show the source via the public Code component.
    header.replaceChildren()
    insert(header, () => createComponent(ctx.ui.Code, { content: block.code, language: block.language }))
  })
  return header
}

exports.default = Plugin.define({
  i18n: {
    en: { wrap: 'Wrap lines', keepLines: 'Show original lines' },
    zh: { wrap: '自动换行', keepLines: '按原行显示' },
    zht: { wrap: '自動換行', keepLines: '依原行顯示' },
  },
  setup(ctx) {
    ctx.add(Style, styles)
    ctx.add(CodeBlock, { languages: Object.keys(labels), render: block => toolbar(ctx, block) })
  },
})
