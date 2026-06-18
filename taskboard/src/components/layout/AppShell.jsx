import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import ActivityFeed from '../activity/ActivityFeed'

export default function AppShell({ title, subtitle, workspaceId, showActivity = false, children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activityOpen, setActivityOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenMobileMenu={() => setMobileNavOpen(true)}
          title={title}
          subtitle={subtitle}
          onToggleActivity={showActivity ? () => setActivityOpen((o) => !o) : null}
          activityOpen={activityOpen}
        />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
          {showActivity && <ActivityFeed workspaceId={workspaceId} open={activityOpen} onClose={() => setActivityOpen(false)} />}
        </div>
      </div>
    </div>
  )
}
