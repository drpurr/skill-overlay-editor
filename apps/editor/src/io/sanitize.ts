import type { RotationBuild } from '@skill-overlay/schema'

/**
 * Repair referential integrity: drop any edge that references a missing skill. Dangling
 * edges are unrenderable garbage (historically minted by old data or interrupted writes),
 * so every load/import/export path runs this instead of surfacing an error dead-end.
 */
export function sanitizeBuild(build: RotationBuild): RotationBuild {
  const ids = new Set(build.nodes.map((n) => n.id))
  const edges = build.edges.filter((e) => ids.has(e.from) && ids.has(e.to))
  return edges.length === build.edges.length ? build : { ...build, edges }
}
