import { createEffect, createMemo, createSignal, createRoot, mapArray, onCleanup } from 'solid-js'
import { historyPrefix } from './history.js'
import { lastAssistantWithUsage } from '@opencode/client/solid'
import { visibleRate } from './stream.js'
import { measurement, mergeHistory, summarize } from './metrics.js'

// A Solid owner is scoped to exactly one visible mounted session and server connection.
function observeSession(session, connected) {
  const { id, server } = session
  const data = server.data.session
  const client = server.client
  const [prefix, setPrefix] = createSignal([])
  const [coverage, setCoverage] = createSignal(connected ? 'loading' : 'offline')
  const [ready, setReady] = createSignal(false)
  const [attempt, setAttempt] = createSignal(0)
  const catalog = server.data.location
  const ref = session.directory ? { directory: session.directory } : undefined
  createEffect(() => {
    attempt()
    if (!connected || session.pending || catalog.model.list(ref) != null) return
    let mounted = true
    onCleanup(() => { mounted = false })
    const resolve = ref ? Promise.resolve(ref) : catalog.syncInfo().then(() => catalog.default())
    resolve.then(location => mounted && catalog.model.sync(location)).catch(() => {})
  })
  const context = createMemo(() => {
    const message = lastAssistantWithUsage(data.message.list(id), data.get(id)?.revert?.messageID)
    if (!message) return
    const { tokens, model } = message
    const used = tokens.input + tokens.output + tokens.reasoning + tokens.cache.read + tokens.cache.write
    const limit = catalog.model.list(ref)?.findLast(entry => entry.providerID === model.providerID &&
      entry.id === model.id && entry.status !== 'deprecated')?.limit.context
    return { used, limit, percent: limit > 0 ? Math.round(used / limit * 100) : undefined }
  })
  const records = mapArray(() => data.message.list(id), row => createMemo(() => measurement(row)))
  const live = createMemo(() => records().map(read => read()))
  const running = () => data.status(id) === 'running'
  const anchor = createMemo(() => data.message.more(id) ? data.message.list(id)[0]?.id : undefined)
  createEffect(() => {
    attempt()
    if (!connected || session.pending) return
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
  const overall = createMemo(() => summarize(rows(), { running: running(), complete: coverage() === 'complete' }))
  const estimate = visibleRate(session, connected && !session.pending)
  return { rows, coverage, running, overall, estimate, context, retry: () => setAttempt(n => n + 1) }
}

// The title and the detail panel share paging and the live sampler until the last view leaves.
export function createSessionMetrics() {
  const observed = new Map()
  return function useSession(session) {
    const { key, id, pending, directory } = session
    const { data, client, connected } = session.server
    let entry = observed.get(key)
    if (!entry || entry.data !== data || entry.client !== client || entry.connected !== connected || entry.pending !== pending || entry.directory !== directory) {
      const target = { id, pending, directory, server: { data, client } }
      entry = createRoot(dispose => ({
        data, client, connected, pending, directory, dispose, readers: 0, source: observeSession(target, connected),
      }), null)
      observed.set(key, entry)
    }
    entry.readers++
    onCleanup(() => {
      if (--entry.readers) return
      entry.dispose()
      if (observed.get(key) === entry) observed.delete(key)
    })
    return entry.source
  }
}
