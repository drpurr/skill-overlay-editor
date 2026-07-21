import { Handle, Position, type NodeProps } from '@xyflow/react'
import { iconUrl } from '../media/skills'
import { useEditorStore } from '../state/editorStore'
import { TrashIcon } from '../toolbar/icons'
import type { SkillNode as SkillNodeData } from '@skill-overlay/schema'

export interface SkillNodeRFData {
  node: SkillNodeData
  /** Icon side length in flow-units. */
  sizePx: number
  [key: string]: unknown
}

export function SkillNode({ data, selected }: NodeProps) {
  const { node, sizePx } = data as unknown as SkillNodeRFData
  const removeNode = useEditorStore((s) => s.removeNode)
  const selectNode = useEditorStore((s) => s.selectNode)

  // Delete button: hover-only, scales with the icon (~1/4 of its side, always smaller),
  // floating just off the icon's top-right corner rather than covering it.
  const trashSize = Math.max(12, sizePx * 0.26)
  const trashGap = Math.max(3, sizePx * 0.08)

  return (
    <div className="group relative" style={{ width: sizePx, height: sizePx }}>
      <img
        src={iconUrl(node.class, node.icon)}
        alt={node.title}
        draggable={false}
        className={`h-full w-full rounded-md object-cover ${
          selected ? 'ring-2 ring-[var(--color-accent-2)]' : ''
        }`}
      />

      {node.keybind && (
        <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 rounded bg-black/85 px-1 text-[10px] font-semibold leading-tight text-white ring-1 ring-white/20">
          {node.keybind}
        </span>
      )}

      {/* Hover-only delete affordance (in addition to selecting + Del key). */}
      <button
        type="button"
        title="Delete skill (Del)"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          removeNode(node.id)
          selectNode(null)
        }}
        className="nodrag pointer-events-none absolute z-10 grid place-items-center rounded-full bg-red-700 text-white opacity-0 ring-2 ring-[#0b0d12] transition-opacity hover:bg-red-600 group-hover:pointer-events-auto group-hover:opacity-100"
        style={{
          width: trashSize,
          height: trashSize,
          top: -trashGap,
          right: -(trashSize + trashGap),
        }}
      >
        <TrashIcon size={Math.round(trashSize * 0.55)} />
      </button>

      {/* Connection dots (chaiNNer-style): drag the right dot onto another skill's left
          dot to connect. Dragging the icon body moves it; clicking it selects.
          Stable handle ids ('s'/'t') let edges resolve their anchors. */}
      <Handle id="t" type="target" position={Position.Left} className="skill-handle" />
      <Handle id="s" type="source" position={Position.Right} className="skill-handle" />
    </div>
  )
}
