import { useCallback, useEffect, useMemo } from 'react'
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
import { RotationEdge } from './RotationEdge'
import { frameSize, iconSizePx } from './frame'

const FRAME_ID = '__frame__'
/** Shared grid unit: snap step and the visible square-grid spacing align to this. */
export const GRID = 24

const nodeTypes = { skill: SkillNode, frame: FrameNode }
const edgeTypes = { rotation: RotationEdge }

export default function RotationCanvas() {
  const build = useEditorStore((s) => s.build)
  const snap = useEditorStore((s) => s.snapToGrid)
  const showGrid = useEditorStore((s) => s.showGrid)
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId)
  const selectedEdgeId = useEditorStore((s) => s.selectedEdgeId)
  const moveNode = useEditorStore((s) => s.moveNode)
  const connectNodes = useEditorStore((s) => s.connectNodes)
  const removeNode = useEditorStore((s) => s.removeNode)
  const removeEdge = useEditorStore((s) => s.removeEdge)
  const selectNode = useEditorStore((s) => s.selectNode)
  const selectEdge = useEditorStore((s) => s.selectEdge)
  const addSkillNode = useEditorStore((s) => s.addSkillNode)

  const frame = useMemo(() => frameSize(build.canvas.aspect), [build.canvas.aspect])
  const { screenToFlowPosition } = useReactFlow()

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([])
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Re-seed RF nodes from the node/canvas slices (not the whole build) so unrelated edits
  // like renaming don't churn the canvas. Positions commit on drag stop, so a drag never
  // re-seeds mid-drag; the merge preserves RF-measured dimensions across re-seeds.
  useEffect(() => {
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
        label: `${build.canvas.reference.w}×${build.canvas.reference.h} · ${build.canvas.aspect}`,
        background: build.background?.dataUrl ?? null,
      },
    }
    const skillNodes: Node[] = build.nodes.map((n) => ({
      id: n.id,
      type: 'skill',
      position: { x: n.x * frame.w, y: n.y * frame.h },
      data: { node: n, sizePx: iconSizePx(build.canvas.baseIconPct, frame.h, n.scale) },
      selected: n.id === selectedNodeId,
      zIndex: 1,
    }))
    setRfNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]))
      const carry = (next: Node): Node => {
        const old = prevById.get(next.id)
        return old ? { ...old, ...next } : next
      }
      return [carry(frameNode), ...skillNodes.map(carry)]
    })
  }, [build.nodes, build.canvas, build.background, frame, selectedNodeId, setRfNodes])

  // Re-seed RF edges from the edges slice.
  useEffect(() => {
    setRfEdges(
      build.edges.map((e) => ({
        id: e.id,
        source: e.from,
        target: e.to,
        sourceHandle: 's',
        targetHandle: 't',
        type: 'rotation',
        selected: e.id === selectedEdgeId,
        data: { condition: e.condition, priority: e.priority },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 26,
          height: 26,
          color: e.id === selectedEdgeId ? '#e0a526' : '#ffffff',
        },
      })),
    )
  }, [build.edges, selectedEdgeId, setRfEdges])

  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source && c.target) connectNodes(c.source, c.target)
    },
    [connectNodes],
  )

  const onNodeDragStop = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      if (node.id === FRAME_ID) return
      moveNode(node.id, node.position.x / frame.w, node.position.y / frame.h)
    },
    [moveNode, frame],
  )

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id !== FRAME_ID) selectNode(node.id)
    },
    [selectNode],
  )

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => selectEdge(edge.id),
    [selectEdge],
  )

  const onPaneClick = useCallback(() => selectNode(null), [selectNode])

  const onNodesDelete = useCallback(
    (deleted: Node[]) => deleted.forEach((n) => n.id !== FRAME_ID && removeNode(n.id)),
    [removeNode],
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
        {showGrid ? (
          <Background variant={BackgroundVariant.Lines} gap={GRID} size={1} color="#222a37" />
        ) : (
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e2530" />
        )}
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
