# 插件中文名称

在 macOS OpenCode Desktop 2.3.2 的「设置 → 扩展 → 插件」中，默认以中文显示本合集的本机插件，包括本插件自身。悬停在名称上可查看原插件 ID。它可以与任意主题搭配，关闭后恢复原来的名称。

把 `package.json` 和 `gui-experimental.cjs` 一起放进 `~/.config/opencode/plugins/plugin-labels-zh/`。插件只在设置页处理已知插件的名称文字。宿主继续按原 ID 保存设置、切换开关和执行重新加载。

2.3.2 的扩展列表直接使用插件 ID，当前适配依赖列表行的 DOM 结构。升级宿主时应复核该选择器。
