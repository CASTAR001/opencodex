var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all2) => {
  for (var name in all2)
    __defProp(target, name, { get: all2[name], enumerable: true });
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

// node_modules/mdast-util-to-string/lib/index.js
function toString(value, options) {
  const settings = options || emptyOptions;
  const includeImageAlt = typeof settings.includeImageAlt === "boolean" ? settings.includeImageAlt : true;
  const includeHtml = typeof settings.includeHtml === "boolean" ? settings.includeHtml : true;
  return one(value, includeImageAlt, includeHtml);
}
function one(value, includeImageAlt, includeHtml) {
  if (node(value)) {
    if ("value" in value) {
      return value.type === "html" && !includeHtml ? "" : value.value;
    }
    if (includeImageAlt && "alt" in value && value.alt) {
      return value.alt;
    }
    if ("children" in value) {
      return all(value.children, includeImageAlt, includeHtml);
    }
  }
  if (Array.isArray(value)) {
    return all(value, includeImageAlt, includeHtml);
  }
  return "";
}
function all(values, includeImageAlt, includeHtml) {
  const result = [];
  let index2 = -1;
  while (++index2 < values.length) {
    result[index2] = one(values[index2], includeImageAlt, includeHtml);
  }
  return result.join("");
}
function node(value) {
  return Boolean(value && typeof value === "object");
}
var emptyOptions;
var init_lib = __esm({
  "node_modules/mdast-util-to-string/lib/index.js"() {
    emptyOptions = {};
  }
});

// node_modules/mdast-util-to-string/index.js
var init_mdast_util_to_string = __esm({
  "node_modules/mdast-util-to-string/index.js"() {
    init_lib();
  }
});

// node_modules/decode-named-character-reference/index.dom.js
function decodeNamedCharacterReference(value) {
  const characterReference2 = "&" + value + ";";
  element.innerHTML = characterReference2;
  const character = element.textContent;
  if (character.charCodeAt(character.length - 1) === 59 && value !== "semi") {
    return false;
  }
  return character === characterReference2 ? false : character;
}
var element;
var init_index_dom = __esm({
  "node_modules/decode-named-character-reference/index.dom.js"() {
    element = document.createElement("i");
  }
});

// node_modules/micromark-util-chunked/index.js
function splice(list2, start, remove, items) {
  const end = list2.length;
  let chunkStart = 0;
  let parameters;
  if (start < 0) {
    start = -start > end ? 0 : end + start;
  } else {
    start = start > end ? end : start;
  }
  remove = remove > 0 ? remove : 0;
  if (items.length < 1e4) {
    parameters = Array.from(items);
    parameters.unshift(start, remove);
    list2.splice(...parameters);
  } else {
    if (remove) list2.splice(start, remove);
    while (chunkStart < items.length) {
      parameters = items.slice(chunkStart, chunkStart + 1e4);
      parameters.unshift(start, 0);
      list2.splice(...parameters);
      chunkStart += 1e4;
      start += 1e4;
    }
  }
}
function push(list2, items) {
  if (list2.length > 0) {
    splice(list2, list2.length, 0, items);
    return list2;
  }
  return items;
}
var init_micromark_util_chunked = __esm({
  "node_modules/micromark-util-chunked/index.js"() {
  }
});

// node_modules/micromark-util-combine-extensions/index.js
function combineExtensions(extensions) {
  const all2 = {};
  let index2 = -1;
  while (++index2 < extensions.length) {
    syntaxExtension(all2, extensions[index2]);
  }
  return all2;
}
function syntaxExtension(all2, extension2) {
  let hook;
  for (hook in extension2) {
    const maybe = hasOwnProperty.call(all2, hook) ? all2[hook] : void 0;
    const left = maybe || (all2[hook] = {});
    const right = extension2[hook];
    let code2;
    if (right) {
      for (code2 in right) {
        if (!hasOwnProperty.call(left, code2)) left[code2] = [];
        const value = right[code2];
        constructs(
          // @ts-expect-error Looks like a list.
          left[code2],
          Array.isArray(value) ? value : value ? [value] : []
        );
      }
    }
  }
}
function constructs(existing, list2) {
  let index2 = -1;
  const before = [];
  while (++index2 < list2.length) {
    ;
    (list2[index2].add === "after" ? existing : before).push(list2[index2]);
  }
  splice(existing, 0, 0, before);
}
var hasOwnProperty;
var init_micromark_util_combine_extensions = __esm({
  "node_modules/micromark-util-combine-extensions/index.js"() {
    init_micromark_util_chunked();
    hasOwnProperty = {}.hasOwnProperty;
  }
});

// node_modules/micromark-util-decode-numeric-character-reference/index.js
function decodeNumericCharacterReference(value, base) {
  const code2 = Number.parseInt(value, base);
  if (
    // C0 except for HT, LF, FF, CR, space.
    code2 < 9 || code2 === 11 || code2 > 13 && code2 < 32 || // Control character (DEL) of C0, and C1 controls.
    code2 > 126 && code2 < 160 || // Lone high surrogates and low surrogates.
    code2 > 55295 && code2 < 57344 || // Noncharacters.
    code2 > 64975 && code2 < 65008 || /* eslint-disable no-bitwise */
    (code2 & 65535) === 65535 || (code2 & 65535) === 65534 || /* eslint-enable no-bitwise */
    // Out of range
    code2 > 1114111
  ) {
    return "\uFFFD";
  }
  return String.fromCodePoint(code2);
}
var init_micromark_util_decode_numeric_character_reference = __esm({
  "node_modules/micromark-util-decode-numeric-character-reference/index.js"() {
  }
});

// node_modules/micromark-util-normalize-identifier/index.js
function normalizeIdentifier(value) {
  return value.replace(/[\t\n\r ]+/g, " ").replace(/^ | $/g, "").toLowerCase().toUpperCase();
}
var init_micromark_util_normalize_identifier = __esm({
  "node_modules/micromark-util-normalize-identifier/index.js"() {
  }
});

// node_modules/micromark-util-character/index.js
function asciiControl(code2) {
  return (
    // Special whitespace codes (which have negative values), C0 and Control
    // character DEL
    code2 !== null && (code2 < 32 || code2 === 127)
  );
}
function markdownLineEnding(code2) {
  return code2 !== null && code2 < -2;
}
function markdownLineEndingOrSpace(code2) {
  return code2 !== null && (code2 < 0 || code2 === 32);
}
function markdownSpace(code2) {
  return code2 === -2 || code2 === -1 || code2 === 32;
}
function regexCheck(regex) {
  return check;
  function check(code2) {
    return code2 !== null && code2 > -1 && regex.test(String.fromCharCode(code2));
  }
}
var asciiAlpha, asciiAlphanumeric, asciiAtext, asciiDigit, asciiHexDigit, asciiPunctuation, unicodePunctuation, unicodeWhitespace;
var init_micromark_util_character = __esm({
  "node_modules/micromark-util-character/index.js"() {
    asciiAlpha = regexCheck(/[A-Za-z]/);
    asciiAlphanumeric = regexCheck(/[\dA-Za-z]/);
    asciiAtext = regexCheck(/[#-'*+\--9=?A-Z^-~]/);
    asciiDigit = regexCheck(/\d/);
    asciiHexDigit = regexCheck(/[\dA-Fa-f]/);
    asciiPunctuation = regexCheck(/[!-/:-@[-`{-~]/);
    unicodePunctuation = regexCheck(/\p{P}|\p{S}/u);
    unicodeWhitespace = regexCheck(/\s/);
  }
});

// node_modules/micromark-factory-space/index.js
function factorySpace(effects, ok3, type, max) {
  const limit = max ? max - 1 : Infinity;
  let size = 0;
  return start;
  function start(code2) {
    if (markdownSpace(code2)) {
      effects.enter(type);
      return prefix(code2);
    }
    return ok3(code2);
  }
  function prefix(code2) {
    if (markdownSpace(code2) && size++ < limit) {
      effects.consume(code2);
      return prefix;
    }
    effects.exit(type);
    return ok3(code2);
  }
}
function factorySpaceMinMax(effects, ok3, nok, type, min, max) {
  let size = 0;
  return start;
  function start(code2) {
    if (max > 0 && markdownSpace(code2)) {
      effects.enter(type);
      return prefix(code2);
    }
    return after(code2);
  }
  function prefix(code2) {
    if (markdownSpace(code2) && size < max) {
      effects.consume(code2);
      size++;
      return prefix;
    }
    effects.exit(type);
    return after(code2);
  }
  function after(code2) {
    return size >= min ? ok3(code2) : nok(code2);
  }
}
var init_micromark_factory_space = __esm({
  "node_modules/micromark-factory-space/index.js"() {
    init_micromark_util_character();
  }
});

// node_modules/micromark/lib/initialize/content.js
function initializeContent(effects) {
  const contentStart = effects.attempt(this.parser.constructs.contentInitial, afterContentStartConstruct, paragraphInitial);
  let previous4;
  return contentStart;
  function afterContentStartConstruct(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, contentStart, "linePrefix");
  }
  function paragraphInitial(code2) {
    effects.enter("paragraph");
    return lineStart(code2);
  }
  function lineStart(code2) {
    const token = effects.enter("chunkText", {
      contentType: "text",
      previous: previous4
    });
    if (previous4) {
      previous4.next = token;
    }
    previous4 = token;
    return data(code2);
  }
  function data(code2) {
    if (code2 === null) {
      effects.exit("chunkText");
      effects.exit("paragraph");
      effects.consume(code2);
      return;
    }
    if (markdownLineEnding(code2)) {
      effects.consume(code2);
      effects.exit("chunkText");
      return lineStart;
    }
    effects.consume(code2);
    return data;
  }
}
var content;
var init_content = __esm({
  "node_modules/micromark/lib/initialize/content.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    content = {
      tokenize: initializeContent
    };
  }
});

// node_modules/micromark-util-edit-map/index.js
function addImplementation(editMap, at, remove, add, before) {
  if (remove === 0 && add.length === 0) {
    return;
  }
  const existing = editMap.index.get(at);
  if (existing) {
    existing[1] += remove;
    if (before) {
      add.push(...existing[2]);
      existing[2] = add;
    } else {
      existing[2].push(...add);
    }
    return;
  }
  const change = [at, remove, add];
  editMap.map.push(change);
  editMap.index.set(at, change);
}
var EditMap;
var init_micromark_util_edit_map = __esm({
  "node_modules/micromark-util-edit-map/index.js"() {
    EditMap = class {
      /**
       * Create a new edit map.
       *
       * @returns
       *   New instance.
       */
      constructor() {
        this.index = /* @__PURE__ */ new Map();
        this.map = [];
      }
      /**
       * Create an edit: a remove and/or add at a certain place.
       *
       * @param {number} index
       *   Index at which to apply the edit.
       * @param {number} remove
       *   Count of items to remove at the index.
       * @param {Array<Event>} add
       *   Items to add at the index.
       * @returns {undefined}
       *   Nothing.
       */
      add(index2, remove, add) {
        addImplementation(this, index2, remove, add, false);
      }
      /**
       * Create an edit: but insert `add` before existing additions, instead of
       * after them.
       *
       * @param {number} index
       *   Index at which to apply the edit.
       * @param {number} remove
       *   Count of items to remove at the index.
       * @param {Array<Event>} add
       *   Items to add at the index.
       * @returns {undefined}
       *   Nothing.
       */
      addBefore(index2, remove, add) {
        addImplementation(this, index2, remove, add, true);
      }
      /**
       * Done, change the events.
       *
       * @param {Array<Event>} events
       *   List of events to apply the edits to.
       * @returns {undefined}
       *   Nothing.
       */
      consume(events) {
        this.map.sort(function(a, b) {
          return a[0] - b[0];
        });
        if (this.map.length === 0) {
          return;
        }
        let index2 = this.map.length;
        const vecs = [];
        while (index2 > 0) {
          index2 -= 1;
          vecs.push(events.slice(this.map[index2][0] + this.map[index2][1]), this.map[index2][2]);
          events.length = this.map[index2][0];
        }
        vecs.push(events.slice());
        events.length = 0;
        let slice = vecs.pop();
        while (slice) {
          for (const element2 of slice) {
            events.push(element2);
          }
          slice = vecs.pop();
        }
        this.map.length = 0;
        this.index.clear();
      }
    };
  }
});

// node_modules/micromark/lib/initialize/document.js
function initializeDocument(effects) {
  const self = this;
  const stack = [];
  let continued = 0;
  let childFlow;
  let childToken;
  let lineStartOffset;
  return start;
  function start(code2) {
    if (continued < stack.length) {
      const item = stack[continued];
      self.containerState = item[1];
      return effects.attempt(item[0].continuation, documentContinue, checkNewContainers)(code2);
    }
    return checkNewContainers(code2);
  }
  function documentContinue(code2) {
    continued++;
    if (self.containerState._closeFlow) {
      self.containerState._closeFlow = void 0;
      if (childFlow) {
        closeFlow();
      }
      const indexBeforeExits = self.events.length;
      let indexBeforeFlow = indexBeforeExits;
      let point3;
      while (indexBeforeFlow--) {
        if (self.events[indexBeforeFlow][0] === "exit" && self.events[indexBeforeFlow][1].type === "chunkFlow") {
          point3 = self.events[indexBeforeFlow][1].end;
          break;
        }
      }
      exitContainers(continued);
      let index2 = indexBeforeExits;
      while (index2 < self.events.length) {
        self.events[index2][1].end = {
          ...point3
        };
        index2++;
      }
      const editMap = new EditMap();
      editMap.add(indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));
      editMap.add(indexBeforeExits, index2 - indexBeforeExits, []);
      editMap.consume(self.events);
      return checkNewContainers(code2);
    }
    return start(code2);
  }
  function checkNewContainers(code2) {
    if (continued === stack.length) {
      if (!childFlow) {
        return documentContinued(code2);
      }
      if (childFlow.currentConstruct && childFlow.currentConstruct.concrete) {
        return flowStart(code2);
      }
      self.interrupt = Boolean(childFlow.currentConstruct && !childFlow._gfmTableDynamicInterruptHack);
    }
    self.containerState = {};
    return effects.check(containerConstruct, thereIsANewContainer, thereIsNoNewContainer)(code2);
  }
  function thereIsANewContainer(code2) {
    if (childFlow) {
      closeFlow();
    }
    exitContainers(continued);
    return documentContinued(code2);
  }
  function thereIsNoNewContainer(code2) {
    self.parser.lazy[self.now().line] = continued !== stack.length;
    lineStartOffset = self.now().offset;
    return flowStart(code2);
  }
  function documentContinued(code2) {
    self.containerState = {};
    return effects.attempt(containerConstruct, containerContinue, flowStart)(code2);
  }
  function containerContinue(code2) {
    continued++;
    stack.push([self.currentConstruct, self.containerState]);
    return documentContinued(code2);
  }
  function flowStart(code2) {
    if (code2 === null) {
      if (childFlow) {
        closeFlow();
      }
      exitContainers(0);
      effects.consume(code2);
      return;
    }
    childFlow = childFlow || self.parser.flow(self.now());
    effects.enter("chunkFlow", {
      _tokenizer: childFlow,
      contentType: "flow",
      previous: childToken
    });
    return flowContinue(code2);
  }
  function flowContinue(code2) {
    if (code2 === null) {
      writeToChild(effects.exit("chunkFlow"), true);
      exitContainers(0);
      effects.consume(code2);
      return;
    }
    if (markdownLineEnding(code2)) {
      effects.consume(code2);
      writeToChild(effects.exit("chunkFlow"));
      continued = 0;
      self.interrupt = void 0;
      return start;
    }
    effects.consume(code2);
    return flowContinue;
  }
  function writeToChild(token, endOfFile) {
    const stream = self.sliceStream(token);
    if (endOfFile) {
      stream.push(null);
    }
    token.previous = childToken;
    if (childToken) {
      childToken.next = token;
    }
    childToken = token;
    childFlow.defineSkip(token.start);
    childFlow.write(stream);
    if (self.parser.lazy[token.start.line]) {
      let index2 = childFlow.events.length;
      while (index2--) {
        if (
          // The token starts before the line ending…
          childFlow.events[index2][1].start.offset < lineStartOffset && // …and either is not ended yet…
          (!childFlow.events[index2][1].end || // …or ends after it.
          childFlow.events[index2][1].end.offset > lineStartOffset)
        ) {
          return;
        }
      }
      const indexBeforeExits = self.events.length;
      let indexBeforeFlow = indexBeforeExits;
      let seen;
      let point3;
      while (indexBeforeFlow--) {
        if (self.events[indexBeforeFlow][0] === "exit" && self.events[indexBeforeFlow][1].type === "chunkFlow") {
          if (seen) {
            point3 = self.events[indexBeforeFlow][1].end;
            break;
          }
          seen = true;
        }
      }
      exitContainers(continued);
      index2 = indexBeforeExits;
      while (index2 < self.events.length) {
        self.events[index2][1].end = {
          ...point3
        };
        index2++;
      }
      const editMap = new EditMap();
      editMap.add(indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));
      editMap.add(indexBeforeExits, index2 - indexBeforeExits, []);
      editMap.consume(self.events);
    }
  }
  function exitContainers(size) {
    let index2 = stack.length;
    while (index2-- > size) {
      const entry = stack[index2];
      self.containerState = entry[1];
      entry[0].exit.call(self, effects);
    }
    stack.length = size;
  }
  function closeFlow() {
    childFlow.write([null]);
    childToken = void 0;
    childFlow = void 0;
    self.containerState._closeFlow = void 0;
  }
}
function tokenizeContainer(effects, ok3, nok) {
  return factorySpace(effects, effects.attempt(this.parser.constructs.document, ok3, nok), "linePrefix", this.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4);
}
var document2, containerConstruct;
var init_document = __esm({
  "node_modules/micromark/lib/initialize/document.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    init_micromark_util_edit_map();
    document2 = {
      tokenize: initializeDocument
    };
    containerConstruct = {
      tokenize: tokenizeContainer
    };
  }
});

// node_modules/micromark-util-classify-character/index.js
function classifyCharacter(code2) {
  if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
    return 1;
  }
  if (unicodePunctuation(code2)) {
    return 2;
  }
}
var init_micromark_util_classify_character = __esm({
  "node_modules/micromark-util-classify-character/index.js"() {
    init_micromark_util_character();
  }
});

// node_modules/micromark-util-resolve-all/index.js
function resolveAll(constructs2, events, context) {
  const called = [];
  let index2 = -1;
  while (++index2 < constructs2.length) {
    const resolve = constructs2[index2].resolveAll;
    if (resolve && !called.includes(resolve)) {
      events = resolve(events, context);
      called.push(resolve);
    }
  }
  return events;
}
var init_micromark_util_resolve_all = __esm({
  "node_modules/micromark-util-resolve-all/index.js"() {
  }
});

// node_modules/micromark-core-commonmark/lib/attention.js
function resolveAllAttention(events, context) {
  let index2 = -1;
  let nextEvents;
  while (++index2 < events.length) {
    if (events[index2][0] === "enter" && events[index2][1].type === "attentionSequence" && events[index2][1]._close) {
      let open = index2;
      while (open--) {
        if (events[open][0] === "exit" && events[open][1].type === "attentionSequence" && events[open][1]._open && // If the markers are the same:
        context.sliceSerialize(events[open][1]).charCodeAt(0) === context.sliceSerialize(events[index2][1]).charCodeAt(0)) {
          if ((events[open][1]._close || events[index2][1]._open) && (events[index2][1].end.offset - events[index2][1].start.offset) % 3 && !((events[open][1].end.offset - events[open][1].start.offset + events[index2][1].end.offset - events[index2][1].start.offset) % 3)) {
            continue;
          }
          const use = events[open][1].end.offset - events[open][1].start.offset > 1 && events[index2][1].end.offset - events[index2][1].start.offset > 1 ? 2 : 1;
          const start = {
            ...events[open][1].end
          };
          const end = {
            ...events[index2][1].start
          };
          movePoint(start, -use);
          movePoint(end, use);
          const openingSequence = {
            type: use > 1 ? "strongSequence" : "emphasisSequence",
            start,
            end: {
              ...events[open][1].end
            }
          };
          const closingSequence = {
            type: use > 1 ? "strongSequence" : "emphasisSequence",
            start: {
              ...events[index2][1].start
            },
            end
          };
          const text4 = {
            type: use > 1 ? "strongText" : "emphasisText",
            start: {
              ...events[open][1].end
            },
            end: {
              ...events[index2][1].start
            }
          };
          const group = {
            type: use > 1 ? "strong" : "emphasis",
            start: {
              ...openingSequence.start
            },
            end: {
              ...closingSequence.end
            }
          };
          events[open][1].end = {
            ...openingSequence.start
          };
          events[index2][1].start = {
            ...closingSequence.end
          };
          nextEvents = [];
          if (events[open][1].end.offset - events[open][1].start.offset) {
            nextEvents = push(nextEvents, [["enter", events[open][1], context], ["exit", events[open][1], context]]);
          }
          nextEvents = push(nextEvents, [["enter", group, context], ["enter", openingSequence, context], ["exit", openingSequence, context], ["enter", text4, context]]);
          nextEvents = push(nextEvents, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + 1, index2), context));
          nextEvents = push(nextEvents, [["exit", text4, context], ["enter", closingSequence, context], ["exit", closingSequence, context], ["exit", group, context]]);
          let offset = 0;
          if (events[index2][1].end.offset - events[index2][1].start.offset) {
            offset = 2;
            nextEvents = push(nextEvents, [["enter", events[index2][1], context], ["exit", events[index2][1], context]]);
          }
          splice(events, open - 1, index2 - open + 3, nextEvents);
          index2 = open + nextEvents.length - offset - 2;
          break;
        }
      }
    }
  }
  index2 = -1;
  while (++index2 < events.length) {
    if (events[index2][1].type === "attentionSequence") {
      events[index2][1].type = "data";
    }
  }
  return events;
}
function tokenizeAttention(effects, ok3) {
  const attentionMarkers2 = this.parser.constructs.attentionMarkers.null;
  const previous4 = this.previous;
  const before = classifyCharacter(previous4);
  let marker;
  return start;
  function start(code2) {
    marker = code2;
    effects.enter("attentionSequence");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      return inside;
    }
    const token = effects.exit("attentionSequence");
    const after = classifyCharacter(code2);
    const open = !after || after === 2 && before || attentionMarkers2.includes(code2) && code2 !== 42 && code2 !== 95;
    const close = !before || before === 2 && after || attentionMarkers2.includes(previous4) && previous4 !== 42 && previous4 !== 95;
    token._open = Boolean(marker === 42 ? open : open && (before || !close));
    token._close = Boolean(marker === 42 ? close : close && (after || !open));
    return ok3(code2);
  }
}
function movePoint(point3, offset) {
  point3.column += offset;
  point3.offset += offset;
  point3._bufferIndex += offset;
}
var attention;
var init_attention = __esm({
  "node_modules/micromark-core-commonmark/lib/attention.js"() {
    init_micromark_util_chunked();
    init_micromark_util_classify_character();
    init_micromark_util_resolve_all();
    attention = {
      name: "attention",
      resolveAll: resolveAllAttention,
      tokenize: tokenizeAttention
    };
  }
});

// node_modules/micromark-core-commonmark/lib/autolink.js
function tokenizeAutolink(effects, ok3, nok) {
  let size = 0;
  return start;
  function start(code2) {
    effects.enter("autolink");
    effects.enter("autolinkMarker");
    effects.consume(code2);
    effects.exit("autolinkMarker");
    effects.enter("autolinkProtocol");
    return open;
  }
  function open(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return schemeOrEmailAtext;
    }
    if (code2 === 64) {
      return nok(code2);
    }
    return emailAtext(code2);
  }
  function schemeOrEmailAtext(code2) {
    if (code2 === 43 || code2 === 45 || code2 === 46 || asciiAlphanumeric(code2)) {
      size = 1;
      return schemeInsideOrEmailAtext(code2);
    }
    return emailAtext(code2);
  }
  function schemeInsideOrEmailAtext(code2) {
    if (code2 === 58) {
      effects.consume(code2);
      size = 0;
      return urlInside;
    }
    if ((code2 === 43 || code2 === 45 || code2 === 46 || asciiAlphanumeric(code2)) && size++ < 32) {
      effects.consume(code2);
      return schemeInsideOrEmailAtext;
    }
    size = 0;
    return emailAtext(code2);
  }
  function urlInside(code2) {
    if (code2 === 62) {
      effects.exit("autolinkProtocol");
      effects.enter("autolinkMarker");
      effects.consume(code2);
      effects.exit("autolinkMarker");
      effects.exit("autolink");
      return ok3;
    }
    if (code2 === null || code2 === 32 || code2 === 60 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return urlInside;
  }
  function emailAtext(code2) {
    if (code2 === 64) {
      effects.consume(code2);
      return emailAtSignOrDot;
    }
    if (asciiAtext(code2)) {
      effects.consume(code2);
      return emailAtext;
    }
    return nok(code2);
  }
  function emailAtSignOrDot(code2) {
    return asciiAlphanumeric(code2) ? emailLabel(code2) : nok(code2);
  }
  function emailLabel(code2) {
    if (code2 === 46) {
      effects.consume(code2);
      size = 0;
      return emailAtSignOrDot;
    }
    if (code2 === 62) {
      effects.exit("autolinkProtocol").type = "autolinkEmail";
      effects.enter("autolinkMarker");
      effects.consume(code2);
      effects.exit("autolinkMarker");
      effects.exit("autolink");
      return ok3;
    }
    return emailValue(code2);
  }
  function emailValue(code2) {
    if ((code2 === 45 || asciiAlphanumeric(code2)) && size++ < 63) {
      const next = code2 === 45 ? emailValue : emailLabel;
      effects.consume(code2);
      return next;
    }
    return nok(code2);
  }
}
var autolink;
var init_autolink = __esm({
  "node_modules/micromark-core-commonmark/lib/autolink.js"() {
    init_micromark_util_character();
    autolink = {
      name: "autolink",
      tokenize: tokenizeAutolink
    };
  }
});

// node_modules/micromark-core-commonmark/lib/blank-line.js
function tokenizeBlankLine(effects, ok3, nok) {
  return start;
  function start(code2) {
    return markdownSpace(code2) ? factorySpace(effects, after, "linePrefix")(code2) : after(code2);
  }
  function after(code2) {
    return code2 === null || markdownLineEnding(code2) ? ok3(code2) : nok(code2);
  }
}
var blankLine;
var init_blank_line = __esm({
  "node_modules/micromark-core-commonmark/lib/blank-line.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    blankLine = {
      partial: true,
      tokenize: tokenizeBlankLine
    };
  }
});

// node_modules/micromark-core-commonmark/lib/block-quote.js
function tokenizeBlockQuoteStart(effects, ok3, nok) {
  const self = this;
  return start;
  function start(code2) {
    if (code2 === 62) {
      const state = self.containerState;
      if (!state.open) {
        effects.enter("blockQuote", {
          _container: true
        });
        state.open = true;
      }
      effects.enter("blockQuotePrefix");
      effects.enter("blockQuoteMarker");
      effects.consume(code2);
      effects.exit("blockQuoteMarker");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    if (markdownSpace(code2)) {
      effects.enter("blockQuotePrefixWhitespace");
      effects.consume(code2);
      effects.exit("blockQuotePrefixWhitespace");
      effects.exit("blockQuotePrefix");
      return ok3;
    }
    effects.exit("blockQuotePrefix");
    return ok3(code2);
  }
}
function tokenizeBlockQuoteContinuation(effects, ok3, nok) {
  const self = this;
  return contStart;
  function contStart(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, contBefore, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
    }
    return contBefore(code2);
  }
  function contBefore(code2) {
    return effects.attempt(blockQuote, ok3, nok)(code2);
  }
}
function exit(effects) {
  effects.exit("blockQuote");
}
var blockQuote;
var init_block_quote = __esm({
  "node_modules/micromark-core-commonmark/lib/block-quote.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    blockQuote = {
      continuation: {
        tokenize: tokenizeBlockQuoteContinuation
      },
      exit,
      name: "blockQuote",
      tokenize: tokenizeBlockQuoteStart
    };
  }
});

// node_modules/micromark-core-commonmark/lib/character-escape.js
function tokenizeCharacterEscape(effects, ok3, nok) {
  return start;
  function start(code2) {
    effects.enter("characterEscape");
    effects.enter("escapeMarker");
    effects.consume(code2);
    effects.exit("escapeMarker");
    return inside;
  }
  function inside(code2) {
    if (asciiPunctuation(code2)) {
      effects.enter("characterEscapeValue");
      effects.consume(code2);
      effects.exit("characterEscapeValue");
      effects.exit("characterEscape");
      return ok3;
    }
    return nok(code2);
  }
}
var characterEscape;
var init_character_escape = __esm({
  "node_modules/micromark-core-commonmark/lib/character-escape.js"() {
    init_micromark_util_character();
    characterEscape = {
      name: "characterEscape",
      tokenize: tokenizeCharacterEscape
    };
  }
});

// node_modules/micromark-core-commonmark/lib/character-reference.js
function tokenizeCharacterReference(effects, ok3, nok) {
  const self = this;
  let size = 0;
  let max;
  let test;
  return start;
  function start(code2) {
    effects.enter("characterReference");
    effects.enter("characterReferenceMarker");
    effects.consume(code2);
    effects.exit("characterReferenceMarker");
    return open;
  }
  function open(code2) {
    if (code2 === 35) {
      effects.enter("characterReferenceMarkerNumeric");
      effects.consume(code2);
      effects.exit("characterReferenceMarkerNumeric");
      return numeric;
    }
    effects.enter("characterReferenceValue");
    max = 31;
    test = asciiAlphanumeric;
    return value(code2);
  }
  function numeric(code2) {
    if (code2 === 88 || code2 === 120) {
      effects.enter("characterReferenceMarkerHexadecimal");
      effects.consume(code2);
      effects.exit("characterReferenceMarkerHexadecimal");
      effects.enter("characterReferenceValue");
      max = 6;
      test = asciiHexDigit;
      return value;
    }
    effects.enter("characterReferenceValue");
    max = 7;
    test = asciiDigit;
    return value(code2);
  }
  function value(code2) {
    if (code2 === 59 && size) {
      const token = effects.exit("characterReferenceValue");
      if (test === asciiAlphanumeric && !decodeNamedCharacterReference(self.sliceSerialize(token))) {
        return nok(code2);
      }
      effects.enter("characterReferenceMarker");
      effects.consume(code2);
      effects.exit("characterReferenceMarker");
      effects.exit("characterReference");
      return ok3;
    }
    if (test(code2) && size++ < max) {
      effects.consume(code2);
      return value;
    }
    return nok(code2);
  }
}
var characterReference;
var init_character_reference = __esm({
  "node_modules/micromark-core-commonmark/lib/character-reference.js"() {
    init_index_dom();
    init_micromark_util_character();
    characterReference = {
      name: "characterReference",
      tokenize: tokenizeCharacterReference
    };
  }
});

// node_modules/micromark-core-commonmark/lib/partial-non-lazy-continuation.js
function tokenizeNonLazyContinuation(effects, ok3, nok) {
  const self = this;
  return start;
  function start(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return after;
  }
  function after(code2) {
    return self.parser.lazy[self.now().line] ? nok(code2) : ok3(code2);
  }
}
var nonLazyContinuation;
var init_partial_non_lazy_continuation = __esm({
  "node_modules/micromark-core-commonmark/lib/partial-non-lazy-continuation.js"() {
    nonLazyContinuation = {
      partial: true,
      tokenize: tokenizeNonLazyContinuation
    };
  }
});

// node_modules/micromark-core-commonmark/lib/code-fenced.js
function tokenizeCodeFenced(effects, ok3, nok) {
  const self = this;
  const closeStart = {
    partial: true,
    tokenize: tokenizeCloseStart
  };
  let initialPrefix = 0;
  let sizeOpen = 0;
  let marker;
  return start;
  function start(code2) {
    return beforeSequenceOpen(code2);
  }
  function beforeSequenceOpen(code2) {
    const tail = self.events[self.events.length - 1];
    initialPrefix = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
    marker = code2;
    effects.enter("codeFenced");
    effects.enter("codeFencedFence");
    effects.enter("codeFencedFenceSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === marker) {
      sizeOpen++;
      effects.consume(code2);
      return sequenceOpen;
    }
    if (sizeOpen < 3) {
      return nok(code2);
    }
    effects.exit("codeFencedFenceSequence");
    return markdownSpace(code2) ? factorySpace(effects, infoBefore, "whitespace")(code2) : infoBefore(code2);
  }
  function infoBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFencedFence");
      return self.interrupt ? ok3(code2) : effects.check(nonLazyContinuation, atNonLazyBreak, after)(code2);
    }
    effects.enter("codeFencedFenceInfo");
    effects.enter("chunkString", {
      contentType: "string"
    });
    return info(code2);
  }
  function info(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceInfo");
      return infoBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceInfo");
      return factorySpace(effects, metaBefore, "whitespace")(code2);
    }
    if (code2 === 96 && code2 === marker) {
      return nok(code2);
    }
    effects.consume(code2);
    return info;
  }
  function metaBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return infoBefore(code2);
    }
    effects.enter("codeFencedFenceMeta");
    effects.enter("chunkString", {
      contentType: "string"
    });
    return meta(code2);
  }
  function meta(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceMeta");
      return infoBefore(code2);
    }
    if (code2 === 96 && code2 === marker) {
      return nok(code2);
    }
    effects.consume(code2);
    return meta;
  }
  function atNonLazyBreak(code2) {
    return effects.attempt(closeStart, after, contentBefore)(code2);
  }
  function contentBefore(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return contentStart;
  }
  function contentStart(code2) {
    return initialPrefix > 0 && markdownSpace(code2) ? factorySpace(effects, beforeContentChunk, "linePrefix", initialPrefix + 1)(code2) : beforeContentChunk(code2);
  }
  function beforeContentChunk(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return effects.check(nonLazyContinuation, atNonLazyBreak, after)(code2);
    }
    effects.enter("codeFlowValue");
    return contentChunk(code2);
  }
  function contentChunk(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFlowValue");
      return beforeContentChunk(code2);
    }
    effects.consume(code2);
    return contentChunk;
  }
  function after(code2) {
    effects.exit("codeFenced");
    return ok3(code2);
  }
  function tokenizeCloseStart(effects2, ok4, nok2) {
    let size = 0;
    return startBefore;
    function startBefore(code2) {
      effects2.enter("lineEnding");
      effects2.consume(code2);
      effects2.exit("lineEnding");
      return start2;
    }
    function start2(code2) {
      effects2.enter("codeFencedFence");
      return markdownSpace(code2) ? factorySpace(effects2, beforeSequenceClose, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2) : beforeSequenceClose(code2);
    }
    function beforeSequenceClose(code2) {
      if (code2 === marker) {
        effects2.enter("codeFencedFenceSequence");
        return sequenceClose(code2);
      }
      return nok2(code2);
    }
    function sequenceClose(code2) {
      if (code2 === marker) {
        size++;
        effects2.consume(code2);
        return sequenceClose;
      }
      if (size >= sizeOpen) {
        effects2.exit("codeFencedFenceSequence");
        return markdownSpace(code2) ? factorySpace(effects2, sequenceCloseAfter, "whitespace")(code2) : sequenceCloseAfter(code2);
      }
      return nok2(code2);
    }
    function sequenceCloseAfter(code2) {
      if (code2 === null || markdownLineEnding(code2)) {
        effects2.exit("codeFencedFence");
        return ok4(code2);
      }
      return nok2(code2);
    }
  }
}
var codeFenced;
var init_code_fenced = __esm({
  "node_modules/micromark-core-commonmark/lib/code-fenced.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    init_partial_non_lazy_continuation();
    codeFenced = {
      concrete: true,
      name: "codeFenced",
      tokenize: tokenizeCodeFenced
    };
  }
});

// node_modules/micromark-core-commonmark/lib/code-indented.js
function tokenizeCodeIndented(effects, ok3, nok) {
  return start;
  function start(code2) {
    effects.enter("codeIndented");
    return factorySpaceMinMax(effects, atBreak, nok, "linePrefix", 4, 4)(code2);
  }
  function atBreak(code2) {
    if (code2 === null) {
      return after(code2);
    }
    if (markdownLineEnding(code2)) {
      return effects.attempt(furtherStart, atBreak, after)(code2);
    }
    effects.enter("codeFlowValue");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("codeFlowValue");
      return atBreak(code2);
    }
    effects.consume(code2);
    return inside;
  }
  function after(code2) {
    effects.exit("codeIndented");
    return ok3(code2);
  }
}
function tokenizeFurtherStart(effects, ok3, nok) {
  const self = this;
  return furtherStart2;
  function furtherStart2(code2) {
    if (self.parser.lazy[self.now().line]) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return furtherStart2;
    }
    return factorySpaceMinMax(effects, ok3, onNotEnoughPrefix, "linePrefix", 4, 4)(code2);
  }
  function onNotEnoughPrefix(code2) {
    return markdownLineEnding(code2) ? furtherStart2(code2) : nok(code2);
  }
}
var codeIndented, furtherStart;
var init_code_indented = __esm({
  "node_modules/micromark-core-commonmark/lib/code-indented.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    codeIndented = {
      name: "codeIndented",
      tokenize: tokenizeCodeIndented
    };
    furtherStart = {
      partial: true,
      tokenize: tokenizeFurtherStart
    };
  }
});

// node_modules/micromark-core-commonmark/lib/code-text.js
function resolveCodeText(events) {
  let tailExitIndex = events.length - 4;
  let headEnterIndex = 3;
  let index2;
  let enter;
  if ((events[headEnterIndex][1].type === "lineEnding" || events[headEnterIndex][1].type === "space") && (events[tailExitIndex][1].type === "lineEnding" || events[tailExitIndex][1].type === "space")) {
    index2 = headEnterIndex;
    while (++index2 < tailExitIndex) {
      if (events[index2][1].type === "codeTextData") {
        events[headEnterIndex][1].type = "codeTextPadding";
        events[tailExitIndex][1].type = "codeTextPadding";
        headEnterIndex += 2;
        tailExitIndex -= 2;
        break;
      }
    }
  }
  index2 = headEnterIndex - 1;
  tailExitIndex++;
  while (++index2 <= tailExitIndex) {
    if (enter === void 0) {
      if (index2 !== tailExitIndex && events[index2][1].type !== "lineEnding") {
        enter = index2;
      }
    } else if (index2 === tailExitIndex || events[index2][1].type === "lineEnding") {
      events[enter][1].type = "codeTextData";
      if (index2 !== enter + 2) {
        events[enter][1].end = events[index2 - 1][1].end;
        events.splice(enter + 2, index2 - enter - 2);
        tailExitIndex -= index2 - enter - 2;
        index2 = enter + 2;
      }
      enter = void 0;
    }
  }
  return events;
}
function previous(code2) {
  return code2 !== 96 || this.events[this.events.length - 1][1].type === "characterEscape";
}
function tokenizeCodeText(effects, ok3, nok) {
  const self = this;
  let sizeOpen = 0;
  let size;
  let token;
  return start;
  function start(code2) {
    effects.enter("codeText");
    effects.enter("codeTextSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === 96) {
      effects.consume(code2);
      sizeOpen++;
      return sequenceOpen;
    }
    effects.exit("codeTextSequence");
    return between(code2);
  }
  function between(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 32) {
      effects.enter("space");
      effects.consume(code2);
      effects.exit("space");
      return between;
    }
    if (code2 === 96) {
      token = effects.enter("codeTextSequence");
      size = 0;
      return sequenceClose(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return between;
    }
    effects.enter("codeTextData");
    return data(code2);
  }
  function data(code2) {
    if (code2 === null || code2 === 32 || code2 === 96 || markdownLineEnding(code2)) {
      effects.exit("codeTextData");
      return between(code2);
    }
    effects.consume(code2);
    return data;
  }
  function sequenceClose(code2) {
    if (code2 === 96) {
      effects.consume(code2);
      size++;
      return sequenceClose;
    }
    if (size === sizeOpen) {
      effects.exit("codeTextSequence");
      effects.exit("codeText");
      return ok3(code2);
    }
    token.type = "codeTextData";
    return data(code2);
  }
}
var codeText;
var init_code_text = __esm({
  "node_modules/micromark-core-commonmark/lib/code-text.js"() {
    init_micromark_util_character();
    codeText = {
      name: "codeText",
      previous,
      resolve: resolveCodeText,
      tokenize: tokenizeCodeText
    };
  }
});

// node_modules/micromark-util-subtokenize/lib/splice-buffer.js
function chunkedPush(list2, right) {
  let chunkStart = 0;
  if (right.length < 1e4) {
    list2.push(...right);
  } else {
    while (chunkStart < right.length) {
      list2.push(...right.slice(chunkStart, chunkStart + 1e4));
      chunkStart += 1e4;
    }
  }
}
var SpliceBuffer;
var init_splice_buffer = __esm({
  "node_modules/micromark-util-subtokenize/lib/splice-buffer.js"() {
    SpliceBuffer = class {
      /**
       * @param {ReadonlyArray<T> | null | undefined} [initial]
       *   Initial items (optional).
       * @returns
       *   Splice buffer.
       */
      constructor(initial) {
        this.left = initial ? [...initial] : [];
        this.right = [];
      }
      /**
       * Array access;
       * does not move the cursor.
       *
       * @param {number} index
       *   Index.
       * @return {T}
       *   Item.
       */
      get(index2) {
        if (index2 < 0 || index2 >= this.left.length + this.right.length) {
          throw new RangeError("Cannot access index `" + index2 + "` in a splice buffer of size `" + (this.left.length + this.right.length) + "`");
        }
        if (index2 < this.left.length) return this.left[index2];
        return this.right[this.right.length - index2 + this.left.length - 1];
      }
      /**
       * The length of the splice buffer, one greater than the largest index in the
       * array.
       */
      get length() {
        return this.left.length + this.right.length;
      }
      /**
       * Remove and return `list[0]`;
       * moves the cursor to `0`.
       *
       * @returns {T | undefined}
       *   Item, optional.
       */
      shift() {
        this.setCursor(0);
        return this.right.pop();
      }
      /**
       * Slice the buffer to get an array;
       * does not move the cursor.
       *
       * @param {number} start
       *   Start.
       * @param {number | null | undefined} [end]
       *   End (optional).
       * @returns {Array<T>}
       *   Array of items.
       */
      slice(start, end) {
        const stop = end === null || end === void 0 ? Number.POSITIVE_INFINITY : end;
        if (stop < this.left.length) {
          return this.left.slice(start, stop);
        }
        if (start > this.left.length) {
          return this.right.slice(this.right.length - stop + this.left.length, this.right.length - start + this.left.length).reverse();
        }
        return this.left.slice(start).concat(this.right.slice(this.right.length - stop + this.left.length).reverse());
      }
      /**
       * Mimics the behavior of Array.prototype.splice() except for the change of
       * interface necessary to avoid segfaults when patching in very large arrays.
       *
       * This operation moves cursor is moved to `start` and results in the cursor
       * placed after any inserted items.
       *
       * @param {number} start
       *   Start;
       *   zero-based index at which to start changing the array;
       *   negative numbers count backwards from the end of the array and values
       *   that are out-of bounds are clamped to the appropriate end of the array.
       * @param {number | null | undefined} [deleteCount=0]
       *   Delete count (default: `0`);
       *   maximum number of elements to delete, starting from start.
       * @param {Array<T> | null | undefined} [items=[]]
       *   Items to include in place of the deleted items (default: `[]`).
       * @return {Array<T>}
       *   Any removed items.
       */
      splice(start, deleteCount, items) {
        const count = deleteCount || 0;
        this.setCursor(Math.trunc(start));
        const removed = this.right.splice(this.right.length - count, Number.POSITIVE_INFINITY);
        if (items) chunkedPush(this.left, items);
        return removed.reverse();
      }
      /**
       * Remove and return the highest-numbered item in the array, so
       * `list[list.length - 1]`;
       * Moves the cursor to `length`.
       *
       * @returns {T | undefined}
       *   Item, optional.
       */
      pop() {
        this.setCursor(Number.POSITIVE_INFINITY);
        return this.left.pop();
      }
      /**
       * Inserts a single item to the high-numbered side of the array;
       * moves the cursor to `length`.
       *
       * @param {T} item
       *   Item.
       * @returns {undefined}
       *   Nothing.
       */
      push(item) {
        this.setCursor(Number.POSITIVE_INFINITY);
        this.left.push(item);
      }
      /**
       * Inserts many items to the high-numbered side of the array.
       * Moves the cursor to `length`.
       *
       * @param {Array<T>} items
       *   Items.
       * @returns {undefined}
       *   Nothing.
       */
      pushMany(items) {
        this.setCursor(Number.POSITIVE_INFINITY);
        chunkedPush(this.left, items);
      }
      /**
       * Inserts a single item to the low-numbered side of the array;
       * Moves the cursor to `0`.
       *
       * @param {T} item
       *   Item.
       * @returns {undefined}
       *   Nothing.
       */
      unshift(item) {
        this.setCursor(0);
        this.right.push(item);
      }
      /**
       * Inserts many items to the low-numbered side of the array;
       * moves the cursor to `0`.
       *
       * @param {Array<T>} items
       *   Items.
       * @returns {undefined}
       *   Nothing.
       */
      unshiftMany(items) {
        this.setCursor(0);
        chunkedPush(this.right, items.reverse());
      }
      /**
       * Move the cursor to a specific position in the array. Requires
       * time proportional to the distance moved.
       *
       * If `n < 0`, the cursor will end up at the beginning.
       * If `n > length`, the cursor will end up at the end.
       *
       * @param {number} n
       *   Position.
       * @return {undefined}
       *   Nothing.
       */
      setCursor(n) {
        if (n === this.left.length || n > this.left.length && this.right.length === 0 || n < 0 && this.left.length === 0) return;
        if (n < this.left.length) {
          const removed = this.left.splice(n, Number.POSITIVE_INFINITY);
          chunkedPush(this.right, removed.reverse());
        } else {
          const removed = this.right.splice(this.left.length + this.right.length - n, Number.POSITIVE_INFINITY);
          chunkedPush(this.left, removed.reverse());
        }
      }
    };
  }
});

// node_modules/micromark-util-subtokenize/index.js
function subtokenize(eventsArray) {
  const jumps = {};
  let index2 = -1;
  let event;
  let lineIndex;
  let otherIndex;
  let otherEvent;
  let parameters;
  let subevents;
  let more;
  const events = new SpliceBuffer(eventsArray);
  while (++index2 < events.length) {
    while (index2 in jumps) {
      index2 = jumps[index2];
    }
    event = events.get(index2);
    if (index2 && event[1].type === "chunkFlow" && events.get(index2 - 1)[1].type === "listItemPrefix") {
      subevents = event[1]._tokenizer.events;
      otherIndex = 0;
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === "lineEndingBlank") {
        otherIndex += 2;
      }
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === "content") {
        while (++otherIndex < subevents.length) {
          if (subevents[otherIndex][1].type === "content") {
            break;
          }
          if (subevents[otherIndex][1].type === "chunkText") {
            subevents[otherIndex][1]._isInFirstContentOfListItem = true;
            otherIndex++;
          }
        }
      }
    }
    if (event[0] === "enter") {
      if (event[1].contentType) {
        Object.assign(jumps, subcontent(events, index2));
        index2 = jumps[index2];
        more = true;
      }
    } else if (event[1]._container) {
      otherIndex = index2;
      lineIndex = void 0;
      while (otherIndex--) {
        otherEvent = events.get(otherIndex);
        if (otherEvent[1].type === "lineEnding" || otherEvent[1].type === "lineEndingBlank") {
          if (otherEvent[0] === "enter") {
            if (lineIndex) {
              events.get(lineIndex)[1].type = "lineEndingBlank";
            }
            otherEvent[1].type = "lineEnding";
            lineIndex = otherIndex;
          }
        } else if (otherEvent[1].type === "linePrefix" || otherEvent[1].type === "listItemIndent") {
        } else {
          break;
        }
      }
      if (lineIndex) {
        event[1].end = {
          ...events.get(lineIndex)[1].start
        };
        parameters = events.slice(lineIndex, index2);
        parameters.unshift(event);
        events.splice(lineIndex, index2 - lineIndex + 1, parameters);
      }
    }
  }
  splice(eventsArray, 0, Number.POSITIVE_INFINITY, events.slice(0));
  return !more;
}
function subcontent(events, eventIndex) {
  const token = events.get(eventIndex)[1];
  const context = events.get(eventIndex)[2];
  let startPosition = eventIndex - 1;
  const startPositions = [];
  let tokenizer = token._tokenizer;
  if (!tokenizer) {
    tokenizer = context.parser[token.contentType](token.start);
    if (token._contentTypeTextTrailing) {
      tokenizer._contentTypeTextTrailing = true;
    }
  }
  const childEvents = tokenizer.events;
  const jumps = [];
  const gaps = {};
  let stream;
  let previous4;
  let index2 = -1;
  let current = token;
  let adjust = 0;
  let start = 0;
  const breaks = [start];
  while (current) {
    while (events.get(++startPosition)[1] !== current) {
    }
    startPositions.push(startPosition);
    if (!current._tokenizer) {
      stream = context.sliceStream(current);
      if (!current.next) {
        stream.push(null);
      }
      if (previous4) {
        tokenizer.defineSkip(current.start);
      }
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = true;
      }
      tokenizer.write(stream);
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = void 0;
      }
    }
    previous4 = current;
    current = current.next;
  }
  current = token;
  while (++index2 < childEvents.length) {
    if (
      // Find a void token that includes a break.
      childEvents[index2][0] === "exit" && childEvents[index2 - 1][0] === "enter" && childEvents[index2][1].type === childEvents[index2 - 1][1].type && childEvents[index2][1].start.line !== childEvents[index2][1].end.line
    ) {
      start = index2 + 1;
      breaks.push(start);
      current._tokenizer = void 0;
      current.previous = void 0;
      current = current.next;
    }
  }
  tokenizer.events = [];
  if (current) {
    current._tokenizer = void 0;
    current.previous = void 0;
  } else {
    breaks.pop();
  }
  index2 = breaks.length;
  while (index2--) {
    const slice = childEvents.slice(breaks[index2], breaks[index2 + 1]);
    const start2 = startPositions.pop();
    jumps.push([start2, start2 + slice.length - 1]);
    events.splice(start2, 2, slice);
  }
  jumps.reverse();
  index2 = -1;
  while (++index2 < jumps.length) {
    gaps[adjust + jumps[index2][0]] = adjust + jumps[index2][1];
    adjust += jumps[index2][1] - jumps[index2][0] - 1;
  }
  return gaps;
}
var init_micromark_util_subtokenize = __esm({
  "node_modules/micromark-util-subtokenize/index.js"() {
    init_micromark_util_chunked();
    init_splice_buffer();
  }
});

// node_modules/micromark-core-commonmark/lib/content.js
function resolveContent(events) {
  subtokenize(events);
  return events;
}
function tokenizeContent(effects, ok3) {
  let previous4;
  return chunkStart;
  function chunkStart(code2) {
    effects.enter("content");
    previous4 = effects.enter("chunkContent", {
      contentType: "content"
    });
    return chunkInside(code2);
  }
  function chunkInside(code2) {
    if (code2 === null) {
      return contentEnd(code2);
    }
    if (markdownLineEnding(code2)) {
      return effects.check(continuationConstruct, contentContinue, contentEnd)(code2);
    }
    effects.consume(code2);
    return chunkInside;
  }
  function contentEnd(code2) {
    effects.exit("chunkContent");
    effects.exit("content");
    return ok3(code2);
  }
  function contentContinue(code2) {
    effects.consume(code2);
    effects.exit("chunkContent");
    previous4.next = effects.enter("chunkContent", {
      contentType: "content",
      previous: previous4
    });
    previous4 = previous4.next;
    return chunkInside;
  }
}
function tokenizeContinuation(effects, ok3, nok) {
  const self = this;
  return startLookahead;
  function startLookahead(code2) {
    effects.exit("chunkContent");
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, prefixed, "linePrefix");
  }
  function prefixed(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return nok(code2);
    }
    const tail = self.events[self.events.length - 1];
    if (!self.parser.constructs.disable.null.includes("codeIndented") && tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4) {
      return ok3(code2);
    }
    return effects.interrupt(self.parser.constructs.flow, nok, ok3)(code2);
  }
}
var content2, continuationConstruct;
var init_content2 = __esm({
  "node_modules/micromark-core-commonmark/lib/content.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    init_micromark_util_subtokenize();
    content2 = {
      resolve: resolveContent,
      tokenize: tokenizeContent
    };
    continuationConstruct = {
      partial: true,
      tokenize: tokenizeContinuation
    };
  }
});

// node_modules/micromark-factory-destination/index.js
function factoryDestination(effects, ok3, nok, type, literalType, literalMarkerType, rawType, stringType, max) {
  const limit = max || Number.POSITIVE_INFINITY;
  let balance = 0;
  return start;
  function start(code2) {
    if (code2 === 60) {
      effects.enter(type);
      effects.enter(literalType);
      effects.enter(literalMarkerType);
      effects.consume(code2);
      effects.exit(literalMarkerType);
      return enclosedBefore;
    }
    if (code2 === null || code2 === 32 || code2 === 41 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.enter(type);
    effects.enter(rawType);
    effects.enter(stringType);
    effects.enter("chunkString", {
      contentType: "string"
    });
    return raw(code2);
  }
  function enclosedBefore(code2) {
    if (code2 === 62) {
      effects.enter(literalMarkerType);
      effects.consume(code2);
      effects.exit(literalMarkerType);
      effects.exit(literalType);
      effects.exit(type);
      return ok3;
    }
    effects.enter(stringType);
    effects.enter("chunkString", {
      contentType: "string"
    });
    return enclosed(code2);
  }
  function enclosed(code2) {
    if (code2 === 62) {
      effects.exit("chunkString");
      effects.exit(stringType);
      return enclosedBefore(code2);
    }
    if (code2 === null || code2 === 60 || markdownLineEnding(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? enclosedEscape : enclosed;
  }
  function enclosedEscape(code2) {
    if (code2 === 60 || code2 === 62 || code2 === 92) {
      effects.consume(code2);
      return enclosed;
    }
    return enclosed(code2);
  }
  function raw(code2) {
    if (!balance && (code2 === null || code2 === 41 || markdownLineEndingOrSpace(code2))) {
      effects.exit("chunkString");
      effects.exit(stringType);
      effects.exit(rawType);
      effects.exit(type);
      return ok3(code2);
    }
    if (balance < limit && code2 === 40) {
      effects.consume(code2);
      balance++;
      return raw;
    }
    if (code2 === 41) {
      effects.consume(code2);
      balance--;
      return raw;
    }
    if (code2 === null || code2 === 32 || code2 === 40 || asciiControl(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? rawEscape : raw;
  }
  function rawEscape(code2) {
    if (code2 === 40 || code2 === 41 || code2 === 92) {
      effects.consume(code2);
      return raw;
    }
    return raw(code2);
  }
}
var init_micromark_factory_destination = __esm({
  "node_modules/micromark-factory-destination/index.js"() {
    init_micromark_util_character();
  }
});

// node_modules/micromark-factory-label/index.js
function factoryLabel(effects, ok3, nok, type, markerType, stringType) {
  const self = this;
  let size = 0;
  let seen;
  return start;
  function start(code2) {
    effects.enter(type);
    effects.enter(markerType);
    effects.consume(code2);
    effects.exit(markerType);
    effects.enter(stringType);
    return atBreak;
  }
  function atBreak(code2) {
    if (size > 999 || code2 === null || code2 === 91 || code2 === 93 && !seen || // To do: remove in the future once we’ve switched from
    // `micromark-extension-footnote` to `micromark-extension-gfm-footnote`,
    // which doesn’t need this.
    // Hidden footnotes hook.
    /* c8 ignore next 3 */
    code2 === 94 && !size && "_hiddenFootnoteSupport" in self.parser.constructs) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit(stringType);
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      effects.exit(type);
      return ok3;
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return atBreak;
    }
    effects.enter("chunkString", {
      contentType: "string"
    });
    return labelInside(code2);
  }
  function labelInside(code2) {
    if (code2 === null || code2 === 91 || code2 === 93 || markdownLineEnding(code2) || size++ > 999) {
      effects.exit("chunkString");
      return atBreak(code2);
    }
    effects.consume(code2);
    if (!seen) seen = !markdownSpace(code2);
    return code2 === 92 ? labelEscape : labelInside;
  }
  function labelEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return labelInside;
    }
    return labelInside(code2);
  }
}
var init_micromark_factory_label = __esm({
  "node_modules/micromark-factory-label/index.js"() {
    init_micromark_util_character();
  }
});

// node_modules/micromark-factory-title/index.js
function factoryTitle(effects, ok3, nok, type, markerType, stringType) {
  let marker;
  return start;
  function start(code2) {
    if (code2 === 34 || code2 === 39 || code2 === 40) {
      effects.enter(type);
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      marker = code2 === 40 ? 41 : code2;
      return begin;
    }
    return nok(code2);
  }
  function begin(code2) {
    if (code2 === marker) {
      effects.enter(markerType);
      effects.consume(code2);
      effects.exit(markerType);
      effects.exit(type);
      return ok3;
    }
    effects.enter(stringType);
    return atBreak(code2);
  }
  function atBreak(code2) {
    if (code2 === marker) {
      effects.exit(stringType);
      return begin(marker);
    }
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      return factorySpace(effects, atBreak, "linePrefix");
    }
    effects.enter("chunkString", {
      contentType: "string"
    });
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker || code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      return atBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? escape : inside;
  }
  function escape(code2) {
    if (code2 === marker || code2 === 92) {
      effects.consume(code2);
      return inside;
    }
    return inside(code2);
  }
}
var init_micromark_factory_title = __esm({
  "node_modules/micromark-factory-title/index.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
  }
});

// node_modules/micromark-factory-whitespace/index.js
function factoryWhitespace(effects, ok3) {
  let seen;
  return start;
  function start(code2) {
    if (markdownLineEnding(code2)) {
      effects.enter("lineEnding");
      effects.consume(code2);
      effects.exit("lineEnding");
      seen = true;
      return start;
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, start, seen ? "linePrefix" : "lineSuffix")(code2);
    }
    return ok3(code2);
  }
}
var init_micromark_factory_whitespace = __esm({
  "node_modules/micromark-factory-whitespace/index.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
  }
});

// node_modules/micromark-core-commonmark/lib/definition.js
function tokenizeDefinition(effects, ok3, nok) {
  const self = this;
  let identifier;
  return start;
  function start(code2) {
    effects.enter("definition");
    return before(code2);
  }
  function before(code2) {
    return factoryLabel.call(
      self,
      effects,
      labelAfter,
      // Note: we don’t need to reset the way `markdown-rs` does.
      nok,
      "definitionLabel",
      "definitionLabelMarker",
      "definitionLabelString"
    )(code2);
  }
  function labelAfter(code2) {
    identifier = normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1));
    if (code2 === 58) {
      effects.enter("definitionMarker");
      effects.consume(code2);
      effects.exit("definitionMarker");
      return markerAfter;
    }
    return nok(code2);
  }
  function markerAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, destinationBefore)(code2) : destinationBefore(code2);
  }
  function destinationBefore(code2) {
    return factoryDestination(
      effects,
      destinationAfter,
      // Note: we don’t need to reset the way `markdown-rs` does.
      nok,
      "definitionDestination",
      "definitionDestinationLiteral",
      "definitionDestinationLiteralMarker",
      "definitionDestinationRaw",
      "definitionDestinationString"
    )(code2);
  }
  function destinationAfter(code2) {
    return effects.attempt(titleBefore, after, after)(code2);
  }
  function after(code2) {
    return markdownSpace(code2) ? factorySpace(effects, afterWhitespace, "whitespace")(code2) : afterWhitespace(code2);
  }
  function afterWhitespace(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("definition");
      self.parser.defined.push(identifier);
      return ok3(code2);
    }
    return nok(code2);
  }
}
function tokenizeTitleBefore(effects, ok3, nok) {
  return titleBefore2;
  function titleBefore2(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, beforeMarker)(code2) : nok(code2);
  }
  function beforeMarker(code2) {
    return factoryTitle(effects, titleAfter, nok, "definitionTitle", "definitionTitleMarker", "definitionTitleString")(code2);
  }
  function titleAfter(code2) {
    return markdownSpace(code2) ? factorySpace(effects, titleAfterOptionalWhitespace, "whitespace")(code2) : titleAfterOptionalWhitespace(code2);
  }
  function titleAfterOptionalWhitespace(code2) {
    return code2 === null || markdownLineEnding(code2) ? ok3(code2) : nok(code2);
  }
}
var definition, titleBefore;
var init_definition = __esm({
  "node_modules/micromark-core-commonmark/lib/definition.js"() {
    init_micromark_factory_destination();
    init_micromark_factory_label();
    init_micromark_factory_space();
    init_micromark_factory_title();
    init_micromark_factory_whitespace();
    init_micromark_util_character();
    init_micromark_util_normalize_identifier();
    definition = {
      name: "definition",
      tokenize: tokenizeDefinition
    };
    titleBefore = {
      partial: true,
      tokenize: tokenizeTitleBefore
    };
  }
});

// node_modules/micromark-core-commonmark/lib/hard-break-escape.js
function tokenizeHardBreakEscape(effects, ok3, nok) {
  return start;
  function start(code2) {
    effects.enter("hardBreakEscape");
    effects.consume(code2);
    return after;
  }
  function after(code2) {
    if (markdownLineEnding(code2)) {
      effects.exit("hardBreakEscape");
      return ok3(code2);
    }
    return nok(code2);
  }
}
var hardBreakEscape;
var init_hard_break_escape = __esm({
  "node_modules/micromark-core-commonmark/lib/hard-break-escape.js"() {
    init_micromark_util_character();
    hardBreakEscape = {
      name: "hardBreakEscape",
      tokenize: tokenizeHardBreakEscape
    };
  }
});

// node_modules/micromark-core-commonmark/lib/heading-atx.js
function resolveHeadingAtx(events, context) {
  let contentEnd = events.length - 2;
  let contentStart = 3;
  if (events[contentStart][1].type === "whitespace") {
    contentStart += 2;
  }
  if (contentEnd - 2 > contentStart && events[contentEnd][1].type === "whitespace") {
    contentEnd -= 2;
  }
  if (events[contentEnd][1].type === "atxHeadingSequence" && (contentStart === contentEnd - 1 || contentEnd - 4 > contentStart && events[contentEnd - 2][1].type === "whitespace")) {
    contentEnd -= contentStart + 1 === contentEnd ? 2 : 4;
  }
  if (contentEnd > contentStart) {
    const content3 = {
      type: "atxHeadingText",
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end
    };
    const text4 = {
      type: "chunkText",
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end,
      contentType: "text"
    };
    splice(events, contentStart, contentEnd - contentStart + 1, [["enter", content3, context], ["enter", text4, context], ["exit", text4, context], ["exit", content3, context]]);
  }
  return events;
}
function tokenizeHeadingAtx(effects, ok3, nok) {
  let size = 0;
  return start;
  function start(code2) {
    effects.enter("atxHeading");
    return before(code2);
  }
  function before(code2) {
    effects.enter("atxHeadingSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === 35 && size++ < 6) {
      effects.consume(code2);
      return sequenceOpen;
    }
    if (code2 === null || markdownLineEndingOrSpace(code2)) {
      effects.exit("atxHeadingSequence");
      return atBreak(code2);
    }
    return nok(code2);
  }
  function atBreak(code2) {
    if (code2 === 35) {
      effects.enter("atxHeadingSequence");
      return sequenceFurther(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("atxHeading");
      return ok3(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, atBreak, "whitespace")(code2);
    }
    effects.enter("atxHeadingText");
    return data(code2);
  }
  function sequenceFurther(code2) {
    if (code2 === 35) {
      effects.consume(code2);
      return sequenceFurther;
    }
    effects.exit("atxHeadingSequence");
    return atBreak(code2);
  }
  function data(code2) {
    if (code2 === null || code2 === 35 || markdownLineEndingOrSpace(code2)) {
      effects.exit("atxHeadingText");
      return atBreak(code2);
    }
    effects.consume(code2);
    return data;
  }
}
var headingAtx;
var init_heading_atx = __esm({
  "node_modules/micromark-core-commonmark/lib/heading-atx.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    init_micromark_util_chunked();
    headingAtx = {
      name: "headingAtx",
      resolve: resolveHeadingAtx,
      tokenize: tokenizeHeadingAtx
    };
  }
});

// node_modules/micromark-util-html-tag-name/index.js
var htmlBlockNames, htmlRawNames;
var init_micromark_util_html_tag_name = __esm({
  "node_modules/micromark-util-html-tag-name/index.js"() {
    htmlBlockNames = [
      "address",
      "article",
      "aside",
      "base",
      "basefont",
      "blockquote",
      "body",
      "caption",
      "center",
      "col",
      "colgroup",
      "dd",
      "details",
      "dialog",
      "dir",
      "div",
      "dl",
      "dt",
      "fieldset",
      "figcaption",
      "figure",
      "footer",
      "form",
      "frame",
      "frameset",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "head",
      "header",
      "hr",
      "html",
      "iframe",
      "legend",
      "li",
      "link",
      "main",
      "menu",
      "menuitem",
      "nav",
      "noframes",
      "ol",
      "optgroup",
      "option",
      "p",
      "param",
      "search",
      "section",
      "summary",
      "table",
      "tbody",
      "td",
      "tfoot",
      "th",
      "thead",
      "title",
      "tr",
      "track",
      "ul"
    ];
    htmlRawNames = ["pre", "script", "style", "textarea"];
  }
});

// node_modules/micromark-core-commonmark/lib/html-flow.js
function resolveToHtmlFlow(events) {
  let index2 = events.length;
  while (index2--) {
    if (events[index2][0] === "enter" && events[index2][1].type === "htmlFlow") {
      break;
    }
  }
  if (index2 > 1 && events[index2 - 2][1].type === "linePrefix") {
    events[index2][1].start = events[index2 - 2][1].start;
    events[index2 + 1][1].start = events[index2 - 2][1].start;
    events.splice(index2 - 2, 2);
  }
  return events;
}
function tokenizeHtmlFlow(effects, ok3, nok) {
  const self = this;
  let marker;
  let closingTag;
  let buffer;
  let index2;
  let markerB;
  return start;
  function start(code2) {
    return before(code2);
  }
  function before(code2) {
    effects.enter("htmlFlow");
    effects.enter("htmlFlowData");
    effects.consume(code2);
    return open;
  }
  function open(code2) {
    if (code2 === 33) {
      effects.consume(code2);
      return declarationOpen;
    }
    if (code2 === 47) {
      effects.consume(code2);
      closingTag = true;
      return tagCloseStart;
    }
    if (code2 === 63) {
      effects.consume(code2);
      marker = 3;
      return self.interrupt ? ok3 : continuationDeclarationInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      buffer = String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function declarationOpen(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      marker = 2;
      return commentOpenInside;
    }
    if (code2 === 91) {
      effects.consume(code2);
      marker = 5;
      index2 = 0;
      return cdataOpenInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      marker = 4;
      return self.interrupt ? ok3 : continuationDeclarationInside;
    }
    return nok(code2);
  }
  function commentOpenInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return self.interrupt ? ok3 : continuationDeclarationInside;
    }
    return nok(code2);
  }
  function cdataOpenInside(code2) {
    const value = "CDATA[";
    if (code2 === value.charCodeAt(index2++)) {
      effects.consume(code2);
      if (index2 === value.length) {
        return self.interrupt ? ok3 : continuation;
      }
      return cdataOpenInside;
    }
    return nok(code2);
  }
  function tagCloseStart(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      buffer = String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function tagName(code2) {
    if (code2 === null || code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      const slash = code2 === 47;
      const name = buffer.toLowerCase();
      if (!slash && !closingTag && htmlRawNames.includes(name)) {
        marker = 1;
        return self.interrupt ? ok3(code2) : continuation(code2);
      }
      if (htmlBlockNames.includes(buffer.toLowerCase())) {
        marker = 6;
        if (slash) {
          effects.consume(code2);
          return basicSelfClosing;
        }
        return self.interrupt ? ok3(code2) : continuation(code2);
      }
      marker = 7;
      return self.interrupt && !self.parser.lazy[self.now().line] ? nok(code2) : closingTag ? completeClosingTagAfter(code2) : completeAttributeNameBefore(code2);
    }
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      buffer += String.fromCharCode(code2);
      return tagName;
    }
    return nok(code2);
  }
  function basicSelfClosing(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return self.interrupt ? ok3 : continuation;
    }
    return nok(code2);
  }
  function completeClosingTagAfter(code2) {
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeClosingTagAfter;
    }
    return completeEnd(code2);
  }
  function completeAttributeNameBefore(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      return completeEnd;
    }
    if (code2 === 58 || code2 === 95 || asciiAlpha(code2)) {
      effects.consume(code2);
      return completeAttributeName;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeNameBefore;
    }
    return completeEnd(code2);
  }
  function completeAttributeName(code2) {
    if (code2 === 45 || code2 === 46 || code2 === 58 || code2 === 95 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return completeAttributeName;
    }
    return completeAttributeNameAfter(code2);
  }
  function completeAttributeNameAfter(code2) {
    if (code2 === 61) {
      effects.consume(code2);
      return completeAttributeValueBefore;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeNameAfter;
    }
    return completeAttributeNameBefore(code2);
  }
  function completeAttributeValueBefore(code2) {
    if (code2 === null || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 34 || code2 === 39) {
      effects.consume(code2);
      markerB = code2;
      return completeAttributeValueQuoted;
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAttributeValueBefore;
    }
    return completeAttributeValueUnquoted(code2);
  }
  function completeAttributeValueQuoted(code2) {
    if (code2 === markerB) {
      effects.consume(code2);
      markerB = null;
      return completeAttributeValueQuotedAfter;
    }
    if (code2 === null || markdownLineEnding(code2)) {
      return nok(code2);
    }
    effects.consume(code2);
    return completeAttributeValueQuoted;
  }
  function completeAttributeValueUnquoted(code2) {
    if (code2 === null || code2 === 34 || code2 === 39 || code2 === 47 || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96 || markdownLineEndingOrSpace(code2)) {
      return completeAttributeNameAfter(code2);
    }
    effects.consume(code2);
    return completeAttributeValueUnquoted;
  }
  function completeAttributeValueQuotedAfter(code2) {
    if (code2 === 47 || code2 === 62 || markdownSpace(code2)) {
      return completeAttributeNameBefore(code2);
    }
    return nok(code2);
  }
  function completeEnd(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return completeAfter;
    }
    return nok(code2);
  }
  function completeAfter(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return continuation(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return completeAfter;
    }
    return nok(code2);
  }
  function continuation(code2) {
    if (code2 === 45 && marker === 2) {
      effects.consume(code2);
      return continuationCommentInside;
    }
    if (code2 === 60 && marker === 1) {
      effects.consume(code2);
      return continuationRawTagOpen;
    }
    if (code2 === 62 && marker === 4) {
      effects.consume(code2);
      return continuationClose;
    }
    if (code2 === 63 && marker === 3) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    if (code2 === 93 && marker === 5) {
      effects.consume(code2);
      return continuationCdataInside;
    }
    if (markdownLineEnding(code2) && (marker === 6 || marker === 7)) {
      effects.exit("htmlFlowData");
      return effects.check(blankLineBefore, continuationAfter, continuationStart)(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("htmlFlowData");
      return continuationStart(code2);
    }
    effects.consume(code2);
    return continuation;
  }
  function continuationStart(code2) {
    return effects.check(nonLazyContinuation, continuationStartNonLazy, continuationAfter)(code2);
  }
  function continuationStartNonLazy(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return continuationBefore;
  }
  function continuationBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return continuationStart(code2);
    }
    effects.enter("htmlFlowData");
    return continuation(code2);
  }
  function continuationCommentInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationRawTagOpen(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      buffer = "";
      return continuationRawEndTag;
    }
    return continuation(code2);
  }
  function continuationRawEndTag(code2) {
    if (code2 === 62) {
      const name = buffer.toLowerCase();
      if (htmlRawNames.includes(name)) {
        effects.consume(code2);
        return continuationClose;
      }
      return continuation(code2);
    }
    if (asciiAlpha(code2) && buffer.length < 8) {
      effects.consume(code2);
      buffer += String.fromCharCode(code2);
      return continuationRawEndTag;
    }
    return continuation(code2);
  }
  function continuationCdataInside(code2) {
    if (code2 === 93) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationDeclarationInside(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      return continuationClose;
    }
    if (code2 === 45 && marker === 2) {
      effects.consume(code2);
      return continuationDeclarationInside;
    }
    return continuation(code2);
  }
  function continuationClose(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("htmlFlowData");
      return continuationAfter(code2);
    }
    effects.consume(code2);
    return continuationClose;
  }
  function continuationAfter(code2) {
    effects.exit("htmlFlow");
    return ok3(code2);
  }
}
function tokenizeBlankLineBefore(effects, ok3, nok) {
  return start;
  function start(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return effects.attempt(blankLine, ok3, nok);
  }
}
var htmlFlow, blankLineBefore;
var init_html_flow = __esm({
  "node_modules/micromark-core-commonmark/lib/html-flow.js"() {
    init_micromark_util_character();
    init_micromark_util_html_tag_name();
    init_blank_line();
    init_partial_non_lazy_continuation();
    htmlFlow = {
      concrete: true,
      name: "htmlFlow",
      resolveTo: resolveToHtmlFlow,
      tokenize: tokenizeHtmlFlow
    };
    blankLineBefore = {
      partial: true,
      tokenize: tokenizeBlankLineBefore
    };
  }
});

// node_modules/micromark-core-commonmark/lib/html-text.js
function tokenizeHtmlText(effects, ok3, nok) {
  const self = this;
  let marker;
  let index2;
  let returnState;
  return start;
  function start(code2) {
    effects.enter("htmlText");
    effects.enter("htmlTextData");
    effects.consume(code2);
    return open;
  }
  function open(code2) {
    if (code2 === 33) {
      effects.consume(code2);
      return declarationOpen;
    }
    if (code2 === 47) {
      effects.consume(code2);
      return tagCloseStart;
    }
    if (code2 === 63) {
      effects.consume(code2);
      return instruction;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return tagOpen;
    }
    return nok(code2);
  }
  function declarationOpen(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentOpenInside;
    }
    if (code2 === 91) {
      effects.consume(code2);
      index2 = 0;
      return cdataOpenInside;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return declaration;
    }
    return nok(code2);
  }
  function commentOpenInside(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentEnd;
    }
    return nok(code2);
  }
  function comment(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 45) {
      effects.consume(code2);
      return commentClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = comment;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return comment;
  }
  function commentClose(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return commentEnd;
    }
    return comment(code2);
  }
  function commentEnd(code2) {
    return code2 === 62 ? end(code2) : code2 === 45 ? commentClose(code2) : comment(code2);
  }
  function cdataOpenInside(code2) {
    const value = "CDATA[";
    if (code2 === value.charCodeAt(index2++)) {
      effects.consume(code2);
      return index2 === value.length ? cdata : cdataOpenInside;
    }
    return nok(code2);
  }
  function cdata(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.consume(code2);
      return cdataClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = cdata;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return cdata;
  }
  function cdataClose(code2) {
    if (code2 === 93) {
      effects.consume(code2);
      return cdataEnd;
    }
    return cdata(code2);
  }
  function cdataEnd(code2) {
    if (code2 === 62) {
      return end(code2);
    }
    if (code2 === 93) {
      effects.consume(code2);
      return cdataEnd;
    }
    return cdata(code2);
  }
  function declaration(code2) {
    if (code2 === null || code2 === 62) {
      return end(code2);
    }
    if (markdownLineEnding(code2)) {
      returnState = declaration;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return declaration;
  }
  function instruction(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (code2 === 63) {
      effects.consume(code2);
      return instructionClose;
    }
    if (markdownLineEnding(code2)) {
      returnState = instruction;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return instruction;
  }
  function instructionClose(code2) {
    return code2 === 62 ? end(code2) : instruction(code2);
  }
  function tagCloseStart(code2) {
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return tagClose;
    }
    return nok(code2);
  }
  function tagClose(code2) {
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagClose;
    }
    return tagCloseBetween(code2);
  }
  function tagCloseBetween(code2) {
    if (markdownLineEnding(code2)) {
      returnState = tagCloseBetween;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagCloseBetween;
    }
    return end(code2);
  }
  function tagOpen(code2) {
    if (code2 === 45 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagOpen;
    }
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    return nok(code2);
  }
  function tagOpenBetween(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      return end;
    }
    if (code2 === 58 || code2 === 95 || asciiAlpha(code2)) {
      effects.consume(code2);
      return tagOpenAttributeName;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenBetween;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenBetween;
    }
    return end(code2);
  }
  function tagOpenAttributeName(code2) {
    if (code2 === 45 || code2 === 46 || code2 === 58 || code2 === 95 || asciiAlphanumeric(code2)) {
      effects.consume(code2);
      return tagOpenAttributeName;
    }
    return tagOpenAttributeNameAfter(code2);
  }
  function tagOpenAttributeNameAfter(code2) {
    if (code2 === 61) {
      effects.consume(code2);
      return tagOpenAttributeValueBefore;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeNameAfter;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenAttributeNameAfter;
    }
    return tagOpenBetween(code2);
  }
  function tagOpenAttributeValueBefore(code2) {
    if (code2 === null || code2 === 60 || code2 === 61 || code2 === 62 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 34 || code2 === 39) {
      effects.consume(code2);
      marker = code2;
      return tagOpenAttributeValueQuoted;
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeValueBefore;
      return lineEndingBefore(code2);
    }
    if (markdownSpace(code2)) {
      effects.consume(code2);
      return tagOpenAttributeValueBefore;
    }
    effects.consume(code2);
    return tagOpenAttributeValueUnquoted;
  }
  function tagOpenAttributeValueQuoted(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      marker = void 0;
      return tagOpenAttributeValueQuotedAfter;
    }
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      returnState = tagOpenAttributeValueQuoted;
      return lineEndingBefore(code2);
    }
    effects.consume(code2);
    return tagOpenAttributeValueQuoted;
  }
  function tagOpenAttributeValueUnquoted(code2) {
    if (code2 === null || code2 === 34 || code2 === 39 || code2 === 60 || code2 === 61 || code2 === 96) {
      return nok(code2);
    }
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    effects.consume(code2);
    return tagOpenAttributeValueUnquoted;
  }
  function tagOpenAttributeValueQuotedAfter(code2) {
    if (code2 === 47 || code2 === 62 || markdownLineEndingOrSpace(code2)) {
      return tagOpenBetween(code2);
    }
    return nok(code2);
  }
  function end(code2) {
    if (code2 === 62) {
      effects.consume(code2);
      effects.exit("htmlTextData");
      effects.exit("htmlText");
      return ok3;
    }
    return nok(code2);
  }
  function lineEndingBefore(code2) {
    effects.exit("htmlTextData");
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return lineEndingAfter;
  }
  function lineEndingAfter(code2) {
    return markdownSpace(code2) ? factorySpace(effects, lineEndingAfterPrefix, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2) : lineEndingAfterPrefix(code2);
  }
  function lineEndingAfterPrefix(code2) {
    effects.enter("htmlTextData");
    return returnState(code2);
  }
}
var htmlText;
var init_html_text = __esm({
  "node_modules/micromark-core-commonmark/lib/html-text.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    htmlText = {
      name: "htmlText",
      tokenize: tokenizeHtmlText
    };
  }
});

// node_modules/micromark-core-commonmark/lib/label-end.js
function resolveAllLabelEnd(events) {
  let index2 = -1;
  const newEvents = [];
  while (++index2 < events.length) {
    const token = events[index2][1];
    newEvents.push(events[index2]);
    if (token.type === "labelImage" || token.type === "labelLink" || token.type === "labelEnd") {
      const offset = token.type === "labelImage" ? 4 : 2;
      token.type = "data";
      index2 += offset;
    }
  }
  if (events.length !== newEvents.length) {
    splice(events, 0, events.length, newEvents);
  }
  return events;
}
function resolveToLabelEnd(events, context) {
  let index2 = events.length;
  let offset = 0;
  let open;
  let close;
  let media;
  while (index2--) {
    const token = events[index2][1];
    if (open) {
      if (token.type === "link" || token.type === "labelLink" && token._inactive) {
        break;
      }
      if (events[index2][0] === "enter" && token.type === "labelLink") {
        token._inactive = true;
      }
    } else if (close) {
      if (events[index2][0] === "enter" && (token.type === "labelImage" || token.type === "labelLink") && !token._balanced) {
        open = index2;
        if (token.type !== "labelLink") {
          offset = 2;
          break;
        }
      }
    } else if (token.type === "labelEnd") {
      close = index2;
    }
  }
  const group = {
    type: events[open][1].type === "labelLink" ? "link" : "image",
    start: {
      ...events[open][1].start
    },
    end: {
      ...events[events.length - 1][1].end
    }
  };
  const label = {
    type: "label",
    start: {
      ...events[open][1].start
    },
    end: {
      ...events[close][1].end
    }
  };
  const text4 = {
    type: "labelText",
    start: {
      ...events[open + offset + 2][1].end
    },
    end: {
      ...events[close - 2][1].start
    }
  };
  media = [["enter", group, context], ["enter", label, context]];
  media = push(media, events.slice(open + 1, open + offset + 3));
  media = push(media, [["enter", text4, context]]);
  media = push(media, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + offset + 4, close - 3), context));
  media = push(media, [["exit", text4, context], events[close - 2], events[close - 1], ["exit", label, context]]);
  media = push(media, events.slice(close + 1));
  media = push(media, [["exit", group, context]]);
  splice(events, open, events.length, media);
  return events;
}
function tokenizeLabelEnd(effects, ok3, nok) {
  const self = this;
  const labelStarts = self._labelStarts;
  let labelStart;
  let defined;
  if (labelStarts) {
    while (labelStarts.length > 0 && labelStarts[labelStarts.length - 1]._balanced) {
      labelStarts.pop();
    }
    labelStart = labelStarts[labelStarts.length - 1];
  }
  return start;
  function start(code2) {
    if (!labelStart) {
      return nok(code2);
    }
    if (labelStart._inactive) {
      return labelEndNok(code2);
    }
    defined = self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize({
      start: labelStart.end,
      end: self.now()
    })));
    effects.enter("labelEnd");
    effects.enter("labelMarker");
    effects.consume(code2);
    effects.exit("labelMarker");
    effects.exit("labelEnd");
    return after;
  }
  function after(code2) {
    if (code2 === 40) {
      return effects.attempt(resourceConstruct, labelEndOk, defined ? labelEndOk : labelEndNok)(code2);
    }
    if (code2 === 91) {
      return effects.attempt(referenceFullConstruct, labelEndOk, defined ? referenceNotFull : labelEndNok)(code2);
    }
    return defined ? labelEndOk(code2) : labelEndNok(code2);
  }
  function referenceNotFull(code2) {
    return effects.attempt(referenceCollapsedConstruct, labelEndOk, labelEndNok)(code2);
  }
  function labelEndOk(code2) {
    labelStarts.pop();
    return ok3(code2);
  }
  function labelEndNok(code2) {
    labelStart._balanced = true;
    return nok(code2);
  }
}
function tokenizeResource(effects, ok3, nok) {
  return resourceStart;
  function resourceStart(code2) {
    effects.enter("resource");
    effects.enter("resourceMarker");
    effects.consume(code2);
    effects.exit("resourceMarker");
    return resourceBefore;
  }
  function resourceBefore(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceOpen)(code2) : resourceOpen(code2);
  }
  function resourceOpen(code2) {
    if (code2 === 41) {
      return resourceEnd(code2);
    }
    return factoryDestination(effects, resourceDestinationAfter, resourceDestinationMissing, "resourceDestination", "resourceDestinationLiteral", "resourceDestinationLiteralMarker", "resourceDestinationRaw", "resourceDestinationString", 32)(code2);
  }
  function resourceDestinationAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceBetween)(code2) : resourceEnd(code2);
  }
  function resourceDestinationMissing(code2) {
    return nok(code2);
  }
  function resourceBetween(code2) {
    if (code2 === 34 || code2 === 39 || code2 === 40) {
      return factoryTitle(effects, resourceTitleAfter, nok, "resourceTitle", "resourceTitleMarker", "resourceTitleString")(code2);
    }
    return resourceEnd(code2);
  }
  function resourceTitleAfter(code2) {
    return markdownLineEndingOrSpace(code2) ? factoryWhitespace(effects, resourceEnd)(code2) : resourceEnd(code2);
  }
  function resourceEnd(code2) {
    if (code2 === 41) {
      effects.enter("resourceMarker");
      effects.consume(code2);
      effects.exit("resourceMarker");
      effects.exit("resource");
      return ok3;
    }
    return nok(code2);
  }
}
function tokenizeReferenceFull(effects, ok3, nok) {
  const self = this;
  return referenceFull;
  function referenceFull(code2) {
    return factoryLabel.call(self, effects, referenceFullAfter, referenceFullMissing, "reference", "referenceMarker", "referenceString")(code2);
  }
  function referenceFullAfter(code2) {
    return self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1))) ? ok3(code2) : nok(code2);
  }
  function referenceFullMissing(code2) {
    return nok(code2);
  }
}
function tokenizeReferenceCollapsed(effects, ok3, nok) {
  return referenceCollapsedStart;
  function referenceCollapsedStart(code2) {
    effects.enter("reference");
    effects.enter("referenceMarker");
    effects.consume(code2);
    effects.exit("referenceMarker");
    return referenceCollapsedOpen;
  }
  function referenceCollapsedOpen(code2) {
    if (code2 === 93) {
      effects.enter("referenceMarker");
      effects.consume(code2);
      effects.exit("referenceMarker");
      effects.exit("reference");
      return ok3;
    }
    return nok(code2);
  }
}
var labelEnd, resourceConstruct, referenceFullConstruct, referenceCollapsedConstruct;
var init_label_end = __esm({
  "node_modules/micromark-core-commonmark/lib/label-end.js"() {
    init_micromark_factory_destination();
    init_micromark_factory_label();
    init_micromark_factory_title();
    init_micromark_factory_whitespace();
    init_micromark_util_character();
    init_micromark_util_chunked();
    init_micromark_util_normalize_identifier();
    init_micromark_util_resolve_all();
    labelEnd = {
      name: "labelEnd",
      resolveAll: resolveAllLabelEnd,
      resolveTo: resolveToLabelEnd,
      tokenize: tokenizeLabelEnd
    };
    resourceConstruct = {
      tokenize: tokenizeResource
    };
    referenceFullConstruct = {
      tokenize: tokenizeReferenceFull
    };
    referenceCollapsedConstruct = {
      tokenize: tokenizeReferenceCollapsed
    };
  }
});

// node_modules/micromark-core-commonmark/lib/label-start-image.js
function tokenizeLabelStartImage(effects, ok3, nok) {
  const self = this;
  let labelImage;
  return start;
  function start(code2) {
    effects.enter("labelImage");
    effects.enter("labelImageMarker");
    effects.consume(code2);
    effects.exit("labelImageMarker");
    return open;
  }
  function open(code2) {
    if (code2 === 91) {
      effects.enter("labelMarker");
      effects.consume(code2);
      effects.exit("labelMarker");
      labelImage = effects.exit("labelImage");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    if (code2 === 94 && "_hiddenFootnoteSupport" in self.parser.constructs) {
      return nok(code2);
    }
    self._labelStarts = self._labelStarts || [];
    self._labelStarts.push(labelImage);
    return ok3(code2);
  }
}
var labelStartImage;
var init_label_start_image = __esm({
  "node_modules/micromark-core-commonmark/lib/label-start-image.js"() {
    init_label_end();
    labelStartImage = {
      name: "labelStartImage",
      resolveAll: labelEnd.resolveAll,
      tokenize: tokenizeLabelStartImage
    };
  }
});

// node_modules/micromark-core-commonmark/lib/label-start-link.js
function tokenizeLabelStartLink(effects, ok3, nok) {
  const self = this;
  let labelLink;
  return start;
  function start(code2) {
    effects.enter("labelLink");
    effects.enter("labelMarker");
    effects.consume(code2);
    effects.exit("labelMarker");
    labelLink = effects.exit("labelLink");
    return after;
  }
  function after(code2) {
    if (code2 === 94 && "_hiddenFootnoteSupport" in self.parser.constructs) {
      return nok(code2);
    }
    self._labelStarts = self._labelStarts || [];
    self._labelStarts.push(labelLink);
    return ok3(code2);
  }
}
var labelStartLink;
var init_label_start_link = __esm({
  "node_modules/micromark-core-commonmark/lib/label-start-link.js"() {
    init_label_end();
    labelStartLink = {
      name: "labelStartLink",
      resolveAll: labelEnd.resolveAll,
      tokenize: tokenizeLabelStartLink
    };
  }
});

// node_modules/micromark-core-commonmark/lib/line-ending.js
function tokenizeLineEnding(effects, ok3) {
  return start;
  function start(code2) {
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return factorySpace(effects, ok3, "linePrefix");
  }
}
var lineEnding;
var init_line_ending = __esm({
  "node_modules/micromark-core-commonmark/lib/line-ending.js"() {
    init_micromark_factory_space();
    lineEnding = {
      name: "lineEnding",
      tokenize: tokenizeLineEnding
    };
  }
});

// node_modules/micromark-core-commonmark/lib/thematic-break.js
function tokenizeThematicBreak(effects, ok3, nok) {
  let size = 0;
  let marker;
  return start;
  function start(code2) {
    effects.enter("thematicBreak");
    return before(code2);
  }
  function before(code2) {
    marker = code2;
    return atBreak(code2);
  }
  function atBreak(code2) {
    if (code2 === marker) {
      effects.enter("thematicBreakSequence");
      return sequence(code2);
    }
    if (size >= 3 && (code2 === null || markdownLineEnding(code2))) {
      effects.exit("thematicBreak");
      return ok3(code2);
    }
    return nok(code2);
  }
  function sequence(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      size++;
      return sequence;
    }
    effects.exit("thematicBreakSequence");
    return markdownSpace(code2) ? factorySpace(effects, atBreak, "whitespace")(code2) : atBreak(code2);
  }
}
var thematicBreak;
var init_thematic_break = __esm({
  "node_modules/micromark-core-commonmark/lib/thematic-break.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    thematicBreak = {
      name: "thematicBreak",
      tokenize: tokenizeThematicBreak
    };
  }
});

// node_modules/micromark-core-commonmark/lib/list.js
function tokenizeListStart(effects, ok3, nok) {
  const self = this;
  const tail = self.events[self.events.length - 1];
  let initialSize = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
  let size = 0;
  return start;
  function start(code2) {
    const kind = self.containerState.type || (code2 === 42 || code2 === 43 || code2 === 45 ? "listUnordered" : "listOrdered");
    if (kind === "listUnordered" ? !self.containerState.marker || code2 === self.containerState.marker : asciiDigit(code2)) {
      if (!self.containerState.type) {
        self.containerState.type = kind;
        effects.enter(kind, {
          _container: true
        });
      }
      if (kind === "listUnordered") {
        effects.enter("listItemPrefix");
        return code2 === 42 || code2 === 45 ? effects.check(thematicBreak, nok, atMarker)(code2) : atMarker(code2);
      }
      if (!self.interrupt || code2 === 49) {
        effects.enter("listItemPrefix");
        effects.enter("listItemValue");
        return inside(code2);
      }
    }
    return nok(code2);
  }
  function inside(code2) {
    if (asciiDigit(code2) && ++size < 10) {
      effects.consume(code2);
      return inside;
    }
    if ((!self.interrupt || size < 2) && (self.containerState.marker ? code2 === self.containerState.marker : code2 === 41 || code2 === 46)) {
      effects.exit("listItemValue");
      return atMarker(code2);
    }
    return nok(code2);
  }
  function atMarker(code2) {
    effects.enter("listItemMarker");
    effects.consume(code2);
    effects.exit("listItemMarker");
    self.containerState.marker = self.containerState.marker || code2;
    return effects.check(
      blankLine,
      // Can’t be empty when interrupting.
      self.interrupt ? nok : onBlank,
      effects.attempt(listItemPrefixWhitespaceConstruct, endOfPrefix, otherPrefix)
    );
  }
  function onBlank(code2) {
    self.containerState.initialBlankLine = true;
    initialSize++;
    return endOfPrefix(code2);
  }
  function otherPrefix(code2) {
    if (markdownSpace(code2)) {
      effects.enter("listItemPrefixWhitespace");
      effects.consume(code2);
      effects.exit("listItemPrefixWhitespace");
      return endOfPrefix;
    }
    return nok(code2);
  }
  function endOfPrefix(code2) {
    self.containerState.size = initialSize + self.sliceSerialize(effects.exit("listItemPrefix"), true).length;
    return ok3(code2);
  }
}
function tokenizeListContinuation(effects, ok3, nok) {
  const self = this;
  self.containerState._closeFlow = void 0;
  return effects.check(blankLine, onBlank, notBlank);
  function onBlank(code2) {
    self.containerState.furtherBlankLines = self.containerState.furtherBlankLines || self.containerState.initialBlankLine;
    return factorySpace(effects, ok3, "listItemIndent", self.containerState.size + 1)(code2);
  }
  function notBlank(code2) {
    if (self.containerState.furtherBlankLines || !markdownSpace(code2)) {
      self.containerState.furtherBlankLines = void 0;
      self.containerState.initialBlankLine = void 0;
      return notInCurrentItem(code2);
    }
    self.containerState.furtherBlankLines = void 0;
    self.containerState.initialBlankLine = void 0;
    return effects.attempt(indentConstruct, ok3, notInCurrentItem)(code2);
  }
  function notInCurrentItem(code2) {
    self.containerState._closeFlow = true;
    self.interrupt = void 0;
    return factorySpace(effects, effects.attempt(list, ok3, nok), "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
  }
}
function tokenizeIndent(effects, ok3, nok) {
  const self = this;
  return factorySpace(effects, afterPrefix, "listItemIndent", self.containerState.size + 1);
  function afterPrefix(code2) {
    const tail = self.events[self.events.length - 1];
    return tail && tail[1].type === "listItemIndent" && tail[2].sliceSerialize(tail[1], true).length === self.containerState.size ? ok3(code2) : nok(code2);
  }
}
function tokenizeListEnd(effects) {
  effects.exit(this.containerState.type);
}
function tokenizeListItemPrefixWhitespace(effects, ok3, nok) {
  const self = this;
  return factorySpace(effects, afterPrefix, "listItemPrefixWhitespace", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4 + 1);
  function afterPrefix(code2) {
    const tail = self.events[self.events.length - 1];
    return !markdownSpace(code2) && tail && tail[1].type === "listItemPrefixWhitespace" ? ok3(code2) : nok(code2);
  }
}
var list, listItemPrefixWhitespaceConstruct, indentConstruct;
var init_list = __esm({
  "node_modules/micromark-core-commonmark/lib/list.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    init_blank_line();
    init_thematic_break();
    list = {
      continuation: {
        tokenize: tokenizeListContinuation
      },
      exit: tokenizeListEnd,
      name: "list",
      tokenize: tokenizeListStart
    };
    listItemPrefixWhitespaceConstruct = {
      partial: true,
      tokenize: tokenizeListItemPrefixWhitespace
    };
    indentConstruct = {
      partial: true,
      tokenize: tokenizeIndent
    };
  }
});

// node_modules/micromark-core-commonmark/lib/setext-underline.js
function resolveToSetextUnderline(events, context) {
  const editMap = new EditMap();
  let index2 = events.length;
  let content3;
  let text4;
  let definition2;
  while (index2--) {
    if (events[index2][0] === "enter") {
      if (events[index2][1].type === "content") {
        content3 = index2;
        break;
      }
      if (events[index2][1].type === "paragraph") {
        text4 = index2;
      }
    } else {
      if (events[index2][1].type === "content") {
        editMap.add(index2, 1, []);
      }
      if (!definition2 && events[index2][1].type === "definition") {
        definition2 = index2;
      }
    }
  }
  const heading = {
    type: "setextHeading",
    start: {
      ...events[content3][1].start
    },
    end: {
      ...events[events.length - 1][1].end
    }
  };
  events[text4][1].type = "setextHeadingText";
  if (definition2) {
    editMap.add(text4, 0, [["enter", heading, context]]);
    editMap.add(definition2 + 1, 0, [["exit", events[content3][1], context]]);
    events[content3][1].end = {
      ...events[definition2][1].end
    };
  } else {
    events[content3][1] = heading;
  }
  editMap.add(events.length, 0, [["exit", heading, context]]);
  editMap.consume(events);
  return events;
}
function tokenizeSetextUnderline(effects, ok3, nok) {
  const self = this;
  let marker;
  return start;
  function start(code2) {
    let index2 = self.events.length;
    let paragraph;
    while (index2--) {
      if (self.events[index2][1].type !== "lineEnding" && self.events[index2][1].type !== "linePrefix" && self.events[index2][1].type !== "content") {
        paragraph = self.events[index2][1].type === "paragraph";
        break;
      }
    }
    if (!self.parser.lazy[self.now().line] && (self.interrupt || paragraph)) {
      effects.enter("setextHeadingLine");
      marker = code2;
      return before(code2);
    }
    return nok(code2);
  }
  function before(code2) {
    effects.enter("setextHeadingLineSequence");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      return inside;
    }
    effects.exit("setextHeadingLineSequence");
    return markdownSpace(code2) ? factorySpace(effects, after, "lineSuffix")(code2) : after(code2);
  }
  function after(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("setextHeadingLine");
      return ok3(code2);
    }
    return nok(code2);
  }
}
var setextUnderline;
var init_setext_underline = __esm({
  "node_modules/micromark-core-commonmark/lib/setext-underline.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    init_micromark_util_edit_map();
    setextUnderline = {
      name: "setextUnderline",
      resolveTo: resolveToSetextUnderline,
      tokenize: tokenizeSetextUnderline
    };
  }
});

// node_modules/micromark-core-commonmark/index.js
var init_micromark_core_commonmark = __esm({
  "node_modules/micromark-core-commonmark/index.js"() {
    init_attention();
    init_autolink();
    init_blank_line();
    init_block_quote();
    init_character_escape();
    init_character_reference();
    init_code_fenced();
    init_code_indented();
    init_code_text();
    init_content2();
    init_definition();
    init_hard_break_escape();
    init_heading_atx();
    init_html_flow();
    init_html_text();
    init_label_end();
    init_label_start_image();
    init_label_start_link();
    init_line_ending();
    init_list();
    init_setext_underline();
    init_thematic_break();
  }
});

// node_modules/micromark/lib/initialize/flow.js
function initializeFlow(effects) {
  const self = this;
  const initial = effects.attempt(
    // Try to parse a blank line.
    blankLine,
    atBlankEnding,
    // Try to parse initial flow (essentially, only code).
    effects.attempt(this.parser.constructs.flowInitial, afterConstruct, factorySpace(effects, effects.attempt(this.parser.constructs.flow, afterConstruct, effects.attempt(content2, afterConstruct)), "linePrefix"))
  );
  return initial;
  function atBlankEnding(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEndingBlank");
    effects.consume(code2);
    effects.exit("lineEndingBlank");
    self.currentConstruct = void 0;
    return initial;
  }
  function afterConstruct(code2) {
    if (code2 === null) {
      effects.consume(code2);
      return;
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    self.currentConstruct = void 0;
    return initial;
  }
}
var flow;
var init_flow = __esm({
  "node_modules/micromark/lib/initialize/flow.js"() {
    init_micromark_core_commonmark();
    init_micromark_factory_space();
    flow = {
      tokenize: initializeFlow
    };
  }
});

// node_modules/micromark/lib/initialize/text.js
function initializeFactory(field) {
  return {
    resolveAll: createResolver(field === "text" ? resolveAllLineSuffixes : void 0),
    tokenize: initializeText
  };
  function initializeText(effects) {
    const self = this;
    const constructs2 = this.parser.constructs[field];
    const text4 = effects.attempt(constructs2, start, notText);
    return start;
    function start(code2) {
      return atBreak(code2) ? text4(code2) : notText(code2);
    }
    function notText(code2) {
      if (code2 === null) {
        effects.consume(code2);
        return;
      }
      effects.enter("data");
      effects.consume(code2);
      return data;
    }
    function data(code2) {
      if (atBreak(code2)) {
        effects.exit("data");
        return text4(code2);
      }
      effects.consume(code2);
      return data;
    }
    function atBreak(code2) {
      if (code2 === null) {
        return true;
      }
      const list2 = constructs2[code2];
      let index2 = -1;
      if (list2) {
        while (++index2 < list2.length) {
          const item = list2[index2];
          if (!item.previous || item.previous.call(self, self.previous)) {
            return true;
          }
        }
      }
      return false;
    }
  }
}
function createResolver(extraResolver) {
  return resolveAllText;
  function resolveAllText(events, context) {
    let index2 = -1;
    let enter;
    while (++index2 <= events.length) {
      if (enter === void 0) {
        if (events[index2] && events[index2][1].type === "data") {
          enter = index2;
          index2++;
        }
      } else if (!events[index2] || events[index2][1].type !== "data") {
        if (index2 !== enter + 2) {
          events[enter][1].end = events[index2 - 1][1].end;
          events.splice(enter + 2, index2 - enter - 2);
          index2 = enter + 2;
        }
        enter = void 0;
      }
    }
    return extraResolver ? extraResolver(events, context) : events;
  }
}
function resolveAllLineSuffixes(events, context) {
  const editMap = new EditMap();
  let eventIndex = 0;
  while (++eventIndex <= events.length) {
    if ((eventIndex === events.length || events[eventIndex][1].type === "lineEnding") && events[eventIndex - 1][1].type === "data") {
      const data = events[eventIndex - 1][1];
      const chunks = context.sliceStream(data);
      let index2 = chunks.length;
      let bufferIndex = -1;
      let size = 0;
      let tabs;
      while (index2--) {
        const chunk = chunks[index2];
        if (typeof chunk === "string") {
          bufferIndex = chunk.length;
          while (chunk.charCodeAt(bufferIndex - 1) === 32) {
            size++;
            bufferIndex--;
          }
          if (bufferIndex) {
            break;
          }
          bufferIndex = -1;
        } else if (chunk === -2) {
          tabs = true;
          size++;
        } else if (chunk === -1) {
        } else {
          index2++;
          break;
        }
      }
      if (context._contentTypeTextTrailing && eventIndex === events.length) {
        size = 0;
      }
      if (size) {
        const token = {
          type: eventIndex === events.length || tabs || size < 2 ? "lineSuffix" : "hardBreakTrailing",
          start: {
            _bufferIndex: index2 ? bufferIndex : data.start._bufferIndex + bufferIndex,
            _index: data.start._index + index2,
            line: data.end.line,
            column: data.end.column - size,
            offset: data.end.offset - size
          },
          end: {
            ...data.end
          }
        };
        data.end = {
          ...token.start
        };
        if (data.start.offset === data.end.offset) {
          Object.assign(data, token);
        } else {
          editMap.add(eventIndex, 0, [["enter", token, context], ["exit", token, context]]);
        }
      }
      eventIndex++;
    }
  }
  editMap.consume(events);
  return events;
}
var resolver, string, text;
var init_text = __esm({
  "node_modules/micromark/lib/initialize/text.js"() {
    init_micromark_util_edit_map();
    resolver = {
      resolveAll: createResolver()
    };
    string = initializeFactory("string");
    text = initializeFactory("text");
  }
});

// node_modules/micromark/lib/constructs.js
var constructs_exports = {};
__export(constructs_exports, {
  attentionMarkers: () => attentionMarkers,
  contentInitial: () => contentInitial,
  disable: () => disable,
  document: () => document3,
  flow: () => flow2,
  flowInitial: () => flowInitial,
  insideSpan: () => insideSpan,
  string: () => string2,
  text: () => text2
});
var document3, contentInitial, flowInitial, flow2, string2, text2, insideSpan, attentionMarkers, disable;
var init_constructs = __esm({
  "node_modules/micromark/lib/constructs.js"() {
    init_micromark_core_commonmark();
    init_text();
    document3 = {
      [42]: list,
      [43]: list,
      [45]: list,
      [48]: list,
      [49]: list,
      [50]: list,
      [51]: list,
      [52]: list,
      [53]: list,
      [54]: list,
      [55]: list,
      [56]: list,
      [57]: list,
      [62]: blockQuote
    };
    contentInitial = {
      [91]: definition
    };
    flowInitial = {
      [-2]: codeIndented,
      [-1]: codeIndented,
      [32]: codeIndented
    };
    flow2 = {
      [35]: headingAtx,
      [42]: thematicBreak,
      [45]: [setextUnderline, thematicBreak],
      [60]: htmlFlow,
      [61]: setextUnderline,
      [95]: thematicBreak,
      [96]: codeFenced,
      [126]: codeFenced
    };
    string2 = {
      [38]: characterReference,
      [92]: characterEscape
    };
    text2 = {
      [-5]: lineEnding,
      [-4]: lineEnding,
      [-3]: lineEnding,
      [33]: labelStartImage,
      [38]: characterReference,
      [42]: attention,
      [60]: [autolink, htmlText],
      [91]: labelStartLink,
      [92]: [hardBreakEscape, characterEscape],
      [93]: labelEnd,
      [95]: attention,
      [96]: codeText
    };
    insideSpan = {
      null: [attention, resolver]
    };
    attentionMarkers = {
      null: [42, 95]
    };
    disable = {
      null: []
    };
  }
});

// node_modules/micromark/lib/create-tokenizer.js
function createTokenizer(parser2, initialize, from) {
  let point3 = {
    _bufferIndex: -1,
    _index: 0,
    line: from && from.line || 1,
    column: from && from.column || 1,
    offset: from && from.offset || 0
  };
  const columnStart = {};
  const resolveAllConstructs = [];
  let chunks = [];
  let stack = [];
  let consumed = true;
  const effects = {
    attempt: constructFactory(onsuccessfulconstruct),
    check: constructFactory(onsuccessfulcheck),
    consume,
    enter,
    exit: exit3,
    interrupt: constructFactory(onsuccessfulcheck, {
      interrupt: true
    })
  };
  const context = {
    code: null,
    containerState: {},
    defineSkip,
    events: [],
    now,
    parser: parser2,
    previous: null,
    sliceSerialize,
    sliceStream,
    write
  };
  let state = initialize.tokenize.call(context, effects);
  let expectedCode;
  if (initialize.resolveAll) {
    resolveAllConstructs.push(initialize);
  }
  return context;
  function write(slice) {
    chunks = push(chunks, slice);
    main();
    if (chunks[chunks.length - 1] !== null) {
      return [];
    }
    addResult(initialize, 0);
    context.events = resolveAll(resolveAllConstructs, context.events, context);
    return context.events;
  }
  function sliceSerialize(token, expandTabs) {
    return serializeChunks(sliceStream(token), expandTabs);
  }
  function sliceStream(token) {
    return sliceChunks(chunks, token);
  }
  function now() {
    const {
      _bufferIndex,
      _index,
      line,
      column,
      offset
    } = point3;
    return {
      _bufferIndex,
      _index,
      line,
      column,
      offset
    };
  }
  function defineSkip(value) {
    columnStart[value.line] = value.column;
    accountForPotentialSkip();
  }
  function main() {
    while (point3._index < chunks.length) {
      const chunk = chunks[point3._index];
      if (typeof chunk === "string") {
        const chunkIndex = point3._index;
        if (point3._bufferIndex < 0) {
          point3._bufferIndex = 0;
        }
        while (point3._index === chunkIndex && point3._bufferIndex < chunk.length) {
          go(chunk.charCodeAt(point3._bufferIndex));
        }
      } else {
        go(chunk);
      }
    }
  }
  function go(code2) {
    consumed = void 0;
    expectedCode = code2;
    state = state(code2);
  }
  function consume(code2) {
    if (markdownLineEnding(code2)) {
      point3.line++;
      point3.column = 1;
      point3.offset += code2 === -3 ? 2 : 1;
      accountForPotentialSkip();
    } else if (code2 !== -1) {
      point3.column++;
      point3.offset++;
    }
    if (point3._bufferIndex < 0) {
      point3._index++;
    } else {
      point3._bufferIndex++;
      if (point3._bufferIndex === // Points w/ non-negative `_bufferIndex` reference
      // strings.
      /** @type {string} */
      chunks[point3._index].length) {
        point3._bufferIndex = -1;
        point3._index++;
      }
    }
    context.previous = code2;
    consumed = true;
  }
  function enter(type, fields) {
    const token = fields || {};
    token.type = type;
    token.start = now();
    context.events.push(["enter", token, context]);
    stack.push(token);
    return token;
  }
  function exit3(type) {
    const token = stack.pop();
    token.end = now();
    context.events.push(["exit", token, context]);
    return token;
  }
  function onsuccessfulconstruct(construct, info) {
    addResult(construct, info.from);
  }
  function onsuccessfulcheck(_, info) {
    info.restore();
  }
  function constructFactory(onreturn, fields) {
    return hook;
    function hook(constructs2, returnState, bogusState) {
      let listOfConstructs;
      let constructIndex;
      let currentConstruct;
      let info;
      return Array.isArray(constructs2) ? (
        /* c8 ignore next 1 */
        handleListOfConstructs(constructs2)
      ) : "tokenize" in constructs2 ? (
        // Looks like a construct.
        handleListOfConstructs([
          /** @type {Construct} */
          constructs2
        ])
      ) : handleMapOfConstructs(constructs2);
      function handleMapOfConstructs(map) {
        return start;
        function start(code2) {
          const left = code2 !== null && map[code2];
          const all2 = code2 !== null && map.null;
          const list2 = [
            // To do: add more extension tests.
            /* c8 ignore next 2 */
            ...Array.isArray(left) ? left : left ? [left] : [],
            ...Array.isArray(all2) ? all2 : all2 ? [all2] : []
          ];
          return handleListOfConstructs(list2)(code2);
        }
      }
      function handleListOfConstructs(list2) {
        listOfConstructs = list2;
        constructIndex = 0;
        if (list2.length === 0) {
          return bogusState;
        }
        return handleConstruct(list2[constructIndex]);
      }
      function handleConstruct(construct) {
        return start;
        function start(code2) {
          info = store();
          currentConstruct = construct;
          if (!construct.partial) {
            context.currentConstruct = construct;
          }
          if (construct.name && context.parser.constructs.disable.null.includes(construct.name)) {
            return nok(code2);
          }
          return construct.tokenize.call(
            // If we do have fields, create an object w/ `context` as its
            // prototype.
            // This allows a “live binding”, which is needed for `interrupt`.
            fields ? Object.assign(Object.create(context), fields) : context,
            effects,
            ok3,
            nok
          )(code2);
        }
      }
      function ok3(code2) {
        consumed = true;
        onreturn(currentConstruct, info);
        return returnState;
      }
      function nok(code2) {
        consumed = true;
        info.restore();
        if (++constructIndex < listOfConstructs.length) {
          return handleConstruct(listOfConstructs[constructIndex]);
        }
        return bogusState;
      }
    }
  }
  function addResult(construct, from2) {
    if (construct.resolveAll && !resolveAllConstructs.includes(construct)) {
      resolveAllConstructs.push(construct);
    }
    if (construct.resolve) {
      splice(context.events, from2, context.events.length - from2, construct.resolve(context.events.slice(from2), context));
    }
    if (construct.resolveTo) {
      context.events = construct.resolveTo(context.events, context);
    }
  }
  function store() {
    const startPoint = now();
    const startPrevious = context.previous;
    const startCurrentConstruct = context.currentConstruct;
    const startEventsIndex = context.events.length;
    const startStack = Array.from(stack);
    return {
      from: startEventsIndex,
      restore
    };
    function restore() {
      point3 = startPoint;
      context.previous = startPrevious;
      context.currentConstruct = startCurrentConstruct;
      context.events.length = startEventsIndex;
      stack = startStack;
      accountForPotentialSkip();
    }
  }
  function accountForPotentialSkip() {
    if (point3.line in columnStart && point3.column < 2) {
      point3.column = columnStart[point3.line];
      point3.offset += columnStart[point3.line] - 1;
    }
  }
}
function sliceChunks(chunks, token) {
  const startIndex = token.start._index;
  const startBufferIndex = token.start._bufferIndex;
  const endIndex = token.end._index;
  const endBufferIndex = token.end._bufferIndex;
  let view;
  if (startIndex === endIndex) {
    view = [chunks[startIndex].slice(startBufferIndex, endBufferIndex)];
  } else {
    view = chunks.slice(startIndex, endIndex);
    if (startBufferIndex > -1) {
      const head = view[0];
      if (typeof head === "string") {
        view[0] = head.slice(startBufferIndex);
      } else {
        view.shift();
      }
    }
    if (endBufferIndex > 0) {
      view.push(chunks[endIndex].slice(0, endBufferIndex));
    }
  }
  return view;
}
function serializeChunks(chunks, expandTabs) {
  let index2 = -1;
  const result = [];
  let atTab;
  while (++index2 < chunks.length) {
    const chunk = chunks[index2];
    let value;
    if (typeof chunk === "string") {
      value = chunk;
    } else {
      switch (chunk) {
        case -5: {
          value = "\r";
          break;
        }
        case -4: {
          value = "\n";
          break;
        }
        case -3: {
          value = "\r\n";
          break;
        }
        case -2: {
          value = expandTabs ? " " : "	";
          break;
        }
        case -1: {
          if (!expandTabs && atTab) {
            continue;
          }
          value = " ";
          break;
        }
        default: {
          value = String.fromCharCode(chunk);
        }
      }
    }
    atTab = chunk === -2;
    result.push(value);
  }
  return result.join("");
}
var init_create_tokenizer = __esm({
  "node_modules/micromark/lib/create-tokenizer.js"() {
    init_micromark_util_character();
    init_micromark_util_chunked();
    init_micromark_util_resolve_all();
  }
});

// node_modules/micromark/lib/parse.js
function parse(options) {
  const settings = options || {};
  const constructs2 = (
    /** @type {FullNormalizedExtension} */
    combineExtensions([constructs_exports, ...settings.extensions || []])
  );
  const parser2 = {
    constructs: constructs2,
    content: create(content),
    defined: [],
    document: create(document2),
    flow: create(flow),
    lazy: {},
    string: create(string),
    text: create(text)
  };
  return parser2;
  function create(initial) {
    return creator;
    function creator(from) {
      return createTokenizer(parser2, initial, from);
    }
  }
}
var init_parse = __esm({
  "node_modules/micromark/lib/parse.js"() {
    init_micromark_util_combine_extensions();
    init_content();
    init_document();
    init_flow();
    init_text();
    init_constructs();
    init_create_tokenizer();
  }
});

// node_modules/micromark/lib/postprocess.js
function postprocess(events) {
  while (!subtokenize(events)) {
  }
  return events;
}
var init_postprocess = __esm({
  "node_modules/micromark/lib/postprocess.js"() {
    init_micromark_util_subtokenize();
  }
});

// node_modules/micromark/lib/preprocess.js
function preprocess() {
  let column = 1;
  let buffer = "";
  let start = true;
  let atCarriageReturn;
  return preprocessor;
  function preprocessor(value, encoding, end) {
    value = buffer + (typeof value === "string" ? value.toString() : new TextDecoder(encoding || void 0).decode(value));
    const chunks = [];
    let startPosition = 0;
    buffer = "";
    if (start) {
      if (value.charCodeAt(0) === 65279) {
        startPosition++;
      }
      start = void 0;
    }
    while (startPosition < value.length) {
      search.lastIndex = startPosition;
      const match = search.exec(value);
      const endPosition = match && match.index !== void 0 ? match.index : value.length;
      const code2 = value.charCodeAt(endPosition);
      if (!match) {
        buffer = value.slice(startPosition);
        break;
      }
      if (code2 === 10 && startPosition === endPosition && atCarriageReturn) {
        chunks.push(-3);
        atCarriageReturn = void 0;
      } else {
        if (atCarriageReturn) {
          chunks.push(-5);
          atCarriageReturn = void 0;
        }
        if (startPosition < endPosition) {
          chunks.push(value.slice(startPosition, endPosition));
          column += endPosition - startPosition;
        }
        switch (code2) {
          case 0: {
            chunks.push(65533);
            column++;
            break;
          }
          case 9: {
            const next = Math.ceil(column / 4) * 4;
            chunks.push(-2);
            while (column++ < next) {
              chunks.push(-1);
            }
            break;
          }
          case 10: {
            chunks.push(-4);
            column = 1;
            break;
          }
          default: {
            atCarriageReturn = true;
            column = 1;
          }
        }
      }
      startPosition = endPosition + 1;
    }
    if (end) {
      if (atCarriageReturn) {
        chunks.push(-5);
      }
      if (buffer) {
        chunks.push(buffer);
      }
      chunks.push(null);
    }
    return chunks;
  }
}
var search;
var init_preprocess = __esm({
  "node_modules/micromark/lib/preprocess.js"() {
    search = /[\0\t\n\r]/g;
  }
});

// node_modules/micromark/index.js
var init_micromark = __esm({
  "node_modules/micromark/index.js"() {
    init_parse();
    init_postprocess();
    init_preprocess();
  }
});

// node_modules/micromark-util-decode-string/index.js
function decodeString(value) {
  return value.replace(characterEscapeOrReference, decode);
}
function decode($0, $1, $2) {
  if ($1) {
    return $1;
  }
  const head = $2.charCodeAt(0);
  if (head === 35) {
    const head2 = $2.charCodeAt(1);
    const hex = head2 === 120 || head2 === 88;
    return decodeNumericCharacterReference($2.slice(hex ? 2 : 1), hex ? 16 : 10);
  }
  return decodeNamedCharacterReference($2) || $0;
}
var characterEscapeOrReference;
var init_micromark_util_decode_string = __esm({
  "node_modules/micromark-util-decode-string/index.js"() {
    init_index_dom();
    init_micromark_util_decode_numeric_character_reference();
    characterEscapeOrReference = /\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;
  }
});

// node_modules/unist-util-stringify-position/lib/index.js
function stringifyPosition(value) {
  if (!value || typeof value !== "object") {
    return "";
  }
  if ("position" in value || "type" in value) {
    return position(value.position);
  }
  if ("start" in value || "end" in value) {
    return position(value);
  }
  if ("line" in value || "column" in value) {
    return point(value);
  }
  return "";
}
function point(point3) {
  return index(point3 && point3.line) + ":" + index(point3 && point3.column);
}
function position(pos) {
  return point(pos && pos.start) + "-" + point(pos && pos.end);
}
function index(value) {
  return value && typeof value === "number" ? value : 1;
}
var init_lib2 = __esm({
  "node_modules/unist-util-stringify-position/lib/index.js"() {
  }
});

// node_modules/unist-util-stringify-position/index.js
var init_unist_util_stringify_position = __esm({
  "node_modules/unist-util-stringify-position/index.js"() {
    init_lib2();
  }
});

// node_modules/mdast-util-from-markdown/lib/index.js
function fromMarkdown(value, encoding, options) {
  if (encoding && typeof encoding === "object") {
    options = encoding;
    encoding = void 0;
  }
  return compiler(options)(postprocess(parse(options).document().write(preprocess()(value, encoding, true))));
}
function compiler(options) {
  const config = {
    afterExit: [],
    beforeEnter: [],
    transforms: [],
    canContainEols: ["emphasis", "fragment", "heading", "paragraph", "strong"],
    enter: {
      autolink: opener(link),
      autolinkProtocol: onenterdata,
      autolinkEmail: onenterdata,
      atxHeading: opener(heading),
      blockQuote: opener(blockQuote2),
      characterEscape: onenterdata,
      characterReference: onenterdata,
      codeFenced: opener(codeFlow),
      codeFencedFenceInfo: buffer,
      codeFencedFenceMeta: buffer,
      codeIndented: opener(codeFlow, buffer),
      codeText: opener(codeText2, buffer),
      codeTextData: onenterdata,
      data: onenterdata,
      codeFlowValue: onenterdata,
      definition: opener(definition2),
      definitionDestinationString: buffer,
      definitionLabelString: buffer,
      definitionTitleString: buffer,
      emphasis: opener(emphasis),
      hardBreakEscape: opener(hardBreak),
      hardBreakTrailing: opener(hardBreak),
      htmlFlow: opener(html, buffer),
      htmlFlowData: onenterdata,
      htmlText: opener(html, buffer),
      htmlTextData: onenterdata,
      image: opener(image),
      label: buffer,
      link: opener(link),
      listItem: opener(listItem),
      listItemValue: onenterlistitemvalue,
      listOrdered: opener(list2, onenterlistordered),
      listUnordered: opener(list2),
      paragraph: opener(paragraph),
      reference: onenterreference,
      referenceString: buffer,
      resourceDestinationString: buffer,
      resourceTitleString: buffer,
      setextHeading: opener(heading),
      strong: opener(strong),
      thematicBreak: opener(thematicBreak2)
    },
    exit: {
      atxHeading: closer(),
      atxHeadingSequence: onexitatxheadingsequence,
      autolink: closer(),
      autolinkEmail: onexitautolinkemail,
      autolinkProtocol: onexitautolinkprotocol,
      blockQuote: closer(),
      characterEscapeValue: onexitdata,
      characterReferenceMarkerHexadecimal: onexitcharacterreferencemarker,
      characterReferenceMarkerNumeric: onexitcharacterreferencemarker,
      characterReferenceValue: onexitcharacterreferencevalue,
      characterReference: onexitcharacterreference,
      codeFenced: closer(onexitcodefenced),
      codeFencedFence: onexitcodefencedfence,
      codeFencedFenceInfo: onexitcodefencedfenceinfo,
      codeFencedFenceMeta: onexitcodefencedfencemeta,
      codeFlowValue: onexitdata,
      codeIndented: closer(onexitcodeindented),
      codeText: closer(onexitcodetext),
      codeTextData: onexitdata,
      data: onexitdata,
      definition: closer(),
      definitionDestinationString: onexitdefinitiondestinationstring,
      definitionLabelString: onexitdefinitionlabelstring,
      definitionTitleString: onexitdefinitiontitlestring,
      emphasis: closer(),
      hardBreakEscape: closer(onexithardbreak),
      hardBreakTrailing: closer(onexithardbreak),
      htmlFlow: closer(onexithtmlflow),
      htmlFlowData: onexitdata,
      htmlText: closer(onexithtmltext),
      htmlTextData: onexitdata,
      image: closer(onexitimage),
      label: onexitlabel,
      labelText: onexitlabeltext,
      lineEnding: onexitlineending,
      link: closer(onexitlink),
      listItem: closer(),
      listOrdered: closer(),
      listUnordered: closer(),
      paragraph: closer(),
      referenceString: onexitreferencestring,
      resourceDestinationString: onexitresourcedestinationstring,
      resourceTitleString: onexitresourcetitlestring,
      resource: onexitresource,
      setextHeading: closer(onexitsetextheading),
      setextHeadingLineSequence: onexitsetextheadinglinesequence,
      setextHeadingText: onexitsetextheadingtext,
      strong: closer(),
      thematicBreak: closer()
    }
  };
  configure(config, (options || {}).mdastExtensions || []);
  const data = {};
  return compile;
  function compile(events) {
    let tree = {
      type: "root",
      children: [],
      position: void 0
    };
    const context = {
      stack: [tree],
      tokenStack: [],
      config,
      enter,
      exit: exit3,
      buffer,
      resume,
      data
    };
    const listStack = [];
    const prepared = [];
    let index2 = -1;
    while (++index2 < events.length) {
      prepared.push(events[index2]);
      if (events[index2][1].type === "listOrdered" || events[index2][1].type === "listUnordered") {
        if (events[index2][0] === "enter") {
          listStack.push(prepared.length - 1);
        } else {
          const tail = listStack.pop();
          prepareList(prepared, tail);
        }
      }
    }
    events = prepared;
    index2 = -1;
    while (++index2 < events.length) {
      const handler = config[events[index2][0]];
      if (events[index2][0] === "enter" && config.beforeEnter.length > 0) {
        callListeners(config.beforeEnter, {
          ...context,
          sliceSerialize: events[index2][2].sliceSerialize
        }, events[index2][1]);
      }
      if (own.call(handler, events[index2][1].type)) {
        handler[events[index2][1].type].call({
          ...context,
          sliceSerialize: events[index2][2].sliceSerialize
        }, events[index2][1]);
      }
      if (events[index2][0] === "exit" && config.afterExit.length > 0) {
        callListeners(config.afterExit, {
          ...context,
          sliceSerialize: events[index2][2].sliceSerialize
        }, events[index2][1]);
      }
    }
    if (context.tokenStack.length > 0) {
      const tail = context.tokenStack[context.tokenStack.length - 1];
      const handler = tail[1] || defaultOnError;
      handler.call(context, void 0, tail[0]);
    }
    tree.position = {
      start: point2(events.length > 0 ? events[0][1].start : {
        line: 1,
        column: 1,
        offset: 0
      }),
      end: point2(events.length > 0 ? events[events.length - 2][1].end : {
        line: 1,
        column: 1,
        offset: 0
      })
    };
    index2 = -1;
    while (++index2 < config.transforms.length) {
      tree = config.transforms[index2](tree) || tree;
    }
    return tree;
  }
  function callListeners(listeners, context, token) {
    let index2 = -1;
    while (++index2 < listeners.length) {
      listeners[index2].call(context, token);
    }
  }
  function prepareList(events, start) {
    const end = events.length - 1;
    let index2 = start - 1;
    let containerBalance = -1;
    let listSpread = false;
    let listItem2;
    let lineIndex;
    let firstBlankLineIndex;
    let atMarker;
    const insertions = [];
    while (++index2 <= end) {
      const event = events[index2];
      switch (event[1].type) {
        case "listUnordered":
        case "listOrdered":
        case "blockQuote": {
          if (event[0] === "enter") {
            containerBalance++;
          } else {
            containerBalance--;
          }
          atMarker = void 0;
          break;
        }
        case "lineEndingBlank": {
          if (event[0] === "enter") {
            if (listItem2 && !atMarker && !containerBalance && !firstBlankLineIndex) {
              firstBlankLineIndex = index2;
            }
            atMarker = void 0;
          }
          break;
        }
        case "linePrefix":
        case "listItemValue":
        case "listItemMarker":
        case "listItemPrefix":
        case "listItemPrefixWhitespace": {
          break;
        }
        default: {
          atMarker = void 0;
        }
      }
      if (!containerBalance && event[0] === "enter" && event[1].type === "listItemPrefix" || containerBalance === -1 && event[0] === "exit" && (event[1].type === "listUnordered" || event[1].type === "listOrdered")) {
        if (listItem2) {
          let tailIndex = index2;
          lineIndex = void 0;
          while (tailIndex--) {
            const tailEvent = events[tailIndex];
            if (tailEvent[1].type === "lineEnding" || tailEvent[1].type === "lineEndingBlank") {
              if (tailEvent[0] === "exit") continue;
              if (lineIndex) {
                events[lineIndex][1].type = "lineEndingBlank";
                listSpread = true;
              }
              tailEvent[1].type = "lineEnding";
              lineIndex = tailIndex;
            } else if (tailEvent[1].type === "linePrefix" || tailEvent[1].type === "blockQuotePrefix" || tailEvent[1].type === "blockQuotePrefixWhitespace" || tailEvent[1].type === "blockQuoteMarker" || tailEvent[1].type === "listItemIndent") {
            } else {
              break;
            }
          }
          if (firstBlankLineIndex && (!lineIndex || firstBlankLineIndex < lineIndex)) {
            listItem2._spread = true;
          }
          listItem2.end = Object.assign({}, lineIndex ? events[lineIndex][1].start : event[1].end);
          insertions.push({
            at: lineIndex || index2,
            event: ["exit", listItem2, event[2]]
          });
        }
        if (event[1].type === "listItemPrefix") {
          const item = {
            type: "listItem",
            _spread: false,
            start: Object.assign({}, event[1].start),
            // @ts-expect-error: we’ll add `end` in a second.
            end: void 0
          };
          listItem2 = item;
          insertions.push({
            at: index2,
            event: ["enter", item, event[2]]
          });
          firstBlankLineIndex = void 0;
          atMarker = true;
        }
      }
    }
    const listEvents = events.splice(start);
    let insertion = 0;
    index2 = -1;
    while (++index2 < listEvents.length) {
      while (insertion < insertions.length && insertions[insertion].at === start + index2) {
        events.push(insertions[insertion++].event);
      }
      events.push(listEvents[index2]);
    }
    events[start][1]._spread = listSpread;
  }
  function opener(create, and) {
    return open;
    function open(token) {
      enter.call(this, create(token), token);
      if (and) and.call(this, token);
    }
  }
  function buffer() {
    this.stack.push({
      type: "fragment",
      children: []
    });
  }
  function enter(node2, token, errorHandler) {
    const parent = this.stack[this.stack.length - 1];
    const siblings = parent.children;
    siblings.push(node2);
    this.stack.push(node2);
    this.tokenStack.push([token, errorHandler || void 0]);
    node2.position = {
      start: point2(token.start),
      // @ts-expect-error: `end` will be patched later.
      end: void 0
    };
  }
  function closer(and) {
    return close;
    function close(token) {
      if (and) and.call(this, token);
      exit3.call(this, token);
    }
  }
  function exit3(token, onExitError) {
    const node2 = this.stack.pop();
    const open = this.tokenStack.pop();
    if (!open) {
      throw new Error("Cannot close `" + token.type + "` (" + stringifyPosition({
        start: token.start,
        end: token.end
      }) + "): it\u2019s not open");
    }
    if (open[0].type !== token.type) {
      if (onExitError) {
        onExitError.call(this, token, open[0]);
      } else {
        const handler = open[1] || defaultOnError;
        handler.call(this, token, open[0]);
      }
    }
    node2.position.end = point2(token.end);
  }
  function resume() {
    return toString(this.stack.pop());
  }
  function onenterlistordered() {
    this.data.expectingFirstListItemValue = true;
  }
  function onenterlistitemvalue(token) {
    if (this.data.expectingFirstListItemValue) {
      const ancestor = this.stack[this.stack.length - 2];
      ancestor.start = Number.parseInt(this.sliceSerialize(token), 10);
      this.data.expectingFirstListItemValue = void 0;
    }
  }
  function onexitcodefencedfenceinfo() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.lang = data2;
  }
  function onexitcodefencedfencemeta() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.meta = data2;
  }
  function onexitcodefencedfence() {
    if (this.data.flowCodeInside) return;
    this.buffer();
    this.data.flowCodeInside = true;
  }
  function onexitcodefenced() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, "");
    this.data.flowCodeInside = void 0;
  }
  function onexitcodeindented() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2.replace(/(\r?\n|\r)$/g, "");
  }
  function onexitdefinitionlabelstring(token) {
    const label = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.label = label;
    node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
  }
  function onexitdefinitiontitlestring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.title = data2;
  }
  function onexitdefinitiondestinationstring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.url = data2;
  }
  function onexitatxheadingsequence(token) {
    const node2 = this.stack[this.stack.length - 1];
    if (!node2.depth) {
      const depth = this.sliceSerialize(token).length;
      node2.depth = depth;
    }
  }
  function onexitsetextheadingtext() {
    this.data.setextHeadingSlurpLineEnding = true;
  }
  function onexitsetextheadinglinesequence(token) {
    const node2 = this.stack[this.stack.length - 1];
    node2.depth = this.sliceSerialize(token).codePointAt(0) === 61 ? 1 : 2;
  }
  function onexitsetextheading() {
    this.data.setextHeadingSlurpLineEnding = void 0;
  }
  function onenterdata(token) {
    const node2 = this.stack[this.stack.length - 1];
    const siblings = node2.children;
    let tail = siblings[siblings.length - 1];
    if (!tail || tail.type !== "text") {
      tail = text4();
      tail.position = {
        start: point2(token.start),
        // @ts-expect-error: we’ll add `end` later.
        end: void 0
      };
      siblings.push(tail);
    }
    this.stack.push(tail);
  }
  function onexitdata(token) {
    const tail = this.stack.pop();
    tail.value += this.sliceSerialize(token);
    tail.position.end = point2(token.end);
  }
  function onexitlineending(token) {
    const context = this.stack[this.stack.length - 1];
    if (this.data.atHardBreak) {
      const tail = context.children[context.children.length - 1];
      tail.position.end = point2(token.end);
      this.data.atHardBreak = void 0;
      return;
    }
    if (!this.data.setextHeadingSlurpLineEnding && config.canContainEols.includes(context.type)) {
      onenterdata.call(this, token);
      onexitdata.call(this, token);
    }
  }
  function onexithardbreak() {
    this.data.atHardBreak = true;
  }
  function onexithtmlflow() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexithtmltext() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexitcodetext() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.value = data2;
  }
  function onexitlink() {
    const node2 = this.stack[this.stack.length - 1];
    if (this.data.inReference) {
      const referenceType = this.data.referenceType || "shortcut";
      node2.type += "Reference";
      node2.referenceType = referenceType;
      delete node2.url;
      delete node2.title;
    } else {
      delete node2.identifier;
      delete node2.label;
    }
    this.data.referenceType = void 0;
  }
  function onexitimage() {
    const node2 = this.stack[this.stack.length - 1];
    if (this.data.inReference) {
      const referenceType = this.data.referenceType || "shortcut";
      node2.type += "Reference";
      node2.referenceType = referenceType;
      delete node2.url;
      delete node2.title;
    } else {
      delete node2.identifier;
      delete node2.label;
    }
    this.data.referenceType = void 0;
  }
  function onexitlabeltext(token) {
    const string3 = this.sliceSerialize(token);
    const ancestor = this.stack[this.stack.length - 2];
    ancestor.label = decodeString(string3);
    ancestor.identifier = normalizeIdentifier(string3).toLowerCase();
  }
  function onexitlabel() {
    const fragment = this.stack[this.stack.length - 1];
    const value = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    this.data.inReference = true;
    if (node2.type === "link") {
      const children = fragment.children;
      node2.children = children;
    } else {
      node2.alt = value;
    }
  }
  function onexitresourcedestinationstring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.url = data2;
  }
  function onexitresourcetitlestring() {
    const data2 = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.title = data2;
  }
  function onexitresource() {
    this.data.inReference = void 0;
  }
  function onenterreference() {
    this.data.referenceType = "collapsed";
  }
  function onexitreferencestring(token) {
    const label = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    node2.label = label;
    node2.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
    this.data.referenceType = "full";
  }
  function onexitcharacterreferencemarker(token) {
    this.data.characterReferenceType = token.type;
  }
  function onexitcharacterreferencevalue(token) {
    const data2 = this.sliceSerialize(token);
    const type = this.data.characterReferenceType;
    let value;
    if (type) {
      value = decodeNumericCharacterReference(data2, type === "characterReferenceMarkerNumeric" ? 10 : 16);
      this.data.characterReferenceType = void 0;
    } else {
      const result = decodeNamedCharacterReference(data2);
      value = result;
    }
    const tail = this.stack[this.stack.length - 1];
    tail.value += value;
  }
  function onexitcharacterreference(token) {
    const tail = this.stack.pop();
    tail.position.end = point2(token.end);
  }
  function onexitautolinkprotocol(token) {
    onexitdata.call(this, token);
    const node2 = this.stack[this.stack.length - 1];
    node2.url = this.sliceSerialize(token);
  }
  function onexitautolinkemail(token) {
    onexitdata.call(this, token);
    const node2 = this.stack[this.stack.length - 1];
    node2.url = "mailto:" + this.sliceSerialize(token);
  }
  function blockQuote2() {
    return {
      type: "blockquote",
      children: [],
      position: void 0
    };
  }
  function codeFlow() {
    return {
      type: "code",
      lang: null,
      meta: null,
      value: "",
      position: void 0
    };
  }
  function codeText2() {
    return {
      type: "inlineCode",
      value: "",
      position: void 0
    };
  }
  function definition2() {
    return {
      type: "definition",
      identifier: "",
      label: null,
      title: null,
      url: "",
      position: void 0
    };
  }
  function emphasis() {
    return {
      type: "emphasis",
      children: [],
      position: void 0
    };
  }
  function heading() {
    return {
      type: "heading",
      // @ts-expect-error `depth` will be set later.
      depth: 0,
      children: [],
      position: void 0
    };
  }
  function hardBreak() {
    return {
      type: "break",
      position: void 0
    };
  }
  function html() {
    return {
      type: "html",
      value: "",
      position: void 0
    };
  }
  function image() {
    return {
      type: "image",
      title: null,
      url: "",
      alt: null,
      position: void 0
    };
  }
  function link() {
    return {
      type: "link",
      title: null,
      url: "",
      children: [],
      position: void 0
    };
  }
  function list2(token) {
    return {
      type: "list",
      ordered: token.type === "listOrdered",
      start: null,
      spread: token._spread,
      children: [],
      position: void 0
    };
  }
  function listItem(token) {
    return {
      type: "listItem",
      spread: token._spread,
      checked: null,
      children: [],
      position: void 0
    };
  }
  function paragraph() {
    return {
      type: "paragraph",
      children: [],
      position: void 0
    };
  }
  function strong() {
    return {
      type: "strong",
      children: [],
      position: void 0
    };
  }
  function text4() {
    return {
      type: "text",
      value: "",
      position: void 0
    };
  }
  function thematicBreak2() {
    return {
      type: "thematicBreak",
      position: void 0
    };
  }
}
function point2(d) {
  return {
    line: d.line,
    column: d.column,
    offset: d.offset
  };
}
function configure(combined, extensions) {
  let index2 = -1;
  while (++index2 < extensions.length) {
    const value = extensions[index2];
    if (Array.isArray(value)) {
      configure(combined, value);
    } else {
      extension(combined, value);
    }
  }
}
function extension(combined, extension2) {
  let key;
  for (key in extension2) {
    if (own.call(extension2, key)) {
      switch (key) {
        case "canContainEols": {
          const right = extension2[key];
          if (right) {
            combined[key].push(...right);
          }
          break;
        }
        case "transforms": {
          const right = extension2[key];
          if (right) {
            combined[key].push(...right);
          }
          break;
        }
        case "afterExit":
        case "beforeEnter": {
          const right = extension2[key];
          if (right) {
            combined[key].push(right);
          }
          break;
        }
        case "enter":
        case "exit": {
          const right = extension2[key];
          if (right) {
            Object.assign(combined[key], right);
          }
          break;
        }
      }
    }
  }
}
function defaultOnError(left, right) {
  if (left) {
    throw new Error("Cannot close `" + left.type + "` (" + stringifyPosition({
      start: left.start,
      end: left.end
    }) + "): a different token (`" + right.type + "`, " + stringifyPosition({
      start: right.start,
      end: right.end
    }) + ") is open");
  }
  throw new Error("Cannot close document, a token (`" + right.type + "`, " + stringifyPosition({
    start: right.start,
    end: right.end
  }) + ") is still open");
}
var own;
var init_lib3 = __esm({
  "node_modules/mdast-util-from-markdown/lib/index.js"() {
    init_mdast_util_to_string();
    init_micromark();
    init_micromark_util_decode_numeric_character_reference();
    init_micromark_util_decode_string();
    init_micromark_util_normalize_identifier();
    init_index_dom();
    init_unist_util_stringify_position();
    own = {}.hasOwnProperty;
  }
});

// node_modules/mdast-util-from-markdown/index.js
var init_mdast_util_from_markdown = __esm({
  "node_modules/mdast-util-from-markdown/index.js"() {
    init_lib3();
  }
});

// node_modules/micromark-util-symbol/lib/codes.js
var codes;
var init_codes = __esm({
  "node_modules/micromark-util-symbol/lib/codes.js"() {
    codes = /** @type {const} */
    {
      carriageReturn: -5,
      lineFeed: -4,
      carriageReturnLineFeed: -3,
      horizontalTab: -2,
      virtualSpace: -1,
      eof: null,
      nul: 0,
      soh: 1,
      stx: 2,
      etx: 3,
      eot: 4,
      enq: 5,
      ack: 6,
      bel: 7,
      bs: 8,
      ht: 9,
      // `\t`
      lf: 10,
      // `\n`
      vt: 11,
      // `\v`
      ff: 12,
      // `\f`
      cr: 13,
      // `\r`
      so: 14,
      si: 15,
      dle: 16,
      dc1: 17,
      dc2: 18,
      dc3: 19,
      dc4: 20,
      nak: 21,
      syn: 22,
      etb: 23,
      can: 24,
      em: 25,
      sub: 26,
      esc: 27,
      fs: 28,
      gs: 29,
      rs: 30,
      us: 31,
      space: 32,
      exclamationMark: 33,
      // `!`
      quotationMark: 34,
      // `"`
      numberSign: 35,
      // `#`
      dollarSign: 36,
      // `$`
      percentSign: 37,
      // `%`
      ampersand: 38,
      // `&`
      apostrophe: 39,
      // `'`
      leftParenthesis: 40,
      // `(`
      rightParenthesis: 41,
      // `)`
      asterisk: 42,
      // `*`
      plusSign: 43,
      // `+`
      comma: 44,
      // `,`
      dash: 45,
      // `-`
      dot: 46,
      // `.`
      slash: 47,
      // `/`
      digit0: 48,
      // `0`
      digit1: 49,
      // `1`
      digit2: 50,
      // `2`
      digit3: 51,
      // `3`
      digit4: 52,
      // `4`
      digit5: 53,
      // `5`
      digit6: 54,
      // `6`
      digit7: 55,
      // `7`
      digit8: 56,
      // `8`
      digit9: 57,
      // `9`
      colon: 58,
      // `:`
      semicolon: 59,
      // `;`
      lessThan: 60,
      // `<`
      equalsTo: 61,
      // `=`
      greaterThan: 62,
      // `>`
      questionMark: 63,
      // `?`
      atSign: 64,
      // `@`
      uppercaseA: 65,
      // `A`
      uppercaseB: 66,
      // `B`
      uppercaseC: 67,
      // `C`
      uppercaseD: 68,
      // `D`
      uppercaseE: 69,
      // `E`
      uppercaseF: 70,
      // `F`
      uppercaseG: 71,
      // `G`
      uppercaseH: 72,
      // `H`
      uppercaseI: 73,
      // `I`
      uppercaseJ: 74,
      // `J`
      uppercaseK: 75,
      // `K`
      uppercaseL: 76,
      // `L`
      uppercaseM: 77,
      // `M`
      uppercaseN: 78,
      // `N`
      uppercaseO: 79,
      // `O`
      uppercaseP: 80,
      // `P`
      uppercaseQ: 81,
      // `Q`
      uppercaseR: 82,
      // `R`
      uppercaseS: 83,
      // `S`
      uppercaseT: 84,
      // `T`
      uppercaseU: 85,
      // `U`
      uppercaseV: 86,
      // `V`
      uppercaseW: 87,
      // `W`
      uppercaseX: 88,
      // `X`
      uppercaseY: 89,
      // `Y`
      uppercaseZ: 90,
      // `Z`
      leftSquareBracket: 91,
      // `[`
      backslash: 92,
      // `\`
      rightSquareBracket: 93,
      // `]`
      caret: 94,
      // `^`
      underscore: 95,
      // `_`
      graveAccent: 96,
      // `` ` ``
      lowercaseA: 97,
      // `a`
      lowercaseB: 98,
      // `b`
      lowercaseC: 99,
      // `c`
      lowercaseD: 100,
      // `d`
      lowercaseE: 101,
      // `e`
      lowercaseF: 102,
      // `f`
      lowercaseG: 103,
      // `g`
      lowercaseH: 104,
      // `h`
      lowercaseI: 105,
      // `i`
      lowercaseJ: 106,
      // `j`
      lowercaseK: 107,
      // `k`
      lowercaseL: 108,
      // `l`
      lowercaseM: 109,
      // `m`
      lowercaseN: 110,
      // `n`
      lowercaseO: 111,
      // `o`
      lowercaseP: 112,
      // `p`
      lowercaseQ: 113,
      // `q`
      lowercaseR: 114,
      // `r`
      lowercaseS: 115,
      // `s`
      lowercaseT: 116,
      // `t`
      lowercaseU: 117,
      // `u`
      lowercaseV: 118,
      // `v`
      lowercaseW: 119,
      // `w`
      lowercaseX: 120,
      // `x`
      lowercaseY: 121,
      // `y`
      lowercaseZ: 122,
      // `z`
      leftCurlyBrace: 123,
      // `{`
      verticalBar: 124,
      // `|`
      rightCurlyBrace: 125,
      // `}`
      tilde: 126,
      // `~`
      del: 127,
      // Unicode Specials block.
      byteOrderMarker: 65279,
      // Unicode Specials block.
      replacementCharacter: 65533
      // `�`
    };
  }
});

// node_modules/micromark-util-symbol/lib/constants.js
var constants;
var init_constants = __esm({
  "node_modules/micromark-util-symbol/lib/constants.js"() {
    constants = /** @type {const} */
    {
      attentionSideAfter: 2,
      // Symbol to mark an attention sequence as after content: `a*`
      attentionSideBefore: 1,
      // Symbol to mark an attention sequence as before content: `*a`
      atxHeadingOpeningFenceSizeMax: 6,
      // 6 number signs is fine, 7 isn’t.
      autolinkDomainSizeMax: 63,
      // 63 characters is fine, 64 is too many.
      autolinkSchemeSizeMax: 32,
      // 32 characters is fine, 33 is too many.
      cdataOpeningString: "CDATA[",
      // And preceded by `<![`.
      characterGroupPunctuation: 2,
      // Symbol used to indicate a character is punctuation
      characterGroupWhitespace: 1,
      // Symbol used to indicate a character is whitespace
      characterReferenceDecimalSizeMax: 7,
      // `&#9999999;`.
      characterReferenceHexadecimalSizeMax: 6,
      // `&#xff9999;`.
      characterReferenceNamedSizeMax: 31,
      // `&CounterClockwiseContourIntegral;`.
      codeFencedSequenceSizeMin: 3,
      // At least 3 ticks or tildes are needed.
      contentTypeContent: "content",
      contentTypeDocument: "document",
      contentTypeFlow: "flow",
      contentTypeString: "string",
      contentTypeText: "text",
      hardBreakPrefixSizeMin: 2,
      // At least 2 trailing spaces are needed.
      htmlBasic: 6,
      // Symbol for `<div`
      htmlCdata: 5,
      // Symbol for `<![CDATA[]]>`
      htmlComment: 2,
      // Symbol for `<!---->`
      htmlComplete: 7,
      // Symbol for `<x>`
      htmlDeclaration: 4,
      // Symbol for `<!doctype>`
      htmlInstruction: 3,
      // Symbol for `<?php?>`
      htmlRawSizeMax: 8,
      // Length of `textarea`.
      htmlRaw: 1,
      // Symbol for `<script>`
      linkResourceDestinationBalanceMax: 32,
      // See: <https://spec.commonmark.org/0.30/#link-destination>, <https://github.com/remarkjs/react-markdown/issues/658#issuecomment-984345577>
      linkReferenceSizeMax: 999,
      // See: <https://spec.commonmark.org/0.30/#link-label>
      listItemValueSizeMax: 10,
      // See: <https://spec.commonmark.org/0.30/#ordered-list-marker>
      numericBaseDecimal: 10,
      numericBaseHexadecimal: 16,
      tabSize: 4,
      // Tabs have a hard-coded size of 4, per CommonMark.
      thematicBreakMarkerCountMin: 3,
      // At least 3 asterisks, dashes, or underscores are needed.
      v8MaxSafeChunkSize: 1e4
      // V8 (and potentially others) have problems injecting giant arrays into other arrays, hence we operate in chunks.
    };
  }
});

// node_modules/micromark-util-symbol/lib/types.js
var types;
var init_types = __esm({
  "node_modules/micromark-util-symbol/lib/types.js"() {
    types = /** @type {const} */
    {
      // Generic type for data, such as in a title, a destination, etc.
      data: "data",
      // Generic type for syntactic whitespace (tabs, virtual spaces, spaces).
      // Such as, between a fenced code fence and an info string.
      whitespace: "whitespace",
      // Generic type for line endings (line feed, carriage return, carriage return +
      // line feed).
      lineEnding: "lineEnding",
      // A line ending, but ending a blank line.
      lineEndingBlank: "lineEndingBlank",
      // Generic type for whitespace (tabs, virtual spaces, spaces) at the start of a
      // line.
      linePrefix: "linePrefix",
      // Generic type for whitespace (tabs, virtual spaces, spaces) at the end of a
      // line.
      lineSuffix: "lineSuffix",
      // Whole ATX heading:
      //
      // ```markdown
      // #
      // ## Alpha
      // ### Bravo ###
      // ```
      //
      // Includes `atxHeadingSequence`, `whitespace`, `atxHeadingText`.
      atxHeading: "atxHeading",
      // Sequence of number signs in an ATX heading (`###`).
      atxHeadingSequence: "atxHeadingSequence",
      // Content in an ATX heading (`alpha`).
      // Includes text.
      atxHeadingText: "atxHeadingText",
      // Whole autolink (`<https://example.com>` or `<admin@example.com>`)
      // Includes `autolinkMarker` and `autolinkProtocol` or `autolinkEmail`.
      autolink: "autolink",
      // Email autolink w/o markers (`admin@example.com`)
      autolinkEmail: "autolinkEmail",
      // Marker around an `autolinkProtocol` or `autolinkEmail` (`<` or `>`).
      autolinkMarker: "autolinkMarker",
      // Protocol autolink w/o markers (`https://example.com`)
      autolinkProtocol: "autolinkProtocol",
      // A whole character escape (`\-`).
      // Includes `escapeMarker` and `characterEscapeValue`.
      characterEscape: "characterEscape",
      // The escaped character (`-`).
      characterEscapeValue: "characterEscapeValue",
      // A whole character reference (`&amp;`, `&#8800;`, or `&#x1D306;`).
      // Includes `characterReferenceMarker`, an optional
      // `characterReferenceMarkerNumeric`, in which case an optional
      // `characterReferenceMarkerHexadecimal`, and a `characterReferenceValue`.
      characterReference: "characterReference",
      // The start or end marker (`&` or `;`).
      characterReferenceMarker: "characterReferenceMarker",
      // Mark reference as numeric (`#`).
      characterReferenceMarkerNumeric: "characterReferenceMarkerNumeric",
      // Mark reference as numeric (`x` or `X`).
      characterReferenceMarkerHexadecimal: "characterReferenceMarkerHexadecimal",
      // Value of character reference w/o markers (`amp`, `8800`, or `1D306`).
      characterReferenceValue: "characterReferenceValue",
      // Whole fenced code:
      //
      // ````markdown
      // ```js
      // alert(1)
      // ```
      // ````
      codeFenced: "codeFenced",
      // A fenced code fence, including whitespace, sequence, info, and meta
      // (` ```js `).
      codeFencedFence: "codeFencedFence",
      // Sequence of grave accent or tilde characters (` ``` `) in a fence.
      codeFencedFenceSequence: "codeFencedFenceSequence",
      // Info word (`js`) in a fence.
      // Includes string.
      codeFencedFenceInfo: "codeFencedFenceInfo",
      // Meta words (`highlight="1"`) in a fence.
      // Includes string.
      codeFencedFenceMeta: "codeFencedFenceMeta",
      // A line of code.
      codeFlowValue: "codeFlowValue",
      // Whole indented code:
      //
      // ```markdown
      //     alert(1)
      // ```
      //
      // Includes `lineEnding`, `linePrefix`, and `codeFlowValue`.
      codeIndented: "codeIndented",
      // A text code (``` `alpha` ```).
      // Includes `codeTextSequence`, `codeTextData`, `lineEnding`, and can include
      // `codeTextPadding`.
      codeText: "codeText",
      codeTextData: "codeTextData",
      // A space or line ending right after or before a tick.
      codeTextPadding: "codeTextPadding",
      // A text code fence (` `` `).
      codeTextSequence: "codeTextSequence",
      // Whole content:
      //
      // ```markdown
      // [a]: b
      // c
      // =
      // d
      // ```
      //
      // Includes `paragraph` and `definition`.
      content: "content",
      // Whole definition:
      //
      // ```markdown
      // [micromark]: https://github.com/micromark/micromark
      // ```
      //
      // Includes `definitionLabel`, `definitionMarker`, `whitespace`,
      // `definitionDestination`, and optionally `lineEnding` and `definitionTitle`.
      definition: "definition",
      // Destination of a definition (`https://github.com/micromark/micromark` or
      // `<https://github.com/micromark/micromark>`).
      // Includes `definitionDestinationLiteral` or `definitionDestinationRaw`.
      definitionDestination: "definitionDestination",
      // Enclosed destination of a definition
      // (`<https://github.com/micromark/micromark>`).
      // Includes `definitionDestinationLiteralMarker` and optionally
      // `definitionDestinationString`.
      definitionDestinationLiteral: "definitionDestinationLiteral",
      // Markers of an enclosed definition destination (`<` or `>`).
      definitionDestinationLiteralMarker: "definitionDestinationLiteralMarker",
      // Unenclosed destination of a definition
      // (`https://github.com/micromark/micromark`).
      // Includes `definitionDestinationString`.
      definitionDestinationRaw: "definitionDestinationRaw",
      // Text in an destination (`https://github.com/micromark/micromark`).
      // Includes string.
      definitionDestinationString: "definitionDestinationString",
      // Label of a definition (`[micromark]`).
      // Includes `definitionLabelMarker` and `definitionLabelString`.
      definitionLabel: "definitionLabel",
      // Markers of a definition label (`[` or `]`).
      definitionLabelMarker: "definitionLabelMarker",
      // Value of a definition label (`micromark`).
      // Includes string.
      definitionLabelString: "definitionLabelString",
      // Marker between a label and a destination (`:`).
      definitionMarker: "definitionMarker",
      // Title of a definition (`"x"`, `'y'`, or `(z)`).
      // Includes `definitionTitleMarker` and optionally `definitionTitleString`.
      definitionTitle: "definitionTitle",
      // Marker around a title of a definition (`"`, `'`, `(`, or `)`).
      definitionTitleMarker: "definitionTitleMarker",
      // Data without markers in a title (`z`).
      // Includes string.
      definitionTitleString: "definitionTitleString",
      // Emphasis (`*alpha*`).
      // Includes `emphasisSequence` and `emphasisText`.
      emphasis: "emphasis",
      // Sequence of emphasis markers (`*` or `_`).
      emphasisSequence: "emphasisSequence",
      // Emphasis text (`alpha`).
      // Includes text.
      emphasisText: "emphasisText",
      // The character escape marker (`\`).
      escapeMarker: "escapeMarker",
      // A hard break created with a backslash (`\\n`).
      // Note: does not include the line ending.
      hardBreakEscape: "hardBreakEscape",
      // A hard break created with trailing spaces (`  \n`).
      // Does not include the line ending.
      hardBreakTrailing: "hardBreakTrailing",
      // Flow HTML:
      //
      // ```markdown
      // <div
      // ```
      //
      // Inlcudes `lineEnding`, `htmlFlowData`.
      htmlFlow: "htmlFlow",
      htmlFlowData: "htmlFlowData",
      // HTML in text (the tag in `a <i> b`).
      // Includes `lineEnding`, `htmlTextData`.
      htmlText: "htmlText",
      htmlTextData: "htmlTextData",
      // Whole image (`![alpha](bravo)`, `![alpha][bravo]`, `![alpha][]`, or
      // `![alpha]`).
      // Includes `label` and an optional `resource` or `reference`.
      image: "image",
      // Whole link label (`[*alpha*]`).
      // Includes `labelLink` or `labelImage`, `labelText`, and `labelEnd`.
      label: "label",
      // Text in an label (`*alpha*`).
      // Includes text.
      labelText: "labelText",
      // Start a link label (`[`).
      // Includes a `labelMarker`.
      labelLink: "labelLink",
      // Start an image label (`![`).
      // Includes `labelImageMarker` and `labelMarker`.
      labelImage: "labelImage",
      // Marker of a label (`[` or `]`).
      labelMarker: "labelMarker",
      // Marker to start an image (`!`).
      labelImageMarker: "labelImageMarker",
      // End a label (`]`).
      // Includes `labelMarker`.
      labelEnd: "labelEnd",
      // Whole link (`[alpha](bravo)`, `[alpha][bravo]`, `[alpha][]`, or `[alpha]`).
      // Includes `label` and an optional `resource` or `reference`.
      link: "link",
      // Whole paragraph:
      //
      // ```markdown
      // alpha
      // bravo.
      // ```
      //
      // Includes text.
      paragraph: "paragraph",
      // A reference (`[alpha]` or `[]`).
      // Includes `referenceMarker` and an optional `referenceString`.
      reference: "reference",
      // A reference marker (`[` or `]`).
      referenceMarker: "referenceMarker",
      // Reference text (`alpha`).
      // Includes string.
      referenceString: "referenceString",
      // A resource (`(https://example.com "alpha")`).
      // Includes `resourceMarker`, an optional `resourceDestination` with an optional
      // `whitespace` and `resourceTitle`.
      resource: "resource",
      // A resource destination (`https://example.com`).
      // Includes `resourceDestinationLiteral` or `resourceDestinationRaw`.
      resourceDestination: "resourceDestination",
      // A literal resource destination (`<https://example.com>`).
      // Includes `resourceDestinationLiteralMarker` and optionally
      // `resourceDestinationString`.
      resourceDestinationLiteral: "resourceDestinationLiteral",
      // A resource destination marker (`<` or `>`).
      resourceDestinationLiteralMarker: "resourceDestinationLiteralMarker",
      // A raw resource destination (`https://example.com`).
      // Includes `resourceDestinationString`.
      resourceDestinationRaw: "resourceDestinationRaw",
      // Resource destination text (`https://example.com`).
      // Includes string.
      resourceDestinationString: "resourceDestinationString",
      // A resource marker (`(` or `)`).
      resourceMarker: "resourceMarker",
      // A resource title (`"alpha"`, `'alpha'`, or `(alpha)`).
      // Includes `resourceTitleMarker` and optionally `resourceTitleString`.
      resourceTitle: "resourceTitle",
      // A resource title marker (`"`, `'`, `(`, or `)`).
      resourceTitleMarker: "resourceTitleMarker",
      // Resource destination title (`alpha`).
      // Includes string.
      resourceTitleString: "resourceTitleString",
      // Whole setext heading:
      //
      // ```markdown
      // alpha
      // bravo
      // =====
      // ```
      //
      // Includes `setextHeadingText`, `lineEnding`, `linePrefix`, and
      // `setextHeadingLine`.
      setextHeading: "setextHeading",
      // Content in a setext heading (`alpha\nbravo`).
      // Includes text.
      setextHeadingText: "setextHeadingText",
      // Underline in a setext heading, including whitespace suffix (`==`).
      // Includes `setextHeadingLineSequence`.
      setextHeadingLine: "setextHeadingLine",
      // Sequence of equals or dash characters in underline in a setext heading (`-`).
      setextHeadingLineSequence: "setextHeadingLineSequence",
      // Strong (`**alpha**`).
      // Includes `strongSequence` and `strongText`.
      strong: "strong",
      // Sequence of strong markers (`**` or `__`).
      strongSequence: "strongSequence",
      // Strong text (`alpha`).
      // Includes text.
      strongText: "strongText",
      // Whole thematic break:
      //
      // ```markdown
      // * * *
      // ```
      //
      // Includes `thematicBreakSequence` and `whitespace`.
      thematicBreak: "thematicBreak",
      // A sequence of one or more thematic break markers (`***`).
      thematicBreakSequence: "thematicBreakSequence",
      // Whole block quote:
      //
      // ```markdown
      // > a
      // >
      // > b
      // ```
      //
      // Includes `blockQuotePrefix` and flow.
      blockQuote: "blockQuote",
      // The `>` or `> ` of a block quote.
      blockQuotePrefix: "blockQuotePrefix",
      // The `>` of a block quote prefix.
      blockQuoteMarker: "blockQuoteMarker",
      // The optional ` ` of a block quote prefix.
      blockQuotePrefixWhitespace: "blockQuotePrefixWhitespace",
      // Whole ordered list:
      //
      // ```markdown
      // 1. a
      //    b
      // ```
      //
      // Includes `listItemPrefix`, flow, and optionally  `listItemIndent` on further
      // lines.
      listOrdered: "listOrdered",
      // Whole unordered list:
      //
      // ```markdown
      // - a
      //   b
      // ```
      //
      // Includes `listItemPrefix`, flow, and optionally  `listItemIndent` on further
      // lines.
      listUnordered: "listUnordered",
      // The indent of further list item lines.
      listItemIndent: "listItemIndent",
      // A marker, as in, `*`, `+`, `-`, `.`, or `)`.
      listItemMarker: "listItemMarker",
      // The thing that starts a list item, such as `1. `.
      // Includes `listItemValue` if ordered, `listItemMarker`, and
      // `listItemPrefixWhitespace` (unless followed by a line ending).
      listItemPrefix: "listItemPrefix",
      // The whitespace after a marker.
      listItemPrefixWhitespace: "listItemPrefixWhitespace",
      // The numerical value of an ordered item.
      listItemValue: "listItemValue",
      // Internal types used for subtokenizers, compiled away
      chunkDocument: "chunkDocument",
      chunkContent: "chunkContent",
      chunkFlow: "chunkFlow",
      chunkText: "chunkText",
      chunkString: "chunkString"
    };
  }
});

// node_modules/micromark-util-symbol/lib/default.js
var init_default = __esm({
  "node_modules/micromark-util-symbol/lib/default.js"() {
    init_codes();
    init_constants();
    init_types();
  }
});

// node_modules/devlop/lib/default.js
function ok() {
}
var init_default2 = __esm({
  "node_modules/devlop/lib/default.js"() {
  }
});

// node_modules/get-east-asian-width/lookup-data.js
var ambiguousMinimalCodePoint, ambiguousMaximumCodePoint, ambiguousRanges, fullwidthMinimalCodePoint, fullwidthMaximumCodePoint, fullwidthRanges, halfwidthMinimalCodePoint, halfwidthMaximumCodePoint, halfwidthRanges, narrowMinimalCodePoint, narrowMaximumCodePoint, narrowRanges, wideMinimalCodePoint, wideMaximumCodePoint, wideRanges;
var init_lookup_data = __esm({
  "node_modules/get-east-asian-width/lookup-data.js"() {
    ambiguousMinimalCodePoint = 161;
    ambiguousMaximumCodePoint = 1114109;
    ambiguousRanges = [161, 161, 164, 164, 167, 168, 170, 170, 173, 174, 176, 180, 182, 186, 188, 191, 198, 198, 208, 208, 215, 216, 222, 225, 230, 230, 232, 234, 236, 237, 240, 240, 242, 243, 247, 250, 252, 252, 254, 254, 257, 257, 273, 273, 275, 275, 283, 283, 294, 295, 299, 299, 305, 307, 312, 312, 319, 322, 324, 324, 328, 331, 333, 333, 338, 339, 358, 359, 363, 363, 462, 462, 464, 464, 466, 466, 468, 468, 470, 470, 472, 472, 474, 474, 476, 476, 593, 593, 609, 609, 708, 708, 711, 711, 713, 715, 717, 717, 720, 720, 728, 731, 733, 733, 735, 735, 768, 879, 913, 929, 931, 937, 945, 961, 963, 969, 1025, 1025, 1040, 1103, 1105, 1105, 8208, 8208, 8211, 8214, 8216, 8217, 8220, 8221, 8224, 8226, 8228, 8231, 8240, 8240, 8242, 8243, 8245, 8245, 8251, 8251, 8254, 8254, 8308, 8308, 8319, 8319, 8321, 8324, 8364, 8364, 8451, 8451, 8453, 8453, 8457, 8457, 8467, 8467, 8470, 8470, 8481, 8482, 8486, 8486, 8491, 8491, 8531, 8532, 8539, 8542, 8544, 8555, 8560, 8569, 8585, 8585, 8592, 8601, 8632, 8633, 8658, 8658, 8660, 8660, 8679, 8679, 8704, 8704, 8706, 8707, 8711, 8712, 8715, 8715, 8719, 8719, 8721, 8721, 8725, 8725, 8730, 8730, 8733, 8736, 8739, 8739, 8741, 8741, 8743, 8748, 8750, 8750, 8756, 8759, 8764, 8765, 8776, 8776, 8780, 8780, 8786, 8786, 8800, 8801, 8804, 8807, 8810, 8811, 8814, 8815, 8834, 8835, 8838, 8839, 8853, 8853, 8857, 8857, 8869, 8869, 8895, 8895, 8978, 8978, 9312, 9449, 9451, 9547, 9552, 9587, 9600, 9615, 9618, 9621, 9632, 9633, 9635, 9641, 9650, 9651, 9654, 9655, 9660, 9661, 9664, 9665, 9670, 9672, 9675, 9675, 9678, 9681, 9698, 9701, 9711, 9711, 9733, 9734, 9737, 9737, 9742, 9743, 9756, 9756, 9758, 9758, 9792, 9792, 9794, 9794, 9824, 9825, 9827, 9829, 9831, 9834, 9836, 9837, 9839, 9839, 9886, 9887, 9919, 9919, 9926, 9933, 9935, 9939, 9941, 9953, 9955, 9955, 9960, 9961, 9963, 9969, 9972, 9972, 9974, 9977, 9979, 9980, 9982, 9983, 10045, 10045, 10102, 10111, 11094, 11097, 12872, 12879, 57344, 63743, 65024, 65039, 65533, 65533, 127232, 127242, 127248, 127277, 127280, 127337, 127344, 127373, 127375, 127376, 127387, 127404, 917760, 917999, 983040, 1048573, 1048576, 1114109];
    fullwidthMinimalCodePoint = 12288;
    fullwidthMaximumCodePoint = 65510;
    fullwidthRanges = [12288, 12288, 65281, 65376, 65504, 65510];
    halfwidthMinimalCodePoint = 8361;
    halfwidthMaximumCodePoint = 65518;
    halfwidthRanges = [8361, 8361, 65377, 65470, 65474, 65479, 65482, 65487, 65490, 65495, 65498, 65500, 65512, 65518];
    narrowMinimalCodePoint = 32;
    narrowMaximumCodePoint = 10630;
    narrowRanges = [32, 126, 162, 163, 165, 166, 172, 172, 175, 175, 10214, 10221, 10629, 10630];
    wideMinimalCodePoint = 4352;
    wideMaximumCodePoint = 262141;
    wideRanges = [4352, 4447, 8986, 8987, 9001, 9002, 9193, 9196, 9200, 9200, 9203, 9203, 9725, 9726, 9748, 9749, 9776, 9783, 9800, 9811, 9855, 9855, 9866, 9871, 9875, 9875, 9889, 9889, 9898, 9899, 9917, 9918, 9924, 9925, 9934, 9934, 9940, 9940, 9962, 9962, 9970, 9971, 9973, 9973, 9978, 9978, 9981, 9981, 9989, 9989, 9994, 9995, 10024, 10024, 10060, 10060, 10062, 10062, 10067, 10069, 10071, 10071, 10133, 10135, 10160, 10160, 10175, 10175, 11035, 11036, 11088, 11088, 11093, 11093, 11904, 11929, 11931, 12019, 12032, 12245, 12272, 12287, 12289, 12350, 12353, 12438, 12441, 12543, 12549, 12591, 12593, 12686, 12688, 12773, 12783, 12830, 12832, 12871, 12880, 42124, 42128, 42182, 43360, 43388, 44032, 55203, 63744, 64255, 65040, 65049, 65072, 65106, 65108, 65126, 65128, 65131, 94176, 94180, 94192, 94198, 94208, 101594, 101631, 101664, 101760, 101874, 101888, 102801, 102816, 102866, 110576, 110579, 110581, 110587, 110589, 110590, 110592, 110888, 110898, 110898, 110928, 110930, 110933, 110933, 110948, 110952, 110960, 111355, 119552, 119638, 119648, 119670, 126980, 126980, 127183, 127183, 127374, 127374, 127377, 127386, 127406, 127406, 127488, 127490, 127504, 127547, 127552, 127560, 127568, 127569, 127584, 127589, 127744, 127776, 127789, 127797, 127799, 127868, 127870, 127891, 127904, 127946, 127951, 127955, 127968, 127984, 127988, 127988, 127992, 128062, 128064, 128064, 128066, 128252, 128255, 128317, 128331, 128334, 128336, 128359, 128378, 128378, 128405, 128406, 128420, 128420, 128507, 128591, 128640, 128709, 128716, 128716, 128720, 128722, 128725, 128729, 128732, 128735, 128747, 128748, 128756, 128764, 128986, 128986, 128992, 129003, 129008, 129008, 129292, 129338, 129340, 129349, 129351, 129535, 129648, 129660, 129664, 129734, 129736, 129736, 129740, 129757, 129759, 129771, 129775, 129786, 131072, 196605, 196608, 262141];
  }
});

// node_modules/get-east-asian-width/utilities.js
var isInRange;
var init_utilities = __esm({
  "node_modules/get-east-asian-width/utilities.js"() {
    isInRange = (ranges, codePoint) => {
      let low = 0;
      let high = Math.floor(ranges.length / 2) - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const i = mid * 2;
        if (codePoint < ranges[i]) {
          high = mid - 1;
        } else if (codePoint > ranges[i + 1]) {
          low = mid + 1;
        } else {
          return true;
        }
      }
      return false;
    };
  }
});

// node_modules/get-east-asian-width/lookup.js
function findWideFastPathRange(ranges) {
  let fastPathStart = ranges[0];
  let fastPathEnd = ranges[1];
  for (let index2 = 0; index2 < ranges.length; index2 += 2) {
    const start = ranges[index2];
    const end = ranges[index2 + 1];
    if (commonCjkCodePoint >= start && commonCjkCodePoint <= end) {
      return [start, end];
    }
    if (end - start > fastPathEnd - fastPathStart) {
      fastPathStart = start;
      fastPathEnd = end;
    }
  }
  return [fastPathStart, fastPathEnd];
}
function getCategory(codePoint) {
  if (isAmbiguous(codePoint)) {
    return "ambiguous";
  }
  if (isFullwidth(codePoint)) {
    return "fullwidth";
  }
  if (isHalfwidth(codePoint)) {
    return "halfwidth";
  }
  if (isNarrow(codePoint)) {
    return "narrow";
  }
  if (isWide(codePoint)) {
    return "wide";
  }
  return "neutral";
}
var commonCjkCodePoint, wideFastPathStart, wideFastPathEnd, isAmbiguous, isFullwidth, isHalfwidth, isNarrow, isWide;
var init_lookup = __esm({
  "node_modules/get-east-asian-width/lookup.js"() {
    init_lookup_data();
    init_utilities();
    commonCjkCodePoint = 19968;
    [wideFastPathStart, wideFastPathEnd] = /* @__PURE__ */ findWideFastPathRange(wideRanges);
    isAmbiguous = (codePoint) => {
      if (codePoint < ambiguousMinimalCodePoint || codePoint > ambiguousMaximumCodePoint) {
        return false;
      }
      return isInRange(ambiguousRanges, codePoint);
    };
    isFullwidth = (codePoint) => {
      if (codePoint < fullwidthMinimalCodePoint || codePoint > fullwidthMaximumCodePoint) {
        return false;
      }
      return isInRange(fullwidthRanges, codePoint);
    };
    isHalfwidth = (codePoint) => {
      if (codePoint < halfwidthMinimalCodePoint || codePoint > halfwidthMaximumCodePoint) {
        return false;
      }
      return isInRange(halfwidthRanges, codePoint);
    };
    isNarrow = (codePoint) => {
      if (codePoint < narrowMinimalCodePoint || codePoint > narrowMaximumCodePoint) {
        return false;
      }
      return isInRange(narrowRanges, codePoint);
    };
    isWide = (codePoint) => {
      if (codePoint >= wideFastPathStart && codePoint <= wideFastPathEnd) {
        return true;
      }
      if (codePoint < wideMinimalCodePoint || codePoint > wideMaximumCodePoint) {
        return false;
      }
      return isInRange(wideRanges, codePoint);
    };
  }
});

// node_modules/get-east-asian-width/index.js
function validate(codePoint) {
  if (!Number.isSafeInteger(codePoint)) {
    throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
  }
}
function eastAsianWidthType(codePoint) {
  validate(codePoint);
  return getCategory(codePoint);
}
var init_get_east_asian_width = __esm({
  "node_modules/get-east-asian-width/index.js"() {
    init_lookup();
  }
});

// node_modules/micromark-extension-cjk-friendly-util/dist/characterWithNonBmp.js
function isEmoji(uc) {
  return /^\p{Emoji_Presentation}/u.test(String.fromCodePoint(uc));
}
function cjkOrIvs(uc) {
  if (!uc || uc < 4352) return false;
  switch (eastAsianWidthType(uc)) {
    case "fullwidth":
    case "halfwidth":
      return true;
    case "wide":
      return !isEmoji(uc);
    case "narrow":
      return false;
    case "ambiguous":
      return 917760 <= uc && uc <= 917999 ? null : false;
    case "neutral":
      return /^\p{sc=Hangul}/u.test(String.fromCodePoint(uc));
  }
}
function isCjkAmbiguousPunctuation(main, vs) {
  if (vs !== 65025 || !main || main < 8216) return false;
  return main === 8216 || main === 8217 || main === 8220 || main === 8221;
}
function nonEmojiGeneralUseVS(code2) {
  return code2 !== null && code2 >= 65024 && code2 <= 65038;
}
function regexCheck2(regex) {
  return check;
  function check(code2) {
    return code2 !== null && code2 > -1 && regex.test(String.fromCodePoint(code2));
  }
}
var unicodePunctuation2, unicodeWhitespace2;
var init_characterWithNonBmp = __esm({
  "node_modules/micromark-extension-cjk-friendly-util/dist/characterWithNonBmp.js"() {
    init_get_east_asian_width();
    unicodePunctuation2 = regexCheck2(/\p{P}|\p{S}/u);
    unicodeWhitespace2 = regexCheck2(/\s/);
  }
});

// node_modules/micromark-extension-cjk-friendly-util/dist/categoryUtil.js
function isUnicodeWhitespace(category) {
  return Boolean(category & constants.characterGroupWhitespace);
}
function isNonCjkPunctuation(category) {
  return (category & constantsEx.cjkPunctuation) === constants.characterGroupPunctuation;
}
function isCjk(category) {
  return Boolean(category & constantsEx.cjk);
}
function isCjkOrIvs(category) {
  return Boolean(category & constantsEx.cjkOrIvs);
}
function isNonEmojiGeneralUseVS(category) {
  return category === constantsEx.nonEmojiGeneralUseVS;
}
function isSpaceOrPunctuation(category) {
  return Boolean(category & constantsEx.spaceOrPunctuation);
}
var init_categoryUtil = __esm({
  "node_modules/micromark-extension-cjk-friendly-util/dist/categoryUtil.js"() {
    init_classifyCharacter();
    init_default();
  }
});

// node_modules/micromark-extension-cjk-friendly-util/dist/classifyCharacter.js
function classifyCharacter2(code2) {
  if (code2 === codes.eof || markdownLineEndingOrSpace(code2) || unicodeWhitespace2(code2)) return constants.characterGroupWhitespace;
  let value = 0;
  if (code2 >= 4352) {
    if (nonEmojiGeneralUseVS(code2)) return constantsEx.nonEmojiGeneralUseVS;
    switch (cjkOrIvs(code2)) {
      case null:
        return constantsEx.ivs;
      case true:
        value |= constantsEx.cjk;
        break;
    }
  }
  if (unicodePunctuation2(code2)) value |= constants.characterGroupPunctuation;
  return value;
}
function classifyPrecedingCharacter(before, get2Previous, previous4) {
  if (!isNonEmojiGeneralUseVS(before)) return before;
  const twoPrevious = get2Previous();
  const twoBefore = classifyCharacter2(twoPrevious);
  return !twoPrevious || isUnicodeWhitespace(twoBefore) ? before : isCjkAmbiguousPunctuation(twoPrevious, previous4) ? constantsEx.cjkPunctuation : stripIvs(twoBefore);
}
function stripIvs(twoBefore) {
  return twoBefore & ~constantsEx.ivs;
}
var constantsEx;
var init_classifyCharacter = __esm({
  "node_modules/micromark-extension-cjk-friendly-util/dist/classifyCharacter.js"() {
    init_characterWithNonBmp();
    init_categoryUtil();
    init_default();
    init_micromark_util_character();
    (function(_constantsEx) {
      _constantsEx.spaceOrPunctuation = 3;
      _constantsEx.cjk = 4096;
      _constantsEx.cjkPunctuation = 4098;
      _constantsEx.ivs = 8192;
      _constantsEx.cjkOrIvs = 12288;
      _constantsEx.nonEmojiGeneralUseVS = 16384;
      _constantsEx.variationSelector = 24576;
      _constantsEx.ivsToCjkRightShift = 1;
    })(constantsEx || (constantsEx = {}));
  }
});

// node_modules/micromark-extension-cjk-friendly-util/dist/codeUtil.js
function isCodeHighSurrogate(code2) {
  return Boolean(code2 && code2 >= 55296 && code2 <= 56319);
}
function isCodeLowSurrogate(code2) {
  return Boolean(code2 && code2 >= 56320 && code2 <= 57343);
}
function tryGetGenuinePreviousCode(code2, nowPoint, sliceSerialize) {
  if (nowPoint._bufferIndex < 2) return code2;
  const previousCandidate = sliceSerialize({
    start: {
      ...nowPoint,
      _bufferIndex: nowPoint._bufferIndex - 2
    },
    end: nowPoint
  }).codePointAt(0);
  return previousCandidate && previousCandidate >= 65536 ? previousCandidate : code2;
}
function tryGetCodeTwoBefore(previousCode, nowPoint, sliceSerialize) {
  const previousWidth = previousCode >= 65536 ? 2 : 1;
  if (nowPoint._bufferIndex < 1 + previousWidth) return null;
  const idealStart = nowPoint._bufferIndex - previousWidth - 2;
  const twoPreviousBuffer = sliceSerialize({
    start: {
      ...nowPoint,
      _bufferIndex: idealStart >= 0 ? idealStart : 0
    },
    end: {
      ...nowPoint,
      _bufferIndex: nowPoint._bufferIndex - previousWidth
    }
  });
  const twoPreviousLast = twoPreviousBuffer.charCodeAt(twoPreviousBuffer.length - 1);
  if (Number.isNaN(twoPreviousLast)) return null;
  if (twoPreviousBuffer.length < 2 || twoPreviousLast < 56320 || 57343 < twoPreviousLast) return twoPreviousLast;
  const twoPreviousCandidate = twoPreviousBuffer.codePointAt(0);
  if (twoPreviousCandidate && twoPreviousCandidate >= 65536) return twoPreviousCandidate;
  return twoPreviousLast;
}
function tryGetGenuineNextCode(code2, nowPoint, sliceSerialize) {
  const nextCandidate = sliceSerialize({
    start: nowPoint,
    end: {
      ...nowPoint,
      _bufferIndex: nowPoint._bufferIndex + 2
    }
  }).codePointAt(0);
  return nextCandidate && nextCandidate >= 65536 ? nextCandidate : code2;
}
var TwoPreviousCode;
var init_codeUtil = __esm({
  "node_modules/micromark-extension-cjk-friendly-util/dist/codeUtil.js"() {
    TwoPreviousCode = class {
      cachedValue = void 0;
      /**
      * @see {@link tryGetCodeTwoBefore}
      *
      * @param previousCode a previous code point. Should be greater than 65,535 if it represents a [Supplementary Character](https://www.unicode.org/glossary/#supplementary_character).
      * @param nowPoint `this.now()` (`this` = `TokenizeContext`)
      * @param sliceSerialize `this.sliceSerialize` (`this` = `TokenizeContext`)
      */
      constructor(previousCode, nowPoint, sliceSerialize) {
        this.previousCode = previousCode;
        this.nowPoint = nowPoint;
        this.sliceSerialize = sliceSerialize;
      }
      /**
      * Returns the return value of {@link tryGetCodeTwoBefore}.
      *
      * If the value has not been computed yet, it will be computed and cached.
      *
      * @see {@link tryGetCodeTwoBefore}
      *
      * @returns a value greater than 65,535 if the code point two positions before represents a [Supplementary Character](https://www.unicode.org/glossary/#supplementary_character), a value less than 65,536 for a [BMP Character](https://www.unicode.org/glossary/#bmp_character), or `null` if not found
      */
      value() {
        if (this.cachedValue === void 0) this.cachedValue = tryGetCodeTwoBefore(this.previousCode, this.nowPoint, this.sliceSerialize);
        return this.cachedValue;
      }
    };
  }
});

// node_modules/micromark-extension-cjk-friendly-util/dist/index.js
var init_dist = __esm({
  "node_modules/micromark-extension-cjk-friendly-util/dist/index.js"() {
    init_classifyCharacter();
    init_categoryUtil();
    init_codeUtil();
  }
});

// node_modules/micromark-extension-cjk-friendly/dist/ext/attention.js
function resolveAllAttention2(events, context) {
  let index2 = -1;
  let open;
  let group;
  let text4;
  let openingSequence;
  let closingSequence;
  let use;
  let nextEvents;
  let offset;
  while (++index2 < events.length) if (events[index2][0] === "enter" && events[index2][1].type === "attentionSequence" && events[index2][1]._close) {
    open = index2;
    while (open--) if (events[open][0] === "exit" && events[open][1].type === "attentionSequence" && events[open][1]._open && context.sliceSerialize(events[open][1]).charCodeAt(0) === context.sliceSerialize(events[index2][1]).charCodeAt(0)) {
      if ((events[open][1]._close || events[index2][1]._open) && (events[index2][1].end.offset - events[index2][1].start.offset) % 3 && !((events[open][1].end.offset - events[open][1].start.offset + events[index2][1].end.offset - events[index2][1].start.offset) % 3)) continue;
      use = events[open][1].end.offset - events[open][1].start.offset > 1 && events[index2][1].end.offset - events[index2][1].start.offset > 1 ? 2 : 1;
      const start = { ...events[open][1].end };
      const end = { ...events[index2][1].start };
      movePoint2(start, -use);
      movePoint2(end, use);
      openingSequence = {
        type: use > 1 ? types.strongSequence : types.emphasisSequence,
        start,
        end: { ...events[open][1].end }
      };
      closingSequence = {
        type: use > 1 ? types.strongSequence : types.emphasisSequence,
        start: { ...events[index2][1].start },
        end
      };
      text4 = {
        type: use > 1 ? types.strongText : types.emphasisText,
        start: { ...events[open][1].end },
        end: { ...events[index2][1].start }
      };
      group = {
        type: use > 1 ? types.strong : types.emphasis,
        start: { ...openingSequence.start },
        end: { ...closingSequence.end }
      };
      events[open][1].end = { ...openingSequence.start };
      events[index2][1].start = { ...closingSequence.end };
      nextEvents = [];
      if (events[open][1].end.offset - events[open][1].start.offset) nextEvents = push(nextEvents, [[
        "enter",
        events[open][1],
        context
      ], [
        "exit",
        events[open][1],
        context
      ]]);
      nextEvents = push(nextEvents, [
        [
          "enter",
          group,
          context
        ],
        [
          "enter",
          openingSequence,
          context
        ],
        [
          "exit",
          openingSequence,
          context
        ],
        [
          "enter",
          text4,
          context
        ]
      ]);
      ok(context.parser.constructs.insideSpan.null, "expected `insideSpan` to be populated");
      nextEvents = push(nextEvents, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + 1, index2), context));
      nextEvents = push(nextEvents, [
        [
          "exit",
          text4,
          context
        ],
        [
          "enter",
          closingSequence,
          context
        ],
        [
          "exit",
          closingSequence,
          context
        ],
        [
          "exit",
          group,
          context
        ]
      ]);
      if (events[index2][1].end.offset - events[index2][1].start.offset) {
        offset = 2;
        nextEvents = push(nextEvents, [[
          "enter",
          events[index2][1],
          context
        ], [
          "exit",
          events[index2][1],
          context
        ]]);
      } else offset = 0;
      splice(events, open - 1, index2 - open + 3, nextEvents);
      index2 = open + nextEvents.length - offset - 2;
      break;
    }
  }
  index2 = -1;
  while (++index2 < events.length) if (events[index2][1].type === "attentionSequence") events[index2][1].type = "data";
  return events;
}
function tokenizeAttention2(effects, ok$1) {
  const attentionMarkers2 = this.parser.constructs.attentionMarkers.null;
  const { now, sliceSerialize, previous: tentativePrevious } = this;
  const previous4 = isCodeLowSurrogate(tentativePrevious) ? tryGetGenuinePreviousCode(tentativePrevious, now(), sliceSerialize) : tentativePrevious;
  const before = classifyCharacter2(previous4);
  const twoPrevious = new TwoPreviousCode(previous4, now(), sliceSerialize);
  const beforePrimary = classifyPrecedingCharacter(before, twoPrevious.value.bind(twoPrevious), previous4);
  let marker;
  return start;
  function start(code2) {
    ok(code2 === codes.asterisk || code2 === codes.underscore, "expected asterisk or underscore");
    marker = code2;
    effects.enter("attentionSequence");
    return inside(code2);
  }
  function inside(code2) {
    if (code2 === marker) {
      effects.consume(code2);
      return inside;
    }
    const token = effects.exit("attentionSequence");
    const next = isCodeHighSurrogate(code2) ? tryGetGenuineNextCode(code2, now(), sliceSerialize) : code2;
    const after = classifyCharacter2(next);
    ok(attentionMarkers2, "expected `attentionMarkers` to be populated");
    const beforeNonCjkPunctuation = isNonCjkPunctuation(beforePrimary);
    const beforeCoreAttentionMarker = previous4 === codes.asterisk || previous4 === codes.underscore;
    const beforeSpaceOrNonCjkPunctuation = beforeNonCjkPunctuation || isUnicodeWhitespace(beforePrimary) || beforeCoreAttentionMarker;
    const afterNonCjkPunctuation = isNonCjkPunctuation(after);
    const afterCoreAttentionMarker = code2 === codes.asterisk || code2 === codes.underscore;
    const afterSpaceOrNonCjkPunctuation = afterNonCjkPunctuation || isUnicodeWhitespace(after) || afterCoreAttentionMarker;
    const beforeCjkOrIvs = isCjkOrIvs(beforePrimary);
    const open = !afterSpaceOrNonCjkPunctuation || afterNonCjkPunctuation && (beforeSpaceOrNonCjkPunctuation || beforeCjkOrIvs) || attentionMarkers2.includes(code2) && code2 !== codes.asterisk && code2 !== codes.underscore;
    const close = !beforeSpaceOrNonCjkPunctuation || beforeNonCjkPunctuation && (afterSpaceOrNonCjkPunctuation || isCjk(after)) || attentionMarkers2.includes(previous4) && previous4 !== codes.asterisk && previous4 !== codes.underscore;
    token._open = Boolean(marker === codes.asterisk ? open : open && (isSpaceOrPunctuation(beforePrimary) || !close));
    token._close = Boolean(marker === codes.asterisk ? close : close && (isSpaceOrPunctuation(after) || !open));
    return ok$1(code2);
  }
}
function movePoint2(point3, offset) {
  point3.column += offset;
  point3.offset += offset;
  point3._bufferIndex += offset;
}
var attention2;
var init_attention2 = __esm({
  "node_modules/micromark-extension-cjk-friendly/dist/ext/attention.js"() {
    init_default();
    init_default2();
    init_dist();
    init_micromark_util_chunked();
    init_micromark_util_resolve_all();
    attention2 = {
      name: "attention",
      resolveAll: resolveAllAttention2,
      tokenize: tokenizeAttention2
    };
  }
});

// node_modules/micromark-extension-cjk-friendly/dist/index.js
function cjkFriendlyExtension() {
  return {
    text: {
      [codes.asterisk]: attention2,
      [codes.underscore]: attention2
    },
    insideSpan: { null: [attention2] }
  };
}
var init_dist2 = __esm({
  "node_modules/micromark-extension-cjk-friendly/dist/index.js"() {
    init_attention2();
    init_default();
  }
});

// node_modules/micromark-extension-gfm-autolink-literal/lib/syntax.js
function gfmAutolinkLiteral() {
  return {
    text: text3
  };
}
function tokenizeEmailAutolink(effects, ok3, nok) {
  const self = this;
  let dot;
  let data;
  return start;
  function start(code2) {
    if (!gfmAtext(code2) || !previousEmail.call(self, self.previous) || previousUnbalanced(self.events)) {
      return nok(code2);
    }
    effects.enter("literalAutolink");
    effects.enter("literalAutolinkEmail");
    return atext(code2);
  }
  function atext(code2) {
    if (gfmAtext(code2)) {
      effects.consume(code2);
      return atext;
    }
    if (code2 === 64) {
      effects.consume(code2);
      return emailDomain;
    }
    return nok(code2);
  }
  function emailDomain(code2) {
    if (code2 === 46) {
      return effects.check(emailDomainDotTrail, emailDomainAfter, emailDomainDot)(code2);
    }
    if (code2 === 45 || code2 === 95 || asciiAlphanumeric(code2)) {
      data = true;
      effects.consume(code2);
      return emailDomain;
    }
    return emailDomainAfter(code2);
  }
  function emailDomainDot(code2) {
    effects.consume(code2);
    dot = true;
    return emailDomain;
  }
  function emailDomainAfter(code2) {
    if (data && dot && asciiAlpha(self.previous)) {
      effects.exit("literalAutolinkEmail");
      effects.exit("literalAutolink");
      return ok3(code2);
    }
    return nok(code2);
  }
}
function tokenizeWwwAutolink(effects, ok3, nok) {
  const self = this;
  return wwwStart;
  function wwwStart(code2) {
    if (code2 !== 87 && code2 !== 119 || !previousWww.call(self, self.previous) || previousUnbalanced(self.events)) {
      return nok(code2);
    }
    effects.enter("literalAutolink");
    effects.enter("literalAutolinkWww");
    return effects.check(wwwPrefix, effects.attempt(domain, effects.attempt(path, wwwAfter), nok), nok)(code2);
  }
  function wwwAfter(code2) {
    effects.exit("literalAutolinkWww");
    effects.exit("literalAutolink");
    return ok3(code2);
  }
}
function tokenizeProtocolAutolink(effects, ok3, nok) {
  const self = this;
  let buffer = "";
  let seen = false;
  return protocolStart;
  function protocolStart(code2) {
    if ((code2 === 72 || code2 === 104) && previousProtocol.call(self, self.previous) && !previousUnbalanced(self.events)) {
      effects.enter("literalAutolink");
      effects.enter("literalAutolinkHttp");
      buffer += String.fromCodePoint(code2);
      effects.consume(code2);
      return protocolPrefixInside;
    }
    return nok(code2);
  }
  function protocolPrefixInside(code2) {
    if (asciiAlpha(code2) && buffer.length < 5) {
      buffer += String.fromCodePoint(code2);
      effects.consume(code2);
      return protocolPrefixInside;
    }
    if (code2 === 58) {
      const protocol = buffer.toLowerCase();
      if (protocol === "http" || protocol === "https") {
        effects.consume(code2);
        return protocolSlashesInside;
      }
    }
    return nok(code2);
  }
  function protocolSlashesInside(code2) {
    if (code2 === 47) {
      effects.consume(code2);
      if (seen) {
        return afterProtocol;
      }
      seen = true;
      return protocolSlashesInside;
    }
    return nok(code2);
  }
  function afterProtocol(code2) {
    return code2 === null || asciiControl(code2) || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2) || unicodePunctuation(code2) ? nok(code2) : effects.attempt(domain, effects.attempt(path, protocolAfter), nok)(code2);
  }
  function protocolAfter(code2) {
    effects.exit("literalAutolinkHttp");
    effects.exit("literalAutolink");
    return ok3(code2);
  }
}
function tokenizeWwwPrefix(effects, ok3, nok) {
  let size = 0;
  return wwwPrefixInside;
  function wwwPrefixInside(code2) {
    if ((code2 === 87 || code2 === 119) && size < 3) {
      size++;
      effects.consume(code2);
      return wwwPrefixInside;
    }
    if (code2 === 46 && size === 3) {
      effects.consume(code2);
      return wwwPrefixAfter;
    }
    return nok(code2);
  }
  function wwwPrefixAfter(code2) {
    return code2 === null ? nok(code2) : ok3(code2);
  }
}
function tokenizeDomain(effects, ok3, nok) {
  let underscoreInLastSegment;
  let underscoreInLastLastSegment;
  let seen;
  return domainInside;
  function domainInside(code2) {
    if (code2 === 46 || code2 === 95) {
      return effects.check(trail, domainAfter, domainAtPunctuation)(code2);
    }
    if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2) || code2 !== 45 && unicodePunctuation(code2)) {
      return domainAfter(code2);
    }
    seen = true;
    effects.consume(code2);
    return domainInside;
  }
  function domainAtPunctuation(code2) {
    if (code2 === 95) {
      underscoreInLastSegment = true;
    } else {
      underscoreInLastLastSegment = underscoreInLastSegment;
      underscoreInLastSegment = void 0;
    }
    effects.consume(code2);
    return domainInside;
  }
  function domainAfter(code2) {
    if (underscoreInLastLastSegment || underscoreInLastSegment || !seen) {
      return nok(code2);
    }
    return ok3(code2);
  }
}
function tokenizePath(effects, ok3) {
  let sizeOpen = 0;
  let sizeClose = 0;
  return pathInside;
  function pathInside(code2) {
    if (code2 === 40) {
      sizeOpen++;
      effects.consume(code2);
      return pathInside;
    }
    if (code2 === 41 && sizeClose < sizeOpen) {
      return pathAtPunctuation(code2);
    }
    if (code2 === 33 || code2 === 34 || code2 === 38 || code2 === 39 || code2 === 41 || code2 === 42 || code2 === 44 || code2 === 46 || code2 === 58 || code2 === 59 || code2 === 60 || code2 === 63 || code2 === 93 || code2 === 95 || code2 === 126) {
      return effects.check(trail, ok3, pathAtPunctuation)(code2);
    }
    if (code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
      return ok3(code2);
    }
    effects.consume(code2);
    return pathInside;
  }
  function pathAtPunctuation(code2) {
    if (code2 === 41) {
      sizeClose++;
    }
    effects.consume(code2);
    return pathInside;
  }
}
function tokenizeTrail(effects, ok3, nok) {
  return trail2;
  function trail2(code2) {
    if (code2 === 33 || code2 === 34 || code2 === 39 || code2 === 41 || code2 === 42 || code2 === 44 || code2 === 46 || code2 === 58 || code2 === 59 || code2 === 63 || code2 === 95 || code2 === 126) {
      effects.consume(code2);
      return trail2;
    }
    if (code2 === 38) {
      effects.consume(code2);
      return trailCharacterReferenceStart;
    }
    if (code2 === 93) {
      effects.consume(code2);
      return trailBracketAfter;
    }
    if (
      // `<` is an end.
      code2 === 60 || // So is whitespace.
      code2 === null || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)
    ) {
      return ok3(code2);
    }
    return nok(code2);
  }
  function trailBracketAfter(code2) {
    if (code2 === null || code2 === 40 || code2 === 91 || markdownLineEndingOrSpace(code2) || unicodeWhitespace(code2)) {
      return ok3(code2);
    }
    return trail2(code2);
  }
  function trailCharacterReferenceStart(code2) {
    return asciiAlpha(code2) ? trailCharacterReferenceInside(code2) : nok(code2);
  }
  function trailCharacterReferenceInside(code2) {
    if (code2 === 59) {
      effects.consume(code2);
      return trail2;
    }
    if (asciiAlpha(code2)) {
      effects.consume(code2);
      return trailCharacterReferenceInside;
    }
    return nok(code2);
  }
}
function tokenizeEmailDomainDotTrail(effects, ok3, nok) {
  return start;
  function start(code2) {
    effects.consume(code2);
    return after;
  }
  function after(code2) {
    return asciiAlphanumeric(code2) ? nok(code2) : ok3(code2);
  }
}
function previousWww(code2) {
  return code2 === null || code2 === 40 || code2 === 42 || code2 === 95 || code2 === 91 || code2 === 93 || code2 === 126 || markdownLineEndingOrSpace(code2);
}
function previousProtocol(code2) {
  return !asciiAlpha(code2);
}
function previousEmail(code2) {
  return !(code2 === 47 || gfmAtext(code2));
}
function gfmAtext(code2) {
  return code2 === 43 || code2 === 45 || code2 === 46 || code2 === 95 || asciiAlphanumeric(code2);
}
function previousUnbalanced(events) {
  let index2 = events.length;
  let result = false;
  while (index2--) {
    const token = events[index2][1];
    if ((token.type === "labelLink" || token.type === "labelImage") && !token._balanced) {
      result = true;
      break;
    }
    if (token._gfmAutolinkLiteralWalkedInto) {
      result = false;
      break;
    }
  }
  if (events.length > 0 && !result) {
    events[events.length - 1][1]._gfmAutolinkLiteralWalkedInto = true;
  }
  return result;
}
var wwwPrefix, domain, path, trail, emailDomainDotTrail, wwwAutolink, protocolAutolink, emailAutolink, text3, code;
var init_syntax = __esm({
  "node_modules/micromark-extension-gfm-autolink-literal/lib/syntax.js"() {
    init_micromark_util_character();
    wwwPrefix = {
      tokenize: tokenizeWwwPrefix,
      partial: true
    };
    domain = {
      tokenize: tokenizeDomain,
      partial: true
    };
    path = {
      tokenize: tokenizePath,
      partial: true
    };
    trail = {
      tokenize: tokenizeTrail,
      partial: true
    };
    emailDomainDotTrail = {
      tokenize: tokenizeEmailDomainDotTrail,
      partial: true
    };
    wwwAutolink = {
      name: "wwwAutolink",
      tokenize: tokenizeWwwAutolink,
      previous: previousWww
    };
    protocolAutolink = {
      name: "protocolAutolink",
      tokenize: tokenizeProtocolAutolink,
      previous: previousProtocol
    };
    emailAutolink = {
      name: "emailAutolink",
      tokenize: tokenizeEmailAutolink,
      previous: previousEmail
    };
    text3 = {};
    code = 48;
    while (code < 123) {
      text3[code] = emailAutolink;
      code++;
      if (code === 58) code = 65;
      else if (code === 91) code = 97;
    }
    text3[43] = emailAutolink;
    text3[45] = emailAutolink;
    text3[46] = emailAutolink;
    text3[95] = emailAutolink;
    text3[72] = [emailAutolink, protocolAutolink];
    text3[104] = [emailAutolink, protocolAutolink];
    text3[87] = [emailAutolink, wwwAutolink];
    text3[119] = [emailAutolink, wwwAutolink];
  }
});

