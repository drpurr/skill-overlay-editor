import { useEffect, useState } from 'react'
import { iconUrl } from '../media/skills'
import { formatKeybind } from '@skill-overlay/schema'
import { useEditorStore } from '../state/editorStore'
import type { RotationEdge, SkillNode } from '@skill-overlay/schema'

const RESOLUTIONS: { label: string; w: number; h: number }[] = [
  { label: '1920 × 1080 — 1080p (FHD)', w: 1920, h: 1080 },
  { label: '2560 × 1440 — 1440p (2K / QHD)', w: 2560, h: 1440 },
  { label: '3840 × 2160 — 4K (UHD)', w: 3840, h: 2160 },
  { label: '2560 × 1080 — Ultrawide (UW-FHD)', w: 2560, h: 1080 },
  { label: '3440 × 1440 — Ultrawide (UW-QHD)', w: 3440, h: 1440 },
  { label: '3840 × 1600 — Ultrawide (UW-QHD+)', w: 3840, h: 1600 },
  { label: '5120 × 1440 — Super Ultrawide (32:9)', w: 5120, h: 1440 },
  { label: '1920 × 1200 — 16:10', w: 1920, h: 1200 },
  { label: '2560 × 1600 — 16:10 (QHD+)', w: 2560, h: 1600 },
]

export function Inspector() {
  const build = useEditorStore((s) => s.build)
  const selNodeId = useEditorStore((s) => s.selectedNodeId)
  const selEdgeId = useEditorStore((s) => s.selectedEdgeId)

  const node = build.nodes.find((n) => n.id === selNodeId)
  const edge = build.edges.find((e) => e.id === selEdgeId)

  return (
    <div className="flex h-full flex-col bg-[var(--color-panel)] text-sm">
      <div className="border-b border-black/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/50">
        {node ? 'Skill' : edge ? 'Connection' : 'Canvas'}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {node ? (
          <NodeInspector node={node} />
        ) : edge ? (
          <EdgeInspector edge={edge} />
        ) : (
          <CanvasInspector />
        )}
      </div>
    </div>
  )
}

