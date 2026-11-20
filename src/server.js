import { contract } from './contract.js'
import { quotaService } from './accounts.js'
import { routeFor } from './providers.js'
import { mediaTotals, observeMedia, officialMiniMcp } from './media.js'

import { inventory, mcpFamily } from './inventory.js'
import { withHistory, historicalMedia } from './history.js'

export default {
  id: 'provider-quota',
  async setup(ctx) {
    let accounts = [],
      names = [],
      mcpFamilies = new Map(),
      mediaWriteFailed = false
    await ctx.mcp.transform((editor) => {
      const next = [],
        aliases = [],
        configured = new Map()
      for (const [name, config] of editor.list()) {
        const official = officialMiniMcp(name, config)
        const family = mcpFamily(name, config, official)
        if (family) configured.set(name, family)
        if (family === 'minimax') aliases.push(name)
        if (!official) continue
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
      mcpFamilies = configured
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
    async function configured() {
      const [providers, servers] = await Promise.all([ctx.provider.list(), ctx.mcp.list()])
      const enabled = servers.data
        .filter((s) => s.status.status !== 'disabled')
        .map((s) => ({ name: s.name, family: mcpFamilies.get(s.name) }))
      return inventory(providers.data, enabled)
    }
    await ctx.rpc.register(contract, {
      inventory: configured,
      refresh: ({ family, source }, { signal }) => refresh(family, signal, source),
      media: async (range) => {
        try {
          return await withHistory(ctx.app, (db) => historicalMedia(db, range, names))
        } catch {
          // Isolated storage / unsupported schema: the live ledger has coverage only since installation.
        }
        if (mediaWriteFailed) throw Error('本轮工具记录不完整')
        return (await mediaTotals(ctx.storage, range)).map((r) => ({ ...r, source: 'ledger' }))
      },
    })
  },
}
