import { Ipc } from '@opencode/plugin/gui'
import { Schema } from 'effect'
export const ExportIpc = Ipc.define({id:'file-review-enhancer.export', methods:{save:{
  input:Schema.Struct({format:Schema.Literals(['pdf','docx']), name:Schema.String, html:Schema.String}),
  output:Schema.Boolean
}}})
