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
var import_solid_js2 = require("solid-js");

// src/fonts.js
var ranges = {
  en: "U+0020-007E,U+00A0-00B6,U+00B8-024F,U+0300-036F,U+1D00-1DBF,U+1E00-1EFF,U+2010-2013,U+2020-2025,U+20AC,U+2C60-2C7F,U+A720-A7FF,U+AB30-AB6F,U+FB00-FB06",
  zh: "U+00B7,U+2014,U+2018-2019,U+201C-201D,U+2026,U+2E80-2FDF,U+2FF0-303F,U+3100-312F,U+31A0-31BF,U+31C0-31EF,U+3400-4DBF,U+4E00-9FFF,U+F900-FAFF,U+FE10-FE19,U+FE30-FE4F,U+FF01-FF60,U+FFE0-FFE6,U+16FE0-16FFF,U+20000-2FA1F,U+30000-3347F"
};
var fields = ["textZh", "textEn", "codeZh", "codeEn"];
var defaults = Object.fromEntries(fields.map((key) => [key, ""]));
var chinese = ["PingFang SC", "Hiragino Sans GB", "Kaiti SC", "Noto Sans CJK SC", "Noto Serif CJK SC", "Microsoft YaHei", "SimSun"];
var presets = {
  textZh: chinese,
  codeZh: chinese,
  textEn: ["Helvetica Neue", "Arial", "Georgia", "Verdana", "Avenir Next"],
  codeEn: ["Menlo", "Monaco", "Courier New", "JetBrains Mono", "Consolas"]
};
var macFaces = {
  "PingFang SC": ["PingFangSC-Regular", "PingFangSC-Semibold"],
  "Hiragino Sans GB": ["HiraginoSansGB-W3", "HiraginoSansGB-W6"],
  "Kaiti SC": ["STKaitiSC-Regular", "STKaitiSC-Bold"]
};
function cssString(value) {
  return '"' + value.replace(/[^\p{L}\p{N} ._-]/gu, (c) => "\\" + c.codePointAt(0).toString(16) + " ") + '"';
}
function faceSource(name, variant) {
  const compact = name.replaceAll(" ", "");
  const suffixes = { regular: ["Regular", "Roman", "Book"], bold: ["Bold", "Semibold"], italic: ["Italic", "Oblique"], boldItalic: ["Bold Italic", "Bold Oblique"] };
  const names = [];
  const mapped = macFaces[name]?.[variant === "regular" ? 0 : variant === "bold" ? 1 : -1];
  if (mapped) names.push(mapped);
  const regional = /^([A-Za-z]+) (SC|TC|HK)$/.exec(name);
  if (regional && (variant === "regular" || variant === "bold")) {
    const weight = variant === "regular" ? "Regular" : "Bold";
    names.push("ST" + regional[1] + "-" + regional[2] + "-" + weight);
  }
  if (variant === "regular") names.push(name);
  for (const suffix of suffixes[variant]) names.push(name + " " + suffix, compact + "-" + suffix.replaceAll(" ", ""));
  return [...new Set(names)].map((s) => "local(" + cssString(s) + ")").join(", ");
}
function localFaces() {
  const cache = /* @__PURE__ */ new Map();
  return function resolve(name) {
    if (!name || name.length > 128) return Promise.resolve([]);
    if (cache.has(name)) return cache.get(name);
    const lookup = async (variant) => {
      const src = faceSource(name, variant);
      try {
        await new FontFace("ocx-font-probe", src).load();
        return { src, weight: variant.startsWith("bold") ? 700 : 400, style: variant.toLowerCase().includes("italic") ? "italic" : "normal" };
      } catch {
        return void 0;
      }
    };
    const result = lookup("regular").then(async (regular) => regular ? [regular, ...(await Promise.all(["bold", "italic", "boldItalic"].map(lookup))).filter(Boolean)] : []);
    if (cache.size >= 96) cache.delete(cache.keys().next().value);
    cache.set(name, result);
    return result;
  };
}
function fontCSS(faces) {
  const rules = [];
  for (const [kind, token] of [["text", "sans"], ["code", "mono"]]) {
    const stack = [];
    for (const language of ["Zh", "En"]) {
      const key = kind + language;
      if (!faces[key]?.length) continue;
      const alias = cssString("ocx-bilingual-" + key);
      stack.push(alias);
      for (const { src, weight, style } of faces[key]) {
        rules.push("@font-face { font-family: " + alias + "; src: " + src + "; font-weight: " + weight + "; font-style: " + style + "; unicode-range: " + ranges[language.toLowerCase()] + "; }");
      }
    }
    if (!stack.length) continue;
    const native = "--ocx-bilingual-native-" + token;
    const family = "--font-family-" + token;
    rules.push(":root { " + native + ": var(" + family + "); }");
    const aliases = kind === "text" ? ["--font-sans", "--font-family-text", "--v2-font-family-sans"] : ["--font-mono", "--v2-font-family-code"];
    rules.push("body { " + family + ": " + [...stack, "var(" + native + ")"].join(", ") + "; " + aliases.map((key) => key + ": var(" + family + ");").join(" ") + (kind === "text" ? " font-family: var(" + family + ");" : "") + " }");
  }
  return rules.join("\n");
}

