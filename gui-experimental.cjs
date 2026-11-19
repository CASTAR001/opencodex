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
var import_effect = require("effect");
var import_solid_js = require("solid-js");

// src/model.js
function promptRow(message) {
  if (message.type !== "user" || !message.id) return;
  const meta = message.metadata;
  const text = (typeof meta?.displayText === "string" ? meta.displayText : message.text)?.trim();
  const presented = (key) => Array.isArray(meta?.[key]) ? meta[key] : [];
  const details = [
    ...presented("attachments").map((item) => item?.name),
    ...(message.files ?? []).filter((item) => !item.mention).map((item) => item.name),
    ...presented("comments").map((item) => item?.comment || item?.subject || item?.text || item?.path),
    ...(message.agents ?? []).filter((item) => !item.mention).map((item) => "@" + item.name),
    ...(message.skills ?? []).filter((item) => !item.mention).map((item) => item.name)
  ];
  const label = [text, ...details].filter(Boolean).join(" \xB7 ").replace(/\s+/gu, " ").trim();
  return { id: message.id, label: label || "\u9644\u4EF6\u63D0\u793A", time: message.time.created };
}
function mergePrompts(history, recent, pending, reverted) {
  const byID = new Map(history.map((row) => [row.id, row]));
  for (const row of recent) byID.set(row.id, row);
  const queued = new Set(pending);
  return [...byID.values()].filter((row) => !queued.has(row.id) && (!reverted || row.id < reverted)).sort((a, b) => a.time - b.time || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
async function historyIndex(client, sessionID, signal) {
  const rows = [];
  const seen = /* @__PURE__ */ new Set();
  let cursor;
  do {
    signal.throwIfAborted();
    const page = await client.message.list(
      { sessionID, type: "user", limit: 200, cursor },
      { signal: AbortSignal.any([signal, AbortSignal.timeout(3e4)]) }
    );
    signal.throwIfAborted();
    for (const message of page.data) {
      const row = promptRow(message);
      if (row) rows.push(row);
    }
    cursor = page.cursor.next;
    if (cursor && seen.has(cursor)) throw new Error("Repeated history cursor");
    seen.add(cursor);
  } while (cursor);
  return rows;
}

// src/edge-scroll.js
var step = 10;
var dwellMs = 550;
var repeatMs = 140;
function edgeScroll(list, nav, closePreview) {
  const events = new AbortController();
  const options = { signal: events.signal };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timer, direction = 0, moving = false, edge = 0, capacity = -1;
  function stop() {
    clearTimeout(timer);
    direction = 0;
    if (moving) list.scrollTo({ top: list.scrollTop, behavior: "instant" });
    moving = false;
  }
  function sync() {
    const top = list.scrollTop;
    const end = list.scrollHeight - list.clientHeight;
    const before = edge > 0 && top > 0.5;
    const after = edge > 0 && end - top > 0.5;
    list.toggleAttribute("data-more-before", before);
    list.toggleAttribute("data-more-after", after);
    if (direction < 0 && !before || direction > 0 && !after) stop();
  }
  function size(height) {
    const slots = Math.floor(height / step);
    const resized = slots !== capacity;
    if (resized) {
      stop();
      capacity = slots;
      edge = step * Math.min(3, Math.max(0, Math.floor((slots - 1) / 2)));
      list.style.maxHeight = slots * step + "px";
      list.style.setProperty("--pn-edge", edge + "px");
    }
    return resized;
  }
  function advance() {
    if (!direction || nav.inert || nav.hidden || document.hidden) return stop();
    if (!moving) {
      moving = true;
      closePreview();
    }
    list.scrollBy({ top: direction * step, behavior: reducedMotion.matches ? "instant" : "smooth" });
    sync();
    if (direction) timer = setTimeout(advance, repeatMs);
  }
  function hover(event) {
    if (event.pointerType !== "mouse" || event.buttons || nav.inert || !(list.hasAttribute("data-more-before") || list.hasAttribute("data-more-after"))) return stop();
    const rect = list.getBoundingClientRect();
    let next = 0;
    if (event.clientY < rect.top + edge && list.hasAttribute("data-more-before")) next = -1;
    else if (event.clientY >= rect.bottom - edge && list.hasAttribute("data-more-after")) next = 1;
    if (next === direction) return;
    stop();
    direction = next;
    if (next) timer = setTimeout(advance, dwellMs);
  }
  list.style.setProperty("--pn-step", step + "px");
  list.addEventListener("pointermove", hover, options);
  for (const event of ["pointerleave", "pointerdown", "pointercancel", "wheel"]) {
    list.addEventListener(event, stop, { ...options, passive: true });
  }
  nav.addEventListener("keydown", stop, options);
  window.addEventListener("blur", stop, options);
  document.addEventListener("visibilitychange", stop, options);
  return { size, sync, stop, get moving() {
    return moving;
  }, dispose() {
    stop();
    events.abort();
  } };
}

// src/rail.js
function el(tag, cls) {
  const node = document.createElement(tag);
  node.className = cls;
  return node;
}
function createRail({ href, jump, star, retry }) {
  const nav = el("nav", "ocx-prompt-nav");
  nav.inert = true;
  nav.setAttribute("aria-label", "\u63D0\u793A\u8BCD\u5BFC\u822A");
  const list = el("ol", "pn-ticks");
  list.setAttribute("aria-label", "\u5F53\u524D\u4F1A\u8BDD\u7684\u63D0\u793A\u8BCD");
  const pop = el("div", "pn-pop");
  pop.hidden = true;
  const info = el("div", "pn-info");
  const number = el("span", "pn-index");
  const flag = el("button", "pn-star");
  flag.type = "button";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", "m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4L2.8 9.7l6.4-.9Z");
  svg.append(path);
  flag.append(svg);
  info.append(number, flag);
  const text = el("p", "pn-text");
  text.dir = "auto";
  pop.append(info, text);
  const notice = el("div", "pn-notice");
  notice.setAttribute("role", "status");
  const message = el("span", "");
  const again = el("button", "pn-retry");
  again.type = "button";
  again.textContent = "\u91CD\u8BD5";
  again.onclick = retry;
  notice.append(message, again);
  nav.append(list, pop, notice);
  const entries = /* @__PURE__ */ new Map();
  let active, shown, stars = /* @__PURE__ */ new Set(), order = [], idle;
  let roving;
  function position() {
    const entry = entries.get(shown);
    if (!entry || pop.hidden) return;
    const tick = entry.link.getBoundingClientRect();
    const rect = nav.getBoundingClientRect();
    const visible = list.getBoundingClientRect();
    if (tick.bottom <= visible.top || tick.top >= visible.bottom) {
      close();
      return;
    }
    pop.style.top = Math.max(0, Math.min(
      rect.height - pop.offsetHeight,
      tick.top - rect.top + tick.height / 2 - pop.offsetHeight / 2
    )) + "px";
  }
  function close() {
    clearTimeout(idle);
    if (shown) entries.get(shown)?.link.removeAttribute("data-preview");
    shown = void 0;
    pop.hidden = true;
  }
  const edges = edgeScroll(list, nav, close);
  function show(id) {
    clearTimeout(idle);
    const entry = entries.get(id);
    if (!entry) return;
    if (shown !== id) entries.get(shown)?.link.removeAttribute("data-preview");
    shown = id;
    entry.link.setAttribute("data-preview", "");
    number.textContent = "\u7B2C " + (entry.index + 1) + " \u6761\u63D0\u793A";
    text.textContent = entry.label;
    flag.title = stars.has(id) ? "\u53D6\u6D88\u661F\u6807" : "\u6807\u661F";
    flag.setAttribute("aria-label", flag.title);
    flag.setAttribute("aria-pressed", String(stars.has(id)));
    pop.hidden = false;
    position();
  }
  function leave() {
    if (!shown) return;
    clearTimeout(idle);
    idle = setTimeout(() => {
      if (!pop.matches(":hover, :focus-within") && !entries.get(shown)?.link.matches(":hover, :focus-visible")) close();
    }, 130);
  }
  pop.onpointerenter = () => clearTimeout(idle);
  pop.onpointerleave = leave;
  nav.onfocusout = leave;
  flag.onclick = () => {
    if (shown) star(shown);
  };
  function setRoving(id) {
    if (roving === id) return;
    const old = entries.get(roving);
    if (old) old.link.tabIndex = -1;
    roving = id;
    const next = entries.get(id);
    if (next) next.link.tabIndex = 0;
  }
  nav.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (shown) {
        entries.get(shown)?.link.focus({ preventScroll: true });
        close();
        event.stopPropagation();
      }
      return;
    }
    if (!shown || !order.length) return;
    const index = entries.get(shown).index;
    if (event.key === "ArrowRight" || event.key === "Tab" && !event.shiftKey && event.target !== flag) {
      event.preventDefault();
      flag.focus();
      return;
    }
    if (event.target === flag && (event.key === "ArrowLeft" || event.key === "Tab" && event.shiftKey)) {
      event.preventDefault();
      entries.get(shown).link.focus();
      return;
    }
    const next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: order.length - 1 }[event.key];
    if (next == null) return;
    event.preventDefault();
    entries.get(order[Math.min(order.length - 1, Math.max(0, next))].id).link.focus();
  });
  function make(id) {
    const row = el("li", "pn-row");
    row.dataset.promptId = id;
    const link = el("a", "pn-tick");
    for (const attr of ["noscroll", "replace", "link"]) link.setAttribute(attr, "");
    link.setAttribute("preload", "false");
    link.tabIndex = -1;
    link.onfocus = () => {
      setRoving(id);
      show(id);
    };
    link.onpointerenter = (event) => {
      if (event.pointerType !== "touch" && !edges.moving) show(id);
    };
    link.onpointerleave = leave;
    link.onclick = (event) => {
      if (event.button !== 0 || event.altKey || event.metaKey || event.ctrlKey || event.shiftKey) {
        event.preventDefault();
        return;
      }
      show(id);
      jump(id, event, link);
    };
    row.append(link);
    return { row, link, index: 0, label: "" };
  }
  function current(id) {
    const view = entries.get(id);
    if (!view || id === active) return;
    entries.get(active)?.link.removeAttribute("aria-current");
    active = id;
    view.link.setAttribute("aria-current", "location");
    if (!nav.matches(":hover, :focus-within")) {
      setRoving(id);
      reveal(view.row);
    }
  }
  function reveal(row) {
    const delta = row.getBoundingClientRect().top - list.getBoundingClientRect().top;
    if (delta < -0.5 || delta + row.offsetHeight > list.clientHeight + 0.5)
      list.scrollTop += delta - list.clientHeight / 2;
  }
  list.addEventListener("scroll", () => {
    edges.sync();
    position();
  }, { passive: true });
  function size(followTail = false) {
    const wasAtTail = !list.hasAttribute("data-more-after");
    const resized = edges.size(nav.clientHeight);
    if (followTail) list.scrollTop = list.scrollHeight;
    else if (resized && !nav.inert && !nav.matches(":hover, :focus-within")) {
      if (wasAtTail) list.scrollTop = list.scrollHeight;
      else if (active) reveal(entries.get(active).row);
    }
    edges.sync();
    position();
  }
  function observeGutter(panel, content, findColumn) {
    let column, container;
    const resize = new ResizeObserver(measure);
    const waiting = new MutationObserver(measure);
    function measure() {
      const next = column?.isConnected && column.getClientRects().length ? column : findColumn();
      if (next !== column) {
        if (column) resize.unobserve(column);
        if (container) resize.unobserve(container);
        column = next;
        container = column?.parentElement;
        if (column) {
          resize.observe(column);
          if (container) resize.observe(container);
        }
      }
      if (column) waiting.disconnect();
      else waiting.observe(content, { childList: true, subtree: true });
      const room = column?.getBoundingClientRect();
      const track = nav.getBoundingClientRect();
      const hide = !room?.width || !track.width || track.right + 8 > room.left;
      if (nav.inert !== hide) {
        nav.inert = hide;
        if (hide) {
          edges.stop();
          close();
        }
      }
      size();
    }
    resize.observe(panel);
    resize.observe(nav);
    measure();
    return () => {
      resize.disconnect();
      waiting.disconnect();
    };
  }
  function update(items, saved, status) {
    const followTail = items.length !== order.length && !nav.matches(":hover, :focus-within") && list.scrollHeight - list.clientHeight - list.scrollTop < 1;
    stars = new Set(saved);
    order = items;
    let before = list.firstElementChild;
    const keep = /* @__PURE__ */ new Set();
    for (const [i, item] of items.entries()) {
      const id = item.id;
      keep.add(id);
      let entry = entries.get(id);
      if (!entry) {
        entry = make(id);
        entries.set(id, entry);
      }
      entry.label = item.label;
      entry.index = i;
      entry.link.setAttribute("href", href(id));
      entry.link.setAttribute("aria-label", "\u7B2C " + (i + 1) + " \u6761\u63D0\u793A\uFF0C" + item.label + (stars.has(id) ? "\uFF0C\u5DF2\u6807\u661F" : ""));
      entry.link.toggleAttribute("data-starred", stars.has(id));
      if (before !== entry.row) list.insertBefore(entry.row, before);
      before = entry.row.nextElementSibling;
    }
    for (const [id, entry] of entries) if (!keep.has(id)) {
      entry.row.remove();
      entries.delete(id);
    }
    if (!keep.has(roving)) setRoving(items[0]?.id);
    if (!keep.has(active)) active = void 0;
    message.textContent = status === "error" ? "\u8F83\u65E9\u7684\u63D0\u793A\u672A\u80FD\u52A0\u8F7D" : status === "miss" ? "\u5B9A\u4F4D\u5931\u8D25\uFF0C\u70B9\u51FB\u523B\u5EA6\u91CD\u8BD5" : status === "opening" ? "\u6B63\u5728\u5B9A\u4F4D\u2026" : "";
    notice.hidden = !message.textContent;
    again.hidden = status !== "error";
    nav.hidden = !items.length && notice.hidden;
    if (shown && keep.has(shown)) show(shown);
    else close();
    size(followTail);
  }
  return { nav, list, observeGutter, update, current, close, dispose() {
    clearTimeout(idle);
    edges.dispose();
  } };
}

