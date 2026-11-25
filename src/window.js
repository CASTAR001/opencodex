import { key, boundary, readBoundary, reminder, saveWindow } from './history.js'

export async function currentState(ctx, sessionID, journal) {
  const rows = await ctx.session.context({ sessionID })
  return readBoundary(ctx.storage, sessionID, boundary(rows), journal)
}

export async function capture(ctx, sessionID, draft, journal) {
  const rows = await ctx.session.context({ sessionID })
  const previous = boundary(rows)
  const prior = await readBoundary(ctx.storage, sessionID, previous, journal)
  const start = previous ? rows.indexOf(previous) + 1 : 0
  const end = rows.findLastIndex(row => row.type === 'compaction' && row.status === 'running')
  if (end >= start) {
    return saveWindow(ctx.storage, sessionID, prior, rows.slice(start, end),
      previous && !prior, key(sessionID, 'compact', rows[end].id))
  }
  if (!draft) return
  // A precomputed prefix ends before a metered assistant response. Only link
  // it to that host anchor and only store rows actually covered by the request.
  const ids = new Set(draft.map(message => message.id).filter(Boolean))
  const last = rows.findLastIndex(row => ids.has(row.id))
  if (last < 0) return
  const anchor = rows.slice(last + 1).find(row => row.type === 'assistant' && row.tokens)
  if (!anchor) return
  const covered = rows.slice(start, last + 1).filter(row => ids.has(row.id))
  // The metered reply remains on the retained side. Its reported tools and
  // checkpoint are already known and can be carried into the adopted state.
  await saveWindow(ctx.storage, sessionID, prior, [...covered, anchor],
    previous && !prior, key(sessionID, 'background', anchor.id))
}

function markerOf(messages) {
  for (const [index, message] of messages.entries()) {
    if (!Array.isArray(message.content)) continue
    const part = message.content.find(p => p.type === 'compaction')
    if (part) return { index }
    if (message.role === 'user' && message.id && message.content[0]?.text?.startsWith('<conversation-checkpoint>'))
      return { index, id: message.id }
  }
}

export async function attach(ctx, event, recent, journal) {
  const found = markerOf(event.messages)
  if (!found) return
  const cacheKey = key(event.sessionID, 'view', found.id)
  let note = found.id && recent.get(cacheKey)
  let insertAt = found.index + 1
  if (!note) {
    const rows = await ctx.session.context({ sessionID: event.sessionID })
    const marker = boundary(rows)
    if (!marker) return
    if (found.id) {
      if (found.id !== marker.id) return
    } else {
      // Treat the provider's entire replacement window (including any items
      // after the opaque part) as one prefix. Decline an unrecognised projection.
      const native = marker.native?.messages
      if (!Array.isArray(native) || native.length > event.messages.length) return
      if (!native.every((m, i) => m.role === event.messages[i].role &&
        JSON.stringify(m.content) === JSON.stringify(event.messages[i].content))) return
      insertAt = native.length
    }
    const state = await readBoundary(ctx.storage, event.sessionID, marker, journal)
    if (found.id && state?.gap) insertAt = found.index
    note = reminder(state)
    if (!note) return
    if (found.id && !state.gap) {
      if (recent.size >= 64) recent.delete(recent.keys().next().value)
      recent.set(cacheKey, note)
    }
  }
  if ([event.messages[insertAt], event.messages[insertAt - 1]].some(m => m?.content?.[0]?.text === note)) return
  event.messages.splice(insertAt, 0, { role: 'user', content: [{ type: 'text', text: note }] })
}
