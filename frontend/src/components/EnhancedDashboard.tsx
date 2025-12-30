import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '@/hooks/useAuth'
import { ProgramCard } from './ProgramCard'
import { ProgramCardSkeleton } from './LoadingSkeleton'
import { BusinessProgram } from '@/types/program'
import { getRecommendations, getUserApplications } from '@/services/api'

export function EnhancedDashboard() {
  const { user } = useAuthContext()
  const [recommendations, setRecommendations] = useState<BusinessProgram[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      try {
        // Load recommendations
        try {
          const recommendationsData = await getRecommendations()
          setRecommendations(Array.isArray(recommendationsData) ? recommendationsData.slice(0, 3) : [])
        } catch (recError) {
          console.warn('Failed to load recommendations:', recError)
          setRecommendations([])
        }
        
        // Load applications
        try {
          const applicationsData = await getUserApplications({})
          console.log('Applications data from API:', applicationsData)
          const apps = applicationsData?.data?.applications || applicationsData?.applications || []
          setApplications(Array.isArray(apps) ? apps.slice(0, 5) : [])
        } catch (appError) {
          console.warn('Failed to load applications:', appError)
          setApplications([])
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
  }, [user])
  
  // Calculate profile completion
  const getProfileCompletion = () => {
    if (!user?.profile) return 0
    
    const requiredFields = [
      'business_type', 'business_size', 'industry', 'region', 'experience_years',
      'bin', 'desired_loan_amount'
    ]
    
    const completedFields = requiredFields.filter(field => user.profile?.[field as keyof typeof user.profile])
    return Math.round((completedFields.length / requiredFields.length) * 100)
  }
  
  const profileCompletion = getProfileCompletion()
  const isProfileComplete = profileCompletion >= 100
  
  const quickActions = [
    {
      title: 'Заполнить профиль',
      description: 'Получите персональные рекомендации',
      icon: '👤',
      link: '/profile',
      disabled: isProfileComplete,
      badge: isProfileComplete ? 'Завершено' : `${profileCompletion}%`
    },
    {
      title: 'Просмотреть программы',
      description: 'Найдите подходящие программы поддержки',
      icon: '🏢',
      link: '/programs',
      disabled: false
    },
    {
      title: 'Рекомендации',
      description: 'Программы, подобранные специально для вас',
      icon: '💡',
      link: '/recommendations',
      disabled: !isProfileComplete,
      badge: !isProfileComplete ? 'Заполните профиль' : undefined
    },
    {
      title: 'Мои заявки',
      description: 'Отслеживайте статус ваших заявок',
      icon: '📋',
      link: '/applications',
      disabled: false,
      badge: applications.length > 0 ? `${applications.length}` : undefined
    }
  ]
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Добро пожаловать, {user?.full_name}!
        </h1>
        <p className="text-gray-600">
          Управляйте своими заявками и находите новые возможности для развития бизнеса
        </p>
      </div>
      
      {/* Profile Completion Alert */}
      {!isProfileComplete && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Завершите настройку профиля
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Заполните профиль компании ({profileCompletion}% завершено) для получения персональных рекомендаций программ поддержки.
                  </p>
                </div>
              </div>
            </div>
            <div className="ml-3 flex-shrink-0">
              <Link
                to="/profile"
                className="btn-primary text-sm"
              >
                Заполнить
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {quickActions.map((action, index) => (
          <div key={index} className={`card p-6 relative ${action.disabled ? 'opacity-60' : 'card-hover'}`}>
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">{action.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{action.title}</h3>
                {action.badge && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full mt-1">
                    {action.badge}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">{action.description}</p>
            {!action.disabled ? (
              <Link
                to={action.link}
                className="btn-primary w-full text-center"
              >
                Перейти
              </Link>
            ) : (
              <button
                disabled
                className="btn-secondary w-full cursor-not-allowed"
              >
                Недоступно
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommendations */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isProfileComplete ? 'Рекомендации для вас' : 'Популярные программы'}
            </h2>
            <Link
              to={isProfileComplete ? "/recommendations" : "/programs"}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Посмотреть все →
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3].map(i => (
                <ProgramCardSkeleton key={i} />
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recommendations.map(program => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  showMatchScore={isProfileComplete}
                />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isProfileComplete ? 'Нет рекомендаций' : 'Заполните профиль'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isProfileComplete
                  ? 'На данный момент нет программ, подходящих под ваш профиль'
                  : 'Заполните информацию о вашем бизнесе для получения персональных рекомендаций'
                }
              </p>
              <Link
                to={isProfileComplete ? "/programs" : "/profile"}
                className="btn-primary"
              >
                {isProfileComplete ? 'Посмотреть все программы' : 'Заполнить профиль'}
              </Link>
            </div>
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-8">
          {/* Profile Status */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Статус профиля</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Заполнение профиля</span>
                  <span className="text-sm font-medium text-gray-900">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
              
              {!isProfileComplete && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Необходимо заполнить:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {!user?.profile?.bin && <li>• БИН компании</li>}
                    {!user?.profile?.region && <li>• Регион</li>}
                    {!user?.profile?.desired_loan_amount && <li>• Желаемая сумма займа</li>}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* Recent Applications */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Последние заявки</h3>
              <Link
                to="/applications"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Все заявки
              </Link>
            </div>
            
            {applications.length > 0 ? (
              <div className="space-y-3">
                {applications.map((app, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {app.program_title || `Заявка #${app.id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(app.submitted_at || app.last_updated || app.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="ml-3 flex-shrink-0">
                      <span className={`badge ${
                        app.status === 'approved' ? 'bg-green-100 text-green-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        app.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status === 'approved' ? 'Одобрено' :
                         app.status === 'rejected' ? 'Отклонено' :
                         app.status === 'under_review' ? 'На рассмотрении' : 'Черновик'
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="h-8 w-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-600">Заявок пока нет</p>
              </div>
            )}
          </div>
          
          {/* Quick Stats */}
          {isProfileComplete && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Подходящих программ</span>
                  <span className="text-sm font-medium text-gray-900">
                    {recommendations.length > 0 ? `${recommendations.length}+` : '0'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Активных заявок</span>
                  <span className="text-sm font-medium text-gray-900">
                    {applications.filter(app => ['submitted', 'under_review'].includes(app.status)).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Одобренных заявок</span>
                  <span className="text-sm font-medium text-green-600">
                    {applications.filter(app => app.status === 'approved').length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
