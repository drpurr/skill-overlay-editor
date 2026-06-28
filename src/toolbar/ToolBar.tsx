import { useReactFlow, useViewport } from '@xyflow/react'
import { useEditorStore, useTemporal, type Tool } from '../state/editorStore'

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'connect', label: 'Connect' },
  { id: 'move', label: 'Move' },
  { id: 'delete', label: 'Delete' },
]

export function ToolBar() {
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)
  const snap = useEditorStore((s) => s.snapToGrid)
  const setSnap = useEditorStore((s) => s.setSnapToGrid)

  const undo = useTemporal((s) => s.undo)
  const redo = useTemporal((s) => s.redo)
  const canUndo = useTemporal((s) => s.pastStates.length > 0)
  const canRedo = useTemporal((s) => s.futureStates.length > 0)

  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow()
  const zoom = useViewport().zoom

  return (
    <div className="flex items-center gap-2 border-b border-black/50 bg-[var(--color-panel)] px-3 py-1.5 text-sm">
      <div className="flex items-center gap-1">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTool(t.id)}
            className={`rounded px-2.5 py-1 ${
              tool === t.id
                ? 'bg-[var(--color-accent)]/30 text-white ring-1 ring-[var(--color-accent-2)]'
                : 'text-white/70 hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Divider />

      <button
        type="button"
        onClick={() => undo()}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className="rounded px-2 py-1 text-white/80 enabled:hover:bg-white/5 disabled:text-white/25"
      >
        ↶ Undo
      </button>
      <button
        type="button"
        onClick={() => redo()}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        className="rounded px-2 py-1 text-white/80 enabled:hover:bg-white/5 disabled:text-white/25"
      >
        ↷ Redo
      </button>

      <Divider />

      <label className="flex select-none items-center gap-1.5 text-white/70">
        <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} />
        Snap to grid
      </label>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => zoomOut()}
          className="rounded px-2 py-1 text-white/80 hover:bg-white/5"
        >
          −
        </button>
        <input
          type="range"
          min={0.2}
          max={4}
          step={0.1}
          value={zoom}
          onChange={(e) => zoomTo(Number(e.target.value))}
          className="w-28"
        />
        <button
          type="button"
          onClick={() => zoomIn()}
          className="rounded px-2 py-1 text-white/80 hover:bg-white/5"
        >
          +
        </button>
        <span className="w-12 text-right tabular-nums text-white/60">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => fitView({ padding: 0.15 })}
          className="rounded px-2 py-1 text-white/80 hover:bg-white/5"
        >
          Fit
        </button>
      </div>
    </div>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-white/10" />
}
