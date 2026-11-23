# 用量与额度

OpenCode Desktop 的独立插件。点击对话顶栏的**钱包图标**打开「剩余额度」，旁边的「用量统计」可查看历史用量。新建对话时，草稿内容区右上角的钱包可查询本机全局配置的服务商。已有对话在宽度低于 768 CSS 像素时，钱包移到窗口右下方。

**用量统计** 使用宿主的 `experimental.session.stats`，和 `opencode stats` 读取同一份跨会话历史。默认显示当前服务器、所有项目的近七天用量，可选今天、近三十天和全部时间，按服务商筛选。表格分列输入、输出、推理、缓存读写。服务器在页面关闭时继续记账；打开时读取最新数据，在步骤完成后更新，并每分钟校准。统计范围限于这台 OpenCode 服务器记录的调用。

**服务商列表**读取当前工作区可用的模型连接和已启用的 MCP 配置。配置变化时更新筛选器和额度卡片，并清掉已移除连接的显示快照。仅配置 MiniMax MCP 也可以显示 MiniMax。

在「剩余额度 → 排序」用上下箭头移动服务商卡片，然后点「完成排序」。调整即时保存，用量筛选器沿用相同顺序。新配置的服务商排在末尾，临时移除后重新配置的服务商恢复已保存的位置。同一服务商的各账户保持原有分组。

**MiniMax MCP** 分别统计生图和语音的成功与失败。从 OpenCode 保留的历史中读取直接工具和 Code Mode 的内层调用，同一次调用计数一次。宿主的 MCP 记录可以确认调用状态，官方媒体工具的返回值无法提供每笔实际扣额。历史不可读时，界面会标明仅展示插件启用后的观察记录。[MiniMax 官方 MCP 实现](https://github.com/MiniMax-AI/MiniMax-MCP/blob/main/minimax_mcp/server.py)

**MiMo** 使用已连接的中国区个人 Token Plan 和套餐专属密钥（`tp-`）。点钱包即可看到当前计费周期的剩余百分比和按本机时区显示的周期结束时间。百分比取自官方返回的剩余 Credits 与总 Credits，总量不可用时直接显示剩余积分。「用量统计」保留 OpenCode 记录的模型步骤和 Token 数。[小米官方套餐余量接口](https://mimo.mi.com/docs/zh-CN/api/asset/credits-get)

**剩余额度** 在打开页面、从用量页切回或新增可查询连接时自动请求一次。也可手动刷新单项或全部。服务端使用当前工作区可用的 API Key 连接、官方端点的直接配置或官方 MiniMax MCP 的配置。渲染窗口只接收查询结果。插件使用固定 HTTPS 端点，拒绝重定向，合并相同在途查询，并处理超时和限流。同一把 Key 对应不同站点时，可点「查询此连接」选择目的地。读数只在本次弹窗内展示，关闭后再次打开会重新查询。

| 服务 | 额度显示 |
| --- | --- |
| Kimi | Moonshot 开放平台按区域显示余额；Kimi Code 展示返回的 5 小时、周及月度窗口，保留计数和重置时间。额度页优先显示剩余百分比，可用总量与已用量换算。缺少窗口时显示「接口未返回此窗口」。[余额](https://platform.moonshot.ai/docs/api/balance) · [套餐接口现状](https://github.com/MoonshotAI/kimi-code/issues/2937) |
| DeepSeek | 展示官方返回的各币种可用余额，保留零余额。[官方接口](https://api-docs.deepseek.com/zh-cn/api/get-user-balance/) |
| GLM | 查询智谱或 Z.AI 个人 Coding Plan 窗口，把已用比例换算为剩余比例，并展示重置时间。普通按量 Key 可能没有套餐查询权限。[官方查询插件](https://docs.bigmodel.cn/cn/coding-plan/extension/usage-query-plugin) |
| MiniMax | 查询与 Key 匹配站点的 Token Plan 窗口，逐模型显示周期和周窗口的剩余百分比及重置时间。缺少百分比时，沿用官方 CLI 对旧版计数的解释，用剩余计数除以总数。按量生图或语音 Key 可能仅能提供本地调用次数。[中国站](https://platform.minimaxi.com/subscribe/coding-plan) · [官方 MCP](https://github.com/MiniMax-AI/MiniMax-MCP) |
| MiMo | 中国区个人 Token Plan 使用套餐专属密钥查询本期剩余比例和周期结束时间。 |
| Qwen | 可看本地模型统计。此版本未接入独立的阿里云账务授权。[百炼用量查询](https://help.aliyun.com/zh/model-studio/usage-api) |

## 安装和验证

同一服务商配置多个模型或受支持的 MCP 连接时，钱包会按官方查询地址和 API Key 分组。共用同一组的连接合并显示，并列出连接名。不同 Key 分别查询，即使属于同一账单账户也不会相加。跨站共用 Key 时由你选择要查询的站点。

运行 `npm ci`、`npm run build`、`npm test` 和 `npm pack`。把生成包中的 `package/` 全部内容放入 OpenCode 全局插件目录的 `provider-quota/` 子目录，然后重新打开 Desktop。回退时可在设置中停用 GUI；完整停用服务端采集需要将插件移出发现目录并重新加载服务。界面和服务端独立于 Session Metrics、主题及字体插件。

版本 `0.1.0-alpha.8` 的排序已用 2.3.2 和 2.4.0 的隔离渲染器及合成服务商验证，覆盖关闭重开、筛选器顺序和配置增删。

版本 `0.1.0-alpha.6` 已在 macOS 的 OpenCode Desktop 2.3.2 上验收，MiMo 本期剩余额度可正常显示。自动化检查覆盖构建、服务商路由和隔离后台加载。宿主升级后需复核 GUI 入口、统计接口和 RPC，以及 MiniMax MCP 内层调用使用的只读 SQLite 查询。