// src/rail.css
var rail_default = `.ocx-prompt-nav {
  position:absolute; z-index:32; left:8px; top:56px; bottom:92px; width:26px;
  display:flex; flex-direction:column; justify-content:center; pointer-events:none;
  --pn-ink:var(--v2-text-text-base,#443d34);
  --pn-muted:var(--v2-text-text-muted,#746b60);
  --pn-accent:var(--v2-text-text-accent,#a55726);
  --pn-paper:var(--v2-background-bg-base,#fffbf4);
  font:inherit; color:var(--pn-ink); -webkit-app-region:no-drag;
}
.ocx-prompt-nav[hidden], .ocx-prompt-nav [hidden] { display:none !important; }
.ocx-prompt-nav[inert] { visibility:hidden; }
.ocx-prompt-nav * { box-sizing:border-box; }
.ocx-prompt-nav .pn-ticks {
  margin:0; padding:0; list-style:none; overflow-y:auto; overflow-x:hidden; min-height:0;
  scrollbar-width:none; overscroll-behavior:contain; pointer-events:auto;
}
.ocx-prompt-nav .pn-ticks[data-more-before] { --pn-top:rgb(0 0 0 / .23); }
.ocx-prompt-nav .pn-ticks[data-more-after] { --pn-bottom:rgb(0 0 0 / .23); }
.ocx-prompt-nav .pn-ticks:is([data-more-before],[data-more-after]) {
  mask-image:linear-gradient(to bottom,var(--pn-top,black),black var(--pn-edge),
    black calc(100% - var(--pn-edge)),var(--pn-bottom,black));
}
.ocx-prompt-nav .pn-ticks::-webkit-scrollbar { display:none; }
.ocx-prompt-nav .pn-row { padding:0; margin:0; list-style:none; height:var(--pn-step,10px); }
.ocx-prompt-nav .pn-tick {
  position:relative; display:flex; align-items:center; justify-content:center; width:100%; height:100%;
  text-decoration:none; color:var(--pn-ink); cursor:pointer; outline-offset:-1px;
}
.ocx-prompt-nav .pn-tick::before { content:''; width:7px; height:2px; background:currentColor; opacity:.24; }
.ocx-prompt-nav .pn-tick[aria-current]::before { width:11px; opacity:.85; }
.ocx-prompt-nav .pn-tick[data-preview]::before { opacity:1; }
.ocx-prompt-nav .pn-tick[data-starred]::before { color:var(--pn-accent); opacity:.95; }
.ocx-prompt-nav .pn-tick[data-starred]::after { content:''; width:3px; height:3px; border-radius:50%; position:absolute; left:2px; background:var(--pn-accent); }
.ocx-prompt-nav .pn-pop, .ocx-prompt-nav .pn-notice {
  position:absolute; left:100%; width:max-content; max-width:min(270px,68vw);
  pointer-events:auto; background:var(--pn-paper); border:1px solid var(--v2-border-border-muted,#ddd4c8);
  border-radius:8px; padding:8px 11px 9px; font-size:13px; line-height:1.45;
  box-shadow:0 3px 12px color-mix(in srgb,var(--pn-ink) 12%, transparent);
}
.ocx-prompt-nav .pn-info { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.ocx-prompt-nav .pn-index { font-size:11px; color:var(--pn-muted); }
.ocx-prompt-nav .pn-text { margin:3px 0 0; overflow-wrap:anywhere; white-space:normal; max-height:min(32vh,13em); overflow:auto; }
.ocx-prompt-nav button { appearance:none; background:transparent; border:none; color:inherit; font:inherit; cursor:pointer; }
.ocx-prompt-nav .pn-star { width:24px; height:24px; padding:4px; display:grid; place-items:center; border-radius:4px; color:var(--pn-muted); }
.ocx-prompt-nav .pn-star:hover { background:color-mix(in srgb,var(--pn-accent) 11%,transparent); }
.ocx-prompt-nav .pn-star svg { width:14px; height:14px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linejoin:round; }
.ocx-prompt-nav .pn-star[aria-pressed="true"] { color:var(--pn-accent); }
.ocx-prompt-nav .pn-star[aria-pressed="true"] svg { fill:currentColor; }
.ocx-prompt-nav :is(a,button):focus-visible { outline:2px solid var(--pn-accent); }
.ocx-prompt-nav .pn-notice { bottom:0; font-size:12px; }
.ocx-prompt-nav .pn-retry { text-decoration:underline; }
@media(max-width:820px) { .ocx-prompt-nav { left:0; width:16px; } .ocx-prompt-nav .pn-tick[data-starred]::after {left:0} }
@media(max-width:767px) {
  [data-slot="session-chat-panel"]:not(:has([data-slot="session-location-bar"])) > .ocx-prompt-nav {display:none;}
}
`;

