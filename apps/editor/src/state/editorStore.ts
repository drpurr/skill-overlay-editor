// Canonical editor state. The `build` slice is the document (saved/exported) and is the
// only thing tracked for undo/redo via zundo; UI state (selection, view) is not.
import { create } from 'zustand'
import { useStore } from 'zustand'
import { temporal } from 'zundo'
import type { TemporalState } from 'zundo'
import type { Skill } from '../media/skills'
import {
  SCHEMA_VERSION,
  canvasSchema,
  type AnnotationBox,
  type AspectRatio,
  type RotationBuild,
  type SkillNode,
  type TextLabel,
} from '@skill-overlay/schema'

/** Canvas interaction mode: select/move, draw annotation boxes, or place text. */
export type Tool = 'select' | 'box' | 'text'

/** Slice tracked by undo/redo history. */
export interface EditorDoc {
  build: RotationBuild
}

export interface EditorState extends EditorDoc {
  // --- UI (not undoable) ---
  selectedNodeId: string | null
  selectedEdgeId: string | null
  selectedBoxId: string | null
  selectedTextId: string | null
  tool: Tool
  snapToGrid: boolean
  /** Snap for annotation boxes/text (separate from icon snap); defaults ON. */
  annotationSnap: boolean
  showGrid: boolean
  settingsOpen: boolean

  // --- selection / view ---
  selectNode: (id: string | null) => void
  selectEdge: (id: string | null) => void
  selectBox: (id: string | null) => void
  selectText: (id: string | null) => void
  setTool: (tool: Tool) => void
  setSnapToGrid: (on: boolean) => void
  setAnnotationSnap: (on: boolean) => void
  setShowGrid: (on: boolean) => void
  setSettingsOpen: (open: boolean) => void

  // --- document lifecycle ---
  newBuild: (name: string, classKey: string) => void
  loadBuild: (build: RotationBuild) => void
  setName: (name: string) => void
  /** Change the build's primary class (the skill palette). Non-destructive to nodes. */
  setClass: (classKey: string) => void

  // --- nodes ---
  addSkillNode: (skill: Skill, classKey: string, x: number, y: number) => string
  moveNode: (id: string, x: number, y: number) => void
  setNodeScale: (id: string, scale: number) => void
  setNodeKeybind: (id: string, keybind: string | null) => void
  toggleNodeStart: (id: string) => void
  removeNode: (id: string) => void

  // --- edges ---
  connectNodes: (from: string, to: string) => void
  updateEdge: (id: string, patch: { condition?: string; priority?: number }) => void
  removeEdge: (id: string) => void

  // --- annotations ---
  addBox: (x: number, y: number, w: number, h: number) => string
  updateBox: (id: string, patch: Partial<Omit<AnnotationBox, 'id'>>) => void
  removeBox: (id: string) => void
  addText: (x: number, y: number) => string
  updateText: (id: string, patch: Partial<Omit<TextLabel, 'id'>>) => void
  removeText: (id: string) => void

  // --- canvas ---
  setResolution: (w: number, h: number) => void
  setBaseIconPct: (pct: number) => void
  setBackground: (dataUrl: string | null) => void
}

const nowIso = () => new Date().toISOString()
const newId = () => crypto.randomUUID()

