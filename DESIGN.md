# 仓库与集成设计

各插件在独立 Git 仓库开发、测试与发布。本协调仓汇集功能范围、接口设计和兼容性验证工具。projects 目录收录各插件的范围与阶段记录，版本对应关系见首页。各项目采用 MIT 许可。

| 仓库 | 所有权与阶段 |
|---|---|
| ux-integration | 源码证据、版本组合、跨插件验收与复跑入口 |
| code-block-enhancer | 02 · 代码围栏顶栏、复制与逐块换行。alpha.3 已完成本机试用 |
| markdown-presentation | 03 · assistant 正文的排版。第一批后续 |
| compact-auto-collapse | 04 · 压缩摘要。第三批，先评估原生 |
| execution-timeline | 05 · 回合中间活动的展示。第三批 |
| session-metrics | 06 · 会话统计、共享监控标签。下一项优先开发，详见[缓存命中率与 TPS 计划](SESSION_METRICS_PLAN.md) |
| provider-quota | 07 · 套餐额度来源、降级与独立展示。第二批 |
| file-review-enhancer | 08 · 文件审阅缺口。第四批 |

## 消息渲染分工

02 拥有围栏内部的结构与交互，03 负责正文及行内代码排版。两者直接读取宿主语义变量，分别进行单装与组合测试。

## 共享侧栏

2.3.2 的公开 Panel 仅有 side 区域，选中的标签内容独占该处；可固定标签、调宽和关闭。session.panel.end 是标签条操作区，session.header 能显示紧凑摘要，window.bottom 能放一个窗口底栏。选择文件标签时不能同时保证完整监控板可见。默认建议为一个固定监控标签 + 可隐藏的紧凑底栏摘要；详细视图保留文件导航和各自的打开状态。[面板及插槽定义][reg] · [真实侧栏][side] · [社区 Workbench 实践](https://github.com/henrikogaard/opencode-plugins)

06 拥有共享 Panel，渲染 Current Session 与可选的 Provider Quotas。07 提供以自身插件 ID 命名的 V1 契约，可独立安装并用自己的菜单打开独立标签。06 经 ctx.use 响应式读取 07 的 ctx.provide；只形成 06→07 的可选运行时依赖。共同字段规范公开在协调仓库，双方可分别测试。两项功能共用一个默认监控标签。[运行时契约][contract]

| 协议项（提案） | 语义 |
|---|---|
| provider-quota.windows.v1 | 07 所有；只读快照列表，按 server + connection 的非敏感 ID + 窗口区分 |
| quota window | provider、accountLabel、kind、limit/used/remaining 可空、unit、resetAt 可空、observedAt、sourceKind、status |
| 更新与失效 | 按 session/server 反应式读取；pending / inactive / failed 保留 06，隐藏或标记 07；卸载清理订阅。过期可保留上次值及时间 |
| 展示 | 摘要只读，设置中选 compact/detail、隐藏、侧栏/底部；网络错误不得抛到宿主面板之外 |

若验收必须满足“文件树打开时同侧仍有独立监控区”，建议先向上游提出一个在 SideRegion 内容区外、导航之后的公开插槽，支持高度约束、窄窗收起和空贡献时零占位。位置排序与隐藏归宿主，贡献者只读取当前 screen。需同时测试拖拽改宽、文件树、标签恢复、手机布局和键盘焦点。此提案与 04/05 的展示策略独立，均先用上游 PR 或独立、可撤销的前端补丁评估，涉及私有 DOM、虚拟行或 renderer 切换时重新比对版本。Agent、会话存储和模型提供商配置不参与这些改动。

## 版本、验收与撤回

开发基线为官方 tag v2.3.2，源码 SHA 见审计。本地包从绝对目录或 file URL 加入 Desktop 后台服务的全局配置；每个插件单独关闭或移除。可发布版本由各仓库自己生成包、运行本仓测试、更新 CHANGELOG/兼容范围、用独立 tag 关联发布物。集成仓只记录宿主/插件版本与已通过的组合。在目标 macOS 实例完成外观选择、禁用/恢复和重启测试后才登记生产验证；其他操作系统或新版本需单独验证。

第一批覆盖 02 单装、03 单装、02 与 03 合装，以及按不同顺序禁用。第二批覆盖 06 单独、07 单独、合装、07 超时/卸载、切换会话/远程 server。每次优先复跑宿主 API/解析器、选区和历史夹具，再做隔离 Desktop 冒烟。若原生已满足验收，关闭对应自制实现。回退时先切换内置功能并禁用该插件，必要时将该仓库检出到前一已验版本再重载；协调仓库保留版本组合，其他插件可继续使用。

[contract]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/context.ts
[reg]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts
[side]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/app/src/runtime/plugin/side-region.tsx
