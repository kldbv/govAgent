import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthContext, AuthProvider } from '@/hooks/useAuth'
import { QueryProvider } from '@/providers/QueryProvider'
import Layout from '@/components/Layout'
import ScrollToTop from '@/components/ScrollToTop'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Eager load critical pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ProgramsPage from '@/pages/ProgramsPage'

// Lazy load less critical pages
const ProgramDetailPage = lazy(() => import('@/pages/ProgramDetailPage'))
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const ProfilePage = lazy(() => import('@/pages/ProfilePage'))
const ApplicationsPage = lazy(() => import('@/pages/ApplicationsPage'))
const RecommendationsPage = lazy(() => import('@/pages/RecommendationsPage'))
const GrantsPage = lazy(() => import('@/pages/GrantsPage'))
const SubsidiesPage = lazy(() => import('@/pages/SubsidiesPage'))
const HowToApplyPage = lazy(() => import('@/pages/HowToApplyPage'))
const InstructionsPage = lazy(() => import('@/pages/InstructionsPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const FAQPage = lazy(() => import('@/pages/FAQPage'))
const NewsPage = lazy(() => import('@/pages/NewsPage'))
const NewsDetailPage = lazy(() => import('@/pages/NewsDetailPage'))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/TermsPage'))
const AdminMethodologyPage = lazy(() => import('@/pages/AdminMethodologyPage'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="loading-spinner mx-auto mb-4"></div>
        <p className="text-gray-600">Загрузка...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuthContext()

  if (loading) {
    return <PageLoader />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuthContext()

  if (loading) {
    return <PageLoader />
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function ManagerRoute({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuthContext()

  if (loading) {
    return <PageLoader />
  }

  if (!user || user.role !== 'manager') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function HomeRoute() {
  const { isAuthenticated, loading, user } = useAuthContext()

  if (loading) {
    return <PageLoader />
  }

  if (isAuthenticated) {
    // Redirect by role
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />
    }
    if (user?.role === 'manager') {
      return <Navigate to="/manager" replace />
    }
    return <Navigate to="/programs" replace />
  }

  return <HomePage />
}

// Lazy-loaded Admin Components
const LazyAdminDashboard = lazy(() => import('@/pages/AdminPages').then(m => ({ default: m.AdminDashboardPage })))
const LazyAdminUsers = lazy(() => import('@/pages/AdminPages').then(m => ({ default: m.AdminUsersPage })))
const LazyAdminPrograms = lazy(() => import('@/pages/AdminPages').then(m => ({ default: m.AdminProgramsPage })))
const LazyAdminApplications = lazy(() => import('@/pages/AdminPages').then(m => ({ default: m.AdminApplicationsPage })))
const LazyManagerApplications = lazy(() => import('@/pages/ManagerPages').then(m => ({ default: m.ManagerApplicationsPage })))

function AppRoutes() {
  return (
    <Layout>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/programs" element={<ProgramsPage />} />
          <Route path="/programs/:id" element={<ProgramDetailPage />} />
          <Route path="/programs/:programId/instructions" element={<InstructionsPage />} />
          <Route path="/grants" element={<GrantsPage />} />
          <Route path="/subsidies" element={<SubsidiesPage />} />
          <Route path="/how-to-apply" element={<HowToApplyPage />} />
          <Route path="/instructions" element={<InstructionsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<NewsDetailPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />

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
              <LazyAdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <LazyAdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <LazyAdminUsers />
            </AdminRoute>
          } />
          <Route path="/admin/programs" element={
            <AdminRoute>
              <LazyAdminPrograms />
            </AdminRoute>
          } />
          <Route path="/admin/applications" element={
            <AdminRoute>
              <LazyAdminApplications />
            </AdminRoute>
          } />
          <Route path="/admin/programs/new" element={
            <AdminRoute>
              <LazyAdminPrograms />
            </AdminRoute>
          } />

          {/* Manager routes */}
          <Route path="/manager" element={
            <ManagerRoute>
              <LazyManagerApplications />
            </ManagerRoute>
          } />
          <Route path="/manager/applications" element={
            <ManagerRoute>
              <LazyManagerApplications />
            </ManagerRoute>
          } />
        </Routes>
      </Suspense>
    </Layout>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </QueryProvider>
    </ErrorBoundary>
  )
}

export default App
