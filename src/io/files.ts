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

    let settled = false
    const cleanup = () => {
      input.removeEventListener('change', onChange)
      input.removeEventListener('cancel', onCancel)
      window.removeEventListener('focus', onFocus)
    }
    const finish = (run: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      run()
    }

    const onChange = async () => {
      const file = input.files?.[0]
      if (!file) return finish(() => resolve(null))
      try {
        const text = await file.text()
        finish(() => resolve(JSON.parse(text)))
      } catch (e) {
        finish(() => reject(new Error(`Not valid JSON: ${(e as Error).message}`)))
      }
    }
    const onCancel = () => finish(() => resolve(null))
    // Fallback for browsers that don't fire `cancel`: when focus returns with no file picked.
    const onFocus = () => {
      setTimeout(() => {
        if (!input.files?.length) finish(() => resolve(null))
      }, 300)
    }

    input.addEventListener('change', onChange)
    input.addEventListener('cancel', onCancel)
    window.addEventListener('focus', onFocus)
    input.click()
  })
}
