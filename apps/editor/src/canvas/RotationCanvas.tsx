import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEditorStore } from '../state/editorStore'
import { SKILL_DND_MIME, type SkillDragPayload } from '../library/dnd'
import { SkillNode } from './SkillNode'
import { FrameNode } from './FrameNode'
import { BoxNode } from './BoxNode'
import { TextNode } from './TextNode'
import { RotationEdge } from './RotationEdge'
import { frameSize, GRID, iconSizePx } from './frame'

const FRAME_ID = '__frame__'

const nodeTypes = { skill: SkillNode, frame: FrameNode, box: BoxNode, text: TextNode }
const edgeTypes = { rotation: RotationEdge }

/** Snap a flow-coordinate to the nearest grid line. */
const snapLine = (v: number) => Math.round(v / GRID) * GRID
/** Snap a flow-coordinate to the nearest grid-cell CENTER (between grid lines). */
const snapCellCenter = (v: number) => (Math.round(v / GRID - 0.5) + 0.5) * GRID

export default function RotationCanvas() {
  const build = useEditorStore((s) => s.build)
  const tool = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)
  const snap = useEditorStore((s) => s.snapToGrid)
  const annotationSnap = useEditorStore((s) => s.annotationSnap)
  const showGrid = useEditorStore((s) => s.showGrid)
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId)
  const selectedEdgeId = useEditorStore((s) => s.selectedEdgeId)
  const selectedBoxId = useEditorStore((s) => s.selectedBoxId)
  const selectedTextId = useEditorStore((s) => s.selectedTextId)
  const moveNode = useEditorStore((s) => s.moveNode)
  const connectNodes = useEditorStore((s) => s.connectNodes)
  const removeNode = useEditorStore((s) => s.removeNode)
  const removeEdge = useEditorStore((s) => s.removeEdge)
  const selectNode = useEditorStore((s) => s.selectNode)
  const selectEdge = useEditorStore((s) => s.selectEdge)
  const selectBox = useEditorStore((s) => s.selectBox)
  const selectText = useEditorStore((s) => s.selectText)
  const addSkillNode = useEditorStore((s) => s.addSkillNode)
  const addBox = useEditorStore((s) => s.addBox)
  const updateBox = useEditorStore((s) => s.updateBox)
  const removeBox = useEditorStore((s) => s.removeBox)
  const addText = useEditorStore((s) => s.addText)
  const updateText = useEditorStore((s) => s.updateText)
  const removeText = useEditorStore((s) => s.removeText)

  const frame = useMemo(() => frameSize(build.canvas.reference), [build.canvas.reference])
  const { screenToFlowPosition } = useReactFlow()

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([])
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Re-seed RF nodes from the document slices. Positions commit on drag stop, so a drag
  // never re-seeds mid-drag; the merge preserves RF-measured dimensions across re-seeds.
  useEffect(() => {
    const refH = build.canvas.reference.h
    const frameNode: Node = {
      id: FRAME_ID,
      type: 'frame',
      position: { x: 0, y: 0 },
      draggable: false,
      selectable: false,
      focusable: false,
      deletable: false,
      zIndex: 0,
      data: {
        w: frame.w,
        h: frame.h,
        label: `${build.canvas.reference.w}×${build.canvas.reference.h}`,
        background: build.background?.dataUrl ?? null,
        showGrid,
      },
    }
    // Annotation boxes sit above the frame, below text and skills.
    const boxNodes: Node[] = build.boxes.map((b) => ({
      id: b.id,
      type: 'box',
      position: { x: b.x * frame.w, y: b.y * frame.h },
      data: {
        box: b,
        wPx: b.w * frame.w,
        hPx: b.h * frame.h,
        radiusPx: b.radius * frame.h,
        borderPx: (b.borderWidth / refH) * frame.h,
        frameW: frame.w,
        frameH: frame.h,
      },
      selected: b.id === selectedBoxId,
      zIndex: 1,
    }))
    const textNodes: Node[] = build.texts.map((t) => ({
      id: t.id,
      type: 'text',
      // Position IS the text center (TextNode self-centers with a translate).
      position: { x: t.x * frame.w, y: t.y * frame.h },
      data: {
        label: t,
        fontPx: t.size * frame.h,
        strokePx: (t.borderWidth / refH) * frame.h,
      },
      selected: t.id === selectedTextId,
      zIndex: 2,
    }))
    const skillNodes: Node[] = build.nodes.map((n) => ({
      id: n.id,
      type: 'skill',
      position: { x: n.x * frame.w, y: n.y * frame.h },
      data: { node: n, sizePx: iconSizePx(build.canvas.baseIconPct, frame.h, n.scale) },
      selected: n.id === selectedNodeId,
      zIndex: 3,
    }))
    setRfNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]))
      const carry = (next: Node): Node => {
        const old = prevById.get(next.id)
        return old ? { ...old, ...next } : next
      }
      return [carry(frameNode), ...boxNodes.map(carry), ...textNodes.map(carry), ...skillNodes.map(carry)]
    })
  }, [
    build.nodes,
    build.boxes,
    build.texts,
    build.canvas,
    build.background,
    frame,
    selectedNodeId,
    selectedBoxId,
    selectedTextId,
    showGrid,
    setRfNodes,
  ])

  // Re-seed RF edges from the edges slice. Each arrow scales with the average icon scale
  // of the two skills it connects.
  useEffect(() => {
    const scaleOf = new Map(build.nodes.map((n) => [n.id, n.scale]))
    const edgeScale = (from: string, to: string) =>
      ((scaleOf.get(from) ?? 1) + (scaleOf.get(to) ?? 1)) / 2
    setRfEdges(
      build.edges.map((e) => {
        const s = edgeScale(e.from, e.to)
        return {
          id: e.id,
          source: e.from,
          target: e.to,
          sourceHandle: 's',
          targetHandle: 't',
          type: 'rotation',
          selected: e.id === selectedEdgeId,
          data: { condition: e.condition, priority: e.priority, scale: s },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 26 * s,
            height: 26 * s,
            color: '#FFFFFF',
          },
        }
      }),
    )
  }, [build.edges, build.nodes, selectedEdgeId, setRfEdges])

  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source && c.target) connectNodes(c.source, c.target)
    },
    [connectNodes],
  )

  const onNodeDragStop = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      if (node.id === FRAME_ID) return
      if (node.type === 'box') {
        const x = annotationSnap ? snapLine(node.position.x) : node.position.x
        const y = annotationSnap ? snapLine(node.position.y) : node.position.y
        updateBox(node.id, { x: x / frame.w, y: y / frame.h })
      } else if (node.type === 'text') {
        // Position is the center; snap it BETWEEN grid lines (cell centers).
        const x = annotationSnap ? snapCellCenter(node.position.x) : node.position.x
        const y = annotationSnap ? snapCellCenter(node.position.y) : node.position.y
        updateText(node.id, { x: x / frame.w, y: y / frame.h })
      } else {
        moveNode(node.id, node.position.x / frame.w, node.position.y / frame.h)
      }
    },
    [moveNode, updateBox, updateText, annotationSnap, frame],
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id === FRAME_ID) return
      if (node.type === 'box') selectBox(node.id)
      else if (node.type === 'text') selectText(node.id)
      else selectNode(node.id)
    },
    [selectNode, selectBox, selectText],
  )

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => selectEdge(edge.id),
    [selectEdge],
  )

  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (tool === 'text') {
        const flow = screenToFlowPosition({ x: e.clientX, y: e.clientY })
        const cx = annotationSnap ? snapCellCenter(flow.x) : flow.x
        const cy = annotationSnap ? snapCellCenter(flow.y) : flow.y
        const id = addText(cx / frame.w, cy / frame.h)
        selectText(id)
        setTool('select')
        return
      }
      selectNode(null)
    },
    [tool, screenToFlowPosition, annotationSnap, addText, selectText, setTool, selectNode, frame],
  )

  const onNodesDelete = useCallback(
    (deleted: Node[]) =>
      deleted.forEach((n) => {
        if (n.id === FRAME_ID) return
        if (n.type === 'box') removeBox(n.id)
        else if (n.type === 'text') removeText(n.id)
        else removeNode(n.id)
      }),
    [removeNode, removeBox, removeText],
  )
  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => deleted.forEach((e) => removeEdge(e.id)),
    [removeEdge],
  )

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData(SKILL_DND_MIME)
      if (!raw) return
      const payload = JSON.parse(raw) as SkillDragPayload
      // Guard: a build is single-class; never accept a skill from another class.
      if (payload.classKey !== build.class) return
      const flow = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const size = iconSizePx(build.canvas.baseIconPct, frame.h, 1)
      const x = (flow.x - size / 2) / frame.w
      const y = (flow.y - size / 2) / frame.h
      const id = addSkillNode(payload.skill, payload.classKey, x, y)
      selectNode(id)
    },
    [screenToFlowPosition, build.canvas.baseIconPct, build.class, frame, addSkillNode, selectNode],
  )

  // --- box drawing (tool === 'box'): drag on an overlay that sits above the canvas ---
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(
    null,
  )

  const onDrawDown = useCallback((e: React.PointerEvent) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // pointer capture is best-effort (can throw for synthetic/stale pointer ids)
    }
    const r = surfaceRef.current!.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    setDraft({ x0: x, y0: y, x1: x, y1: y })
  }, [])

  const onDrawMove = useCallback((e: React.PointerEvent) => {
    const r = surfaceRef.current!.getBoundingClientRect()
    setDraft((d) => (d ? { ...d, x1: e.clientX - r.left, y1: e.clientY - r.top } : d))
  }, [])

  const onDrawUp = useCallback(
    (e: React.PointerEvent) => {
      const d = draft
      setDraft(null)
      if (!d) return
      const r = surfaceRef.current!.getBoundingClientRect()
      const a = screenToFlowPosition({ x: r.left + Math.min(d.x0, d.x1), y: r.top + Math.min(d.y0, d.y1) })
      const b = screenToFlowPosition({ x: r.left + Math.max(d.x0, d.x1), y: r.top + Math.max(d.y0, d.y1) })
      let x0 = a.x
      let y0 = a.y
      let x1 = b.x
      let y1 = b.y
      if (annotationSnap) {
        x0 = snapLine(x0)
        y0 = snapLine(y0)
        x1 = snapLine(x1)
        y1 = snapLine(y1)
      }
      if (x1 - x0 < GRID / 2 || y1 - y0 < GRID / 2) return // ignore accidental clicks
      const id = addBox(x0 / frame.w, y0 / frame.h, (x1 - x0) / frame.w, (y1 - y0) / frame.h)
      selectBox(id)
      setTool('select')
      void e
    },
    [draft, screenToFlowPosition, annotationSnap, addBox, selectBox, setTool, frame],
  )

  return (
    <div className="absolute inset-0" onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        connectionMode={ConnectionMode.Loose}
        connectionLineStyle={{ stroke: '#FFFFFF', strokeWidth: 3 }}
        snapToGrid={snap}
        snapGrid={[GRID, GRID]}
        minZoom={0.2}
        maxZoom={4}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        deleteKeyCode={['Delete', 'Backspace']}
        selectionKeyCode={null}
        multiSelectionKeyCode={null}
      >
        {/* Pane dots only; the alignment grid draws inside the frame, over the screenshot. */}
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e2530" />
        <Controls showInteractive={false} />
      </ReactFlow>

      {tool === 'box' && (
        <div
          ref={surfaceRef}
          className="absolute inset-0 z-10 cursor-crosshair"
          onPointerDown={onDrawDown}
          onPointerMove={onDrawMove}
          onPointerUp={onDrawUp}
        >
          {draft && (
            <div
              className="absolute rounded-md border-2 border-[var(--color-accent-2)] bg-white/10"
              style={{
                left: Math.min(draft.x0, draft.x1),
                top: Math.min(draft.y0, draft.y1),
                width: Math.abs(draft.x1 - draft.x0),
                height: Math.abs(draft.y1 - draft.y0),
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
