import { AdminDashboard } from '@/components/AdminDashboard'
import { AdminUsersManagement } from '@/components/AdminUsersManagement'
import { AdminProgramsManagement } from '@/components/AdminProgramsManagement'
import { AdminApplicationsManagement } from '@/components/AdminApplicationsManagement'

export function AdminDashboardPage() {
  return <AdminDashboard />
}

export function AdminUsersPage() {
  return <AdminUsersManagement />
}

export function AdminProgramsPage() {
  return <AdminProgramsManagement />
}

export function AdminApplicationsPage() {
  return <AdminApplicationsManagement />
}