export function createEmptyBuild(name: string, classKey: string): RotationBuild {
  const t = nowIso()
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId(),
    name,
    class: classKey,
    canvas: canvasSchema.parse({}), // schema defaults: 16:9, 1920×1080, 6% icons
    background: null,
    nodes: [],
    edges: [],
    boxes: [],
    texts: [],
    createdAt: t,
    updatedAt: t,
  }
}

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => {
      /** Apply an immutable update to the build and bump `updatedAt`. */
      const mutate = (fn: (b: RotationBuild) => RotationBuild) =>
        set((s) => ({ build: { ...fn(s.build), updatedAt: nowIso() } }))

      const mapNodes = (fn: (n: SkillNode) => SkillNode) => (b: RotationBuild) => ({
        ...b,
        nodes: b.nodes.map(fn),
      })

      return {
        build: createEmptyBuild('Untitled Build', 'berserker'),
        selectedNodeId: null,
        selectedEdgeId: null,
        selectedBoxId: null,
        selectedTextId: null,
        tool: 'select',
        snapToGrid: false, // freeform icon placement by default; snapping is opt-in
        annotationSnap: true, // boxes/text snap by default
        showGrid: false,
        settingsOpen: false,

        selectNode: (id) =>
          set({ selectedNodeId: id, selectedEdgeId: null, selectedBoxId: null, selectedTextId: null }),
        selectEdge: (id) =>
          set({ selectedEdgeId: id, selectedNodeId: null, selectedBoxId: null, selectedTextId: null }),
        selectBox: (id) =>
          set({ selectedBoxId: id, selectedNodeId: null, selectedEdgeId: null, selectedTextId: null }),
        selectText: (id) =>
          set({ selectedTextId: id, selectedNodeId: null, selectedEdgeId: null, selectedBoxId: null }),
        setTool: (tool) => set({ tool }),
        setSnapToGrid: (on) => set({ snapToGrid: on }),
        setAnnotationSnap: (on) => set({ annotationSnap: on }),
        setShowGrid: (on) => set({ showGrid: on }),
        setSettingsOpen: (open) => set({ settingsOpen: open }),

        newBuild: (name, classKey) =>
          set({
            build: createEmptyBuild(name, classKey),
            selectedNodeId: null,
            selectedEdgeId: null,
            selectedBoxId: null,
            selectedTextId: null,
          }),
        loadBuild: (build) =>
          set({
            build,
            selectedNodeId: null,
            selectedEdgeId: null,
            selectedBoxId: null,
            selectedTextId: null,
          }),
        setName: (name) => mutate((b) => ({ ...b, name })),
        setClass: (classKey) => mutate((b) => ({ ...b, class: classKey })),

        addSkillNode: (skill, classKey, x, y) => {
          const id = newId()
          const isFirst = get().build.nodes.length === 0
          const node: SkillNode = {
            id,
            skillId: skill.id,
            class: classKey,
            icon: skill.icon,
            title: skill.title,
            x: clamp01(x),
            y: clamp01(y),
            scale: 1,
            keybind: null,
            isStart: isFirst, // first node defaults to a rotation entry point
          }
          mutate((b) => ({ ...b, nodes: [...b.nodes, node] }))
          return id
        },
        moveNode: (id, x, y) =>
          mutate(mapNodes((n) => (n.id === id ? { ...n, x: clamp01(x), y: clamp01(y) } : n))),
        setNodeScale: (id, scale) =>
          mutate(mapNodes((n) => (n.id === id ? { ...n, scale: clamp(scale, 0.1, 5) } : n))),
        setNodeKeybind: (id, keybind) =>
          mutate(mapNodes((n) => (n.id === id ? { ...n, keybind } : n))),
        toggleNodeStart: (id) =>
          mutate(mapNodes((n) => (n.id === id ? { ...n, isStart: !n.isStart } : n))),
        removeNode: (id) =>
          mutate((b) => ({
            ...b,
            nodes: b.nodes.filter((n) => n.id !== id),
            edges: b.edges.filter((e) => e.from !== id && e.to !== id),
          })),

        connectNodes: (from, to) => {
          if (from === to) return
          const { nodes, edges } = get().build
          // Both endpoints must be live skills (never mint a dangling edge).
          if (!nodes.some((n) => n.id === from) || !nodes.some((n) => n.id === to)) return
          if (edges.some((e) => e.from === from && e.to === to)) return
          mutate((b) => ({ ...b, edges: [...b.edges, { id: newId(), from, to }] }))
        },
        updateEdge: (id, patch) =>
          mutate((b) => ({
            ...b,
            edges: b.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          })),
        removeEdge: (id) =>
          mutate((b) => ({ ...b, edges: b.edges.filter((e) => e.id !== id) })),

        addBox: (x, y, w, h) => {
          const id = newId()
          const box: AnnotationBox = {
            id,
            x: clamp01(x),
            y: clamp01(y),
            w: clamp01(w),
            h: clamp01(h),
            radius: 0.015,
            color: '#FFFFFF',
            opacity: 0.12,
            borderColor: '#FFFFFF',
            borderOpacity: 0.6,
            borderWidth: 2,
          }
          mutate((b) => ({ ...b, boxes: [...b.boxes, box] }))
          return id
        },
        updateBox: (id, patch) =>
          mutate((b) => ({
            ...b,
            boxes: b.boxes.map((box) => (box.id === id ? { ...box, ...patch } : box)),
          })),
        removeBox: (id) =>
          mutate((b) => ({ ...b, boxes: b.boxes.filter((box) => box.id !== id) })),

        addText: (x, y) => {
          const id = newId()
          const label: TextLabel = {
            id,
            x: clamp01(x),
            y: clamp01(y),
            text: 'New text',
            font: 'system-ui',
            size: 0.025,
            color: '#FFFFFF',
            opacity: 1,
            borderColor: '#000000',
            borderWidth: 0,
          }
          mutate((b) => ({ ...b, texts: [...b.texts, label] }))
          return id
        },
        updateText: (id, patch) =>
          mutate((b) => ({
            ...b,
            texts: b.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
          })),
        removeText: (id) =>
          mutate((b) => ({ ...b, texts: b.texts.filter((t) => t.id !== id) })),

        setResolution: (w, h) =>
          mutate((b) => ({
            ...b,
            canvas: { ...b.canvas, reference: { w, h }, aspect: nearestAspect(w, h) },
          })),
        setBaseIconPct: (pct) =>
          mutate((b) => ({ ...b, canvas: { ...b.canvas, baseIconPct: clamp(pct, 0.01, 1) } })),
        setBackground: (dataUrl) =>
          mutate((b) => ({
            ...b,
            background: dataUrl ? { kind: 'screenshot', dataUrl } : null,
          })),
      }
    },
    {
      // Only the document is undoable; UI state is excluded.
      partialize: (state): EditorDoc => ({ build: state.build }),
      limit: 100,
    },
  ),
)

/** Hook into zundo's temporal store (undo/redo, history sizes). */
export function useTemporal<T>(selector: (s: TemporalState<EditorDoc>) => T): T {
  return useStore(useEditorStore.temporal, selector)
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v))
}
function clamp01(v: number): number {
  return clamp(v, 0, 1)
}

/** Best-match coarse aspect label for a resolution (the exact ratio drives geometry). */
function nearestAspect(w: number, h: number): AspectRatio {
  const r = w / h
  const options: Array<[AspectRatio, number]> = [
    ['16:9', 16 / 9],
    ['16:10', 16 / 10],
    ['21:9', 21 / 9],
    ['4:3', 4 / 3],
  ]
  return options.reduce((best, o) => (Math.abs(o[1] - r) < Math.abs(best[1] - r) ? o : best))[0]
}
