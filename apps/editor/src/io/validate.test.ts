import { describe, expect, it } from 'vitest'
import { rotationBuildSchema, type RotationBuild } from '@skill-overlay/schema'
import { exportErrors, validateBuild } from './validate'

function valid(): RotationBuild {
  return rotationBuildSchema.parse({
    schemaVersion: 1,
    id: 'b1',
    name: 'Test',
    class: 'berserker',
    canvas: { aspect: '16:9', reference: { w: 1920, h: 1080 }, baseIconPct: 0.06 },
    background: null,
    nodes: [
      { id: 'n1', skillId: 1, class: 'berserker', icon: 'a.webp', title: 'A', x: 0.1, y: 0.5, scale: 1, keybind: 'Q', isStart: true },
      { id: 'n2', skillId: 2, class: 'berserker', icon: 'b.webp', title: 'B', x: 0.3, y: 0.5, scale: 1, keybind: 'W', isStart: false },
    ],
    edges: [{ id: 'e1', from: 'n1', to: 'n2' }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  })
}

const errorMessages = (b: RotationBuild) => exportErrors(validateBuild(b)).map((i) => i.message)
const warnMessages = (b: RotationBuild) =>
  validateBuild(b).filter((i) => i.level === 'warning').map((i) => i.message)

describe('validateBuild', () => {
  it('passes a well-formed build with no errors or warnings', () => {
    const issues = validateBuild(valid())
    expect(issues).toEqual([])
  })

  it('errors when there are no skills', () => {
    const b = valid()
    b.nodes = []
    b.edges = []
    expect(errorMessages(b).join(' ')).toMatch(/at least one skill/i)
  })

  it('errors when no start point is marked', () => {
    const b = valid()
    b.nodes = b.nodes.map((n) => ({ ...n, isStart: false }))
    expect(errorMessages(b).join(' ')).toMatch(/start point/i)
  })

  it('errors on a dangling edge', () => {
    const b = valid()
    b.edges = [{ id: 'e9', from: 'n1', to: 'missing' }]
    expect(errorMessages(b).join(' ')).toMatch(/dangling/i)
  })

  it('warns on a missing keybind', () => {
    const b = valid()
    b.nodes[1] = { ...b.nodes[1], keybind: null }
    expect(warnMessages(b).join(' ')).toMatch(/no keybind/i)
  })

  it('warns on duplicate keybinds', () => {
    const b = valid()
    b.nodes[1] = { ...b.nodes[1], keybind: 'Q' }
    expect(warnMessages(b).join(' ')).toMatch(/used by 2 skills/i)
  })

  it('warns on an unreachable skill', () => {
    const b = valid()
    b.edges = [] // n2 is now unreachable from n1 (the start)
    expect(warnMessages(b).join(' ')).toMatch(/can't be reached/i)
  })
})