// node_modules/micromark-extension-gfm-autolink-literal/index.js
var init_micromark_extension_gfm_autolink_literal = __esm({
  "node_modules/micromark-extension-gfm-autolink-literal/index.js"() {
    init_syntax();
  }
});

// node_modules/micromark-extension-gfm-footnote/lib/syntax.js
function gfmFootnote() {
  return {
    document: {
      [91]: {
        name: "gfmFootnoteDefinition",
        tokenize: tokenizeDefinitionStart,
        continuation: {
          tokenize: tokenizeDefinitionContinuation
        },
        exit: gfmFootnoteDefinitionEnd
      }
    },
    text: {
      [91]: {
        name: "gfmFootnoteCall",
        tokenize: tokenizeGfmFootnoteCall
      },
      [93]: {
        name: "gfmPotentialFootnoteCall",
        add: "after",
        tokenize: tokenizePotentialGfmFootnoteCall,
        resolveTo: resolveToPotentialGfmFootnoteCall
      }
    }
  };
}
function tokenizePotentialGfmFootnoteCall(effects, ok3, nok) {
  const self = this;
  let index2 = self.events.length;
  const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
  let labelStart;
  while (index2--) {
    const token = self.events[index2][1];
    if (token.type === "labelImage") {
      labelStart = token;
      break;
    }
    if (token.type === "gfmFootnoteCall" || token.type === "labelLink" || token.type === "label" || token.type === "image" || token.type === "link") {
      break;
    }
  }
  return start;
  function start(code2) {
    if (!labelStart || !labelStart._balanced) {
      return nok(code2);
    }
    const id = normalizeIdentifier(self.sliceSerialize({
      start: labelStart.end,
      end: self.now()
    }));
    if (id.codePointAt(0) !== 94 || !defined.includes(id.slice(1))) {
      return nok(code2);
    }
    effects.enter("gfmFootnoteCallLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallLabelMarker");
    return ok3(code2);
  }
}
function resolveToPotentialGfmFootnoteCall(events, context) {
  let index2 = events.length;
  let labelStart;
  while (index2--) {
    if (events[index2][1].type === "labelImage" && events[index2][0] === "enter") {
      labelStart = events[index2][1];
      break;
    }
  }
  events[index2 + 1][1].type = "data";
  events[index2 + 3][1].type = "gfmFootnoteCallLabelMarker";
  const call = {
    type: "gfmFootnoteCall",
    start: Object.assign({}, events[index2 + 3][1].start),
    end: Object.assign({}, events[events.length - 1][1].end)
  };
  const marker = {
    type: "gfmFootnoteCallMarker",
    start: Object.assign({}, events[index2 + 3][1].end),
    end: Object.assign({}, events[index2 + 3][1].end)
  };
  marker.end.column++;
  marker.end.offset++;
  marker.end._bufferIndex++;
  const string3 = {
    type: "gfmFootnoteCallString",
    start: Object.assign({}, marker.end),
    end: Object.assign({}, events[events.length - 1][1].start)
  };
  const chunk = {
    type: "chunkString",
    contentType: "string",
    start: Object.assign({}, string3.start),
    end: Object.assign({}, string3.end)
  };
  const replacement = [
    // Take the `labelImageMarker` (now `data`, the `!`)
    events[index2 + 1],
    events[index2 + 2],
    ["enter", call, context],
    // The `[`
    events[index2 + 3],
    events[index2 + 4],
    // The `^`.
    ["enter", marker, context],
    ["exit", marker, context],
    // Everything in between.
    ["enter", string3, context],
    ["enter", chunk, context],
    ["exit", chunk, context],
    ["exit", string3, context],
    // The ending (`]`, properly parsed and labelled).
    events[events.length - 2],
    events[events.length - 1],
    ["exit", call, context]
  ];
  events.splice(index2, events.length - index2 + 1, ...replacement);
  return events;
}
function tokenizeGfmFootnoteCall(effects, ok3, nok) {
  const self = this;
  const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
  let size = 0;
  let data;
  return start;
  function start(code2) {
    effects.enter("gfmFootnoteCall");
    effects.enter("gfmFootnoteCallLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallLabelMarker");
    return callStart;
  }
  function callStart(code2) {
    if (code2 !== 94) return nok(code2);
    effects.enter("gfmFootnoteCallMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteCallMarker");
    effects.enter("gfmFootnoteCallString");
    effects.enter("chunkString").contentType = "string";
    return callData;
  }
  function callData(code2) {
    if (
      // Too long.
      size > 999 || // Closing brace with nothing.
      code2 === 93 && !data || // Space or tab is not supported by GFM for some reason.
      // `\n` and `[` not being supported makes sense.
      code2 === null || code2 === 91 || markdownLineEndingOrSpace(code2)
    ) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit("chunkString");
      const token = effects.exit("gfmFootnoteCallString");
      if (!defined.includes(normalizeIdentifier(self.sliceSerialize(token)))) {
        return nok(code2);
      }
      effects.enter("gfmFootnoteCallLabelMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteCallLabelMarker");
      effects.exit("gfmFootnoteCall");
      return ok3;
    }
    if (!markdownLineEndingOrSpace(code2)) {
      data = true;
    }
    size++;
    effects.consume(code2);
    return code2 === 92 ? callEscape : callData;
  }
  function callEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return callData;
    }
    return callData(code2);
  }
}
function tokenizeDefinitionStart(effects, ok3, nok) {
  const self = this;
  const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
  let identifier;
  let size = 0;
  let data;
  return start;
  function start(code2) {
    effects.enter("gfmFootnoteDefinition")._container = true;
    effects.enter("gfmFootnoteDefinitionLabel");
    effects.enter("gfmFootnoteDefinitionLabelMarker");
    effects.consume(code2);
    effects.exit("gfmFootnoteDefinitionLabelMarker");
    return labelAtMarker;
  }
  function labelAtMarker(code2) {
    if (code2 === 94) {
      effects.enter("gfmFootnoteDefinitionMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteDefinitionMarker");
      effects.enter("gfmFootnoteDefinitionLabelString");
      effects.enter("chunkString").contentType = "string";
      return labelInside;
    }
    return nok(code2);
  }
  function labelInside(code2) {
    if (
      // Too long.
      size > 999 || // Closing brace with nothing.
      code2 === 93 && !data || // Space or tab is not supported by GFM for some reason.
      // `\n` and `[` not being supported makes sense.
      code2 === null || code2 === 91 || markdownLineEndingOrSpace(code2)
    ) {
      return nok(code2);
    }
    if (code2 === 93) {
      effects.exit("chunkString");
      const token = effects.exit("gfmFootnoteDefinitionLabelString");
      identifier = normalizeIdentifier(self.sliceSerialize(token));
      effects.enter("gfmFootnoteDefinitionLabelMarker");
      effects.consume(code2);
      effects.exit("gfmFootnoteDefinitionLabelMarker");
      effects.exit("gfmFootnoteDefinitionLabel");
      return labelAfter;
    }
    if (!markdownLineEndingOrSpace(code2)) {
      data = true;
    }
    size++;
    effects.consume(code2);
    return code2 === 92 ? labelEscape : labelInside;
  }
  function labelEscape(code2) {
    if (code2 === 91 || code2 === 92 || code2 === 93) {
      effects.consume(code2);
      size++;
      return labelInside;
    }
    return labelInside(code2);
  }
  function labelAfter(code2) {
    if (code2 === 58) {
      effects.enter("definitionMarker");
      effects.consume(code2);
      effects.exit("definitionMarker");
      if (!defined.includes(identifier)) {
        defined.push(identifier);
      }
      return factorySpace(effects, whitespaceAfter, "gfmFootnoteDefinitionWhitespace");
    }
    return nok(code2);
  }
  function whitespaceAfter(code2) {
    return ok3(code2);
  }
}
function tokenizeDefinitionContinuation(effects, ok3, nok) {
  return effects.check(blankLine, ok3, effects.attempt(indent, ok3, nok));
}
function gfmFootnoteDefinitionEnd(effects) {
  effects.exit("gfmFootnoteDefinition");
}
function tokenizeIndent2(effects, ok3, nok) {
  const self = this;
  return factorySpace(effects, afterPrefix, "gfmFootnoteDefinitionIndent", 4 + 1);
  function afterPrefix(code2) {
    const tail = self.events[self.events.length - 1];
    return tail && tail[1].type === "gfmFootnoteDefinitionIndent" && tail[2].sliceSerialize(tail[1], true).length === 4 ? ok3(code2) : nok(code2);
  }
}
var indent;
var init_syntax2 = __esm({
  "node_modules/micromark-extension-gfm-footnote/lib/syntax.js"() {
    init_micromark_core_commonmark();
    init_micromark_factory_space();
    init_micromark_util_character();
    init_micromark_util_normalize_identifier();
    indent = {
      tokenize: tokenizeIndent2,
      partial: true
    };
  }
});

