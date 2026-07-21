import {
  overlayExportSchema,
  type OverlayExport,
  type RotationBuild,
} from '@skill-overlay/schema'

/**
 * Project the full editable build down to the lean overlay export the runtime consumes.
 * Drops editor-only data (denormalized titles, screenshot background, timestamps).
 * The result is validated against `overlayExportSchema` so a malformed export can't escape.
 */
export function buildToExport(build: RotationBuild): OverlayExport {
  // Belt-and-braces: never export an edge whose endpoint skill is missing.
  const ids = new Set(build.nodes.map((n) => n.id))
  const edges = build.edges.filter((e) => ids.has(e.from) && ids.has(e.to))
  const draft: OverlayExport = {
    format: 'lostark-rotation-overlay',
    schemaVersion: build.schemaVersion,
    name: build.name,
    class: build.class,
    canvas: build.canvas,
    nodes: build.nodes.map((n) => ({
      id: n.id,
      skillId: n.skillId,
      class: n.class,
      icon: n.icon,
      x: n.x,
      y: n.y,
      scale: n.scale,
      keybind: n.keybind,
      isStart: n.isStart,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      condition: e.condition,
      priority: e.priority,
    })),
    boxes: build.boxes,
    texts: build.texts,
  }
  return overlayExportSchema.parse(draft)
}
