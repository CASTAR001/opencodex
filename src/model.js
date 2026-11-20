const key = (server, value) => JSON.stringify([server, value])

export function displayPath(path, home) {
  if (!home) return path
  const windows = /^[A-Za-z]:[\\/]/.test(home)
  const normalize = s => windows ? s.replaceAll('\\', '/').toLowerCase() : s
  const root = normalize(home).replace(/\/+$/, '')
  if (!root) return path
  const candidate = normalize(path)
  if (candidate === root) return '~'
  return candidate.startsWith(root + '/') ? '~' + path.slice(root.length) : path
}

export function setFolderHidden(ids, id, hide) {
  if (!hide) return ids.filter(key => key !== id)
  return ids.includes(id) ? ids : [...ids,id]
}

export function projectGroups(servers) {
  const groups = new Map()
  for (const server of servers) {
    const byID = new Map()
    function group(path) {
      const id = key(server.id, path)
      if (!groups.has(id)) groups.set(id, {id, path, server: server.id, name: server.name,
        label: displayPath(path, server.home), sessions: []})
      return groups.get(id)
    }
    for (const project of server.projects) {
      if (!project.canonical || project.id === 'global') continue
      byID.set(project.id, project)
      if (project.time?.archived == null) group(project.canonical)
    }
    const sessions = new Map(server.history.map(row => [row.id, row]))
    for (const row of server.known) sessions.set(row.id, row)
    for (const row of sessions.values()) {
      const project = byID.get(row.projectID)
      if (row.parentID || row.time?.archived != null || project?.time?.archived != null) continue
      const path = project?.canonical || row.location?.directory
      if (!path) continue
      group(path).sessions.push({id: row.id, title: row.title || '未命名会话', time: row.time?.updated ?? row.time?.created ?? 0})
    }
  }
  for (const group of groups.values()) group.sessions.sort((a,b) => b.time - a.time || a.id.localeCompare(b.id))
  return [...groups.values()]
}
