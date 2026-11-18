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
  mimo: "MiMo \u4EC5\u6839\u636E\u672C\u5730\u8BB0\u5F55\u4F30\u7B97 Standard \u6708\u989D\u5EA6\u5360\u6BD4\u3002",
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
    mimo: {
      input: object(
        Object.fromEntries(["from", "today", "to"].map((k) => [k, { type: "integer", minimum: 0 }])),
        ["from", "today", "to"]
      ),
      output: { type: "object" }
    },
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
var style_default = ".pq-page {\n  color: var(--text-base);\n  font: inherit;\n  padding: 0 0 12px;\n  min-width: 0;\n}\n.pq-toolbar,\n.pq-toolbar nav,\n.pq-controls,\n.pq-top,\n.pq-counters {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n}\n.pq-toolbar {\n  flex-wrap: wrap;\n  margin-bottom: 10px;\n}\n.pq-open,\n.pq-page button,\n.pq-page select {\n  font: inherit;\n  color: var(--text-base);\n  cursor: pointer;\n  line-height: 1.5;\n  border-radius: 6px;\n  padding: 3px 9px;\n}\n.pq-open:hover,\n.pq-page button:hover,\n.pq-page button[aria-pressed='true'] {\n  background: var(--surface-base-hover);\n  color: var(--text-strong);\n}\n.pq-page button:disabled {\n  opacity: 0.55;\n  cursor: default;\n}\n.pq-page button,\n.pq-page select {\n  border: 1px solid var(--border-weak-base);\n  background: var(--surface-base);\n}\n.pq-controls {\n  justify-content: flex-end;\n  margin-inline-start: auto;\n  flex-wrap: wrap;\n}\n.pq-controls:empty {\n  display: none;\n}\n.pq-counters {\n  gap: 24px;\n  margin: 8px 0 16px;\n}\n.pq-counters span,\n.pq-muted,\n.pq-card small {\n  color: var(--text-weak);\n  font-size: 12px;\n}\n.pq-counters strong {\n  display: block;\n  font-size: 22px;\n  font-weight: 600;\n  color: var(--text-strong);\n}\n.pq-page table {\n  width: 100%;\n  border-collapse: collapse;\n  font-variant-numeric: tabular-nums;\n  font-size: 13px;\n}\n.pq-scroll {\n  overflow-x: auto;\n}\n.pq-page td,\n.pq-page th {\n  text-align: right;\n  padding: 7px 6px;\n  border-bottom: 1px solid var(--border-weak-base);\n  white-space: nowrap;\n}\n.pq-page th:first-child,\n.pq-page td:first-child {\n  text-align: left;\n  white-space: normal;\n  overflow-wrap: anywhere;\n}\n.pq-page h3 {\n  font-size: 14px;\n  font-weight: 600;\n  margin: 14px 0 5px;\n}\n.pq-muted,\n.pq-card small {\n  display: block;\n  margin: 5px 0;\n}\n.pq-card {\n  border: 1px solid var(--border-weak-base);\n  border-radius: 9px;\n  padding: 10px 12px;\n  margin-bottom: 8px;\n}\n.pq-top {\n  justify-content: space-between;\n}\n.pq-top h3 {\n  margin: 0;\n}\n.pq-page details {\n  margin: 12px 0;\n}\n.pq-page summary {\n  cursor: pointer;\n}\n.pq-open {\n  display: inline-grid;\n  place-items: center;\n  width: 28px;\n  height: 28px;\n  padding: 0;\n  color: var(--text-weak);\n}\n.pq-open[hidden] {\n  display: none;\n}\n.pq-open:focus-visible {\n  outline: 2px solid var(--border-focus);\n}\n";

