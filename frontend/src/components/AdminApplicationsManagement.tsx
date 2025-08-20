import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Building
} from 'lucide-react'
import { getAllAdminApplications, updateApplicationStatus, getApplicationDetails } from '@/services/api'
import toast from 'react-hot-toast'

interface Application {
  id: number
  user_id: number
  program_id: number
  status: 'pending' | 'approved' | 'rejected' | 'under_review'
  business_plan_summary: string
  funding_request: string
  expected_roi: string
  submitted_at: string
  reviewed_at?: string
  user_name: string
  user_email: string
  program_name: string
}

interface ApplicationsResponse {
  applications: Application[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
  }
}

interface ApplicationDetails extends Application {
  business_type: string
  business_size: string
  industry: string
  region: string
  current_revenue: string
  employees_count: string
  business_plan_summary: string
  funding_request: string
  expected_roi: string
  timeline: string
}

export function AdminApplicationsManagement() {
  const [searchParams] = useSearchParams()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<ApplicationsResponse['pagination'] | null>(null)
  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<{[key: number]: boolean}>({})

  const loadApplications = async (page = 1, searchQuery = search, status = statusFilter) => {
    try {
      setLoading(true)
      const params: any = { page, limit: 20 }
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (status) params.status = status

      const response = await getAllAdminApplications(params)
      setApplications(response.data.applications)
      setPagination(response.data.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to load applications')
      console.error('Error loading applications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications(1, search, statusFilter)
    setCurrentPage(1)
  }, [search, statusFilter])

  const handleStatusChange = async (applicationId: number, newStatus: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [applicationId]: true }))
      await updateApplicationStatus(applicationId, newStatus)
      
      // Update local state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus as any } : app
      ))
      
      toast.success('Статус заявки обновлен!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update application status')
      console.error('Error updating application status:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [applicationId]: false }))
    }
  }

  const handleViewDetails = async (applicationId: number) => {
    try {
      setDetailsLoading(true)
      const response = await getApplicationDetails(applicationId)
      setSelectedApplication(response.data)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load application details')
      console.error('Error loading application details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'under_review':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'В ожидании'
      case 'under_review':
        return 'На рассмотрении'
      case 'approved':
        return 'Одобрена'
      case 'rejected':
        return 'Отклонена'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'under_review':
        return <AlertCircle className="w-4 h-4" />
      case 'approved':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <XCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  if (loading && applications.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">Загружаем заявки...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => loadApplications()} className="btn-primary">
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Управление заявками</h1>
        <p className="text-gray-600">Просмотр и обработка заявок на участие в программах</p>
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Детали заявки #{selectedApplication.id}
                </h2>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Application Info */}
                <div className="space-y-4">
                  <div className="card p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Информация о заявителе
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Имя:</span> {selectedApplication.user_name}</p>
                      <p><span className="font-medium">Email:</span> {selectedApplication.user_email}</p>
                      <p><span className="font-medium">Тип бизнеса:</span> {selectedApplication.business_type}</p>
                      <p><span className="font-medium">Размер бизнеса:</span> {selectedApplication.business_size}</p>
                      <p><span className="font-medium">Отрасль:</span> {selectedApplication.industry}</p>
                      <p><span className="font-medium">Регион:</span> {selectedApplication.region}</p>
                    </div>
                  </div>

                  <div className="card p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      Бизнес-показатели
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Текущая выручка:</span> {selectedApplication.current_revenue}</p>
                      <p><span className="font-medium">Количество сотрудников:</span> {selectedApplication.employees_count}</p>
                      <p><span className="font-medium">Запрашиваемое финансирование:</span> {selectedApplication.funding_request}</p>
                      <p><span className="font-medium">Ожидаемая ROI:</span> {selectedApplication.expected_roi}</p>
                    </div>
                  </div>
                </div>

                {/* Application Details */}
                <div className="space-y-4">
                  <div className="card p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Программа: {selectedApplication.program_name}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      {getStatusIcon(selectedApplication.status)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedApplication.status)}`}>
                        {getStatusText(selectedApplication.status)}
                      </span>
                    </div>
                  </div>

                  <div className="card p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Краткое описание бизнес-плана
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedApplication.business_plan_summary}
                    </p>
                  </div>

                  <div className="card p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Временные рамки реализации
                    </h3>
                    <p className="text-gray-700">
                      {selectedApplication.timeline}
                    </p>
                  </div>

                  <div className="card p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Даты
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">Подана:</span> {new Date(selectedApplication.submitted_at).toLocaleDateString('ru-RU')}</p>
                      {selectedApplication.reviewed_at && (
                        <p><span className="font-medium">Рассмотрена:</span> {new Date(selectedApplication.reviewed_at).toLocaleDateString('ru-RU')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Change Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleStatusChange(selectedApplication.id, 'under_review')}
                  disabled={selectedApplication.status === 'under_review' || actionLoading[selectedApplication.id]}
                  className="btn-secondary disabled:opacity-50"
                >
                  На рассмотрение
                </button>
                <button
                  onClick={() => handleStatusChange(selectedApplication.id, 'approved')}
                  disabled={selectedApplication.status === 'approved' || actionLoading[selectedApplication.id]}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  Одобрить
                </button>
                <button
                  onClick={() => handleStatusChange(selectedApplication.id, 'rejected')}
                  disabled={selectedApplication.status === 'rejected' || actionLoading[selectedApplication.id]}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                >
                  Отклонить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по заявителю или программе..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field pl-10 pr-8"
              >
                <option value="">Все статусы</option>
                <option value="pending">В ожидании</option>
                <option value="under_review">На рассмотрении</option>
                <option value="approved">Одобренные</option>
                <option value="rejected">Отклоненные</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Заявки на участие
              {pagination && ` (${pagination.total})`}
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заявитель
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Программа
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Запрашиваемое финансирование
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата подачи
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {application.user_name}
                      </div>
                      <div className="text-sm text-gray-500">{application.user_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {application.program_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={application.status}
                      onChange={(e) => handleStatusChange(application.id, e.target.value)}
                      disabled={actionLoading[application.id]}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${getStatusBadge(application.status)} ${
                        actionLoading[application.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
                      }`}
                    >
                      <option value="pending">В ожидании</option>
                      <option value="under_review">На рассмотрении</option>
                      <option value="approved">Одобрена</option>
                      <option value="rejected">Отклонена</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {application.funding_request}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(application.submitted_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(application.id)}
                      disabled={detailsLoading}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      title="Просмотреть детали"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {applications.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Заявки не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || statusFilter ? 'Попробуйте изменить критерии поиска' : 'Заявки еще не поданы'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Показано {((currentPage - 1) * pagination.per_page) + 1} - {Math.min(currentPage * pagination.per_page, pagination.total)} из {pagination.total} заявок
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newPage = currentPage - 1
                    setCurrentPage(newPage)
                    loadApplications(newPage, search, statusFilter)
                  }}
                  disabled={currentPage === 1 || loading}
                  className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                  {currentPage} / {pagination.total_pages}
                </span>
                
                <button
                  onClick={() => {
                    const newPage = currentPage + 1
                    setCurrentPage(newPage)
                    loadApplications(newPage, search, statusFilter)
                  }}
                  disabled={currentPage === pagination.total_pages || loading}
                  className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
