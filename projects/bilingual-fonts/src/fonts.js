// Independent, disjoint ranges keep a CJK font's Latin glyphs out of English text.
// Curly quotes, ellipsis and full-width punctuation use the Chinese choice.
const ranges = {
  en: 'U+0020-007E,U+00A0-00B6,U+00B8-024F,U+0300-036F,U+1D00-1DBF,U+1E00-1EFF,U+2010-2013,U+2020-2025,U+20AC,U+2C60-2C7F,U+A720-A7FF,U+AB30-AB6F,U+FB00-FB06',
  zh: 'U+00B7,U+2014,U+2018-2019,U+201C-201D,U+2026,U+2E80-2FDF,U+2FF0-303F,U+3100-312F,U+31A0-31BF,U+31C0-31EF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FE10-FE19,U+FE30-FE4F,U+FF01-FF60,U+FFE0-FFE6,U+16FE0-16FFF,U+20000-2FA1F,U+30000-3347F',
}

export const fields = ['textZh', 'textEn', 'codeZh', 'codeEn']
export const defaults = Object.fromEntries(fields.map(key => [key, '']))
const chinese = ['PingFang SC', 'Hiragino Sans GB', 'Kaiti SC', 'Noto Sans CJK SC', 'Noto Serif CJK SC', 'Microsoft YaHei', 'SimSun']
export const presets = {
  textZh: chinese, codeZh: chinese,
  textEn: ['Helvetica Neue', 'Arial', 'Georgia', 'Verdana', 'Avenir Next'],
  codeEn: ['Menlo', 'Monaco', 'Courier New', 'JetBrains Mono', 'Consolas'],
}
const macFaces = {
  'PingFang SC': ['PingFangSC-Regular', 'PingFangSC-Semibold'],
  'Hiragino Sans GB': ['HiraginoSansGB-W3', 'HiraginoSansGB-W6'],
  'Kaiti SC': ['STKaitiSC-Regular', 'STKaitiSC-Bold'],
}
export function cssString(value) {
  return '"' + value.replace(/[^\p{L}\p{N} ._-]/gu, c => '\\' + c.codePointAt(0).toString(16) + ' ') + '"'
}
export function faceSource(name, variant) {
  const compact = name.replaceAll(' ', '')
  const suffixes = {regular:['Regular', 'Roman', 'Book'], bold:['Bold', 'Semibold'], italic:['Italic','Oblique'], boldItalic:['Bold Italic','Bold Oblique']}
  const names = []
  const mapped = macFaces[name]?.[variant === 'regular' ? 0 : variant === 'bold' ? 1 : -1]
  if (mapped) names.push(mapped)
  // Some macOS CJK families use PostScript face names with a regional suffix.
  const regional = /^([A-Za-z]+) (SC|TC|HK)$/.exec(name)
  if (regional && (variant === 'regular' || variant === 'bold')) {
    const weight = variant === 'regular' ? 'Regular' : 'Bold'
    names.push('ST' + regional[1] + '-' + regional[2] + '-' + weight)
  }
  if (variant === 'regular') names.push(name)
  for (const suffix of suffixes[variant]) names.push(name + ' ' + suffix, compact + '-' + suffix.replaceAll(' ', ''))
  return [...new Set(names)].map(s => 'local(' + cssString(s) + ')').join(', ')
}

export function localFaces() {
  const cache = new Map()
  return function resolve(name) {
    if (!name || name.length > 128) return Promise.resolve([])
    if (cache.has(name)) return cache.get(name)
    const lookup = async variant => {
      const src = faceSource(name, variant)
      try {
        // Loading a single named face works without permission to enumerate system fonts.
        await new FontFace('ocx-font-probe', src).load()
        return { src, weight:variant.startsWith('bold') ? 700 : 400, style:variant.toLowerCase().includes('italic') ? 'italic' : 'normal' }
      } catch { return undefined }
    }
    const result = lookup('regular').then(async regular => regular ?
      [regular, ...(await Promise.all(['bold','italic','boldItalic'].map(lookup))).filter(Boolean)] : [])
    if (cache.size >= 96) cache.delete(cache.keys().next().value)
    cache.set(name,result)
    return result
  }
}

export function fontCSS(faces) {
  const rules = []
  for (const [kind, token] of [['text', 'sans'], ['code', 'mono']]) {
    const stack = []
    for (const language of ['Zh', 'En']) {
      const key = kind + language
      if (!faces[key]?.length) continue
      const alias = cssString('ocx-bilingual-' + key)
      stack.push(alias)
      for (const {src, weight, style} of faces[key]) {
        rules.push('@font-face { font-family: ' + alias + '; src: ' + src + '; font-weight: ' + weight +
          '; font-style: ' + style + '; unicode-range: ' + ranges[language.toLowerCase()] + '; }')
      }
    }
    if (!stack.length) continue
    const native = '--ocx-bilingual-native-' + token
    const family = '--font-family-' + token
    // Capture the host stack on html. Refer to its inherited, resolved value on
    // body so host changes propagate and the original variable never refers to itself.
    rules.push(':root { ' + native + ': var(' + family + '); }')
    const aliases = kind === 'text' ? ['--font-sans','--font-family-text','--v2-font-family-sans'] : ['--font-mono','--v2-font-family-code']
    rules.push('body { ' + family + ': ' + [...stack, 'var(' + native + ')'].join(', ') + '; ' +
      aliases.map(key => key + ': var(' + family + ');').join(' ') +
      (kind === 'text' ? ' font-family: var(' + family + ');' : '') + ' }')
  }
  return rules.join('\n')
}
