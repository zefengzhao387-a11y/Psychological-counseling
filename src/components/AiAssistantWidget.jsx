import { lazy, Suspense, useState } from 'react'
import AiChatDrawer from './AiChatDrawer'
import './AiAssistantWidget.css'

const OrbitalSphere = lazy(() => import('./OrbitalSphere'))

export default function AiAssistantWidget() {
  const [chatOpen, setChatOpen] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)

  return (
    <>
      {!chatOpen && (
        <div className={`ai-assistant-widget${sceneReady ? ' ai-assistant-widget--ready' : ''}`}>
          <div className="ai-assistant-widget__viewport">
            {!sceneReady && <div className="ai-assistant-widget__loading">加载中…</div>}
            <Suspense fallback={null}>
              <OrbitalSphere
                onReady={() => setSceneReady(true)}
                onClick={() => setChatOpen(true)}
              />
            </Suspense>
          </div>
        </div>
      )}

      <AiChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  )
}
