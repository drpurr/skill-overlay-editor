import { describe, expect, it } from 'vitest'
import type { OverlayExport } from '@skill-overlay/schema'
import { advance, createState, possibleNext, reset } from './rotation'

function sample(): OverlayExport {
  return {
    format: 'lostark-rotation-overlay',
    schemaVersion: 1,
    name: 'T',
    class: 'berserker',
    canvas: { aspect: '16:9', reference: { w: 1920, h: 1080 }, baseIconPct: 0.06 },
    nodes: [
      { id: 'a', skillId: 1, class: 'berserker', icon: 'a.webp', x: 0.1, y: 0.5, scale: 1, keybind: 'Q', isStart: true },
      { id: 'b', skillId: 2, class: 'berserker', icon: 'b.webp', x: 0.3, y: 0.5, scale: 1, keybind: 'W', isStart: false },
      { id: 'c', skillId: 3, class: 'berserker', icon: 'c.webp', x: 0.5, y: 0.5, scale: 1, keybind: 'E', isStart: false },
      { id: 'd', skillId: 4, class: 'berserker', icon: 'd.webp', x: 0.7, y: 0.5, scale: 1, keybind: 'R', isStart: false },
    ],
    edges: [
      { id: 'e1', from: 'a', to: 'b', priority: 2 },
      { id: 'e2', from: 'a', to: 'c', priority: 1, condition: 'Identity full' },
      { id: 'e3', from: 'c', to: 'd' },
    ],
  }
}

describe('rotation state machine', () => {
  it('starts with the start nodes as possible-next', () => {
    expect(possibleNext(createState(sample())).map((n) => n.id)).toEqual(['a'])
  })

  it('advances on the start keybind and orders next by priority', () => {
    const s = advance(createState(sample()), 'Q')
    expect(s.currentId).toBe('a')
    expect(possibleNext(s).map((n) => n.id)).toEqual(['c', 'b']) // priority 1 before 2
  })

  it('advances to a matching candidate', () => {
    const s = advance(advance(createState(sample()), 'Q'), 'E')
    expect(s.currentId).toBe('c')
    expect(possibleNext(s).map((n) => n.id)).toEqual(['d'])
  })

  it('re-syncs to any node on an off-script keypress', () => {
    // at 'a' the candidates are c,b — 'R' (node d) is not a candidate, so we jump to d.
    const s = advance(advance(createState(sample()), 'Q'), 'R')
    expect(s.currentId).toBe('d')
  })

  it('ignores an unknown keypress', () => {
    const s0 = advance(createState(sample()), 'Q')
    const s1 = advance(s0, 'Z')
    expect(s1.currentId).toBe('a')
  })

  it('reset returns to the start', () => {
    const s = reset(advance(createState(sample()), 'Q'))
    expect(s.currentId).toBeNull()
    expect(possibleNext(s).map((n) => n.id)).toEqual(['a'])
  })
})
