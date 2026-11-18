// Match opencode-cache-hit 1.0.0's estimateStreamingSpeed without building a joined
// copy of the response. Length is measured in UTF-16 code units, as in the TUI.
export function streamingSpeed(length, created, first, now) {
  const elapsed = now - (first > created ? first : created)
  if (!length || !Number.isFinite(elapsed) || elapsed < 500) return
  return Math.max(1, Math.round(length / 4)) / (elapsed / 1000)
}

export function generatedLength(parts, toolLengths) {
  let length = 0
  for (const part of parts) {
    if (part.type === 'text' || part.type === 'reasoning') length += part.text.length
    if (part.type !== 'tool') continue
    // Desktop discards the raw argument string when execution begins. Preserve its
    // observed length, never count execution results or serialize parsed arguments.
    if (part.state.status === 'streaming') toolLengths.set(part.id, part.state.input.length)
    length += toolLengths.get(part.id) ?? 0
  }
  return length
}
