import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext, AuthProvider } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ProgramsPage from '@/pages/ProgramsPage'
import ProgramDetailPage from '@/pages/ProgramDetailPage'
import DashboardPage from '@/pages/DashboardPage'
import ProfilePage from '@/pages/ProfilePage'
import ApplicationsPage from '@/pages/ApplicationsPage'
import RecommendationsPage from '@/pages/RecommendationsPage'
import GrantsPage from '@/pages/GrantsPage'
import SubsidiesPage from '@/pages/SubsidiesPage'
import HowToApplyPage from '@/pages/HowToApplyPage'
import InstructionsPage from '@/pages/InstructionsPage'
import AdminMethodologyPage from '@/pages/AdminMethodologyPage'
import { AdminDashboardPage, AdminUsersPage, AdminProgramsPage, AdminApplicationsPage } from '@/pages/AdminPages'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuthContext()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }
  
  // Временно разрешаем доступ для тестирования
  // TODO: Восстановить проверку роли после настройки аутентификации
  // if (!user || !['admin', 'manager'].includes(user.role)) {
  //   return <Navigate to="/dashboard" replace />
  // }
  
  return <>{children}</>
}

function InstructionsProgramRoute() {
  // Thin wrapper to render the instructions component under route
  return <InstructionsPage />
}

function HomeRoute() {
  const { isAuthenticated, loading, user } = useAuthContext()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }
  
  if (isAuthenticated) {
    // Redirect admins to admin panel, regular users to programs
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/programs" replace />
  }
  
  return <HomePage />
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/programs/:id" element={<ProgramDetailPage />} />
        <Route path="/programs/:programId/instructions" element={<InstructionsProgramRoute />} />
        <Route path="/grants" element={<GrantsPage />} />
        <Route path="/subsidies" element={<SubsidiesPage />} />
        <Route path="/how-to-apply" element={<HowToApplyPage />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/applications" element={
          <ProtectedRoute>
            <ApplicationsPage />
          </ProtectedRoute>
        } />
        <Route path="/recommendations" element={
          <ProtectedRoute>
            <RecommendationsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin/methodology" element={
          <ProtectedRoute>
            <AdminMethodologyPage />
          </ProtectedRoute>
        } />
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        } />
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboardPage />
          </AdminRoute>
        } />
        <Route path="/admin/users" element={
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        } />
        <Route path="/admin/programs" element={
          <AdminRoute>
            <AdminProgramsPage />
          </AdminRoute>
        } />
        <Route path="/admin/applications" element={
          <AdminRoute>
            <AdminApplicationsPage />
          </AdminRoute>
        } />
        <Route path="/admin/programs/new" element={
          <AdminRoute>
            <AdminProgramsPage />
          </AdminRoute>
        } />
      </Routes>
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
