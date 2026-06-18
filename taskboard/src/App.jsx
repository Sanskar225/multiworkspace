import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { WorkspaceProvider } from './context/WorkspaceContext'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Spinner from './components/common/Spinner'

// Route-level code splitting: each page becomes its own chunk, so the heavy
// dependencies only one or two pages need - three.js/vanta on LoginPage,
// @hello-pangea/dnd on BoardPage - aren't downloaded by someone who only
// ever visits a public board link. This is what brought the single
// 1MB+ bundle down to several small, route-scoped ones (see
// ENGINEERING_NOTES.md, "Performance").
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SessionExpiredPage = lazy(() => import('./pages/SessionExpiredPage'))
const WorkspacesPage = lazy(() => import('./pages/WorkspacesPage'))
const BoardsListPage = lazy(() => import('./pages/BoardsListPage'))
const BoardPage = lazy(() => import('./pages/BoardPage'))
const PublicBoardPage = lazy(() => import('./pages/PublicBoardPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function HomeRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/workspaces' : '/login'} replace />
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <Spinner label="" />
    </div>
  )
}

export default function App() {
  return (
    <WorkspaceProvider>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Public, unauthenticated routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/session-expired" element={<SessionExpiredPage />} />
          <Route path="/public/board/:boardId" element={<PublicBoardPage />} />

          {/* Authenticated routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/workspaces" element={<WorkspacesPage />} />
            <Route path="/workspace/:workspaceId/boards" element={<BoardsListPage />} />
            <Route path="/workspace/:workspaceId/board/:boardId" element={<BoardPage />} />
          </Route>

          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </WorkspaceProvider>
  )
}
