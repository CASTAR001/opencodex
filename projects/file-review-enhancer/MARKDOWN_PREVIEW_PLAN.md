# 右侧栏里的 Markdown 文档

本轮目标是改善 **在 OpenCode 右侧文件栏打开一个 `.md` 后的阅读体验**。归属 08 File Review Enhancer。基线为 macOS Desktop 2.3.2，宿主提交 `c0ad18b`。正文排版以专业文档软件为参考，Codex 只提供两个交互参考：文中引用可追溯、网页链接有可读名称。未来在同一个文件里边读边改是设计方向。本轮交付研究、可行性和验收计划。

这份计划本身可以用作文件样张。用 OpenCode 右侧栏打开，先点这里的 [跳到文末说明](#文末说明)，再试文末的返回链接。

## 阅读起点

一篇长文只需要一列正文。文档标题比章节标题醒目，标题靠近它引出的首段，用字重、留白体现层级。把橙色留给可操作的链接和引用号。沿用主题的纸张底色与用户选定的字体。窄栏收小水平留白，表格、长公式在各自区域横滚。在宽栏先试约 38–42 个汉字的正文行宽，表格可以用到更宽的文档列。这个宽度是样张的试验值。

## 值得借鉴的开源软件

| 项目 | 看哪个具体体验 | 在 OpenCode 中怎么用 |
| --- | --- | --- |
| [Zettlr 编辑器](https://docs.zettlr.com/en/editor/) · [开源仓库](https://github.com/Zettlr/Zettlr) | 面向长文写作，把 Markdown 源文和排版反馈放在同一个编辑环境。 | 作为长篇中文技术文档的阅读与未来编辑参照。第一份样张就用一篇有章节、引用和公式的文章。 |
| [Quarto 文章布局](https://quarto.org/docs/authoring/article-layout.html) · [可操作的示例](https://quarto-dev.github.io/quarto-demo/html-basics.html) | 文末脚注、引用及悬停预览各有用途，宽屏还可用页边注。 | 右侧窄栏优先做正文编号与文末注释双向跳转。悬停摘要留作增强，键盘用户也能完成完整往返。 |
| [MarkText](https://github.com/marktext/marktext) | 在简洁的文档画布里即时预览，支持表格、数学和多种编辑模式。 | 用它的简洁正文作另一个视觉对照，尤其看短标题、嵌套列表和公式之间的距离。 |
| [Vditor](https://github.com/Vanessa219/vditor) | 浏览器端提供即时渲染、富文本及分屏三种模式，可以单独比较。 | 将其即时渲染模式留给未来的文件编辑验证，届时测试中文输入法、选区、撤销和 Markdown 往返。只读预览阶段沿用宿主渲染器。 |

## 两种链接，三种行为

| 原文与意图 | 预期表现 |
| --- | --- |
| `[见附录](#附录)` 定位本篇中的标题 | 点击后仅滚动当前文件。相同标题、中文标题和两个同时打开的文件分别验收。 |
| `正文[^paper]` 配 `[^paper]: 注释内容` | 正文显示小号可点击编号，文末显示注释，按回链返回发起跳转的位置。同一注释引用两次时要能区分两个出处。只有普通参考式链接 `[资料][id]` 及 URL 定义时，应照常打开目标网页。 |
| `[中文排版指南](网址)` 或单独一个网址 | 优先显示作者给的文字。裸 GitHub 仓库可离线显示为“GitHub · 组织/仓库”，普通文档链接使用域名与可读路径，无法判断的路径保留域名及足够区分目标的路径信息。真实目标始终可检查和复制。正文 URL 里的查询参数、签名串不用于生成介绍，原始目标仍按原文打开。源码、围栏和显式代码示例逐字保留。 |

上一条聊天中“中文强调边界参考”就是回复原文写的链接标签。同一张截图无法证明 Codex 会为裸网址联网取标题，也无法证明该应用的所有行内来源都会跳到文末。对右栏文件，链接命名从原文或 URL 本身得出，首版不新增网页标题或摘要请求。站点图标是宿主已有的独立行为。

例如 `https://github.com/marktext/marktext` 可以可靠地显示为“GitHub · marktext/marktext”。像“适合长文的 Markdown 编辑器”这样的介绍需要作者提供描述或另有可靠元数据。后续如果需要真实网页标题，可单独设计用户主动触发的“读取页面标题”，获取失败仍用原标签。这不应成为打开本地文件的前提。

## 在 2.3.2 上核对到哪一步

- 右栏先进入内置 `ArtifactMarkdown`，分离 frontmatter，再把正文交给共享的 `Markdown`。可通过 GUI `Style` 将 CSS 限制在 `[data-slot="artifact-document-stage"][data-kind="markdown"] [data-slot="artifact-markdown-content"] > [data-component="markdown"]`。可保留前置信息、查找、预览/源码切换、相对路径与本地图片。样式只选正文元素，排除围栏内部、公式字形和链接图标。[文件预览组件](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/gui-plugins/src/file/artifact-view.tsx#L737) · [文件预览容器](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/gui-plugins/src/file/artifact-view.tsx#L142)
- 用本机出厂的 Markdown Worker 离线运行了五种合成输入，分别检查整篇投影和解析结果。标题锚点得到 `href="#附录"`，有名外链保留标签，参考式外链保留外部目标，裸网址的可见文字仍是 URL。**脚注样例没有生成文末注释区或回链**，其中 `^note` 被解析为链接文字。宿主的点击处理会在当前 Markdown 根内按标题或目标 ID 查找，再滚动最近的滚动容器。本次验证到 Worker 输出及源码点击逻辑，实际窗口的焦点与滚动仍待交互验收。[链接渲染](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/ui/src/context/marked-base.tsx#L3) · [文内跳转实现](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown-fragment-links.ts#L14)
- 内置 Markdown 分支在第三方 `FileViewer` 之前匹配。CSS 能排版已有注释，却无法为解析阶段丢掉的定义创建正确回链，也不能从 URL 生成任意新标签。先验证原生右栏；若进入语义增强，优先评估给内置预览提供可选的文档渲染扩展点。无需改 Agent 核心。若希望坚持使用原版，可用公开 `Panel` 做同一右栏中独立打开的“文档阅读”标签；要明确它多一次打开动作，且需重新接好原生查找、文件链接与滚动恢复。路线取舍在隔离样例验证后决定。[实际分派顺序](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/gui-plugins/src/file/artifact-view.tsx#L205) · [公开 Panel](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts#L961)

## 开发和验收顺序

1. **先出右栏阅读样张。** 同一篇文件对照原生效果和首版 CSS。分别在约 360、640、900 CSS 像素看标题、三级列表、引用、表格、公式和代码。切换内置浅色、深色与暖白主题，检查侧栏查找、选中文本、相对文件链接和围栏复制。聊天区、输入框及其他类型的预览都应保持原生表现。
2. **优先打通两个链接样例。** 先交付可用的显式标题锚点和有名外链。用独立夹具验证真正的脚注、文末回链和裸链命名。只在原生右栏或经选定的替代入口实测后，才将这两项标为完成。用合成 URL 验证离线也能标名，检查鼠标、Tab、Enter、复制地址、重复脚注、多文件同名注、缺失定义，并比较源文件散列。[脚注及回链的开源实现范例](https://github.com/markdown-it/markdown-it-footnote)
3. **把文件编辑留在下一阶段。** 未来进入编辑时，光标所在段可以显示 Markdown 标记，其余段落保留阅读排版。同一份文件在编辑前后应保留未知语法、frontmatter、换行和引用定义。正式写盘之前验证零编辑零差异、中文输入法、撤销，以及 Agent 同时改文件时的冲突处理。输入框的即时渲染只登记为远期想法，另行评估可行性和排期。

## 文末说明

这里是开头链接的目的地。[返回阅读起点](#阅读起点)。两个链接都明确指定了标题，因此能测试原生文内定位。真正脚注还需要解析器生成注释与回链，两者在验收中分别计分。
