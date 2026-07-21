import { describe, expect, it } from 'vitest'
import { rotationBuildSchema, type RotationBuild } from '@skill-overlay/schema'
import { sanitizeBuild } from './sanitize'
import { buildToExport } from './exporter'

/** A build whose second edge dangles (references a deleted skill). */
function corrupt(): RotationBuild {
  return rotationBuildSchema.parse({
    schemaVersion: 1,
    id: 'b1',
    name: 'T',
    class: 'berserker',
    canvas: { aspect: '16:9', reference: { w: 1920, h: 1080 }, baseIconPct: 0.06 },
    background: null,
    nodes: [
      { id: 'a', skillId: 1, class: 'berserker', icon: 'a.webp', title: 'A', x: 0.1, y: 0.5, scale: 1, keybind: 'Q', isStart: true },
      { id: 'b', skillId: 2, class: 'berserker', icon: 'b.webp', title: 'B', x: 0.3, y: 0.5, scale: 1, keybind: 'W', isStart: false },
    ],
    edges: [
      { id: 'e1', from: 'a', to: 'b' },
      { id: 'e2', from: 'a', to: 'GONE' }, // dangling
      { id: 'e3', from: 'GONE', to: 'b' }, // dangling
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  })
}

describe('sanitizeBuild', () => {
  it('drops edges that reference missing skills', () => {
    const clean = sanitizeBuild(corrupt())
    expect(clean.edges.map((e) => e.id)).toEqual(['e1'])
  })

  it('returns the same object when nothing dangles', () => {
    const clean = sanitizeBuild(corrupt())
    expect(sanitizeBuild(clean)).toBe(clean)
  })
})

describe('buildToExport', () => {
  it('never exports dangling edges (and therefore never throws on them)', () => {
    const exp = buildToExport(corrupt())
    expect(exp.edges.map((e) => e.id)).toEqual(['e1'])
  })
})
