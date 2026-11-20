var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/plugin.js
var plugin_exports = {};
__export(plugin_exports, {
  default: () => plugin_default
});
module.exports = __toCommonJS(plugin_exports);
var import_gui = require("@opencode/plugin/gui");
var import_effect = require("effect");
var import_solid_js = require("solid-js");

// src/model.js
var key = (server, value) => JSON.stringify([server, value]);
function displayPath(path, home) {
  if (!home) return path;
  const windows = /^[A-Za-z]:[\\/]/.test(home);
  const normalize = (s) => windows ? s.replaceAll("\\", "/").toLowerCase() : s;
  const root = normalize(home).replace(/\/+$/, "");
  if (!root) return path;
  const candidate = normalize(path);
  if (candidate === root) return "~";
  return candidate.startsWith(root + "/") ? "~" + path.slice(root.length) : path;
}
function setFolderHidden(ids, id, hide) {
  if (!hide) return ids.filter((key2) => key2 !== id);
  return ids.includes(id) ? ids : [...ids, id];
}
function projectGroups(servers) {
  const groups = /* @__PURE__ */ new Map();
  for (const server of servers) {
    let group = function(path) {
      const id = key(server.id, path);
      if (!groups.has(id)) groups.set(id, {
        id,
        path,
        server: server.id,
        name: server.name,
        label: displayPath(path, server.home),
        sessions: []
      });
      return groups.get(id);
    };
    const byID = /* @__PURE__ */ new Map();
    for (const project of server.projects) {
      if (!project.canonical || project.id === "global") continue;
      byID.set(project.id, project);
      if (project.time?.archived == null) group(project.canonical);
    }
    const sessions = new Map(server.history.map((row) => [row.id, row]));
    for (const row of server.known) sessions.set(row.id, row);
    for (const row of sessions.values()) {
      const project = byID.get(row.projectID);
      if (row.parentID || row.time?.archived != null || project?.time?.archived != null) continue;
      const path = project?.canonical || row.location?.directory;
      if (!path) continue;
      group(path).sessions.push({ id: row.id, title: row.title || "\u672A\u547D\u540D\u4F1A\u8BDD", time: row.time?.updated ?? row.time?.created ?? 0 });
    }
  }
  for (const group of groups.values()) group.sessions.sort((a, b) => b.time - a.time || a.id.localeCompare(b.id));
  return [...groups.values()];
}

