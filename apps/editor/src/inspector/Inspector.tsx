import { useEffect, useState } from 'react'
import { iconUrl } from '../media/skills'
import { formatKeybind } from '@skill-overlay/schema'
import { useEditorStore } from '../state/editorStore'
import type { AnnotationBox, RotationEdge, SkillNode, TextLabel } from '@skill-overlay/schema'

const FONTS = [
  'system-ui',
  'Arial',
  'Verdana',
  'Tahoma',
  'Trebuchet MS',
  'Segoe UI',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Impact',
]

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
  const selBoxId = useEditorStore((s) => s.selectedBoxId)
  const selTextId = useEditorStore((s) => s.selectedTextId)

  const node = build.nodes.find((n) => n.id === selNodeId)
  const edge = build.edges.find((e) => e.id === selEdgeId)
  const box = build.boxes.find((b) => b.id === selBoxId)
  const text = build.texts.find((t) => t.id === selTextId)

  return (
    <div className="flex h-full flex-col bg-[var(--color-panel)] text-sm">
      <div className="border-b border-black/40 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white/50">
        {node ? 'Skill' : edge ? 'Connection' : box ? 'Box' : text ? 'Text' : 'Canvas'}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {node ? (
          <NodeInspector node={node} />
        ) : edge ? (
          <EdgeInspector edge={edge} />
        ) : box ? (
          <BoxInspector box={box} />
        ) : text ? (
          <TextInspector label={text} />
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

function BoxInspector({ box }: { box: AnnotationBox }) {
  const refH = useEditorStore((s) => s.build.canvas.reference.h)
  const updateBox = useEditorStore((s) => s.updateBox)
  const removeBox = useEditorStore((s) => s.removeBox)
  const selectBox = useEditorStore((s) => s.selectBox)

  return (
    <div className="flex flex-col gap-4">
      <Field label={`Fill transparency · ${Math.round(box.opacity * 100)}%`}>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={box.color}
            onChange={(e) => updateBox(box.id, { color: e.target.value })}
            aria-label="Fill color"
            className="h-7 w-9 shrink-0 cursor-pointer rounded bg-transparent"
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={box.opacity}
            onChange={(e) => updateBox(box.id, { opacity: Number(e.target.value) })}
            className="min-w-0 flex-1"
            aria-label="Fill opacity"
          />
        </div>
      </Field>

      <Field label={`Corner radius · ${Math.round(box.radius * refH)}px`}>
        <input
          type="range"
          min={0}
          max={0.06}
          step={0.002}
          value={box.radius}
          onChange={(e) => updateBox(box.id, { radius: Number(e.target.value) })}
          className="w-full"
          aria-label="Corner radius"
        />
      </Field>

      <Field label={`Border · ${box.borderWidth}px · ${Math.round(box.borderOpacity * 100)}%`}>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={box.borderColor}
            onChange={(e) => updateBox(box.id, { borderColor: e.target.value })}
            aria-label="Border color"
            className="h-7 w-9 shrink-0 cursor-pointer rounded bg-transparent"
          />
          <input
            type="range"
            min={0}
            max={12}
            step={1}
            value={box.borderWidth}
            onChange={(e) => updateBox(box.id, { borderWidth: Number(e.target.value) })}
            className="min-w-0 flex-1"
            aria-label="Border width"
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={box.borderOpacity}
            onChange={(e) => updateBox(box.id, { borderOpacity: Number(e.target.value) })}
            className="min-w-0 flex-1"
            aria-label="Border opacity"
          />
        </div>
      </Field>

      <p className="text-xs text-white/40">Drag to move · drag the handles to resize.</p>

      <button
        type="button"
        onClick={() => {
          removeBox(box.id)
          selectBox(null)
        }}
        className="mt-2 rounded bg-red-900/60 px-3 py-1.5 text-sm text-red-200 hover:bg-red-800/70"
      >
        Delete box
      </button>
    </div>
  )
}

function TextInspector({ label }: { label: TextLabel }) {
  const refH = useEditorStore((s) => s.build.canvas.reference.h)
  const updateText = useEditorStore((s) => s.updateText)
  const removeText = useEditorStore((s) => s.removeText)
  const selectText = useEditorStore((s) => s.selectText)

  return (
    <div className="flex flex-col gap-4">
      <Field label="Text">
        <textarea
          value={label.text}
          onChange={(e) => updateText(label.id, { text: e.target.value })}
          rows={2}
          className="w-full resize-y rounded bg-[var(--color-panel-2)] px-2 py-1 text-sm outline-none ring-1 ring-black/40"
        />
      </Field>

      <Field label="Font">
        <select
          value={label.font}
          onChange={(e) => updateText(label.id, { font: e.target.value })}
          className="w-full rounded bg-[var(--color-panel-2)] px-2 py-1 text-sm outline-none ring-1 ring-black/40"
          style={{ fontFamily: label.font }}
        >
          {FONTS.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
      </Field>

      <Field label={`Size · ${Math.round(label.size * refH)}px`}>
        <input
          type="range"
          min={0.012}
          max={0.1}
          step={0.002}
          value={label.size}
          onChange={(e) => updateText(label.id, { size: Number(e.target.value) })}
          className="w-full"
          aria-label="Text size"
        />
      </Field>

      <Field label={`Color · transparency ${Math.round(label.opacity * 100)}%`}>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={label.color}
            onChange={(e) => updateText(label.id, { color: e.target.value })}
            aria-label="Text color"
            className="h-7 w-9 shrink-0 cursor-pointer rounded bg-transparent"
          />
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={label.opacity}
            onChange={(e) => updateText(label.id, { opacity: Number(e.target.value) })}
            className="min-w-0 flex-1"
            aria-label="Text opacity"
          />
        </div>
      </Field>

      <Field label={`Text border · ${label.borderWidth}px`}>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={label.borderColor}
            onChange={(e) => updateText(label.id, { borderColor: e.target.value })}
            aria-label="Text border color"
            className="h-7 w-9 shrink-0 cursor-pointer rounded bg-transparent"
          />
          <input
            type="range"
            min={0}
            max={8}
            step={0.5}
            value={label.borderWidth}
            onChange={(e) => updateText(label.id, { borderWidth: Number(e.target.value) })}
            className="min-w-0 flex-1"
            aria-label="Text border width"
          />
        </div>
      </Field>

      <button
        type="button"
        onClick={() => {
          removeText(label.id)
          selectText(null)
        }}
        className="mt-2 rounded bg-red-900/60 px-3 py-1.5 text-sm text-red-200 hover:bg-red-800/70"
      >
        Delete text
      </button>
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
