export const families = {
  kimi: 'Kimi',
  mimo: '小米 MiMo',
  glm: '智谱 GLM',
  deepseek: 'DeepSeek',
  minimax: 'MiniMax',
  qwen: 'Qwen · 百炼',
}
export const unavailable = {
  qwen: '普通百炼推理 Key 无法查询阿里云账户余额。模型消耗见用量页。',
}
const object = (properties, required) => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
})
export const contract = {
  id: 'provider-quota',
  events: {},
  methods: {
    inventory: { input: object({}, []), output: { type: 'array', items: { type: 'object' } } },
    refresh: {
      input: object(
        { family: { enum: Object.keys(families) }, source: { type: 'string', maxLength: 256 } },
        ['family'],
      ),
      output: { type: 'array', items: { type: 'object' } },
    },
    media: {
      input: object({ from: { type: 'number', minimum: 0 }, to: { type: 'number', minimum: 0 } }, [
        'from',
        'to',
      ]),
      output: { type: 'array', items: { type: 'object' } },
    },
  },
}
export default contract
