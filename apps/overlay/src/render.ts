// DOM/SVG renderer — a port of the editor's tools/overlay-preview.html, driven by the
// rotation state instead of clicks. Highlights the current skill + its possible-next set.
import type { ExportNode, OverlayExport } from '@skill-overlay/schema'
import { possibleNext, type RotationState } from './rotation'
import { iconUrl } from './media'

const SVGNS = 'http://www.w3.org/2000/svg'
const TARGET_GAP = 10

function aspectRatio(a: string): number {
  const [w, h] = a.split(':').map(Number)
  return w && h ? w / h : 16 / 9
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/** Point on box `from`'s border toward `toward`'s center, pushed `gap` px further outward. */
function borderPoint(from: Box, toward: Box, gap: number) {
  const fx = from.x + from.w / 2
  const fy = from.y + from.h / 2
  const tx = toward.x + toward.w / 2
  const ty = toward.y + toward.h / 2
  const dx = tx - fx
  const dy = ty - fy
  if (dx === 0 && dy === 0) return { x: fx, y: fy }
  const scale = 1 / Math.max(Math.abs(dx) / (from.w / 2), Math.abs(dy) / (from.h / 2))
  let x = fx + dx * scale
  let y = fy + dy * scale
  if (gap) {
    const len = Math.hypot(dx, dy)
    x += (dx / len) * gap
    y += (dy / len) * gap
  }
  return { x, y }
}

function arrowDefs(): string {
  return `<defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L8,3 L0,6 Z" fill="#FFFFFF" />
    </marker>
    <marker id="arrow-next" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L8,3 L0,6 Z" fill="#34d399" />
    </marker>
  </defs>`
}

/** Rebuild the overlay for the given state. Cheap for the ~10-20 icons of a rotation. */
export function renderOverlay(root: HTMLElement, state: RotationState): void {
  const exp: OverlayExport = state.export
  root.innerHTML = ''

  const w = root.clientWidth
  const h = root.clientHeight
  const ar = aspectRatio(exp.canvas.aspect)
  // Letterbox: fit a rect of the authored aspect inside the window.
  let fw = w
  let fh = w / ar
  if (fh > h) {
    fh = h
    fw = h * ar
  }
  const ox = (w - fw) / 2
  const oy = (h - fh) / 2
  const base = exp.canvas.baseIconPct * fh

  const svg = document.createElementNS(SVGNS, 'svg')
  svg.setAttribute('class', 'edges')
  svg.setAttribute('width', String(w))
  svg.setAttribute('height', String(h))
  svg.innerHTML = arrowDefs()
  root.appendChild(svg)

  const boxOf = (n: ExportNode): Box => {
    const size = base * n.scale
    return { x: ox + n.x * fw, y: oy + n.y * fh, w: size, h: size }
  }
  const byId = (id: string) => exp.nodes.find((n) => n.id === id)

  const cur = state.currentId
  const nextIds = new Set(possibleNext(state).map((n) => n.id))

  // edges
  for (const e of exp.edges) {
    const a = byId(e.from)
    const b = byId(e.to)
    if (!a || !b) continue
    const ba = boxOf(a)
    const bb = boxOf(b)
    const sp = borderPoint(ba, bb, 0)
    const tp = borderPoint(bb, ba, TARGET_GAP)
    const active = cur !== null && e.from === cur
    const line = document.createElementNS(SVGNS, 'line')
    line.setAttribute('x1', String(sp.x))
    line.setAttribute('y1', String(sp.y))
    line.setAttribute('x2', String(tp.x))
    line.setAttribute('y2', String(tp.y))
    line.setAttribute('stroke', active ? '#34d399' : '#FFFFFF')
    line.setAttribute('stroke-width', active ? '4' : '2')
    line.setAttribute('opacity', cur !== null && !active ? '0.2' : '1')
    line.setAttribute('marker-end', active ? 'url(#arrow-next)' : 'url(#arrow)')
    svg.appendChild(line)
  }

  // nodes
  for (const n of exp.nodes) {
    const box = boxOf(n)
    const el = document.createElement('div')
    el.className = 'node'
    if (n.id === cur) el.classList.add('current')
    else if (nextIds.has(n.id)) el.classList.add('next')
    else el.classList.add('dim')
    el.style.left = `${box.x}px`
    el.style.top = `${box.y}px`
    el.style.width = `${box.w}px`
    el.style.height = `${box.h}px`
    el.style.backgroundImage = `url(${iconUrl(n.class, n.icon)})`
    if (n.keybind) {
      const k = document.createElement('span')
      k.className = 'key'
      k.textContent = n.keybind
      el.appendChild(k)
    }
    root.appendChild(el)
  }

  // condition labels on edges leaving the current node
  if (cur !== null) {
    for (const e of exp.edges) {
      if (e.from !== cur || !e.condition) continue
      const b = byId(e.to)
      if (!b) continue
      const box = boxOf(b)
      const label = document.createElement('div')
      label.className = 'cond'
      label.textContent = e.condition
      label.style.left = `${box.x + box.w / 2}px`
      label.style.top = `${box.y - 6}px`
      root.appendChild(label)
    }
  }
}
