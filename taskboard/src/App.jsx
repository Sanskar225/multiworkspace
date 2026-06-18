import { Navigate, Route, Routes } from 'react-router-dom'
import { WorkspaceProvider } from './context/WorkspaceContext'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import SessionExpiredPage from './pages/SessionExpiredPage'
import WorkspacesPage from './pages/WorkspacesPage'
import BoardsListPage from './pages/BoardsListPage'
import BoardPage from './pages/BoardPage'
import PublicBoardPage from './pages/PublicBoardPage'
import NotFoundPage from './pages/NotFoundPage'

function HomeRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/workspaces' : '/login'} replace />
}

export default function App() {
  return (
    <WorkspaceProvider>
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
    </WorkspaceProvider>
  )
}
