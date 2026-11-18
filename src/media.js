const methods = {
  text_to_image: '生图',
  image_generation: '生图',
  text_to_audio: '语音',
  text_to_speech: '语音',
  speech_synthesis: '语音',
}
export function officialMiniMcp(name, config) {
  if (config.type !== 'local' || config.disabled || !Array.isArray(config.command)) return false
  return config.command.some(
    (arg) =>
      typeof arg === 'string' && /(?:^|\/)(?:minimax-mcp(?:-js)?|minimax_mcp)(?:@[^/]+)?$/i.test(arg),
  )
}
export function mediaKind(tool, names = []) {
  if (typeof tool !== 'string') return
  const id = tool.toLowerCase().replace(/[.:-]/g, '_')
  for (const [method, label] of Object.entries(methods)) {
    if (!id.endsWith('_' + method)) continue
    const ns = id.slice(0, -method.length - 1)
    if (
      /(?:^|_)minimax(?:_|$)/.test(ns) ||
      names.some((n) => ns === n.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
    )
      return label
  }
}
export async function observeMedia(storage, event, names, now = Date.now()) {
  const kind = mediaKind(event.tool, names)
  if (!kind || !['completed', 'error'].includes(event.status)) return
  // The host supplies a distinct call ID even for calls nested inside Code Mode.
  await storage.set('media/' + encodeURIComponent(event.sessionID) + '/' + encodeURIComponent(event.id), {
    kind,
    time: now,
    status: event.status,
  })
}
export async function mediaTotals(storage, { from, to }) {
  let after
  const totals = { 生图: { calls: 0, failed: 0 }, 语音: { calls: 0, failed: 0 } }
  do {
    const page = await storage.scan({ prefix: 'media/', limit: 500, after })
    for (const { value } of page.entries) {
      if (!value || !Object.hasOwn(totals, value.kind) || value.time < from || value.time >= to) continue
      const row = totals[value.kind]
      row.calls++
      if (value.status === 'error') row.failed++
    }
    after = page.next
  } while (after)
  return Object.entries(totals).map(([kind, row]) => ({ kind, ...row }))
}
