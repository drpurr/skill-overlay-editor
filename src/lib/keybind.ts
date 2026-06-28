/**
 * Format a keydown into a binding string like "Q", "Shift+Z", "Ctrl+Alt+F".
 * Returns null for a bare modifier press (the caller should keep listening).
 * Shared by the editor's keybind capture and, later, the overlay's keystroke matching.
 */
export function formatKeybind(e: KeyboardEvent): string | null {
  const k = e.key
  if (k === 'Shift' || k === 'Control' || k === 'Alt' || k === 'Meta') return null
  const parts: string[] = []
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  parts.push(k.length === 1 ? k.toUpperCase() : k)
  return parts.join('+')
}
