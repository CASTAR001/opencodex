# 插件中文名称

在 OpenCode Desktop 的「设置 → 扩展 → 插件」中，默认以中文显示本合集的本机插件，包括「对话正文增强」「对话文件右栏临时修复」和本插件自身。悬停在名称上可查看原插件 ID。它可以与任意主题搭配，关闭后恢复原来的名称。

把 `package.json` 和 `gui-experimental.cjs` 一起放入全局插件目录下的 `plugin-labels-zh/`。macOS 的默认全局目录是 `~/.config/opencode/plugins/`，Windows 是 `%USERPROFILE%\.config\opencode\plugins\`。插件只在设置页处理已知插件的名称文字。宿主继续按原 ID 保存设置、切换开关和执行重新加载。

已在 macOS 2.3.2 和 2.4.0 的隔离设置页验证。两版的扩展列表直接使用插件 ID，当前适配依赖列表行的 DOM 结构。升级宿主时应复核该选择器。
