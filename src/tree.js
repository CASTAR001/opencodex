const ns = 'http://www.w3.org/2000/svg'
const paths = {
  folder: 'M3 7V5.5A1.5 1.5 0 0 1 4.5 4H9l2.2 2.4h8.3A1.5 1.5 0 0 1 21 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V7Zm0 2h18',
  open: 'M3 17V5.5A1.5 1.5 0 0 1 4.5 4H9l2.2 2.4H18A1.5 1.5 0 0 1 19.5 8v1M3.4 18.3l2.4-7.6A1.8 1.8 0 0 1 7.5 9.5h12.8a1.2 1.2 0 0 1 1.1 1.6l-2.5 7.4a2 2 0 0 1-1.9 1.4H5a1.7 1.7 0 0 1-1.6-1.6Z',
  chevron: 'M9 6l6 6-6 6',
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

export function createTree({open, native, setHidden, closeHint, closeProject}) {
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
  const shelf = element('div','ps-shelf')
  const disclosure = button('ps-disclosure')
  const shelfList = element('div','ps-shelf-list')
  const shelfLabel = element('span','','隐藏文件夹')
  const count = element('span','ps-count')
  disclosure.append(icon('chevron'),shelfLabel,count)
  shelf.append(disclosure,shelfList)
  const menu = element('div','ps-menu')
  menu.popover = 'auto'
  menu.setAttribute('role','menu')
  menu.setAttribute('aria-label','文件夹操作')
  const item = button('ps-menu-item')
  item.setAttribute('role','menuitem')
  const close = button('ps-menu-item','快速关闭项目…')
  close.setAttribute('role','menuitem')
  const hint = element('p','ps-hint')
  menu.append(item,close,hint)
  root.append(header,list,shelf,menu)
  const expansion = new Map()
  const limits = new Map()
  const folderNodes = new Map()
  let groups = [], active, status, lastActive
  let hidden = new Set(), shelfOpen = false, menuTarget
  disclosure.onclick = () => { shelfOpen = !shelfOpen; draw() }

  function openMenu(group, x, y) {
    if (menu.matches(':popover-open')) menu.hidePopover()
    menuTarget = group.id
    item.textContent = hidden.has(group.id) ? '恢复到项目列表' : '隐藏文件夹'
    const reason = closeHint(group)
    close.disabled = Boolean(reason)
    hint.hidden = !reason
    hint.textContent = reason
    menu.style.left = '0px'
    menu.style.top = '0px'
    menu.showPopover()
    const box = menu.getBoundingClientRect()
    menu.style.left = Math.max(4,Math.min(x,innerWidth-box.width-4)) + 'px'
    menu.style.top = Math.max(4,Math.min(y,innerHeight-box.height-4)) + 'px'
    item.focus({preventScroll:true})
  }
  item.onclick = () => {
    const id = menuTarget
    if (!groups.some(group => group.id === id)) { menu.hidePopover(); return }
    const hide = !hidden.has(id)
    menu.hidePopover()
    setHidden(id,hide)
    if (hide && !shelf.hidden) disclosure.focus({preventScroll:true})
    else folderNodes.get(id)?.focus({preventScroll:true})
  }
  close.onclick = () => {
    const group = groups.find(g => g.id === menuTarget)
    menu.hidePopover()
    if (group && !closeHint(group)) void closeProject(group)
  }
  menu.onkeydown = event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const next = document.activeElement === item && !close.disabled ? close : item
      next.focus({preventScroll:true})
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      menu.hidePopover()
      folderNodes.get(menuTarget)?.focus({preventScroll:true})
    }
    if (event.key === 'Tab') menu.hidePopover()
  }

  function draw() {
    const focusKey = root.contains(document.activeElement) && document.activeElement.dataset.key
    const scroll = list.scrollTop, shelfScroll = shelfList.scrollTop
    const fragment = document.createDocumentFragment()
    const tucked = document.createDocumentFragment()
    const servers = new Set(groups.map(g => g.server))
    const nodes = new Map()
    folderNodes.clear()
    let hiddenCount = 0
    for (const group of groups) {
      const isHidden = hidden.has(group.id)
      if (isHidden) {
        hiddenCount++
        if (!shelfOpen) continue
      }
      const section = element('div','ps-project')
      const expanded = expansion.get(group.id) ?? group.sessions.length > 0
      const head = button('ps-folder')
      nodes.set(group.id,head)
      folderNodes.set(group.id,head)
      head.dataset.key = group.id
      head.title = servers.size > 1 ? group.name + ' · ' + group.path : group.path
      head.setAttribute('aria-label', head.title)
      head.setAttribute('aria-expanded',String(expanded))
      head.append(icon(expanded ? 'open' : 'folder'))
      const label = element('span','ps-path')
      label.dir = 'ltr'
      const anchor = group.label.match(/^(?:~[\/\\]|[A-Za-z]:[\/\\]|\/)/)?.[0] ?? ''
      if (anchor && anchor !== group.label) label.append(element('span','ps-anchor',anchor))
      const tail = element('span','ps-tail')
      const run = element('bdi','',anchor === group.label ? group.label : group.label.slice(anchor.length))
      run.dir = 'ltr'
      tail.append(run)
      label.append(tail)
      head.append(label)
      if (servers.size > 1) head.append(element('span','ps-server',group.name))
      head.onclick = () => { expansion.set(group.id,!expanded); draw() }
      head.setAttribute('aria-haspopup','menu')
      head.oncontextmenu = event => {
        event.preventDefault()
        event.stopPropagation()
        const box = head.getBoundingClientRect()
        openMenu(group,event.clientX || box.left,event.clientY || box.bottom)
      }
      head.onkeydown = event => {
        if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return
        event.preventDefault()
        event.stopPropagation()
        const box = head.getBoundingClientRect()
        openMenu(group,box.left,box.bottom)
      }
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
      if (isHidden) tucked.append(section)
      else fragment.append(section)
    }
    if (!groups.length || status) fragment.append(element('span','ps-empty',status || '暂无项目'))
    list.replaceChildren(fragment)
    if (!hiddenCount) shelfOpen = false
    shelf.hidden = !hiddenCount
    disclosure.setAttribute('aria-expanded',String(shelfOpen))
    count.textContent = String(hiddenCount)
    shelfList.hidden = !shelfOpen
    shelfList.replaceChildren(tucked)
    if (menu.matches(':popover-open')) {
      if (!folderNodes.has(menuTarget)) menu.hidePopover()
      else item.textContent = hidden.has(menuTarget) ? '恢复到项目列表' : '隐藏文件夹'
    }
    if (focusKey) nodes.get(focusKey)?.focus({preventScroll:true})
    list.scrollTop = scroll
    shelfList.scrollTop = shelfScroll
  }
  return {root, update(next,selection,message = '',hiddenIDs = []) {
    hidden = new Set(hiddenIDs)
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
