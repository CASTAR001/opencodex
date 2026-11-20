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
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
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
var import_solid_js = require("solid-js");

// src/contract.js
var families = {
  kimi: "Kimi",
  mimo: "\u5C0F\u7C73 MiMo",
  glm: "\u667A\u8C31 GLM",
  deepseek: "DeepSeek",
  minimax: "MiniMax",
  qwen: "Qwen \xB7 \u767E\u70BC"
};
var unavailable = {
  qwen: "\u666E\u901A\u767E\u70BC\u63A8\u7406 Key \u65E0\u6CD5\u67E5\u8BE2\u963F\u91CC\u4E91\u8D26\u6237\u4F59\u989D\u3002\u6A21\u578B\u6D88\u8017\u89C1\u7528\u91CF\u9875\u3002"
};
var object = (properties, required) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false
});
var contract = {
  id: "provider-quota",
  events: {},
  methods: {
    inventory: { input: object({}, []), output: { type: "array", items: { type: "object" } } },
    refresh: {
      input: object(
        { family: { enum: Object.keys(families) }, source: { type: "string", maxLength: 256 } },
        ["family"]
      ),
      output: { type: "array", items: { type: "object" } }
    },
    media: {
      input: object({ from: { type: "number", minimum: 0 }, to: { type: "number", minimum: 0 } }, [
        "from",
        "to"
      ]),
      output: { type: "array", items: { type: "object" } }
    }
  }
};

// src/style.css
var style_default = `.pq-page {
  color: var(--text-base);
  font: inherit;
  padding: 0 0 12px;
  min-width: 0;
}
.pq-toolbar,
.pq-toolbar nav,
.pq-controls,
.pq-top,
.pq-counters {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pq-toolbar {
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.pq-open,
.pq-page button,
.pq-page select {
  font: inherit;
  color: var(--text-base);
  cursor: pointer;
  line-height: 1.5;
  border-radius: 6px;
  padding: 3px 9px;
}
.pq-open:hover,
.pq-page button:hover,
.pq-page button[aria-pressed='true'] {
  background: var(--surface-base-hover);
  color: var(--text-strong);
}
.pq-page button:disabled {
  opacity: 0.55;
  cursor: default;
}
.pq-page button,
.pq-page select {
  border: 1px solid var(--border-weak-base);
  background: var(--surface-base);
}
.pq-controls {
  justify-content: flex-end;
  margin-inline-start: auto;
  flex-wrap: wrap;
}
.pq-controls:empty {
  display: none;
}
.pq-counters {
  gap: 24px;
  margin: 8px 0 16px;
}
.pq-counters span,
.pq-muted,
.pq-card small {
  color: var(--text-weak);
  font-size: 12px;
}
.pq-counters strong {
  display: block;
  font-size: 22px;
  font-weight: 600;
  color: var(--text-strong);
}
.pq-page table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
}
.pq-scroll {
  overflow-x: auto;
}
.pq-page td,
.pq-page th {
  text-align: right;
  padding: 7px 6px;
  border-bottom: 1px solid var(--border-weak-base);
  white-space: nowrap;
}
.pq-page th:first-child,
.pq-page td:first-child {
  text-align: left;
  white-space: normal;
  overflow-wrap: anywhere;
}
.pq-page h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 14px 0 5px;
}
.pq-muted,
.pq-card small {
  display: block;
  margin: 5px 0;
}
.pq-card {
  border: 1px solid var(--border-weak-base);
  border-radius: 9px;
  padding: 10px 12px;
  margin-bottom: 8px;
}
.pq-top {
  justify-content: space-between;
}
.pq-top h3 {
  margin: 0;
}
.pq-page details {
  margin: 12px 0;
}
.pq-page summary {
  cursor: pointer;
}
.pq-open {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--text-weak);
}
.pq-open[hidden] {
  display: none;
}
.pq-open:focus-visible {
  outline: 2px solid var(--border-focus);
}
.pq-open {
  --pq-wallet: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M16 7V4.5a1 1 0 0 0-1.2-1L4.7 5.6A2 2 0 0 0 3 7.6V15a1.5 1.5 0 0 0 1.5 1.5H16a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5'/%3E%3Cpath d='M17 10h-3a1.6 1.6 0 0 0 0 3.2h3'/%3E%3C/svg%3E");
}
.pq-open { flex: 0 0 28px; -webkit-app-region: no-drag; }
.pq-open::before {
  content: ''; display: inline-block; width: 18px; height: 18px;
  background: currentColor; mask: var(--pq-wallet) center / contain no-repeat;
}
/* Anchor inside the draft so the button clears both native title bars and sidebars. */
[data-component="new-session"] { anchor-name: --pq-draft; }
.pq-draft-entry:not(:empty) {
  position: fixed;
  position-anchor: --pq-draft;
  top: calc(anchor(top, 40px) + 10px);
  right: calc(anchor(right, 0px) + 12px);
  z-index: 2;
}

.pq-narrow-entry { display: none; }
@media (max-width: 767px) {
  .pq-narrow-entry:not(:empty) {
    display: flex;
    justify-content: flex-end;
    flex: 0 0 auto;
    padding-inline: 8px;
    order: 9999;
  }
  .session-header-actions .pq-open { display: none; }
}
`;

