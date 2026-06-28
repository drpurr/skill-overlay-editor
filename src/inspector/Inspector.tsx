import { useEffect, useState } from 'react'
import { iconUrl } from '../media/skills'
import { useEditorStore } from '../state/editorStore'
import type { AspectRatio, RotationEdge, SkillNode } from '../schema/rotation'

const ASPECTS: AspectRatio[] = ['16:9', '16:10', '21:9', '4:3']

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

      <Field label={`Icon scale · ${node.scale.toFixed(2)}×`}>
        <input
          type="range"
          min={0.25}
          max={3}
          step={0.05}
          value={node.scale}
          onChange={(e) => setNodeScale(node.id, Number(e.target.value))}
          className="w-full"
        />
      </Field>

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
            None yet — use the Connect tool to draw arrows.
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
          onChange={(e) =>
            updateEdge(edge.id, {
              priority: e.target.value === '' ? undefined : Number(e.target.value),
            })
          }
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
  const setAspect = useEditorStore((s) => s.setAspect)
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

      <Field label="Aspect ratio">
        <select
          value={build.canvas.aspect}
          onChange={(e) => setAspect(e.target.value as AspectRatio)}
          className="w-full rounded bg-[var(--color-panel-2)] px-2 py-1 text-sm outline-none ring-1 ring-black/40"
        >
          {ASPECTS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </Field>

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

/** Format a keydown into a binding like "Q", "Shift+Z", "Ctrl+Alt+F". Returns null for a
 *  bare modifier press (wait for the real key). */
function formatKeybind(e: KeyboardEvent): string | null {
  const k = e.key
  if (k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'Meta') return null
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  parts.push(k.length === 1 ? k.toUpperCase() : k)
  return parts.join('+')
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
