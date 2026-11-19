# File Review Enhancer

OpenCode Desktop 的右侧栏 Markdown 阅读插件。打开「＋ → 阅读 Markdown 文件…」，输入工作区内的 `.md` 路径，即可打开独立的阅读标签。当前原型只读，使用 OpenCode 的主题、字体、公式和代码渲染。

## 阅读样张

《潮间带的六小时》含两条脚注、一条重复引用、五列表格、公式、代码和三种外链写法。在第一段和「把一条记录留给下一班人」末尾都可以进入同一条注释。文末的 ↩1、↩2 分别返回正文中的两个出处。[长文原稿](examples/tidal-notebook.md)

已有文档中的裸网址按域名和路径就地命名，完整地址留在链接目标中。作者写下的链接文字会原样保留。随插件提供的 skill 引导模型把资料用途直接写成标准 Markdown，例如 `[Quarto 的注释与文章布局](https://quarto.org/docs/authoring/article-layout.html)`。这个简介在其他阅读器中也能显示。[随附 skill](skills/markdown-link-labels/SKILL.md)

## 开发与验收

在本仓库运行 `npm ci`、`npm run build`、`npm test`。构建目标为 OpenCode Desktop 2.3.2 的 `./gui-experimental`，服务端入口负责登记 skill。宿主升级后需要复测这两个入口。

0.1.0-alpha.1 已在该版本自带的渲染组件和隔离后台验证。协调仓的 `tests/file-review/browser.mjs` 可用同一份原稿重建原生与新版的并排样张。当前原生文件标签仍由宿主管理，原型通过右栏菜单另开阅读标签。原生文件查找、相对路径图片、编辑及写回留待后续接入。[开源参考与接入计划](MARKDOWN_PREVIEW_PLAN.md)
