// Interpret a completed fence as a unit. Any unaccounted line keeps the native source view.
const hunkHeader = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?: .*)?$/
const rowKinds = { ' ': 'context', '+': 'add', '-': 'delete' }
const noNewline = '\\ No newline at end of file'
const gitMetadata = /^(?:index [\da-fA-F]+\.\.[\da-fA-F]+(?: [0-7]+)?|(?:old mode|new mode|new file mode|deleted file mode) [0-7]+|(?:dis)?similarity index \d+%|(?:rename|copy) (?:from|to) .+)$/
function patchRow(line, oldLine, newLine) {
  const kind = rowKinds[line[0]]
  if (kind) return { kind, text: line.slice(1), oldLine: kind === 'add' ? undefined : oldLine,
    newLine: kind === 'delete' ? undefined : newLine }
}
function parsePatch(source) {
  const lines = source.split(/\r\n|\n/)
  if (lines.at(-1) === '') lines.pop()
  if (!lines.length) return
  if (!/^(?:@@|diff |---(?:\s|$)|\+\+\+(?:\s|$))/.test(lines[0])) {
    if (lines.some(line => /^(?:---|\+\+\+)(?:\s|$)/.test(line))) return
    const rows = lines.map(line => patchRow(line))
    if (rows.every(Boolean) && rows.some(row => row.kind !== 'context')) return { hunks: [rows], numbered: false }
    return
  }
  const hunks = []
  let index = 0, changed = false
  while (index < lines.length) {
    if (lines[index].startsWith('diff --git ')) {
      index++
      while (gitMetadata.test(lines[index])) index++
    }
    if (/^---\s+\S/.test(lines[index])) {
      if (!/^\+\+\+\s+\S/.test(lines[++index])) return
      index++
    }
    const header = hunkHeader.exec(lines[index++])
    if (!header) return
    let oldLine = Number(header[1]), newLine = Number(header[3])
    let oldCount = Number(header[2] ?? 1), newCount = Number(header[4] ?? 1)
    if (![oldLine + oldCount, newLine + newCount].every(Number.isSafeInteger) ||
        (!oldLine && oldCount) || (!newLine && newCount) || !(oldCount || newCount)) return
    const rows = []
    while (oldCount || newCount) {
      if (index === lines.length) return
      const row = patchRow(lines[index++], oldLine, newLine)
      if (!row) return
      if (row.kind !== 'add') {
        if (!oldCount) return
        oldCount--
        oldLine++
      }
      if (row.kind !== 'delete') {
        if (!newCount) return
        newCount--
        newLine++
      }
      if (row.kind !== 'context') changed = true
      rows.push(row)
      if (lines[index] === noNewline) index++
    }
    hunks.push(rows)
  }
  if (changed) return { hunks, numbered: true }
}

// Each mode is built only when first opened. Selectable text contains source lines,
// with real newlines. CSS paints review markers and coordinates outside the selection.
function createPatchView(model) {
  const pre = document.createElement('pre')
  pre.dataset.ocxPatchView = ''
  const views = new Map()
  let digits = 1
  if (model.numbered) {
    for (const rows of model.hunks) {
      const lastOld = rows.findLast(row => row.oldLine !== undefined)?.oldLine ?? 0
      const lastNew = rows.findLast(row => row.newLine !== undefined)?.newLine ?? 0
      digits = Math.max(digits, String(Math.max(lastOld, lastNew)).length)
    }
  }
  let current, deletedLabel
  function show(review) {
    if (current === review) return
    current = review
    let view = views.get(review)
    if (!view) {
      view = document.createElement('span')
      view.dataset.ocxPatchLines = ''
      for (const rows of model.hunks) {
        const group = document.createElement('span')
        group.dataset.ocxHunk = ''
        const visible = review ? rows : rows.filter(row => row.kind !== 'delete')
        if (!visible.length) {
          group.dataset.ocxDeleted = deletedLabel || ''
          group.setAttribute('aria-label', deletedLabel || '')
        }
        for (const [i, row] of visible.entries()) {
          const line = document.createElement('span')
          line.dataset.ocxPatchRow = ''
          line.dataset.change = row.kind
          if (model.numbered) {
            const old = String(row.oldLine ?? '').padStart(digits)
            const next = String(row.newLine ?? '').padStart(digits)
            line.dataset.coordinates = review ? old + ' ' + next : next
          }
          const content = document.createElement('span')
          content.dataset.ocxPatchText = ''
          content.textContent = row.text + (i < visible.length - 1 ? '\n' : '')
          line.append(content)
          group.append(line)
        }
        view.append(group)
      }
      view.style.setProperty('--ocx-patch-digits', String(digits))
      views.set(review, view)
    }
    pre.toggleAttribute('data-review', review)
    pre.replaceChildren(view)
  }
  return { pre, show, label(text) {
    if (deletedLabel === text) return
    deletedLabel = text
    for (const el of views.get(false)?.querySelectorAll('[data-ocx-deleted]') || []) {
      el.dataset.ocxDeleted = text
      el.setAttribute('aria-label', text)
    }
  } }
}
module.exports = { parsePatch, createPatchView }
