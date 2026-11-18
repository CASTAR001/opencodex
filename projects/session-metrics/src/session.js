import { createEffect, createMemo, createSignal, mapArray, onCleanup } from 'solid-js'
import { historyPrefix } from './history.js'
import { measurement, mergeHistory } from './metrics.js'

// A Solid owner is scoped to exactly one visible mounted session and server connection.
export function observeSession(session, connected) {
  const { id, server } = session
  const data = server.data.session
  const client = server.client
  const [prefix, setPrefix] = createSignal([])
  const [coverage, setCoverage] = createSignal(connected ? 'loading' : 'offline')
  const [ready, setReady] = createSignal(false)
  const [attempt, setAttempt] = createSignal(0)
  const records = mapArray(() => data.message.list(id), row => createMemo(() => measurement(row)))
  const live = createMemo(() => records().map(read => read()))
  const running = () => data.status(id) === 'running'
  const anchor = createMemo(() => data.message.more(id) ? data.message.list(id)[0]?.id : undefined)
  createEffect(() => {
    attempt()
    if (!connected) return
    let active = true
    setReady(false)
    setCoverage('loading')
    // Join the host's own initial sync. Text deltas never restart this request.
    Promise.resolve().then(() => data.message.sync(id)).then(() => {
      if (active) setReady(true)
    }).catch(() => { if (active) setCoverage('error') })
    onCleanup(() => { active = false })
  })
  createEffect(() => {
    const first = anchor()
    if (!ready()) return
    setPrefix([])
    if (!first) {
      setCoverage('complete')
      return
    }
    setCoverage('loading')
    const controller = new AbortController()
    onCleanup(() => controller.abort())
    historyPrefix(client, id, first, controller.signal).then(rows => {
      if (controller.signal.aborted) return
      setPrefix(rows)
      setCoverage('complete')
    }).catch(() => { if (!controller.signal.aborted) setCoverage('error') })
  })
  const rows = createMemo(() => mergeHistory(prefix(), live()))
  return { rows, coverage, running, retry: () => setAttempt(n => n + 1) }
}
