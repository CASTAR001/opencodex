# Plugin 03 · 会话 Markdown 阅读排版计划

2026-11-19 · 目标宿主为 macOS OpenCode Desktop 2.3.2，源码基线 `c0ad18b`。本阶段交付设计与实施顺序，运行时验收留到原型阶段。

当前优先开发的是 08 仓库 `file-review-enhancer/MARKDOWN_PREVIEW_PLAN.md` 所列的右侧栏文件预览。下面这份 03 计划保留给后续的助手正文排版。Codex 仅作引用跳转及可读链接的交互参考，整体视觉另选专业 Markdown 软件作对照。

**目标体验**是让人扫一眼长回复就能找到下一节，逐行读中文、英文和数字时舒服，打开侧栏后仍能看清表格、公式和代码。沿用独立插件 `markdown-presentation`。首版用一份局部样式表完成，代码围栏由 02 管，字体选择由 09 管，颜色取当前主题的语义变量。

## 社区里哪些体验值得保留

| 一手反馈 | 本项目的取舍 |
| --- | --- |
| 有 Codex 用户专门用桌面版读长回复，原因是比例字体比通篇等宽更容易读。另两位使用者看重在同一个窗口阅读渲染后的内容，能选中一小段继续讨论。[Codex 用户讨论](https://www.reddit.com/r/codex/comments/1qvjy2p/i_dont_get_the_codex_app_hype_how_does_it_differ/) · [两位使用者的实际工作流](https://technicallycurious.substack.com/p/codex-is-excellent) | 正文继承用户字体，行内代码保持等宽。原生拖选、复制、引用和打开链接都列为回归项。 |
| Obsidian 用户会切到阅读视图看同一篇笔记，提到段落和标题留白更舒服。OpenCode 用户则报告过标题看起来像普通加粗，扫读时分不清章节。[Obsidian 读者讨论](https://forum.obsidian.md/t/why-does-editor-look-different-in-live-preview-mode-and-reading-mode/37728) · [OpenCode #16046](https://github.com/anomalyco/opencode/issues/16046) | 用字号、字重和上下留白共同区分标题。标题靠近它引出的段落，短回答也保持紧凑。 |
| 一位 Mac 用户报告 Codex 桌面版三列表格被裁，即使窗口还有空位也读不全。[Codex #53710](https://github.com/openai/codex/issues/53710) | 正文沿用会话列宽，表格先利用整列宽度。宽表局部横滚，验收必须能看到并选中最后一列。 |

这些是具体使用者的反馈，不能据此给偏好排人气榜。暖白底、克制的甜橙强调及中英混排的优先级来自本项目的使用习惯。

## 2.3.2 能从哪里接入

- **局部样式可走插件。** GUI 的 `Style` 接受 CSS 字符串，宿主把它放进窗口的 `document.head`，所以作用范围必须由选择器保证。经典和新版两条时间线都调用 `AssistantTextContent`。它的正文路径是 `[data-component="text-part"] > [data-slot="text-part-body"] > [data-component="markdown"]`。压缩摘要也复用了这一路径，须排除 `[data-component="session-compaction-message"]` 祖先，并用工具输出、推理、文件预览作反例。内部 DOM 会随版本变化，未知结构默认沿用宿主样式。若某一路无法可靠区分，先停用该路规则，再评估向上游提议只给助手正文根增加一个标记。[GUI 接口](https://opencode.ai/docs/build/plugins/gui) · [Style 注册](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts#L1073) · [窗口挂载](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/app/src/runtime/plugin/render.tsx#L99) · [正文与摘要](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/message/message-content.tsx#L996)
- **流式和历史沿用宿主。** Patchmark 已做增量分块，原生 Markdown 根处理选区复制，表格已有横滚容器，数学由 KaTeX 绘制。闭合数学围栏会从临时代码形态转为公式。插件只调整宿主产出的元素，避免每轮 token 扫描 DOM、重建消息或移动滚动位置。[流式投影](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown-stream.ts#L22) · [表格容器](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown.tsx#L507) · [KaTeX 处理](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/ui/src/context/marked-parser.tsx#L41)
- **中文强调符单独验。** 把你遇到的 `**结论。**紧接着的下一句`、有空格的对照和围栏内同样的字串放进夹具。如果解析结果只有星号和文本，CSS 无法可靠恢复强调语义。先记下 2.3.2 在历史、流式和复制时的实际输出。若要兼容这类写法，后续单列解析器提案。保留消息原文、代码示例和复制结果，不在界面偷偷补空格。[CommonMark 强调规则](https://spec.commonmark.org/0.31.2/#emphasis-and-strong-emphasis) · [CJK 分隔符实现与用例](https://github.com/tats-u/markdown-cjk-friendly)

## 第一版看起来怎样

| 元素 | 首轮样张的具体做法 |
| --- | --- |
| 正文与 H1–H6 | 正文以宿主字号为基准，先试 1.65 倍行高、段后 0.7em。H1／H2／H3 先试 1.40／1.24／1.10em。H4–H6 以接近正文的字号，用字重、节前留白和较弱的文字色区分。中性深色标题，段内加粗保持正文色。首块和末块收掉多余外边距。参数都是首轮比较值。 |
| 列表、引用、提示 | 同一列表条目内紧凑，跨段条目适当分开，三级列表保留编号与复选框对齐。引用用细侧线和很浅的底色。仅给宿主确实识别的提示类型加语义色，普通引用和字面的 `[!NOTE]` 按实际解析显示。分隔线用低对比细线。 |
| 链接、行内代码 | 链接用主题强调色和细下划线，键盘聚焦清晰。文件路径仍走原生点击行为。行内代码用浅底、窄内边距，行尾长路径可换行。选择器只命中正文的行内代码，避开围栏、公式和内嵌控件。 |
| 表格 | 保留原生表头和表格语义，表头轻底色、行间细线，文本从顶部对齐。保留原文指定的左、中、右对齐。数字沿用表格数字特性。短表可完整扫读，长说明允许自然换行，宽表只在自己的容器横滚。 |
| 数学与代码围栏 | 行内分数、上下标随句子自然对齐；块公式上下留白，宽矩阵可局部横滚且不裁积分号。保留 KaTeX 数学字体与 MathML。围栏只校准与前后段落的距离。暖白背景、甜色高亮、语言标签、复制和逐块换行沿用 02。 |

颜色优先使用宿主正文、弱文字、强调、层背景和细边框变量。暖白主题下让少量强调色落在链接和提示上。内置浅色、深色分别核对文字可读性。预设不写入个人字体名、主题源码或专属色值。

## 可复用的开源工作

| 项目 | 复用方式 |
| --- | --- |
| [github-markdown-css](https://github.com/sindresorhus/github-markdown-css) | 用真实标题、列表、引用、表格比对阅读节奏；保留会话自己的宽度、字体和主题变量。若摘用 MIT 代码，随发行包保留相应许可。 |
| [Vercel Streamdown](https://github.com/vercel/streamdown) | 借鉴不完整 Markdown 的流式展示及分块测试思路，重点测试未闭合围栏、表格逐行出现、生成中断。OpenCode 已有 Patchmark 和 Solid 渲染链，首版无需引入这套 React 运行时。 |
| [markdown-cjk-friendly](https://github.com/tats-u/markdown-cjk-friendly) | 对照中英文、全角标点、嵌套强调的分隔符用例，帮助识别语法差异。候选修复须能在 OpenCode 自己的解析器中通过同一组样例。 |

## 实施顺序与交付

| 阶段 | 工作与通过条件 | 预估 |
| --- | --- | --- |
| 0 · 复现与边界 | 在隔离的 2.3.2 出厂渲染器内跑同一组合成消息，保存原生对照。两条时间线都必须命中助手正文，用户气泡、输入栏、压缩摘要、推理、工具输出、文件预览命中数为零。 | 半天 |
| 1 · 可看的排版原型 | 交付插件入口、局部 CSS 和一份中文长回答样张。先看标题、段落、三级列表、引用、链接与行内代码。在同一段带围栏的回复上并排比较原生和新排版。 | 约 1 天 |
| 2 · 宽内容与流式回归 | 补表格、公式、原生提示块及边缘样例，跑下面的验收矩阵；保留关键截图和最小复跑夹具。 | 1–2 天 |
| 3 · 本机试读准备 | 在隔离环境验证启用、停用、重载和移除后恢复原生，产出本地安装包。每阶段限定路径提交。先交样张、测试结论和已知限制，日常安装与远端推送由用户验收决定。 | 半天 |

估算以 2.3.2 的渲染夹具可复用为前提。若触及解析器或宿主标记，单列成本和升级风险，视觉部分仍可独立交付。

## 验收时读哪几条消息

1. **中文技术说明。** 一个短回答和一篇含 H1–H6、普通加粗、长英文标识、中文全角标点、三级列表和任务列表的长回答。100% 和 125% 缩放各看一次。能扫到各节，首屏没有突兀留白，中文标点与行内代码交界处不漏字。
2. **模型对比表。** 三列短表、八列宽表，包含小数、不同对齐声明、很长的模型名。分别用约 360、640、900 CSS 像素的会话列宽。最后一列可触达且能拖选；正文和输入栏都没有横向滚动。
3. **公式和围栏混排。** 行内分数、带上下限的积分、宽矩阵、无标签围栏、带语言围栏、四反引号包三反引号。检查数学基线、长式横滚、围栏语言标签、复制原文和逐块换行。对 02 和 09 分别做启停对照，保留宿主的主题切换与字体回退。
4. **流式阅读。** 同一原文分别一次载入、按标点切片、恰在表格分隔符或围栏中途停止，再重开历史。完成态结构和排版一致。已完成段落的选区、复制和链接保持可用。在长对话停在上一屏，记录插件开关两次的同一锚点偏移；已稳定块没有插件额外造成的跳动。
5. **可读性与退出。** 在暖白、内置浅色和深色样张上，以 4.5:1 为普通正文和链接的对比度目标。检查键盘焦点、系统减少动态效果、原生选区工具条、消息复制。停用后同一份样例恢复原生计算样式和交互。
