# skill-overlay-editor

Web editor for authoring **Lost Ark skill-rotation flowcharts** and exporting them for a
game overlay. Phase 1 of the Lost Ark rotation-overlay project — see the plan in
`../../.claude/plans/` for the full design.

## What it does

- Drag class skills onto a **WYSIWYG canvas** (the canvas represents the game screen).
- Draw arrows to the **possible next skill(s)** — rotations branch, with optional
  per-branch **condition** labels and **priority** ordering.
- Assign each skill its in-game **keybind** and an individual **icon scale**.
- **Export** a compact JSON the overlay consumes (positions normalized `0..1`,
  resolution-independent; icons resolved by class + skill id).

The overlay (a later phase) is an external, EAC-safe window that follows your
**keystrokes** — it never reads game memory or injects.

## Stack

TypeScript · Vite · React · [React Flow](https://reactflow.dev) (`@xyflow/react`) ·
Zustand + zundo (undo/redo) · Zod (schema/validation) · IndexedDB (`idb`) · Tailwind v4.

## Skill data

Icons and names come from the sibling **`lost-ark-media`** repo. `scripts/copy-media.mjs`
copies its `skills/` tree into `public/media/skills` on `predev`/`prebuild`. Point it
elsewhere with `LOST_ARK_MEDIA_DIR`.

## Develop

```sh
npm install
npm run dev        # runs copy-media, then Vite
npm test           # Vitest (schema round-trip + validation)
npm run build      # typecheck + production build
```