// node_modules/micromark-extension-gfm-footnote/index.js
var init_micromark_extension_gfm_footnote = __esm({
  "node_modules/micromark-extension-gfm-footnote/index.js"() {
    init_syntax2();
  }
});

// node_modules/micromark-extension-gfm-strikethrough/lib/syntax.js
function gfmStrikethrough(options) {
  const options_ = options || {};
  let single = options_.singleTilde;
  const tokenizer = {
    name: "strikethrough",
    tokenize: tokenizeStrikethrough,
    resolveAll: resolveAllStrikethrough
  };
  if (single === null || single === void 0) {
    single = true;
  }
  return {
    text: {
      [126]: tokenizer
    },
    insideSpan: {
      null: [tokenizer]
    },
    attentionMarkers: {
      null: [126]
    }
  };
  function resolveAllStrikethrough(events, context) {
    let index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][0] === "enter" && events[index2][1].type === "strikethroughSequenceTemporary" && events[index2][1]._close) {
        let open = index2;
        while (open--) {
          if (events[open][0] === "exit" && events[open][1].type === "strikethroughSequenceTemporary" && events[open][1]._open && // If the sizes are the same:
          events[index2][1].end.offset - events[index2][1].start.offset === events[open][1].end.offset - events[open][1].start.offset) {
            events[index2][1].type = "strikethroughSequence";
            events[open][1].type = "strikethroughSequence";
            const strikethrough = {
              type: "strikethrough",
              start: Object.assign({}, events[open][1].start),
              end: Object.assign({}, events[index2][1].end)
            };
            const text4 = {
              type: "strikethroughText",
              start: Object.assign({}, events[open][1].end),
              end: Object.assign({}, events[index2][1].start)
            };
            const nextEvents = [["enter", strikethrough, context], ["enter", events[open][1], context], ["exit", events[open][1], context], ["enter", text4, context]];
            const insideSpan2 = context.parser.constructs.insideSpan.null;
            if (insideSpan2) {
              splice(nextEvents, nextEvents.length, 0, resolveAll(insideSpan2, events.slice(open + 1, index2), context));
            }
            splice(nextEvents, nextEvents.length, 0, [["exit", text4, context], ["enter", events[index2][1], context], ["exit", events[index2][1], context], ["exit", strikethrough, context]]);
            splice(events, open - 1, index2 - open + 3, nextEvents);
            index2 = open + nextEvents.length - 2;
            break;
          }
        }
      }
    }
    index2 = -1;
    while (++index2 < events.length) {
      if (events[index2][1].type === "strikethroughSequenceTemporary") {
        events[index2][1].type = "data";
      }
    }
    return events;
  }
  function tokenizeStrikethrough(effects, ok3, nok) {
    const previous4 = this.previous;
    const events = this.events;
    let size = 0;
    return start;
    function start(code2) {
      if (previous4 === 126 && events[events.length - 1][1].type !== "characterEscape") {
        return nok(code2);
      }
      effects.enter("strikethroughSequenceTemporary");
      return more(code2);
    }
    function more(code2) {
      const before = classifyCharacter(previous4);
      if (code2 === 126) {
        if (size > 1) return nok(code2);
        effects.consume(code2);
        size++;
        return more;
      }
      if (size < 2 && !single) return nok(code2);
      const token = effects.exit("strikethroughSequenceTemporary");
      const after = classifyCharacter(code2);
      token._open = !after || after === 2 && Boolean(before);
      token._close = !before || before === 2 && Boolean(after);
      return ok3(code2);
    }
  }
}
var init_syntax3 = __esm({
  "node_modules/micromark-extension-gfm-strikethrough/lib/syntax.js"() {
    init_micromark_util_chunked();
    init_micromark_util_classify_character();
    init_micromark_util_resolve_all();
  }
});

