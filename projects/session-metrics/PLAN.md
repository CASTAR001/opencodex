# 会话缓存命中率与 TPS 开发计划

代码块插件 02 的本机验收基线为 `0.1.0-alpha.3`（`ea1b8d8`）。接下来优先开发 **06 Session Metrics Monitor**，目标宿主为 macOS OpenCode Desktop 2.3.2。首版让用户在当前会话的侧栏看到「有多少输入来自缓存」和「最近一回合每秒生成多少 token」。实现、测试和打包在本地独立的 `session-metrics` 仓库完成。通过验收后，总仓库将公开版本同步到 `main` 的 `projects/session-metrics/` 和备份分支 `plugins/session-metrics`。

当前试用版 `0.1.0-alpha.3` 采用参考 TUI 的跨模型实时 TPS，顶栏同时显示缓存命中率和上下文使用率。下方保留首版设计与验收基线；各版实际计算范围见[当前使用说明](README.md)。

## 用户会看到什么

- 在会话侧栏打开「会话统计」标签。顶部显示模型、缓存命中率和最近回合 TPS，下方展开总输入、未缓存输入、缓存读取、缓存写入、可见输出和推理 token。首屏默认仅统计当前会话，切换模型或时间范围时同步更新用量和比例。子代理有自己的会话。
- 生成时显示「生成中」，上一回合的数据保留「上一回合」标签。结束后显示本回合 TPS。只有验证了模型对应的 tokenizer 和可见文本增量后，才额外显示「估算 · 可见输出 TPS」。结束时以宿主记录值结算。两种速度的输出范围在提示中说明。
- 06 单独可用。OpenCode 的侧栏一次显示一个标签，用户打开文件树时仍可通过会话面板菜单返回统计。套餐余额、重置时间及账户访问归 07，另行排期。[侧栏注册接口](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/registries.ts#L258)

## 指标口径

| 指标 | 首版计算和缺失值处理 |
|---|---|
| 缓存命中率 | 按输入 token 加权。总输入 = 未缓存输入 `input` + 缓存读取 `cache.read` + 缓存写入 `cache.write`。命中率 = Σ缓存读取 ÷ Σ总输入。分母为零显示「—」，有输入且读取为零显示 0%。 |
| 数据覆盖 | 用量取有 `tokens` 的消息快照，失败步骤有计数时也纳入。标明缺少用量的已结束步骤数。宿主将未上报的单个计数归零，界面注明「按宿主记录」，由此无法判定供应商是否启用缓存。压缩请求有单独的用量，计入会话用量并在明细单列；缺少模型归属的显示「模型未知」。 |
| 回合 TPS | 回合内各 assistant 步骤的 Σ(可见输出 + 推理 token) ÷ Σ生成用时（秒）。每步用时取 `streamed − firstToken`，避开工具执行与等待时间；旧数据回退到 `created` 并标明「含首 token 等待」。以宿主的 idle 边界分回合，旧会话使用最近的用户或合成输入。缺计数、缺结束时间、没有输出或总用时无效时显示「—」。 |
| 筛选 | 用量按步骤创建时间落入半开区间，模型按 provider 和模型 ID 分组。回合 TPS 始终标明对应回合，筛选后的步骤不足以组成完整回合时不展示该速度。时间范围首版提供整个会话和最近一小时。 |

2.3.2 的 Context 详情使用最近一步的用量。会话累计须读取逐条消息。源码中，首 token 到达和响应体流完各有时间点，结束事件才带最终用量，失败事件的用量可缺省。生成中的文本块没有通用的逐 token 计数。[用量归一化](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/core/src/session/usage.ts#L11) · [消息与压缩用量](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/schema/src/session-message.ts#L221) · [步骤事件](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/schema/src/session-event.ts#L349) · [宿主回合 TPS](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/util/src/session-turn.ts#L42)

## 开发与验收顺序

| 批次 | 交付 | 验收 |
|---|---|---|
| 1 · 统计函数与夹具 | 在组件目录用合成消息实现快照更新、筛选、命中率和回合 TPS。按 server、session、message ID 去重，更新同一消息时替换旧值。 | 两步的（未缓存、读、写）分别为 (20, 70, 10)、(200, 0, 0)，累计应为 70/300 = 23.3%。两步分别生成 120、30 token，用时 2、1 秒，回合应为 50 TPS。加入工具等待、重复快照、旧时间戳、缺用量和零分母后逐项核对。 |
| 2 · Desktop 数据接入 | 优先读取 `session.server.data.session.message.list(session.id)`，用同一 server 的 `client.message.list` 按游标补历史。分页和实时快照按 ID 合并，实时较新的值优先。加载中或中断标记「部分历史」，切换会话取消旧请求。 | 两页有重叠、跨页一回合、多模型、重试、父/子会话、两个 server 上的同名 ID、断线重连。完整加载后的结果须与一次性读取相同，延迟返回的旧页不会覆盖当前会话。 |
| 3 · 侧栏原型 | 使用公开 GUI Panel 和会话面板菜单，适配宿主主题与窄窗。用量随消息快照更新；流中界面更新上限为每秒 4 次，结束立即结算，关闭视图后停止主动采样。 | 用离线事件回放验证生成、工具等待、结束和失败的显示。检查单装、键盘打开、切换会话和停用清理。用相同夹具核对 Desktop 原生回复 TPS，记录旧数据或缺字段时的表现。 |
| 4 · 打包与本机试用 | 每批测试通过后限定路径提交。在隔离 Desktop 2.3.2 验证 GUI bundle 的发现、加载、卸载和回退，再安装本机试用。 | 记录宿主和插件版本、提交、bundle 哈希以及一组可复算数字；区分后台加载检查和实际窗口验收。禁用 06 后宿主会话与其他插件可继续使用。 |

数据接入沿用宿主内置 Sources 面板和 Context 导出的做法。GUI 入口属于实验性接口，升级时优先复测分页、回合边界和面板挂载。这一阶段使用公开只读 GUI 接口，无需修改 Agent 或 Desktop 源码。[内置面板取数](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/gui-plugins/src/sources/panel.tsx#L13) · [宿主分页示例](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/gui-plugins/src/context/export.ts#L21) · [GUI server 接口](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/plugin/src/gui/host-apis.ts#L13)
