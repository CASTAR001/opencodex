const { Plugin, CodeBlock, Style } = require('@opencode/plugin/gui')
const { createComponent, createEffect, onMount } = require('solid-js')
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
  wrap.setAttribute('aria-pressed', 'false')
  wrap.onclick = () => wrap.setAttribute('aria-pressed', String(wrap.getAttribute('aria-pressed') !== 'true'))
  createEffect(() => { wrap.textContent = ctx.t('wrap') })
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
  i18n: { en: { wrap: 'Wrap lines' }, zh: { wrap: '自动换行' }, zht: { wrap: '自動換行' } },
  setup(ctx) {
    ctx.add(Style, styles)
    ctx.add(CodeBlock, { languages: Object.keys(labels), render: block => toolbar(ctx, block) })
  },
})
