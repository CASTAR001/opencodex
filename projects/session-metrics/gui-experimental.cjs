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
var import_gui2 = require("@opencode/plugin/gui");

// src/session.js
var import_solid_js2 = require("solid-js");

// src/metrics.js
function measurement(message) {
  const { id, type, time } = message;
  const row = { id, type, created: time.created };
  if (type !== "assistant" && type !== "compaction") return row;
  const { model, tokens } = message;
  return {
    ...row,
    model: model ? model.providerID + "/" + model.id : "?",
    usage: tokens && {
      input: tokens.input,
      read: tokens.cache.read,
      write: tokens.cache.write,
      output: tokens.output,
      reasoning: tokens.reasoning
    },
    first: time.firstToken,
    streamed: time.streamed,
    ended: time.completed != null || !!message.error || message.status === "completed" || message.status === "failed",
    terminal: !!message.error || !!message.finish && !["tool-calls", "unknown"].includes(message.finish)
  };
}
function mergeHistory(pages, live) {
  const rows = /* @__PURE__ */ new Map();
  const first = live[0]?.id;
  for (const row of pages) {
    if (row.id === first) break;
    rows.set(row.id, row);
  }
  for (const row of live) rows.set(row.id, row);
  return [...rows.values()];
}
function generationRate(steps) {
  let elapsed = 0;
  let generated = 0;
  let includesWait = false;
  for (const step of steps) {
    if (!step.usage || step.streamed == null) return;
    const duration = step.streamed - (step.first ?? step.created);
    if (!Number.isFinite(duration) || duration < 0) return;
    includesWait ||= step.first == null;
    elapsed += duration;
    generated += step.usage.output + step.usage.reasoning;
  }
  if (elapsed > 0 && generated > 0) return { tps: generated * 1e3 / elapsed, includesWait };
}
function recentTurn(rows, running, complete) {
  const legacy = !rows.some((row) => row.type === "idle");
  let steps = [];
  let last;
  let bounded = complete;
  let sawInput = false;
  for (const row of rows) {
    if (row.type === "idle" || legacy && ["user", "synthetic"].includes(row.type)) {
      if (steps.length) last = { steps, bounded };
      steps = [];
      bounded = complete || row.type === "idle";
      sawInput = false;
    } else if (!sawInput && ["user", "synthetic"].includes(row.type)) {
      steps = [];
      sawInput = true;
    } else if (row.type === "assistant") {
      steps.push(row);
    }
  }
  const tail = steps.at(-1);
  if (tail?.ended && (!running || tail.terminal)) return { steps, bounded, previous: false };
  return last && { ...last, previous: running || !!tail };
}
function summarize(rows, { model = "", since = -Infinity, until = Infinity, running = false, complete = true } = {}) {
  const totals = { input: 0, read: 0, write: 0, output: 0, reasoning: 0 };
  const models = /* @__PURE__ */ new Set();
  let latestModel;
  let missing = 0;
  let compactionTokens = 0;
  let counted = 0;
  let lastHit, lastCallModel, hitChange, ttft;
  let generated = 0, elapsed = 0;
  const recentRates = [];
  const included = (row) => (!model || model === row.model) && row.created >= since && row.created < until;
  for (const row of rows) {
    if (row.type !== "assistant" && row.type !== "compaction") continue;
    models.add(row.model);
    if (row.type === "assistant") latestModel = row.model;
    if (!included(row)) continue;
    if (row.type === "assistant" && row.first >= row.created) ttft = row.first - row.created;
    if (!row.usage) {
      if (row.ended) missing++;
      continue;
    }
    counted++;
    if (row.type === "assistant") {
      const denominator = row.usage.input + row.usage.read;
      if (denominator > 0) {
        const next = row.usage.read / denominator;
        hitChange = lastCallModel === row.model && lastHit != null ? next - lastHit : void 0;
        lastHit = next;
        lastCallModel = row.model;
      }
      const duration = row.streamed - (row.first ?? row.created);
      const tokens = row.usage.output + row.usage.reasoning;
      if (row.ended && duration >= 500 && tokens > 0) {
        generated += tokens;
        elapsed += duration;
        if (recentRates.length === 12) recentRates.shift();
        recentRates.push(tokens * 1e3 / duration);
      }
    }
    for (const field of Object.keys(totals)) {
      totals[field] += row.usage[field];
      if (row.type === "compaction") compactionTokens += row.usage[field];
    }
  }
  const inputTotal = totals.input + totals.read + totals.write;
  const turn = recentTurn(rows, running, complete);
  const speed = turn?.bounded && turn.steps.every(included) ? generationRate(turn.steps) : void 0;
  return {
    totals,
    inputTotal,
    hit: inputTotal ? totals.read / inputTotal : void 0,
    missing,
    counted,
    compactionTokens,
    models: [...models].sort(),
    latestModel,
    speed,
    previous: !!turn?.previous,
    lastHit,
    hitChange,
    ttft,
    average: elapsed ? generated * 1e3 / elapsed : void 0,
    recentRates
  };
}

