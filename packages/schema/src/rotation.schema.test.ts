import { describe, expect, it } from 'vitest'
import { canvasSchema, overlayExportSchema } from './rotation'

describe('canvasSchema', () => {
  it('applies defaults', () => {
    expect(canvasSchema.parse({})).toEqual({
      aspect: '16:9',
      reference: { w: 1920, h: 1080 },
      baseIconPct: 0.06,
    })
  })
})

describe('overlayExportSchema', () => {
  it('round-trips a minimal export through JSON', () => {
    const exp = {
      format: 'lostark-rotation-overlay' as const,
      schemaVersion: 1 as const,
      name: 'Test',
      class: 'berserker',
      canvas: canvasSchema.parse({}),
      nodes: [],
      edges: [],
    }
    expect(overlayExportSchema.parse(JSON.parse(JSON.stringify(exp)))).toEqual(exp)
  })
})
