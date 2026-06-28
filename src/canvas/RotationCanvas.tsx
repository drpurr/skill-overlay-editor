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

const nodeTypes = { skill: SkillNode, frame: FrameNode }
const edgeTypes = { rotation: RotationEdge }

export default function RotationCanvas() {
  const build = useEditorStore((s) => s.build)
  const tool = useEditorStore((s) => s.tool)
  const snap = useEditorStore((s) => s.snapToGrid)
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

  // Re-seed React Flow from the store document (single source of truth) whenever it or
  // the selection changes. Positions are committed back on drag stop, so a drag (which
  // doesn't touch `build`) never triggers a mid-drag re-seed.
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
    setRfNodes([frameNode, ...skillNodes])

    setRfEdges(
      build.edges.map((e) => ({
        id: e.id,
        source: e.from,
        target: e.to,
        type: 'rotation',
        selected: e.id === selectedEdgeId,
        data: { condition: e.condition, priority: e.priority },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 18,
          height: 18,
          color: e.id === selectedEdgeId ? '#e0a526' : '#8b94a6',
        },
      })),
    )
  }, [build, frame, selectedNodeId, selectedEdgeId, setRfNodes, setRfEdges])

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
      if (node.id === FRAME_ID) return
      if (tool === 'delete') {
        removeNode(node.id)
        return
      }
      selectNode(node.id)
    },
    [tool, removeNode, selectNode],
  )

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (tool === 'delete') {
        removeEdge(edge.id)
        return
      }
      selectEdge(edge.id)
    },
    [tool, removeEdge, selectEdge],
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
      const flow = screenToFlowPosition({ x: e.clientX, y: e.clientY })
      const size = iconSizePx(build.canvas.baseIconPct, frame.h, 1)
      const x = (flow.x - size / 2) / frame.w
      const y = (flow.y - size / 2) / frame.h
      const id = addSkillNode(payload.skill, payload.classKey, x, y)
      selectNode(id)
    },
    [screenToFlowPosition, build.canvas.baseIconPct, frame, addSkillNode, selectNode],
  )

  return (
    <div
      className={`absolute inset-0 ${tool === 'connect' ? 'connect-mode' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
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
        nodesDraggable={tool === 'select'}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={snap}
        snapGrid={[16, 16]}
        minZoom={0.2}
        maxZoom={4}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Shift']}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1e2530" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
