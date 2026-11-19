# OpenCodex · OpenCode Desktop 插件合集

面向 macOS OpenCode Desktop 2.3.2 的模块化界面增强项目。代码块插件 02 已完成 `0.1.0-alpha.3` 本机试用。会话统计插件 06 在会话顶栏显示缓存命中率、跨模型实时 TPS 和上下文使用率，点击读数可打开明细。顶栏空间不足时自动隐藏读数。

- [功能需求与开发顺序](REQUIREMENTS.md)
- [逐项可行性与源码依据](FEASIBILITY.md)
- [模块边界、共享侧栏和兼容性设计](DESIGN.md)
- [会话缓存命中率与 TPS 开发计划](projects/session-metrics/PLAN.md)

## 项目索引

在 `main` 的 `projects/<插件名>/` 可以找到每个公开插件，已有实现的组件附有源码、测试和安装说明。每个插件保留自己的本地 Git，同一远端的 `plugins/<插件名>` 分支备份该插件的独立历史。[只恢复一个插件](DESIGN.md#恢复单个插件)

| 编号 | 组件 | 当前状态 |
|---|---|---|
| 02 | [Code Block Enhancer](projects/code-block-enhancer/README.md) | `0.1.0-alpha.3`，可安装 |
| 03 | [Markdown Presentation Enhancer](projects/markdown-presentation/README.md) | 预研 |
| 04 | [Compact Auto Collapse](projects/compact-auto-collapse/README.md) | 预研 |
| 05 | [Execution Timeline Auto Collapse](projects/execution-timeline/README.md) | 预研 |
| 06 | [Session Metrics Monitor](projects/session-metrics/README.md) | `0.1.0-alpha.4`，已通过本机验收，顶栏收窄时隐藏读数，恢复后继续显示 |
| 07 | [Provider Quota Monitor](projects/provider-quota/README.md) | `0.1.0-alpha.5`，已通过本机验收，从钱包查看剩余额度及用量，新建对话也可打开 |
| 08 | [File Review Enhancer](projects/file-review-enhancer/README.md) | `0.1.0-alpha.3`，从右侧文件树阅读 Markdown，支持脚注往返、原生网站图标和短链接名称 |
| 09 | [Bilingual Fonts](projects/bilingual-fonts/README.md) | `0.1.0-alpha.1`，已通过 macOS 本机验收。界面正文和代码可分别设置中西文字体 |

## 安装验证工具

纯 GUI 插件具备打包产物后，可解开发行包，并运行 `python3 -B tests/sidecar_install.py /absolute/path/to/extracted/package`。工具使用 Desktop 自带后台及隔离配置，验证插件发现、bundle 内容和移除后的清单。原生窗口效果需单独验收。

[安装验证脚本](tests/sidecar_install.py) · [MIT 许可](LICENSE)
