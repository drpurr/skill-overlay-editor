import { NodeResizer, type NodeProps } from '@xyflow/react'
import { useEditorStore } from '../state/editorStore'
import { GRID } from './frame'
import type { AnnotationBox } from '@skill-overlay/schema'

export interface BoxNodeRFData {
  box: AnnotationBox
  /** Box size in flow units. */
  wPx: number
  hPx: number
  radiusPx: number
  borderPx: number
  /** Frame size in flow units (to normalize on resize commit). */
  frameW: number
  frameH: number
  [key: string]: unknown
}

/** Convert a hex color + 0..1 opacity into rgba(). */
export function rgba(hex: string, opacity: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`
}

export function BoxNode({ data, selected }: NodeProps) {
  const { box, wPx, hPx, radiusPx, borderPx, frameW, frameH } =
    data as unknown as BoxNodeRFData
  const updateBox = useEditorStore((s) => s.updateBox)
  const annotationSnap = useEditorStore((s) => s.annotationSnap)

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={GRID}
        minHeight={GRID}
        lineStyle={{ borderColor: 'var(--color-accent-2)' }}
        handleStyle={{ background: 'var(--color-accent-2)', width: 8, height: 8 }}
        onResizeEnd={(_e, params) => {
          const snap = (v: number) => (annotationSnap ? Math.round(v / GRID) * GRID : v)
          updateBox(box.id, {
            x: snap(params.x) / frameW,
            y: snap(params.y) / frameH,
            w: Math.max(GRID, snap(params.width)) / frameW,
            h: Math.max(GRID, snap(params.height)) / frameH,
          })
        }}
      />
      <div
        style={{
          width: wPx,
          height: hPx,
          borderRadius: radiusPx,
          background: rgba(box.color, box.opacity),
          border: `${borderPx}px solid ${rgba(box.borderColor, box.borderOpacity)}`,
          boxShadow: selected ? '0 0 0 1.5px var(--color-accent-2)' : undefined,
        }}
      />
    </>
  )
}
