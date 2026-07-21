import type { NodeProps } from '@xyflow/react'
import { rgba } from './BoxNode'
import type { TextLabel } from '@skill-overlay/schema'

export interface TextNodeRFData {
  label: TextLabel
  /** Font size in flow units. */
  fontPx: number
  /** Text-outline width in flow units (0 = none). */
  strokePx: number
  [key: string]: unknown
}

/**
 * Free text label. The React Flow node position IS the text's CENTER: the wrapper is
 * zero-size and the content centers itself with a -50%,-50% translate, which makes
 * center-based grid snapping exact regardless of the text's rendered size.
 */
export function TextNode({ data, selected }: NodeProps) {
  const { label, fontPx, strokePx } = data as unknown as TextNodeRFData

  return (
    <div className="relative h-0 w-0">
      <div
        className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-pre rounded px-1 ${
          selected ? 'ring-1.5 ring-[var(--color-accent-2)]' : ''
        }`}
        style={{
          fontFamily: label.font,
          fontSize: fontPx,
          lineHeight: 1.2,
          color: rgba(label.color, label.opacity),
          WebkitTextStroke: strokePx > 0 ? `${strokePx}px ${label.borderColor}` : undefined,
          paintOrder: 'stroke fill',
        }}
      >
        {label.text || ' '}
      </div>
    </div>
  )
}
