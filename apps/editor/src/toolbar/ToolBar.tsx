import { useReactFlow, useViewport } from '@xyflow/react'
import { useEditorStore, useTemporal, type Tool } from '../state/editorStore'
import {
  BoxIcon,
  CursorIcon,
  FitIcon,
  GridIcon,
  RedoIcon,
  SettingsIcon,
  SnapIcon,
  TextIcon,
  UndoIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from './icons'

export function ToolBar() {
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)
  const snap = useEditorStore((s) => s.snapToGrid)
  const setSnap = useEditorStore((s) => s.setSnapToGrid)
  const annotationSnap = useEditorStore((s) => s.annotationSnap)
  const setAnnotationSnap = useEditorStore((s) => s.setAnnotationSnap)
  const showGrid = useEditorStore((s) => s.showGrid)
  const setShowGrid = useEditorStore((s) => s.setShowGrid)
  const setSettingsOpen = useEditorStore((s) => s.setSettingsOpen)

  const pick = (t: Tool) => () => setTool(t)

  const undo = useTemporal((s) => s.undo)
  const redo = useTemporal((s) => s.redo)
  const canUndo = useTemporal((s) => s.pastStates.length > 0)
  const canRedo = useTemporal((s) => s.futureStates.length > 0)

  const { zoomIn, zoomOut, zoomTo, fitView } = useReactFlow()
  const zoom = useViewport().zoom

  return (
    <div className="flex items-center gap-1.5 border-b border-black/50 bg-[var(--color-panel)] px-3 py-1.5 text-sm">
      <IconButton title="Undo (Ctrl+Z)" onClick={() => undo()} disabled={!canUndo}>
        <UndoIcon />
      </IconButton>
      <IconButton title="Redo (Ctrl+Shift+Z)" onClick={() => redo()} disabled={!canRedo}>
        <RedoIcon />
      </IconButton>

      <Divider />

      <IconButton title="Select / move" active={tool === 'select'} onClick={pick('select')}>
        <CursorIcon />
      </IconButton>
      <IconButton title="Draw box (drag on canvas)" active={tool === 'box'} onClick={pick('box')}>
        <BoxIcon />
      </IconButton>
      <IconButton title="Place text (click on canvas)" active={tool === 'text'} onClick={pick('text')}>
        <TextIcon />
      </IconButton>

      <Divider />

      <IconButton title="Snap skill icons to grid" active={snap} onClick={() => setSnap(!snap)}>
        <SnapIcon />
      </IconButton>
      <label className="flex select-none items-center gap-1.5 px-1 text-xs text-white/70">
        <input
          type="checkbox"
          checked={annotationSnap}
          onChange={(e) => setAnnotationSnap(e.target.checked)}
        />
        Snap shapes
      </label>
      <IconButton title="Show alignment grid" active={showGrid} onClick={() => setShowGrid(!showGrid)}>
        <GridIcon />
      </IconButton>

      <div className="ml-auto flex items-center gap-1.5">
        <IconButton title="Zoom out" onClick={() => zoomOut()}>
          <ZoomOutIcon />
        </IconButton>
        <input
          type="range"
          min={0.2}
          max={4}
          step={0.1}
          value={zoom}
          onChange={(e) => zoomTo(Number(e.target.value))}
          className="w-28"
          aria-label="Zoom"
        />
        <IconButton title="Zoom in" onClick={() => zoomIn()}>
          <ZoomInIcon />
        </IconButton>
        <span className="w-11 text-right tabular-nums text-white/60">{Math.round(zoom * 100)}%</span>
        <IconButton title="Fit to view" onClick={() => fitView({ padding: 0.15 })}>
          <FitIcon />
        </IconButton>

        <Divider />

        <IconButton title="Settings" onClick={() => setSettingsOpen(true)}>
          <SettingsIcon />
        </IconButton>
      </div>
    </div>
  )
}

function IconButton({
  children,
  onClick,
  title,
  active,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded ${
        active
          ? 'bg-[var(--color-accent)]/30 text-white ring-1 ring-[var(--color-accent-2)]'
          : 'text-white/75 enabled:hover:bg-white/5 disabled:text-white/20'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-white/10" />
}
