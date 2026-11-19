import { createEffect, createMemo, createRoot, getOwner, onCleanup, onMount } from 'solid-js'
import { reader } from './reader.js'

// The file plugin in Desktop 2.3.2 renders Markdown before consulting FileViewer.
// Let it open and own the tab. Attach only when its preview stage and path agree.
const fileTab = '[id="session-side-panel-file-browser-tabpanel"][role="tabpanel"]'
const stageSelector = '[data-slot="artifact-view"] > [data-slot="artifact-document-stage"][data-kind="markdown"]'
const filename = ':scope > [data-slot="artifact-toolbar"] [data-slot="artifact-filename"][title]'

export function filePreviewSlot(ctx, props) {
  const marker = document.createElement('span')
  marker.hidden = true
  const owner = getOwner()
  onMount(() => {
    const region = marker.closest('#review-panel')
    if (!region) return
    createEffect(() => {
      const session = props.session
      const files = props.screen.file
      if (!files.ready()) return
      // Changing sessions disposes all readers before binding the new file model.
      const sessionKey = session.key
      const mounted = new Map()
      function refresh() {
        const seen = new Set()
        for (const stage of region.querySelectorAll(stageSelector)) {
          if (!stage.closest(fileTab) || !stage.querySelector(':scope > [data-slot="artifact-markdown-page"]')) continue
          const path = stage.parentElement.querySelector(filename)?.title
          if (!path || !/\.md$/i.test(path) || files.absolute(path) || path.split(/[\\/]/).includes('..')) continue
          seen.add(stage)
          if (mounted.get(stage)?.path === path) continue
          mounted.get(stage)?.dispose()
          if (stage.previousElementSibling?.hasAttribute('data-ocx-file-preview')) continue
          const dispose = createRoot(dispose => {
            const holder = document.createElement('div')
            holder.dataset.ocxFilePreview = ''
            stage.before(holder)
            onCleanup(() => holder.remove())
            const ready = createMemo(() => {
              const state = files.get(path)
              return state?.loaded && !state.error && !state.notFound && state.content?.type === 'text' && state.content.encoding !== 'base64'
            })
            createEffect(() => {
              if (!ready()) return
              const view = reader(ctx, () => files.get(path)?.content?.content ?? '', path, () => session)
              view.dataset.fileFind = 'document'
              holder.append(view)
              onCleanup(() => view.remove())
            })
            return dispose
          }, owner)
          mounted.set(stage, { path, dispose })
        }
        for (const [stage, entry] of mounted) if (!seen.has(stage)) {
          entry.dispose()
          mounted.delete(stage)
        }
      }
      // Observe structural changes, never rescan for syntax highlighting, typing or hover.
      const structure = '[data-slot="artifact-view"], [data-slot="artifact-toolbar"], [data-slot="artifact-filename"], [data-slot="artifact-document-stage"], [data-slot="artifact-markdown-page"]'
      const observer = new MutationObserver(records => {
        if (props.session.key !== sessionKey) return
        if (records.some(record => record.type === 'attributes'
          ? record.target.matches('[data-slot="artifact-filename"]')
          : !record.target.closest?.('[data-ocx-file-preview], [data-component="markdown"]') &&
            [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 &&
              (node.matches(structure) || node.querySelector(structure))))) refresh()
      })
      observer.observe(region, { childList: true, subtree: true, attributes: true, attributeFilter: ['title'] })
      refresh()
      onCleanup(() => {
        observer.disconnect()
        for (const entry of mounted.values()) entry.dispose()
      })
    })
  })
  return marker
}