// src/native-close.js
var projectRow = '[class~="group/project"]';
function nativeProjectRow(list, group, servers) {
  const [server] = servers;
  if (servers.length !== 1 || !server?.connected || server.id !== group.server) return;
  const projects = server.data.project.list();
  const title = (project) => project.name || project.canonical.replace(/[/\\]+$/, "").split(/[/\\]/).pop() || project.canonical;
  const target = projects.filter((p) => p.canonical === group.path);
  if (target.length !== 1 || target[0].id === "global") return;
  const name = title(target[0]);
  if (projects.some((p) => p.id === "global" || p.id !== target[0].id && title(p) === name)) return;
  const rows = [...list.querySelectorAll(projectRow)].filter((row) => row.querySelector(':scope > button[aria-expanded] > span[dir="auto"]')?.textContent === name);
  return rows.length === 1 ? rows[0] : void 0;
}
var closeHelp = "\u539F\u751F\u5165\u53E3\u5728\u300C\u8BBE\u7F6E \u2192 \u5B9E\u9A8C \u2192 \u6574\u7406\u5782\u76F4\u4FA7\u8FB9\u680F \u2192 \u9879\u76EE\u300D\u3002\u5C55\u5F00\u539F\u751F\u9879\u76EE\u5206\u7EC4\u540E\uFF0C\u53EF\u4EE5\u5728\u6587\u4EF6\u5939\u884C\u7684\u300C\u66F4\u591A\u9009\u9879\u300D\u4E2D\u9009\u62E9\u300C\u5173\u95ED\u300D\u3002";
var labels = /* @__PURE__ */ new Set([
  ".Akyn",
  "Aizv\u0113rt",
  "Ba\u011Fla",
  "Bez\xE1r\xE1s",
  "Cerrar",
  "Chiudi",
  "Close",
  "Fechar",
  "Fermer",
  "Kapat",
  "Lat aftur",
  "Loka",
  "Luk",
  "Lukk",
  "Mbylle",
  "Schlie\xDFen",
  "Sluiten",
  "St\xE4ng",
  "Sule",
  "Sulje",
  "Tancar",
  "Tutup",
  "U\u017Edaryti",
  "Yopish",
  "Zamknij",
  "Zapri",
  "Zatvori",
  "Zatvoriti",
  "Zavrie\u0165",
  "Zav\u0159\xEDt",
  "\xCEnchide",
  "\u0110\xF3ng",
  "\u039A\u03BB\u03B5\u03AF\u03C3\u03B9\u03BC\u03BF",
  "\u0417\u0430\u043A\u0440\u0438\u0442\u0438",
  "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
  "\u0417\u0430\u0442\u0432\u043E\u0440\u0438",
  "\u041F\u04EF\u0448\u0435\u0434",
  "\u0425\u0430\u0430\u0445",
  "\u0437\u0430\u0442\u0432\u043E\u0440\u0438",
  "\u0553\u0561\u056F\u0565\u056C",
  "\u05E1\u05D2\u05D5\u05E8",
  "\u0625\u063A\u0644\u0627\u0642",
  "\u0628\u0633\u062A\u0646",
  "\u0628\u0646\u062F",
  "\u0628\u0646\u062F \u06A9\u0631\u0648",
  "\u078D\u07AC\u0787\u07B0\u0795\u07AA\u0782\u07B0",
  "\u092C\u0902\u0926 \u0915\u0930\u0947\u0902",
  "\u092C\u0928\u094D\u0926 \u0917\u0930\u094D\u0928\u0941\u0939\u094B\u0938\u094D",
  "\u09AC\u09A8\u09CD\u09A7",
  "\u0DC0\u0DC3\u0DB1\u0DCA\u0DB1",
  "\u0E1B\u0E34\u0E14",
  "\u0E9B\u0EB4\u0E94",
  "\u0F66\u0F92\u0F7C\u0F0B\u0F56\u0F66\u0FA1\u0F58",
  "\u1015\u102D\u1010\u103A\u1015\u102B\u104B",
  "\u10D3\u10D0\u10EE\u10E3\u10E0\u10D5\u10D0",
  "\u12DD\u130B",
  "\u1794\u17B7\u1791",
  "\u5173\u95ED",
  "\u9589\u3058\u308B",
  "\u95DC\u9589",
  "\uB2EB\uAE30"
]);
async function selectNativeClose(resolveRow, expected) {
  const row = resolveRow();
  if (!row || row !== expected) return false;
  const trigger = row.querySelector(":scope > [data-project-action] > button[aria-haspopup]");
  if (!trigger) return false;
  const container = row.parentElement?.parentElement;
  row.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true }));
  const frame = () => new Promise((done) => requestAnimationFrame(done));
  const linkedMenu = () => document.getElementById(trigger.getAttribute("aria-controls")) || [...document.querySelectorAll('[role="menu"]')].find((el) => el.getAttribute("aria-labelledby") === trigger.id);
  let menu;
  try {
    for (let i = 0; i < 8 && !menu; i++) {
      menu = linkedMenu();
      if (!menu) await frame();
    }
    if (!menu?.matches('[role="menu"]') || resolveRow() !== row) return false;
    const separators = menu.querySelectorAll(':scope > [data-slot="menu-v2-separator"]');
    const action = separators[separators.length - 1]?.nextElementSibling;
    if (!action?.matches('[data-component="menu-v2-item"][role="menuitem"]') || action.nextElementSibling || !labels.has(action.textContent.trim()) || action.getAttribute("aria-disabled") === "true") return false;
    action.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));
    for (let i = 0; i < 8 && row.isConnected; i++) await frame();
    return Boolean(container?.isConnected && !row.isConnected);
  } finally {
    if (menu?.isConnected && trigger.getAttribute("aria-expanded") === "true")
      menu.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  }
}
function closeQuestion(group) {
  return {
    title: "\u5173\u95ED\u9879\u76EE\uFF1F",
    description: group.path + "\n\u5C06\u4ECE\u672C\u673A OpenCode \u7684\u5DF2\u7528\u9879\u76EE\u5217\u8868\u79FB\u9664\u3002\u78C1\u76D8\u6587\u4EF6\u3001\u4F1A\u8BDD\u8BB0\u5F55\u548C\u6743\u9650\u8BBE\u7F6E\u90FD\u4F1A\u4FDD\u7559\uFF0C\u518D\u6B21\u6253\u5F00\u9879\u76EE\u5373\u53EF\u627E\u56DE\u3002",
    confirm: "\u786E\u8BA4\u5173\u95ED",
    cancel: "\u53D6\u6D88",
    danger: true
  };
}

