import { useState, useEffect } from 'react'
import { Search, Filter, Users, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react'
import { getAllUsers, updateUserRole } from '@/services/api'
import toast from 'react-hot-toast'

interface User {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'user'
  created_at: string
  business_type?: string
  business_size?: string
  industry?: string
  region?: string
}

interface UsersResponse {
  users: User[]
  pagination: {
    current_page: number
    per_page: number
    total: number
    total_pages: number
  }
}

export function AdminUsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<UsersResponse['pagination'] | null>(null)
  const [editingRole, setEditingRole] = useState<{userId: number, newRole: string} | null>(null)

  const loadUsers = async (page = 1, searchQuery = search, role = roleFilter) => {
    try {
      setLoading(true)
      const params: any = { page, limit: 20 }
      if (searchQuery.trim()) params.search = searchQuery.trim()
      if (role) params.role = role

      const response = await getAllUsers(params)
      setUsers(response.data.users)
      setPagination(response.data.pagination)
    } catch (err: any) {
      setError(err.message || 'Failed to load users')
      console.error('Error loading users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers(1, search, roleFilter)
    setCurrentPage(1)
  }, [search, roleFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadUsers(1, search, roleFilter)
    setCurrentPage(1)
  }

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      setEditingRole({ userId, newRole })
      await updateUserRole(userId, newRole)
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole as any } : user
      ))
      
      toast.success('Роль пользователя обновлена!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user role')
      console.error('Error updating user role:', err)
    } finally {
      setEditingRole(null)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    loadUsers(page, search, roleFilter)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'manager':
        return 'bg-blue-100 text-blue-800'
      case 'user':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }


  if (loading && users.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">Загружаем пользователей...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => loadUsers()} className="btn-primary">
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Управление пользователями</h1>
        <p className="text-gray-600">Просмотр и редактирование ролей пользователей системы</p>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Поиск по имени или email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10 w-full"
              />
            </div>
          </form>
          
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="input-field pl-10 pr-8"
              >
                <option value="">Все роли</option>
                <option value="admin">Администраторы</option>
                <option value="manager">Менеджеры</option>
                <option value="user">Пользователи</option>
              </select>
            </div>
            
            <button
              onClick={() => loadUsers(currentPage, search, roleFilter)}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Загрузка...' : 'Поиск'}
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Пользователи
                {pagination && ` (${pagination.total})`}
              </h2>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Бизнес
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата регистрации
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={editingRole?.userId === user.id}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${getRoleBadge(user.role)} ${
                        editingRole?.userId === user.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
                      }`}
                    >
                      <option value="user">Пользователь</option>
                      <option value="manager">Менеджер</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.business_type ? (
                      <div>
                        <div className="text-gray-900">{user.business_type}</div>
                        {user.industry && (
                          <div className="text-xs text-gray-500">{user.industry}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">Не указано</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Пользователи не найдены</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search || roleFilter ? 'Попробуйте изменить критерии поиска' : 'В системе пока нет пользователей'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Показано {((currentPage - 1) * pagination.per_page) + 1} - {Math.min(currentPage * pagination.per_page, pagination.total)} из {pagination.total} пользователей
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                  {currentPage} / {pagination.total_pages}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
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
