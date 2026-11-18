# OpenCode 2 Desktop 功能可行性审计

2026-11-18 · macOS · 宿主 **2.3.2**。本机应用 Info.plist 与官方版本对应，Git 标签指向 `c0ad18b402eb2827fc1ee71c171b1177b3fc02d1`。以下结论来自读取这次发布的源码、组件调用点、测试和社区原作者资料。代码块插件的实现范围与试用结果见版本记录。[02 验收记录](projects/code-block-enhancer/README.md) · [官方发布](https://github.com/anomalyco/opencode/releases/tag/v2.3.2) · [GUI 手册](https://opencode.ai/docs/build/plugins/gui)

| 功能 | 2.3.2 的判断 | 建议及工作量¹ |
|---|---|---|
| 02 Code Block | 原生流式高亮、复制、部分专用视图；完整且显式匹配的围栏可替换 | 以已注册语言做 MVP，中；全局接管成本高 |
| 03 Markdown | 已有流式解析、表格、数学及排版；可注入 CSS | 消息范围内渐进改样式，中；依赖内部选择器 |
| 04 Compact | 自动压缩已有可展开的单行摘要；手动压缩走不同分支 | 原生优先；统一设置需要窄幅前端扩展，中 |
| 05 Execution Timeline | 原生有按类别分组、展开状态和紧凑度设置 | 先试原生；按回复生命周期折叠与持久手动覆盖需要前端扩展，高 |
| 06 Session Metrics | Context 已给出用量，回复已有回合 TPS | 共享侧栏标签可行；流中 TPS 有条件，中高 |
| 07 Provider Quota | 原生限额面向 OpenCode 账户；社区已覆盖三种目标服务 | 优先复用适配经验，按账户类型降级，高 |
| 08 File Review | 树、多格式预览、Diff、选区批注和附入对话大量已有 | 只做可复现的缺口；公共契约增强为中，原位替换为高 |

¹ 相对工作量包括兼容性、历史/流式数据和回归测试。以下 Patch 都是设计提案。

## 02 · Code Block Enhancer

`createCodeBlocks` 按小写语言索引，首个匹配 renderer 获胜。宿主判定围栏完成后挂载扩展，停止生成或从历史重载时也可能将未闭合的围栏判为完成。插件能取到代码、语言和会话。宿主保留复制按钮及附加动作，`ctx.ui.Code` 可在自定义 renderer 内复用纯代码渲染。此扩展同样可能命中工具输出和会话内的文件预览。[围栏契约][reg] · [实际分派][render] · [宿主组件][hostapi]

原生高亮器为 @pierre/highlights，OpenCodeTheme 将词法角色映射到 CSS 变量，可复用现有语言支持与流式 tokenizer。[高亮主题映射](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/ui/src/context/highlight-theme.tsx)

优先为一组显式语言和别名提供可键盘操作的折叠、行号、换行/滚动；语言外壳与长行虚拟化归 02，配色读取宿主语义变量。只在来源明确时显示路径。diff 围栏可增强，文件审阅器的双栏 Diff 归 08。想统一所有未知语言或在流中替换，需提议给分派器增加可选 fallback 和稳定的流状态；避免侵入逐 token 热路径。测未闭合/无标签、重复语言贡献、TS/Python/diff、超长行、复制原文、键盘与卸载回退。[Markdown worker][worker] · [围栏状态测试][codetest]

## 03 · Markdown Presentation Enhancer

会话用 Patchmark 的增量块与现有 Markdown 组件，样式已有标题、表格、引用、内联代码；同一组件还用于文件预览等位置。采用 GUI `Style` 注册范围受限的 CSS，在 assistant 正文的容器下调整 H1–H6、列表、引用、链接、表格横向滚动及已有数学/说明块。排除输入区、工具结果、预览和围栏内部；先用夹具验证选择器确实区分角色。设置页可控制密度；公式排版继续用原生渲染。公开 SDK 能注入样式，具体 DOM 和 `data-*` 不是稳定契约。[解析入口][stream] · [样式][css] · [消息渲染][message] · [扩展声明][reg]

新增语法或更换整棵消息 AST 缺少公开入口。若新版 DOM 无法区分正文，建议宿主仅在 assistant prose 根增加稳定属性，风险集中在两个时间线实现及虚拟化复用。测流式分段与重载一致、两种主题、嵌套列表、宽表格/公式、窄窗、输入框样式和源文本不变，02 开关两态。

## 04 · Compact Auto Collapse

`SessionCompactionMessage` 按结构化 `reason/status` 分支。自动压缩进入 `QuietCompaction`，默认关闭且点击可读摘要，历史加载亦然。手动压缩或失败走独立分支，手动成功会直接展示摘要；已失败的数据可能没有摘要。新时间线也有对应组件。通常可先使用原生，剩余工作主要是自选默认值与手动成功的统一呈现。[消息实现][message] · [新时间线][compactnext] · [宿主行分派][rows]

公共 Slot 无压缩行或 disclosure 策略。若必须实现，建议给两个前端组件共用一项可选默认策略，标识使用 message ID，默认关时保持原生行为，错误与中断原因保持可见，普通重渲染保留用户选择。备选为只读摘要历史面板，无法改变原位展示。测手动/自动、后台预计算、完成/运行/失败/取消、无摘要及旧历史；比较展示前后原始消息。[时间线接口边界][limits]

## 05 · Execution Timeline Auto Collapse

Desktop 的 Timeline Detail 按 shell、edit、thinking、subagents、notices、tools、commentary 提供分组、展开或隐藏；projection 合并连续活动并稳定组 key，两个 renderer 的选择在同一页面。原生紧凑模式可先交付给需要减少噪声的用户。TUI 的 verbosity 与 Desktop 是两条代码路径。[设置][detailui] · [预设][detail] · [分组与回合边界][projection] · [实际页面][page]

公开 GUI 无法改动每回合中间行。若要求“执行中展开、结束后整组自动收起”，最小修改在 UI projection 和 disclosure 层增加可选的完成回合展示策略；复用现有分组和虚拟列表，不复制日志。按 server/session/turn 持久化手动覆盖，仅第一次 live→terminal 应用默认值，保存工具数、失败/中断标记，最终正文始终单列。并行子任务按所属回合归类，不以整个会话 idle 代替所有子任务完成。替代交付为独立概览标签。测旧会话分页/重新打开、手动全部开关、断线重连、工具失败、并行、分支、滚动锚点及全文搜索；两个 renderer 分别验收。[行状态][rows] · [时间线边界][limits]

## 06 · Session Metrics Monitor

Context 取同步数据中的消息，内置菜单显示上下文占用，详情已有最近步骤的输入/输出和 cache read/write。回复行及 debug bar 使用原生回合 TPS。公开 `session.server.data` 与对应 server client 可支持只读聚合，无需改 Agent。跨时间窗/模型统计必须将历史分页补齐或标记部分结果；默认仅此会话，子会话单列可选，不双计。社区 useCacheHitMetrics 把 stats、token-speed 和 TUI 布局分开，适合复用统计/子会话夹具思路，TUI 组件本身不能装进 Desktop。[原生 Context][usagetab] · [时间度量][speed] · [GUI 数据][hostapi] · [cache-hit 实现](https://github.com/zhumengzhu/opencode-cache-hit/blob/main/src/use-cache-hit-metrics.ts) · [社区 TPS Meter](https://github.com/rizal72/opencode-plugins)

归一化的 `input` 是未缓存输入。全输入 = input + cache.read + cache.write，命中率 = Σread / Σ全输入；零分母显示「—」。可见输出与 reasoning 分列。完成步骤可按上游计算 Σ(output + reasoning) / Σ(streamed − firstToken) 秒，旧记录回退 created 时标明含首包等待。流上的 first-token / streamed 是时间点，最终 tokens 在 ended 或部分 failed 上出现。没有逐 token 真值时，仅在有适配 tokenizer 的情况下按文本增量显示「估算·可见输出 TPS」，否则显示等待，不能把 chunk 当 token。按消息 ID 替换快照，持久事件重放去重，渲染限频约 4 Hz，非活动会话停采样。测缺字段、重试、多模型、多服务、重连回放与工具等待。[计数归一化][usage] · [步骤事件][events] · [原生 TPS][speed]

## 07 · Provider Quota Monitor

OpenCode 的 Usage 对话框和后端针对 OpenCode Console budgets/Go；ChatGPT 限额提示可引导查看账户。缺少对任意 provider 一次返回账户余额的公共 GUI 方法。采用独立服务端只读适配器，经插件 RPC 返回脱敏快照，GUI 只处理展示。优先评估 MIT 项目 opencode-quota 已有的三方覆盖与测试；可共享接口或移植适配器，移植前固定上游版本并保留许可。其 Desktop 侧栏也可作为独立替代。[原生额度服务][quota] · [原生 ChatGPT 提示][chatgpt] · [社区项目](https://github.com/slkiser/opencode-quota)

| 来源 | 可承诺的数据 | 限制和降级 |
|---|---|---|
| OpenAI API / ChatGPT 订阅 | API 限流头的请求/token 窗口；订阅只展示经对应账户接口验证的窗口 | RPM/TPM、组织用量或本地消耗都不能当账户余额。社区订阅接口有变更风险；普通 API key 缺可靠余额来源时显示不可获取。[官方限流说明](https://developers.openai.com/api/docs/guides/rate-limits) · [社区认证分支](https://github.com/slkiser/opencode-quota/blob/main/src/providers/openai.ts) |
| Kimi Code | Kimi 官方工具提供 /usage，CLI 服务文档有配额查询；按实际返回显示窗口 | 工具自身的本地 OAuth 接口要求已有相应服务和授权。使用现有 Kimi Code 连接时需另核实地区、套餐和字段；不能推算缺失月窗。[官方服务 API](https://www.kimi.com/code/docs/en/kimi-code-cli/reference/server-api.html) · [官方 FAQ](https://www.kimi.com/en/help/kimi-code/faq) |
| MiniMax Token Plan | 官方给出 GET /v1/token_plan/remains，使用套餐 key，按窗口展示 | 区分套餐与按量 key，社区适配器分别处理国际端返回剩余数与中国端返回已用数，须用两个同值反向含义的夹具校验。未知响应保留 unavailable。[官方套餐查询](https://platform.minimax.io/subscribe/token-plan) · [社区映射代码](https://github.com/slkiser/opencode-quota/blob/main/src/providers/minimax-coding-plan.ts) |

读取授权能力以服务端 integration connection 接口和 provider 身份为界，不读个人配置文件，不向 GUI、日志或其他插件传 key。显示来源、单位、剩余、窗口、resetAt、observedAt、过期/不可用原因；并发去重，每供应商独立超时、缓存和退避，尊重 Retry-After，隐藏时暂停刷新。测试用合成响应覆盖 401/403/429、过时、缺字段、零额度、跨时区与一个适配器宕机；本次未查询账户。[插件服务端接线][adapter]

## 08 · File Review Enhancer

内置 file/review 已有文件树、Markdown/代码/图片/PDF/HTML 预览、Diff 和选区批注。file view 在添加批注后已调用 composer.attach；2.3.1 又将选区复制与 Add comment 分开。优先保留整条原生路径，收集真实缺口再决定项目范围。[文件预览][artifact] · [选区与附入][fileview] · [Review][reviewdir] · [官方变更](https://opencode.ai/changelog)

公开 file.tree、review.changes、会话 composer 和 side Panel 可做聚合导航/额外引用操作；FileViewer 针对宿主转交的文件种类，不能假定能覆盖已内建的 PDF/HTML。社区 file-editor 可参考面板与预览，写盘编辑不在本期。原位修改内置 Diff 工具栏缺扩展时，仅建议添加一个带选区上下文的动作贡献点，升级重测 selection、Diff 行映射与远端文件边界。测重命名、二进制/超大文件、左右 Diff 行号、附件回链、失效选区和受限 HTML 预览。[文件契约][fileapi] · [审阅契约][reviewapi] · [社区文件面板](https://github.com/cheejiayuan512/opencode-file-editor)

[adapter]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/promise/adapter.ts
[artifact]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/gui-plugins/src/file/artifact-view.tsx
[chatgpt]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/app/src/providers/connect/chatgpt-usage-limit.tsx
[codetest]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown-code-machine.test.ts
[compactnext]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/timeline-next/compaction.tsx
[css]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown.css
[detail]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/timeline/detail.ts
[detailui]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/app/src/settings/timeline-detail.tsx
[events]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/schema/src/session-event.ts
[fileapi]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/file.ts
[fileview]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/gui-plugins/src/file/view.tsx
[hostapi]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/host-apis.ts
[limits]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/gui-plugins/README.md
[message]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/message/message-content.tsx
[page]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/app/src/session/timeline/message-timeline.tsx
[projection]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/timeline/projection.ts
[quota]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/core/src/usage-limits.ts
[reg]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts
[render]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/app/src/runtime/plugin/render.tsx
[reviewapi]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/review.ts
[reviewdir]: https://github.com/anomalyco/opencode/tree/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/gui-plugins/src/review
[rows]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/timeline/session-timeline-row.tsx
[speed]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/util/src/session-turn.ts
[stream]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown-stream.ts
[usage]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/core/src/session/usage.ts
[usagetab]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/gui-plugins/src/context/tab.tsx
[worker]: https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/session-ui/src/components/markdown-worker.ts
