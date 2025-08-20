import { AdminDashboard } from '@/components/AdminDashboard'

export function AdminDashboardPage() {
  return <AdminDashboard />
}

export function AdminUsersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Управление пользователями</h1>
      <div className="card p-8 text-center">
        <p className="text-gray-600">Функционал управления пользователями в разработке...</p>
      </div>
    </div>
  )
}

export function AdminProgramsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Управление программами</h1>
      <div className="card p-8 text-center">
        <p className="text-gray-600">Функционал управления программами в разработке...</p>
      </div>
    </div>
  )
}

export function AdminApplicationsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Управление заявками</h1>
      <div className="card p-8 text-center">
        <p className="text-gray-600">Функционал управления заявками в разработке...</p>
      </div>
    </div>
  )
}
