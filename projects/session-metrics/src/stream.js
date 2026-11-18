import { createEffect, createMemo, createSignal, onCleanup, untrack } from 'solid-js'

import { supportedModel, sampleText } from './sampling.js'

let workerSource
async function workerURL() {
  // The Desktop host serves one GUI entry. Decompress the embedded worker only for supported active models.
  workerSource ??= (async () => {
    const compressed = Uint8Array.from(atob(__OCX_WORKER_GZIP__), c => c.charCodeAt(0))
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))
    return new Blob([await new Response(stream).arrayBuffer()], { type: 'text/javascript' })
  })()
  return URL.createObjectURL(await workerSource)
}

export function visibleRate(session, enabled, selectedModel, cutoff) {
  const [rate, setRate] = createSignal()
  const data = session.server.data.session
  const current = () => data.message.list(session.id).at(-1)
  const target = createMemo(() => {
    if (!enabled || data.status(session.id) !== 'running') return
    const row = current()
    if (row?.type !== 'assistant' || row.time.streamed != null || row.time.completed != null ||
        !supportedModel(row.model) || row.time.created < cutoff()) return
    if (selectedModel() && selectedModel() !== row.model.providerID + '/' + row.model.id) return
    const part = row.content?.at(-1)
    if (part?.type !== 'text') return
    return JSON.stringify([row.id, row.time.created, row.content.length])
  })
  createEffect(() => {
    setRate(undefined)
    if (!target()) return
    let active = true, worker, url, timer, previous, elapsed, sent
    const read = () => current()?.content?.at(-1)?.text ?? ''
    function stop() {
      active = false
      clearInterval(timer)
      worker?.terminate()
      if (url) URL.revokeObjectURL(url)
    }
    onCleanup(stop)
    workerURL().then(value => {
      if (!active) { URL.revokeObjectURL(value); return }
      url = value
      worker = new Worker(url)
      worker.onerror = () => { setRate(undefined); stop() }
      worker.onmessage = ({ data: count }) => {
        if (!active) return
        if (count === 'ready') {
          previous = sampleText(undefined, untrack(read), performance.now()).next
          timer = setInterval(() => {
            if (elapsed !== undefined) return
            const at = performance.now()
            const sample = sampleText(previous, read(), at)
            previous = sample.next
            if (!sample.delta) { setRate(undefined); return }
            elapsed = sample.elapsed
            sent = at
            worker.postMessage(sample.delta)
          }, 1000)
        } else {
          setRate(elapsed > 0 && performance.now() - sent < 2000 ? count * 1000 / elapsed : undefined)
          elapsed = undefined
        }
      }
    }).catch(() => { if (active) { setRate(undefined); stop() } })
  })
  return rate
}
