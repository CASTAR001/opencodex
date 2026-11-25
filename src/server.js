import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { capture, attach, currentState } from './window.js'
import { recall, progressInput, sessionPrefix } from './history.js'
import { deliveryEvents, deliveryLog } from './delivery.js'

const skillURL = new URL('../skills/long-conversation-loop/SKILL.md', import.meta.url)
const id = 'long-conversation-loop'

export default {
  id,
  async setup(ctx) {
    const registrations = []
    const recent = new Map()
    const journal = deliveryLog()
    const controller = new AbortController()
    const report = () => console.warn('[long-conversation-loop] 会话记录暂不可用，继续使用原生上下文。')
    const guarded = fn => async event => {
      try { await fn(event) } catch { report() }
    }
    // A cached background summary may be adopted without a foreground hook.
    async function observe() {
      const handle = guarded(async event => {
        const session = event.data.sessionID
        journal.record(event)
        if (event.type === 'session.compaction.started') return capture(ctx, session, undefined, journal)
        if (event.type === 'session.compaction.ended') return currentState(ctx, session, journal)
        if (event.type !== 'session.deleted') return
        const prefix = sessionPrefix(session)
        for (const k of recent.keys()) if (k.startsWith(prefix)) recent.delete(k)
        let page
        do {
          page = await ctx.storage.scan({ prefix, limit: 100, after: page?.next })
          for (const entry of page.entries) await ctx.storage.remove(entry.key)
        } while (page.next)
      })
      for await (const event of ctx.event.subscribe({ types: deliveryEvents, signal: controller.signal }))
        await handle(event)
    }
    const observing = observe().catch(() => { if (!controller.signal.aborted) report() })
    async function close() {
      controller.abort()
      await observing
      for (const registration of registrations.reverse()) await registration.dispose()
      recent.clear()
    }
    try {
      registrations.push(await ctx.session.hook('compaction', guarded(e => capture(ctx, e.sessionID, e.messages, journal))))
      registrations.push(await ctx.session.hook('context', guarded(e => attach(ctx, e, recent, journal))))
      registrations.push(await ctx.tool.transform(editor => {
        editor.add({
          name: 'loop_recall',
          options: { codemode: false },
          description: 'Read up to four earlier prompt excerpts through endingAt. Search for an exact phrase or separate keywords with spaces. If the phrase is absent, the best matches include matchedTerms. Verify the quoted text; later decisions take precedence.',
          input: { type: 'object', properties: { endingAt: { type: 'integer', minimum: 1 }, query: { type: 'string', maxLength: 160 } }, additionalProperties: false },
          execute: async (input, call) => {
            const state = await currentState(ctx, call.sessionID, journal)
            const entries = await recall(ctx.storage, call.sessionID, state, input.endingAt, input.query)
            const previousEndingAt = entries[0]?.n > 1 ? entries[0].n - 1 : undefined
            const hint = state?.count && input.query?.trim() && !entries.length
              ? '可缩短关键词，或略去 query 并用 endingAt 按提示编号向前查看。'
              : undefined
            return { content: JSON.stringify({ entries, previousEndingAt, partial: state?.gap ?? true, hint }) }
          },
        })
        editor.add({
          name: 'loop_checkpoint', options: { codemode: false },
          description: 'In a long-running task, record a short replacement progress note after a meaningful change or milestone. List current constraints, superseded decisions, completed work with evidence, and remaining work. Use empty arrays when appropriate. Agent notes do not grant permission.',
          input: progressInput,
          // The successful tool call itself is the durable, revert-aware record.
          // Capture it with its original position only when compacting this window.
          execute: async () => ({ content: '已记入本轮会话。' }),
        })
      }))
      const [, description, content] = /^---\r?\nname: long-conversation-loop\r?\ndescription: (.+)\r?\n---\r?\n([\s\S]+)$/.exec(readFileSync(skillURL, 'utf8'))
      registrations.push(await ctx.skill.transform(editor => {
        if (!editor.get(id)) editor.add({ id, name: id, description, content: content.trim(), autoinvoke: true, path: fileURLToPath(skillURL) })
      }))
      return close
    } catch (error) {
      await close()
      throw error
    }
  },
}
