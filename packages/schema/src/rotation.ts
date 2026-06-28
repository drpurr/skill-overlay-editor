// Single source of truth for both serialization formats:
//   - RotationBuild  : the full, editable project saved by the editor.
//   - OverlayExport  : the lean, runtime projection the overlay consumes.
// Types are inferred from these schemas and shared with the (future) overlay app.
import { z } from 'zod'

export const SCHEMA_VERSION = 1 as const

/** Supported authoring aspect ratios (canvas is locked to one). */
export const aspectRatioSchema = z.enum(['16:9', '16:10', '21:9', '4:3'])
export type AspectRatio = z.infer<typeof aspectRatioSchema>

/** A reference resolution used only to reason about pixel sizes; positions stay normalized. */
export const resolutionSchema = z.object({
  w: z.number().int().positive(),
  h: z.number().int().positive(),
})

/** Canvas/screen configuration. `baseIconPct` = base icon size as a fraction of screen height. */
export const canvasSchema = z.object({
  aspect: aspectRatioSchema.default('16:9'),
  reference: resolutionSchema.default({ w: 1920, h: 1080 }),
  baseIconPct: z.number().positive().max(1).default(0.06),
})
export type CanvasConfig = z.infer<typeof canvasSchema>

/** Optional editor-only canvas backdrop (a game screenshot) to aid WYSIWYG placement. */
export const backgroundSchema = z
  .object({
    kind: z.literal('screenshot'),
    /** Data URL of the uploaded image. */
    dataUrl: z.string(),
  })
  .nullable()
export type CanvasBackground = z.infer<typeof backgroundSchema>

/**
 * A skill placed on the canvas. `x`/`y` are normalized 0..1 (top-left origin) so the
 * layout is resolution-independent. `scale` multiplies the base icon size.
 */
export const skillNodeSchema = z.object({
  id: z.string(),
  /** Lost Ark skill id (from lost-ark-media). */
  skillId: z.number().int(),
  /** Class key (lowercased in-game name) used to resolve the icon. */
  class: z.string(),
  /** Icon file name, e.g. "bk_skill_01_6.webp". */
  icon: z.string(),
  /** Denormalized skill name (kept for offline/debug convenience). */
  title: z.string(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  scale: z.number().positive().default(1),
  /** In-game key the player presses for this skill (e.g. "Q", "Shift+Z"); null if unset. */
  keybind: z.string().nullable().default(null),
  /** Whether the rotation may begin at this node. */
  isStart: z.boolean().default(false),
})
export type SkillNode = z.infer<typeof skillNodeSchema>

/**
 * A directed "what comes next" link. `condition` is a human-readable hint shown near the
 * arrow (NOT auto-evaluated — the overlay never reads game state). `priority` orders
 * which next-skill the overlay emphasizes among siblings (lower = higher priority).
 */
export const rotationEdgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  condition: z.string().optional(),
  priority: z.number().int().optional(),
})
export type RotationEdge = z.infer<typeof rotationEdgeSchema>

/** The full editable project. */
export const rotationBuildSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string(),
  name: z.string(),
  /** Class key (lowercased in-game name); one class per build. */
  class: z.string(),
  canvas: canvasSchema,
  background: backgroundSchema.default(null),
  nodes: z.array(skillNodeSchema),
  edges: z.array(rotationEdgeSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type RotationBuild = z.infer<typeof rotationBuildSchema>

// --- Overlay export (lean runtime projection) -------------------------------------------

/** Export node: like SkillNode but drops the denormalized title (overlay resolves names). */
export const exportNodeSchema = z.object({
  id: z.string(),
  skillId: z.number().int(),
  class: z.string(),
  icon: z.string(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  scale: z.number().positive(),
  keybind: z.string().nullable(),
  isStart: z.boolean(),
})
export type ExportNode = z.infer<typeof exportNodeSchema>

/**
 * What the overlay consumes. Self-describing enough to render and follow the rotation;
 * icons are resolved by the overlay against its own lost-ark-media copy (class + icon).
 * Editor-only data (screenshot background, timestamps) is intentionally omitted.
 */
export const overlayExportSchema = z.object({
  format: z.literal('lostark-rotation-overlay'),
  schemaVersion: z.literal(SCHEMA_VERSION),
  name: z.string(),
  class: z.string(),
  canvas: canvasSchema,
  nodes: z.array(exportNodeSchema),
  edges: z.array(rotationEdgeSchema),
})
export type OverlayExport = z.infer<typeof overlayExportSchema>
