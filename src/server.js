import { contract } from './contract.js'
import { quotaService } from './accounts.js'
import { routeFor } from './providers.js'
import { mediaTotals, observeMedia, officialMiniMcp } from './media.js'

export default {
  id: 'provider-quota',
  async setup(ctx) {
    let accounts = [],
      names = [],
      mediaWriteFailed = false
    await ctx.mcp.transform((editor) => {
      const next = [],
        aliases = []
      for (const [name, config] of editor.list()) {
        if (!officialMiniMcp(name, config)) continue
        aliases.push(name)
        const { MINIMAX_API_HOST, MINIMAX_API_KEY } = config.environment || {}
        // Copy the two scalar settings while the host's transform editor is valid.
        const route = routeFor('', MINIMAX_API_HOST ?? process.env.MINIMAX_API_HOST)
        if (route?.family === 'minimax')
          next.push({
            route,
            source: 'MCP · ' + name,
            key: () => MINIMAX_API_KEY ?? process.env.MINIMAX_API_KEY,
          })
      }
      names = aliases
      accounts = next
    })
    await ctx.tool.hook('execute.after', async (event) => {
      // Monitoring must never turn a successful generation into a failed tool call.
      try {
        await observeMedia(ctx.storage, event, names)
      } catch {
        mediaWriteFailed = true
      }
    })
    const refresh = quotaService(ctx, () => accounts)
    await ctx.rpc.register(contract, {
      refresh: ({ family, source }, { signal }) => refresh(family, signal, source),
      media: async (range) => {
        if (mediaWriteFailed) throw Error('本轮工具记录不完整')
        return mediaTotals(ctx.storage, range)
      },
    })
  },
}
