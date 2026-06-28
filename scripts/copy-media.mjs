// Copies the lost-ark-media `skills/` tree (index.json, per-class skills.json, and
// icon WebPs) into public/media/skills so Vite can serve them as static assets.
//
// Source resolution order:
//   1. $LOST_ARK_MEDIA_DIR (path to the lost-ark-media repo root), else
//   2. ../lib/lost-ark-media relative to this editor repo.
//
// Idempotent: re-copies on every run (files are tiny). Safe to wire to predev/prebuild.
import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '..')

const mediaRoot =
  process.env.LOST_ARK_MEDIA_DIR
    ? resolve(process.env.LOST_ARK_MEDIA_DIR)
    : resolve(projectRoot, '..', 'lib', 'lost-ark-media')

const src = resolve(mediaRoot, 'skills')
const dest = resolve(projectRoot, 'public', 'media', 'skills')

async function exists(p) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

if (!(await exists(resolve(src, 'index.json')))) {
  console.error(
    `[copy-media] Could not find skills/index.json under:\n  ${src}\n` +
      `Set LOST_ARK_MEDIA_DIR to the lost-ark-media repo root, or place it at ../lib/lost-ark-media.`,
  )
  process.exit(1)
}

await rm(dest, { recursive: true, force: true })
await mkdir(dirname(dest), { recursive: true })
await cp(src, dest, { recursive: true })

console.log(`[copy-media] copied\n  from ${src}\n  to   ${dest}`)
