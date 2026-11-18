import { measurement } from './metrics.js'

// The caller owns one request per visible session. Return only the prefix before the host's live window.
export async function historyPrefix(client, sessionID, anchor, signal) {
  const rows = new Map()
  const cursors = new Set()
  let cursor
  do {
    signal.throwIfAborted()
    const query = cursor ? { sessionID, limit: 200, cursor } : { sessionID, limit: 200, order: 'asc' }
    const page = await client.message.list(query, { signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]) })
    signal.throwIfAborted()
    for (const message of page.data) {
      if (message.id === anchor) return [...rows.values()]
      rows.set(message.id, measurement(message))
    }
    cursor = page.cursor.next
    if (cursor && cursors.has(cursor)) throw Error('Repeated history cursor')
    cursors.add(cursor)
  } while (cursor)
  if (anchor) throw Error('The live timeline changed while loading history')
  return [...rows.values()]
}
