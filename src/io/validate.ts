import type { RotationBuild } from '../schema/rotation'

export interface ValidationIssue {
  level: 'error' | 'warning'
  message: string
}

/**
 * Validate a build for export. Errors block export; warnings are advisory.
 *   error:   no skills, no start node, dangling edges.
 *   warning: skills missing a keybind, duplicate keybinds, unreachable skills.
 */
export function validateBuild(build: RotationBuild): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const err = (message: string) => issues.push({ level: 'error', message })
  const warn = (message: string) => issues.push({ level: 'warning', message })

  if (build.nodes.length === 0) {
    err('Add at least one skill to the canvas.')
    return issues
  }

  if (!build.nodes.some((n) => n.isStart)) {
    err('Mark at least one skill as a rotation start point.')
  }

  const ids = new Set(build.nodes.map((n) => n.id))
  for (const e of build.edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) {
      err('A connection references a missing skill (dangling edge).')
      break
    }
  }

  // Missing keybinds (needed for the overlay to follow keypresses).
  const noKey = build.nodes.filter((n) => !n.keybind)
  if (noKey.length) {
    warn(
      `${noKey.length} skill${noKey.length === 1 ? '' : 's'} have no keybind` +
        ` (${noKey.slice(0, 3).map((n) => n.title || `#${n.skillId}`).join(', ')}${
          noKey.length > 3 ? '…' : ''
        }).`,
    )
  }

  // Duplicate keybinds.
  const byKey = new Map<string, number>()
  for (const n of build.nodes) {
    if (n.keybind) byKey.set(n.keybind, (byKey.get(n.keybind) ?? 0) + 1)
  }
  for (const [key, count] of byKey) {
    if (count > 1) warn(`Keybind "${key}" is used by ${count} skills.`)
  }

  // Unreachable skills (not reachable from any start node).
  const reachable = reachableFromStarts(build)
  const stranded = build.nodes.filter((n) => !n.isStart && !reachable.has(n.id))
  if (stranded.length) {
    warn(
      `${stranded.length} skill${stranded.length === 1 ? '' : 's'} can't be reached from a start point.`,
    )
  }

  return issues
}

export function exportErrors(issues: ValidationIssue[]): ValidationIssue[] {
  return issues.filter((i) => i.level === 'error')
}

function reachableFromStarts(build: RotationBuild): Set<string> {
  const adj = new Map<string, string[]>()
  for (const e of build.edges) {
    if (!adj.has(e.from)) adj.set(e.from, [])
    adj.get(e.from)!.push(e.to)
  }
  const seen = new Set<string>()
  const queue: string[] = []
  for (const n of build.nodes) {
    if (n.isStart) {
      seen.add(n.id)
      queue.push(n.id)
    }
  }
  while (queue.length) {
    const id = queue.shift()!
    for (const to of adj.get(id) ?? []) {
      if (!seen.has(to)) {
        seen.add(to)
        queue.push(to)
      }
    }
  }
  return seen
}
