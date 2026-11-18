# 用量与额度

OpenCode Desktop 2.3.2 的独立插件。点击对话顶栏的**统计图标**（悬停提示「查看用量与额度」） 打开统计页面。

**用量统计** 使用宿主的 `experimental.session.stats`，和 `opencode stats` 读取同一份跨会话历史。默认显示当前服务器、所有项目的近七天用量，可选今天、近三十天和全部时间，按服务商筛选。表格分列输入、输出、推理、缓存读写。服务器在页面关闭时继续记账；打开时读取最新数据，在步骤完成后更新，并每分钟校准。统计范围限于这台 OpenCode 服务器记录的调用。

**服务商列表**读取当前工作区可用的模型连接和已启用的 MCP 配置。配置变化时更新筛选器和额度卡片，并清掉已移除连接的显示快照。仅配置 MiniMax MCP 也可以显示 MiniMax。

**MiniMax MCP** 分别统计生图和语音的成功与失败。从 OpenCode 保留的历史中读取直接工具和 Code Mode 的内层调用，同一次调用计数一次。宿主的 MCP 记录可以确认调用状态，官方媒体工具的返回值无法提供每笔实际扣额。历史不可读时，界面会标明仅展示插件启用后的观察记录。[MiniMax 官方 MCP 实现](https://github.com/MiniMax-AI/MiniMax-MCP/blob/main/minimax_mcp/server.py)

**MiMo** 仅显示今天和近七个自然日各占 Standard 月额度的百分比。分母是每月 110 亿 Credits。按已识别的套餐连接、每个模型步骤的开始时间、缓存命中、普通输入和含推理的输出分项估算，北京时间 00:00 至 08:00 乘 0.8。未知模型、缺失 token 或缺少 ASR 时长会标注部分记录；全部都无法换算时显示「—」。覆盖当前 OpenCode 服务器保留的会话，其他客户端用量和赠送额度不在统计范围内。若更换连接，请为不同账户使用不同的服务商标识，宿主历史以该标识归属用量。[套餐档位](https://mimo.mi.com/docs/zh-CN/tokenplan) · [计量规则](https://mimo.mi.com/docs/zh-CN/quick-start/faq/token-plan/Usage%26Quota)

**账户额度** 只在点击单项或全部刷新时联网。服务端使用当前工作区可用的 API Key 连接、官方端点的直接配置或官方 MiniMax MCP 的配置。渲染窗口只接收查询结果。插件使用固定 HTTPS 端点，拒绝重定向，合并相同在途查询，并处理超时和限流。同一把 Key 对应不同站点时，可点「查询此连接」选择目的地。已查快照在当前窗口按服务器与工作区缓存，显示查询时间。

| 服务 | 手动查询能力 |
| --- | --- |
| Kimi | Moonshot 开放平台按区域显示余额；Kimi Code 尝试读取套餐窗口。后者是兼容性适配，API Key 权限与响应版本会影响结果，冲突窗口不展示。[余额](https://platform.moonshot.ai/docs/api/balance) · [套餐接口现状](https://github.com/MoonshotAI/kimi-code/issues/2937) |
| DeepSeek | 展示官方返回的各币种可用余额，保留零余额。[官方接口](https://api-docs.deepseek.com/zh-cn/api/get-user-balance/) |
| GLM | 查询智谱或 Z.AI 个人 Coding Plan 窗口，按返回字段展示剩余比例、重置时间。普通按量 Key 可能没有套餐查询权限。[官方查询插件](https://docs.bigmodel.cn/cn/coding-plan/extension/usage-query-plugin) |
| MiniMax | 查询与 Key 匹配站点的 Token Plan 窗口，优先使用服务商明确返回的剩余百分比。按量生图或语音 Key 可能仅能提供本地调用次数。[中国站](https://platform.minimaxi.com/subscribe/coding-plan) · [官方 MCP](https://github.com/MiniMax-AI/MiniMax-MCP) · [区域字段口径参考](https://github.com/slkiser/opencode-quota/blob/main/src/providers/minimax-coding-plan.ts) |
| MiMo | 本地估算今天、近 7 天各占月额度的百分比，完全离线。 |
| Qwen | 可看本地模型统计。此版本未接入独立的阿里云账务授权。[百炼用量查询](https://help.aliyun.com/zh/model-studio/usage-api) |

## 安装和验证

运行 `npm ci`、`npm run build`、`npm test` 和 `npm pack`。把生成包中的 `package/` 全部内容放入 OpenCode 全局插件目录的 `provider-quota/` 子目录，然后重新打开 Desktop。回退时可在设置中停用 GUI；完整停用服务端采集需要将插件移出发现目录并重新加载服务。界面和服务端独立于 Session Metrics、主题及字体插件。

此版本验证基线是 OpenCode Desktop 2.3.2。GUI 入口、统计接口和 RPC 随宿主版本复核。原生聚合接口不提供 Code Mode 内层调用和逐步计费时点，因此这两项在服务器端只读投影本机 SQLite 历史；宿主升级时需复测数据结构。自动化使用模拟账户以及隔离服务，不验证个人账户的余额。
