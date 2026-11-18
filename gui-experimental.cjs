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
  mimo: "\u5C1A\u672A\u786E\u8BA4 MiMo \u63D0\u4F9B\u63A8\u7406 Key \u53EF\u7528\u7684\u8D26\u6237\u4F59\u989D\u6216\u5957\u9910\u4F59\u91CF\u63A5\u53E3\u3002",
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

// src/media.js
var methods = {
  text_to_image: "\u751F\u56FE",
  image_generation: "\u751F\u56FE",
  text_to_audio: "\u8BED\u97F3",
  text_to_speech: "\u8BED\u97F3",
  speech_synthesis: "\u8BED\u97F3"
};
function mediaKind(tool, names = []) {
  if (typeof tool !== "string") return;
  const id = tool.toLowerCase().replace(/[.:-]/g, "_");
  for (const [method, label] of Object.entries(methods)) {
    if (!id.endsWith("_" + method)) continue;
    const ns = id.slice(0, -method.length - 1);
    if (/(?:^|_)minimax(?:_|$)/.test(ns) || names.some((n) => ns === n.toLowerCase().replace(/[^a-z0-9_]/g, "_")))
      return label;
  }
}

// src/style.css
var style_default = ".pq-page {\n  color: var(--text-base);\n  font: inherit;\n  padding: 0 0 12px;\n  min-width: 0;\n}\n.pq-page nav,\n.pq-controls,\n.pq-top,\n.pq-counters {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n}\n.pq-page nav {\n  margin-bottom: 14px;\n}\n.pq-open,\n.pq-page button,\n.pq-page select {\n  font: inherit;\n  color: var(--text-base);\n  cursor: pointer;\n  line-height: 1.5;\n  border-radius: 6px;\n  padding: 3px 9px;\n}\n.pq-open:hover,\n.pq-page button:hover,\n.pq-page button[aria-pressed='true'] {\n  background: var(--surface-base-hover);\n  color: var(--text-strong);\n}\n.pq-page button:disabled {\n  opacity: 0.55;\n  cursor: default;\n}\n.pq-page button,\n.pq-page select {\n  border: 1px solid var(--border-weak-base);\n  background: var(--surface-base);\n}\n.pq-controls {\n  justify-content: flex-end;\n  margin: 0 0 10px;\n  flex-wrap: wrap;\n}\n.pq-counters {\n  gap: 24px;\n  margin: 8px 0 16px;\n}\n.pq-counters span,\n.pq-muted,\n.pq-card small {\n  color: var(--text-weak);\n  font-size: 12px;\n}\n.pq-counters strong {\n  display: block;\n  font-size: 22px;\n  font-weight: 600;\n  color: var(--text-strong);\n}\n.pq-page table {\n  width: 100%;\n  border-collapse: collapse;\n  font-variant-numeric: tabular-nums;\n  font-size: 13px;\n}\n.pq-scroll {\n  overflow-x: auto;\n}\n.pq-page td,\n.pq-page th {\n  text-align: right;\n  padding: 7px 6px;\n  border-bottom: 1px solid var(--border-weak-base);\n  white-space: nowrap;\n}\n.pq-page th:first-child,\n.pq-page td:first-child {\n  text-align: left;\n  white-space: normal;\n  overflow-wrap: anywhere;\n}\n.pq-page h3 {\n  font-size: 14px;\n  font-weight: 600;\n  margin: 14px 0 5px;\n}\n.pq-muted,\n.pq-card small {\n  display: block;\n  margin: 5px 0;\n}\n.pq-card {\n  border: 1px solid var(--border-weak-base);\n  border-radius: 9px;\n  padding: 10px 12px;\n  margin-bottom: 8px;\n}\n.pq-top {\n  justify-content: space-between;\n}\n.pq-top h3 {\n  margin: 0;\n}\n.pq-page details {\n  margin: 12px 0;\n}\n.pq-page summary {\n  cursor: pointer;\n}\n";

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
function range(days) {
  const now = /* @__PURE__ */ new Date(), start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - Math.max(0, days - 1));
  return { from: days ? start.getTime() : 0, to: now.getTime() + 1 };
}
var familyPatterns = {
  kimi: /kimi|moonshot/i,
  mimo: /mimo|xiaomi/i,
  glm: /zhipu|bigmodel|\bglm|^zai/i,
  deepseek: /deepseek/i,
  minimax: /minimax|mini-max/i,
  qwen: /qwen|dashscope|alibaba|bailian/i
};
function modelFamily(model) {
  return Object.keys(familyPatterns).find(
    (k) => familyPatterns[k].test(model.providerID) || familyPatterns[k].test(model.id)
  );
}
function total(t) {
  return t.input + t.output + t.reasoning + t.cache.read + t.cache.write;
}
function usageView(stats, media, filter) {
  const box = el("div");
  const models = stats.models.filter((m) => !filter || modelFamily(m.model) === filter);
  const counters = el("div", null, "pq-counters");
  for (const [name, value] of [
    ["Token \u603B\u91CF", models.reduce((n, m) => n + total(m.tokens), 0)],
    ["\u6A21\u578B\u6B65\u9AA4", models.reduce((n, m) => n + m.steps, 0)]
  ]) {
    const item = el("div");
    item.append(el("span", name), el("strong", fmt(value)));
    counters.append(item);
  }
  box.append(counters);
  box.append(
    models.length ? table(
      ["\u6A21\u578B / \u670D\u52A1\u5546", "\u8F93\u5165", "\u8F93\u51FA", "\u63A8\u7406", "\u7F13\u5B58\u8BFB", "\u7F13\u5B58\u5199"],
      models.map(({ model, tokens: t }) => [
        model.id + (model.variant ? " \xB7 " + model.variant : "") + " / " + model.providerID,
        ...[t.input, t.output, t.reasoning, t.cache.read, t.cache.write].map(fmt)
      ])
    ) : el("p", "\u65F6\u6BB5\u5185\u6CA1\u6709\u5339\u914D\u7684\u6A21\u578B\u8BB0\u5F55\u3002", "pq-muted")
  );
  if (!filter || filter === "minimax") {
    box.append(
      el("h3", "MiniMax MCP"),
      el("p", "\u63D2\u4EF6\u542F\u7528\u540E\u5B8C\u6210\u7684\u5DE5\u5177\u8C03\u7528\uFF0C\u5305\u542B Code Mode\u3002\u4E00\u6B21\u8C03\u7528\u6309\u4E00\u6B21\u8BA1\u6570\u3002", "pq-muted")
    );
    box.append(
      media ? table(
        ["\u5DE5\u5177", "\u6210\u529F", "\u5931\u8D25"],
        media.map((row) => [row.kind, fmt(row.calls - row.failed), fmt(row.failed)])
      ) : el("p", "\u5DE5\u5177\u8BA1\u6570\u6682\u4E0D\u53EF\u7528\u3002", "pq-muted")
    );
    const direct = (stats.tools?.usage || []).filter((tool) => mediaKind(tool.name));
    if (direct.length) {
      const details = el("details");
      details.append(
        el("summary", "OpenCode \u5386\u53F2\u4E2D\u5355\u72EC\u5217\u51FA\u7684\u5DE5\u5177\u8C03\u7528"),
        table(
          ["\u539F\u59CB\u5DE5\u5177\u540D", "\u8C03\u7528", "\u5931\u8D25"],
          direct.map((t) => [t.name, fmt(t.calls), fmt(t.failed)])
        )
      );
      box.append(details);
    }
  }
  return box;
}
function dashboard(ctx, session, cache) {
  const root = el("div", null, "pq-page");
  const nav = el("nav"), controls = el("div", null, "pq-controls"), content = el("div"), status = el("p", null, "pq-muted");
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
  root.append(nav, controls, content, status);
  function selection(label, options, value, change) {
    const select = el("select");
    select.setAttribute("aria-label", label);
    for (const [id, name] of options) select.add(new Option(name, String(id)));
    select.value = String(value);
    select.onchange = () => change(select.value);
    return select;
  }
  function drawUsage() {
    if (stats) content.replaceChildren(usageView(stats, media, filter));
  }
  async function readUsage() {
    if (!alive || index !== 0 || document.hidden || active) return;
    const token = ++serial, controller = new AbortController();
    active = controller;
    const span = range(days);
    if (!stats) status.textContent = "\u6B63\u5728\u8BFB\u53D6\u672C\u5730\u7528\u91CF\u2026";
    try {
      const options = { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15e3)]) };
      const [data, calls] = await Promise.allSettled([
        client.experimental.session.stats(
          {
            ...span,
            from: span.from || void 0,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
            tools: "detail"
          },
          options
        ),
        api.media(span, { ...options, location })
      ]);
      if (!alive || token !== serial) return;
      if (data.status !== "fulfilled") throw Error();
      stats = data.value;
      media = calls.status === "fulfilled" ? calls.value : null;
      lastRead = Date.now();
      drawUsage();
      status.textContent = "\u5F53\u524D\u670D\u52A1\u5668 \xB7 \u6240\u6709\u9879\u76EE \xB7 \u66F4\u65B0\u4E8E " + time(lastRead);
    } catch {
      if (alive && token === serial)
        status.textContent = (lastRead ? "\u4FDD\u7559 " + time(lastRead) + " \u7684\u7EDF\u8BA1\u3002" : "") + "\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u672C\u5730\u7528\u91CF\u3002";
    } finally {
      if (active === controller) active = void 0;
    }
  }
  function drawQuotas() {
    if (!alive || index !== 1) return;
    const cards = Object.entries(families).map(([id, name]) => {
      const card = el("section", null, "pq-card"), top = el("div", null, "pq-top");
      top.append(el("h3", name));
      if (!unavailable[id]) {
        const b = btn(busy.has(id) ? "\u67E5\u8BE2\u4E2D\u2026" : "\u5237\u65B0", () => refresh(id));
        b.disabled = busy.has(id);
        b.setAttribute("aria-label", "\u5237\u65B0 " + name);
        top.append(b);
      }
      card.append(top);
      const entries = history.get(id);
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
    if (all) all.disabled = busy.size > 0;
  }
  async function refresh(id, source) {
    if (busy.has(id) || unavailable[id]) return;
    busy.add(id);
    drawQuotas();
    try {
      const rows = await api.refresh(
        { family: id, ...source && { source } },
        { location, signal: AbortSignal.timeout(15e3) }
      );
      history.set(
        id,
        source ? [...(history.get(id) || []).filter((p) => p.source !== source), ...rows] : rows
      );
    } catch {
      history.set(id, [{ problem: "\u989D\u5EA6\u670D\u52A1\u672A\u8FDE\u63A5\uFF0C\u8BF7\u7A0D\u540E\u624B\u52A8\u5237\u65B0" }]);
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
        selection("\u6A21\u578B\u670D\u52A1\u5546", [["", "\u5168\u90E8\u670D\u52A1\u5546"], ...Object.entries(families)], filter, (v) => {
          filter = v;
          drawUsage();
        })
      );
      drawUsage();
      void readUsage();
      clock = setInterval(readUsage, 6e4);
    } else {
      controls.append(
        btn("\u5237\u65B0\u5168\u90E8\u989D\u5EA6", () => Promise.all(Object.keys(families).map((id) => refresh(id))))
      );
      drawQuotas();
    }
  }
  document.addEventListener("visibilitychange", readUsage);
  const stop = session.server.data?.listen(({ name }) => {
    if (index !== 0 || document.hidden || queued || ![
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
    document.removeEventListener("visibilitychange", readUsage);
  });
  switchTo(0);
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
        const button = btn("\u7528\u91CF", () => ctx.dialogs.open(() => dashboard(ctx, input.session, cache)));
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
