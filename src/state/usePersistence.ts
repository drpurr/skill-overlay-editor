import { useEffect, useRef } from 'react'
import { useEditorStore } from './editorStore'
import { getBuild, listBuilds, saveBuild } from '../io/db'

/** Drop undo/redo history — call after loading/replacing the whole document. */
export function clearHistory(): void {
  useEditorStore.temporal.getState().clear()
}

/** Debounced autosave of the active build to IndexedDB, plus a flush on tab-hide/unload. */
export function useAutosave(delay = 600): void {
  const build = useEditorStore((s) => s.build)
  const latest = useRef(build)
  latest.current = build

  useEffect(() => {
    const t = setTimeout(() => {
      void saveBuild(build).catch(() => {})
    }, delay)
    return () => clearTimeout(t)
  }, [build, delay])

  // Persist immediately when the tab is hidden or unloaded — the debounce could otherwise
  // drop the last edits.
  useEffect(() => {
    const flush = () => {
      void saveBuild(latest.current).catch(() => {})
    }
    const onVisibility = () => {
      if (document.hidden) flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
    }
  }, [])
}

/** On first mount, load the most-recently-updated saved build (if any). */
export function useInitialBuild(): void {
  const loadBuild = useEditorStore((s) => s.loadBuild)
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    void (async () => {
      const builds = await listBuilds()
      if (!builds.length) return
      const latest = await getBuild(builds[0].id)
      if (latest) {
        loadBuild(latest)
        clearHistory()
      }
    })()
  }, [loadBuild])
}
