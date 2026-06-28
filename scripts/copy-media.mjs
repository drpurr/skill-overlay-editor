// Copies the lost-ark-media `skills/` tree (index.json, per-class skills.json, and
// icon WebPs) into public/media/skills so Vite can serve them as static assets.
//
// Source resolution order (first one that actually contains skills/index.json wins):
//   1. $LOST_ARK_MEDIA_DIR        — explicit override (repo root)
//   2. vendor/lost-ark-media       — the bundled git submodule (default; clone-and-run)
//   3. ../lib/lost-ark-media       — sibling repo (legacy dev layout)
//
// Idempotent: re-copies on every run (files are tiny). Safe to wire to predev/prebuild.
import { cp, mkdir, rm, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(here, '..')

async function hasMedia(dir) {
  try {
    await stat(resolve(dir, 'skills', 'index.json'))
    return true
  } catch {
    return false
  }
}

const candidates = [
  process.env.LOST_ARK_MEDIA_DIR && resolve(process.env.LOST_ARK_MEDIA_DIR),
  resolve(projectRoot, 'vendor', 'lost-ark-media'),
  resolve(projectRoot, '..', 'lib', 'lost-ark-media'),
].filter(Boolean)

let mediaRoot = null
for (const dir of candidates) {
  if (await hasMedia(dir)) {
    mediaRoot = dir
    break
  }
}

if (!mediaRoot) {
  console.error(
    '[copy-media] Could not find skills/index.json in any of:\n' +
      candidates.map((c) => '  ' + c).join('\n') +
      '\nRun "git submodule update --init", or set LOST_ARK_MEDIA_DIR.',
  )
  process.exit(1)
}

const src = resolve(mediaRoot, 'skills')
const dest = resolve(projectRoot, 'public', 'media', 'skills')

await rm(dest, { recursive: true, force: true })
await mkdir(dirname(dest), { recursive: true })
await cp(src, dest, { recursive: true })

console.log(`[copy-media] copied\n  from ${src}\n  to   ${dest}`)
