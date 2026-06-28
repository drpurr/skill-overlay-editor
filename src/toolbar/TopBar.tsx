import { useCallback, useEffect, useState } from 'react'
import { useEditorStore } from '../state/editorStore'
import { clearHistory } from '../state/usePersistence'
import { getBuild, listBuilds, saveBuild, type BuildSummary } from '../io/db'
import { downloadJson, openJsonFile, slugify } from '../io/files'
import { buildToExport } from '../io/exporter'
import { importAny } from '../io/importer'
import { exportErrors, validateBuild } from '../io/validate'

export function TopBar() {
  const build = useEditorStore((s) => s.build)
  const setName = useEditorStore((s) => s.setName)
  const loadBuild = useEditorStore((s) => s.loadBuild)
  const newBuild = useEditorStore((s) => s.newBuild)

  const [builds, setBuilds] = useState<BuildSummary[]>([])
  const refresh = useCallback(() => {
    void listBuilds().then(setBuilds).catch(() => {})
  }, [])
  useEffect(() => refresh(), [refresh, build.id, build.name])

  const onNew = async () => {
    await saveBuild(build).catch(() => {}) // flush current build before replacing it
    newBuild('Untitled Build', build.class)
    clearHistory()
  }

  const onSwitch = async (id: string) => {
    if (id === build.id) return
    await saveBuild(build).catch(() => {}) // flush current build before switching away
    const b = await getBuild(id)
    if (b) {
      loadBuild(b)
      clearHistory()
    } else {
      alert('That build could not be loaded (it may be corrupted).')
    }
  }

  const onOpen = async () => {
    try {
      const json = await openJsonFile()
      if (!json) return
      const b = importAny(json)
      await saveBuild(b)
      loadBuild(b)
      clearHistory()
      refresh()
    } catch (e) {
      alert(`Could not open file:\n${(e as Error).message}`)
    }
  }

  const onExport = () => {
    const issues = validateBuild(build)
    const errors = exportErrors(issues)
    if (errors.length) {
      alert('Cannot export — fix these first:\n\n' + errors.map((e) => `• ${e.message}`).join('\n'))
      return
    }
    const warnings = issues.filter((i) => i.level === 'warning')
    if (
      warnings.length &&
      !confirm('Export with these warnings?\n\n' + warnings.map((w) => `• ${w.message}`).join('\n'))
    ) {
      return
    }
    downloadJson(`${slugify(build.name)}.overlay.json`, buildToExport(build))
  }

  return (
    <header className="flex items-center gap-2 border-b border-black/50 bg-[var(--color-panel)] px-3 py-2">
      <span className="mr-1 whitespace-nowrap text-sm font-semibold tracking-wide text-[var(--color-accent-2)]">
        ⚔ Skill Flowchart Editor
      </span>

      <input
        value={build.name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Build name"
        className="w-52 rounded bg-[var(--color-panel-2)] px-2 py-1 text-sm text-white/90 outline-none ring-1 ring-black/40"
      />

      <select
        value={build.id}
        onChange={(e) => onSwitch(e.target.value)}
        onMouseDown={refresh}
        aria-label="Switch build"
        className="max-w-44 rounded bg-[var(--color-panel-2)] px-2 py-1 text-sm text-white/80 outline-none ring-1 ring-black/40"
      >
        {!builds.some((b) => b.id === build.id) && (
          <option value={build.id}>{build.name} (unsaved)</option>
        )}
        {builds.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-1">
        <BarButton onClick={onNew}>New</BarButton>
        <BarButton onClick={onOpen}>Open</BarButton>
        <BarButton onClick={onExport} accent>
          Export
        </BarButton>
      </div>
    </header>
  )
}

function BarButton({
  children,
  onClick,
  accent,
}: {
  children: React.ReactNode
  onClick: () => void
  accent?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-3 py-1 text-sm ${
        accent
          ? 'bg-[var(--color-accent)]/40 text-white ring-1 ring-[var(--color-accent-2)] hover:bg-[var(--color-accent)]/60'
          : 'text-white/80 hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  )
}
