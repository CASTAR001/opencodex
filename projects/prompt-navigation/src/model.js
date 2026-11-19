export function promptRow(message) {
  if (message.type !== 'user' || !message.id) return
  const meta = message.metadata
  const text = (typeof meta?.displayText === 'string' ? meta.displayText : message.text)?.trim()
  const presented = key => Array.isArray(meta?.[key]) ? meta[key] : []
  const details = [
    ...presented('attachments').map(item => item?.name),
    ...(message.files ?? []).filter(item => !item.mention).map(item => item.name),
    ...presented('comments').map(item => item?.comment || item?.subject || item?.text || item?.path),
    ...(message.agents ?? []).filter(item => !item.mention).map(item => '@' + item.name),
    ...(message.skills ?? []).filter(item => !item.mention).map(item => item.name),
  ]
  const label = [text, ...details].filter(Boolean).join(' · ').replace(/\s+/gu, ' ').trim()
  return { id: message.id, label: label || '附件提示', time: message.time.created }
}

export function mergePrompts(history, recent, pending, reverted) {
  const byID = new Map(history.map(row => [row.id, row]))
  for (const row of recent) byID.set(row.id, row)
  const queued = new Set(pending)
  return [...byID.values()].filter(row => !queued.has(row.id) && (!reverted || row.id < reverted))
    .sort((a, b) => a.time - b.time || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

// Index only user messages. Building the list must not prepend to the host's virtual transcript.
export async function historyIndex(client, sessionID, signal) {
  const rows = []
  const seen = new Set()
  let cursor
  do {
    signal.throwIfAborted()
    const page = await client.message.list({ sessionID, type: 'user', limit: 200, cursor },
      { signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]) })
    signal.throwIfAborted()
    for (const message of page.data) {
      const row = promptRow(message)
      if (row) rows.push(row)
    }
    cursor = page.cursor.next
    if (cursor && seen.has(cursor)) throw new Error('Repeated history cursor')
    seen.add(cursor)
  } while (cursor)
  return rows
}
