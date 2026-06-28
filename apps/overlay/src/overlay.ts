// Overlay window entry: render a loaded rotation and advance it from key events that the
// Rust rdev listener forwards. The window itself is transparent + click-through.
import { listen } from '@tauri-apps/api/event'
import { overlayExportSchema } from '@skill-overlay/schema'
import { advance, createState, reset, type RotationState } from './rotation'
import { renderOverlay } from './render'

const root = document.getElementById('app') as HTMLElement
const hint = document.getElementById('hint')
let state: RotationState | null = null

function render(): void {
  if (state) renderOverlay(root, state)
}

function loadExport(value: unknown): void {
  const parsed = overlayExportSchema.safeParse(value)
  if (!parsed.success) {
    console.error('Ignoring invalid rotation export:', parsed.error.message)
    return
  }
  state = createState(parsed.data)
  if (hint) hint.style.display = 'none'
  render()
}

// Canonical keybind strings ("Q", "Shift+Z") emitted by the Rust rdev listener.
void listen<string>('keydown', (e) => {
  if (!state) return
  state = advance(state, e.payload)
  render()
})

void listen('reset-rotation', () => {
  if (!state) return
  state = reset(state)
  render()
})

void listen<unknown>('load-rotation', (e) => loadExport(e.payload))

window.addEventListener('resize', render)
