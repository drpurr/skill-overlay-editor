// Local-first persistence: every build is stored in IndexedDB keyed by id. The editor
// autosaves the active build here; the build switcher lists what's stored.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { rotationBuildSchema, type RotationBuild } from '../schema/rotation'

interface EditorDB extends DBSchema {
  builds: {
    key: string
    value: RotationBuild
    indexes: { updatedAt: string }
  }
}

const DB_NAME = 'skill-overlay-editor'
const STORE = 'builds'

let dbPromise: Promise<IDBPDatabase<EditorDB>> | null = null
function db() {
  if (!dbPromise) {
    dbPromise = openDB<EditorDB>(DB_NAME, 1, {
      upgrade(database) {
        const store = database.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
      },
    })
  }
  return dbPromise
}

export interface BuildSummary {
  id: string
  name: string
  class: string
  updatedAt: string
}

export async function saveBuild(build: RotationBuild): Promise<void> {
  await (await db()).put(STORE, build)
}

export async function getBuild(id: string): Promise<RotationBuild | null> {
  const raw = await (await db()).get(STORE, id)
  if (!raw) return null
  // Defensive: tolerate older/partial records rather than crashing the app.
  const parsed = rotationBuildSchema.safeParse(raw)
  return parsed.success ? parsed.data : null
}

export async function deleteBuild(id: string): Promise<void> {
  await (await db()).delete(STORE, id)
}

/** All builds, most-recently-updated first. */
export async function listBuilds(): Promise<BuildSummary[]> {
  const all = await (await db()).getAll(STORE)
  return all
    .map((b) => ({ id: b.id, name: b.name, class: b.class, updatedAt: b.updatedAt }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