// src/plugin.js
var number = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 });
var fmt = (n) => Number.isFinite(n) ? number.format(n) : "\u2014";
var quotaNumber = new Intl.NumberFormat("zh-CN", { maximumSignificantDigits: 21 });
function remainingText(row) {
  if (row.unit === "Credits") {
    if (!(row.total > 0)) return "\u5269\u4F59 " + quotaNumber.format(row.remaining) + " Credits";
    const percent2 = row.remaining / row.total * 100;
    return "\u5269\u4F59 " + (percent2 > 0 && percent2 < 0.01 ? "<0.01" : fmt(percent2)) + "%";
  }
  if (row.unit && row.unit !== "%") {
    return row.remaining != null ? quotaNumber.format(row.remaining) + " " + row.unit : "\u672A\u8FD4\u56DE\u4F59\u989D";
  }
  let percent;
  if (row.unit === "%" && row.remaining != null) percent = row.remaining;
  else if (row.unit === "%" && row.used != null) percent = 100 - row.used;
  else if (row.total > 0) {
    const left = row.remaining ?? row.count ?? (row.used != null ? row.total - row.used : void 0);
    if (left != null) percent = left / row.total * 100;
  }
  if (percent != null) return "\u5269\u4F59 " + fmt(percent) + "%";
  if (row.remaining != null) return "\u5269\u4F59 " + quotaNumber.format(row.remaining);
  return row.state ?? "\u672A\u8FD4\u56DE\u5269\u4F59\u6BD4\u4F8B";
}
var time = (t) => new Date(t).toLocaleString("zh-CN", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});
function el(tag, text, cls) {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
}
function btn(text, action) {
  const n = el("button", text);
  n.type = "button";
  n.onclick = action;
  return n;
}
function table(headers, rows) {
  const t = el("table"), head = t.createTHead().insertRow();
  for (const h of headers) head.append(el("th", h));
  const body = t.createTBody();
  for (const values of rows) {
    const row = body.insertRow();
    for (const value of values) row.insertCell().textContent = value;
  }
  const scroll = el("div", null, "pq-scroll");
  scroll.append(t);
  return scroll;
}
function range(days, now = /* @__PURE__ */ new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - Math.max(0, days - 1));
  return { from: days ? start.getTime() : 0, to: now.getTime() + 1 };
}
function total(t) {
  return t.input + t.output + t.reasoning + t.cache.read + t.cache.write;
}
function usageView(stats, media, providers, showMini) {
  const box = el("div");
  const models = stats.models.filter((m) => providers.includes(m.model.providerID));
  const counters = el("div", null, "pq-counters");
  for (const [name, value] of [
    ["Token \u603B\u91CF", models.reduce((n, m) => n + total(m.tokens), 0)],
    ["\u6A21\u578B\u6B65\u9AA4", models.reduce((n, m) => n + m.steps, 0)]
  ]) {
    const item = el("div");
    item.append(el("span", name), el("strong", fmt(value)));
    counters.append(item);
  }
  if (providers.length)
    box.append(
      counters,
      models.length ? table(
        ["\u6A21\u578B / \u670D\u52A1\u5546", "\u8F93\u5165", "\u8F93\u51FA", "\u63A8\u7406", "\u7F13\u5B58\u8BFB", "\u7F13\u5B58\u5199"],
        models.map(({ model, tokens: t }) => [
          model.id + (model.variant ? " \xB7 " + model.variant : "") + " / " + model.providerID,
          ...[t.input, t.output, t.reasoning, t.cache.read, t.cache.write].map(fmt)
        ])
      ) : el("p", "\u65F6\u6BB5\u5185\u6CA1\u6709\u5339\u914D\u7684\u6A21\u578B\u8BB0\u5F55\u3002", "pq-muted")
    );
  if (showMini) {
    box.append(el("h3", "MiniMax MCP"));
    if (media) {
      box.append(
        table(
          ["\u5DE5\u5177", "\u6210\u529F", "\u5931\u8D25"],
          media.map((r) => [r.kind, fmt(r.calls - r.failed), fmt(r.failed)])
        ),
        el(
          "small",
          media[0]?.source === "history" ? "\u6765\u81EA\u672C\u673A\u5386\u53F2\uFF0C\u542B Code Mode \u5185\u5C42\u8C03\u7528\u3002" : "\u5BBF\u4E3B\u5386\u53F2\u4E0D\u53EF\u7528\uFF0C\u4EC5\u663E\u793A\u63D2\u4EF6\u542F\u7528\u540E\u89C2\u5BDF\u5230\u7684\u8C03\u7528\u3002",
          "pq-muted"
        )
      );
    } else box.append(el("p", "\u5DE5\u5177\u8BA1\u6570\u6682\u4E0D\u53EF\u7528\u3002", "pq-muted"));
    box.append(el("p", "MCP \u8BB0\u5F55\u6CA1\u6709\u9010\u7B14\u6263\u989D\uFF0C\u5B9E\u9645\u6D88\u8017\u8BF7\u4EE5 MiniMax \u8D26\u5355\u4E3A\u51C6\u3002", "pq-muted"));
  }
  return box;
}
function dashboard(ctx, session) {
  const root = el("div", null, "pq-page");
  const toolbar = el("div", null, "pq-toolbar"), nav = el("nav"), controls = el("div", null, "pq-controls"), content = el("div"), status = el("p", null, "pq-muted");
  status.setAttribute("role", "status");
  const pages = { quota: "\u5269\u4F59\u989D\u5EA6", usage: "\u7528\u91CF\u7EDF\u8BA1" };
  let index = "quota", days = 7, filter = "", alive = true, serial = 0, active, clock, queued, stats, media, lastRead;
  const location = session.location;
  const client = session.server.client;
  const api = client.rpc(contract);
  const lifetime = new AbortController();
  const history = /* @__PURE__ */ new Map();
  const busy = /* @__PURE__ */ new Map();
  const keys = Object.keys(pages);
  const buttons = keys.map((key) => btn(pages[key], () => {
    if (key !== index) switchTo(key);
  }));
  nav.append(...buttons);
  toolbar.append(nav, controls);
  root.append(toolbar, content, status);
  function selection(label, options2, value, change) {
    const select = el("select");
    select.setAttribute("aria-label", label);
    for (const [id, name] of options2) select.add(new Option(name, String(id)));
    select.value = String(value);
    select.onchange = () => change(select.value);
    return select;
  }
  let configured = [], discovered = false, inventorySerial = 0;
  const has = (id) => configured.some((row) => row.family === id);
  const options = () => configured.map((row) => [row.family, families[row.family]]);
  function drawUsage() {
    if (!discovered || !configured.length || index !== "usage") return;
    if (!stats) return;
    const selected = configured.filter((row) => !filter || row.family === filter);
    content.replaceChildren(usageView(
      stats,
      media,
      selected.flatMap((row) => row.providers),
      selected.some((row) => row.family === "minimax")
    ));
  }
  async function discover() {
    if (!alive || document.hidden) return;
    const ticket = ++inventorySerial;
    try {
      const list = await api.inventory({}, { location, signal: AbortSignal.any([lifetime.signal, AbortSignal.timeout(12e3)]) });
      if (!alive || ticket !== inventorySerial) return;
      const changed = !discovered || JSON.stringify(list) !== JSON.stringify(configured);
      discovered = true;
      if (!changed) return;
      for (const [id, cached] of history) {
        if (JSON.stringify(list.find((r) => r.family === id)) !== cached.connection) history.delete(id);
      }
      const changedAccounts = list.filter((row) => JSON.stringify(configured.find((previous) => previous.family === row.family)) !== JSON.stringify(row));
      configured = list;
      if (!has(filter)) filter = "";
      stats = media = lastRead = void 0;
      switchTo(index, changedAccounts);
    } catch {
      if (alive && ticket === inventorySerial) status.textContent = "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u5F53\u524D\u670D\u52A1\u5546\u914D\u7F6E\u3002";
    }
  }
  async function readUsage() {
    if (!alive || index !== "usage" || !discovered || !configured.length || document.hidden || active) return;
    const token = ++serial, controller = new AbortController();
    active = controller;
    const span = range(days);
    const readOptions = { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15e3)]) };
    const local = { ...readOptions, location };
    try {
      const [data, calls] = await Promise.allSettled([
        client.experimental.session.stats(
          { ...span, from: span.from || void 0, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", tools: "none" },
          readOptions
        ),
        has("minimax") && api.media(span, local)
      ]);
      if (!alive || token !== serial) return;
      media = calls.status === "fulfilled" ? calls.value : void 0;
      if (data.status === "fulfilled") stats = data.value;
      drawUsage();
      if (data.status === "rejected") status.textContent = "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6A21\u578B\u7EDF\u8BA1\u3002";
      else {
        lastRead = Date.now();
        status.textContent = "\u5F53\u524D\u670D\u52A1\u5668 \xB7 \u6240\u6709\u9879\u76EE \xB7 \u66F4\u65B0\u4E8E " + time(lastRead);
      }
    } finally {
      if (active === controller) active = void 0;
    }
  }
  function drawQuotas() {
    if (!alive || index !== "quota") return;
    const cards = options().map(([id, name]) => {
      const card = el("section", null, "pq-card"), top = el("div", null, "pq-top");
      top.append(el("h3", name));
      if (!unavailable[id]) {
        const b = btn(busy.has(id) ? "\u67E5\u8BE2\u4E2D\u2026" : "\u5237\u65B0", () => refresh(id));
        b.disabled = busy.has(id);
        b.setAttribute("aria-label", "\u5237\u65B0 " + name);
        top.append(b);
      }
      card.append(top);
      const entries = history.get(id)?.rows;
      if (!entries) card.append(el("p", unavailable[id] || (busy.has(id) ? "\u6B63\u5728\u67E5\u8BE2\u989D\u5EA6\u2026" : "\u7B49\u5F85\u67E5\u8BE2"), "pq-muted"));
      for (const entry of entries || []) {
        for (const row of entry.values || []) {
          const reset = row.endsAt ? "\u3000\u5468\u671F\u7ED3\u675F " + time(row.endsAt) : row.reset ? "\u3000\u91CD\u7F6E " + time(row.reset) : "";
          card.append(el("div", row.label + "\u3000" + remainingText(row) + reset));
        }
        if (entry.problem) card.append(el("p", entry.problem, "pq-muted"));
        if (entry.select) {
          const one = btn("\u67E5\u8BE2 " + entry.source, () => refresh(id, entry.source));
          one.disabled = busy.has(id);
          card.append(one);
        }
        if (entry.at) card.append(el("small", "\u67E5\u8BE2\u4E8E " + time(entry.at)));
      }
      return card;
    });
    content.replaceChildren(...cards);
    const all = controls.querySelector("button");
    if (all) all.disabled = busy.size > 0 || !configured.some((r) => !unavailable[r.family]);
  }
  async function refresh(id, source) {
    if (unavailable[id] || !has(id)) return;
    const connection = JSON.stringify(configured.find((r) => r.family === id));
    if (busy.get(id) === connection) return;
    const valid = () => alive && connection === JSON.stringify(configured.find((r) => r.family === id));
    busy.set(id, connection);
    drawQuotas();
    try {
      const rows = await api.refresh(
        { family: id, ...source && { source } },
        { location, signal: AbortSignal.any([lifetime.signal, AbortSignal.timeout(15e3)]) }
      );
      if (valid())
        history.set(id, {
          connection,
          rows: source ? [...(history.get(id)?.rows || []).filter((p) => p.source !== source), ...rows] : rows
        });
    } catch (error) {
      const problem = error?.name === "TimeoutError" ? "\u672C\u673A\u989D\u5EA6\u67E5\u8BE2\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u5237\u65B0\u3002" : "\u672C\u673A\u989D\u5EA6\u63D2\u4EF6\u672A\u80FD\u8FD4\u56DE\u7ED3\u679C\uFF0C\u8BF7\u7A0D\u540E\u5237\u65B0\u3002";
      if (valid()) history.set(id, { connection, rows: [{ problem }] });
    } finally {
      if (busy.get(id) === connection) busy.delete(id);
      drawQuotas();
    }
  }
  function cancelUsage() {
    ++serial;
    active?.abort();
    active = void 0;
    clearInterval(clock);
    clearTimeout(queued);
    queued = void 0;
  }
  function switchTo(i, refreshAccounts = configured) {
    cancelUsage();
    index = i;
    buttons.forEach((b, n) => b.setAttribute("aria-pressed", String(i === keys[n])));
    controls.replaceChildren();
    content.replaceChildren();
    status.textContent = "";
    if (!discovered || !configured.length) {
      status.textContent = discovered ? "\u5F53\u524D\u5DE5\u4F5C\u533A\u5C1A\u672A\u914D\u7F6E\u652F\u6301\u7684\u670D\u52A1\u5546\u3002" : "\u6B63\u5728\u8BFB\u53D6\u5F53\u524D\u670D\u52A1\u5546\u2026";
      return;
    }
    if (i === "usage") {
      controls.append(
        selection(
          "\u7EDF\u8BA1\u65F6\u6BB5",
          [
            [1, "\u4ECA\u5929"],
            [7, "\u8FD1 7 \u5929"],
            [30, "\u8FD1 30 \u5929"],
            [0, "\u5168\u90E8\u65F6\u95F4"]
          ],
          days,
          (v) => {
            days = Number(v);
            stats = media = lastRead = void 0;
            switchTo("usage");
          }
        ),
        selection("\u6A21\u578B\u670D\u52A1\u5546", [["", "\u5168\u90E8\u670D\u52A1\u5546"], ...options()], filter, (v) => {
          filter = v;
          drawUsage();
        })
      );
      drawUsage();
      void readUsage();
      clock = setInterval(readUsage, 6e4);
    } else {
      controls.append(btn("\u5237\u65B0\u5168\u90E8\u989D\u5EA6", () => Promise.all(configured.map((r) => refresh(r.family)))));
      drawQuotas();
      for (const row of refreshAccounts) void refresh(row.family);
    }
  }
  const visible = () => {
    void discover();
    void readUsage();
  };
  const inventoryClock = setInterval(discover, 3e4);
  document.addEventListener("visibilitychange", visible);
  const stop = session.server.data?.listen(({ name }) => {
    if ([
      "provider.updated",
      "model.updated",
      "integration.updated",
      "config.updated",
      "mcp.status.changed",
      "mcp.tools.changed",
      "server.connected"
    ].includes(name))
      void discover();
    if (index !== "usage" || document.hidden || queued || ![
      "session.step.ended",
      "session.step.failed",
      "session.compaction.ended",
      "server.connected"
    ].includes(name))
      return;
    queued = setTimeout(() => {
      queued = void 0;
      void readUsage();
    }, 1e3);
  });
  (0, import_solid_js.onCleanup)(() => {
    alive = false;
    lifetime.abort();
    cancelUsage();
    stop?.();
    clearInterval(inventoryClock);
    document.removeEventListener("visibilitychange", visible);
  });
  switchTo("quota");
  void discover();
  return (0, import_solid_js.createComponent)(ctx.ui.Dialog, { title: session.location ? "\u7528\u91CF\u4E0E\u989D\u5EA6" : "\u7528\u91CF\u4E0E\u989D\u5EA6 \xB7 \u672C\u673A\u5168\u5C40", size: "large", children: root });
}
var plugin_default = import_gui.Plugin.define({
  setup(ctx) {
    ctx.add(import_gui.Style, style_default);
    const draft = () => ctx.router.path().split("?")[0] === "/new-session";
    const localAccount = () => {
      const server = ctx.servers.list().map((id) => ctx.servers.get(id)).find((server2) => server2?.builtin);
      if (server) return { server };
    };
    const show = (account) => ctx.dialogs.open(() => dashboard(ctx, account));
    const wallet = (open, global) => {
      const button = btn(null, open);
      button.className = "pq-open";
      button.title = global ? "\u67E5\u770B\u672C\u673A\u5168\u5C40\u989D\u5EA6" : "\u67E5\u770B\u7528\u91CF\u4E0E\u989D\u5EA6";
      button.setAttribute("aria-label", button.title);
      return button;
    };
    ctx.add(import_gui.Slot, { at: "window.bottom", render() {
      const dock = el("div", null, "pq-narrow-entry");
      (0, import_solid_js.createEffect)(() => {
        const global = draft();
        dock.className = global ? "pq-draft-entry" : "pq-narrow-entry";
        const account = global ? localAccount() : ctx.sessions.current();
        dock.replaceChildren(...account ? [wallet(() => show(account), global)] : []);
      });
      return dock;
    } });
    ctx.add(import_gui.Slot, {
      at: "session.header",
      order: 8,
      render(input) {
        const button = wallet(() => show(input.session), false);
        (0, import_solid_js.createEffect)(() => {
          button.hidden = !input.active;
        });
        return button;
      }
    });
  }
});
