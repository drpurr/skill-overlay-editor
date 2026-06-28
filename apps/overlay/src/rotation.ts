// Pure rotation state machine. Given a loaded export and the player's keystrokes, it tracks
// the current step and what may come next. No DOM, no Tauri — unit-tested in isolation.
import type { ExportNode, OverlayExport } from '@skill-overlay/schema'

export interface RotationState {
  readonly export: OverlayExport
  /** id of the last skill used, or null = before the rotation has started. */
  readonly currentId: string | null
}

export function createState(exp: OverlayExport): RotationState {
  return { export: exp, currentId: null }
}

const nodeById = (exp: OverlayExport, id: string): ExportNode | undefined =>
  exp.nodes.find((n) => n.id === id)

/**
 * Skills that may come next, priority-ordered (lower `priority` first; unset = last).
 * Before the rotation starts (currentId null) the candidates are the start nodes.
 */
export function possibleNext(state: RotationState): ExportNode[] {
  const { export: exp, currentId } = state
  if (currentId === null) return exp.nodes.filter((n) => n.isStart)
  return exp.edges
    .filter((e) => e.from === currentId)
    .slice()
    .sort(
      (a, b) =>
        (a.priority ?? Number.POSITIVE_INFINITY) - (b.priority ?? Number.POSITIVE_INFINITY),
    )
    .map((e) => nodeById(exp, e.to))
    .filter((n): n is ExportNode => !!n)
}

/**
 * Advance on a pressed keybind:
 *   1. if it matches one of the possible-next skills, move there;
 *   2. else if it matches *any* node's keybind, jump there (re-sync to where the player is);
 *   3. else ignore (unknown key).
 */
export function advance(state: RotationState, keybind: string): RotationState {
  const candidate = possibleNext(state).find((n) => n.keybind === keybind)
  if (candidate) return { ...state, currentId: candidate.id }
  const anywhere = state.export.nodes.find((n) => n.keybind === keybind)
  if (anywhere) return { ...state, currentId: anywhere.id }
  return state
}

export function reset(state: RotationState): RotationState {
  return { ...state, currentId: null }
}