// src/tree.js
var ns = "http://www.w3.org/2000/svg";
var paths = {
  folder: "M3 7V5.5A1.5 1.5 0 0 1 4.5 4H9l2.2 2.4h8.3A1.5 1.5 0 0 1 21 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V7Zm0 2h18",
  open: "M3 17V5.5A1.5 1.5 0 0 1 4.5 4H9l2.2 2.4H18A1.5 1.5 0 0 1 19.5 8v1M3.4 18.3l2.4-7.6A1.8 1.8 0 0 1 7.5 9.5h12.8a1.2 1.2 0 0 1 1.1 1.6l-2.5 7.4a2 2 0 0 1-1.9 1.4H5a1.7 1.7 0 0 1-1.6-1.6Z",
  chevron: "M9 6l6 6-6 6",
  list: "M8.5 6h11M8.5 12h11M8.5 18h11M4 6h.2M4 12h.2M4 18h.2"
};
function icon(name) {
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(ns, "path");
  path.setAttribute("d", paths[name]);
  svg.append(path);
  return svg;
}
function element(tag, name, text) {
  const node = document.createElement(tag);
  node.className = name;
  if (text) node.textContent = text;
  return node;
}
function button(name, text) {
  const node = element("button", name, text);
  node.type = "button";
  return node;
}
function createTree({ open, native, setHidden, closeHint, closeProject }) {
  const root = element("nav", "ps-tree");
  root.setAttribute("aria-label", "\u9879\u76EE\u4F1A\u8BDD");
  const header = element("div", "ps-heading");
  header.append(element("span", "", "\u9879\u76EE"));
  if (native) {
    const toggle = button("ps-native");
    toggle.title = "\u5207\u6362\u5230\u539F\u751F\u4FA7\u680F";
    toggle.setAttribute("aria-label", toggle.title);
    toggle.append(icon("list"));
    toggle.onclick = native;
    header.append(toggle);
  }
  const list = element("div", "ps-list");
  const shelf = element("div", "ps-shelf");
  const disclosure = button("ps-disclosure");
  const shelfList = element("div", "ps-shelf-list");
  const shelfLabel = element("span", "", "\u9690\u85CF\u6587\u4EF6\u5939");
  const count = element("span", "ps-count");
  disclosure.append(icon("chevron"), shelfLabel, count);
  shelf.append(disclosure, shelfList);
  const menu = element("div", "ps-menu");
  menu.popover = "auto";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "\u6587\u4EF6\u5939\u64CD\u4F5C");
  const item = button("ps-menu-item");
  item.setAttribute("role", "menuitem");
  const close = button("ps-menu-item", "\u5FEB\u901F\u5173\u95ED\u9879\u76EE\u2026");
  close.setAttribute("role", "menuitem");
  const hint = element("p", "ps-hint");
  menu.append(item, close, hint);
  root.append(header, list, shelf, menu);
  const expansion = /* @__PURE__ */ new Map();
  const limits = /* @__PURE__ */ new Map();
  const folderNodes = /* @__PURE__ */ new Map();
  let groups = [], active, status, lastActive;
  let hidden = /* @__PURE__ */ new Set(), shelfOpen = false, menuTarget;
  disclosure.onclick = () => {
    shelfOpen = !shelfOpen;
    draw();
  };
  function openMenu(group, x, y) {
    if (menu.matches(":popover-open")) menu.hidePopover();
    menuTarget = group.id;
    item.textContent = hidden.has(group.id) ? "\u6062\u590D\u5230\u9879\u76EE\u5217\u8868" : "\u9690\u85CF\u6587\u4EF6\u5939";
    const reason = closeHint(group);
    close.disabled = Boolean(reason);
    hint.hidden = !reason;
    hint.textContent = reason;
    menu.style.left = "0px";
    menu.style.top = "0px";
    menu.showPopover();
    const box = menu.getBoundingClientRect();
    menu.style.left = Math.max(4, Math.min(x, innerWidth - box.width - 4)) + "px";
    menu.style.top = Math.max(4, Math.min(y, innerHeight - box.height - 4)) + "px";
    item.focus({ preventScroll: true });
  }
  item.onclick = () => {
    const id = menuTarget;
    if (!groups.some((group) => group.id === id)) {
      menu.hidePopover();
      return;
    }
    const hide = !hidden.has(id);
    menu.hidePopover();
    setHidden(id, hide);
    if (hide && !shelf.hidden) disclosure.focus({ preventScroll: true });
    else folderNodes.get(id)?.focus({ preventScroll: true });
  };
  close.onclick = () => {
    const group = groups.find((g) => g.id === menuTarget);
    menu.hidePopover();
    if (group && !closeHint(group)) void closeProject(group);
  };
  menu.onkeydown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const next = document.activeElement === item && !close.disabled ? close : item;
      next.focus({ preventScroll: true });
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      menu.hidePopover();
      folderNodes.get(menuTarget)?.focus({ preventScroll: true });
    }
    if (event.key === "Tab") menu.hidePopover();
  };
  function draw() {
    const focusKey = root.contains(document.activeElement) && document.activeElement.dataset.key;
    const scroll = list.scrollTop, shelfScroll = shelfList.scrollTop;
    const fragment = document.createDocumentFragment();
    const tucked = document.createDocumentFragment();
    const servers = new Set(groups.map((g) => g.server));
    const nodes = /* @__PURE__ */ new Map();
    folderNodes.clear();
    let hiddenCount = 0;
    for (const group of groups) {
      const isHidden = hidden.has(group.id);
      if (isHidden) {
        hiddenCount++;
        if (!shelfOpen) continue;
      }
      const section = element("div", "ps-project");
      const expanded = expansion.get(group.id) ?? group.sessions.length > 0;
      const head = button("ps-folder");
      nodes.set(group.id, head);
      folderNodes.set(group.id, head);
      head.dataset.key = group.id;
      head.title = servers.size > 1 ? group.name + " \xB7 " + group.path : group.path;
      head.setAttribute("aria-label", head.title);
      head.setAttribute("aria-expanded", String(expanded));
      head.append(icon(expanded ? "open" : "folder"));
      const label = element("span", "ps-path");
      label.dir = "ltr";
      const anchor = group.label.match(/^(?:~[\/\\]|[A-Za-z]:[\/\\]|\/)/)?.[0] ?? "";
      if (anchor && anchor !== group.label) label.append(element("span", "ps-anchor", anchor));
      const tail = element("span", "ps-tail");
      const run = element("bdi", "", anchor === group.label ? group.label : group.label.slice(anchor.length));
      run.dir = "ltr";
      tail.append(run);
      label.append(tail);
      head.append(label);
      if (servers.size > 1) head.append(element("span", "ps-server", group.name));
      head.onclick = () => {
        expansion.set(group.id, !expanded);
        draw();
      };
      head.setAttribute("aria-haspopup", "menu");
      head.oncontextmenu = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const box = head.getBoundingClientRect();
        openMenu(group, event.clientX || box.left, event.clientY || box.bottom);
      };
      head.onkeydown = (event) => {
        if (event.key !== "ContextMenu" && !(event.shiftKey && event.key === "F10")) return;
        event.preventDefault();
        event.stopPropagation();
        const box = head.getBoundingClientRect();
        openMenu(group, box.left, box.bottom);
      };
      section.append(head);
      if (expanded) {
        const limit = limits.get(group.id) ?? 5;
        const visible = group.sessions.slice(0, limit);
        const current = group.sessions.find((s) => active?.server === group.server && s.id === active.id);
        if (current && !visible.includes(current)) visible.push(current);
        for (const session of visible) {
          const row = button("ps-session", session.title);
          row.title = session.title;
          row.dataset.key = JSON.stringify([group.id, session.id]);
          nodes.set(row.dataset.key, row);
          if (current === session) row.setAttribute("aria-current", "page");
          row.onclick = () => open(group.server, session.id);
          section.append(row);
        }
        if (!group.sessions.length) section.append(element("span", "ps-empty", "\u6682\u65E0\u4F1A\u8BDD"));
        if (visible.length < group.sessions.length) {
          const more = button("ps-more", "\u663E\u793A\u66F4\u591A\u4F1A\u8BDD");
          more.dataset.key = group.id + "/more";
          nodes.set(more.dataset.key, more);
          more.onclick = () => {
            limits.set(group.id, limit + 10);
            draw();
          };
          section.append(more);
        }
      }
      if (isHidden) tucked.append(section);
      else fragment.append(section);
    }
    if (!groups.length || status) fragment.append(element("span", "ps-empty", status || "\u6682\u65E0\u9879\u76EE"));
    list.replaceChildren(fragment);
    if (!hiddenCount) shelfOpen = false;
    shelf.hidden = !hiddenCount;
    disclosure.setAttribute("aria-expanded", String(shelfOpen));
    count.textContent = String(hiddenCount);
    shelfList.hidden = !shelfOpen;
    shelfList.replaceChildren(tucked);
    if (menu.matches(":popover-open")) {
      if (!folderNodes.has(menuTarget)) menu.hidePopover();
      else item.textContent = hidden.has(menuTarget) ? "\u6062\u590D\u5230\u9879\u76EE\u5217\u8868" : "\u9690\u85CF\u6587\u4EF6\u5939";
    }
    if (focusKey) nodes.get(focusKey)?.focus({ preventScroll: true });
    list.scrollTop = scroll;
    shelfList.scrollTop = shelfScroll;
  }
  return { root, update(next, selection, message = "", hiddenIDs = []) {
    hidden = new Set(hiddenIDs);
    groups = next;
    active = selection;
    status = message;
    const target = selection && groups.find((g) => g.server === selection.server && g.sessions.some((s) => s.id === selection.id));
    const activeKey = target && JSON.stringify([target.id, selection.id]);
    if (activeKey && activeKey !== lastActive) expansion.set(target.id, true);
    lastActive = activeKey;
    draw();
  } };
}

