// The WYSIWYG canvas renders a fixed-size "screen frame" in React Flow flow-units.
// Node positions are stored normalized 0..1 relative to this frame, so the layout is
// resolution-independent and maps directly onto the overlay's screen.
import type { AspectRatio } from '../schema/rotation'

/** Frame width in flow units (height derives from the aspect ratio). */
export const FRAME_W = 1280

const RATIO: Record<AspectRatio, number> = {
  '16:9': 16 / 9,
  '16:10': 16 / 10,
  '21:9': 21 / 9,
  '4:3': 4 / 3,
}

export interface Frame {
  w: number
  h: number
}

export function frameSize(aspect: AspectRatio): Frame {
  return { w: FRAME_W, h: Math.round(FRAME_W / RATIO[aspect]) }
}

/** Icon side length in flow-units = baseIconPct (fraction of screen height) × frameH × scale. */
export function iconSizePx(baseIconPct: number, frameH: number, scale: number): number {
  return baseIconPct * frameH * scale
}
