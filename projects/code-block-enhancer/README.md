# 代码块增强

OpenCode Desktop 会话和右侧 Markdown 文件预览共用此代码块插件。**0.1.0-alpha.9** 支持 2.3.2 和 2.4.0。2.4.0 的换行默认值跟随「设置 → 常规 → 时间线 → 代码块换行」。超宽代码块显示原生逐块换行键；想让长行默认折返，可以打开该设置。2.3.2 沿用默认换行和原有的逐块开关。两个版本都由宿主复制原文。

长代码块的顶栏和正文合计约占阅读区可见高度的 55%，短块自然排高。鼠标或键盘进入代码块后，溢出内容的右缘显示可拖动的滚动条。滚动整篇文档时，顶栏停在阅读区上沿，到当前块末尾随之离开。会话与文件栏分别测量可用高度，普通页面回退到窗口可见高度。

普通代码块的顶栏包含语言、行号和复制。换行键按上面的版本规则显示。可识别的 `diff` 或 `patch` 围栏在行号左侧增加 ±。默认阅读修改后的片段，保留上下文、缩进和空行。点 ± 可对照新增与删除，再点返回片段。多个修改段之间有分隔线，完全删除的段落在片段视图显示「此段已删除」。

开启行号后，片段视图显示新文件行号，增删视图从左到右显示旧、新文件行号。简写补丁（例如只给出一行减、一行加）可切换视图，行号按钮会提示缺少源文件行号。残缺、无增删和无法识别的补丁按宿主原文显示。两种视图的复制按钮均复制围栏中的完整原始补丁，选中片段中的文字可单独复制可见内容。

点击行号图标可逐块开关行号，默认关闭。同一行软换行后只编号一次。行号和源码分开绘制，普通代码开启时只为当前块的可见行生成数字。

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

插件通过 GUI 的 `CodeBlock` 注册语言，通过 `Style` 布置顶栏。两个版本都保留原始高亮正文。2.4.0 将原生复制和换行收在同一个工具栏，插件为它布置位置，并让 Diff 视图跟随宿主的换行选择。额外的原生 CodeBlockAction 有单独的布局位置。高亮使用宿主的词法分析器和当前主题的 `--syntax-*` 变量，Shell 围栏也按词法角色着色。若宿主渲染区缺少约定的正文或 Copy 节点，则通过公开的 `ctx.ui.Code` 回退到代码内容。升级宿主时应复测组件属性和位置。[公开渲染接口](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts#L691) · [Desktop 围栏与复制处理](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown.tsx#L313)

流式围栏在宿主判定完成后出现顶栏。2.3.2 对停止生成和从历史重新解析的未闭合围栏也可能报告完成；公开参数只有语言、代码和会话。无语言围栏显示 Text；未知语言和 Mermaid 使用宿主原有的展示方式。同一语言有多个渲染插件时，宿主选先注册的一项。会话内通过相同 Markdown 提供器显示的工具输出及文件预览也在该接口作用范围内。

## 构建与验收

运行 `npm run build`、`npm test`、`npm pack`。发行入口只导入宿主共享模块，安装包自带 GUI bundle。协调仓库的 `tests/code-blocks/native-toolbar.mjs` 在 2.3.2、2.4.0 随附的渲染器中验证换行、长块行号、Diff 复制、文件阅读组件和停用后的原生显示。
