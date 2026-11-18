# Code Block Enhancer

OpenCode Desktop 会话代码块插件，当前本地版本为 **0.1.0-alpha.1**，适配 macOS Desktop **2.3.2**。顶栏左侧显示围栏语言，右侧有自动换行开关和宿主的复制按钮。自动换行默认关闭，每块独立，消息重新挂载后恢复默认。打开时只改变显示，复制保留制表符、中文、空行和原来的行尾。

| 围栏标签 | 顶栏显示 |
|---|---|
| `js`、`javascript`、`jsx` | JavaScript、JSX |
| `ts`、`typescript`、`tsx` | TypeScript、TSX |
| `py`、`python` | Python |
| `sh`、`shell`、`bash`、`zsh` | Shell、Bash、Zsh |

## 本地试用

将发行包解包后，把 `package/` 中的文件放在 `~/.config/opencode/plugins/code-block-enhancer/`。重新打开 OpenCode，在「设置 → 扩展」可以查看或停用插件。在包含上述标签的已有会话中即可试用。高亮读取当前宿主主题。Tab 聚焦后，用空格或 Enter 切换换行，也可以键盘激活复制。

## 渲染与兼容

插件通过 GUI 的 `CodeBlock` 注册语言，通过 `Style` 布置顶栏。2.3.2 在同一围栏内保存了原始高亮正文和 Copy，插件将它们与顶栏排在一起。额外的原生 CodeBlockAction 有单独的布局位置。高亮使用宿主的词法分析器和当前主题的 `--syntax-*` 变量，Shell 围栏也按词法角色着色。若宿主渲染区缺少约定的正文或 Copy 节点，则通过公开的 `ctx.ui.Code` 回退到代码内容。升级宿主时应复测组件属性和位置。[公开渲染接口](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts#L691) · [Desktop 围栏与复制处理](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown.tsx#L313)

流式围栏在宿主判定完成后出现顶栏。2.3.2 对停止生成和从历史重新解析的未闭合围栏也可能报告完成；公开参数只有语言、代码和会话。无标签、未知语言、Mermaid 保留原生展示。同一语言有多个渲染插件时，宿主选先注册的一项。会话内通过相同 Markdown 提供器显示的工具输出及文件预览也在该接口作用范围内。

## 构建与验收

运行 `npm run build`、`npm test`、`npm pack`。发行入口只导入宿主共享模块，安装包自带 GUI bundle。协调仓库的 `tests/code-blocks` 使用 Desktop 随附的 Markdown、语言分派器、复制处理和高亮 Worker 验证包组合。折叠、行号和文件路径保留在后续计划。