// src/history.js
async function historyPrefix(client, sessionID, anchor, signal) {
  const rows = /* @__PURE__ */ new Map();
  const cursors = /* @__PURE__ */ new Set();
  let cursor;
  do {
    signal.throwIfAborted();
    const query = cursor ? { sessionID, limit: 200, cursor } : { sessionID, limit: 200, order: "asc" };
    const page = await client.message.list(query, { signal: AbortSignal.any([signal, AbortSignal.timeout(3e4)]) });
    signal.throwIfAborted();
    for (const message of page.data) {
      if (message.id === anchor) return [...rows.values()];
      rows.set(message.id, measurement(message));
    }
    cursor = page.cursor.next;
    if (cursor && cursors.has(cursor)) throw Error("Repeated history cursor");
    cursors.add(cursor);
  } while (cursor);
  if (anchor) throw Error("The live timeline changed while loading history");
  return [...rows.values()];
}

// src/session.js
var import_solid = require("@opencode/client/solid");

// src/stream.js
var import_solid_js = require("solid-js");

// src/sampling.js
function streamingSpeed(length, created, first, now) {
  const elapsed = now - (first > created ? first : created);
  if (!length || !Number.isFinite(elapsed) || elapsed < 500) return;
  return Math.max(1, Math.round(length / 4)) / (elapsed / 1e3);
}
function generatedLength(parts, toolLengths) {
  let length = 0;
  for (const part of parts) {
    if (part.type === "text" || part.type === "reasoning") length += part.text.length;
    if (part.type !== "tool") continue;
    if (part.state.status === "streaming") toolLengths.set(part.id, part.state.input.length);
    length += toolLengths.get(part.id) ?? 0;
  }
  return length;
}

// src/stream.js
function visibleRate(session, enabled) {
  const [rate, setRate] = (0, import_solid_js.createSignal)();
  const data = session.server.data.session;
  const current = () => data.message.list(session.id).at(-1);
  const target = (0, import_solid_js.createMemo)(() => {
    if (!enabled || data.status(session.id) !== "running") return;
    const row = current();
    if (row?.type === "assistant" && !row.retry && !row.error && row.time.streamed == null && row.time.completed == null) {
      return JSON.stringify([row.id, row.time.created, row.model.providerID, row.model.id]);
    }
  });
  (0, import_solid_js.createEffect)(() => {
    setRate(void 0);
    if (!target()) return;
    const toolLengths = /* @__PURE__ */ new Map();
    function tick() {
      const row = current();
      const parts = row.content;
      const tail = parts.at(-1);
      const length = generatedLength(parts, toolLengths);
      if (tail?.type === "tool" && tail.state.status !== "streaming") {
        setRate(void 0);
        return;
      }
      const { created, firstToken } = row.time;
      const tps = streamingSpeed(length, created, firstToken, Date.now());
      setRate(tps == null ? void 0 : { tps, model: row.model.providerID + "/" + row.model.id, created });
    }
    (0, import_solid_js.untrack)(tick);
    const timer = setInterval(tick, 1e3);
    (0, import_solid_js.onCleanup)(() => clearInterval(timer));
  });
  return rate;
}

