import { useEffect, useMemo, useState } from 'react'
import {
  classKey,
  iconUrl,
  loadClassSkills,
  loadIndex,
  type ClassInfo,
  type Skill,
} from '../media/skills'
import { useEditorStore } from '../state/editorStore'
import { SKILL_DND_MIME, type SkillDragPayload } from './dnd'

export function SkillLibraryPanel() {
  const cls = useEditorStore((s) => s.build.class)
  const setClass = useEditorStore((s) => s.setClass)
  const addSkillNode = useEditorStore((s) => s.addSkillNode)
  const hasNodes = useEditorStore((s) => s.build.nodes.length > 0)

  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadIndex()
      .then((list) => setClasses([...list].sort((a, b) => a.name.localeCompare(b.name))))
      .catch((e) => setError(String(e)))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadClassSkills(cls)
      .then((list) => !cancelled && setSkills(list))
      .catch((e) => !cancelled && setError(String(e)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [cls])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? skills.filter((s) => s.title.toLowerCase().includes(q)) : skills
  }, [skills, query])

  const onDragStart = (e: React.DragEvent, skill: Skill) => {
    const payload: SkillDragPayload = { skill, classKey: cls }
    e.dataTransfer.setData(SKILL_DND_MIME, JSON.stringify(payload))
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <div className="flex h-full flex-col bg-[var(--color-panel)]">
      <div className="flex items-center gap-2 border-b border-black/40 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Skill Library
        </span>
        <select
          value={cls}
          onChange={(e) => setClass(e.target.value)}
          disabled={hasNodes}
          title={hasNodes ? 'Remove all skills to switch class' : 'Class for this build'}
          className="ml-auto rounded bg-[var(--color-panel-2)] px-2 py-1 text-xs text-white/90 outline-none ring-1 ring-black/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {classes.map((c) => (
            <option key={c.slug} value={classKey(c.name)}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="px-3 py-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search skill…"
          className="w-full rounded bg-[var(--color-panel-2)] px-2 py-1.5 text-sm text-white/90 outline-none ring-1 ring-black/40 placeholder:text-white/30"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {error && <p className="px-2 text-sm text-red-400">{error}</p>}
        {loading && <p className="px-2 text-sm text-white/40">Loading…</p>}
        {!loading && !error && (
          <div className="grid grid-cols-5 gap-2">
            {filtered.map((skill) => (
              <button
                key={skill.id}
                type="button"
                draggable
                onDragStart={(e) => onDragStart(e, skill)}
                onDoubleClick={() => addSkillNode(skill, cls, 0.5, 0.5)}
                title={`${skill.title} — drag onto canvas (or double-click to add)`}
                className="group flex cursor-grab flex-col items-center gap-1 rounded p-1 hover:bg-white/5 active:cursor-grabbing"
              >
                <img
                  src={iconUrl(cls, skill.icon)}
                  alt={skill.title}
                  draggable={false}
                  className="h-12 w-12 rounded ring-1 ring-black/60 group-hover:ring-[var(--color-accent-2)]"
                />
                <span className="line-clamp-2 text-center text-[10px] leading-tight text-white/60">
                  {skill.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
