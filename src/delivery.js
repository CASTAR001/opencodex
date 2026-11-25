import { clipped } from './history.js'

// A prepared summary can be adopted between two hook calls. Join its first
// retained assistant ID to the actual compact marker using the ordered bus.
// This is a small in-memory buffer; queued or cancelled text never goes to KV.
export const deliveryEvents = ['session.inbox.enqueued', 'session.inbox.delivered', 'session.inbox.cancelled',
  'session.step.started', 'session.step.ended', 'session.compaction.started', 'session.compaction.ended',
  'session.revert.staged', 'session.revert.committed', 'session.deleted']

export function deliveryLog() {
  const sessions = new Map()
  function record(event) {
    const { sessionID, inboxID, item, assistantMessageID } = event.data
    if (event.type.startsWith('session.revert.') || event.type === 'session.deleted') {
      sessions.delete(sessionID)
      return
    }
    let state = sessions.get(sessionID)
    if (!state) {
      if (sessions.size >= 32) sessions.delete(sessions.keys().next().value)
      state = { pending: new Map(), rows: [] }
    }
    sessions.delete(sessionID)
    sessions.set(sessionID, state)
    switch (event.type) {
      case 'session.inbox.enqueued': {
        const text = item?.payload?.text
        const row = item?.type === 'user' && typeof text === 'string'
          ? { type: 'user', id: inboxID, text: clipped(text, 1600) }
          : null
        if (state.pending.size >= 64) state.pending.delete(state.pending.keys().next().value)
        state.pending.set(inboxID, row)
        break
      }
      case 'session.inbox.cancelled':
        state.pending.delete(inboxID)
        break
      case 'session.inbox.delivered': {
        const row = state.pending.get(inboxID)
        if (row !== null) state.rows.push(row ?? { type: 'gap' })
        state.pending.delete(inboxID)
        break
      }
      case 'session.step.started':
        state.rows.push({ type: 'anchor', id: assistantMessageID })
        break
      case 'session.step.ended':
        state.rows.push({ type: 'assistant', content: [{ type: 'settled-step' }] })
        break
      case 'session.compaction.started':
        state.rows.push({ type: 'boundary', id: event.data.inputID ?? event.id?.replace(/^evt_/, 'msg_') })
        break
    }
    if (state.rows.length > 256) state.rows.shift()
  }
  function tail(session, anchor, marker) {
    const rows = sessions.get(session)?.rows ?? []
    const start = rows.findLastIndex(row => row.type === 'anchor' && row.id === anchor)
    const end = rows.findLastIndex(row => row.type === 'boundary' && row.id === marker)
    if (start < 0 || end <= start) return
    const tail = rows.slice(start + 1, end)
    if (!tail.some(row => row.type === 'gap' || row.type === 'boundary')) return tail
  }
  return { record, tail }
}