// node_modules/micromark-extension-gfm-strikethrough/index.js
var init_micromark_extension_gfm_strikethrough = __esm({
  "node_modules/micromark-extension-gfm-strikethrough/index.js"() {
    init_syntax3();
  }
});

// node_modules/micromark-extension-gfm-table/lib/edit-map.js
function addImplementation2(editMap, at, remove, add) {
  if (remove === 0 && add.length === 0) {
    return;
  }
  const existing = editMap.index.get(at);
  if (existing) {
    existing[1] += remove;
    existing[2].push(...add);
    return;
  }
  const change = [at, remove, add];
  editMap.map.push(change);
  editMap.index.set(at, change);
}
var EditMap2;
var init_edit_map = __esm({
  "node_modules/micromark-extension-gfm-table/lib/edit-map.js"() {
    EditMap2 = class {
      /**
       * Create a new edit map.
       */
      constructor() {
        this.map = [];
        this.index = /* @__PURE__ */ new Map();
      }
      /**
       * Create an edit: a remove and/or add at a certain place.
       *
       * @param {number} index
       *   Index at which to apply the edit.
       * @param {number} remove
       *   Count of items to remove at the index.
       * @param {Array<Event>} add
       *   Items to add at the index.
       * @returns {undefined}
       *   Nothing.
       */
      add(index2, remove, add) {
        addImplementation2(this, index2, remove, add);
      }
      // To do: add this when moving to `micromark`.
      // /**
      //  * Create an edit: but insert `add` before existing additions.
      //  *
      //  * @param {number} index
      //  * @param {number} remove
      //  * @param {Array<Event>} add
      //  * @returns {undefined}
      //  */
      // addBefore(index, remove, add) {
      //   addImplementation(this, index, remove, add, true)
      // }
      /**
       * Done, change the events.
       *
       * @param {Array<Event>} events
       *   List of events to apply the edits to.
       * @returns {undefined}
       *   Nothing.
       */
      consume(events) {
        this.map.sort(function(a, b) {
          return a[0] - b[0];
        });
        if (this.map.length === 0) {
          return;
        }
        let index2 = this.map.length;
        const vecs = [];
        while (index2 > 0) {
          index2 -= 1;
          vecs.push(events.slice(this.map[index2][0] + this.map[index2][1]), this.map[index2][2]);
          events.length = this.map[index2][0];
        }
        vecs.push(events.slice());
        events.length = 0;
        let slice = vecs.pop();
        while (slice) {
          for (const element2 of slice) {
            events.push(element2);
          }
          slice = vecs.pop();
        }
        this.map.length = 0;
        this.index.clear();
      }
    };
  }
});

