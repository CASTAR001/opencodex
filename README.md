# OpenCode Desktop UX

面向 macOS OpenCode Desktop 2.3.2 的模块化界面增强项目。当前公开七项功能的需求、源码审计、工程设计和各项目的首版验收标准。七项均在预研阶段。

- [功能需求与开发顺序](REQUIREMENTS.md)
- [逐项可行性与源码依据](FEASIBILITY.md)
- [模块边界、共享侧栏和兼容性设计](DESIGN.md)

## 项目索引

每个插件独立维护、测试和发布。下表标明本次收录文档对应的本地 Git 提交，后续功能源码在各自的仓库维护。

| 编号 | 项目与首版验收 | 文档来源提交 |
|---|---|---|
| 02 | [Code Block Enhancer](projects/code-block-enhancer/README.md) | `2a97173` |
| 03 | [Markdown Presentation Enhancer](projects/markdown-presentation/README.md) | `2c692be` |
| 04 | [Compact Auto Collapse](projects/compact-auto-collapse/README.md) | `c3a17f9` |
| 05 | [Execution Timeline Auto Collapse](projects/execution-timeline/README.md) | `34ca57d` |
| 06 | [Session Metrics Monitor](projects/session-metrics/README.md) | `cbdaa19` |
| 07 | [Provider Quota Monitor](projects/provider-quota/README.md) | `221ce7a` |
| 08 | [File Review Enhancer](projects/file-review-enhancer/README.md) | `99b7d19` |

## 安装验证工具

纯 GUI 插件具备打包产物后，可解开发行包，并运行 `python3 -B tests/sidecar_install.py /absolute/path/to/extracted/package`。工具使用 Desktop 自带后台及隔离配置，验证插件发现、bundle 内容和移除后的清单。原生窗口效果需单独验收。

[安装验证脚本](tests/sidecar_install.py) · [MIT 许可](LICENSE)
