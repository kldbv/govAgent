import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Target, 
  Plus, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react'
import { 
  getAllAdminPrograms, 
  createProgram, 
  updateProgram, 
  updateProgramStatus,
  deleteProgram 
} from '@/services/api'
import toast from 'react-hot-toast'

interface Program {
  id: number
  name: string
  description: string
  status: 'active' | 'inactive' | 'draft'
  eligibility_criteria: string
  funding_amount: string
  application_deadline: string
  created_at: string
  updated_at: string
}

interface ProgramsResponse {
  programs: Program[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
  }
}

interface ProgramForm {
  name: string
  description: string
  eligibility_criteria: string
  funding_amount: string
  application_deadline: string
}

export function AdminProgramsManagement() {
  const location = useLocation()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<ProgramsResponse['pagination'] | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(location.pathname.includes('/new'))
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [actionLoading, setActionLoading] = useState<{[key: number | string]: boolean}>({})

  const [formData, setFormData] = useState<ProgramForm>({
    name: '',
    description: '',
    eligibility_criteria: '',
    funding_amount: '',
    application_deadline: ''
  })

  const loadPrograms = async (page = 1, searchQuery = search, status = statusFilter) => {
    try {
      setLoading(true)
      const params: any = { page, limit: 20 }
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (status) params.status = status

      const response = await getAllAdminPrograms(params)
      setPrograms(response.data.programs)
      setPagination(response.data.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to load programs')
      console.error('Error loading programs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPrograms(1, search, statusFilter)
    setCurrentPage(1)
  }, [search, statusFilter])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      eligibility_criteria: '',
      funding_amount: '',
      application_deadline: ''
    })
    setEditingProgram(null)
    setShowCreateForm(false)
  }

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActionLoading(prev => ({ ...prev, create: true }))
      await createProgram(formData)
      toast.success('Программа создана!')
      resetForm()
      loadPrograms(currentPage, search, statusFilter)
    } catch (err: any) {
      toast.error(err.message || 'Failed to create program')
      console.error('Error creating program:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, create: false }))
    }
  }

  const handleUpdateProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProgram) return

    try {
      setActionLoading(prev => ({ ...prev, [editingProgram.id]: true }))
      await updateProgram(editingProgram.id, formData)
      toast.success('Программа обновлена!')
      resetForm()
      loadPrograms(currentPage, search, statusFilter)
    } catch (err: any) {
      toast.error(err.message || 'Failed to update program')
      console.error('Error updating program:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [editingProgram.id]: false }))
    }
  }

  const handleStatusChange = async (programId: number, newStatus: string) => {
    try {
      setActionLoading(prev => ({ ...prev, [programId]: true }))
      await updateProgramStatus(programId, newStatus)
      
      // Update local state
      setPrograms(programs.map(program => 
        program.id === programId ? { ...program, status: newStatus as any } : program
      ))
      
      toast.success('Статус программы обновлен!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update program status')
      console.error('Error updating program status:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [programId]: false }))
    }
  }

  const handleDeleteProgram = async (programId: number) => {
    if (!confirm('Вы уверены, что хотите удалить эту программу?')) return

    try {
      setActionLoading(prev => ({ ...prev, [programId]: true }))
      await deleteProgram(programId)
      setPrograms(programs.filter(program => program.id !== programId))
      toast.success('Программа удалена!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete program')
      console.error('Error deleting program:', err)
    } finally {
      setActionLoading(prev => ({ ...prev, [programId]: false }))
    }
  }

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program)
    setFormData({
      name: program.name,
      description: program.description,
      eligibility_criteria: program.eligibility_criteria,
      funding_amount: program.funding_amount,
      application_deadline: program.application_deadline
    })
    setShowCreateForm(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }


  if (loading && programs.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">Загружаем программы...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => loadPrograms()} className="btn-primary">
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Управление программами</h1>
            <p className="text-gray-600">Создание и редактирование программ поддержки бизнеса</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Создать программу
          </button>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProgram ? 'Редактировать программу' : 'Создать новую программу'}
              </h2>
            </div>
            
            <form onSubmit={editingProgram ? handleUpdateProgram : handleCreateProgram} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название программы
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-field w-full"
                    placeholder="Введите название программы"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input-field w-full"
                    placeholder="Опишите программу поддержки"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Критерии участия
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.eligibility_criteria}
                    onChange={(e) => setFormData({...formData, eligibility_criteria: e.target.value})}
                    className="input-field w-full"
                    placeholder="Укажите критерии для участия в программе"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Размер финансирования
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.funding_amount}
                    onChange={(e) => setFormData({...formData, funding_amount: e.target.value})}
                    className="input-field w-full"
                    placeholder="Например: до 2 000 000 тенге"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дедлайн подачи заявок
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.application_deadline}
                    onChange={(e) => setFormData({...formData, application_deadline: e.target.value})}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={actionLoading.create || (editingProgram ? actionLoading[editingProgram.id] || false : false)}
                  className="btn-primary"
                >
                  {actionLoading.create || (editingProgram && actionLoading[editingProgram.id])
                    ? 'Сохранение...'
                    : editingProgram 
                      ? 'Обновить программу' 
                      : 'Создать программу'
                  }
                </button>
              </div>
            </form>
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
              placeholder="Поиск программ..."
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
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
                <option value="draft">Черновики</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Программы поддержки
              {pagination && ` (${pagination.total})`}
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Программа
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Финансирование
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дедлайн
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {programs.map((program) => (
                <tr key={program.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {program.name}
                      </div>
                      <div className="text-sm text-gray-500 max-w-md truncate">
                        {program.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={program.status}
                      onChange={(e) => handleStatusChange(program.id, e.target.value)}
                      disabled={actionLoading[program.id]}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${getStatusBadge(program.status)} ${
                        actionLoading[program.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
                      }`}
                    >
                      <option value="draft">Черновик</option>
                      <option value="active">Активна</option>
                      <option value="inactive">Неактивна</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {program.funding_amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(program.application_deadline).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditProgram(program)}
                        disabled={actionLoading[program.id]}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        title="Редактировать"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProgram(program.id)}
                        disabled={actionLoading[program.id]}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {programs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Программы не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || statusFilter ? 'Попробуйте изменить критерии поиска' : 'Создайте первую программу поддержки'}
            </p>
            {!search && !statusFilter && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary mt-4"
              >
                Создать программу
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Показано {((currentPage - 1) * pagination.per_page) + 1} - {Math.min(currentPage * pagination.per_page, pagination.total)} из {pagination.total} программ
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newPage = currentPage - 1
                    setCurrentPage(newPage)
                    loadPrograms(newPage, search, statusFilter)
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
                    loadPrograms(newPage, search, statusFilter)
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
