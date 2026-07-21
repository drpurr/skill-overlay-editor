import { ReactFlowProvider } from '@xyflow/react'
import RotationCanvas from './canvas/RotationCanvas'
import { TopBar } from './toolbar/TopBar'
import { ToolBar } from './toolbar/ToolBar'
import { Inspector } from './inspector/Inspector'
import { SkillLibraryPanel } from './library/SkillLibraryPanel'
import { SettingsModal } from './settings/SettingsModal'
import { useAutosave, useInitialBuild } from './state/usePersistence'

export default function App() {
  useInitialBuild()
  useAutosave()

  return (
    <ReactFlowProvider>
      <div className="flex h-full w-full flex-col">
        <TopBar />
        <ToolBar />

        <div className="flex min-h-0 flex-1">
          <aside className="w-96 shrink-0 border-r border-black/50">
            <SkillLibraryPanel />
          </aside>
          <main className="relative min-w-0 flex-1">
            <RotationCanvas />
          </main>
          <aside className="w-72 shrink-0 border-l border-black/50">
            <Inspector />
          </aside>
        </div>
      </div>

      <SettingsModal />
    </ReactFlowProvider>
  )
}
