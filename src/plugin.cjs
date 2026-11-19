const { Plugin, CodeBlock, Style } = require('@opencode/plugin/gui')
const { createComponent, createEffect, onCleanup, onMount } = require('solid-js')
const { insert } = require('solid-js/web')
const styles = require('./toolbar.css')
const { mountControls } = require('./controls.cjs')

// The GUI matches literal fence tags. These groups cover Desktop 2.3.2's bundled
// @pierre/highlights languages and our existing Markdown/plain-text aliases.
const aliases = {
  Text: ['', 'text', 'txt', 'plain', 'plaintext'],
  Markdown: ['markdown', 'md', 'mdown', 'mkd', 'commonmark', 'gfm'],
  'Angular HTML': ['angular-html'],
  'Angular TypeScript': ['angular-ts'],
  Assembly: ['asm', 'assembly', 's'],
  Astro: ['astro'],
  Bash: ['bash'], Zsh: ['zsh'], Shell: ['sh', 'shell', 'shellscript', 'shellsession'],
  Batch: ['bat', 'batch', 'batchfile', 'cmd', 'dos'],
  C: ['c', 'h'], C3: ['c3'],
  'C++': ['c++', 'cc', 'cpp', 'cxx', 'hh', 'hpp', 'hxx'],
  'C#': ['c#', 'cs', 'csharp'],
  Clojure: ['clj', 'cljc', 'cljs', 'clojure'], EDN: ['edn'],
  CMake: ['cmake'], CSS: ['css'], CUDA: ['cu', 'cuda', 'cuh'],
  Dart: ['dart'], Diff: ['diff', 'patch'],
  'Git commit': ['git-commit'], 'Git rebase': ['git-rebase'],
  Dockerfile: ['docker', 'dockerfile'], Containerfile: ['containerfile'],
  Elixir: ['ex', 'exs', 'elixir'], Elm: ['elm'], Erlang: ['erl', 'erlang', 'hrl'],
  Fortran: ['f', 'f03', 'f08', 'f77', 'f90', 'f95', 'for', 'fortran', 'fortran-free-form', 'fortran-fixed-form'],
  'F#': ['f#', 'fs', 'fsharp', 'fsi', 'fsx'],
  'Godot resource': ['gdresource', 'godot-resource', 'tres', 'tscn'], GDScript: ['gd', 'gdscript'],
  'Godot shader': ['gdshader', 'gdshaderinc', 'godot-shader'],
  Gleam: ['gleam'], GLSL: ['comp', 'frag', 'geom', 'glsl', 'vert'],
  Go: ['go', 'golang'], GraphQL: ['gql', 'graphql'], Gradle: ['gradle'],
  Groovy: ['groovy', 'gsh', 'gvy', 'gy'], Haskell: ['haskell', 'hs'], HLSL: ['hlsl'],
  HTML: ['htm', 'html'], Java: ['java'], JavaScript: ['cjs', 'javascript', 'js', 'mjs'],
  JSON: ['json'], JSONC: ['jsonc'], JSON5: ['json5'], 'JSON Lines': ['jsonl'], JSX: ['jsx'],
  Julia: ['jl', 'julia'], Kotlin: ['kotlin', 'kt', 'kts'], LaTeX: ['latex', 'tex'], Less: ['less'],
  Lisp: ['lisp', 'lsp'], 'Common Lisp': ['cl'], 'Emacs Lisp': ['el', 'elisp', 'emacs-lisp'], Scheme: ['scheme', 'scm'],
  Lua: ['lua'], Makefile: ['make', 'makefile', 'mk'], MATLAB: ['matlab'], Octave: ['octave'],
  MDX: ['mdx'], Nim: ['nim'], Nix: ['nix'],
  'Objective-C': ['m', 'objc', 'objective-c', 'objectivec'], 'Objective-C++': ['mm', 'objcpp', 'objective-cpp'],
  OCaml: ['ml', 'mli', 'ocaml'], Pascal: ['dpk', 'dpr', 'lpr', 'object-pascal', 'objectpascal', 'pas', 'pascal', 'pp'],
  Delphi: ['delphi'], Perl: ['perl', 'pl', 'pm'], PHP: ['php'],
  PowerShell: ['powershell', 'ps', 'ps1', 'psd1', 'psm1', 'pwsh'],
  Protobuf: ['proto', 'protobuf'], Python: ['py', 'python'], R: ['r', 'rscript'],
  Ruby: ['rb', 'ruby'], Rust: ['rs', 'rust'], Sass: ['sass'], Scala: ['sc', 'scala'], sbt: ['sbt'],
  SCSS: ['scss'], Solidity: ['sol', 'solidity'], SQL: ['sql'], Svelte: ['svelte'], Swift: ['swift'],
  HCL: ['hcl'], Terraform: ['terraform', 'tf', 'tfvars'], TOML: ['toml'],
  TypeScript: ['cts', 'mts', 'ts', 'typescript'], TSRX: ['tsrx'], TSX: ['tsx'],
  Vue: ['vue'], WebAssembly: ['wasm', 'wat'], WGSL: ['wgsl'],
  SVG: ['svg'], XML: ['xml', 'xsd'], YAML: ['yaml', 'yml'], Zig: ['zig'], ZON: ['zon'],
}
const labels = new Map()
for (const [label, tags] of Object.entries(aliases)) {
  for (const tag of tags) labels.set(tag, label)
}