// src/host.js
function watchSideList(change) {
  let current, pending = 0;
  const watch = new MutationObserver(() => {
    if (!pending) pending = requestAnimationFrame(locate);
  });
  function locate() {
    pending = 0;
    watch.disconnect();
    const header = document.querySelector('[data-slot="titlebar-v2"]');
    const shellRow = header?.nextElementSibling;
    const mount = document.querySelector('[data-slot="vertical-tabs-mount"]');
    const portal = mount?.firstElementChild;
    const list = Array.from(portal?.children ?? []).find((el) => el.classList.contains("flex-1") && el.classList.contains("min-h-0") && el.classList.contains("gap-1"));
    const next = list && !list.querySelector('[data-slot="sidebar-inbox"]') ? list : null;
    if (next !== current) {
      current = next;
      change(next);
    }
    if (!header) {
      watch.observe(document.body, { childList: true, subtree: true });
      return;
    }
    const ancestors = /* @__PURE__ */ new Set();
    for (const node of [header, shellRow, mount, portal, list]) {
      for (let el = node; el && !ancestors.has(el); el = el.parentElement) ancestors.add(el);
    }
    for (const node of ancestors) watch.observe(node, { childList: true });
  }
  locate();
  return () => {
    watch.disconnect();
    cancelAnimationFrame(pending);
  };
}

