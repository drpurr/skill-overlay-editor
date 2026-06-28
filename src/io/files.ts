// Minimal, broadly-compatible file save/open via download + hidden <input>.
// (No File System Access API permission prompts; works in every browser.)

/** Turn a build name into a safe file slug. */
export function slugify(name: string): string {
  return (
    name
      .trim()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'rotation'
  )
}

/** Download `data` as pretty-printed JSON. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Prompt the user to pick a .json file; resolves parsed JSON, or null if cancelled. */
export function openJsonFile(): Promise<unknown | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json,.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      try {
        resolve(JSON.parse(await file.text()))
      } catch (e) {
        reject(new Error(`Not valid JSON: ${(e as Error).message}`))
      }
    }
    input.click()
  })
}
