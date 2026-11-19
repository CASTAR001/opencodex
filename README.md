# File Review Enhancer

OpenCode Desktop 的右侧栏 Markdown 阅读插件。在右侧文件树中点开工作区里的 `.md`，原文件标签会显示阅读排版。工具栏可以切换预览与源码。「＋ → 阅读 Markdown 文件…」仍可另开阅读标签。当前原型只读。

## 阅读样张

《潮间带的六小时》含两条脚注、一条重复引用、五列表格、公式、代码和三种外链写法。在第一段和「把一条记录留给下一班人」末尾都可以进入同一条注释。文末的 ↩1、↩2 分别返回正文中的两个出处。[长文原稿](examples/tidal-notebook.md)

已有文档中的裸网址按域名和路径就地命名，完整地址留在链接目标中。作者写下的链接文字会原样保留。随插件提供的 skill 引导模型把资料用途直接写成标准 Markdown，例如 `[Quarto 的注释与文章布局](https://quarto.org/docs/authoring/article-layout.html)`。这个简介在其他阅读器中也能显示。[随附 skill](skills/markdown-link-labels/SKILL.md)

网页链接在悬停或键盘聚焦时显示下划线。左键在系统浏览器打开，右键菜单可复制完整网址。脚注的浅色圆形既是编号背景，也是点击区域。提示块左边线与已完成待办使用主题强调色。待办显示文件中 `- [x]` 与 `- [ ]` 的状态。代码沿用会话的渲染器；启用 02 Code Block Enhancer 时，两处使用同一套代码块工具栏。

## 开发与验收

在本仓库运行 `npm ci`、`npm run build`、`npm test`。构建目标为 OpenCode Desktop 2.3.2 的 `./gui-experimental`，服务端入口负责登记 skill。宿主升级后需要复测这两个入口。

2.3.2 的文件树直接打开内置标签，内置 Markdown 分支优先于第三方 `FileViewer`。插件从公开的 `session.panel.end` 插槽取得所属会话和文件模型，在同一右栏内匹配内置预览容器及其路径，再挂载阅读视图。文件标签、文件监听、预览／源码切换和查找由宿主负责。原生视图仍挂载在后台，长文有额外的解析和内存开销。宿主改动这些 DOM 标记时，匹配失败会显示原生预览。该适配仅验证了 2.3.2 的桌面右侧区域。

协调仓的 `tests/file-review/browser.mjs` 重建离线对照，`tests/file-review/desktop_probe.py` 使用临时工作区、出厂渲染器及真实文件树复测入口。文件编辑留给后续阶段。[开源参考与接入计划](MARKDOWN_PREVIEW_PLAN.md)
