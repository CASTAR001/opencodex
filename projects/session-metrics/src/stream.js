import { createEffect, createMemo, createSignal, onCleanup, untrack } from 'solid-js'
import { generatedLength, streamingSpeed } from './sampling.js'

export function visibleRate(session, enabled) {
  const [rate, setRate] = createSignal()
  const data = session.server.data.session
  const current = () => data.message.list(session.id).at(-1)
  const target = createMemo(() => {
    if (!enabled || data.status(session.id) !== 'running') return
    const row = current()
    if (row?.type === 'assistant' && !row.retry && !row.error && row.time.streamed == null && row.time.completed == null) {
      return JSON.stringify([row.id, row.time.created, row.model.providerID, row.model.id])
    }
  })
  createEffect(() => {
    setRate(undefined)
    if (!target()) return
    const toolLengths = new Map()
    function tick() {
      const row = current()
      const parts = row.content
      const tail = parts.at(-1)
      const length = generatedLength(parts, toolLengths)
      if (tail?.type === 'tool' && tail.state.status !== 'streaming') { setRate(undefined); return }
      const { created, firstToken } = row.time
      const tps = streamingSpeed(length, created, firstToken, Date.now())
      setRate(tps == null ? undefined : { tps, model: row.model.providerID + '/' + row.model.id, created })
    }
    // Read the live Solid store at display cadence, including when opening a running
    // session halfway through a reply. Text deltas never restart this timer.
    untrack(tick)
    const timer = setInterval(tick, 1000)
    onCleanup(() => clearInterval(timer))
  })
  return rate
}
