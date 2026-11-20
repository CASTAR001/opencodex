# 仓库与集成设计

每个插件使用独立的本地 Git 仓库。OpenCodex 是所有公开插件共用的远程备份和浏览入口。总仓库的 `main` 将组件文件汇总到 `projects/<插件名>/`，`plugins/<插件名>` 分支以该插件为仓库根目录，保留独立的公开提交历史。开发在各插件仓进行，通过测试后将同一版本同步到组件目录和备份分支。各组件采用 MIT 许可。

## 恢复单个插件

例如，下面的命令会得到一个可直接运行 `npm test` 的代码块插件工作树。更换分支名即可取回其他组件的历史。

```sh
git clone --single-branch --branch plugins/code-block-enhancer https://github.com/CASTAR001/opencodex.git code-block-enhancer
```

常规克隆合集后也可以直接浏览和构建 `projects/` 下的组件。总仓库存放普通文件，无需初始化子模块。

## 组件分工

| 组件或工作区 | 所有权与阶段 |
|---|---|
| ux-integration | 源码证据、版本组合、跨插件验收与复跑入口 |
| code-block-enhancer | 02 · 会话与右侧 Markdown 文件内的代码围栏。alpha.8 支持限高滚动、吸顶工具栏、逐块行号与换行，以及 Diff 片段和增删对照 |
| markdown-presentation | 03 · assistant 正文的排版。第一批后续 |
| compact-auto-collapse | 04 · 压缩摘要。第三批，先评估原生 |
| execution-timeline | 05 · 回合中间活动的展示。第三批 |
| session-metrics | 06 · 会话顶栏常驻显示缓存命中率、跨模型实时 TPS 和上下文使用率，明细侧栏共享同一份会话数据。alpha.3 已完成安装验证。[开发计划](projects/session-metrics/PLAN.md) |
| provider-quota | 07 · 对话顶栏的统计图标打开独立用量页，按当前连接显示服务商，用量从本机历史统计，账户额度由用户手动刷新。alpha.2 已通过本机验收。 |
| file-review-enhancer | 08 · 文件审阅缺口。第四批 |
| bilingual-fonts | 09 · 独立的中西文字体设置页。初始跟随 OpenCode，用户选择保存在本机。 |
| prompt-navigation | 10 · 按消息 ID 导航到用户提示，追加提示各有刻度。星标按会话保存，历史分页与跳转交给原生时间线。 |
| project-sidebar | 11 · 侧边标签页按项目目录组织会话，使用宿主标签接口打开会话。侧栏保留切回原生列表的入口。 |

## 消息渲染分工

02 拥有围栏内部的结构与交互，03 负责正文及行内代码排版。两者直接读取宿主语义变量，分别进行单装与组合测试。

## 共享侧栏

2.3.2 的公开 Panel 仅有 side 区域，选中的标签内容独占该处；可固定标签、调宽和关闭。session.panel.end 是标签条操作区，session.header 能显示紧凑摘要，window.bottom 能放一个窗口底栏。选择文件标签时不能同时保证完整监控板可见。默认建议为一个固定监控标签 + 可隐藏的紧凑底栏摘要；详细视图保留文件导航和各自的打开状态。[面板及插槽定义][reg] · [真实侧栏][side] · [社区 Workbench 实践](https://github.com/henrikogaard/opencode-plugins)

目前 06 使用会话顶栏与明细侧栏，07 使用独立统计弹窗。若后续将两者合并展示，可由 06 提供共享面板，07 提供只读额度快照，06 通过可选运行时依赖读取。两者仍可分别安装和测试。[运行时契约][contract]

| 协议项（提案） | 语义 |
|---|---|
| provider-quota.windows.v1 | 07 所有；只读快照列表，按 server + connection 的非敏感 ID + 窗口区分 |
| quota window | provider、accountLabel、kind、limit/used/remaining 可空、unit、resetAt 可空、observedAt、sourceKind、status |
| 更新与失效 | 按 session/server 反应式读取；pending / inactive / failed 保留 06，隐藏或标记 07；卸载清理订阅。过期可保留上次值及时间 |
| 展示 | 摘要只读，设置中选 compact/detail、隐藏、侧栏/底部；网络错误不得抛到宿主面板之外 |

若验收必须满足“文件树打开时同侧仍有独立监控区”，建议先向上游提出一个在 SideRegion 内容区外、导航之后的公开插槽，支持高度约束、窄窗收起和空贡献时零占位。位置排序与隐藏归宿主，贡献者只读取当前 screen。需同时测试拖拽改宽、文件树、标签恢复、手机布局和键盘焦点。此提案与 04/05 的展示策略独立，均先用上游 PR 或独立、可撤销的前端补丁评估，涉及私有 DOM、虚拟行或 renderer 切换时重新比对版本。Agent、会话存储和模型提供商配置不参与这些改动。

## 版本、验收与撤回

开发基线为官方 tag v2.3.2，源码 SHA 见审计。各组件可分别安装、关闭或移除。在对应的组件目录生成包、运行测试、更新 CHANGELOG 与兼容范围，确需发布时可用带组件名前缀的 tag 标识版本。根目录记录跨插件验收组合。目标 macOS 实例完成验收后再登记结果，其他操作系统或新版本单独验证。

02、03 分别测试单装、合装，以及按不同顺序禁用。06 首先测试单装和切换会话或远程 server；07 就绪后再测试其单装、合装、超时和卸载。每次先复跑宿主 API、解析器和历史夹具，再做隔离 Desktop 冒烟。要回退某个组件，可在 Desktop 中停用该组件，重新安装该组件前一个已验证的包。

[contract]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/context.ts
[reg]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts
[side]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/app/src/runtime/plugin/side-region.tsx
