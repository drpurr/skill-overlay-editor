// Settings window: edit opacity, rebind the (fully user-configurable) global hotkeys, and
// load a rotation. All changes round-trip through the Rust `set_config` command.
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

interface Hotkeys {
  toggle: string
}
interface Config {
  hotkeys: Hotkeys
  opacity: number
  last_rotation_path: string | null
}

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
let config: Config

/** "Ctrl+Alt+KeyR" → "Ctrl + Alt + R" for display. */
function pretty(accel: string): string {
  return accel
    .split('+')
    .map((t) => (t.startsWith('Key') ? t.slice(3) : t.startsWith('Digit') ? t.slice(5) : t))
    .join(' + ')
}

function render(): void {
  ;($('opacity') as HTMLInputElement).value = String(config.opacity)
  $('opacity-val').textContent = `${Math.round(config.opacity * 100)}%`
  $('hk-toggle').textContent = pretty(config.hotkeys.toggle)
  const path = config.last_rotation_path
  $('rot').textContent = path ? `Loaded: ${path.split(/[\\/]/).pop()}` : 'No rotation loaded.'
}

function save(): void {
  void invoke('set_config', { config })
}

$('opacity').addEventListener('input', (e) => {
  config.opacity = Number((e.target as HTMLInputElement).value)
  $('opacity-val').textContent = `${Math.round(config.opacity * 100)}%`
  save()
})

/** Capture a key combo and store it as a Code-based accelerator the backend can parse. */
function capture(btnId: string, which: keyof Hotkeys): void {
  const btn = $(btnId)
  const previous = btn.textContent
  btn.textContent = 'Press a combo…'
  const stop = () => window.removeEventListener('keydown', onKey, true)
  const onKey = (e: KeyboardEvent) => {
    e.preventDefault()
    if (e.key === 'Escape') {
      stop()
      btn.textContent = previous
      return
    }
    if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') return
    const mods: string[] = []
    if (e.ctrlKey) mods.push('Ctrl')
    if (e.altKey) mods.push('Alt')
    if (e.shiftKey) mods.push('Shift')
    if (e.metaKey) mods.push('Super')
    if (mods.length === 0) {
      btn.textContent = 'Use a modifier…'
      return
    }
    config.hotkeys[which] = [...mods, e.code].join('+')
    stop()
    render()
    save()
  }
  window.addEventListener('keydown', onKey, true)
}

$('hk-toggle').addEventListener('click', () => capture('hk-toggle', 'toggle'))
$('load').addEventListener('click', () => void invoke('pick_rotation'))

// Keep in sync when the backend updates config (e.g. after loading a rotation).
void listen<Config>('config-changed', (e) => {
  config = e.payload
  render()
})

void invoke<Config>('get_config').then((c) => {
  config = c
  render()
})
