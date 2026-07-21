// DOM/SVG renderer — draws the rotation as a static cheat-sheet: every skill at full
// brightness with its keybind badge, white arrows between them, condition labels shown.
import type { ExportNode, OverlayExport } from '@skill-overlay/schema'
import { iconUrl } from './media'

const SVGNS = 'http://www.w3.org/2000/svg'
const TARGET_GAP = 10
/** Base arrow line width (before per-edge icon scaling). */
const LINE_W = 4

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

/** Convert a hex color + 0..1 opacity into rgba(). */
function rgba(hex: string, opacity: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return hex
  const n = parseInt(m[1], 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`
}

function arrowDefs(): string {
  return `<defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L8,3 L0,6 Z" fill="#FFFFFF" />
    </marker>
  </defs>`
}

/** Rebuild the overlay for the loaded export. Cheap for the ~10-20 icons of a rotation. */
export function renderOverlay(root: HTMLElement, exp: OverlayExport): void {
  root.innerHTML = ''

  const w = root.clientWidth
  const h = root.clientHeight
  const ref = exp.canvas.reference
  const ar = ref.w > 0 && ref.h > 0 ? ref.w / ref.h : 16 / 9
  // Letterbox: fit a rect of the authored resolution's aspect inside the window.
  let fw = w
  let fh = w / ar
  if (fh > h) {
    fh = h
    fw = h * ar
  }
  const ox = (w - fw) / 2
  const oy = (h - fh) / 2
  const base = exp.canvas.baseIconPct * fh

  const pxScale = fh / ref.h // reference-px -> screen-px

  // annotation boxes (bottom layer, under arrows and icons)
  for (const bx of exp.boxes) {
    const el = document.createElement('div')
    el.className = 'annot-box'
    el.style.left = `${ox + bx.x * fw}px`
    el.style.top = `${oy + bx.y * fh}px`
    el.style.width = `${bx.w * fw}px`
    el.style.height = `${bx.h * fh}px`
    el.style.borderRadius = `${bx.radius * fh}px`
    el.style.background = rgba(bx.color, bx.opacity)
    el.style.border = `${bx.borderWidth * pxScale}px solid ${rgba(bx.borderColor, bx.borderOpacity)}`
    root.appendChild(el)
  }

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

  // edges (line + arrowhead scale with the connected icons' average scale)
  for (const e of exp.edges) {
    const a = byId(e.from)
    const b = byId(e.to)
    if (!a || !b) continue
    const ba = boxOf(a)
    const bb = boxOf(b)
    const sp = borderPoint(ba, bb, 0)
    const tp = borderPoint(bb, ba, TARGET_GAP)
    const edgeScale = (a.scale + b.scale) / 2
    const line = document.createElementNS(SVGNS, 'line')
    line.setAttribute('x1', String(sp.x))
    line.setAttribute('y1', String(sp.y))
    line.setAttribute('x2', String(tp.x))
    line.setAttribute('y2', String(tp.y))
    line.setAttribute('stroke', '#FFFFFF')
    line.setAttribute('stroke-width', String(LINE_W * edgeScale))
    line.setAttribute('marker-end', 'url(#arrow)')
    svg.appendChild(line)

    // condition label near the target icon
    if (e.condition) {
      const label = document.createElement('div')
      label.className = 'cond'
      label.textContent = e.condition
      label.style.left = `${bb.x + bb.w / 2}px`
      label.style.top = `${bb.y - 6}px`
      root.appendChild(label)
    }
  }

  // nodes — all full brightness, keybind badges kept
  for (const n of exp.nodes) {
    const box = boxOf(n)
    const el = document.createElement('div')
    el.className = 'node'
    el.style.left = `${box.x}px`
    el.style.top = `${box.y}px`
    el.style.width = `${box.w}px`
    el.style.height = `${box.h}px`
    el.style.backgroundImage = `url(${iconUrl(n.class, n.icon)})`
    if (n.keybind) {
      const k = document.createElement('span')
      k.className = 'key'
      k.textContent = n.keybind
      // Scales with the icon (offsets/padding are em-based in CSS).
      k.style.fontSize = `${Math.max(7, box.w * 0.22)}px`
      el.appendChild(k)
    }
    root.appendChild(el)
  }

  // text labels (top layer), centered on their position
  for (const t of exp.texts) {
    const el = document.createElement('div')
    el.className = 'annot-text'
    el.textContent = t.text
    el.style.left = `${ox + t.x * fw}px`
    el.style.top = `${oy + t.y * fh}px`
    el.style.fontFamily = t.font
    el.style.fontSize = `${t.size * fh}px`
    el.style.color = rgba(t.color, t.opacity)
    if (t.borderWidth > 0) {
      el.style.webkitTextStroke = `${t.borderWidth * pxScale}px ${t.borderColor}`
      el.style.paintOrder = 'stroke fill'
    }
    root.appendChild(el)
  }
}
