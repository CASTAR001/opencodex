import { Plugin, Store, SettingsPage, Style } from '@opencode/plugin/gui'
import { Schema } from 'effect'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import { defaults, fields, fontCSS, localFaces } from './fonts.js'
import { settingsPage } from './settings.js'
import styles from './settings.css'

const en = {
  title:'Bilingual fonts', intro:'Choose local fonts for Chinese and Latin text. Each field can follow OpenCode independently.',
  text:'Interface and messages', code:'Code', zh:'Chinese', en:'Latin letters and numbers',
  native:'Follow OpenCode', custom:'Other installed font…', name:'Font name', example:'Family or PostScript name',
  missing:'Font unavailable on this device. Using the OpenCode fallback.', reset:'Restore defaults',
  preview:'Preview', textPreview:'Review the update · 检查这次更新，明天继续。',
}
const zh = {
  title:'中英文字体', intro:'为中文和西文分别选择本机字体。每一项都可以单独跟随 OpenCode。',
  text:'界面与消息正文', code:'代码', zh:'中文', en:'西文与数字',
  native:'跟随 OpenCode', custom:'其他本机字体…', name:'字体名称', example:'字体家族名或 PostScript 名',
  missing:'本机未找到该字体，当前使用 OpenCode 回退字体。', reset:'恢复默认',
  preview:'预览', textPreview:'Review the update · 检查这次更新，明天继续。',
}

export default Plugin.define({
  stores: { fonts: Store.global(Schema.Struct(Object.fromEntries(fields.map(key => [key,Schema.String]))), defaults) },
  i18n:{en,zh},
  setup(ctx) {
    const store = ctx.stores.fonts
    const resolve = localFaces()
    const [faces, setFaces] = createSignal({})
    for (const key of fields) {
      createEffect(() => {
        const name = store.value?.[key] || ''
        let active = true
        onCleanup(() => { active = false })
        if (!name) { setFaces(prev => ({...prev,[key]:undefined})); return }
        resolve(name).then(variants => {
          if (active) setFaces(prev => ({...prev,[key]:{name,variants}}))
        })
      })
    }
    ctx.add(Style, styles)
    ctx.add(Style, () => fontCSS(Object.fromEntries(fields.map(key => [key,faces()[key]?.variants]))) || undefined)
    ctx.add(SettingsPage, {
      id:ctx.id, icon:'outline-text',
      get title() { return ctx.t('title') },
      get entries() {
        return [{id:ctx.id, title:ctx.t('title'), keywords:'font typeface typography Chinese Latin 中英文 字体 代码 等宽'}]
      },
      render:() => settingsPage(ctx,store,faces,resolve),
    })
  },
})
