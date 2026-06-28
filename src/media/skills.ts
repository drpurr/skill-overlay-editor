// Loads Lost Ark skill metadata + icons from the copied lost-ark-media tree under
// public/media/skills (see scripts/copy-media.mjs).

export interface ClassInfo {
  /** In-game class name, e.g. "Berserker". */
  name: string
  /** Codex internal slug (differs from the folder name), e.g. "warlord" for Gunlancer. */
  slug: string
  skillCount: number
}

export interface Skill {
  /** Lost Ark skill id. */
  id: number
  /** Skill name (English / `us` locale). */
  title: string
  /** Icon file name, resolved relative to the class's `icons/` folder. */
  icon: string
  /** Level the skill unlocks. */
  level: number
  /** Codex skill-type flag. */
  type: number
}

export const MEDIA_BASE = '/media/skills'

/**
 * Folder/identifier for a class = its lowercased in-game name
 * (e.g. "Berserker" -> "berserker", "Guardianknight" -> "guardianknight").
 * This is what `SkillNode.class` and the overlay export use to resolve icons.
 */
export function classKey(className: string): string {
  return className.toLowerCase()
}

let indexCache: Promise<ClassInfo[]> | null = null
const skillsCache = new Map<string, Promise<Skill[]>>()

/** Load the list of all classes (`skills/index.json`). Cached. */
export function loadIndex(): Promise<ClassInfo[]> {
  if (!indexCache) {
    indexCache = fetch(`${MEDIA_BASE}/index.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load class index (${r.status})`)
      return r.json() as Promise<ClassInfo[]>
    })
  }
  return indexCache
}

/** Load one class's skills (`skills/<key>/skills.json`), sorted by id. Cached per class. */
export function loadClassSkills(key: string): Promise<Skill[]> {
  let p = skillsCache.get(key)
  if (!p) {
    p = fetch(`${MEDIA_BASE}/${key}/skills.json`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load skills for "${key}" (${r.status})`)
      return r.json() as Promise<Skill[]>
    })
    skillsCache.set(key, p)
  }
  return p
}

/** Resolve a servable URL for a class icon, e.g. iconUrl("berserker", "bk_skill_01_6.webp"). */
export function iconUrl(key: string, icon: string): string {
  return `${MEDIA_BASE}/${key}/icons/${icon}`
}
