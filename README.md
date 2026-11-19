# Code Block Enhancer

OpenCode Desktop 会话和右侧 Markdown 文件预览共用此代码块插件。**0.1.0-alpha.7** 是面向 macOS Desktop **2.3.2** 的本地预览版。代码块默认自动换行，顶栏显示折返箭头。点击后，图标变为直行箭头，长行可横向滚动。悬停可查看点击后的排版方式。每块独立，重新挂载后恢复自动换行。复制保留原文的制表符、中文和换行。

长代码块的顶栏和正文合计约占阅读区可见高度的 55%，短块自然排高。鼠标或键盘进入代码块后，溢出内容的右缘显示可拖动的滚动条。滚动整篇文档时，顶栏停在阅读区上沿，到当前块末尾随之离开。会话与文件栏分别测量可用高度，普通页面回退到窗口可见高度。

顶栏从左到右依次为 Diff、行号、换行和复制。标为 `diff` 或 `patch` 的围栏默认显示补丁原文。开启 Diff 会分别给新增行和删除行加上主题底色。普通代码块的 Diff 图标灰显。

点击换行箭头左侧的行号图标可逐块开关行号，默认关闭。同一行软换行后只编号一次。行号和源码分开绘制，开启时只为当前块的可见行生成数字。

语言标签与 Desktop 2.3.2 自带高亮器的完整语言表对应，含 Dart、JSON、YAML、SQL、Swift、Rust、C++ 等。部分标签示例如下。

| 围栏标签示例 | 顶栏显示 |
|---|---|
| `dart` | Dart |
| `yaml`、`yml` | YAML |
| `md`、`markdown`、`mdown`、`mkd`、`commonmark`、`gfm` | Markdown |
| 省略语言、`text`、`txt`、`plain`、`plaintext` | Text |
| `js`、`javascript`、`jsx` | JavaScript、JSX |
| `ts`、`typescript`、`tsx` | TypeScript、TSX |
| `py`、`python` | Python |
| `sh`、`shell`、`bash`、`zsh` | Shell、Bash、Zsh |

## 从合集安装

在合集的 `projects/code-block-enhancer/` 或插件分支根目录下运行 `npm pack`。将发行包解包后，把 `package/` 中的文件放在 `~/.config/opencode/plugins/code-block-enhancer/`。重新打开 OpenCode，在「设置 → 扩展」可以查看或停用插件。在包含上述标签的已有会话中即可试用。语法高亮读取当前主题。Tab 聚焦后，用空格或 Enter 切换换行，也可以键盘激活复制。

## 渲染与兼容

插件通过 GUI 的 `CodeBlock` 注册语言，通过 `Style` 布置顶栏。2.3.2 在同一围栏内保存了原始高亮正文和 Copy，插件将它们与顶栏排在一起。额外的原生 CodeBlockAction 有单独的布局位置。高亮使用宿主的词法分析器和当前主题的 `--syntax-*` 变量，Shell 围栏也按词法角色着色。若宿主渲染区缺少约定的正文或 Copy 节点，则通过公开的 `ctx.ui.Code` 回退到代码内容。升级宿主时应复测组件属性和位置。[公开渲染接口](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts#L691) · [Desktop 围栏与复制处理](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown.tsx#L313)

流式围栏在宿主判定完成后出现顶栏。2.3.2 对停止生成和从历史重新解析的未闭合围栏也可能报告完成；公开参数只有语言、代码和会话。无语言围栏显示 Text；未知语言和 Mermaid 使用宿主原有的展示方式。同一语言有多个渲染插件时，宿主选先注册的一项。会话内通过相同 Markdown 提供器显示的工具输出及文件预览也在该接口作用范围内。

## 构建与验收

运行 `npm run build`、`npm test`、`npm pack`。发行入口只导入宿主共享模块，安装包自带 GUI bundle。协调仓库的 `tests/code-blocks` 使用 Desktop 随附的 Markdown、语言分派器、复制处理和高亮 Worker 验证包组合。