// src/tree.css
var tree_default = '[data-ocx-project-sidebar-hidden], .ps-tree[hidden], .ps-return[hidden] { display:none !important }\n.ps-tree, .ps-return {\n  --ps-ink:var(--v2-text-text-base,#44443f);\n  --ps-muted:var(--v2-text-text-muted,#75756c);\n  --ps-tint:var(--v2-overlay-simple-overlay-hover,rgba(63,56,39,.055));\n  --ps-current:var(--v2-overlay-simple-overlay-pressed,rgba(63,56,39,.083));\n  color:var(--ps-ink);\n  font:inherit;\n}\n.ps-tree { display:flex; flex:1 1 0; min-width:0; min-height:0; flex-direction:column; text-align:start; user-select:none }\n.ps-tree *, .ps-return { box-sizing:border-box }\n.ps-tree button, .ps-return { appearance:none; border:0; margin:0; background:transparent; color:inherit; font:inherit; cursor:pointer; text-align:start }\n.ps-tree svg { fill:none; stroke:currentColor; stroke-width:1.65; stroke-linecap:round; stroke-linejoin:round; height:18px; width:18px; flex:none }\n.ps-heading { height:32px; flex:none; display:flex; align-items:center; justify-content:space-between; padding:0 6px 0 10px; font-size:13px; font-weight:550; color:var(--ps-muted) }\n.ps-tree .ps-native { width:26px; height:26px; display:grid; place-items:center; border-radius:6px; opacity:.68 }\n.ps-tree .ps-native svg { width:15px; height:15px }\n.ps-list { flex:1; min-height:0; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; padding:1px 2px 8px }\n.ps-project + .ps-project { margin-top:3px }\n.ps-tree .ps-folder, .ps-tree .ps-session, .ps-tree .ps-more, .ps-tree .ps-empty {\n  width:100%; min-width:0; height:31px; line-height:31px; border-radius:9px; font-size:14px; font-weight:450;\n}\n.ps-tree .ps-folder { display:flex; align-items:center; gap:8px; padding:0 8px; }\n.ps-path { display:flex; flex:1 1 0; min-width:0; align-items:baseline; text-align:left; unicode-bidi:isolate; line-height:20px; overflow:hidden; white-space:nowrap }\n.ps-anchor { flex:none }\n.ps-tail { flex:1 1 auto; min-width:0; direction:rtl; text-align:left; overflow:hidden; text-overflow:ellipsis }\n.ps-server { min-width:0; max-width:30%; margin-inline-start:auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--ps-muted); font-size:11px }\n.ps-tree .ps-session, .ps-tree .ps-more, .ps-tree .ps-empty { display:block; padding:0 9px 0 35px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap }\n.ps-tree .ps-session:hover, .ps-tree .ps-folder:hover, .ps-tree .ps-more:hover, .ps-tree .ps-native:hover, .ps-return:hover { background:var(--ps-tint) }\n.ps-tree .ps-session[aria-current=page] { background:var(--ps-current); font-weight:550 }\n.ps-tree .ps-more, .ps-tree .ps-empty, .ps-return { color:var(--ps-muted); font-size:12px }\n.ps-return { align-self:flex-start; padding:4px 9px; border-radius:6px }\n.ps-tree button:focus-visible, .ps-return:focus-visible { outline:2px solid var(--v2-border-border-focus,currentColor); outline-offset:-2px }\n\n.ps-shelf[hidden], .ps-shelf-list[hidden] { display:none }\n.ps-shelf { display:flex; flex-direction:column; min-height:0; max-height:50%; flex:0 1 auto; border-top:1px solid var(--v2-border-border-weak,rgba(120,120,110,.18)); padding-top:3px }\n.ps-shelf-list { min-height:0; overflow:auto; scrollbar-width:thin; overscroll-behavior:contain; padding:1px 2px }\n.ps-tree .ps-disclosure { display:flex; align-items:center; gap:8px; flex:none; width:100%; border-radius:7px; padding:5px 10px; color:var(--ps-muted); font-size:13px; line-height:20px }\n.ps-disclosure svg { width:14px; height:14px }\n.ps-disclosure[aria-expanded="true"] svg { transform:rotate(90deg) }\n.ps-count { margin-inline-start:auto; font-variant-numeric:tabular-nums }\n.ps-menu { position:fixed; inset:auto; margin:0; min-width:146px; max-width:calc(100vw - 8px); padding:4px; border:1px solid var(--v2-border-border-weak,rgba(120,120,110,.24)); border-radius:9px; color:var(--ps-ink); background:var(--v2-background-bg-raised,var(--v2-background-bg-base,Canvas)); box-shadow:0 4px 16px #0002; font:inherit }\n.ps-tree .ps-menu-item { width:100%; border-radius:5px; padding:5px 9px; font-size:13px; line-height:20px; text-align:start }\n.ps-tree .ps-disclosure:hover, .ps-tree .ps-menu-item:hover, .ps-tree .ps-menu-item:focus-visible { background:var(--ps-tint) }\n\n.ps-tree .ps-menu-item { display:block }\n.ps-tree .ps-menu-item:disabled { color:var(--ps-muted); cursor:default; opacity:.62 }\n.ps-hint { max-width:228px; color:var(--ps-muted); margin:4px 9px; font-size:12px; line-height:1.45 }\n';

