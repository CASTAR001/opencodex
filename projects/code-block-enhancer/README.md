# Code Block Enhancer

macOS OpenCode Desktop 2.3.2 代码块增强插件。当前本机验收版本为 **0.1.0-alpha.3**，源码提交 `ea1b8d8`。

## 当前版本

顶栏显示语言名称、逐块换行图标和原生复制按钮。默认自动换行，点击图标可切换为横向滚动。支持 JavaScript、TypeScript、Python、Shell 和纯文本等已注册标签。省略语言或显式写 `text` 时显示 **Text**，其他语言沿用宿主的渲染方式。语法高亮读取当前宿主主题。

插件通过 GUI 的 `CodeBlock` 和 `Style` 注册围栏与样式。顶栏复用 Desktop 的高亮正文和复制按钮，这部分布局依赖 2.3.2 的节点结构；升级时应复验。流式围栏在宿主判定完成后显示顶栏。停生成或重开历史会话时，宿主也可能将未闭合的围栏标记为完成。[围栏注册接口](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts#L691) · [Desktop 围栏组件](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown.tsx#L313)

## 验收记录

使用 Desktop 2.3.2 的出厂渲染器复验了历史消息、流式闭合围栏、两个视口宽度和复制原文。未标注语言的围栏同样有顶栏，切换某一块的排版只影响该块，中文、制表符和换行在复制后保留。GUI bundle 通过隔离后台加载验证，SHA-256 为 `f318c662efca171a424b3b729b6e252fa5439584b55cc432691fa4c05d7c5f22`。

## 从合集安装

在合集的 `projects/code-block-enhancer/` 或插件分支根目录下，使用 Node.js 和 npm 构建并检查产物。

```sh
npm run build
npm test
npm pack
```

将生成的 `code-block-enhancer-0.1.0-alpha.3.tgz` 解包，把其中 `package/` 内的文件放到 `~/.config/opencode/plugins/code-block-enhancer/`。重新打开 Desktop 后，可在「设置 → 扩展」查看或停用插件。打开带有代码围栏的会话即可验证顶栏、复制与逐块换行。

折叠、行号和文件路径留待后续迭代。[版本记录](CHANGELOG.md)
