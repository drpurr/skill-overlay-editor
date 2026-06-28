import {
  BaseEdge,
  EdgeLabelRenderer,
  useInternalNode,
  type EdgeProps,
  type InternalNode,
  type Node,
} from '@xyflow/react'
import { useEditorStore } from '../state/editorStore'
import { CloseIcon } from '../toolbar/icons'
import type { RotationEdge as RotationEdgeData } from '../schema/rotation'

/** Gap (flow-units) left between the line ends and each icon. */
const TARGET_GAP = 12
const SOURCE_GAP = 3

interface Center {
  x: number
  y: number
  hw: number
  hh: number
}

function center(n: InternalNode<Node>): Center {
  const w = n.measured?.width ?? 0
  const h = n.measured?.height ?? 0
  const p = n.internals.positionAbsolute
  return { x: p.x + w / 2, y: p.y + h / 2, hw: w / 2, hh: h / 2 }
}

/**
 * Point on `from`'s rectangle border in the direction of `toward`, then pushed `gap`
 * px further outward (away from `from`) so the line ends short of the icon.
 */
function borderPoint(from: Center, toward: Center, gap: number): { x: number; y: number } {
  const dx = toward.x - from.x
  const dy = toward.y - from.y
  if (dx === 0 && dy === 0) return { x: from.x, y: from.y }
  const scale = 1 / Math.max(Math.abs(dx) / (from.hw || 1), Math.abs(dy) / (from.hh || 1))
  let x = from.x + dx * scale
  let y = from.y + dy * scale
  if (gap) {
    const len = Math.hypot(dx, dy)
    x += (dx / len) * gap
    y += (dy / len) * gap
  }
  return { x, y }
}

export function RotationEdge({ id, source, target, markerEnd, selected, data }: EdgeProps) {
  const removeEdge = useEditorStore((s) => s.removeEdge)
  const selectEdge = useEditorStore((s) => s.selectEdge)

  const s = useInternalNode(source)
  const t = useInternalNode(target)
  if (!s || !t) return null

  const sc = center(s)
  const tc = center(t)
  const sp = borderPoint(sc, tc, SOURCE_GAP)
  const tp = borderPoint(tc, sc, TARGET_GAP)
  const path = `M ${sp.x},${sp.y} L ${tp.x},${tp.y}`
  const mx = (sp.x + tp.x) / 2
  const my = (sp.y + tp.y) / 2

  const edge = data as Partial<RotationEdgeData> | undefined
  const hasLabel = !!edge?.condition || edge?.priority != null

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        interactionWidth={26}
        style={{
          stroke: '#FFFFFF',
          strokeWidth: selected ? 4 : 3,
        }}
      />

      {hasLabel && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute flex items-center gap-1 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 text-[11px] text-white ring-1 ring-white/15"
            style={{ transform: `translate(-50%, -50%) translate(${mx}px, ${my - 16}px)` }}
          >
            {edge?.priority != null && (
              <span className="font-bold text-[var(--color-accent-2)]">P{edge.priority}</span>
            )}
            {edge?.condition && <span className="text-white/90">{edge.condition}</span>}
          </div>
        </EdgeLabelRenderer>
      )}

      {selected && (
        <EdgeLabelRenderer>
          <button
            type="button"
            title="Remove connection (Del)"
            onClick={(e) => {
              e.stopPropagation()
              removeEdge(id)
              selectEdge(null)
            }}
            className="nodrag nopan absolute grid h-5 w-5 place-items-center rounded-full bg-red-700 text-white ring-2 ring-[#0b0d12] hover:bg-red-600"
            style={{
              transform: `translate(-50%, -50%) translate(${mx}px, ${my}px)`,
              pointerEvents: 'all',
            }}
          >
            <CloseIcon size={11} />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
