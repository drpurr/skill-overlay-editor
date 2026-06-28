import { describe, expect, it } from 'vitest'
import {
  overlayExportSchema,
  rotationBuildSchema,
  type RotationBuild,
} from './rotation'
import { buildToExport } from '../io/exporter'
import { exportToBuild, importAny, parseProject } from '../io/importer'

function sampleBuild(): RotationBuild {
  return rotationBuildSchema.parse({
    schemaVersion: 1,
    id: 'b1',
    name: 'Test Rotation',
    class: 'berserker',
    canvas: { aspect: '16:9', reference: { w: 1920, h: 1080 }, baseIconPct: 0.06 },
    background: { kind: 'screenshot', dataUrl: 'data:image/png;base64,AAAA' },
    nodes: [
      {
        id: 'n1',
        skillId: 16030,
        class: 'berserker',
        icon: 'bk_skill_01_6.webp',
        title: 'Power Break',
        x: 0.1,
        y: 0.5,
        scale: 1,
        keybind: 'Q',
        isStart: true,
      },
      {
        id: 'n2',
        skillId: 16050,
        class: 'berserker',
        icon: 'bk_skill_01_4.webp',
        title: 'Crime Hazard',
        x: 0.35,
        y: 0.5,
        scale: 1.25,
        keybind: 'W',
        isStart: false,
      },
    ],
    edges: [{ id: 'e1', from: 'n1', to: 'n2', condition: 'Identity full', priority: 1 }],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  })
}

describe('project schema', () => {
  it('round-trips through JSON unchanged', () => {
    const build = sampleBuild()
    const reparsed = parseProject(JSON.parse(JSON.stringify(build)))
    expect(reparsed).toEqual(build)
  })
})

describe('overlay export', () => {
  it('round-trips through JSON unchanged', () => {
    const exp = buildToExport(sampleBuild())
    const reparsed = overlayExportSchema.parse(JSON.parse(JSON.stringify(exp)))
    expect(reparsed).toEqual(exp)
  })

  it('carries geometry, keybinds, and branching metadata', () => {
    const exp = buildToExport(sampleBuild())
    expect(exp.format).toBe('lostark-rotation-overlay')
    expect(exp.nodes[1]).toMatchObject({ x: 0.35, y: 0.5, scale: 1.25, keybind: 'W' })
    expect(exp.edges[0]).toMatchObject({
      from: 'n1',
      to: 'n2',
      condition: 'Identity full',
      priority: 1,
    })
  })

  it('drops editor-only fields (title, background)', () => {
    const exp = buildToExport(sampleBuild())
    expect('background' in exp).toBe(false)
    expect('title' in exp.nodes[0]).toBe(false)
  })

  it('can be imported back into an editable build', () => {
    const exp = buildToExport(sampleBuild())
    const build = exportToBuild(exp)
    expect(build.nodes.map((n) => n.skillId)).toEqual([16030, 16050])
    expect(build.edges[0]).toMatchObject({ from: 'n1', to: 'n2', priority: 1 })
  })

  it('importAny detects export vs project by the format tag', () => {
    const build = sampleBuild()
    expect(importAny(JSON.parse(JSON.stringify(build))).name).toBe('Test Rotation')
    const exp = buildToExport(build)
    expect(importAny(JSON.parse(JSON.stringify(exp))).class).toBe('berserker')
  })
})
