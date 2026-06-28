// Shared drag-and-drop contract between the skill library (drag source) and the
// canvas (drop target).
import type { Skill } from '../media/skills'

export const SKILL_DND_MIME = 'application/x-lostark-skill'

export interface SkillDragPayload {
  skill: Skill
  classKey: string
}
