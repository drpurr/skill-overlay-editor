import { useEffect, useRef } from 'react'
import { useEditorStore } from '../state/editorStore'
import { CloseIcon } from '../toolbar/icons'

export function SettingsModal() {
  const open = useEditorStore((s) => s.settingsOpen)
  const setOpen = useEditorStore((s) => s.setSettingsOpen)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus() // move focus into the dialog on open
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-lg bg-[var(--color-panel)] shadow-2xl outline-none ring-1 ring-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black/40 px-4 py-3">
          <h2
            id="settings-title"
            className="text-sm font-semibold uppercase tracking-wider text-white/70"
          >
            Settings
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close settings"
            className="grid h-7 w-7 place-items-center rounded text-white/60 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4 text-sm">
          <Section title="General">
            <Row label="Default class for new builds">
              <Placeholder>Berserker</Placeholder>
            </Row>
            <Row label="Default resolution">
              <Placeholder>1920 × 1080</Placeholder>
            </Row>
          </Section>

          <Section title="Overlay" badge="Phase 2">
            <Row label="Toggle-overlay hotkey">
              <Placeholder>Not set</Placeholder>
            </Row>
            <Row label="Overlay opacity">
              <Placeholder>100%</Placeholder>
            </Row>
            <Row label="Dim skills on cooldown">
              <Placeholder>Off</Placeholder>
            </Row>
          </Section>

          <Section title="Appearance">
            <Row label="Theme">
              <Placeholder>Dark</Placeholder>
            </Row>
            <Row label="Grid spacing">
              <Placeholder>24 px</Placeholder>
            </Row>
          </Section>

          <Section title="Data">
            <Row label="Local builds">
              <Placeholder>Manage…</Placeholder>
            </Row>
          </Section>

          <p className="border-t border-black/40 pt-4 text-xs text-white/40">
            Skill Flowchart Editor · Phase 1. These controls are placeholders — wire-up
            lands alongside the overlay app.
          </p>
        </div>
      </div>
    </div>
  )
}

function Section({
  title,
  badge,
  children,
}: {
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-2)]">
          {title}
        </h3>
        {badge && (
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/70">{label}</span>
      {children}
    </div>
  )
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="cursor-not-allowed rounded bg-[var(--color-panel-2)] px-2 py-1 text-xs text-white/40 ring-1 ring-black/40">
      {children}
    </span>
  )
}
