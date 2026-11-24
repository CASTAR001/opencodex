# OpenCodex · OpenCode Desktop 插件合集

适用于 **Windows 和 macOS 的 OpenCode 2 Desktop**。可以按需增强代码块、阅读右栏 Markdown 文件、跳转到历史提示词、选择中英文字体，或查看用量和剩余额度。日常使用的插件已完成 Windows 原生桌面版迁移，代码块增强和钱包已在 macOS Desktop 2.4.0 验收，并保留对 2.3.2 的兼容性。

- [功能需求与开发顺序](REQUIREMENTS.md)
- [逐项可行性与源码依据](FEASIBILITY.md)
- [模块边界、共享侧栏和兼容性设计](DESIGN.md)
- [会话缓存命中率与 TPS 开发计划](projects/session-metrics/PLAN.md)

## 项目索引

在 `main` 的 `projects/<插件名>/` 可以找到每个公开插件，已有实现的组件附有源码、测试和安装说明。每个插件保留自己的本地 Git，同一远端的 `plugins/<插件名>` 分支备份该插件的独立历史。[只恢复一个插件](DESIGN.md#恢复单个插件)

| 编号 | 组件 | 当前状态 |
|---|---|---|
| 02 | [代码块增强](projects/code-block-enhancer/README.md) | `0.1.0-alpha.9` · 使用 2.4.0 原生换行与复制，保留限高滚动、行号和 Diff 对照 |
| 03 | [对话 Markdown 排版](projects/markdown-presentation/README.md) | `0.1.0` · 2.4.0 工具组甜橙圆点、成功回复分隔线与中英混排修复 |
| 04 | [Compact 自动折叠](projects/compact-auto-collapse/README.md) | 随 05 完成试验，已作学习存档 |
| 05 | [任务执行过程折叠](projects/execution-timeline/README.md) | 插件与前端补丁已作学习存档，独立试用版已退役 |
| 06 | [缓存与生成速度监控](projects/session-metrics/README.md) | `0.1.0-alpha.4` · 实时缓存命中率、TPS 和上下文占用，窄窗口自动隐藏 |
| 07 | [用量与剩余额度](projects/provider-quota/README.md) | `0.1.0-alpha.8` · 服务商卡片可排序，同一服务商内按额度连接分组。支持 MiMo 中国区个人 Token Plan 官方余量 |
| 08 | [Markdown 阅读器](projects/file-review-enhancer/README.md) | `0.1.0-alpha.7` · 右栏阅读、脚注往返与自适应表格。PDF 沿用当前主题、字体和栏宽，另支持离线 HTML 与可编辑 Word（需 Pandoc） |
| 09 | [中英文字体](projects/bilingual-fonts/README.md) | `0.1.0-alpha.1` · 分别设置中西文字体，偏好保存在本机 |
| 10 | [提示词快捷导航](projects/prompt-navigation/README.md) | `0.1.0-alpha.4` · 左侧提示词刻度、标星与跳转，支持长对话 |
| 11 | [项目文件夹整理](projects/project-sidebar/README.md) | **已弃用** · 最后版本 `0.1.0-alpha.3`。侧边标签页使用 OpenCode 原生项目分组 |
| 12 | [插件中文名称](projects/plugin-labels-zh/README.md) | `0.1.1` · 在本机扩展列表显示中文名，保留原插件 ID 和原生操作 |
| 13 | [对话文件右栏临时修复](projects/session-file-reveal/README.md) | `0.1.0` · 点击回复中的本地文件时展开右栏。仅在 Desktop 2.3.2 启用，已在 macOS 验收 |

## 在 Windows 和 macOS 上安装

首次安装可从上表的 **02、03、06、07、08、09、10、12** 中按需选择。使用 Desktop 2.3.2 时可额外安装 **13**。下表列出 Desktop 使用本机后台时的默认全局插件目录。

| 平台 | 插件目录 |
|---|---|
| Windows 原生 Desktop | `%USERPROFILE%\.config\opencode\plugins\`（可粘贴到资源管理器地址栏） |
| macOS | `~/.config/opencode/plugins/` |

如果为后台设置了 `XDG_CONFIG_HOME`，插件目录在其下的 `opencode/plugins/`。若 Desktop 连接 WSL 或远程后台，请使用相应后台的配置目录。

1. 克隆合集并进入要安装的组件目录。例如，安装代码块增强时运行以下命令。

   ```sh
   git clone https://github.com/CASTAR001/opencodex.git
   cd opencodex/projects/code-block-enhancer
   ```

2. 准备发行包。除 Markdown 阅读器外，上述组件均已附带 GUI 成品，可直接运行 `npm pack --ignore-scripts`。**Markdown 阅读器**在其组件目录先运行 `npm ci --include=dev`，再运行 `npm pack`，由打包脚本生成 `dist/`。Windows PowerShell 可用 `npm.cmd` 执行相同命令。
3. 解开生成的 `.tgz`（两端都可运行 `tar -xf <包文件名.tgz>`），将其中的 `package` 文件夹改名为插件 ID，再放入上表的插件目录。例如代码块增强的清单应在 `plugins/code-block-enhancer/package.json`。保留包内的目录结构，以便额度插件加载服务端和 RPC、Markdown 阅读器加载服务端和随包技能。
4. 下次打开 Desktop 后，在「设置 → 扩展 → 插件」确认已加载。装了「插件中文名称」时，悬停名称可查看原 ID。字体在本机的「设置 → 中英文字体」中选择，终端字体在「设置 → 外观」中选择。

## 安装验证

两端都可以用已有会话和工作区文件验证界面效果。例如，在对话代码块切换行号，或从右侧文件树打开[示例 Markdown](projects/file-review-enhancer/examples/tidal-notebook.md) 检查脚注和表格。

macOS 另有纯 GUI 插件隔离验证脚本。解开发行包后，在合集根目录运行 `python3 -B tests/sidecar_install.py /absolute/path/to/extracted/package`。脚本默认调用 `/Applications/OpenCode.app` 内的后台，检查插件发现、GUI 包内容及移除后的清单。

[安装验证脚本](tests/sidecar_install.py) · [MIT 许可](LICENSE)
