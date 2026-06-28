import { describe, expect, it } from 'vitest'
import { formatKeybind } from './keybind'

const ev = (p: Partial<KeyboardEvent>) => p as KeyboardEvent

describe('formatKeybind', () => {
  it('uppercases single character keys', () => {
    expect(formatKeybind(ev({ key: 'q' }))).toBe('Q')
  })
  it('orders modifiers Ctrl+Alt+Shift', () => {
    expect(formatKeybind(ev({ key: 'z', ctrlKey: true, altKey: true, shiftKey: true }))).toBe(
      'Ctrl+Alt+Shift+Z',
    )
  })
  it('returns null for a bare modifier press', () => {
    expect(formatKeybind(ev({ key: 'Shift', shiftKey: true }))).toBeNull()
  })
  it('keeps named keys verbatim', () => {
    expect(formatKeybind(ev({ key: 'Tab' }))).toBe('Tab')
  })
})
