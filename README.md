# OpenCodex · OpenCode Desktop 插件合集

面向 macOS OpenCode Desktop 2.3.2 的模块化 UI 插件合集。可以按需安装代码阅读、文件阅读、会话导航、字体和用量监控组件。扩展列表的中文名称由独立插件提供，支持切换主题，悬停可查看原插件 ID。

- [功能需求与开发顺序](REQUIREMENTS.md)
- [逐项可行性与源码依据](FEASIBILITY.md)
- [模块边界、共享侧栏和兼容性设计](DESIGN.md)
- [会话缓存命中率与 TPS 开发计划](projects/session-metrics/PLAN.md)

## 项目索引

在 `main` 的 `projects/<插件名>/` 可以找到每个公开插件，已有实现的组件附有源码、测试和安装说明。每个插件保留自己的本地 Git，同一远端的 `plugins/<插件名>` 分支备份该插件的独立历史。[只恢复一个插件](DESIGN.md#恢复单个插件)

| 编号 | 组件 | 当前状态 |
|---|---|---|
| 02 | [代码块增强](projects/code-block-enhancer/README.md) | `0.1.0-alpha.8` · 限高滚动、行号、换行、Diff 对照与复制 |
| 03 | [对话 Markdown 排版](projects/markdown-presentation/README.md) | 暂缓。右侧文件阅读见 08 |
| 04 | [Compact 自动折叠](projects/compact-auto-collapse/README.md) | 随 05 完成试验，已作学习存档 |
| 05 | [任务执行过程折叠](projects/execution-timeline/README.md) | 插件与前端补丁已作学习存档，独立试用版已退役 |
| 06 | [缓存与生成速度监控](projects/session-metrics/README.md) | `0.1.0-alpha.4` · 实时缓存命中率、TPS 和上下文占用，窄窗口自动隐藏 |
| 07 | [用量与剩余额度](projects/provider-quota/README.md) | `0.1.0-alpha.6` · 点钱包自动查询剩余额度。MiMo 中国区个人 Token Plan 已支持官方余量查询，用量页可看实际记录的 Token |
| 08 | [Markdown 阅读器](projects/file-review-enhancer/README.md) | `0.1.0-alpha.5` · 从右侧文件树阅读，支持脚注往返、可读链接和公式。文字表格随栏宽换行，宽表可在表格内横移 |
| 09 | [中英文字体](projects/bilingual-fonts/README.md) | `0.1.0-alpha.1` · 分别设置中西文字体，偏好保存在本机 |
| 10 | [提示词快捷导航](projects/prompt-navigation/README.md) | `0.1.0-alpha.4` · 左侧提示词刻度、标星与跳转，支持长对话 |
| 11 | [项目文件夹整理](projects/project-sidebar/README.md) | **已弃用** · 最后版本 `0.1.0-alpha.3`。侧边标签页使用 OpenCode 原生项目分组 |
| 12 | [插件中文名称](projects/plugin-labels-zh/README.md) | `0.1.0` · 在本机扩展列表显示中文名，保留原插件 ID 和原生操作 |

安装方式见各组件的 README。使用 12 时，将其 `package.json` 和 `gui-experimental.cjs` 放到 `~/.config/opencode/plugins/plugin-labels-zh/`。08 还包含服务端入口和随包技能，需按该组件的说明构建并保留包内目录结构。

## 安装验证工具

纯 GUI 插件具备打包产物后，可解开发行包，并运行 `python3 -B tests/sidecar_install.py /absolute/path/to/extracted/package`。工具使用 Desktop 自带后台及隔离配置，验证插件发现、bundle 内容和移除后的清单。原生窗口效果需单独验收。

[安装验证脚本](tests/sidecar_install.py) · [MIT 许可](LICENSE)
