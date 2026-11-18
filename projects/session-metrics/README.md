# Session Metrics Monitor

**0.1.0-alpha.2** 适用于 macOS OpenCode Desktop **2.3.2**。打开已有会话即可在标题行右侧、原生上下文用量旁看到 **缓存命中率和 TPS**。顶栏统计整个当前会话，窄窗会缩短标签。点击读数或在键盘聚焦后按 Enter，可查看 Token 明细并按模型、时间筛选。侧栏筛选仅作用于明细。

## 怎样读数

| 指标 | 计算范围 |
|---|---|
| 缓存命中率 | 所选步骤的缓存读取总数 ÷（未缓存输入 + 缓存读取 + 缓存写入）。有输入且没有缓存读取时显示 0%，分母为零时显示「—」。 |
| 最近回合 TPS | 将完整回合所有 assistant 步骤的可见输出和推理 token 相加，除以各步骤从首 token 到响应体结束的总秒数。工具等待时间独立于生成时间。旧数据缺少首 token 时间时标记「含首 token 等待」。 |
| 估算 · 可见输出 | 对 `openai` 提供商中支持的 GPT-4o、GPT-4.1、GPT-5 系列模型，会话可见且收到正文时，在本机 Worker 中对约一秒新增的文字用 `o200k_base` 分词。已有正文、工具调用和推理内容都不进入采样。采样边界可能切开 token，因此读数为估算。暂停输出、模型不匹配和采样不足时隐藏估值。 |
| Token 明细 | 汇总当前会话。失败步骤有用量时计入，缺少用量时标明步骤数。压缩请求包含在总量中，并在明细单列。父、子会话各自统计。宿主可能将供应商未上报的单项记录为零。 |

顶栏的 `≈` 表示可见输出速度估算。「上轮」指上一回合已结算的速度。对 Kimi 等暂未适配流式分词的模型，回合结束后根据宿主上报的 token 和时间计算 TPS；缺少所需数据时显示「—」。模型或时间筛选只覆盖半个回合时，该回合的速度显示「—」。历史仍在加载或断开连接时，数字旁标记「部分统计」。分页失败可在面板重试。顶栏数值后的星号提示历史尚不完整，悬停可查看原因。顶栏和详情共享同一份数据与采样器，离开会话后释放。插件只使用当前 Desktop 的会话接口，分词在本机完成。

统计层与界面分开、分别处理逐次生成速度和累计用量的思路参考了 TUI 项目。Desktop 实现使用公开的 `session.header` 插槽、GUI Panel、当前服务器的消息快照，以及 OpenCode 2.3.2 的回合边界。[TUI 参考实现](https://github.com/zhumengzhu/opencode-cache-hit/blob/main/src/use-cache-hit-metrics.ts) · [Desktop 回合速度](https://github.com/anomalyco/opencode/blob/c0ad18b402eb2827fc1ee71c171b1177b3fc02d1/packages/util/src/session-turn.ts) · [OpenAI 模型编码映射](https://github.com/openai/tiktoken/blob/main/tiktoken/model.py) · [编码对照样例](https://developers.openai.com/cookbook/examples/how_to_count_tokens_with_tiktoken)

## 安装与回退

将发行包解开，把其中 `package/` 的文件放到 `~/.config/opencode/plugins/session-metrics/`，重新打开 Desktop。在「设置 → 扩展」可查看加载状态或停用插件；退出后移走该插件目录即可卸载。

## 构建与测试

在组件根目录运行以下命令。发行包自带 GUI bundle 和分词表，Desktop 安装时只需要解包后的文件。

```sh
npm ci
npm run build
npm test
npm pack
```

插件使用实验性 GUI 入口。升级宿主后应复测会话切换、历史分页、原生回合 TPS 及 Worker 采样。[开发与验收计划](PLAN.md) · [第三方许可](THIRD_PARTY_NOTICES.txt)
