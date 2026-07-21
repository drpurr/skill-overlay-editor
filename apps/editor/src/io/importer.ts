import {
  SCHEMA_VERSION,
  overlayExportSchema,
  rotationBuildSchema,
  type OverlayExport,
  type RotationBuild,
} from '@skill-overlay/schema'
import { sanitizeBuild } from './sanitize'

const newId = () => crypto.randomUUID()
const nowIso = () => new Date().toISOString()

/** Parse a saved project file. Throws (ZodError) if it doesn't match the schema. */
export function parseProject(json: unknown): RotationBuild {
  return sanitizeBuild(rotationBuildSchema.parse(json))
}

/** Rebuild an editable project from an overlay export (titles/background are not present). */
export function exportToBuild(exp: OverlayExport): RotationBuild {
  const t = nowIso()
  return sanitizeBuild(rotationBuildSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    id: newId(),
    name: exp.name,
    class: exp.class,
    canvas: exp.canvas,
    background: null,
    nodes: exp.nodes.map((n) => ({ ...n, title: '' })),
    edges: exp.edges,
    boxes: exp.boxes,
    texts: exp.texts,
    createdAt: t,
    updatedAt: t,
  }))
}

/**
 * Import either a project file or an overlay export (detected by the `format` tag),
 * returning an editable build. Throws if it matches neither schema.
 */
export function importAny(json: unknown): RotationBuild {
  if (json && typeof json === 'object' && (json as { format?: unknown }).format === 'lostark-rotation-overlay') {
    return exportToBuild(overlayExportSchema.parse(json))
  }
  return parseProject(json)
}
