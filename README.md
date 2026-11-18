# 用量与额度

OpenCode Desktop 2.3.2 的独立插件。点击对话顶栏的 **用量** 打开统计页面。

**用量统计** 使用宿主的 `experimental.session.stats`，和 `opencode stats` 读取同一份跨会话历史。默认显示当前服务器、所有项目的近七天用量，可选今天、近三十天和全部时间，按服务商筛选。表格分列输入、输出、推理、缓存读写。服务器在页面关闭时继续记账；打开时读取最新数据，在步骤完成后更新，并每分钟校准。统计范围限于这台 OpenCode 服务器记录的调用。

**MiniMax MCP** 在服务端的 `tool.hook("execute.after")` 统计生图和语音工具的成功与失败次数，包含 Code Mode 内层独立调用。兼容官方 Python 与 JS 服务及其自定义服务名称。安装之前由宿主单独记录的同名工具在历史明细中列出。两个口径可以重叠，页面分别展示。按次统计，每次调用生成的图片数、音频时长、收费金额以及其他客户端用量均不由次数推算。插件在自己的服务器存储中仅保留调用标识、类型、结束时间和状态。

**账户额度** 只在点击单项或全部刷新时联网。服务端使用当前工作区可用的 API Key 连接、官方端点的直接配置或官方 MiniMax MCP 的配置。渲染窗口只接收查询结果。插件使用固定 HTTPS 端点，拒绝重定向，合并相同在途查询，并处理超时和限流。同一把 Key 对应不同站点时，可点「查询此连接」选择目的地。已查快照在当前窗口按服务器与工作区缓存，显示查询时间。

| 服务 | 手动查询能力 |
| --- | --- |
| Kimi | Moonshot 开放平台按区域显示余额；Kimi Code 尝试读取套餐窗口。后者是兼容性适配，API Key 权限与响应版本会影响结果，冲突窗口不展示。[余额](https://platform.moonshot.ai/docs/api/balance) · [套餐接口现状](https://github.com/MoonshotAI/kimi-code/issues/2937) |
| DeepSeek | 展示官方返回的各币种可用余额，保留零余额。[官方接口](https://api-docs.deepseek.com/zh-cn/api/get-user-balance/) |
| GLM | 查询智谱或 Z.AI 个人 Coding Plan 窗口，按返回字段展示剩余比例、重置时间。普通按量 Key 可能没有套餐查询权限。[官方查询插件](https://docs.bigmodel.cn/cn/coding-plan/extension/usage-query-plugin) |
| MiniMax | 查询与 Key 匹配站点的 Token Plan 窗口，优先使用服务商明确返回的剩余百分比。按量生图或语音 Key 可能仅能提供本地调用次数。[中国站](https://platform.minimaxi.com/subscribe/coding-plan) · [官方 MCP](https://github.com/MiniMax-AI/MiniMax-MCP) · [区域字段口径参考](https://github.com/slkiser/opencode-quota/blob/main/src/providers/minimax-coding-plan.ts) |
| MiMo | 可看本地模型统计。普通推理 Key 的通用账户余量接口尚待确认。[上游跟踪](https://github.com/XiaomiMiMo/MiMo-Code/issues/2495) |
| Qwen | 可看本地模型统计。此版本未接入独立的阿里云账务授权。[百炼用量查询](https://help.aliyun.com/zh/model-studio/usage-api) |

## 安装和验证

运行 `npm ci`、`npm run build`、`npm test` 和 `npm pack`。把生成包中的 `package/` 全部内容放入 OpenCode 全局插件目录的 `provider-quota/` 子目录，然后重新打开 Desktop。回退时可在设置中停用 GUI；完整停用服务端采集需要将插件移出发现目录并重新加载服务。界面和服务端独立于 Session Metrics、主题及字体插件。

此版本验证基线是 OpenCode Desktop 2.3.2。GUI 入口、统计接口和 RPC 随宿主版本复核。自动化使用模拟账户以及隔离服务，不验证个人账户的余额。
