// Canonical editor state. The `build` slice is the document (saved/exported) and is the
// only thing tracked for undo/redo via zundo; UI state (selection, tool) is not.
import { create } from 'zustand'
import { useStore } from 'zustand'
import { temporal } from 'zundo'
import type { TemporalState } from 'zundo'
import type { Skill } from '../media/skills'
import {
  SCHEMA_VERSION,
  type AspectRatio,
  type RotationBuild,
  type SkillNode,
} from '../schema/rotation'

/** Slice tracked by undo/redo history. */
export interface EditorDoc {
  build: RotationBuild
}

export interface EditorState extends EditorDoc {
  // --- UI (not undoable) ---
  selectedNodeId: string | null
  selectedEdgeId: string | null
  snapToGrid: boolean
  showGrid: boolean
  settingsOpen: boolean

  // --- selection / view ---
  selectNode: (id: string | null) => void
  selectEdge: (id: string | null) => void
  setSnapToGrid: (on: boolean) => void
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

  // --- canvas ---
  setAspect: (aspect: AspectRatio) => void
  setBaseIconPct: (pct: number) => void
  setBackground: (dataUrl: string | null) => void
}

const nowIso = () => new Date().toISOString()
const newId = () => crypto.randomUUID()

/** Default base icon size as a fraction of screen height (~6% ≈ a Lost Ark HUD skill slot). */
const DEFAULT_BASE_ICON_PCT = 0.06

export function createEmptyBuild(name: string, classKey: string): RotationBuild {
  const t = nowIso()
  return {
    schemaVersion: SCHEMA_VERSION,
    id: newId(),
    name,
    class: classKey,
    canvas: { aspect: '16:9', reference: { w: 1920, h: 1080 }, baseIconPct: DEFAULT_BASE_ICON_PCT },
    background: null,
    nodes: [],
    edges: [],
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
        snapToGrid: true,
        showGrid: false,
        settingsOpen: false,

        selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: null }),
        selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: null }),
        setSnapToGrid: (on) => set({ snapToGrid: on }),
        setShowGrid: (on) => set({ showGrid: on }),
        setSettingsOpen: (open) => set({ settingsOpen: open }),

        newBuild: (name, classKey) =>
          set({
            build: createEmptyBuild(name, classKey),
            selectedNodeId: null,
            selectedEdgeId: null,
          }),
        loadBuild: (build) =>
          set({ build, selectedNodeId: null, selectedEdgeId: null }),
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
          const exists = get().build.edges.some((e) => e.from === from && e.to === to)
          if (exists) return
          mutate((b) => ({ ...b, edges: [...b.edges, { id: newId(), from, to }] }))
        },
        updateEdge: (id, patch) =>
          mutate((b) => ({
            ...b,
            edges: b.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          })),
        removeEdge: (id) =>
          mutate((b) => ({ ...b, edges: b.edges.filter((e) => e.id !== id) })),

        setAspect: (aspect) =>
          mutate((b) => ({ ...b, canvas: { ...b.canvas, aspect } })),
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
