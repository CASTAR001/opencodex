// OpenCode 2.3.2's public aggregates omit Code Mode calls and the timestamp of each model step.
// Keep the two projections here, read-only, in the sidecar that owns the database.
import path from 'node:path'
import os from 'node:os'
import { mediaKind } from './media.js'

export async function withHistory(app, read) {
  if (!app?.channel) throw Error('宿主历史不可用')
  const channel = app.channel
  const plain =
    ['latest', 'dev', 'beta', 'next', 'prod'].includes(channel) ||
    ['1', 'true'].includes(process.env.OPENCODE_DISABLE_CHANNEL_DB)
  const file =
    process.env.OPENCODE_DB ??
    (plain ? 'opencode.db' : 'opencode-' + channel.replace(/[^a-zA-Z0-9._-]/g, '-') + '.db')
  if (file === ':memory:') throw Error('宿主使用内存数据库')
  const data = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share')
  const filename = path.resolve(data, 'opencode', file)
  const db = process.versions.bun
    ? new (await import('bun:sqlite')).Database(filename, { readonly: true })
    : new (await import('node:sqlite')).DatabaseSync(filename, { readOnly: true })
  try {
    return read(db)
  } finally {
    db.close()
  }
}
const messages = `
  FROM session_message m JOIN session_v2 s ON s.id=m.session_id
  WHERE m.type='assistant' AND m.time_created >= ? AND m.time_created < ?
    AND (s.fork_session_id IS NULL OR m.time_created >= s.time_created)`
export function historicalMedia(db, { from, to }, names) {
  const rows = db
    .prepare(
      `WITH recent AS (
    SELECT m.id, m.data ${messages}
  ), parts AS (
    SELECT p.data AS data FROM recent r JOIN session_part p ON p.message_id=r.id WHERE p.type='tool'
    UNION ALL
    SELECT c.value FROM recent r,json_each(r.data,'$.content') c WHERE json_extract(c.value,'$.type')='tool'
  ), calls AS (
    SELECT json_extract(data,'$.name') AS name, json_extract(data,'$.state.status') AS status FROM parts
    UNION ALL
    SELECT json_extract(c.value,'$.tool'),json_extract(c.value,'$.status') FROM parts,
      json_each(data,'$.state.metadata.toolCalls') c
    WHERE json_extract(data,'$.name')='execute'
  ) SELECT name,status,count(*) AS count FROM calls WHERE status IN ('completed','error') GROUP BY name,status`,
    )
    .all(from, to)
  const totals = ['生图', '语音'].map((kind) => ({ kind, calls: 0, failed: 0, source: 'history' }))
  for (const row of rows) {
    const kind = mediaKind(row.name, names)
    const total = totals.find((t) => t.kind === kind)
    if (!total) continue
    total.calls += row.count
    if (row.status === 'error') total.failed += row.count
  }
  return totals
}
