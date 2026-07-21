import type { NodeProps } from '@xyflow/react'
import { GRID } from './frame'

export interface FrameNodeData {
  w: number
  h: number
  label: string
  background: string | null
  showGrid: boolean
  [key: string]: unknown
}

/**
 * The screen frame: a non-interactive backdrop representing the game screen at the
 * chosen aspect ratio, with an optional uploaded screenshot. `pointer-events: none`
 * so clicks/pans fall through to the React Flow pane. The alignment grid draws ON TOP
 * of the screenshot (icons render above it and are never restricted by it — snapping
 * is a separate, opt-in toggle).
 */
export function FrameNode({ data }: NodeProps) {
  const { w, h, label, background, showGrid } = data as unknown as FrameNodeData

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
      {showGrid && (
        <div
          className="absolute inset-0 rounded-md"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, rgba(255,255,255,0.14) 0 1px, transparent 1px 100%),' +
              'repeating-linear-gradient(to bottom, rgba(255,255,255,0.14) 0 1px, transparent 1px 100%)',
            backgroundSize: `${GRID}px ${GRID}px`,
          }}
        />
      )}
      <span className="absolute left-2 top-1 text-[11px] tracking-wide text-white/40">
        {label}
      </span>
    </div>
  )
}
