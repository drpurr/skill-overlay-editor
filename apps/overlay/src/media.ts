// Icons are bundled into public/media/skills by scripts/copy-media.mjs (predev/prebuild),
// resolved by class + icon exactly like the editor.
export function iconUrl(classKey: string, icon: string): string {
  return `/media/skills/${classKey}/icons/${icon}`
}
