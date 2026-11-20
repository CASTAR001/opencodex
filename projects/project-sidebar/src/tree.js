const ns = 'http://www.w3.org/2000/svg'
const paths = {
  folder: 'M3 7V5.5A1.5 1.5 0 0 1 4.5 4H9l2.2 2.4h8.3A1.5 1.5 0 0 1 21 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V7Zm0 2h18',
  open: 'M3 17V5.5A1.5 1.5 0 0 1 4.5 4H9l2.2 2.4H18A1.5 1.5 0 0 1 19.5 8v1M3.4 18.3l2.4-7.6A1.8 1.8 0 0 1 7.5 9.5h12.8a1.2 1.2 0 0 1 1.1 1.6l-2.5 7.4a2 2 0 0 1-1.9 1.4H5a1.7 1.7 0 0 1-1.6-1.6Z',
  list: 'M8.5 6h11M8.5 12h11M8.5 18h11M4 6h.2M4 12h.2M4 18h.2',
}
export function icon(name) {
  const svg = document.createElementNS(ns,'svg')
  svg.setAttribute('viewBox','0 0 24 24')
  svg.setAttribute('aria-hidden','true')
  const path = document.createElementNS(ns,'path')
  path.setAttribute('d',paths[name])
  svg.append(path)
  return svg
}
function element(tag, name, text) {
  const node = document.createElement(tag)
  node.className = name
  if (text) node.textContent = text
  return node
}
function button(name, text) {
  const node = element('button',name,text)
  node.type = 'button'
  return node
}

export function createTree({open, native}) {
  const root = element('nav','ps-tree')
  root.setAttribute('aria-label','项目会话')
  const header = element('div','ps-heading')
  header.append(element('span','','项目'))
  if (native) {
    const toggle = button('ps-native')
    toggle.title = '切换到原生侧栏'
    toggle.setAttribute('aria-label',toggle.title)
    toggle.append(icon('list'))
    toggle.onclick = native
    header.append(toggle)
  }
  const list = element('div','ps-list')
  root.append(header,list)
  const expansion = new Map()
  const limits = new Map()
  let groups = [], active, status, lastActive
  function draw() {
    // Preserve keyboard focus and scroll position across tree changes.
    const focusKey = list.contains(document.activeElement) && document.activeElement.dataset.key
    const scroll = list.scrollTop
    const fragment = document.createDocumentFragment()
    const servers = new Set(groups.map(g => g.server))
    const nodes = new Map()
    for (const group of groups) {
      const section = element('div','ps-project')
      const expanded = expansion.get(group.id) ?? group.sessions.length > 0
      const head = button('ps-folder')
      nodes.set(group.id,head)
      head.dataset.key = group.id
      head.title = servers.size > 1 ? group.name + ' · ' + group.path : group.path
      head.setAttribute('aria-label', head.title)
      head.setAttribute('aria-expanded',String(expanded))
      head.append(icon(expanded ? 'open' : 'folder'))
      const label = element('span','ps-path')
      label.dir = 'ltr'
      const split = Math.max(group.label.lastIndexOf('/'),group.label.lastIndexOf('\\')) + 1
      if (split && split < group.label.length) {
        const prefix = group.label.slice(0,split)
        const anchor = prefix.match(/^(?:~[\/\\]|[A-Za-z]:[\/\\]|\/Volumes\/[^/]+\/|\/)/)?.[0] ?? ''
        const parent = element('span','ps-prefix')
        parent.append(element('bdi','',prefix.slice(anchor.length)))
        label.append(element('span','ps-anchor',anchor),parent,element('span','ps-leaf',group.label.slice(split)))
      } else label.textContent = group.label
      head.append(label)
      if (servers.size > 1) head.append(element('span','ps-server',group.name))
      head.onclick = () => { expansion.set(group.id,!expanded); draw() }
      section.append(head)
      if (expanded) {
        const limit = limits.get(group.id) ?? 5
        const visible = group.sessions.slice(0,limit)
        const current = group.sessions.find(s => active?.server === group.server && s.id === active.id)
        if (current && !visible.includes(current)) visible.push(current)
        for (const session of visible) {
          const row = button('ps-session',session.title)
          row.title = session.title
          row.dataset.key = JSON.stringify([group.id,session.id])
          nodes.set(row.dataset.key,row)
          if (current === session) row.setAttribute('aria-current','page')
          row.onclick = () => open(group.server,session.id)
          section.append(row)
        }
        if (!group.sessions.length) section.append(element('span','ps-empty','暂无会话'))
        if (visible.length < group.sessions.length) {
          const more = button('ps-more','显示更多会话')
          more.dataset.key = group.id + '/more'
          nodes.set(more.dataset.key,more)
          more.onclick = () => { limits.set(group.id,limit + 10); draw() }
          section.append(more)
        }
      }
      fragment.append(section)
    }
    if (!groups.length || status) fragment.append(element('span','ps-empty',status || '暂无项目'))
    list.replaceChildren(fragment)
    if (focusKey) nodes.get(focusKey)?.focus({preventScroll:true})
    list.scrollTop = scroll
  }
  return {root, update(next,selection,message = '') {
    groups = next
    active = selection
    status = message
    const target = selection && groups.find(g => g.server === selection.server && g.sessions.some(s => s.id === selection.id))
    const activeKey = target && JSON.stringify([target.id,selection.id])
    if (activeKey && activeKey !== lastActive) expansion.set(target.id,true)
    lastActive = activeKey
    draw()
  }}
}
