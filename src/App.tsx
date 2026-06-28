import { ReactFlowProvider } from '@xyflow/react'
import RotationCanvas from './canvas/RotationCanvas'
import { TopBar } from './toolbar/TopBar'
import { ToolBar } from './toolbar/ToolBar'
import { Inspector } from './inspector/Inspector'
import { SkillLibraryPanel } from './library/SkillLibraryPanel'
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
          <main className="relative min-w-0 flex-1">
            <RotationCanvas />
          </main>
          <aside className="w-72 shrink-0 border-l border-black/50">
            <Inspector />
          </aside>
        </div>

        <div className="h-44 shrink-0 border-t border-black/50">
          <SkillLibraryPanel />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