// node_modules/micromark-extension-gfm-table/lib/infer.js
function gfmTableAlign(events, index2) {
  let inDelimiterRow = false;
  const align = [];
  while (index2 < events.length) {
    const event = events[index2];
    if (inDelimiterRow) {
      if (event[0] === "enter") {
        if (event[1].type === "tableContent") {
          align.push(events[index2 + 1][1].type === "tableDelimiterMarker" ? "left" : "none");
        }
      } else if (event[1].type === "tableContent") {
        if (events[index2 - 1][1].type === "tableDelimiterMarker") {
          const alignIndex = align.length - 1;
          align[alignIndex] = align[alignIndex] === "left" ? "center" : "right";
        }
      } else if (event[1].type === "tableDelimiterRow") {
        break;
      }
    } else if (event[0] === "enter" && event[1].type === "tableDelimiterRow") {
      inDelimiterRow = true;
    }
    index2 += 1;
  }
  return align;
}
var init_infer = __esm({
  "node_modules/micromark-extension-gfm-table/lib/infer.js"() {
  }
});

// node_modules/micromark-extension-gfm-table/lib/syntax.js
function gfmTable() {
  return {
    flow: {
      null: {
        name: "table",
        tokenize: tokenizeTable,
        resolveAll: resolveTable
      }
    }
  };
}
function tokenizeTable(effects, ok3, nok) {
  const self = this;
  let size = 0;
  let sizeB = 0;
  let seen;
  return start;
  function start(code2) {
    let index2 = self.events.length - 1;
    while (index2 > -1) {
      const {
        type
      } = self.events[index2][1];
      if (type === "lineEnding" || // Note: markdown-rs uses `whitespace` instead of `linePrefix`
      type === "linePrefix") {
        index2--;
      } else {
        break;
      }
    }
    const tail = index2 > -1 ? self.events[index2][1].type : null;
    const next = tail === "tableHead" || tail === "tableRow" ? bodyRowStart : headRowBefore;
    if (next === bodyRowStart && self.parser.lazy[self.now().line]) {
      return nok(code2);
    }
    return next(code2);
  }
  function headRowBefore(code2) {
    effects.enter("tableHead");
    effects.enter("tableRow");
    return headRowStart(code2);
  }
  function headRowStart(code2) {
    if (code2 === 124) {
      return headRowBreak(code2);
    }
    seen = true;
    sizeB += 1;
    return headRowBreak(code2);
  }
  function headRowBreak(code2) {
    if (code2 === null) {
      return nok(code2);
    }
    if (markdownLineEnding(code2)) {
      if (sizeB > 1) {
        sizeB = 0;
        self.interrupt = true;
        effects.exit("tableRow");
        effects.enter("lineEnding");
        effects.consume(code2);
        effects.exit("lineEnding");
        return headDelimiterStart;
      }
      return nok(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, headRowBreak, "whitespace")(code2);
    }
    sizeB += 1;
    if (seen) {
      seen = false;
      size += 1;
    }
    if (code2 === 124) {
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      seen = true;
      return headRowBreak;
    }
    effects.enter("data");
    return headRowData(code2);
  }
  function headRowData(code2) {
    if (code2 === null || code2 === 124 || markdownLineEndingOrSpace(code2)) {
      effects.exit("data");
      return headRowBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? headRowEscape : headRowData;
  }
  function headRowEscape(code2) {
    if (code2 === 92 || code2 === 124) {
      effects.consume(code2);
      return headRowData;
    }
    return headRowData(code2);
  }
  function headDelimiterStart(code2) {
    self.interrupt = false;
    if (self.parser.lazy[self.now().line]) {
      return nok(code2);
    }
    effects.enter("tableDelimiterRow");
    seen = false;
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterBefore, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4)(code2);
    }
    return headDelimiterBefore(code2);
  }
  function headDelimiterBefore(code2) {
    if (code2 === 45 || code2 === 58) {
      return headDelimiterValueBefore(code2);
    }
    if (code2 === 124) {
      seen = true;
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      return headDelimiterCellBefore;
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterCellBefore(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterValueBefore, "whitespace")(code2);
    }
    return headDelimiterValueBefore(code2);
  }
  function headDelimiterValueBefore(code2) {
    if (code2 === 58) {
      sizeB += 1;
      seen = true;
      effects.enter("tableDelimiterMarker");
      effects.consume(code2);
      effects.exit("tableDelimiterMarker");
      return headDelimiterLeftAlignmentAfter;
    }
    if (code2 === 45) {
      sizeB += 1;
      return headDelimiterLeftAlignmentAfter(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      return headDelimiterCellAfter(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterLeftAlignmentAfter(code2) {
    if (code2 === 45) {
      effects.enter("tableDelimiterFiller");
      return headDelimiterFiller(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterFiller(code2) {
    if (code2 === 45) {
      effects.consume(code2);
      return headDelimiterFiller;
    }
    if (code2 === 58) {
      seen = true;
      effects.exit("tableDelimiterFiller");
      effects.enter("tableDelimiterMarker");
      effects.consume(code2);
      effects.exit("tableDelimiterMarker");
      return headDelimiterRightAlignmentAfter;
    }
    effects.exit("tableDelimiterFiller");
    return headDelimiterRightAlignmentAfter(code2);
  }
  function headDelimiterRightAlignmentAfter(code2) {
    if (markdownSpace(code2)) {
      return factorySpace(effects, headDelimiterCellAfter, "whitespace")(code2);
    }
    return headDelimiterCellAfter(code2);
  }
  function headDelimiterCellAfter(code2) {
    if (code2 === 124) {
      return headDelimiterBefore(code2);
    }
    if (code2 === null || markdownLineEnding(code2)) {
      if (!seen || size !== sizeB) {
        return headDelimiterNok(code2);
      }
      effects.exit("tableDelimiterRow");
      effects.exit("tableHead");
      return ok3(code2);
    }
    return headDelimiterNok(code2);
  }
  function headDelimiterNok(code2) {
    return nok(code2);
  }
  function bodyRowStart(code2) {
    effects.enter("tableRow");
    return bodyRowBreak(code2);
  }
  function bodyRowBreak(code2) {
    if (code2 === 124) {
      effects.enter("tableCellDivider");
      effects.consume(code2);
      effects.exit("tableCellDivider");
      return bodyRowBreak;
    }
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("tableRow");
      return ok3(code2);
    }
    if (markdownSpace(code2)) {
      return factorySpace(effects, bodyRowBreak, "whitespace")(code2);
    }
    effects.enter("data");
    return bodyRowData(code2);
  }
  function bodyRowData(code2) {
    if (code2 === null || code2 === 124 || markdownLineEndingOrSpace(code2)) {
      effects.exit("data");
      return bodyRowBreak(code2);
    }
    effects.consume(code2);
    return code2 === 92 ? bodyRowEscape : bodyRowData;
  }
  function bodyRowEscape(code2) {
    if (code2 === 92 || code2 === 124) {
      effects.consume(code2);
      return bodyRowData;
    }
    return bodyRowData(code2);
  }
}
function resolveTable(events, context) {
  let index2 = -1;
  let inFirstCellAwaitingPipe = true;
  let rowKind = 0;
  let lastCell = [0, 0, 0, 0];
  let cell = [0, 0, 0, 0];
  let afterHeadAwaitingFirstBodyRow = false;
  let lastTableEnd = 0;
  let currentTable;
  let currentBody;
  let currentCell;
  const map = new EditMap2();
  while (++index2 < events.length) {
    const event = events[index2];
    const token = event[1];
    if (event[0] === "enter") {
      if (token.type === "tableHead") {
        afterHeadAwaitingFirstBodyRow = false;
        if (lastTableEnd !== 0) {
          flushTableEnd(map, context, lastTableEnd, currentTable, currentBody);
          currentBody = void 0;
          lastTableEnd = 0;
        }
        currentTable = {
          type: "table",
          start: Object.assign({}, token.start),
          // Note: correct end is set later.
          end: Object.assign({}, token.end)
        };
        map.add(index2, 0, [["enter", currentTable, context]]);
      } else if (token.type === "tableRow" || token.type === "tableDelimiterRow") {
        inFirstCellAwaitingPipe = true;
        currentCell = void 0;
        lastCell = [0, 0, 0, 0];
        cell = [0, index2 + 1, 0, 0];
        if (afterHeadAwaitingFirstBodyRow) {
          afterHeadAwaitingFirstBodyRow = false;
          currentBody = {
            type: "tableBody",
            start: Object.assign({}, token.start),
            // Note: correct end is set later.
            end: Object.assign({}, token.end)
          };
          map.add(index2, 0, [["enter", currentBody, context]]);
        }
        rowKind = token.type === "tableDelimiterRow" ? 2 : currentBody ? 3 : 1;
      } else if (rowKind && (token.type === "data" || token.type === "tableDelimiterMarker" || token.type === "tableDelimiterFiller")) {
        inFirstCellAwaitingPipe = false;
        if (cell[2] === 0) {
          if (lastCell[1] !== 0) {
            cell[0] = cell[1];
            currentCell = flushCell(map, context, lastCell, rowKind, void 0, currentCell);
            lastCell = [0, 0, 0, 0];
          }
          cell[2] = index2;
        }
      } else if (token.type === "tableCellDivider") {
        if (inFirstCellAwaitingPipe) {
          inFirstCellAwaitingPipe = false;
        } else {
          if (lastCell[1] !== 0) {
            cell[0] = cell[1];
            currentCell = flushCell(map, context, lastCell, rowKind, void 0, currentCell);
          }
          lastCell = cell;
          cell = [lastCell[1], index2, 0, 0];
        }
      }
    } else if (token.type === "tableHead") {
      afterHeadAwaitingFirstBodyRow = true;
      lastTableEnd = index2;
    } else if (token.type === "tableRow" || token.type === "tableDelimiterRow") {
      lastTableEnd = index2;
      if (lastCell[1] !== 0) {
        cell[0] = cell[1];
        currentCell = flushCell(map, context, lastCell, rowKind, index2, currentCell);
      } else if (cell[1] !== 0) {
        currentCell = flushCell(map, context, cell, rowKind, index2, currentCell);
      }
      rowKind = 0;
    } else if (rowKind && (token.type === "data" || token.type === "tableDelimiterMarker" || token.type === "tableDelimiterFiller")) {
      cell[3] = index2;
    }
  }
  if (lastTableEnd !== 0) {
    flushTableEnd(map, context, lastTableEnd, currentTable, currentBody);
  }
  map.consume(context.events);
  index2 = -1;
  while (++index2 < context.events.length) {
    const event = context.events[index2];
    if (event[0] === "enter" && event[1].type === "table") {
      event[1]._align = gfmTableAlign(context.events, index2);
    }
  }
  return events;
}
function flushCell(map, context, range, rowKind, rowEnd, previousCell) {
  const groupName = rowKind === 1 ? "tableHeader" : rowKind === 2 ? "tableDelimiter" : "tableData";
  const valueName = "tableContent";
  if (range[0] !== 0) {
    previousCell.end = Object.assign({}, getPoint(context.events, range[0]));
    map.add(range[0], 0, [["exit", previousCell, context]]);
  }
  const now = getPoint(context.events, range[1]);
  previousCell = {
    type: groupName,
    start: Object.assign({}, now),
    // Note: correct end is set later.
    end: Object.assign({}, now)
  };
  map.add(range[1], 0, [["enter", previousCell, context]]);
  if (range[2] !== 0) {
    const relatedStart = getPoint(context.events, range[2]);
    const relatedEnd = getPoint(context.events, range[3]);
    const valueToken = {
      type: valueName,
      start: Object.assign({}, relatedStart),
      end: Object.assign({}, relatedEnd)
    };
    map.add(range[2], 0, [["enter", valueToken, context]]);
    if (rowKind !== 2) {
      const start = context.events[range[2]];
      const end = context.events[range[3]];
      start[1].end = Object.assign({}, end[1].end);
      start[1].type = "chunkText";
      start[1].contentType = "text";
      if (range[3] > range[2] + 1) {
        const a = range[2] + 1;
        const b = range[3] - range[2] - 1;
        map.add(a, b, []);
      }
    }
    map.add(range[3] + 1, 0, [["exit", valueToken, context]]);
  }
  if (rowEnd !== void 0) {
    previousCell.end = Object.assign({}, getPoint(context.events, rowEnd));
    map.add(rowEnd, 0, [["exit", previousCell, context]]);
    previousCell = void 0;
  }
  return previousCell;
}
function flushTableEnd(map, context, index2, table, tableBody) {
  const exits = [];
  const related = getPoint(context.events, index2);
  if (tableBody) {
    tableBody.end = Object.assign({}, related);
    exits.push(["exit", tableBody, context]);
  }
  table.end = Object.assign({}, related);
  exits.push(["exit", table, context]);
  map.add(index2 + 1, 0, exits);
}
function getPoint(events, index2) {
  const event = events[index2];
  const side = event[0] === "enter" ? "start" : "end";
  return event[1][side];
}
var init_syntax4 = __esm({
  "node_modules/micromark-extension-gfm-table/lib/syntax.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    init_edit_map();
    init_infer();
  }
});

// node_modules/micromark-extension-gfm-table/index.js
var init_micromark_extension_gfm_table = __esm({
  "node_modules/micromark-extension-gfm-table/index.js"() {
    init_syntax4();
  }
});

// node_modules/micromark-extension-gfm-task-list-item/lib/syntax.js
function gfmTaskListItem() {
  return {
    text: {
      [91]: tasklistCheck
    }
  };
}
function tokenizeTasklistCheck(effects, ok3, nok) {
  const self = this;
  return open;
  function open(code2) {
    if (
      // Exit if there’s stuff before.
      self.previous !== null || // Exit if not in the first content that is the first child of a list
      // item.
      !self._gfmTasklistFirstContentOfListItem
    ) {
      return nok(code2);
    }
    effects.enter("taskListCheck");
    effects.enter("taskListCheckMarker");
    effects.consume(code2);
    effects.exit("taskListCheckMarker");
    return inside;
  }
  function inside(code2) {
    if (markdownLineEndingOrSpace(code2)) {
      effects.enter("taskListCheckValueUnchecked");
      effects.consume(code2);
      effects.exit("taskListCheckValueUnchecked");
      return close;
    }
    if (code2 === 88 || code2 === 120) {
      effects.enter("taskListCheckValueChecked");
      effects.consume(code2);
      effects.exit("taskListCheckValueChecked");
      return close;
    }
    return nok(code2);
  }
  function close(code2) {
    if (code2 === 93) {
      effects.enter("taskListCheckMarker");
      effects.consume(code2);
      effects.exit("taskListCheckMarker");
      effects.exit("taskListCheck");
      return after;
    }
    return nok(code2);
  }
  function after(code2) {
    if (markdownLineEnding(code2)) {
      return ok3(code2);
    }
    if (markdownSpace(code2)) {
      return effects.check({
        tokenize: spaceThenNonSpace
      }, ok3, nok)(code2);
    }
    return nok(code2);
  }
}
function spaceThenNonSpace(effects, ok3, nok) {
  return factorySpace(effects, after, "whitespace");
  function after(code2) {
    return code2 === null ? nok(code2) : ok3(code2);
  }
}
var tasklistCheck;
var init_syntax5 = __esm({
  "node_modules/micromark-extension-gfm-task-list-item/lib/syntax.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    tasklistCheck = {
      name: "tasklistCheck",
      tokenize: tokenizeTasklistCheck
    };
  }
});

// node_modules/micromark-extension-gfm-task-list-item/index.js
var init_micromark_extension_gfm_task_list_item = __esm({
  "node_modules/micromark-extension-gfm-task-list-item/index.js"() {
    init_syntax5();
  }
});

// node_modules/micromark-extension-gfm/index.js
function gfm(options) {
  return combineExtensions([
    gfmAutolinkLiteral(),
    gfmFootnote(),
    gfmStrikethrough(options),
    gfmTable(),
    gfmTaskListItem()
  ]);
}
var init_micromark_extension_gfm = __esm({
  "node_modules/micromark-extension-gfm/index.js"() {
    init_micromark_util_combine_extensions();
    init_micromark_extension_gfm_autolink_literal();
    init_micromark_extension_gfm_footnote();
    init_micromark_extension_gfm_strikethrough();
    init_micromark_extension_gfm_table();
    init_micromark_extension_gfm_task_list_item();
  }
});

// node_modules/ccount/index.js
function ccount(value, character) {
  const source = String(value);
  if (typeof character !== "string") {
    throw new TypeError("Expected character");
  }
  let count = 0;
  let index2 = source.indexOf(character);
  while (index2 !== -1) {
    count++;
    index2 = source.indexOf(character, index2 + character.length);
  }
  return count;
}
var init_ccount = __esm({
  "node_modules/ccount/index.js"() {
  }
});

// node_modules/escape-string-regexp/index.js
function escapeStringRegexp(string3) {
  if (typeof string3 !== "string") {
    throw new TypeError("Expected a string");
  }
  return string3.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
var init_escape_string_regexp = __esm({
  "node_modules/escape-string-regexp/index.js"() {
  }
});

// node_modules/unist-util-is/lib/index.js
function anyFactory(tests) {
  const checks = [];
  let index2 = -1;
  while (++index2 < tests.length) {
    checks[index2] = convert(tests[index2]);
  }
  return castFactory(any);
  function any(...parameters) {
    let index3 = -1;
    while (++index3 < checks.length) {
      if (checks[index3].apply(this, parameters)) return true;
    }
    return false;
  }
}
function propertiesFactory(check) {
  const checkAsRecord = (
    /** @type {Record<string, unknown>} */
    check
  );
  return castFactory(all2);
  function all2(node2) {
    const nodeAsRecord = (
      /** @type {Record<string, unknown>} */
      /** @type {unknown} */
      node2
    );
    let key;
    for (key in check) {
      if (nodeAsRecord[key] !== checkAsRecord[key]) return false;
    }
    return true;
  }
}
function typeFactory(check) {
  return castFactory(type);
  function type(node2) {
    return node2 && node2.type === check;
  }
}
function castFactory(testFunction) {
  return check;
  function check(value, index2, parent) {
    return Boolean(
      looksLikeANode(value) && testFunction.call(
        this,
        value,
        typeof index2 === "number" ? index2 : void 0,
        parent || void 0
      )
    );
  }
}
function ok2() {
  return true;
}
function looksLikeANode(value) {
  return value !== null && typeof value === "object" && "type" in value;
}
var convert;
var init_lib4 = __esm({
  "node_modules/unist-util-is/lib/index.js"() {
    convert = // Note: overloads in JSDoc can’t yet use different `@template`s.
    /**
     * @type {(
     *   (<Condition extends string>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & {type: Condition}) &
     *   (<Condition extends Props>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Condition) &
     *   (<Condition extends TestFunction>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Predicate<Condition, Node>) &
     *   ((test?: null | undefined) => (node?: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node) &
     *   ((test?: Test) => Check)
     * )}
     */
    /**
     * @param {Test} [test]
     * @returns {Check}
     */
    (function(test) {
      if (test === null || test === void 0) {
        return ok2;
      }
      if (typeof test === "function") {
        return castFactory(test);
      }
      if (typeof test === "object") {
        return Array.isArray(test) ? anyFactory(test) : (
          // Cast because `ReadonlyArray` goes into the above but `isArray`
          // narrows to `Array`.
          propertiesFactory(
            /** @type {Props} */
            test
          )
        );
      }
      if (typeof test === "string") {
        return typeFactory(test);
      }
      throw new Error("Expected function, string, or object as test");
    });
  }
});

// node_modules/unist-util-is/index.js
var init_unist_util_is = __esm({
  "node_modules/unist-util-is/index.js"() {
    init_lib4();
  }
});

// node_modules/unist-util-visit-parents/lib/color.js
function color(d) {
  return d;
}
var init_color = __esm({
  "node_modules/unist-util-visit-parents/lib/color.js"() {
  }
});

// node_modules/unist-util-visit-parents/lib/index.js
function visitParents(tree, testOrEnterOrVisitors, enterOrVisitorsOrReverse, reverse) {
  if (!tree || typeof tree !== "object") {
    throw new Error("Unexpected value `" + tree + "` for `tree`, expected node");
  }
  let preorder = true;
  let check;
  let visitors;
  let enter;
  let exit3;
  if (typeof enterOrVisitorsOrReverse === "function" || enterOrVisitorsOrReverse && typeof enterOrVisitorsOrReverse === "object") {
    check = /** @type {Test} */
    testOrEnterOrVisitors;
    visitors = enterOrVisitorsOrReverse;
    if (reverse) preorder = false;
  } else {
    visitors = /** @type {Visitors | Visitor} */
    testOrEnterOrVisitors;
    if (enterOrVisitorsOrReverse) preorder = false;
  }
  if (typeof visitors === "function") {
    enter = visitors;
  } else if (visitors && typeof visitors === "object") {
    if (visitors.enter === null || visitors.enter === void 0) {
    } else if (typeof visitors.enter === "function") {
      enter = visitors.enter;
    } else {
      throw new Error(
        "Unexpected value `" + visitors.enter + "` for `visitors.enter`, expected optional visitor"
      );
    }
    if (typeof visitors.exit === "function") {
      exit3 = visitors.exit;
    } else {
      throw new Error(
        "Unexpected value `" + visitors.exit + "` for `visitors.exit`, expected visitor (pass a visitor directly if you only want an enter visitor)"
      );
    }
  } else {
    throw new Error(
      "Unexpected value `" + visitors + "` for `enter` or `visitors`, expected visitor or object with visitors"
    );
  }
  const is2 = convert(check);
  const step = preorder ? 1 : -1;
  factory(tree, void 0, [])();
  function factory(node2, index2, parents) {
    const value = (
      /** @type {Record<string, unknown>} */
      node2 && typeof node2 === "object" ? node2 : {}
    );
    if (typeof value.type === "string") {
      const name = (
        // `hast`
        typeof value.tagName === "string" ? value.tagName : (
          // `xast`
          typeof value.name === "string" ? value.name : void 0
        )
      );
      Object.defineProperty(visit, "name", {
        value: "node (" + color(node2.type + (name ? "<" + name + ">" : "")) + ")"
      });
    }
    return visit;
    function visit() {
      const matches = !check || is2(node2, index2, parents[parents.length - 1] || void 0);
      let result = empty;
      if (enter && matches) {
        result = toResult(enter(node2, parents, index2));
        if (result[0] === EXIT) {
          return result;
        }
      }
      if ("children" in node2 && node2.children) {
        const nodeAsParent = (
          /** @type {UnistParent} */
          node2
        );
        if (nodeAsParent.children && result[0] !== SKIP) {
          let offset = (preorder ? -1 : nodeAsParent.children.length) + step;
          const grandparents = [...parents, nodeAsParent];
          while (offset > -1 && offset < nodeAsParent.children.length) {
            const child = nodeAsParent.children[offset];
            const subresult = factory(child, offset, grandparents)();
            if (subresult[0] === EXIT) {
              return subresult;
            }
            offset = typeof subresult[1] === "number" ? subresult[1] : offset + step;
          }
        }
      }
      if (exit3 && matches) {
        const exitResult = toResult(exit3(node2, parents, index2));
        if (exitResult[0] === SKIP) {
          throw new Error(
            "Unexpected value `" + exitResult[0] + "` from `exit`, expected `CONTINUE`, `EXIT`, index, or nothing"
          );
        }
        if (exitResult[0] === EXIT || typeof exitResult[1] === "number") {
          return exitResult;
        }
      }
      return result;
    }
  }
}
function toResult(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === "number") {
    return [CONTINUE, value];
  }
  return value === null || value === void 0 ? empty : [value];
}
var empty, CONTINUE, EXIT, SKIP;
var init_lib5 = __esm({
  "node_modules/unist-util-visit-parents/lib/index.js"() {
    init_unist_util_is();
    init_color();
    empty = [];
    CONTINUE = true;
    EXIT = false;
    SKIP = "skip";
  }
});

// node_modules/unist-util-visit-parents/index.js
var init_unist_util_visit_parents = __esm({
  "node_modules/unist-util-visit-parents/index.js"() {
    init_lib5();
  }
});

// node_modules/mdast-util-find-and-replace/lib/index.js
function findAndReplace(tree, list2, options) {
  const settings = options || {};
  const ignored = convert(settings.ignore || []);
  const pairs = toPairs(list2);
  let pairIndex = -1;
  while (++pairIndex < pairs.length) {
    visitParents(tree, visitor);
  }
  function visitor(node2, parents, index2) {
    if (node2.type === "text" && typeof index2 === "number") {
      return handler(node2, parents, index2);
    }
    if (ignored(node2, index2, parents[parents.length - 1])) return SKIP;
  }
  function handler(node2, parents, index2) {
    const parent = parents[parents.length - 1];
    const find = pairs[pairIndex][0];
    const replace2 = pairs[pairIndex][1];
    let start = 0;
    let change = false;
    let nodes = [];
    find.lastIndex = 0;
    let match = find.exec(node2.value);
    while (match) {
      const position2 = match.index;
      const matchObject = {
        index: match.index,
        input: match.input,
        stack: [...parents, node2]
      };
      let value = replace2(...match, matchObject);
      if (typeof value === "string") {
        value = value.length > 0 ? { type: "text", value } : void 0;
      }
      if (value !== false) {
        if (start !== position2) {
          add({ type: "text", value: node2.value.slice(start, position2) });
        }
        if (Array.isArray(value)) {
          for (const child of value) add(child);
        } else if (value) {
          add(value);
        }
        start = position2 + match[0].length;
        change = true;
      }
      if (value === false || match[0].length === 0) {
        const code2 = node2.value.codePointAt(position2) || 0;
        find.lastIndex = position2 + (/[uv]/.test(find.flags) && code2 > 65535 ? 2 : 1);
      }
      if (!find.global) {
        break;
      }
      match = find.exec(node2.value);
    }
    if (change) {
      if (start < node2.value.length) {
        add({ type: "text", value: node2.value.slice(start) });
      }
      parent.children.splice(index2, 1, ...nodes);
    } else {
      nodes = [node2];
    }
    return index2 + nodes.length;
    function add(child) {
      const previous4 = nodes[nodes.length - 1];
      if (previous4 && previous4.type === "text" && child.type === "text") {
        previous4.value += child.value;
      } else {
        nodes.push(child);
      }
    }
  }
}
function toPairs(tupleOrList) {
  if (!Array.isArray(tupleOrList)) {
    throw new TypeError("Expected find and replace tuple or list of tuples");
  }
  const result = [];
  const list2 = !tupleOrList[0] || Array.isArray(tupleOrList[0]) ? (
    /** @type {FindAndReplaceList} */
    tupleOrList
  ) : [
    /** @type {FindAndReplaceTuple} */
    tupleOrList
  ];
  let index2 = -1;
  while (++index2 < list2.length) {
    const tuple = list2[index2];
    result.push([toExpression(tuple[0]), toFunction(tuple[1])]);
  }
  return result;
}
function toExpression(find) {
  return typeof find === "string" ? new RegExp(escapeStringRegexp(find), "g") : find;
}
function toFunction(replace2) {
  return typeof replace2 === "function" ? replace2 : function() {
    return replace2;
  };
}
var init_lib6 = __esm({
  "node_modules/mdast-util-find-and-replace/lib/index.js"() {
    init_escape_string_regexp();
    init_unist_util_visit_parents();
    init_unist_util_is();
  }
});

// node_modules/mdast-util-find-and-replace/index.js
var init_mdast_util_find_and_replace = __esm({
  "node_modules/mdast-util-find-and-replace/index.js"() {
    init_lib6();
  }
});

// node_modules/mdast-util-gfm-autolink-literal/lib/index.js
function gfmAutolinkLiteralFromMarkdown() {
  return {
    transforms: [transformGfmAutolinkLiterals],
    enter: {
      literalAutolink: enterLiteralAutolink,
      literalAutolinkEmail: enterLiteralAutolinkValue,
      literalAutolinkHttp: enterLiteralAutolinkValue,
      literalAutolinkWww: enterLiteralAutolinkValue
    },
    exit: {
      literalAutolink: exitLiteralAutolink,
      literalAutolinkEmail: exitLiteralAutolinkEmail,
      literalAutolinkHttp: exitLiteralAutolinkHttp,
      literalAutolinkWww: exitLiteralAutolinkWww
    }
  };
}
function enterLiteralAutolink(token) {
  this.enter(
    { type: "link", title: null, url: "", children: [], position: void 0 },
    token
  );
}
function enterLiteralAutolinkValue(token) {
  this.config.enter.autolinkProtocol.call(this, token);
}
function exitLiteralAutolinkHttp(token) {
  this.config.exit.autolinkProtocol.call(this, token);
}
function exitLiteralAutolinkWww(token) {
  this.config.exit.data.call(this, token);
  const node2 = this.stack[this.stack.length - 1];
  ok(node2.type === "link");
  node2.url = "http://" + this.sliceSerialize(token);
}
function exitLiteralAutolinkEmail(token) {
  this.config.exit.autolinkEmail.call(this, token);
}
function exitLiteralAutolink(token) {
  this.exit(token);
}
function transformGfmAutolinkLiterals(tree) {
  findAndReplace(
    tree,
    [
      [
        /(?<![\da-z])(https?:\/\/|www(?=\.))([\w-]*\.[\w\-.]*)([^\t\n\r ]*)/gi,
        findUrl
      ],
      [
        /(?<![\w+\-.@])xmpp:([\w+\-.]+)@([\w-]+(?:\.[\w-]+)+)(\/(?:[\w\-/]|\.(?=[\dA-Za-z]))*)?/g,
        findXmpp
      ],
      [/(?<![\w+\-.@])mailto:([\w+\-.]+)@([\w-]+(?:\.[\w-]+)+)/g, findMailto],
      [
        /(?<![\w+\-.]|(?:^|[^\d@A-Za-z])(?:mailto|xmpp):)([\w+\-.]+)@([\w-]+(?:\.[\w-]+)+)/g,
        findEmail
      ]
    ],
    { ignore: ["link", "linkReference"] }
  );
}
function findUrl(_, protocol, domain2, path2, match) {
  if (!previous2(match)) {
    return false;
  }
  let prefix = "";
  if (/^w/i.test(protocol)) {
    domain2 = protocol + domain2;
    protocol = "";
    prefix = "http://";
  }
  if (unicodePunctuation(domain2.charCodeAt(0)) || !isCorrectDomain(domain2)) {
    return false;
  }
  const parts = splitUrl(domain2 + path2);
  const result = {
    type: "link",
    title: null,
    url: prefix + protocol + parts[0],
    children: [{ type: "text", value: protocol + parts[0], position: void 0 }],
    position: void 0
  };
  if (parts[1]) {
    return [result, { type: "text", value: parts[1], position: void 0 }];
  }
  return result;
}
function findEmail(_, atext, label) {
  if (/[\d\-_]$/.test(label)) {
    return false;
  }
  return {
    type: "link",
    title: null,
    url: "mailto:" + atext + "@" + label,
    children: [{ type: "text", value: atext + "@" + label, position: void 0 }],
    position: void 0
  };
}
function findMailto(_, atext, label) {
  if (/[\d\-_]$/.test(label)) {
    return false;
  }
  const value = "mailto:" + atext + "@" + label;
  return {
    type: "link",
    title: null,
    url: value,
    children: [{ type: "text", value, position: void 0 }],
    position: void 0
  };
}
function findXmpp(matchValue, atext, label, resource, match) {
  if (/[\d\-_]$/.test(label) || resource && (!/[A-Za-z]$/.test(resource) || match.input.charAt(match.index + matchValue.length) === "@")) {
    return false;
  }
  const value = "xmpp:" + atext + "@" + label + (resource || "");
  return {
    type: "link",
    title: null,
    url: value,
    children: [{ type: "text", value, position: void 0 }],
    position: void 0
  };
}
function isCorrectDomain(domain2) {
  const parts = domain2.split(".");
  if (parts.length < 2 || parts[parts.length - 1] && (/_/.test(parts[parts.length - 1]) || !/[\dA-Za-z]/.test(parts[parts.length - 1])) || parts[parts.length - 2] && (/_/.test(parts[parts.length - 2]) || !/[\dA-Za-z]/.test(parts[parts.length - 2]))) {
    return false;
  }
  return true;
}
function splitUrl(url) {
  let index2 = url.length;
  while (index2 > 0) {
    const code2 = url.charCodeAt(index2 - 1);
    if (code2 === 33 || code2 === 34 || code2 === 38 || code2 === 39 || code2 === 41 || code2 === 44 || code2 === 46 || code2 === 58 || code2 === 59 || code2 === 60 || code2 === 62 || code2 === 63 || code2 === 93 || code2 === 125) {
      index2--;
    } else {
      break;
    }
  }
  if (index2 === url.length) {
    return [url, void 0];
  }
  let trail2 = url.slice(index2);
  url = url.slice(0, index2);
  let closingParenIndex = trail2.indexOf(")");
  const openingParens = ccount(url, "(");
  let closingParens = ccount(url, ")");
  while (closingParenIndex !== -1 && openingParens > closingParens) {
    url += trail2.slice(0, closingParenIndex + 1);
    trail2 = trail2.slice(closingParenIndex + 1);
    closingParenIndex = trail2.indexOf(")");
    closingParens++;
  }
  return [url, trail2];
}
function previous2(match) {
  const code2 = match.input.charCodeAt(match.index - 1);
  return match.index === 0 || unicodeWhitespace(code2) || unicodePunctuation(code2);
}
var init_lib7 = __esm({
  "node_modules/mdast-util-gfm-autolink-literal/lib/index.js"() {
    init_ccount();
    init_default2();
    init_micromark_util_character();
    init_mdast_util_find_and_replace();
  }
});

// node_modules/mdast-util-gfm-autolink-literal/index.js
var init_mdast_util_gfm_autolink_literal = __esm({
  "node_modules/mdast-util-gfm-autolink-literal/index.js"() {
    init_lib7();
  }
});

// node_modules/mdast-util-gfm-footnote/lib/index.js
function enterFootnoteCallString() {
  this.buffer();
}
function enterFootnoteCall(token) {
  this.enter({ type: "footnoteReference", identifier: "", label: "" }, token);
}
function enterFootnoteDefinitionLabelString() {
  this.buffer();
}
function enterFootnoteDefinition(token) {
  this.enter(
    { type: "footnoteDefinition", identifier: "", label: "", children: [] },
    token
  );
}
function exitFootnoteCallString(token) {
  const label = this.resume();
  const node2 = this.stack[this.stack.length - 1];
  ok(node2.type === "footnoteReference");
  node2.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase();
  node2.label = label;
}
function exitFootnoteCall(token) {
  this.exit(token);
}
function exitFootnoteDefinitionLabelString(token) {
  const label = this.resume();
  const node2 = this.stack[this.stack.length - 1];
  ok(node2.type === "footnoteDefinition");
  node2.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase();
  node2.label = label;
}
function exitFootnoteDefinition(token) {
  this.exit(token);
}
function footnoteReferencePeek() {
  return "[";
}
function footnoteReference(node2, _, state, info) {
  const tracker = state.createTracker(info);
  let value = tracker.move("[^");
  const exit3 = state.enter("footnoteReference");
  const subexit = state.enter("reference");
  value += tracker.move(
    state.safe(state.associationId(node2), { after: "]", before: value })
  );
  subexit();
  exit3();
  value += tracker.move("]");
  return value;
}
function gfmFootnoteFromMarkdown() {
  return {
    enter: {
      gfmFootnoteCallString: enterFootnoteCallString,
      gfmFootnoteCall: enterFootnoteCall,
      gfmFootnoteDefinitionLabelString: enterFootnoteDefinitionLabelString,
      gfmFootnoteDefinition: enterFootnoteDefinition
    },
    exit: {
      gfmFootnoteCallString: exitFootnoteCallString,
      gfmFootnoteCall: exitFootnoteCall,
      gfmFootnoteDefinitionLabelString: exitFootnoteDefinitionLabelString,
      gfmFootnoteDefinition: exitFootnoteDefinition
    }
  };
}
var init_lib8 = __esm({
  "node_modules/mdast-util-gfm-footnote/lib/index.js"() {
    init_default2();
    init_micromark_util_normalize_identifier();
    footnoteReference.peek = footnoteReferencePeek;
  }
});

// node_modules/mdast-util-gfm-footnote/index.js
var init_mdast_util_gfm_footnote = __esm({
  "node_modules/mdast-util-gfm-footnote/index.js"() {
    init_lib8();
  }
});

// node_modules/mdast-util-gfm-strikethrough/lib/index.js
function gfmStrikethroughFromMarkdown() {
  return {
    canContainEols: ["delete"],
    enter: { strikethrough: enterStrikethrough },
    exit: { strikethrough: exitStrikethrough }
  };
}
function enterStrikethrough(token) {
  this.enter({ type: "delete", children: [], position: void 0 }, token);
}
function exitStrikethrough(token) {
  this.exit(token);
}
function handleDelete(node2, _, state, info) {
  const tracker = state.createTracker(info);
  const sequence = state.stack.includes("strikethrough") ? "~" : "~~";
  const exit3 = state.enter("strikethrough");
  let value = tracker.move(sequence);
  value += state.containerPhrasing(node2, {
    ...tracker.current(),
    before: value,
    after: "~"
  });
  value += tracker.move(sequence);
  exit3();
  return value;
}
function attentionDelete() {
  return { construct: "strikethrough", markers: ["~"], sizes: [2, 1] };
}
function peekDelete() {
  return "~";
}
var init_lib9 = __esm({
  "node_modules/mdast-util-gfm-strikethrough/lib/index.js"() {
    handleDelete.attention = attentionDelete;
    handleDelete.peek = peekDelete;
  }
});

// node_modules/mdast-util-gfm-strikethrough/index.js
var init_mdast_util_gfm_strikethrough = __esm({
  "node_modules/mdast-util-gfm-strikethrough/index.js"() {
    init_lib9();
  }
});

// node_modules/mdast-util-gfm-table/lib/index.js
function gfmTableFromMarkdown() {
  return {
    enter: {
      table: enterTable,
      tableData: enterCell,
      tableHeader: enterCell,
      tableRow: enterRow
    },
    exit: {
      codeText: exitCodeText,
      table: exitTable,
      tableData: exit2,
      tableHeader: exit2,
      tableRow: exit2
    }
  };
}
function enterTable(token) {
  const align = token._align;
  ok(align, "expected `_align` on table");
  this.enter(
    {
      type: "table",
      align: align.map(function(d) {
        return d === "none" ? null : d;
      }),
      children: [],
      position: void 0
    },
    token
  );
  this.data.inTable = true;
}
function exitTable(token) {
  this.exit(token);
  this.data.inTable = void 0;
}
function enterRow(token) {
  this.enter({ type: "tableRow", children: [], position: void 0 }, token);
}
function exit2(token) {
  this.exit(token);
}
function enterCell(token) {
  this.enter({ type: "tableCell", children: [], position: void 0 }, token);
}
function exitCodeText(token) {
  let value = this.resume();
  if (this.data.inTable) {
    value = value.replace(/\\([\\|])/g, replace);
  }
  const node2 = this.stack[this.stack.length - 1];
  ok(node2.type === "inlineCode");
  node2.value = value;
  this.exit(token);
}
function replace($0, $1) {
  return $1 === "|" ? $1 : $0;
}
var init_lib10 = __esm({
  "node_modules/mdast-util-gfm-table/lib/index.js"() {
    init_default2();
  }
});

// node_modules/mdast-util-gfm-table/index.js
var init_mdast_util_gfm_table = __esm({
  "node_modules/mdast-util-gfm-table/index.js"() {
    init_lib10();
  }
});

// node_modules/mdast-util-gfm-task-list-item/lib/index.js
function gfmTaskListItemFromMarkdown() {
  return {
    exit: {
      taskListCheckValueChecked: exitCheck,
      taskListCheckValueUnchecked: exitCheck,
      paragraph: exitParagraphWithTaskListItem
    }
  };
}
function exitCheck(token) {
  const node2 = this.stack[this.stack.length - 2];
  ok(node2.type === "listItem");
  node2.checked = token.type === "taskListCheckValueChecked";
}
function exitParagraphWithTaskListItem(token) {
  const parent = this.stack[this.stack.length - 2];
  if (parent && parent.type === "listItem" && typeof parent.checked === "boolean") {
    const node2 = this.stack[this.stack.length - 1];
    ok(node2.type === "paragraph");
    const head = node2.children[0];
    if (head && head.type === "text") {
      const siblings = parent.children;
      let index2 = -1;
      let firstParagraph;
      while (++index2 < siblings.length) {
        const sibling = siblings[index2];
        if (sibling.type === "paragraph") {
          firstParagraph = sibling;
          break;
        }
      }
      if (firstParagraph === node2) {
        head.value = head.value.slice(1);
        if (head.value.length === 0) {
          node2.children.shift();
        } else if (node2.position && head.position && typeof head.position.start.offset === "number") {
          head.position.start.column++;
          head.position.start.offset++;
          node2.position.start = { ...head.position.start };
        }
      }
    }
  }
  this.exit(token);
}
var init_lib11 = __esm({
  "node_modules/mdast-util-gfm-task-list-item/lib/index.js"() {
    init_default2();
  }
});

// node_modules/mdast-util-gfm-task-list-item/index.js
var init_mdast_util_gfm_task_list_item = __esm({
  "node_modules/mdast-util-gfm-task-list-item/index.js"() {
    init_lib11();
  }
});

// node_modules/mdast-util-gfm/lib/index.js
function gfmFromMarkdown() {
  return [
    gfmAutolinkLiteralFromMarkdown(),
    gfmFootnoteFromMarkdown(),
    gfmStrikethroughFromMarkdown(),
    gfmTableFromMarkdown(),
    gfmTaskListItemFromMarkdown()
  ];
}
var init_lib12 = __esm({
  "node_modules/mdast-util-gfm/lib/index.js"() {
    init_mdast_util_gfm_autolink_literal();
    init_mdast_util_gfm_footnote();
    init_mdast_util_gfm_strikethrough();
    init_mdast_util_gfm_table();
    init_mdast_util_gfm_task_list_item();
  }
});

// node_modules/mdast-util-gfm/index.js
var init_mdast_util_gfm = __esm({
  "node_modules/mdast-util-gfm/index.js"() {
    init_lib12();
  }
});

// node_modules/micromark-extension-math/lib/math-flow.js
function tokenizeMathFenced(effects, ok3, nok) {
  const self = this;
  const tail = self.events[self.events.length - 1];
  const initialSize = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
  let sizeOpen = 0;
  return start;
  function start(code2) {
    effects.enter("mathFlow");
    effects.enter("mathFlowFence");
    effects.enter("mathFlowFenceSequence");
    return sequenceOpen(code2);
  }
  function sequenceOpen(code2) {
    if (code2 === 36) {
      effects.consume(code2);
      sizeOpen++;
      return sequenceOpen;
    }
    if (sizeOpen < 2) {
      return nok(code2);
    }
    effects.exit("mathFlowFenceSequence");
    return factorySpace(effects, metaBefore, "whitespace")(code2);
  }
  function metaBefore(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      return metaAfter(code2);
    }
    effects.enter("mathFlowFenceMeta");
    effects.enter("chunkString", {
      contentType: "string"
    });
    return meta(code2);
  }
  function meta(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("chunkString");
      effects.exit("mathFlowFenceMeta");
      return metaAfter(code2);
    }
    if (code2 === 36) {
      return nok(code2);
    }
    effects.consume(code2);
    return meta;
  }
  function metaAfter(code2) {
    effects.exit("mathFlowFence");
    if (self.interrupt) {
      return ok3(code2);
    }
    return effects.attempt(nonLazyContinuation2, beforeNonLazyContinuation, after)(code2);
  }
  function beforeNonLazyContinuation(code2) {
    return effects.attempt({
      tokenize: tokenizeClosingFence,
      partial: true
    }, after, contentStart)(code2);
  }
  function contentStart(code2) {
    return (initialSize ? factorySpace(effects, beforeContentChunk, "linePrefix", initialSize + 1) : beforeContentChunk)(code2);
  }
  function beforeContentChunk(code2) {
    if (code2 === null) {
      return after(code2);
    }
    if (markdownLineEnding(code2)) {
      return effects.attempt(nonLazyContinuation2, beforeNonLazyContinuation, after)(code2);
    }
    effects.enter("mathFlowValue");
    return contentChunk(code2);
  }
  function contentChunk(code2) {
    if (code2 === null || markdownLineEnding(code2)) {
      effects.exit("mathFlowValue");
      return beforeContentChunk(code2);
    }
    effects.consume(code2);
    return contentChunk;
  }
  function after(code2) {
    effects.exit("mathFlow");
    return ok3(code2);
  }
  function tokenizeClosingFence(effects2, ok4, nok2) {
    let size = 0;
    return factorySpace(effects2, beforeSequenceClose, "linePrefix", self.parser.constructs.disable.null.includes("codeIndented") ? void 0 : 4);
    function beforeSequenceClose(code2) {
      effects2.enter("mathFlowFence");
      effects2.enter("mathFlowFenceSequence");
      return sequenceClose(code2);
    }
    function sequenceClose(code2) {
      if (code2 === 36) {
        size++;
        effects2.consume(code2);
        return sequenceClose;
      }
      if (size < sizeOpen) {
        return nok2(code2);
      }
      effects2.exit("mathFlowFenceSequence");
      return factorySpace(effects2, afterSequenceClose, "whitespace")(code2);
    }
    function afterSequenceClose(code2) {
      if (code2 === null || markdownLineEnding(code2)) {
        effects2.exit("mathFlowFence");
        return ok4(code2);
      }
      return nok2(code2);
    }
  }
}
function tokenizeNonLazyContinuation2(effects, ok3, nok) {
  const self = this;
  return start;
  function start(code2) {
    if (code2 === null) {
      return ok3(code2);
    }
    effects.enter("lineEnding");
    effects.consume(code2);
    effects.exit("lineEnding");
    return lineStart;
  }
  function lineStart(code2) {
    return self.parser.lazy[self.now().line] ? nok(code2) : ok3(code2);
  }
}
var mathFlow, nonLazyContinuation2;
var init_math_flow = __esm({
  "node_modules/micromark-extension-math/lib/math-flow.js"() {
    init_micromark_factory_space();
    init_micromark_util_character();
    mathFlow = {
      tokenize: tokenizeMathFenced,
      concrete: true,
      name: "mathFlow"
    };
    nonLazyContinuation2 = {
      tokenize: tokenizeNonLazyContinuation2,
      partial: true
    };
  }
});