// src/session.js
function observeSession(session, connected) {
  const { id, server } = session;
  const data = server.data.session;
  const client = server.client;
  const [prefix, setPrefix] = (0, import_solid_js2.createSignal)([]);
  const [coverage, setCoverage] = (0, import_solid_js2.createSignal)(connected ? "loading" : "offline");
  const [ready, setReady] = (0, import_solid_js2.createSignal)(false);
  const [attempt, setAttempt] = (0, import_solid_js2.createSignal)(0);
  const catalog = server.data.location;
  const ref = session.directory ? { directory: session.directory } : void 0;
  (0, import_solid_js2.createEffect)(() => {
    attempt();
    if (!connected || session.pending || catalog.model.list(ref) != null) return;
    let mounted = true;
    (0, import_solid_js2.onCleanup)(() => {
      mounted = false;
    });
    const resolve = ref ? Promise.resolve(ref) : catalog.syncInfo().then(() => catalog.default());
    resolve.then((location) => mounted && catalog.model.sync(location)).catch(() => {
    });
  });
  const context = (0, import_solid_js2.createMemo)(() => {
    const message = (0, import_solid.lastAssistantWithUsage)(data.message.list(id), data.get(id)?.revert?.messageID);
    if (!message) return;
    const { tokens, model } = message;
    const used = tokens.input + tokens.output + tokens.reasoning + tokens.cache.read + tokens.cache.write;
    const limit = catalog.model.list(ref)?.findLast((entry) => entry.providerID === model.providerID && entry.id === model.id && entry.status !== "deprecated")?.limit.context;
    return { used, limit, percent: limit > 0 ? Math.round(used / limit * 100) : void 0 };
  });
  const records = (0, import_solid_js2.mapArray)(() => data.message.list(id), (row) => (0, import_solid_js2.createMemo)(() => measurement(row)));
  const live = (0, import_solid_js2.createMemo)(() => records().map((read) => read()));
  const running = () => data.status(id) === "running";
  const anchor = (0, import_solid_js2.createMemo)(() => data.message.more(id) ? data.message.list(id)[0]?.id : void 0);
  (0, import_solid_js2.createEffect)(() => {
    attempt();
    if (!connected || session.pending) return;
    let active = true;
    setReady(false);
    setCoverage("loading");
    Promise.resolve().then(() => data.message.sync(id)).then(() => {
      if (active) setReady(true);
    }).catch(() => {
      if (active) setCoverage("error");
    });
    (0, import_solid_js2.onCleanup)(() => {
      active = false;
    });
  });
  (0, import_solid_js2.createEffect)(() => {
    const first = anchor();
    if (!ready()) return;
    setPrefix([]);
    if (!first) {
      setCoverage("complete");
      return;
    }
    setCoverage("loading");
    const controller = new AbortController();
    (0, import_solid_js2.onCleanup)(() => controller.abort());
    historyPrefix(client, id, first, controller.signal).then((rows2) => {
      if (controller.signal.aborted) return;
      setPrefix(rows2);
      setCoverage("complete");
    }).catch(() => {
      if (!controller.signal.aborted) setCoverage("error");
    });
  });
  const rows = (0, import_solid_js2.createMemo)(() => mergeHistory(prefix(), live()));
  const overall = (0, import_solid_js2.createMemo)(() => summarize(rows(), { running: running(), complete: coverage() === "complete" }));
  const estimate = visibleRate(session, connected && !session.pending);
  return { rows, coverage, running, overall, estimate, context, retry: () => setAttempt((n) => n + 1) };
}
function createSessionMetrics() {
  const observed = /* @__PURE__ */ new Map();
  return function useSession(session) {
    const { key, id, pending, directory } = session;
    const { data, client, connected } = session.server;
    let entry = observed.get(key);
    if (!entry || entry.data !== data || entry.client !== client || entry.connected !== connected || entry.pending !== pending || entry.directory !== directory) {
      const target = { id, pending, directory, server: { data, client } };
      entry = (0, import_solid_js2.createRoot)((dispose) => ({
        data,
        client,
        connected,
        pending,
        directory,
        dispose,
        readers: 0,
        source: observeSession(target, connected)
      }), null);
      observed.set(key, entry);
    }
    entry.readers++;
    (0, import_solid_js2.onCleanup)(() => {
      if (--entry.readers) return;
      entry.dispose();
      if (observed.get(key) === entry) observed.delete(key);
    });
    return entry.source;
  };
}

