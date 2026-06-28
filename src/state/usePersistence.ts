import { useEffect, useRef } from 'react'
import { useEditorStore } from './editorStore'
import { getBuild, listBuilds, saveBuild } from '../io/db'

/** Drop undo/redo history — call after loading/replacing the whole document. */
export function clearHistory(): void {
  useEditorStore.temporal.getState().clear()
}

/** Debounced autosave of the active build to IndexedDB. */
export function useAutosave(delay = 600): void {
  const build = useEditorStore((s) => s.build)
  useEffect(() => {
    const t = setTimeout(() => {
      void saveBuild(build).catch(() => {})
    }, delay)
    return () => clearTimeout(t)
  }, [build, delay])
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