// node_modules/micromark-extension-math/lib/math-text.js
function mathText(options) {
  const options_ = options || {};
  let single = options_.singleDollarTextMath;
  if (single === null || single === void 0) {
    single = true;
  }
  return {
    tokenize: tokenizeMathText,
    resolve: resolveMathText,
    previous: previous3,
    name: "mathText"
  };
  function tokenizeMathText(effects, ok3, nok) {
    const self = this;
    let sizeOpen = 0;
    let size;
    let token;
    return start;
    function start(code2) {
      effects.enter("mathText");
      effects.enter("mathTextSequence");
      return sequenceOpen(code2);
    }
    function sequenceOpen(code2) {
      if (code2 === 36) {
        effects.consume(code2);
        sizeOpen++;
        return sequenceOpen;
      }
      if (sizeOpen < 2 && !single) {
        return nok(code2);
      }
      effects.exit("mathTextSequence");
      return between(code2);
    }
    function between(code2) {
      if (code2 === null) {
        return nok(code2);
      }
      if (code2 === 36) {
        token = effects.enter("mathTextSequence");
        size = 0;
        return sequenceClose(code2);
      }
      if (code2 === 32) {
        effects.enter("space");
        effects.consume(code2);
        effects.exit("space");
        return between;
      }
      if (markdownLineEnding(code2)) {
        effects.enter("lineEnding");
        effects.consume(code2);
        effects.exit("lineEnding");
        return between;
      }
      effects.enter("mathTextData");
      return data(code2);
    }
    function data(code2) {
      if (code2 === null || code2 === 32 || code2 === 36 || markdownLineEnding(code2)) {
        effects.exit("mathTextData");
        return between(code2);
      }
      effects.consume(code2);
      return data;
    }
    function sequenceClose(code2) {
      if (code2 === 36) {
        effects.consume(code2);
        size++;
        return sequenceClose;
      }
      if (size === sizeOpen) {
        effects.exit("mathTextSequence");
        effects.exit("mathText");
        return ok3(code2);
      }
      token.type = "mathTextData";
      return data(code2);
    }
  }
}
function resolveMathText(events) {
  let tailExitIndex = events.length - 4;
  let headEnterIndex = 3;
  let index2;
  let enter;
  if ((events[headEnterIndex][1].type === "lineEnding" || events[headEnterIndex][1].type === "space") && (events[tailExitIndex][1].type === "lineEnding" || events[tailExitIndex][1].type === "space")) {
    index2 = headEnterIndex;
    while (++index2 < tailExitIndex) {
      if (events[index2][1].type === "mathTextData") {
        events[tailExitIndex][1].type = "mathTextPadding";
        events[headEnterIndex][1].type = "mathTextPadding";
        headEnterIndex += 2;
        tailExitIndex -= 2;
        break;
      }
    }
  }
  index2 = headEnterIndex - 1;
  tailExitIndex++;
  while (++index2 <= tailExitIndex) {
    if (enter === void 0) {
      if (index2 !== tailExitIndex && events[index2][1].type !== "lineEnding") {
        enter = index2;
      }
    } else if (index2 === tailExitIndex || events[index2][1].type === "lineEnding") {
      events[enter][1].type = "mathTextData";
      if (index2 !== enter + 2) {
        events[enter][1].end = events[index2 - 1][1].end;
        events.splice(enter + 2, index2 - enter - 2);
        tailExitIndex -= index2 - enter - 2;
        index2 = enter + 2;
      }
      enter = void 0;
    }
  }
  return events;
}
function previous3(code2) {
  return code2 !== 36 || this.events[this.events.length - 1][1].type === "characterEscape";
}
var init_math_text = __esm({
  "node_modules/micromark-extension-math/lib/math-text.js"() {
    init_micromark_util_character();
  }
});

