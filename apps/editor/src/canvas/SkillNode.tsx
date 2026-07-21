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

  // Delete button scales with the icon (always ~1/3 of its side, so always smaller) and
  // floats just off the icon's top-right corner rather than covering it.
  const trashSize = Math.max(14, sizePx * 0.34)
  const trashGap = Math.max(3, sizePx * 0.08)

  return (
    <div className="relative" style={{ width: sizePx, height: sizePx }}>
      <img
        src={iconUrl(node.class, node.icon)}
        alt={node.title}
        draggable={false}
        className={`h-full w-full rounded-md object-cover ring-2 ${
          selected
            ? 'ring-[var(--color-accent-2)]'
            : node.isStart
              ? 'ring-emerald-500/80'
              : 'ring-black/70'
        }`}
      />

      {node.keybind && (
        <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 rounded bg-black/85 px-1 text-[10px] font-semibold leading-tight text-white ring-1 ring-white/20">
          {node.keybind}
        </span>
      )}

      {/* Always-visible delete affordance (in addition to selecting + Del key). */}
      <button
        type="button"
        title="Delete skill (Del)"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          removeNode(node.id)
          selectNode(null)
        }}
        className="nodrag absolute z-10 grid place-items-center rounded-full bg-red-700 text-white ring-2 ring-[#0b0d12] hover:bg-red-600"
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