// src/settings.js
var import_solid_js = require("solid-js");
function field(ctx, store, faces, resolve, key) {
  const group = key.startsWith("text") ? "text" : "code";
  const lang = key.endsWith("Zh") ? "zh" : "en";
  const label = ctx.t(group) + " \xB7 " + ctx.t(lang);
  const wrap = document.createElement("div");
  wrap.className = "ocx-font-control";
  const select = document.createElement("select");
  select.setAttribute("aria-label", label);
  const custom = document.createElement("input");
  custom.type = "text";
  custom.maxLength = 128;
  custom.spellcheck = false;
  custom.autocomplete = "off";
  custom.placeholder = ctx.t("example");
  custom.setAttribute("aria-label", label + " \xB7 " + ctx.t("name"));
  const note = document.createElement("small");
  note.setAttribute("role", "status");
  wrap.append(select, custom, note);
  let available = [];
  let editing = false;
  let mounted = true;
  let synced;
  (0, import_solid_js.onCleanup)(() => {
    mounted = false;
  });
  const current = () => store.value?.[key] || "";
  function refresh() {
    const value = current();
    const other = editing || value && !available.includes(value);
    select.value = other ? "custom" : value;
    custom.hidden = !other;
    if (value !== synced || document.activeElement !== custom) custom.value = value;
    synced = value;
  }
  function options() {
    select.replaceChildren(
      new Option(ctx.t("native"), ""),
      ...available.map((name) => new Option(name, name)),
      new Option(ctx.t("custom"), "custom")
    );
    refresh();
  }
  options();
  Promise.all(presets[key].map(async (name) => (await resolve(name)).length ? name : void 0)).then((names) => {
    if (!mounted) return;
    available = names.filter(Boolean);
    options();
  });
  function save(value) {
    if (current() !== value) store.update((draft) => {
      draft[key] = value;
    });
  }
  select.onchange = () => {
    editing = select.value === "custom";
    if (editing) {
      custom.hidden = false;
      custom.value = current();
      custom.focus();
      custom.select();
    } else {
      save(select.value);
      refresh();
    }
  };
  const commit = () => {
    if (custom.hidden || !mounted) return;
    const name = custom.value.trim();
    editing = false;
    save(name);
    custom.value = name;
    refresh();
  };
  custom.onchange = commit;
  custom.onkeydown = (event) => {
    if (event.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
      select.focus();
    }
    if (event.key === "Escape") {
      custom.value = current();
      editing = false;
      refresh();
      select.focus();
    }
  };
  (0, import_solid_js.createEffect)(() => {
    const value = current();
    if (value !== synced) editing = false;
    refresh();
    const result = faces()[key];
    note.textContent = value && result?.name === value && !result.variants.length ? ctx.t("missing") : "";
    note.hidden = !note.textContent;
  });
  return (0, import_solid_js.createComponent)(ctx.ui.SettingsRow, { title: ctx.t(lang), children: wrap });
}
function settingsPage(ctx, store, faces, resolve) {
  const sections = ["text", "code"].map((group) => {
    const preview = document.createElement(group === "text" ? "p" : "pre");
    preview.className = "ocx-font-preview";
    preview.setAttribute("aria-label", ctx.t(group) + " \xB7 " + ctx.t("preview"));
    preview.textContent = group === "text" ? ctx.t("textPreview") : 'const \u95EE\u5019 = "Hello\uFF0C\u4E16\u754C";  // 0123456789';
    return (0, import_solid_js.createComponent)(ctx.ui.SettingsSection, {
      title: ctx.t(group),
      footer: preview,
      get children() {
        return fields.filter((key) => key.startsWith(group)).map((key) => field(ctx, store, faces, resolve, key));
      }
    });
  });
  const reset = (0, import_solid_js.createComponent)(ctx.ui.Button, {
    children: ctx.t("reset"),
    size: "small",
    get disabled() {
      return !fields.some((key) => store.value?.[key]);
    },
    onClick: () => store.set({ ...defaults })
  });
  return (0, import_solid_js.createComponent)(ctx.ui.SettingsLayout, {
    title: ctx.t("title"),
    description: ctx.t("intro"),
    actions: reset,
    children: sections
  });
}

