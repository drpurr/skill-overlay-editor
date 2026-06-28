# skill-overlay-editor

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
[![License](https://img.shields.io/github/license/drpurr/skill-overlay-editor?style=for-the-badge)](LICENSE)

Web editor for authoring **Lost Ark skill-rotation flowcharts** and exporting them for a
game overlay.

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

Icons and names come from the **[lost-ark-media](https://github.com/drpurr/lost-ark-media)**
repo. `scripts/copy-media.mjs` copies its `skills/` tree into `public/media/skills` on
`predev`/`prebuild`. By default it looks for the repo at `../lib/lost-ark-media`; point it
elsewhere with the `LOST_ARK_MEDIA_DIR` environment variable.

## Develop

```sh
npm install
npm run dev        # runs copy-media, then Vite
npm test           # Vitest (schema round-trip + validation)
npm run build      # typecheck + production build
```
