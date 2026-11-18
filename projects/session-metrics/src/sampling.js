export function supportedModel(model) {
  return model?.providerID === 'openai' &&
    /^(?:gpt-4o(?:-mini)?|gpt-4\.1(?:-mini|-nano)?|gpt-5(?:\.\d+)?(?:-mini|-nano|-pro|-codex)?)(?:-\d{4}-\d{2}-\d{2})?$/.test(model.id)
}

// Sample visible text in bounded intervals. A pre-existing prefix seen on mount contributes zero.
export function sampleText(previous, text, at) {
  const length = text.length
  const next = { length, suffix: text.slice(-32), at }
  if (!previous || length <= previous.length || length - previous.length > 2048 ||
      text.slice(Math.max(0, previous.length - 32), previous.length) !== previous.suffix) return { next }
  const elapsed = at - previous.at
  if (elapsed < 250 || elapsed > 4000) return { next }
  return { next, delta: text.slice(previous.length), elapsed }
}
