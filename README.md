# skill-overlay

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Tauri](https://img.shields.io/badge/tauri-%2324C8DB.svg?style=for-the-badge&logo=tauri&logoColor=%23FFFFFF)
![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)
[![License](https://img.shields.io/github/license/drpurr/skill-overlay-editor?style=for-the-badge)](LICENSE)

A Lost Ark skill-rotation toolkit: design your rotation as a flowchart in the **editor**,
then run it as an in-game **overlay** that follows your keystrokes.

## Monorepo layout

```
packages/schema     @skill-overlay/schema — shared Zod export schema + types + keybind format
apps/editor         Vite + React flowchart editor (Phase 1)
apps/overlay        Tauri overlay that consumes the editor's export (Phase 2)
vendor/lost-ark-media   git submodule — skill icons/ids/titles for all 29 classes
```

The overlay is **EAC-safe**: an external transparent always-on-top window over
borderless-windowed Lost Ark. It only *listens* to your keyboard (passive low-level hook) —
it never reads game memory or injects.

## Develop

```sh
git clone --recurse-submodules https://github.com/drpurr/skill-overlay-editor
cd skill-overlay-editor
# already cloned? run: git submodule update --init

npm install              # installs all workspaces
npm run dev:editor       # the editor (http://localhost:5173)
npm test                 # all workspace tests
```

See [apps/editor/README.md](apps/editor/README.md) for editor details.