// src/settings.css
var settings_default = ".ocx-font-control {\n  display: grid;\n  width: 12rem;\n  max-width: 100%;\n  gap: 6px;\n  min-width: 0;\n}\n.ocx-font-control :is(select, input) {\n  box-sizing: border-box;\n  width: 100%;\n  min-width: 0;\n  padding: 5px 8px;\n  border: 1px solid var(--v2-border-border-muted);\n  border-radius: 5px;\n  background: var(--v2-background-bg-base);\n  color: var(--v2-text-text-base);\n  font: inherit;\n}\n.ocx-font-control select { cursor: pointer; appearance: auto; }\n.ocx-font-control :focus-visible { outline: 2px solid var(--v2-border-border-focus); }\n.ocx-font-control small { color: var(--v2-text-text-muted); line-height: 1.4; }\n.ocx-font-control [hidden] { display: none; }\n.ocx-font-preview { margin: 8px 0 0; padding: 8px 12px; color: var(--v2-text-text-base); overflow-wrap: anywhere; white-space: pre-wrap; }\np.ocx-font-preview { font-family: var(--font-family-sans); }\npre.ocx-font-preview { font-family: var(--font-family-mono); }\n";

// src/plugin.js
var en = {
  title: "Bilingual fonts",
  intro: "Choose local fonts for Chinese and Latin text. Each field can follow OpenCode independently.",
  text: "Interface and messages",
  code: "Code",
  zh: "Chinese",
  en: "Latin letters and numbers",
  native: "Follow OpenCode",
  custom: "Other installed font\u2026",
  name: "Font name",
  example: "Family or PostScript name",
  missing: "Font unavailable on this device. Using the OpenCode fallback.",
  reset: "Restore defaults",
  preview: "Preview",
  textPreview: "Review the update \xB7 \u68C0\u67E5\u8FD9\u6B21\u66F4\u65B0\uFF0C\u660E\u5929\u7EE7\u7EED\u3002"
};
var zh = {
  title: "\u4E2D\u82F1\u6587\u5B57\u4F53",
  intro: "\u4E3A\u4E2D\u6587\u548C\u897F\u6587\u5206\u522B\u9009\u62E9\u672C\u673A\u5B57\u4F53\u3002\u6BCF\u4E00\u9879\u90FD\u53EF\u4EE5\u5355\u72EC\u8DDF\u968F OpenCode\u3002",
  text: "\u754C\u9762\u4E0E\u6D88\u606F\u6B63\u6587",
  code: "\u4EE3\u7801",
  zh: "\u4E2D\u6587",
  en: "\u897F\u6587\u4E0E\u6570\u5B57",
  native: "\u8DDF\u968F OpenCode",
  custom: "\u5176\u4ED6\u672C\u673A\u5B57\u4F53\u2026",
  name: "\u5B57\u4F53\u540D\u79F0",
  example: "\u5B57\u4F53\u5BB6\u65CF\u540D\u6216 PostScript \u540D",
  missing: "\u672C\u673A\u672A\u627E\u5230\u8BE5\u5B57\u4F53\uFF0C\u5F53\u524D\u4F7F\u7528 OpenCode \u56DE\u9000\u5B57\u4F53\u3002",
  reset: "\u6062\u590D\u9ED8\u8BA4",
  preview: "\u9884\u89C8",
  textPreview: "Review the update \xB7 \u68C0\u67E5\u8FD9\u6B21\u66F4\u65B0\uFF0C\u660E\u5929\u7EE7\u7EED\u3002"
};
var plugin_default = import_gui.Plugin.define({
  stores: { fonts: import_gui.Store.global(import_effect.Schema.Struct(Object.fromEntries(fields.map((key) => [key, import_effect.Schema.String]))), defaults) },
  i18n: { en, zh },
  setup(ctx) {
    const store = ctx.stores.fonts;
    const resolve = localFaces();
    const [faces, setFaces] = (0, import_solid_js2.createSignal)({});
    for (const key of fields) {
      (0, import_solid_js2.createEffect)(() => {
        const name = store.value?.[key] || "";
        let active = true;
        (0, import_solid_js2.onCleanup)(() => {
          active = false;
        });
        if (!name) {
          setFaces((prev) => ({ ...prev, [key]: void 0 }));
          return;
        }
        resolve(name).then((variants) => {
          if (active) setFaces((prev) => ({ ...prev, [key]: { name, variants } }));
        });
      });
    }
    ctx.add(import_gui.Style, settings_default);
    ctx.add(import_gui.Style, () => fontCSS(Object.fromEntries(fields.map((key) => [key, faces()[key]?.variants]))) || void 0);
    ctx.add(import_gui.SettingsPage, {
      id: ctx.id,
      icon: "outline-text",
      get title() {
        return ctx.t("title");
      },
      get entries() {
        return [{ id: ctx.id, title: ctx.t("title"), keywords: "font typeface typography Chinese Latin \u4E2D\u82F1\u6587 \u5B57\u4F53 \u4EE3\u7801 \u7B49\u5BBD" }];
      },
      render: () => settingsPage(ctx, store, faces, resolve)
    });
  }
});
