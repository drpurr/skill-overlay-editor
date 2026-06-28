import type { NodeProps } from '@xyflow/react'

export interface FrameNodeData {
  w: number
  h: number
  label: string
  background: string | null
  [key: string]: unknown
}

/**
 * The screen frame: a non-interactive backdrop representing the game screen at the
 * chosen aspect ratio, with an optional uploaded screenshot. `pointer-events: none`
 * so clicks/pans fall through to the React Flow pane.
 */
export function FrameNode({ data }: NodeProps) {
  const { w, h, label, background } = data as unknown as FrameNodeData

  return (
    <div
      className="pointer-events-none relative rounded-md border border-white/15 bg-black/30"
      style={{ width: w, height: h }}
    >
      {background && (
        <img
          src={background}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full rounded-md object-cover opacity-90"
        />
      )}
      <span className="absolute left-2 top-1 text-[11px] tracking-wide text-white/40">
        {label}
      </span>
    </div>
  )
}