function toolbar(ctx, block) {
  const header = document.createElement('div')
  onMount(() => {
    // Desktop keeps the highlighted pre and native Copy when it mounts our renderer.
    const slot = header.closest('[data-slot="markdown-code-content"]')
    const fence = slot?.parentElement
    if (fence?.matches('[data-component="markdown-code"]') &&
        fence.querySelector(':scope > pre > code') && fence.querySelector(':scope > [data-slot="markdown-copy-button"]')) {
      const controls = mountControls(header, fence, labels.get(block.language))
      createEffect(() => controls.labels({ diff: ctx.t('diff'), hideDiff: ctx.t('hideDiff'),
        deleted: ctx.t('deleted'), copyPatch: ctx.t('copyPatch'), noCoordinates: ctx.t('noCoordinates'), numbers: ctx.t('numbers'), hideNumbers: ctx.t('hideNumbers'),
        wrap: ctx.t('wrap'), keepLines: ctx.t('keepLines') }))
      onCleanup(controls.dispose)
      return
    }
    // A different host layout must still show the source via the public Code component.
    header.replaceChildren()
    insert(header, () => createComponent(ctx.ui.Code, { content: block.code, language: block.language }))
  })
  return header
}

exports.default = Plugin.define({
  i18n: {
    en: { diff: 'Review changes', hideDiff: 'Show resulting snippet', deleted: 'This section was deleted', copyPatch: 'Copy original patch', noCoordinates: 'No source line numbers in this patch', numbers: 'Show line numbers', hideNumbers: 'Hide line numbers', wrap: 'Wrap lines', keepLines: 'Show original lines' },
    zh: { diff: '查看增删', hideDiff: '查看修改后的片段', deleted: '此段已删除', copyPatch: '复制原始补丁', noCoordinates: '补丁未提供源文件行号', numbers: '显示行号', hideNumbers: '隐藏行号', wrap: '自动换行', keepLines: '按原行显示' },
    zht: { diff: '檢視增刪', hideDiff: '檢視修改後的片段', deleted: '此段已刪除', copyPatch: '複製原始補丁', noCoordinates: '補丁未提供原始檔行號', numbers: '顯示行號', hideNumbers: '隱藏行號', wrap: '自動換行', keepLines: '依原行顯示' },
  },
  setup(ctx) {
    ctx.add(Style, styles)
    ctx.add(CodeBlock, { languages: [...labels.keys()], render: block => toolbar(ctx, block) })
  },
})