function NodeInspector({ node }: { node: SkillNode }) {
  const build = useEditorStore((s) => s.build)
  const setNodeKeybind = useEditorStore((s) => s.setNodeKeybind)
  const setNodeScale = useEditorStore((s) => s.setNodeScale)
  const toggleNodeStart = useEditorStore((s) => s.toggleNodeStart)
  const removeNode = useEditorStore((s) => s.removeNode)
  const selectNode = useEditorStore((s) => s.selectNode)

  const duplicate =
    !!node.keybind && build.nodes.some((n) => n.id !== node.id && n.keybind === node.keybind)

  const nextTitles = build.edges
    .filter((e) => e.from === node.id)
    .map((e) => build.nodes.find((n) => n.id === e.to)?.title)
    .filter((t): t is string => !!t)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <img
          src={iconUrl(node.class, node.icon)}
          alt={node.title}
          className="h-12 w-12 rounded ring-1 ring-black/60"
        />
        <div className="font-medium text-white/90">{node.title}</div>
      </div>

      <Field label="Keybind">
        <KeybindField
          value={node.keybind}
          onChange={(v) => setNodeKeybind(node.id, v)}
          duplicate={duplicate}
        />
      </Field>

      <ScaleControl scale={node.scale} onChange={(v) => setNodeScale(node.id, v)} />

      <label className="flex items-center gap-2 text-white/80">
        <input
          type="checkbox"
          checked={node.isStart}
          onChange={() => toggleNodeStart(node.id)}
        />
        Rotation start point
      </label>

      <Field label={`Possible next (${nextTitles.length})`}>
        {nextTitles.length === 0 ? (
          <span className="text-xs text-white/40">
            None yet — drag a skill's right dot onto another skill to connect.
          </span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {nextTitles.map((t, i) => (
              <span
                key={i}
                className="rounded bg-[var(--color-panel-2)] px-1.5 py-0.5 text-[11px] text-white/70"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </Field>

      <button
        type="button"
        onClick={() => {
          removeNode(node.id)
          selectNode(null)
        }}
        className="mt-2 rounded bg-red-900/60 px-3 py-1.5 text-sm text-red-200 hover:bg-red-800/70"
      >
        Delete skill
      </button>
    </div>
  )
}

function EdgeInspector({ edge }: { edge: RotationEdge }) {
  const build = useEditorStore((s) => s.build)
  const updateEdge = useEditorStore((s) => s.updateEdge)
  const removeEdge = useEditorStore((s) => s.removeEdge)
  const selectEdge = useEditorStore((s) => s.selectEdge)

  const from = build.nodes.find((n) => n.id === edge.from)?.title ?? '?'
  const to = build.nodes.find((n) => n.id === edge.to)?.title ?? '?'

  return (
    <div className="flex flex-col gap-4">
      <div className="text-white/80">
        <span className="font-medium">{from}</span>
        <span className="px-1 text-white/40">→</span>
        <span className="font-medium">{to}</span>
      </div>

      <Field label="Condition (hint shown on the arrow)">
        <input
          value={edge.condition ?? ''}
          onChange={(e) => updateEdge(edge.id, { condition: e.target.value || undefined })}
          placeholder="e.g. Identity full"
          className="w-full rounded bg-[var(--color-panel-2)] px-2 py-1 text-sm outline-none ring-1 ring-black/40 placeholder:text-white/30"
        />
      </Field>

      <Field label="Priority (lower = preferred)">
        <input
          type="number"
          value={edge.priority ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            const n = Number(raw)
            updateEdge(edge.id, {
              priority: raw === '' || Number.isNaN(n) ? undefined : Math.trunc(n),
            })
          }}
          placeholder="—"
          className="w-24 rounded bg-[var(--color-panel-2)] px-2 py-1 text-sm outline-none ring-1 ring-black/40 placeholder:text-white/30"
        />
      </Field>

      <button
        type="button"
        onClick={() => {
          removeEdge(edge.id)
          selectEdge(null)
        }}
        className="mt-2 rounded bg-red-900/60 px-3 py-1.5 text-sm text-red-200 hover:bg-red-800/70"
      >
        Delete connection
      </button>
    </div>
  )
}

function CanvasInspector() {
  const build = useEditorStore((s) => s.build)
  const setBaseIconPct = useEditorStore((s) => s.setBaseIconPct)
  const setBackground = useEditorStore((s) => s.setBackground)

  const starts = build.nodes.filter((n) => n.isStart).length

  const onUpload = async (file: File | undefined) => {
    if (!file) return
    setBackground(await readFileAsDataUrl(file))
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-white/40">
        Select a skill or connection to edit it. These settings apply to the whole canvas.
      </p>

      <ResolutionControl />

      <Field label={`Base icon size · ${(build.canvas.baseIconPct * 100).toFixed(1)}% of screen height`}>
        <input
          type="range"
          min={0.02}
          max={0.15}
          step={0.005}
          value={build.canvas.baseIconPct}
          onChange={(e) => setBaseIconPct(Number(e.target.value))}
          className="w-full"
        />
      </Field>

      <Field label="Screenshot background">
        <div className="flex items-center gap-2">
          <label className="cursor-pointer rounded bg-[var(--color-panel-2)] px-2 py-1 text-xs text-white/80 ring-1 ring-black/40 hover:bg-[#232a36]">
            Upload…
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
          </label>
          {build.background && (
            <button
              type="button"
              onClick={() => setBackground(null)}
              className="rounded px-2 py-1 text-xs text-white/60 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </Field>

      <div className="mt-2 border-t border-black/40 pt-3 text-xs text-white/40">
        {build.nodes.length} skills · {build.edges.length} connections · {starts} start
        {starts === 1 ? '' : 's'}
      </div>
    </div>
  )
}

function ResolutionControl() {
  const ref = useEditorStore((s) => s.build.canvas.reference)
  const setResolution = useEditorStore((s) => s.setResolution)
  const [w, setW] = useState(String(ref.w))
  const [h, setH] = useState(String(ref.h))
  // Re-sync when the resolution changes elsewhere (preset pick, undo/redo, switching builds).
  useEffect(() => {
    setW(String(ref.w))
    setH(String(ref.h))
  }, [ref.w, ref.h])

  const commit = () => {
    const nw = Math.round(Number(w))
    const nh = Math.round(Number(h))
    if (Number.isFinite(nw) && nw > 0 && Number.isFinite(nh) && nh > 0) setResolution(nw, nh)
    else {
      setW(String(ref.w))
      setH(String(ref.h))
    }
  }

  const presetValue = RESOLUTIONS.some((r) => r.w === ref.w && r.h === ref.h)
    ? `${ref.w}x${ref.h}`
    : 'custom'

  return (
    <Field label="Monitor resolution">
      <div className="flex flex-col gap-2">
        <select
          value={presetValue}
          onChange={(e) => {
            if (e.target.value === 'custom') return
            const [pw, ph] = e.target.value.split('x').map(Number)
            setResolution(pw, ph)
          }}
          className="w-full rounded bg-[var(--color-panel-2)] px-2 py-1 text-sm outline-none ring-1 ring-black/40"
        >
          {RESOLUTIONS.map((r) => (
            <option key={`${r.w}x${r.h}`} value={`${r.w}x${r.h}`}>
              {r.label}
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            step={1}
            value={w}
            onChange={(e) => setW(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="w-24 rounded bg-[var(--color-panel-2)] px-2 py-1 text-sm outline-none ring-1 ring-black/40"
            aria-label="Width"
          />
          <span className="text-white/40">×</span>
          <input
            type="number"
            min={1}
            step={1}
            value={h}
            onChange={(e) => setH(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="w-24 rounded bg-[var(--color-panel-2)] px-2 py-1 text-sm outline-none ring-1 ring-black/40"
            aria-label="Height"
          />
        </div>
      </div>
    </Field>
  )
}

// --- small building blocks ---------------------------------------------------------------

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-white/50">{label}</span>
      {children}
    </div>
  )
}

function KeybindField({
  value,
  onChange,
  duplicate,
}: {
  value: string | null
  onChange: (v: string | null) => void
  duplicate: boolean
}) {
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    if (!capturing) return
    const handler = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.key === 'Escape') {
        setCapturing(false)
        return
      }
      const kb = formatKeybind(e)
      if (kb) {
        onChange(kb)
        setCapturing(false)
      }
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [capturing, onChange])

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setCapturing((c) => !c)}
        className={`min-w-20 rounded px-2 py-1 text-sm ring-1 ${
          capturing
            ? 'bg-[var(--color-accent)]/30 text-white ring-[var(--color-accent-2)]'
            : 'bg-[var(--color-panel-2)] text-white/90 ring-black/40 hover:bg-[#232a36]'
        }`}
      >
        {capturing ? 'Press a key…' : (value ?? 'Set key')}
      </button>
      {value && !capturing && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded px-1.5 py-1 text-xs text-white/50 hover:text-white"
        >
          ✕
        </button>
      )}
      {duplicate && <span className="text-xs text-amber-400">Duplicate bind</span>}
    </div>
  )
}

function ScaleControl({ scale, onChange }: { scale: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(scale))
  // Re-sync when scale changes from elsewhere (slider, undo/redo, switching builds).
  useEffect(() => setText(String(scale)), [scale])
  const commit = () => {
    const v = Number(text)
    if (!Number.isNaN(v)) onChange(v)
    else setText(String(scale))
  }
  return (
    <Field label="Icon scale">
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0.25}
          max={3}
          step={0.05}
          value={scale}
          onChange={(e) => onChange(Number(e.target.value))}
          className="min-w-0 flex-1"
          aria-label="Icon scale slider"
        />
        <input
          type="number"
          min={0.1}
          max={5}
          step={0.05}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur()
          }}
          className="w-16 rounded bg-[var(--color-panel-2)] px-2 py-1 text-sm outline-none ring-1 ring-black/40"
          aria-label="Icon scale value"
        />
        <span className="text-white/40">×</span>
      </div>
    </Field>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
