// The WYSIWYG canvas renders a fixed-width "screen frame" in React Flow flow-units; its
// height comes from the build's target resolution, so the frame matches the monitor's exact
// aspect ratio. Node positions are stored normalized 0..1 relative to this frame.

/** Frame width in flow units (height derives from the resolution's aspect ratio). */
export const FRAME_W = 1280

export interface Frame {
  w: number
  h: number
}

export function frameSize(reference: { w: number; h: number }): Frame {
  const ratio = reference.w > 0 && reference.h > 0 ? reference.w / reference.h : 16 / 9
  return { w: FRAME_W, h: Math.round(FRAME_W / ratio) }
}

/** Icon side length in flow-units = baseIconPct (fraction of screen height) × frameH × scale. */
export function iconSizePx(baseIconPct: number, frameH: number, scale: number): number {
  return baseIconPct * frameH * scale
}