// src/plugin.js
var paneSelector = '[data-slot="session-chat-panel"]';
var viewportSelector = '[data-slot="session-timeline-scroll"] > [data-scrollable]';
function mount(ctx, session, marker) {
  const host = marker.closest(paneSelector);
  if (!host) return;
  const frame = [...host.children].find((child) => child.contains(marker));
  if (!frame || host.querySelector(":scope > .ocx-prompt-nav")) return;
  const id = session.id;
  const data = session.server.data.session;
  const store = ctx.stores.bookmarks(session);
  const [prefix, setPrefix] = (0, import_solid_js.createSignal)([]);
  const [status, setStatus] = (0, import_solid_js.createSignal)("loading");
  const [jumpState, setJumpState] = (0, import_solid_js.createSignal)("");
  const [retry, setRetry] = (0, import_solid_js.createSignal)(0);
  let lastJump;
  let seeking;
  let sampleFrame = 0;
  let repeatFrame = 0;
  const rail = createRail({
    href: (target) => ctx.router.path() + "#message-" + encodeURIComponent(target),
    star: (target) => store.update((draft) => {
      if (draft.ids.includes(target)) draft.ids = draft.ids.filter((id2) => id2 !== target);
      else draft.ids.push(target);
    }),
    retry: () => setRetry((n) => n + 1),
    async jump(target, event, link) {
      event.preventDefault();
      if (!ctx.router.path() || ctx.sessions.current()?.key !== session.key) return;
      seeking?.abort();
      const controller = new AbortController();
      seeking = controller;
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(6e4)]);
      cancelAnimationFrame(repeatFrame);
      try {
        if (!data.message.get(id, target)) setJumpState("opening");
        while (!data.message.get(id, target)) {
          if (!data.message.more(id)) throw new Error("Prompt unavailable");
          const first = data.message.list(id)[0]?.id;
          await data.message.loadMore(id, { signal });
          signal.throwIfAborted();
          if (first === data.message.list(id)[0]?.id && !data.message.get(id, target))
            throw new Error("History did not advance");
        }
      } catch {
        if (!controller.signal.aborted) setJumpState("miss");
        return;
      }
      if (signal.aborted || !link.isConnected || ctx.sessions.current()?.key !== session.key) return;
      setJumpState("");
      function navigate(href) {
        const bridge = document.createElement("a");
        bridge.href = href;
        bridge.setAttribute("replace", "");
        bridge.setAttribute("noscroll", "");
        bridge.hidden = true;
        host.append(bridge);
        bridge.click();
        bridge.remove();
      }
      if (lastJump === target) {
        navigate(ctx.router.path() + "#ocx-prompt-navigation");
        repeatFrame = requestAnimationFrame(() => {
          if (!signal.aborted) navigate(link.href);
        });
      } else navigate(link.href);
      lastJump = target;
      rail.current(target);
    }
  });
  host.append(rail.nav);
  const stopGutter = rail.observeGutter(host, frame, () => frame.querySelector("[data-timeline-virtual-content] [data-timeline-row][data-message-id]"));
  function sample() {
    sampleFrame = 0;
    const viewport = marker.closest("[data-scrollable]") || [...frame.querySelectorAll(viewportSelector)].find((el2) => el2.clientHeight && el2.checkVisibility());
    if (!viewport) return;
    const box = viewport.getBoundingClientRect();
    let found;
    for (const node of viewport.querySelectorAll("[data-message-id]")) {
      const row = node.getBoundingClientRect();
      if (row.height && row.top <= box.top + 100) found = node.dataset.messageId;
      else if (!found && row.height && row.top < box.bottom) {
        found = node.dataset.messageId;
        break;
      }
    }
    if (found) rail.current(found);
  }
  function schedule() {
    if (!sampleFrame) sampleFrame = requestAnimationFrame(sample);
  }
  function scrolling(e) {
    if (e.target.matches?.(viewportSelector)) schedule();
  }
  function outside(e) {
    if (!rail.nav.contains(e.target)) rail.close();
  }
  frame.addEventListener("scroll", scrolling, true);
  host.addEventListener("pointerdown", outside);
  (0, import_solid_js.createEffect)((0, import_solid_js.on)(retry, () => {
    const cancel = new AbortController();
    (0, import_solid_js.onCleanup)(() => cancel.abort());
    setStatus("loading");
    async function read() {
      await data.message.sync(id);
      cancel.signal.throwIfAborted();
      if (data.message.more(id)) setPrefix(await historyIndex(session.server.client, id, cancel.signal));
      if (!cancel.signal.aborted) setStatus("ready");
    }
    read().catch(() => {
      if (!cancel.signal.aborted) setStatus("error");
    });
  }));
  (0, import_solid_js.createEffect)(() => {
    const recent = data.message.list(id).filter((m) => m.type === "user").map(promptRow).filter(Boolean);
    const rows = mergePrompts(prefix(), recent, data.input.list(id), data.get(id)?.revert?.messageID);
    rail.update(rows, store.value?.ids ?? [], jumpState() || status());
    schedule();
  });
  (0, import_solid_js.onCleanup)(() => {
    cancelAnimationFrame(sampleFrame);
    seeking?.abort();
    cancelAnimationFrame(repeatFrame);
    stopGutter();
    frame.removeEventListener("scroll", scrolling, true);
    host.removeEventListener("pointerdown", outside);
    rail.dispose();
    rail.nav.remove();
  });
}
var plugin_default = import_gui.Plugin.define({
  stores: { bookmarks: import_gui.Store.session(import_effect.Schema.Struct({ ids: import_effect.Schema.Array(import_effect.Schema.String) }), { ids: [] }) },
  setup(ctx) {
    ctx.add(import_gui.Style, rail_default);
    ctx.add(import_gui.Slot, { at: "window.bottom", render() {
      const marker = document.createElement("span");
      marker.hidden = true;
      (0, import_solid_js.createEffect)((0, import_solid_js.on)(() => ctx.layout.narrow() && ctx.sessions.current(), (session) => {
        if (!session || session.pending) return;
        const [bar, setBar] = (0, import_solid_js.createSignal)();
        function locate() {
          const candidate = document.querySelector(paneSelector + ' [data-slot="session-location-bar"]');
          if (candidate) {
            observer.disconnect();
            setBar(candidate);
          }
        }
        const observer = new MutationObserver(locate);
        observer.observe(document.body, { subtree: true, childList: true });
        const tick = requestAnimationFrame(locate);
        (0, import_solid_js.onCleanup)(() => {
          cancelAnimationFrame(tick);
          observer.disconnect();
        });
        (0, import_solid_js.createEffect)((0, import_solid_js.on)(bar, (el2) => {
          if (el2) mount(ctx, session, el2);
        }));
      }));
      return marker;
    } });
    ctx.add(import_gui.Slot, { at: "session.header", render(input) {
      const marker = document.createElement("span");
      marker.hidden = true;
      const [ready, setReady] = (0, import_solid_js.createSignal)(false);
      const frame = requestAnimationFrame(() => setReady(true));
      (0, import_solid_js.onCleanup)(() => cancelAnimationFrame(frame));
      (0, import_solid_js.createEffect)((0, import_solid_js.on)(() => ready() && input.active && !input.session.pending && input.session, (session) => {
        if (session) mount(ctx, session, marker);
      }));
      return marker;
    } });
  }
});
