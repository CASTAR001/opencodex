import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

export default {
  id: 'file-review-enhancer',
  async setup(ctx) {
    const file = new URL('../skills/markdown-link-labels/SKILL.md', import.meta.url)
    const source = await readFile(file, 'utf8')
    // The packaged skill uses two single-line frontmatter fields.
    const match = /^---\r?\nname: ([\w-]+)\r?\ndescription: (.+)\r?\n---\r?\n([\s\S]*)$/.exec(source)
    if (!match) throw new Error('Invalid markdown-link-labels skill metadata')
    const [, name, description, content] = match
    await ctx.skill.transform(editor => {
      if (!editor.get(name)) editor.add({ id: name, name, description, content: content.trim(),
        autoinvoke: true, path: fileURLToPath(file) })
    })
  },
}