// src/header.js
var import_solid_js3 = require("solid-js");
function header(ctx, input, useSession, open) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ocx-metrics-header";
  const label = document.createElement("span");
  const hit = document.createElement("strong");
  const speed = document.createElement("span");
  const windowUsage = document.createElement("span");
  button.append(label, hit, speed, windowUsage);
  button.onclick = () => open(input.session);
  (0, import_solid_js3.createEffect)(() => {
    button.hidden = !input.active || input.compact;
  });
  (0, import_solid_js3.createEffect)(() => {
    if (!input.active) return;
    const source = useSession(input.session);
    const locale = ctx.locale.locale();
    const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
    (0, import_solid_js3.createEffect)(() => {
      const { hit: ratio, speed: turn, previous, missing } = source.overall();
      const estimate = source.estimate();
      const context = source.context();
      const coverage = source.coverage();
      const t = (key) => ctx.t(key);
      const cache = ratio == null ? "\u2014" : percent.format(ratio);
      const rate = estimate?.tps ?? turn?.tps;
      const value = (rate == null ? "\u2014" : number.format(rate)) + " TPS";
      const partial = coverage !== "complete";
      label.textContent = t("cacheLabel");
      hit.textContent = cache + (partial && ratio != null ? "*" : "");
      speed.textContent = (estimate ? "\u2248" : previous && turn ? t("prevShort") + " " : "") + value;
      const used = context?.percent == null ? "\u2014" : percent.format(context.percent / 100);
      windowUsage.textContent = t("context") + " " + used;
      const hint = [t("hit") + " " + cache, t(estimate ? "estimated" : previous ? "previous" : "recent") + " " + value];
      hint.push(t("context") + " " + used + (context ? " (" + number.format(context.used) + " / " + (context.limit > 0 ? number.format(context.limit) : "\u2014") + ")" : ""));
      if (partial) hint.push(t(coverage));
      if (source.running()) hint.push(t("generating"));
      if (turn?.includesWait && !estimate) hint.push(t("wait"));
      if (missing) hint.push(t("missing") + " \xB7 " + missing);
      button.title = [t("title"), ...hint].join(" \xB7 ");
      button.setAttribute("aria-label", button.title);
    });
  });
  return button;
}

