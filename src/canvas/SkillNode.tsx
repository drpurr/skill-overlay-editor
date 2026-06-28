import { Handle, Position, type NodeProps } from '@xyflow/react'
import { iconUrl } from '../media/skills'
import { useEditorStore } from '../state/editorStore'
import { TrashIcon } from '../toolbar/icons'
import type { SkillNode as SkillNodeData } from '../schema/rotation'

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

  return (
    <div className="relative" style={{ width: sizePx, height: sizePx }}>
      <img
        src={iconUrl(node.class, node.icon)}
        alt={node.title}
        draggable={false}
        className={`h-full w-full rounded-md object-cover ring-2 ${
          selected ? 'ring-[var(--color-accent-2)]' : 'ring-black/70'
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
        className="nodrag absolute -right-3 -top-3 z-10 grid h-5 w-5 place-items-center rounded-full bg-red-700 text-white ring-2 ring-[#0b0d12] hover:bg-red-600"
      >
        <TrashIcon size={11} />
      </button>

      {/* Connection dots (chaiNNer-style): drag the right dot onto another skill's left
          dot to connect. Dragging the icon body moves it; clicking it selects.
          Stable handle ids ('s'/'t') let edges resolve their anchors. */}
      <Handle id="t" type="target" position={Position.Left} className="skill-handle" />
      <Handle id="s" type="source" position={Position.Right} className="skill-handle" />
    </div>
  )
}