// src/plugin.js
var number = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 });
var fmt = (n) => Number.isFinite(n) ? number.format(n) : "\u2014";
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
function dashboard(ctx, session, cache) {
  const root = el("div", null, "pq-page");
  const toolbar = el("div", null, "pq-toolbar"), nav = el("nav"), controls = el("div", null, "pq-controls"), content = el("div"), status = el("p", null, "pq-muted");
  status.setAttribute("role", "status");
  const pages = ["\u7528\u91CF\u7EDF\u8BA1", "\u8D26\u6237\u989D\u5EA6"];
  let index = 0, days = 7, filter = "", alive = true, serial = 0, active, clock, queued, stats, media, lastRead;
  const location = session.location;
  const client = session.server.client;
  const api = client.rpc(contract);
  const accountKey = session.server.id + "\n" + (location?.workspaceID || "") + "\n" + (location?.directory || "");
  if (!cache.has(accountKey)) cache.set(accountKey, /* @__PURE__ */ new Map());
  const history = cache.get(accountKey);
  const busy = /* @__PURE__ */ new Set();
  const buttons = pages.map((label, i) => btn(label, () => switchTo(i)));
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
  let configured = [], discovered = false, inventorySerial = 0, mimo;
  const has = (id) => configured.some((row) => row.family === id);
  const options = () => configured.map((row) => [row.family, families[row.family]]);
  function mimoCard() {
    const card = el("section", null, "pq-card");
    card.append(el("h3", "\u5C0F\u7C73 MiMo \xB7 Standard"), el("small", "\xA599/\u6708 \xB7 110 \u4EBF Credits \xB7 \u672C\u673A\u4F30\u7B97"));
    for (const [key, label] of [
      ["today", "\u4ECA\u5929"],
      ["week", "\u8FD1 7 \u5929"]
    ]) {
      const reading = mimo?.[key];
      const n = reading?.percent;
      const value = Number.isFinite(n) ? n > 0 && n < 0.01 ? "<0.01%" : fmt(n) + "%" : "\u2014";
      card.append(
        el("div", label + "\u3000" + value + (reading?.partial ? "\uFF08\u90E8\u5206\u8BB0\u5F55\u7F3A\u5C11\u53EF\u6362\u7B97\u7528\u91CF\uFF09" : ""))
      );
    }
    if (mimo?.problem) card.append(el("small", mimo.problem));
    return card;
  }
  function drawUsage() {
    if (!discovered || !configured.length || index !== 0) return;
    const general = configured.filter((r) => r.family !== "mimo" && (!filter || r.family === filter));
    const period = controls.querySelector('[aria-label="\u7EDF\u8BA1\u65F6\u6BB5"]');
    if (period) period.hidden = !general.length;
    const nodes = [];
    if (general.length && stats)
      nodes.push(
        usageView(
          stats,
          media,
          general.flatMap((r) => r.providers),
          general.some((r) => r.family === "minimax")
        )
      );
    if (has("mimo") && (!filter || filter === "mimo")) nodes.push(mimoCard());
    content.replaceChildren(...nodes);
  }
  async function discover() {
    if (!alive || document.hidden) return;
    const ticket = ++inventorySerial;
    try {
      const list = await api.inventory({}, { location, signal: AbortSignal.timeout(12e3) });
      if (!alive || ticket !== inventorySerial) return;
      const changed = !discovered || JSON.stringify(list) !== JSON.stringify(configured);
      discovered = true;
      if (!changed) return;
      for (const [id, cached] of history) {
        if (JSON.stringify(list.find((r) => r.family === id)) !== cached.connection) history.delete(id);
      }
      configured = list;
      if (!has(filter)) filter = "";
      stats = media = mimo = lastRead = void 0;
      switchTo(index);
    } catch {
      if (alive && ticket === inventorySerial) status.textContent = "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u5F53\u524D\u670D\u52A1\u5546\u914D\u7F6E\u3002";
    }
  }
  async function readUsage() {
    if (!alive || !discovered || !configured.length || document.hidden || active) return;
    const token = ++serial, controller = new AbortController();
    active = controller;
    const now = /* @__PURE__ */ new Date(), span = range(days, now), week = range(7, now);
    const general = index === 0 && configured.some((r) => r.family !== "mimo");
    const readOptions = { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15e3)]) };
    const local = { ...readOptions, location };
    try {
      const [data, calls, estimate] = await Promise.allSettled([
        general && client.experimental.session.stats(
          {
            ...span,
            from: span.from || void 0,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
            tools: "none"
          },
          readOptions
        ),
        general && has("minimax") && api.media(span, local),
        has("mimo") && api.mimo({ ...week, today: range(1, now).from }, local)
      ]);
      if (!alive || token !== serial) return;
      media = calls.status === "fulfilled" ? calls.value : void 0;
      mimo = estimate.status === "fulfilled" ? estimate.value : { problem: "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u672C\u673A\u7528\u91CF" };
      if (data.status === "fulfilled" && general) stats = data.value;
      if (index === 0) drawUsage();
      else drawQuotas();
      if (data.status === "rejected") status.textContent = "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u6A21\u578B\u7EDF\u8BA1\u3002";
      else if (index === 0) {
        lastRead = Date.now();
        status.textContent = "\u5F53\u524D\u670D\u52A1\u5668 \xB7 \u6240\u6709\u9879\u76EE \xB7 \u66F4\u65B0\u4E8E " + time(lastRead);
      }
    } finally {
      if (active === controller) active = void 0;
    }
  }
  function drawQuotas() {
    if (!alive || index !== 1) return;
    const cards = options().map(([id, name]) => {
      if (id === "mimo") return mimoCard();
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
      if (!entries) card.append(el("p", unavailable[id] || "\u5C1A\u672A\u624B\u52A8\u67E5\u8BE2", "pq-muted"));
      for (const entry of entries || []) {
        if (entry.source) card.append(el("small", entry.source + " \xB7 " + entry.host));
        for (const row of entry.values || []) {
          const reset = row.reset ? row.reset <= Date.now() ? "\u3000\u7A97\u53E3\u5DF2\u5230\u671F\uFF0C\u5F85\u5237\u65B0" : "\u3000\u91CD\u7F6E " + time(row.reset) : "";
          card.append(
            el(
              "div",
              row.label + "\u3000" + (row.unit === "%" ? "\u5269\u4F59 " : "") + fmt(row.remaining) + (row.unit === "%" ? "%" : " " + row.unit) + reset
            )
          );
        }
        if (entry.problem) card.append(el("p", entry.problem, "pq-muted"));
        if (entry.select) {
          const one = btn("\u67E5\u8BE2\u6B64\u8FDE\u63A5", () => refresh(id, entry.source));
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
    if (busy.has(id) || unavailable[id] || !has(id)) return;
    const connection = JSON.stringify(configured.find((r) => r.family === id));
    const valid = () => alive && connection === JSON.stringify(configured.find((r) => r.family === id));
    busy.add(id);
    drawQuotas();
    try {
      const rows = await api.refresh(
        { family: id, ...source && { source } },
        { location, signal: AbortSignal.timeout(15e3) }
      );
      if (valid())
        history.set(id, {
          connection,
          rows: source ? [...(history.get(id)?.rows || []).filter((p) => p.source !== source), ...rows] : rows
        });
    } catch {
      if (valid()) history.set(id, { connection, rows: [{ problem: "\u989D\u5EA6\u670D\u52A1\u672A\u8FDE\u63A5\uFF0C\u8BF7\u7A0D\u540E\u624B\u52A8\u5237\u65B0" }] });
    } finally {
      busy.delete(id);
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
  function switchTo(i) {
    cancelUsage();
    index = i;
    buttons.forEach((b, n) => b.setAttribute("aria-pressed", String(i === n)));
    controls.replaceChildren();
    content.replaceChildren();
    status.textContent = "";
    if (!discovered || !configured.length) {
      status.textContent = discovered ? "\u5F53\u524D\u5DE5\u4F5C\u533A\u5C1A\u672A\u914D\u7F6E\u652F\u6301\u7684\u670D\u52A1\u5546\u3002" : "\u6B63\u5728\u8BFB\u53D6\u5F53\u524D\u670D\u52A1\u5546\u2026";
      return;
    }
    if (i === 0) {
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
            switchTo(0);
          }
        ),
        selection("\u6A21\u578B\u670D\u52A1\u5546", [["", "\u5168\u90E8\u670D\u52A1\u5546"], ...options()], filter, (v) => {
          filter = v;
          drawUsage();
        })
      );
      drawUsage();
    } else {
      controls.append(btn("\u5237\u65B0\u5168\u90E8\u989D\u5EA6", () => Promise.all(configured.map((r) => refresh(r.family)))));
      drawQuotas();
    }
    void readUsage();
    clock = setInterval(readUsage, 6e4);
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
    if (document.hidden || queued || ![
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
    cancelUsage();
    stop?.();
    clearInterval(inventoryClock);
    document.removeEventListener("visibilitychange", visible);
  });
  switchTo(0);
  void discover();
  return (0, import_solid_js.createComponent)(ctx.ui.Dialog, { title: "\u7528\u91CF\u4E0E\u989D\u5EA6", size: "large", children: root });
}
var plugin_default = import_gui.Plugin.define({
  setup(ctx) {
    const cache = /* @__PURE__ */ new Map();
    ctx.add(import_gui.Style, style_default);
    ctx.add(import_gui.Slot, {
      at: "session.header",
      order: 8,
      render(input) {
        const button = btn(null, () => ctx.dialogs.open(() => dashboard(ctx, input.session, cache)));
        button.append((0, import_solid_js.createComponent)(ctx.ui.Icon, { name: "window-analytics", size: "normal" }));
        button.className = "pq-open";
        button.title = "\u67E5\u770B\u7528\u91CF\u4E0E\u989D\u5EA6";
        button.setAttribute("aria-label", button.title);
        (0, import_solid_js.createEffect)(() => {
          button.hidden = !input.active;
        });
        return button;
      }
    });
  }
});