// src/panel.js
var import_solid_js4 = require("solid-js");
var import_gui = require("@opencode/plugin/gui");
function element(tag, text) {
  const node = document.createElement(tag);
  if (text !== void 0) node.textContent = text;
  return node;
}
function select(label, entries) {
  const field = element("label");
  const control = element("select");
  for (const [value, text] of entries) control.add(new Option(text, value));
  field.append(element("span", label), control);
  return { field, control };
}
function stat(grid, label, hint) {
  const field = element("div");
  const title = element("dt", label);
  const value = element("dd", "\u2014");
  field.title = hint;
  field.append(title, value);
  grid.append(field);
  return { title, value };
}
function mount(root, ctx, source, locale) {
  const t = (key) => ctx.t(key);
  const digits = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const ratio = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
  const [model, setModel] = (0, import_solid_js4.createSignal)("");
  const [period, setPeriod] = (0, import_solid_js4.createSignal)("session");
  const [now, setNow] = (0, import_solid_js4.createSignal)(Date.now());
  const cutoff = () => period() === "hour" ? now() - 36e5 : -Infinity;
  const modelName = (id) => id === "?" ? t("unknown") : id || "\u2014";
  const modelLine = element("p");
  modelLine.className = "ocx-metrics-model";
  const modelValue = element("strong");
  modelLine.append(element("span", t("recentModel")), modelValue);
  const windowUsage = element("span");
  windowUsage.title = t("contextHint");
  modelLine.append(windowUsage);
  (0, import_solid_js4.createEffect)(() => {
    const value = source.context();
    windowUsage.textContent = t("context") + " " + (value?.percent == null ? "\u2014" : ratio.format(value.percent / 100)) + (value ? " \xB7 " + digits.format(value.used) + " / " + (value.limit > 0 ? digits.format(value.limit) : "\u2014") : "");
  });
  const filters = element("div");
  filters.className = "ocx-metrics-filters";
  const models = select(t("model"), [["", t("all")]]);
  const range = select(t("range"), [["session", t("session")], ["hour", t("hour")]]);
  models.control.onchange = () => setModel(models.control.value);
  range.control.onchange = () => {
    setNow(Date.now());
    setPeriod(range.control.value);
  };
  filters.append(models.field, range.field);
  const stats = element("dl");
  stats.className = "ocx-metrics-stats";
  const hit = stat(stats, t("hit"), t("hitHint"));
  const speed = stat(stats, t("recent") + " TPS", t("speedHint"));
  const bar = element("meter");
  bar.min = 0;
  bar.max = 1;
  bar.setAttribute("aria-label", t("hit"));
  hit.value.after(bar);
  const estimate = element("p");
  estimate.className = "ocx-metrics-estimate";
  estimate.title = t("estimateHint");
  (0, import_solid_js4.createEffect)(() => {
    const sample = source.estimate();
    const rate = sample && (!model() || sample.model === model()) && sample.created >= cutoff() ? sample.tps : void 0;
    estimate.hidden = rate == null;
    estimate.textContent = rate == null ? "" : t("estimated") + " \xB7 " + digits.format(rate) + " TPS";
  });
  const status = element("p");
  status.setAttribute("role", "status");
  const retry = element("button", t("retry"));
  retry.type = "button";
  retry.onclick = source.retry;
  const details = element("details");
  details.open = true;
  const list = element("dl");
  const counters = /* @__PURE__ */ new Map();
  for (const key of ["lastHit", "average", "ttft", "trend", "total", "input", "read", "write", "output", "reasoning", "compaction"]) {
    const value = element("dd");
    const label = element("dt", t(key));
    if (key === "lastHit") label.title = t("callHint");
    list.append(label, value);
    counters.set(key, value);
  }
  details.append(element("summary", t("reported")), list);
  root.replaceChildren(modelLine, stats, estimate, filters, status, retry, details);
  (0, import_solid_js4.createEffect)(() => {
    if (period() !== "hour") return;
    const instant = Date.now();
    const boundary = source.rows().reduce((next, row) => {
      const expiry = row.created + 3600001;
      return expiry > instant ? Math.min(next, expiry) : next;
    }, Infinity);
    now();
    if (boundary === Infinity) return;
    const timer2 = setTimeout(() => setNow(Date.now()), Math.min(2147483647, boundary - instant));
    (0, import_solid_js4.onCleanup)(() => clearTimeout(timer2));
  });
  let modelOptions = "";
  let timer;
  let lastPaint = -Infinity;
  (0, import_solid_js4.createEffect)(() => {
    const rows = source.rows();
    const selected = model();
    const hour = period() === "hour";
    const end = hour ? Math.max(now(), Date.now()) + 1 : Infinity;
    const running = source.running();
    const coverage = source.coverage();
    function paint() {
      lastPaint = performance.now();
      const r = !selected && !hour ? source.overall() : summarize(rows, {
        model: selected,
        since: hour ? end - 1 - 36e5 : -Infinity,
        until: end,
        running,
        complete: coverage === "complete"
      });
      const options = JSON.stringify(r.models);
      if (options !== modelOptions) {
        modelOptions = options;
        models.control.replaceChildren(new Option(t("all"), ""), ...r.models.map((id) => new Option(modelName(id), id)));
        if (selected && !r.models.includes(selected)) {
          setModel("");
          return;
        }
        models.control.value = selected;
      }
      modelValue.textContent = modelName(r.latestModel);
      hit.value.textContent = r.hit == null ? "\u2014" : ratio.format(r.hit);
      bar.hidden = r.hit == null;
      bar.value = r.hit ?? 0;
      speed.title.textContent = t(r.previous ? "previous" : "recent") + " TPS";
      speed.value.textContent = r.speed ? digits.format(r.speed.tps) : "\u2014";
      const notes = [];
      if (coverage !== "complete") notes.push(t(coverage));
      if (running) notes.push(t("generating"));
      if (r.speed?.includesWait) notes.push(t("wait"));
      if (r.missing) notes.push(t("missing") + " \xB7 " + r.missing);
      if (!r.counted && coverage === "complete" && !running) notes.push(t("empty"));
      const note = notes.join(" \xB7 ");
      if (status.textContent !== note) status.textContent = note;
      status.hidden = !note;
      retry.hidden = coverage !== "error";
      const counts = { ...r.totals, total: r.inputTotal, compaction: r.compactionTokens };
      for (const [key, count] of Object.entries(counts)) counters.get(key).textContent = r.counted ? digits.format(count) : "\u2014";
      const delta = r.hitChange == null || Math.abs(r.hitChange) < 5e-4 ? "" : " " + (r.hitChange > 0 ? "\u2191" : "\u2193") + digits.format(Math.abs(r.hitChange) * 100) + " pp";
      counters.get("lastHit").textContent = r.lastHit == null ? "\u2014" : ratio.format(r.lastHit) + delta;
      counters.get("average").textContent = r.average == null ? "\u2014" : digits.format(r.average) + " TPS";
      counters.get("ttft").textContent = r.ttft == null ? "\u2014" : digits.format(r.ttft) + " ms";
      const rates = r.recentRates;
      const trend = counters.get("trend");
      const max = Math.max(...rates);
      trend.textContent = rates.length < 2 ? "\u2014" : rates.map((rate) => "\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588"[Math.round(rate / max * 7)]).join("");
      trend.title = rates.map((rate) => digits.format(rate)).join(" \u2192 ") + (rates.length ? " TPS" : "");
      trend.setAttribute("aria-label", trend.title || "\u2014");
    }
    clearTimeout(timer);
    const delay = running ? 250 - (performance.now() - lastPaint) : 0;
    if (delay > 0) timer = setTimeout(paint, delay);
    else paint();
  });
  (0, import_solid_js4.onCleanup)(() => clearTimeout(timer));
}
function panel(ctx, props, useSession) {
  const frame = (0, import_gui.usePanel)();
  const root = element("section");
  root.className = "ocx-session-metrics";
  (0, import_solid_js4.createEffect)(() => {
    if (!frame.visible()) {
      root.replaceChildren();
      return;
    }
    const session = props.session;
    const locale = ctx.locale.locale();
    const source = useSession(session);
    (0, import_solid_js4.untrack)(() => mount(root, ctx, source, locale));
  });
  return root;
}