// src/plugin.js
var homeDirectory = import_gui.Ipc.define({ id: "project-sidebar.home", state: import_effect.Schema.String, methods: {} });
var historyEvents = /* @__PURE__ */ new Set(["session.created", "session.deleted", "session.archived", "session.unarchived", "session.renamed", "session.moved"]);
function serverHistory(server) {
  const [rows, setRows] = (0, import_solid_js.createSignal)([]);
  const [state, setState] = (0, import_solid_js.createSignal)("loading");
  const [revision, refresh] = (0, import_solid_js.createSignal)(0);
  (0, import_solid_js.createEffect)(() => {
    if (!server.connected) {
      setState("offline");
      return;
    }
    revision();
    setState("loading");
    const request = new AbortController();
    server.client.session.list({ limit: 500, order: "desc", parentID: null }, { signal: request.signal }).then((response) => {
      if (!request.signal.aborted) {
        setRows(response.data);
        setState("ready");
      }
    }).catch(() => {
      if (!request.signal.aborted) setState("error");
    });
    (0, import_solid_js.onCleanup)(() => request.abort());
  });
  (0, import_solid_js.createEffect)(() => {
    if (!server.connected) return;
    void server.data.project.sync().catch(() => {
    });
  });
  (0, import_solid_js.createEffect)(() => {
    const data = server.data;
    let timer;
    const stop = data.listen(({ details }) => {
      if (!historyEvents.has(details.type)) return;
      clearTimeout(timer);
      timer = setTimeout(() => refresh((n) => n + 1), 150);
    });
    (0, import_solid_js.onCleanup)(() => {
      clearTimeout(timer);
      stop();
    });
  });
  return { rows, state };
}
function attach(ctx, list) {
  const back = document.createElement("button");
  back.type = "button";
  back.className = "ps-return";
  back.textContent = "\u8FD4\u56DE\u9879\u76EE\u6811";
  let showNative = false;
  function mode(native) {
    showNative = native;
    tree.root.hidden = native;
    back.hidden = !native;
    list.toggleAttribute("data-ocx-project-sidebar-hidden", !native);
  }
  const folders = ctx.stores.folders;
  const resolveRow = (group) => nativeProjectRow(list, group, ctx.servers.list().map((id) => ctx.servers.get(id)));
  let confirming = false;
  async function closeProject(group) {
    if (confirming) return;
    confirming = true;
    try {
      const original = resolveRow(group);
      if (!original || !await ctx.dialogs.confirm(closeQuestion(group))) return;
      if (!list.isConnected || !await selectNativeClose(() => resolveRow(group), original)) {
        await ctx.dialogs.alert({ title: "\u672A\u80FD\u5173\u95ED\u6B64\u9879\u76EE", description: closeHelp });
        return;
      }
      folders.update((draft) => {
        draft.closed = setFolderHidden(draft.closed ?? [], group.id, true);
        draft.hidden = setFolderHidden(draft.hidden, group.id, false);
      });
    } finally {
      confirming = false;
    }
  }
  const tree = createTree({
    open: (server, id) => ctx.tabs.open({ server, id }, { focus: true }),
    closeProject,
    closeHint: (group) => resolveRow(group) ? "" : "\u539F\u751F\u5217\u8868\u4E2D\u672A\u627E\u5230\u552F\u4E00\u5339\u914D\u9879\u3002" + closeHelp,
    setHidden: (id, hide) => folders.update((draft) => {
      draft.hidden = setFolderHidden(draft.hidden, id, hide);
    }),
    native: () => {
      mode(true);
      back.focus();
    }
  });
  back.onclick = () => {
    mode(false);
    tree.root.querySelector(".ps-native").focus();
  };
  list.before(tree.root, back);
  mode(false);
  const histories = /* @__PURE__ */ new Map();
  const [generation, changed] = (0, import_solid_js.createSignal)(0);
  (0, import_solid_js.createEffect)(() => {
    const servers = ctx.servers.list().map((id) => ctx.servers.get(id)).filter(Boolean);
    for (const [server, record] of histories) {
      if (!servers.includes(server)) {
        record.dispose();
        histories.delete(server);
      }
    }
    for (const server of servers) if (!histories.has(server)) {
      const record = (0, import_solid_js.createRoot)((dispose) => ({ dispose, ...serverHistory(server) }));
      histories.set(server, record);
    }
    changed((n) => n + 1);
  });
  const home = ctx.main(homeDirectory);
  const data = (0, import_solid_js.createMemo)(() => {
    generation();
    const sources = [...histories].map(([server, history]) => ({
      id: server.id,
      name: server.name,
      home: server.builtin ? home.state() : void 0,
      projects: server.data.project.list(),
      known: server.data.session.list(),
      history: history.rows(),
      state: history.state()
    }));
    const groups = projectGroups(sources);
    const status = sources.some((s) => s.state === "error" || s.state === "offline") ? "\u90E8\u5206\u4F1A\u8BDD\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6" : !groups.length && sources.some((s) => s.state === "loading") ? "\u6B63\u5728\u8BFB\u53D6\u9879\u76EE\u2026" : "";
    return { groups, status };
  });
  let previousSelection;
  (0, import_solid_js.createEffect)(() => {
    const closed = folders.value.closed ?? [];
    if (!closed.length) return;
    const candidates = data().groups.filter((group) => closed.includes(group.id));
    function reconcile() {
      const returned = candidates.filter((group) => resolveRow(group)).map((group) => group.id);
      if (returned.length) folders.update((draft) => {
        draft.closed = (draft.closed ?? []).filter((id) => !returned.includes(id));
      });
    }
    reconcile();
    const observer = new MutationObserver(reconcile);
    observer.observe(list, { childList: true, subtree: true, characterData: true });
    (0, import_solid_js.onCleanup)(() => observer.disconnect());
  });
  (0, import_solid_js.createEffect)(() => {
    const selected = ctx.tabs.list().find((t) => t.active)?.session;
    const closed = folders.value.closed ?? [];
    if (previousSelection !== void 0 && previousSelection !== selected?.key && selected) {
      const group = data().groups.find((g) => g.server === selected.server.id && g.sessions.some((s) => s.id === selected.id));
      if (group && closed.includes(group.id)) folders.update((draft) => {
        draft.closed = setFolderHidden(draft.closed ?? [], group.id, false);
      });
    }
    previousSelection = selected?.key ?? null;
    tree.update(data().groups.filter((g) => !closed.includes(g.id)), selected && { id: selected.id, server: selected.server.id }, data().status, folders.value.hidden);
  });
  (0, import_solid_js.onCleanup)(() => {
    for (const record of histories.values()) record.dispose();
    list.removeAttribute("data-ocx-project-sidebar-hidden");
    const focused = tree.root.contains(document.activeElement) || showNative && document.activeElement === back;
    tree.root.remove();
    back.remove();
    if (focused && list.isConnected) list.querySelector("button")?.focus({ preventScroll: true });
  });
}
var plugin_default = import_gui.Plugin.define({
  stores: { folders: import_gui.Store.global(import_effect.Schema.Struct({ hidden: import_effect.Schema.Array(import_effect.Schema.String), closed: import_effect.Schema.optional(import_effect.Schema.Array(import_effect.Schema.String)) }), { hidden: [] }) },
  main(ctx) {
    const home = require("node:os").homedir();
    ctx.provide(homeDirectory, { state: () => home });
  },
  setup(ctx) {
    ctx.add(import_gui.Style, tree_default);
    ctx.add(import_gui.Slot, { at: "window.bottom", render() {
      const anchor = document.createElement("span");
      anchor.hidden = true;
      const [list, setList] = (0, import_solid_js.createSignal)(null);
      const stop = watchSideList(setList);
      (0, import_solid_js.onCleanup)(stop);
      (0, import_solid_js.createEffect)(() => {
        const target = list();
        if (target) attach(ctx, target);
      });
      return anchor;
    } });
  }
});
