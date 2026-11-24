import { fromMarkdown } from 'mdast-util-from-markdown'
import { cjkFriendlyExtension } from 'micromark-extension-cjk-friendly'
import { gfm } from 'micromark-extension-gfm'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { math } from 'micromark-extension-math'
import { mathFromMarkdown } from 'mdast-util-math'

const parser = {extensions:[gfm(),math(),cjkFriendlyExtension()], mdastExtensions:[gfmFromMarkdown(),mathFromMarkdown()]}
export function repairs(source) {
  const items = []
  if (!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(source) ||
      !/(?:\*\*|__|https?:\/\/)/i.test(source)) return items
  function visit(node) {
    const raw = () => source.slice(node.position.start.offset, node.position.end.offset)
    if (node.type === 'strong' && node.children.length === 1 && node.children[0].type === 'text') {
      const value = node.children[0].value
      const literal = raw()
      if (literal.slice(2,-2) === value && source.indexOf(literal) === source.lastIndexOf(literal))
        items.push({kind:'strong', literal, value})
    }
    if (node.type === 'link' && /^https?:\/\//i.test(raw())) {
      const literal = raw()
      const stop = literal.search(/[。！？，；、](?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|$)/u)
      if (stop > 0 && source.indexOf(literal) === source.lastIndexOf(literal))
        items.push({kind:'link',literal,value:literal.slice(0,stop)})
    }
    if (!['link','linkReference','image','html'].includes(node.type)) node.children?.forEach(visit)
  }
  visit(fromMarkdown(source, parser))
  return items
}

// An idle event terminates a run. A user's additions during that run start no
// extra divider. Legacy histories with no outcome keep their native footer.
export function completedParts(messages) {
  const ids = new Set()
  let final, prompt = false, ambiguous = false
  for (const msg of messages) {
    if (msg.type === 'user') { prompt = true; final = undefined; ambiguous = false }
    if (msg.type === 'synthetic' && final?.finish === 'stop') ambiguous = true
    if (msg.type === 'assistant') final = msg
    if (msg.type !== 'idle') continue
    if (prompt && !ambiguous && msg.outcome === 'succeeded' && final?.finish === 'stop' && !final.error && final.time?.completed != null) {
      const lastTool = final.content.findLastIndex(p => p.type === 'tool')
      let ordinal = 0
      for (const [i,part] of final.content.entries()) {
        if (part.type !== 'text') continue
        const id = final.id + ':text:' + ordinal++
        if (part.text.trim() && (part.native?.phase === 'final_answer' || (i > lastTool && part.native?.phase !== 'commentary'))) {
          ids.add(id); break
        }
      }
    }
    final = undefined; prompt = false; ambiguous = false
  }
  return ids
}
export function partInfo(message, ordinal) {
  if (message?.type !== 'assistant' || message.time?.completed == null) return
  const part = message.content.filter(p => p.type === 'text')[ordinal]
  if (!part) return
  return {source:part.text}
}