// src/labels.js
var en = {
  trend: "Recent call speeds",
  cacheLabel: "Cache hit",
  cacheShort: "Hit",
  prevShort: "Prev",
  context: "Context",
  contextShort: "Ctx",
  contextHint: "Most recent reported context usage / that model\u2019s window, after compaction and before an undo.",
  lastHit: "Latest call hit",
  callHint: "Cache read / (cache read + uncached input), in the latest reported assistant step.",
  average: "Average",
  ttft: "First token",
  estimated: "Live estimate",
  estimateHint: "Updated every second from streamed text, reasoning and tool arguments. About four UTF-16 units per token; accuracy varies by model and language.",
  title: "Session metrics",
  recentModel: "Latest model",
  unknown: "Unknown model",
  all: "All models",
  model: "Model",
  range: "Period",
  session: "Entire session",
  hour: "Last hour",
  hit: "Cache hit rate",
  recent: "Latest turn",
  previous: "Previous turn",
  generating: "Generating\u2026",
  loading: "Loading history \xB7 partial totals",
  offline: "Offline \xB7 partial totals",
  error: "Incomplete history",
  retry: "Retry",
  missing: "Finished steps without usage",
  wait: "Includes first-token wait",
  reported: "Call and token details",
  total: "Total input",
  input: "Uncached input",
  read: "Cache read",
  write: "Cache write",
  output: "Visible output",
  reasoning: "Reasoning",
  compaction: "Of all tokens: compaction",
  empty: "No usage recorded for this selection",
  hitHint: "Cache reads divided by all input, including cache writes. Individual unreported counters may be recorded as zero.",
  speedHint: "Output and reasoning tokens divided by provider streaming time across the complete turn. While generating, the previous turn is shown when available."
};
var zh = {
  trend: "\u6700\u8FD1\u8C03\u7528\u901F\u5EA6\u8D70\u52BF",
  cacheLabel: "\u7F13\u5B58\u547D\u4E2D",
  cacheShort: "\u547D\u4E2D",
  prevShort: "\u4E0A\u8F6E",
  context: "\u4E0A\u4E0B\u6587",
  contextShort: "\u4E0A\u4E0B\u6587",
  contextHint: "\u6700\u8FD1\u4E0A\u62A5\u7684\u4E0A\u4E0B\u6587\u7528\u91CF \xF7 \u8BE5\u6B65\u9AA4\u6A21\u578B\u7684\u4E0A\u4E0B\u6587\u7A97\u53E3\uFF0C\u9075\u5FAA\u538B\u7F29\u548C\u64A4\u9500\u8FB9\u754C\u3002",
  lastHit: "\u6700\u8FD1\u8C03\u7528\u547D\u4E2D",
  callHint: "\u53D6\u6700\u8FD1\u4E00\u6B21\u6709\u8F93\u5165\u7528\u91CF\u7684\u56DE\u7B54\u6B65\u9AA4\uFF0C\u6309\u7F13\u5B58\u8BFB\u53D6 \xF7\uFF08\u7F13\u5B58\u8BFB\u53D6 + \u672A\u7F13\u5B58\u8F93\u5165\uFF09\u8BA1\u7B97\u3002",
  average: "\u5E73\u5747",
  ttft: "\u9996 token \u8017\u65F6",
  estimated: "\u5B9E\u65F6\u4F30\u7B97",
  estimateHint: "\u6BCF\u79D2\u6839\u636E\u5F53\u524D\u6B65\u9AA4\u7684\u6B63\u6587\u3001\u63A8\u7406\u6587\u672C\u548C\u5DE5\u5177\u53C2\u6570\u4F30\u7B97\u3002\u7EA6\u56DB\u4E2A UTF-16 \u5355\u4F4D\u6298\u7B97\u4E00\u4E2A token\uFF0C\u7CBE\u5EA6\u968F\u6A21\u578B\u548C\u8BED\u8A00\u53D8\u5316\u3002",
  title: "\u4F1A\u8BDD\u7EDF\u8BA1",
  recentModel: "\u6700\u8FD1\u6A21\u578B",
  unknown: "\u6A21\u578B\u672A\u77E5",
  all: "\u5168\u90E8\u6A21\u578B",
  model: "\u6A21\u578B",
  range: "\u65F6\u95F4\u8303\u56F4",
  session: "\u6574\u4E2A\u4F1A\u8BDD",
  hour: "\u6700\u8FD1\u4E00\u5C0F\u65F6",
  hit: "\u7F13\u5B58\u547D\u4E2D\u7387",
  recent: "\u6700\u8FD1\u56DE\u5408",
  previous: "\u4E0A\u4E00\u56DE\u5408",
  generating: "\u751F\u6210\u4E2D\u2026",
  loading: "\u6B63\u5728\u8865\u5168\u5386\u53F2 \xB7 \u5F53\u524D\u4E3A\u90E8\u5206\u7EDF\u8BA1",
  offline: "\u8FDE\u63A5\u5DF2\u65AD\u5F00 \xB7 \u5F53\u524D\u4E3A\u90E8\u5206\u7EDF\u8BA1",
  error: "\u5386\u53F2\u672A\u5B8C\u6574\u52A0\u8F7D",
  retry: "\u91CD\u8BD5",
  missing: "\u7F3A\u5C11\u7528\u91CF\u7684\u5DF2\u7ED3\u675F\u6B65\u9AA4",
  wait: "\u542B\u9996 token \u7B49\u5F85",
  reported: "\u8C03\u7528\u4E0E Token \u660E\u7EC6",
  total: "\u603B\u8F93\u5165",
  input: "\u672A\u7F13\u5B58\u8F93\u5165",
  read: "\u7F13\u5B58\u8BFB\u53D6",
  write: "\u7F13\u5B58\u5199\u5165",
  output: "\u53EF\u89C1\u8F93\u51FA",
  reasoning: "\u63A8\u7406",
  compaction: "\u5176\u4E2D\u7528\u4E8E\u538B\u7F29\u7684 token",
  empty: "\u6B64\u8303\u56F4\u5185\u6682\u65E0\u7528\u91CF\u8BB0\u5F55",
  hitHint: "\u7F13\u5B58\u8BFB\u53D6 \xF7 \u603B\u8F93\u5165\u3002\u603B\u8F93\u5165\u542B\u672A\u7F13\u5B58\u8F93\u5165\u3001\u7F13\u5B58\u8BFB\u53D6\u548C\u5199\u5165\u3002\u5BBF\u4E3B\u53EF\u80FD\u5C06\u672A\u4E0A\u62A5\u7684\u5355\u9879\u8BB0\u5F55\u4E3A\u96F6\u3002",
  speedHint: "\u5B8C\u6574\u56DE\u5408\u7684\u53EF\u89C1\u8F93\u51FA\u548C\u63A8\u7406 token\uFF0C\u9664\u4EE5\u5404\u6B65\u9AA4\u5B9E\u9645\u751F\u6210\u79D2\u6570\u3002\u751F\u6210\u4E2D\u53EF\u67E5\u770B\u4E0A\u4E00\u56DE\u5408\u7684\u5DF2\u7ED3\u7B97\u901F\u5EA6\u3002"
};

