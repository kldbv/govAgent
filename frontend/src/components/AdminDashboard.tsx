import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, FileText, Package, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { getAdminDashboardStats } from '@/services/api'

interface DashboardStats {
  overview: {
    total_users: number
    total_programs: number
    total_applications: number
    active_applications: number
    new_users_30d: number
  }
  applications_by_status: Array<{ status: string; count: number }>
  programs_by_type: Array<{ type: string; count: number }>
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        console.log('Loading admin dashboard stats...')
        const data = await getAdminDashboardStats()
        console.log('Admin dashboard stats response:', data)
        setStats(data)
      } catch (err: any) {
        setError(err.message || 'Failed to load statistics')
        console.error('Error loading dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'under_review':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Одобрено'
      case 'rejected':
        return 'Отклонено'
      case 'under_review':
        return 'На рассмотрении'
      case 'draft':
        return 'Черновики'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">Загружаем статистику...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Обновить страницу
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Панель администратора</h1>
        <p className="text-gray-600">Обзор системы и управление</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="card p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего пользователей</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.overview.total_users}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+{stats?.overview.new_users_30d} за 30 дней</span>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Активных программ</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.overview.total_programs}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/programs" className="text-sm text-purple-600 hover:text-purple-700">
              Управление программами →
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Всего заявок</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.overview.total_applications}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/applications" className="text-sm text-green-600 hover:text-green-700">
              Управление заявками →
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">На рассмотрении</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.overview.active_applications}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link 
              to="/admin/applications?status=under_review" 
              className="text-sm text-yellow-600 hover:text-yellow-700"
            >
              Просмотреть заявки →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Applications by Status */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Заявки по статусам</h3>
          <div className="space-y-4">
            {stats?.applications_by_status?.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center">
                  {getStatusIcon(item.status)}
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {getStatusText(item.status)}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Programs by Type */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Программы по типам</h3>
          <div className="space-y-4">
            {stats?.programs_by_type?.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {item.type}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Быстрые действия</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/admin/users" 
            className="card p-4 hover:shadow-lg transition-shadow group"
          >
            <Users className="w-6 h-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
              Управление пользователями
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Просмотр, редактирование ролей пользователей
            </p>
          </Link>

          <Link 
            to="/admin/programs/new" 
            className="card p-4 hover:shadow-lg transition-shadow group"
          >
            <Package className="w-6 h-6 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900 group-hover:text-purple-600">
              Создать программу
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Добавить новую программу поддержки
            </p>
          </Link>

          <Link 
            to="/admin/applications?status=under_review" 
            className="card p-4 hover:shadow-lg transition-shadow group"
          >
            <FileText className="w-6 h-6 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900 group-hover:text-green-600">
              Обработка заявок
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Рассмотреть поступившие заявки
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
