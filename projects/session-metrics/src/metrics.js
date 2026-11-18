// Keep only measurement fields. Reading streamed content here would subscribe the panel to every text delta.
export function measurement(message) {
  const { id, type, time } = message
  const row = { id, type, created: time.created }
  if (type !== 'assistant' && type !== 'compaction') return row
  const { model, tokens } = message
  return {
    ...row,
    model: model ? model.providerID + '/' + model.id : '?',
    usage: tokens && {
      input: tokens.input, read: tokens.cache.read, write: tokens.cache.write,
      output: tokens.output, reasoning: tokens.reasoning,
    },
    first: time.firstToken, streamed: time.streamed,
    ended: time.completed != null || !!message.error || message.status === 'completed' || message.status === 'failed',
    terminal: !!message.error || (!!message.finish && !['tool-calls', 'unknown'].includes(message.finish)),
  }
}

// The live store owns the entire suffix (including edits or a committed undo). Keep server sequence order.
export function mergeHistory(pages, live) {
  const rows = new Map()
  const first = live[0]?.id
  for (const row of pages) {
    if (row.id === first) break
    rows.set(row.id, row)
  }
  for (const row of live) rows.set(row.id, row)
  return [...rows.values()]
}

function generationRate(steps) {
  let elapsed = 0
  let generated = 0
  let includesWait = false
  for (const step of steps) {
    if (!step.usage || step.streamed == null) return
    const duration = step.streamed - (step.first ?? step.created)
    if (!Number.isFinite(duration) || duration < 0) return
    includesWait ||= step.first == null
    elapsed += duration
    generated += step.usage.output + step.usage.reasoning
  }
  if (elapsed > 0 && generated > 0) return { tps: generated * 1000 / elapsed, includesWait }
}

function recentTurn(rows, running, complete) {
  const legacy = !rows.some(row => row.type === 'idle')
  let steps = []
  let last
  let bounded = complete
  let sawInput = false
  for (const row of rows) {
    if (row.type === 'idle' || (legacy && ['user', 'synthetic'].includes(row.type))) {
      if (steps.length) last = { steps, bounded }
      steps = []
      // In a partial legacy-looking page an earlier idle marker could still be missing.
      bounded = complete || row.type === 'idle'
      sawInput = false
    } else if (!sawInput && ['user', 'synthetic'].includes(row.type)) {
      steps = []
      sawInput = true
    } else if (row.type === 'assistant') {
      steps.push(row)
    }
  }
  const tail = steps.at(-1)
  if (tail?.ended && (!running || tail.terminal)) return { steps, bounded, previous: false }
  return last && { ...last, previous: running || !!tail }
}

export function summarize(rows, { model = '', since = -Infinity, until = Infinity, running = false, complete = true } = {}) {
  const totals = { input: 0, read: 0, write: 0, output: 0, reasoning: 0 }
  const models = new Set()
  let latestModel
  let missing = 0
  let compactionTokens = 0
  let counted = 0
  const included = row => (!model || model === row.model) && row.created >= since && row.created < until
  for (const row of rows) {
    if (row.type !== 'assistant' && row.type !== 'compaction') continue
    models.add(row.model)
    if (row.type === 'assistant') latestModel = row.model
    if (!included(row)) continue
    if (!row.usage) {
      if (row.ended) missing++
      continue
    }
    counted++
    for (const field of Object.keys(totals)) {
      totals[field] += row.usage[field]
      if (row.type === 'compaction') compactionTokens += row.usage[field]
    }
  }
  const inputTotal = totals.input + totals.read + totals.write
  const turn = recentTurn(rows, running, complete)
  const speed = turn?.bounded && turn.steps.every(included) ? generationRate(turn.steps) : undefined
  return { totals, inputTotal, hit: inputTotal ? totals.read / inputTotal : undefined, missing, counted,
    compactionTokens, models: [...models].sort(), latestModel, speed, previous: !!turn?.previous }
}
