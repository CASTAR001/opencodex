# Code Block Enhancer

macOS OpenCode Desktop 2.3.2 代码块增强插件。当前本机验收版本为 **0.1.0-alpha.3**，源码提交 `ea1b8d8`。

## 当前版本

顶栏显示语言名称、逐块换行图标和原生复制按钮。默认自动换行，点击图标可切换为横向滚动。支持 JavaScript、TypeScript、Python、Shell 和纯文本等已注册标签。省略语言或显式写 `text` 时显示 **Text**，其他语言沿用宿主的渲染方式。语法高亮读取当前宿主主题。

## 验收记录

使用 Desktop 2.3.2 的出厂渲染器复验了历史消息、流式闭合围栏、两个视口宽度和复制原文。未标注语言的围栏同样有顶栏，切换某一块的排版只影响该块，中文、制表符和换行在复制后保留。GUI bundle 通过隔离后台加载验证，SHA-256 为 `f318c662efca171a424b3b729b6e252fa5439584b55cc432691fa4c05d7c5f22`。

插件仓维护构建入口 `npm run build`、测试 `npm test` 和打包入口 `npm pack`。折叠、行号和文件路径留待后续迭代。[版本记录](CHANGELOG.md)
