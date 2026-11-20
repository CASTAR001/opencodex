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

// src/tree.js
var ns = "http://www.w3.org/2000/svg";
var paths = {
  folder: "M3 7V5.5A1.5 1.5 0 0 1 4.5 4H9l2.2 2.4h8.3A1.5 1.5 0 0 1 21 8v10.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V7Zm0 2h18",
  open: "M3 17V5.5A1.5 1.5 0 0 1 4.5 4H9l2.2 2.4H18A1.5 1.5 0 0 1 19.5 8v1M3.4 18.3l2.4-7.6A1.8 1.8 0 0 1 7.5 9.5h12.8a1.2 1.2 0 0 1 1.1 1.6l-2.5 7.4a2 2 0 0 1-1.9 1.4H5a1.7 1.7 0 0 1-1.6-1.6Z",
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
function createTree({ open, native }) {
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
  root.append(header, list);
  const expansion = /* @__PURE__ */ new Map();
  const limits = /* @__PURE__ */ new Map();
  let groups = [], active, status, lastActive;
  function draw() {
    const focusKey = list.contains(document.activeElement) && document.activeElement.dataset.key;
    const scroll = list.scrollTop;
    const fragment = document.createDocumentFragment();
    const servers = new Set(groups.map((g) => g.server));
    const nodes = /* @__PURE__ */ new Map();
    for (const group of groups) {
      const section = element("div", "ps-project");
      const expanded = expansion.get(group.id) ?? group.sessions.length > 0;
      const head = button("ps-folder");
      nodes.set(group.id, head);
      head.dataset.key = group.id;
      head.title = servers.size > 1 ? group.name + " \xB7 " + group.path : group.path;
      head.setAttribute("aria-label", head.title);
      head.setAttribute("aria-expanded", String(expanded));
      head.append(icon(expanded ? "open" : "folder"));
      const label = element("span", "ps-path");
      label.dir = "ltr";
      const split = Math.max(group.label.lastIndexOf("/"), group.label.lastIndexOf("\\")) + 1;
      if (split && split < group.label.length) {
        const prefix = group.label.slice(0, split);
        const anchor = prefix.match(/^(?:~[\/\\]|[A-Za-z]:[\/\\]|\/Volumes\/[^/]+\/|\/)/)?.[0] ?? "";
        const parent = element("span", "ps-prefix");
        parent.append(element("bdi", "", prefix.slice(anchor.length)));
        label.append(element("span", "ps-anchor", anchor), parent, element("span", "ps-leaf", group.label.slice(split)));
      } else label.textContent = group.label;
      head.append(label);
      if (servers.size > 1) head.append(element("span", "ps-server", group.name));
      head.onclick = () => {
        expansion.set(group.id, !expanded);
        draw();
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
      fragment.append(section);
    }
    if (!groups.length || status) fragment.append(element("span", "ps-empty", status || "\u6682\u65E0\u9879\u76EE"));
    list.replaceChildren(fragment);
    if (focusKey) nodes.get(focusKey)?.focus({ preventScroll: true });
    list.scrollTop = scroll;
  }
  return { root, update(next, selection, message = "") {
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
var tree_default = "[data-ocx-project-sidebar-hidden], .ps-tree[hidden], .ps-return[hidden] { display:none !important }\n.ps-tree, .ps-return {\n  --ps-ink:var(--v2-text-text-base,#44443f);\n  --ps-muted:var(--v2-text-text-muted,#75756c);\n  --ps-tint:var(--v2-overlay-simple-overlay-hover,rgba(63,56,39,.055));\n  --ps-current:var(--v2-overlay-simple-overlay-pressed,rgba(63,56,39,.083));\n  color:var(--ps-ink);\n  font:inherit;\n}\n.ps-tree { display:flex; flex:1 1 0; min-width:0; min-height:0; flex-direction:column; text-align:start; user-select:none }\n.ps-tree *, .ps-return { box-sizing:border-box }\n.ps-tree button, .ps-return { appearance:none; border:0; margin:0; background:transparent; color:inherit; font:inherit; cursor:pointer; text-align:start }\n.ps-tree svg { fill:none; stroke:currentColor; stroke-width:1.65; stroke-linecap:round; stroke-linejoin:round; height:18px; width:18px; flex:none }\n.ps-heading { height:32px; flex:none; display:flex; align-items:center; justify-content:space-between; padding:0 6px 0 10px; font-size:13px; font-weight:550; color:var(--ps-muted) }\n.ps-tree .ps-native { width:26px; height:26px; display:grid; place-items:center; border-radius:6px; opacity:.68 }\n.ps-tree .ps-native svg { width:15px; height:15px }\n.ps-list { flex:1; min-height:0; overflow:auto; overscroll-behavior:contain; scrollbar-width:thin; padding:1px 2px 8px }\n.ps-project + .ps-project { margin-top:3px }\n.ps-tree .ps-folder, .ps-tree .ps-session, .ps-tree .ps-more, .ps-tree .ps-empty {\n  width:100%; min-width:0; height:31px; line-height:31px; border-radius:9px; font-size:14px; font-weight:450;\n}\n.ps-tree .ps-folder { display:flex; align-items:center; gap:8px; padding:0 8px; }\n.ps-path { display:flex; min-width:0; text-align:left; unicode-bidi:isolate; line-height:normal; overflow:hidden; white-space:nowrap }\n.ps-anchor { flex:0 0 auto; max-width:45%; overflow:hidden; text-overflow:ellipsis }\n.ps-prefix { min-width:0; flex:0 1 auto; overflow:hidden; direction:rtl; text-overflow:ellipsis }\n.ps-prefix bdi { direction:ltr }\n.ps-leaf { flex:0 0 auto; max-width:55%; overflow:hidden; text-overflow:ellipsis }\n.ps-server { min-width:0; max-width:30%; margin-inline-start:auto; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--ps-muted); font-size:11px }\n.ps-tree .ps-session, .ps-tree .ps-more, .ps-tree .ps-empty { display:block; padding:0 9px 0 35px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap }\n.ps-tree .ps-session:hover, .ps-tree .ps-folder:hover, .ps-tree .ps-more:hover, .ps-tree .ps-native:hover, .ps-return:hover { background:var(--ps-tint) }\n.ps-tree .ps-session[aria-current=page] { background:var(--ps-current); font-weight:550 }\n.ps-tree .ps-more, .ps-tree .ps-empty, .ps-return { color:var(--ps-muted); font-size:12px }\n.ps-return { align-self:flex-start; padding:4px 9px; border-radius:6px }\n.ps-tree button:focus-visible, .ps-return:focus-visible { outline:2px solid var(--v2-border-border-focus,currentColor); outline-offset:-2px }\n";

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
  const tree = createTree({
    open: (server, id) => ctx.tabs.open({ server, id }, { focus: true }),
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
  (0, import_solid_js.createEffect)(() => {
    const selected = ctx.tabs.list().find((t) => t.active)?.session;
    tree.update(data().groups, selected && { id: selected.id, server: selected.server.id }, data().status);
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
