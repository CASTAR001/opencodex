const {Plugin, Slot} = require('@opencode/plugin/gui')
const {createEffect, onCleanup} = require('solid-js')

const names = new Map(Object.entries({
  'bilingual-fonts': '中英文字体',
  'code-block-enhancer': '代码块增强',
  'cream-orange-theme': '奶油甜橙主题',
  'file-review-enhancer': 'Markdown 阅读器',
  'markdown-presentation': '对话正文增强',
  'plugin-labels-zh': '插件中文名称',
  'project-sidebar': '项目文件夹整理（已弃用）',
  'prompt-navigation': '提示词快捷导航',
  'provider-quota': '用量与剩余额度',
  'session-metrics': '缓存与生成速度监控',
}))

// 2.3.2 uses a bdi for local plugin IDs. MCP and skill rows have different markup.
const selector = '.settings-extensions-tabs .settings-extension-row .settings-provider-main > bdi.settings-extension-name'

function localizeList() {
  const changed = new Map()
  function restore(label, entry) {
    if (entry.node.data === names.get(entry.id)) entry.node.data = entry.id
    if (label.title !== entry.id) return
    if (entry.title === null) label.removeAttribute('title')
    else label.title = entry.title
  }
  function update() {
    for (const [label, entry] of changed) {
      if (label.isConnected && label.matches(selector) && label.firstChild === entry.node &&
          entry.node.data === names.get(entry.id)) continue
      restore(label, entry)
      changed.delete(label)
    }
    for (const label of document.querySelectorAll(selector)) {
      const node = label.firstChild
      if (label.childNodes.length !== 1 || node.nodeType !== Node.TEXT_NODE || !names.has(node.data)) continue
      const id = node.data
      changed.set(label, {id, node, title:label.getAttribute('title')})
      node.data = names.get(id)
      label.title = id
    }
  }
  const observer = new MutationObserver(update)
  update()
  observer.observe(document.body, {childList:true, subtree:true, characterData:true})
  return () => {
    observer.disconnect()
    for (const [label, entry] of changed) restore(label, entry)
    changed.clear()
  }
}

exports.default = Plugin.define({
  setup(ctx) {
    ctx.add(Slot, {at:'window.bottom', render() {
      createEffect(() => {
        if (ctx.router.path().split(/[?#]/, 1)[0] === '/settings') onCleanup(localizeList())
      })
      return null
    }})
  },
})
