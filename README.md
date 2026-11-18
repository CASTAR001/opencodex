# Code Block Enhancer

闭合代码围栏的结构、折叠、换行、行号和 Diff 文本；复用宿主高亮与复制。

## 状态与兼容范围

预研阶段。设计基线为 OpenCode Desktop 2.3.2。首版发布前须有独立实现、自动化测试和目标宿主验收。

## 首版验收

完整代码块的顶栏左侧显示围栏声明的语言，右侧保留一个复制按钮并增加逐块「自动换行」开关。建议默认保持宿主当前行为，关闭时长行可横向滚动，打开时仅在显示层软换行。两个相同源码的块可以有不同的开关状态。

### 实现路径

2.3.2 自带语言元数据、复制与高亮。首版对显式列出的语言及别名使用 GUI `CodeBlock` 渲染加顶栏的组件，复用 `ctx.ui.Code` 的词法着色。换行开关使用每个组件实例自己的状态和可键盘操作的按钮。宿主在外层保留 Copy，计划在自己渲染的围栏内为它预留顶栏右侧空间并定向定位；`ctx.ui.Code` 内层也会生成原生围栏，需在本组件内隐藏重复的内层复制按钮。这个布局依赖内部 slot，升级时复测。公共 `CodeBlockAction.run` 只接收 code、language、session，没有唯一的块 ID 或 DOM 句柄。[公开接口](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts#L688) · [宿主 Code](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/app/src/runtime/plugin/ui.tsx#L221) · [原生复制处理](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown.tsx#L681)

以 TS/JS、Python、Shell 及常见别名为首批验证集。已注册语言的完整围栏可以增强。流式未闭合、截断、未覆盖语言和已有专用渲染器的围栏先走原生路径。对于无语言围栏，只在已验证可匹配空标签的版本显示「纯文本」，避免猜测。若要求所有语言在流中也有可交互顶栏，再向 Desktop 提议围栏 header 插槽与逐块生命周期。改动限于 Markdown 前端。

Streamdown 的源码展示了如何把语言标题、操作区和高亮正文分开。Docusaurus 的换行按钮根据该块是否可滚动及当前换行状态显示，并以启用样式反馈当前状态。这两者提供交互参考，插件可继续使用 OpenCode 原有的 Solid 组件和高亮器。[Streamdown CodeBlock](https://github.com/vercel/streamdown/blob/main/packages/streamdown/lib/code-block/index.tsx) · [Docusaurus 换行按钮](https://github.com/facebook/docusaurus/blob/main/packages/docusaurus-theme-classic/src/theme/CodeBlock/Buttons/WordWrapButton/index.tsx)

### 配色与验收

02 读取宿主的 `--syntax-*` 变量，在浅色、深色主题下复测 Shell 和其余围栏的词法角色。

- 键盘可操作顶栏。软换行前后，复制仍取得相同的宿主原始代码字符串，中文、制表符、缩进、空行和长 URL 均覆盖。
- 测试流式完成、历史消息、窄窗、两个相同围栏和 Mermaid 共存。切换主题时重新取色，禁用后回到宿主围栏。
- 用浅色、深色及内置主题检查词法角色辨识度与文本对比度。避免用一套固定的浅色语法色覆盖所有主题。

版本号、测试入口和发行包由本仓库独立维护。当前无可安装版本。