// src/panel.css
var panel_default = ".ocx-session-metrics {\n  box-sizing: border-box;\n  width: 100%;\n  height: 100%;\n  min-width: 0;\n  padding: 16px;\n  overflow: auto;\n  font: inherit;\n  font-size: 13px;\n  color: var(--v2-text-text-base);\n  background: var(--v2-background-bg-base);\n  font-variant-numeric: tabular-nums;\n}\n.ocx-session-metrics * { box-sizing: border-box; }\n.ocx-session-metrics [hidden] { display: none; }\n.ocx-metrics-model { display: grid; gap: 3px; margin: 0 0 14px; overflow-wrap: anywhere; }\n.ocx-metrics-model span, .ocx-session-metrics dt, .ocx-metrics-filters label > span,\n.ocx-session-metrics [role=status] { color: var(--v2-text-text-muted); }\n.ocx-metrics-model strong { font-size: 14px; font-weight: 600; }\n.ocx-metrics-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; gap: 8px; }\n.ocx-metrics-stats > div, .ocx-session-metrics details {\n  padding: 10px 12px;\n  background: var(--v2-background-bg-layer-01);\n  border: 1px solid var(--v2-border-border-muted);\n  border-radius: 8px;\n}\n.ocx-metrics-stats dd { margin: 3px 0; font-size: 21px; line-height: 1.25; font-weight: 600; }\n.ocx-session-metrics meter { width: 100%; height: 6px; display: block; appearance: none; }\n.ocx-session-metrics meter::-webkit-meter-bar { background: var(--v2-border-border-muted); border: 0; border-radius: 5px; }\n.ocx-session-metrics meter::-webkit-meter-optimum-value { background: var(--v2-background-bg-accent); border-radius: 5px; }\n.ocx-metrics-filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0; }\n.ocx-metrics-filters label { display: grid; flex: 1 1 96px; min-width: 0; gap: 3px; }\n.ocx-metrics-filters select, .ocx-session-metrics button {\n  font: inherit;\n  color: inherit;\n  background: var(--v2-background-bg-layer-01);\n  padding: 4px 6px;\n  border: 1px solid var(--v2-border-border-muted);\n  border-radius: 5px;\n}\n.ocx-metrics-filters select { width: 100%; text-overflow: ellipsis; }\n.ocx-session-metrics :is(button, select, summary):focus-visible { outline: 2px solid var(--v2-border-border-focus); }\n.ocx-session-metrics summary, .ocx-session-metrics button { cursor: pointer; }\n.ocx-session-metrics summary { display: list-item; font-weight: 500; }\n.ocx-session-metrics [role=status] { margin: 0 0 8px; }\n.ocx-session-metrics button { margin-bottom: 8px; }\n.ocx-session-metrics details dl { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; margin: 10px 0 0; }\n.ocx-session-metrics details dd { margin: 0; text-align: end; }\n.ocx-metrics-estimate { margin: 8px 0; font-variant-numeric: tabular-nums; }\n\n.ocx-metrics-header {\n  display: inline-flex;\n  align-items: baseline;\n  flex-shrink: 0;\n  gap: 4px;\n  padding: 3px 6px;\n  border: 0;\n  border-radius: 5px;\n  background: transparent;\n  color: var(--v2-text-text-muted);\n  font: inherit;\n  font-size: 12px;\n  line-height: 18px;\n  font-variant-numeric: tabular-nums;\n  white-space: nowrap;\n  cursor: pointer;\n  -webkit-app-region: no-drag;\n}\n.ocx-metrics-header[hidden] { display: none; }\n.ocx-metrics-header strong { color: var(--v2-text-text-base); font-weight: 550; }\n.ocx-metrics-header span:nth-last-child(-n+2) { padding-inline-start: 5px; border-inline-start: 1px solid var(--v2-border-border-muted); }\n.ocx-metrics-header:hover { background: var(--v2-overlay-simple-overlay-hover); }\n.ocx-metrics-header:focus-visible { outline: 2px solid var(--v2-border-border-focus); }\n";

// src/plugin.js
var plugin_default = import_gui2.Plugin.define({
  i18n: { en, zh },
  setup(ctx) {
    const tab = { id: "metrics", get title() {
      return ctx.t("title");
    } };
    const useSession = createSessionMetrics();
    const open = (session) => ctx.layout.open(ctx.id + ":" + tab.id, session);
    ctx.add(import_gui2.Style, panel_default);
    ctx.add(import_gui2.Slot, { at: "session.header", order: 5, render: (input) => header(ctx, input, useSession, open) });
    ctx.add(import_gui2.Panel, {
      id: tab.id,
      region: "side",
      width: 320,
      mobile: { get title() {
        return tab.title;
      }, kind: "menu", order: 55, icon: "status" },
      list: ({ open: open2 }) => open2.includes(tab.id) ? [tab] : [],
      render: (props) => panel(ctx, props, useSession)
    });
    ctx.add(import_gui2.MenuItem, {
      menu: "session.panel",
      id: "open",
      get title() {
        return tab.title;
      },
      icon: "status",
      order: 55,
      run() {
        const session = ctx.sessions.current();
        if (session) open(session);
      }
    });
  }
});
