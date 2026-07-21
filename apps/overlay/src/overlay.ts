// Overlay window entry: render the loaded rotation as a static cheat-sheet. The window is
// transparent + click-through; keybind badges are shown but no input is monitored.
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { overlayExportSchema, type OverlayExport } from '@skill-overlay/schema'
import { renderOverlay } from './render'

const root = document.getElementById('app') as HTMLElement
const hint = document.getElementById('hint')
let current: OverlayExport | null = null

function render(): void {
  if (current) renderOverlay(root, current)
}

function loadExport(value: unknown): void {
  const parsed = overlayExportSchema.safeParse(value)
  if (!parsed.success) {
    console.error('Ignoring invalid rotation export:', parsed.error.message)
    return
  }
  current = parsed.data
  if (hint) hint.style.display = 'none'
  render()
}

void listen<unknown>('load-rotation', (e) => loadExport(e.payload))

function applyOpacity(opacity: number): void {
  root.style.opacity = String(opacity)
}

void listen<{ opacity: number }>('config-changed', (e) => applyOpacity(e.payload.opacity))

// Restore persisted opacity + the last-loaded rotation on startup.
void invoke<{ opacity: number }>('get_config')
  .then((cfg) => applyOpacity(cfg.opacity))
  .catch(() => {})
void invoke<unknown>('get_initial_rotation')
  .then((value) => {
    if (value) loadExport(value)
  })
  .catch(() => {})

window.addEventListener('resize', render)