// node_modules/micromark-extension-math/lib/syntax.js
function math(options) {
  return {
    flow: {
      [36]: mathFlow
    },
    text: {
      [36]: mathText(options)
    }
  };
}
var init_syntax6 = __esm({
  "node_modules/micromark-extension-math/lib/syntax.js"() {
    init_math_flow();
    init_math_text();
  }
});

// node_modules/micromark-extension-math/index.js
var init_micromark_extension_math = __esm({
  "node_modules/micromark-extension-math/index.js"() {
    init_syntax6();
  }
});

// node_modules/mdast-util-math/lib/index.js
function mathFromMarkdown() {
  return {
    enter: {
      mathFlow: enterMathFlow,
      mathFlowFenceMeta: enterMathFlowMeta,
      mathText: enterMathText
    },
    exit: {
      mathFlow: exitMathFlow,
      mathFlowFence: exitMathFlowFence,
      mathFlowFenceMeta: exitMathFlowMeta,
      mathFlowValue: exitMathData,
      mathText: exitMathText,
      mathTextData: exitMathData
    }
  };
  function enterMathFlow(token) {
    const code2 = {
      type: "element",
      tagName: "code",
      properties: { className: ["language-math", "math-display"] },
      children: []
    };
    this.enter(
      {
        type: "math",
        meta: null,
        value: "",
        data: { hName: "pre", hChildren: [code2] }
      },
      token
    );
  }
  function enterMathFlowMeta() {
    this.buffer();
  }
  function exitMathFlowMeta() {
    const data = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2.type === "math");
    node2.meta = data;
  }
  function exitMathFlowFence() {
    if (this.data.mathFlowInside) return;
    this.buffer();
    this.data.mathFlowInside = true;
  }
  function exitMathFlow(token) {
    const data = this.resume().replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, "");
    const node2 = this.stack[this.stack.length - 1];
    ok(node2.type === "math");
    this.exit(token);
    node2.value = data;
    const code2 = (
      /** @type {HastElement} */
      node2.data.hChildren[0]
    );
    ok(code2.type === "element");
    ok(code2.tagName === "code");
    code2.children.push({ type: "text", value: data });
    this.data.mathFlowInside = void 0;
  }
  function enterMathText(token) {
    this.enter(
      {
        type: "inlineMath",
        value: "",
        data: {
          hName: "code",
          hProperties: { className: ["language-math", "math-inline"] },
          hChildren: []
        }
      },
      token
    );
    this.buffer();
  }
  function exitMathText(token) {
    const data = this.resume();
    const node2 = this.stack[this.stack.length - 1];
    ok(node2.type === "inlineMath");
    this.exit(token);
    node2.value = data;
    const children = (
      /** @type {Array<HastElementContent>} */
      // @ts-expect-error: we defined it in `enterMathFlow`.
      node2.data.hChildren
    );
    children.push({ type: "text", value: data });
  }
  function exitMathData(token) {
    this.config.enter.data.call(this, token);
    this.config.exit.data.call(this, token);
  }
}
var init_lib13 = __esm({
  "node_modules/mdast-util-math/lib/index.js"() {
    init_default2();
  }
});

