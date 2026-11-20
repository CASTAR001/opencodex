// Desktop 2.3.2: the organized sidebar renders projects.used(), including the
// server's optional display name. Resolve it across the complete project index,
// never just the handful of rows the native sidebar happens to be displaying.
const projectRow = '[class~="group/project"]'
export function nativeProjectRow(list, group, servers) {
  const [server] = servers
  if (servers.length !== 1 || !server?.connected || server.id !== group.server) return
  const projects = server.data.project.list()
  const title = project => project.name || project.canonical.replace(/[/\\]+$/,'').split(/[/\\]/).pop() || project.canonical
  const target = projects.filter(p => p.canonical === group.path)
  if (target.length !== 1 || target[0].id === 'global') return
  const name = title(target[0])
  // An old global project may have a local alias unavailable to the GUI SDK.
  if (projects.some(p => p.id === 'global' || (p.id !== target[0].id && title(p) === name))) return
  const rows = [...list.querySelectorAll(projectRow)].filter(row =>
    row.querySelector(':scope > button[aria-expanded] > span[dir="auto"]')?.textContent === name)
  return rows.length === 1 ? rows[0] : undefined
}

export const closeHelp = '原生入口在「设置 → 实验 → 整理垂直侧边栏 → 项目」。展开原生项目分组后，可以在文件夹行的「更多选项」中选择「关闭」。'
// Exact common.close labels shipped by the 2.3.2 app catalogs.
const labels = new Set([
  ".Akyn", "Aizvērt", "Bağla", "Bezárás", "Cerrar", "Chiudi", "Close", "Fechar",
  "Fermer", "Kapat", "Lat aftur", "Loka", "Luk", "Lukk", "Mbylle", "Schließen",
  "Sluiten", "Stäng", "Sule", "Sulje", "Tancar", "Tutup", "Uždaryti", "Yopish",
  "Zamknij", "Zapri", "Zatvori", "Zatvoriti", "Zavrieť", "Zavřít", "Închide", "Đóng",
  "Κλείσιμο", "Закрити", "Закрыть", "Затвори", "Пӯшед", "Хаах", "затвори", "Փակել",
  "סגור", "إغلاق", "بستن", "بند", "بند کرو", "ލެއްޕުން", "बंद करें", "बन्द गर्नुहोस्",
  "বন্ধ", "වසන්න", "ปิด", "ປິດ", "སྒོ་བསྡམ", "ပိတ်ပါ။", "დახურვა", "ዝጋ",
  "បិទ", "关闭", "閉じる", "關閉", "닫기",
])

// Only use the menu owned by this exact native trigger. Re-resolve the row
// after confirmation and again before selection in case the project changed.
export async function selectNativeClose(resolveRow, expected) {
  const row = resolveRow()
  if (!row || row !== expected) return false
  const trigger = row.querySelector(':scope > [data-project-action] > button[aria-haspopup]')
  if (!trigger) return false
  const container = row.parentElement?.parentElement
  row.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true}))
  const frame = () => new Promise(done => requestAnimationFrame(done))
  const linkedMenu = () => document.getElementById(trigger.getAttribute('aria-controls')) ||
    [...document.querySelectorAll('[role="menu"]')].find(el => el.getAttribute('aria-labelledby') === trigger.id)
  let menu
  try {
    for (let i = 0; i < 8 && !menu; i++) { menu = linkedMenu(); if (!menu) await frame() }
    if (!menu?.matches('[role="menu"]') || resolveRow() !== row) return false
    const separators = menu.querySelectorAll(':scope > [data-slot="menu-v2-separator"]')
    const action = separators[separators.length-1]?.nextElementSibling
    if (!action?.matches('[data-component="menu-v2-item"][role="menuitem"]') || action.nextElementSibling ||
      !labels.has(action.textContent.trim()) || action.getAttribute('aria-disabled') === 'true') return false
    // Kobalte selects menu items on pointerup or keyboard activation.
    action.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',bubbles:true,cancelable:true}))
    for (let i = 0; i < 8 && row.isConnected; i++) await frame()
    return Boolean(container?.isConnected && !row.isConnected)
  } finally {
    if (menu?.isConnected && trigger.getAttribute('aria-expanded') === 'true')
      menu.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))
  }
}

export function closeQuestion(group) {
  return {title:'关闭项目？',description:group.path+'\n将从本机 OpenCode 的已用项目列表移除。磁盘文件、会话记录和权限设置都会保留，再次打开项目即可找回。',
    confirm:'确认关闭',cancel:'取消',danger:true}
}
