import { Handle, Position, type NodeProps } from '@xyflow/react'
import { iconUrl } from '../media/skills'
import type { SkillNode as SkillNodeData } from '../schema/rotation'

export interface SkillNodeRFData {
  node: SkillNodeData
  /** Icon side length in flow-units. */
  sizePx: number
  [key: string]: unknown
}

export function SkillNode({ data, selected }: NodeProps) {
  const { node, sizePx } = data as unknown as SkillNodeRFData

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

      {node.isStart && (
        <span
          title="Rotation start"
          className="absolute -left-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-black shadow"
        >
          ▶
        </span>
      )}

      {node.keybind && (
        <span className="pointer-events-none absolute -bottom-1.5 -right-1.5 rounded bg-black/85 px-1 text-[10px] font-semibold leading-tight text-white ring-1 ring-white/20">
          {node.keybind}
        </span>
      )}

      {/* Single full-cover handle; inert unless the Connect tool is active (see index.css).
          Loose connection mode lets it act as both source and target. */}
      <Handle
        type="source"
        position={Position.Right}
        className="skill-handle"
        style={{
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          transform: 'none',
          borderRadius: 8,
          background: 'transparent',
          border: 'none',
        }}
      />
    </div>
  )
}