// node_modules/mdast-util-math/index.js
var init_mdast_util_math = __esm({
  "node_modules/mdast-util-math/index.js"() {
    init_lib13();
  }
});

// src/model.js
function repairs(source) {
  const items = [];
  if (!/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(source) || !/(?:\*\*|__|https?:\/\/)/i.test(source)) return items;
  function visit(node2) {
    const raw = () => source.slice(node2.position.start.offset, node2.position.end.offset);
    if (node2.type === "strong" && node2.children.length === 1 && node2.children[0].type === "text") {
      const value = node2.children[0].value;
      const literal = raw();
      if (literal.slice(2, -2) === value && source.indexOf(literal) === source.lastIndexOf(literal))
        items.push({ kind: "strong", literal, value });
    }
    if (node2.type === "link" && /^https?:\/\//i.test(raw())) {
      const literal = raw();
      const stop = literal.search(/[。！？，；、](?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]|$)/u);
      if (stop > 0 && source.indexOf(literal) === source.lastIndexOf(literal))
        items.push({ kind: "link", literal, value: literal.slice(0, stop) });
    }
    if (!["link", "linkReference", "image", "html"].includes(node2.type)) node2.children?.forEach(visit);
  }
  visit(fromMarkdown(source, parser));
  return items;
}
function completedParts(messages) {
  const ids = /* @__PURE__ */ new Set();
  let final, prompt = false, ambiguous = false;
  for (const msg of messages) {
    if (msg.type === "user") {
      prompt = true;
      final = void 0;
      ambiguous = false;
    }
    if (msg.type === "synthetic" && final?.finish === "stop") ambiguous = true;
    if (msg.type === "assistant") final = msg;
    if (msg.type !== "idle") continue;
    if (prompt && !ambiguous && msg.outcome === "succeeded" && final?.finish === "stop" && !final.error && final.time?.completed != null) {
      const lastTool = final.content.findLastIndex((p) => p.type === "tool");
      let ordinal = 0;
      for (const [i, part] of final.content.entries()) {
        if (part.type !== "text") continue;
        const id = final.id + ":text:" + ordinal++;
        if (part.text.trim() && (part.native?.phase === "final_answer" || i > lastTool && part.native?.phase !== "commentary")) {
          ids.add(id);
          break;
        }
      }
    }
    final = void 0;
    prompt = false;
    ambiguous = false;
  }
  return ids;
}
function partInfo(message, ordinal) {
  if (message?.type !== "assistant" || message.time?.completed == null) return;
  const part = message.content.filter((p) => p.type === "text")[ordinal];
  if (!part) return;
  return { source: part.text };
}
var parser;
var init_model = __esm({
  "src/model.js"() {
    init_mdast_util_from_markdown();
    init_dist2();
    init_micromark_extension_gfm();
    init_mdast_util_gfm();
    init_micromark_extension_math();
    init_mdast_util_math();
    parser = { extensions: [gfm(), math(), cjkFriendlyExtension()], mdastExtensions: [gfmFromMarkdown(), mathFromMarkdown()] };
  }
});

// src/watch.js
var watch_exports = {};
__export(watch_exports, {
  watch: () => watch
});
function decorate(root, item, undo) {
  if (item.kind === "link") {
    if (!URL.canParse(item.literal) || !URL.canParse(item.value)) return;
    for (const a of root.querySelectorAll("a.external-link[href]")) {
      if (a.textContent !== item.literal || a.href !== new URL(item.literal).href) continue;
      const label = a.lastChild;
      if (label?.nodeType !== 3 || label.data !== item.literal) continue;
      const old = a.getAttribute("href");
      const tail = document.createTextNode(item.literal.slice(item.value.length));
      a.after(tail);
      a.href = item.value;
      label.data = item.value;
      undo.push(() => {
        if (a.getAttribute("href") === item.value && label.data === item.value && a.nextSibling === tail) {
          a.setAttribute("href", old);
          label.data = item.literal;
          tail.remove();
        }
      });
    }
    return;
  }
  const nodes = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node2;
  while (node2 = nodes.nextNode()) {
    if (!node2.data.includes(item.literal) || node2.parentElement.closest(skip)) continue;
    const prefix = node2;
    const after = prefix.splitText(prefix.data.indexOf(item.literal));
    const rest = after.splitText(item.literal.length);
    const strong = document.createElement("strong");
    strong.textContent = item.value;
    after.replaceWith(strong);
    undo.push(() => {
      if (strong.parentNode && strong.textContent === item.value) {
        strong.replaceWith(after);
        if (rest.previousSibling === after && after.previousSibling === prefix) {
          prefix.appendData(after.data + rest.data);
          after.remove();
          rest.remove();
        }
      }
    });
    return;
  }
}
function watch(session) {
  const mounted = /* @__PURE__ */ new Map();
  const history = session.server.data.session.message;
  const completed = (0, import_solid_js.createMemo)(() => completedParts(history.list(session.id)));
  let pending = false;
  const enqueue = () => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
      if (pending) refresh();
      pending = false;
    });
  };
  function refresh() {
    const visible = new Set(document.querySelectorAll(selector));
    for (const [el, dispose] of mounted) if (!visible.has(el)) {
      dispose();
      mounted.delete(el);
    }
    for (const el of visible) {
      if (mounted.has(el)) continue;
      const match = /^(.+):text:(\d+)$/.exec(el.dataset.timelinePartId);
      if (!match) continue;
      const dispose = (0, import_solid_js.createRoot)((dispose2) => {
        let changes = [], lastText, items = [];
        const clear = () => {
          changes.reverse().forEach((fn) => fn());
          changes = [];
          el.removeAttribute("data-ocx-completed");
        };
        let current;
        const render = () => {
          if (lastText !== current?.source) {
            clear();
            lastText = current?.source;
            items = lastText ? repairs(lastText) : [];
          }
          el.toggleAttribute("data-ocx-completed", completed().has(el.dataset.timelinePartId));
          const root = el.querySelector('[data-slot="text-part-body"] > [data-component="markdown"]');
          if (root) for (const item of items) decorate(root, item, changes);
        };
        const observer2 = new MutationObserver(render);
        observer2.observe(el, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["data-interrupted"] });
        (0, import_solid_js.createEffect)(() => {
          const data = session.server.data.session.message;
          const msg = data.get ? data.get(session.id, match[1]) : data.list(session.id).find((m) => m.id === match[1]);
          current = partInfo(msg, Number(match[2]));
          render();
        });
        return () => {
          observer2.disconnect();
          clear();
          dispose2();
        };
      });
      mounted.set(el, dispose);
    }
  }
  const observer = new MutationObserver((records) => {
    if (records.some((r) => [...r.addedNodes, ...r.removedNodes].some((n) => n.nodeType === 1 && (n.matches(selector) || n.querySelector(selector) || n.matches('[data-component="text-part"]'))))) enqueue();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  refresh();
  return () => {
    observer.disconnect();
    pending = false;
    for (const dispose of mounted.values()) dispose();
    mounted.clear();
  };
}
var import_solid_js, selector, skip;
var init_watch = __esm({
  "src/watch.js"() {
    import_solid_js = require("solid-js");
    init_model();
    selector = '[data-slot="session-turn-assistant-content"] [data-component="text-part"][data-timeline-part-id]';
    skip = "pre,code,a,math,.katex,svg,button,textarea,[contenteditable=true]";
  }
});

// src/entry.js
var entry_exports = {};
__export(entry_exports, {
  default: () => entry_default
});
module.exports = __toCommonJS(entry_exports);
var import_gui = require("@opencode/plugin/gui");
var import_solid_js2 = require("solid-js");

// src/body.css
var body_default = '[data-timeline-row] [data-component="collapsed-tool-group"] [data-component="context-tool-group-trigger"] > [data-slot="context-tool-group-title"]::before {\n  content: ""; display: inline-block; flex: none; align-self: center; vertical-align: .12em;\n  inline-size: .48em; block-size: .48em; margin-inline-end: .5em;\n  border-radius: 50%; background: var(--cream-orange-selection, #eea366);\n}\n[data-ocx-completed] > [data-slot="text-part-body"]::before {\n  content: "\u5DF2\u5B8C\u6210"; display: block; text-align: center; font: inherit; font-weight: 700;\n  margin-block: .4em .75em; color: var(--v2-text-text-muted, currentColor);\n  background: linear-gradient(var(--v2-border-border-muted, #bdb6ad) 0 0) left center / calc(50% - 2.4em) 1px no-repeat,\n              linear-gradient(var(--v2-border-border-muted, #bdb6ad) 0 0) right center / calc(50% - 2.4em) 1px no-repeat;\n  user-select: none;\n}\n[data-timeline-row] [data-slot="session-turn-assistant-content"] [data-component="markdown"] :is(p, td, th) {\n  line-break: auto; overflow-wrap: break-word;\n}\n';

// src/entry.js
var entry_default = import_gui.Plugin.define({ setup(ctx) {
  ctx.add(import_gui.Style, body_default);
  ctx.add(import_gui.Slot, { at: "window.bottom", render() {
    (0, import_solid_js2.createEffect)(() => {
      const session = ctx.sessions.current();
      if (!session || session.pending) return;
      const { watch: watch2 } = (init_watch(), __toCommonJS(watch_exports));
      (0, import_solid_js2.onCleanup)(watch2(session));
    });
    return null;
  } });
} });
