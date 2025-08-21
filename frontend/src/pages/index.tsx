import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuthContext } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { BMPFieldsStep } from '@/components/BMPFieldsStep'
import { BusinessGoalsStep } from '@/components/BusinessGoalsStep'
import { EnhancedProgramsPage } from '@/components/EnhancedProgramsPage'
import { EnhancedDashboard } from '@/components/EnhancedDashboard'
import { BusinessProgram } from '@/types/program'
import { getProgramById, getUserApplications } from '@/services/api'
import { ApplicationWizard } from '@/components/ApplicationWizard'

// LoginPage
export function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const { login } = useAuthContext()
  const navigate = useNavigate()

  const onSubmit = async (data: any) => {
    try {
      await login(data)
      navigate('/dashboard')
    } catch (error) {
      // Error is handled in auth context
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Вход в систему
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              {...register('email', { required: 'Email обязателен' })}
              type="email"
              className="input-field"
              placeholder="Email адрес"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>}
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Пароль</label>
            <input
              {...register('password', { required: 'Пароль обязателен' })}
              type="password"
              className="input-field"
              placeholder="Пароль"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>}
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex justify-center"
            >
              {isSubmitting ? <div className="loading-spinner" /> : 'Войти'}
            </button>
          </div>
          <div className="text-center">
            <Link to="/register" className="text-primary-600 hover:text-primary-500">
              Нет аккаунта? Зарегистрироваться
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

// RegisterPage
export function RegisterPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm()
  const { register: registerUser } = useAuthContext()
  const navigate = useNavigate()

  const onSubmit = async (data: any) => {
    try {
      await registerUser(data)
      navigate('/profile')
    } catch (error) {
      // Error is handled in auth context
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Регистрация
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <input
              {...register('full_name', { required: 'Имя обязательно' })}
              type="text"
              className="input-field"
              placeholder="Полное имя"
            />
            {errors.full_name && <p className="mt-1 text-sm text-red-600">{errors.full_name.message as string}</p>}
          </div>
          <div>
            <input
              {...register('email', { required: 'Email обязателен' })}
              type="email"
              className="input-field"
              placeholder="Email адрес"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message as string}</p>}
          </div>
          <div>
            <input
              {...register('password', { required: 'Пароль обязателен', minLength: { value: 6, message: 'Минимум 6 символов' } })}
              type="password"
              className="input-field"
              placeholder="Пароль"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message as string}</p>}
          </div>
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex justify-center"
            >
              {isSubmitting ? <div className="loading-spinner" /> : 'Зарегистрироваться'}
            </button>
          </div>
          <div className="text-center">
            <Link to="/login" className="text-primary-600 hover:text-primary-500">
              Есть аккаунт? Войти
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

// Enhanced Programs Page
export function ProgramsPage() {
  return <EnhancedProgramsPage />
}

export function ProgramDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [program, setProgram] = useState<BusinessProgram | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const data = await getProgramById(id!)
        setProgram(data)
      } catch (e: any) {
        setError(e.message || 'Не удалось загрузить программу')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  const formatAmount = (amount?: number) => {
    if (!amount && amount !== 0) return 'Не указано'
    if (amount >= 1000000) {
      const millions = amount / 1000000
      const formatted = millions % 1 === 0 ? millions.toString() : millions.toFixed(1)
      return `${formatted} млн ₸`
    }
    if (amount >= 1000) {
      const thousands = amount / 1000
      const formatted = thousands % 1 === 0 ? thousands.toString() : thousands.toFixed(1)
      return `${formatted} тыс ₸`
    }
    return `${amount} ₸`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Не указан'
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  const [showWizard, setShowWizard] = useState(false)

  const handleApply = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    setShowWizard(true)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">Загружаем информацию о программе...</p>
        </div>
      </div>
    )
  }

  if (error || !program) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card p-8 text-center">
          <p className="text-red-600">{error || 'Программа не найдена'}</p>
        </div>
      </div>
    )
  }

  const getStatusInfo = () => {
    const now = new Date().getTime()
    const opens = program.opens_at ? new Date(program.opens_at).getTime() : null
    const closesBase = program.closes_at || program.application_deadline
    const closes = closesBase ? new Date(closesBase).getTime() : null

    if (opens && now < opens) {
      const daysUntilOpen = Math.ceil((opens - now) / (1000 * 60 * 60 * 24))
      return { 
        label: `Откроется через ${daysUntilOpen} дн.`, 
        color: 'bg-yellow-500 text-white',
        isOpen: false
      }
    }
    if (closes && now > closes) {
      return { 
        label: 'Закрыт для подачи', 
        color: 'bg-red-500 text-white',
        isOpen: false 
      }
    }
    
    if (closes) {
      const daysLeft = Math.ceil((closes - now) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 7) {
        return { 
          label: `Остался ${daysLeft} дн.`, 
          color: 'bg-red-500 text-white',
          isOpen: true,
          urgent: true
        }
      }
      if (daysLeft <= 30) {
        return { 
          label: `Осталось ${daysLeft} дн.`, 
          color: 'bg-yellow-500 text-white',
          isOpen: true
        }
      }
    }
    
    return { 
      label: 'Открыт для подачи', 
      color: 'bg-green-500 text-white',
      isOpen: true 
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Назад к программам
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="badge bg-blue-100 text-blue-800">{program.program_type}</span>
                  <span className={`badge ${statusInfo.color}`}>{statusInfo.label}</span>
                  {statusInfo.urgent && (
                    <span className="badge bg-red-100 text-red-800 animate-pulse">Срочно!</span>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{program.title}</h1>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="font-medium">{program.organization}</span>
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-3xl font-bold text-green-600 mb-1">{formatAmount(program.funding_amount)}</div>
                <div className="text-sm text-gray-500">Размер финансирования</div>
                {program.application_deadline && (
                  <div className="mt-2 text-sm text-gray-600">
                    Дедлайн: <span className="font-medium">{formatDate(program.application_deadline)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{program.target_audience}</div>
                <div className="text-xs text-gray-500">Целевая аудитория</div>
              </div>
              {program.min_loan_amount && program.max_loan_amount && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatAmount(program.min_loan_amount)} - {formatAmount(program.max_loan_amount)}
                  </div>
                  <div className="text-xs text-gray-500">Диапазон займа</div>
                </div>
              )}
              {program.eligible_regions && program.eligible_regions.length > 0 && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{program.eligible_regions.length}</div>
                  <div className="text-xs text-gray-500">Регионов доступно</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{program.program_type}</div>
                <div className="text-xs text-gray-500">Тип поддержки</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Описание программы
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{program.description}</p>
            </div>
          </div>

          {/* Requirements */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Требования к участникам
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{program.requirements}</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Преимущества программы
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{program.benefits}</p>
            </div>
          </div>

          {/* Application Process */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Процесс подачи заявки
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{program.application_process}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className={`btn-primary flex-1 ${!statusInfo.isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={statusInfo.isOpen ? handleApply : undefined}
                disabled={!statusInfo.isOpen}
              >
                {statusInfo.isOpen ? 'Подать заявку' : 'Подача заявок закрыта'}
              </button>
              <a
                className="btn-secondary flex-1 text-center"
                href={`/programs/${program.id}/instructions`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Инструкция по оформлению
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Key Information */}
          <div className="card p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ключевая информация</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Организация</div>
                  <div className="font-medium text-gray-900">{program.organization}</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Размер финансирования</div>
                  <div className="font-bold text-green-600 text-lg">{formatAmount(program.funding_amount)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V19a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h3zM8 7h8" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Дедлайн подачи</div>
                  <div className="font-medium text-gray-900">{formatDate(program.application_deadline)}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <div className="flex-1">
                  <div className="text-sm text-gray-500">Целевая аудитория</div>
                  <div className="font-medium text-gray-900">{program.target_audience}</div>
                </div>
              </div>

              {(program.min_loan_amount || program.max_loan_amount) && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Диапазон займа</div>
                    <div className="font-medium text-gray-900">
                      {formatAmount(program.min_loan_amount)} - {formatAmount(program.max_loan_amount)}
                    </div>
                  </div>
                </div>
              )}

              {program.eligible_regions && program.eligible_regions.length > 0 && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">Доступные регионы</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {program.eligible_regions.slice(0, 3).map((region, i) => (
                        <span key={i} className="badge bg-indigo-100 text-indigo-800 text-xs">{region}</span>
                      ))}
                      {program.eligible_regions.length > 3 && (
                        <span className="badge bg-gray-100 text-gray-600 text-xs">
                          +{program.eligible_regions.length - 3} еще
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <button 
                onClick={handleApply} 
                className={`btn-primary w-full ${!statusInfo.isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!statusInfo.isOpen}
              >
                {statusInfo.isOpen ? 'Подать заявку' : 'Подача закрыта'}
              </button>
              {!statusInfo.isOpen && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  {statusInfo.label}
                </p>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Нужна помощь?</h3>
            <div className="space-y-3">
              <a 
                href="tel:+77272445040" 
                className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <div className="font-medium">Горячая линия</div>
                  <div className="text-sm">+7 (727) 244-50-40</div>
                </div>
              </a>
              
              <a 
                href="mailto:info@businesssupport.kz" 
                className="flex items-center gap-3 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-green-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <div className="font-medium">Email поддержки</div>
                  <div className="text-sm">info@businesssupport.kz</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>

      {showWizard && program && (
        <ApplicationWizard program={program} onClose={() => setShowWizard(false)} />
      )}
    </div>
  )
}

export function DashboardPage() {
  return <EnhancedDashboard />
}

export function ProfilePage() {
  const { user, updateProfile } = useAuthContext()
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    defaultValues: user?.profile || {}
  })
  const [step, setStep] = useState(1)
  const totalSteps = 3
  
  // Watch form values for progress calculation
  const watchedValues = watch()
  
  // Safe number formatting function
  const formatNumberSafely = (value: string | number | undefined): string => {
    if (!value) return ''
    try {
      const numStr = typeof value === 'string' ? value.replace(/\D/g, '') : String(value)
      const num = parseInt(numStr)
      return isNaN(num) ? '' : new Intl.NumberFormat('ru-RU').format(num)
    } catch {
      return ''
    }
  }
  
  // Calculate completion percentage
  const requiredFields = [
    'business_type', 'business_size', 'industry', 'experience_years',
    'bin', 'region', 'desired_loan_amount'
  ]
  const completedFields = requiredFields.filter(field => {
    const value = watchedValues[field as keyof typeof watchedValues]
    return value !== undefined && value !== '' && value !== null
  })
  const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100)
  
  // Validation functions for each step
  const validateStep1 = () => {
    const step1Fields = ['business_type', 'business_size', 'industry', 'experience_years']
    return step1Fields.every(field => {
      const value = watchedValues[field as keyof typeof watchedValues]
      return value !== undefined && value !== '' && value !== null
    })
  }
  
  const validateStep2 = () => {
    const step2Fields = ['bin', 'region', 'desired_loan_amount']
    return step2Fields.every(field => {
      const value = watchedValues[field as keyof typeof watchedValues]
      if (field === 'desired_loan_amount') {
        return value !== undefined && value !== null && typeof value === 'number' && value >= 100000 // Minimum 100K KZT
      }
      return value !== undefined && value !== '' && value !== null
    })
  }
  
  const onSubmit = async (data: any) => {
    try {
      await updateProfile(data)
      // Redirect to dashboard after successful profile completion
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }
  
  const nextStep = () => {
    if (step === 1 && !validateStep1()) {
      // Trigger validation by attempting to submit
      return
    }
    if (step === 2 && !validateStep2()) {
      // Trigger validation by attempting to submit  
      return
    }
    setStep(step + 1)
  }
  const prevStep = () => setStep(step - 1)
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Профиль компании</h1>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600">
            {completionPercentage}% заполнено
          </span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Step 1: Basic Business Info */}
        {step === 1 && (
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Основная информация о бизнесе</h2>
              <span className="text-sm text-gray-500">Шаг 1 из {totalSteps}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Тип бизнеса <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('business_type', { 
                    required: 'Выберите тип бизнеса',
                    validate: (value: string) => value !== '' || 'Выберите тип бизнеса'
                  })}
                  className={`input-field ${errors.business_type ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                >
                  <option value="">Выберите тип</option>
                  <option value="startup">Стартап</option>
                  <option value="sme">МСП</option>
                  <option value="individual">ИП</option>
                  <option value="ngo">НПО</option>
                </select>
                {errors.business_type && <p className="mt-1 text-sm text-red-600">{errors.business_type.message as string}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Размер бизнеса <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('business_size', { required: 'Выберите размер бизнеса' })}
                  className="input-field"
                >
                  <option value="">Выберите размер</option>
                  <option value="micro">Микро</option>
                  <option value="small">Малый</option>
                  <option value="medium">Средний</option>
                  <option value="large">Крупный</option>
                </select>
                {errors.business_size && <p className="mt-1 text-sm text-red-600">{errors.business_size.message as string}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Отрасль <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('industry', { 
                    required: 'Выберите отрасль',
                    validate: (value: string) => value !== '' || 'Выберите отрасль'
                  })}
                  className={`input-field ${errors.industry ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                >
                  <option value="">Выберите отрасль</option>
                  <option value="information_technology">Информационные технологии</option>
                  <option value="agriculture">Сельское хозяйство</option>
                  <option value="manufacturing">Производство</option>
                  <option value="construction">Строительство</option>
                  <option value="retail_trade">Розничная торговля</option>
                  <option value="wholesale_trade">Оптовая торговля</option>
                  <option value="transport">Транспорт и логистика</option>
                  <option value="tourism">Туризм и гостеприимство</option>
                  <option value="education">Образование</option>
                  <option value="healthcare">Здравоохранение</option>
                  <option value="finance">Финансовые услуги</option>
                  <option value="real_estate">Недвижимость</option>
                  <option value="mining">Горнодобывающая промышленность</option>
                  <option value="energy">Энергетика</option>
                  <option value="food_processing">Пищевая промышленность</option>
                  <option value="textile">Текстильная промышленность</option>
                  <option value="chemical">Химическая промышленность</option>
                  <option value="telecommunications">Телекоммуникации</option>
                  <option value="consulting">Консалтинг</option>
                  <option value="media">Медиа и развлечения</option>
                  <option value="other">Другое</option>
                </select>
                {errors.industry && <p className="mt-1 text-sm text-red-600">{errors.industry.message as string}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Опыт работы (лет) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('experience_years', { 
                    required: 'Укажите опыт работы',
                    min: { value: 0, message: 'Опыт не может быть отрицательным' },
                    max: { value: 50, message: 'Максимальный опыт - 50 лет' }
                  })}
                  type="number"
                  min="0"
                  max="50"
                  className="input-field"
                  placeholder="5"
                />
                {errors.experience_years && <p className="mt-1 text-sm text-red-600">{errors.experience_years.message as string}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Годовая выручка (тенге)
                </label>
                <div className="relative">
                  <input
                    {...register('annual_revenue', {
                      setValueAs: (value: string) => {
                        if (!value || value.trim() === '') return undefined
                        try {
                          const numericValue = parseInt(value.replace(/\D/g, ''))
                          return isNaN(numericValue) ? undefined : numericValue
                        } catch {
                          return undefined
                        }
                      }
                    })}
                    type="text"
                    className="input-field pr-12"
                    placeholder="10 000 000"
                    defaultValue={watchedValues.annual_revenue ? formatNumberSafely(watchedValues.annual_revenue) : ''}
                    onChange={(e) => {
                      try {
                        const value = e.target.value.replace(/\D/g, '')
                        if (value) {
                          const formatted = formatNumberSafely(value)
                          if (formatted) {
                            e.target.value = formatted
                          }
                        }
                        setValue('annual_revenue', value ? parseInt(value) : undefined, { shouldValidate: false })
                      } catch (error) {
                        console.warn('Error formatting annual revenue:', error)
                      }
                    }}
                    onBlur={(e) => {
                      try {
                        const value = e.target.value.replace(/\D/g, '')
                        if (value) {
                          const formatted = formatNumberSafely(value)
                          if (formatted) {
                            e.target.value = formatted
                          }
                        }
                      } catch (error) {
                        console.warn('Error formatting annual revenue on blur:', error)
                      }
                    }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">
                    ₸
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Количество сотрудников
                </label>
                <input
                  {...register('employee_count')}
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="10"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={nextStep}
                disabled={!validateStep1()}
                className={`btn-primary ${!validateStep1() ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Далее
              </button>
            </div>
            {!validateStep1() && (
              <p className="mt-2 text-sm text-red-600 text-center">
                Заполните все обязательные поля для продолжения
              </p>
            )}
          </div>
        )}
        
        {/* Step 2: BMP Specific Fields */}
        {step === 2 && (
          <BMPFieldsStep 
            register={register}
            errors={errors}
            setValue={setValue}
            watchedValues={watchedValues}
            onNext={nextStep}
            onPrev={prevStep}
            totalSteps={totalSteps}
            currentStep={step}
          />
        )}
        
        {/* Step 3: Business Goals */}
        {step === 3 && (
          <BusinessGoalsStep 
            register={register}
            errors={errors}
            setValue={setValue}
            watchedValues={watchedValues}
            onPrev={prevStep}
            isSubmitting={isSubmitting}
          />
        )}
      </form>
    </div>
  )
}

export function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true)
        const response = await getUserApplications({})
        const apps = response?.data?.applications || response?.applications || []
        setApplications(apps)
      } catch (err: any) {
        console.error('Ошибка загрузки заявок:', err)
        setError(err.message || 'Не удалось загрузить заявки')
      } finally {
        setLoading(false)
      }
    }

    loadApplications()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Черновик'
      case 'submitted':
        return 'Подана'
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Мои заявки</h1>
        <div className="card p-8 text-center">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="text-gray-600">Загружаем ваши заявки...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Мои заявки</h1>
        <div className="card p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Обновить страницу
          </button>
        </div>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">Мои заявки</h1>
        <div className="card p-8 text-center">
          <p className="text-gray-600 mb-4">У вас пока нет поданных заявок</p>
          <Link to="/programs" className="btn-primary inline-block">
            Найти программы поддержки
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Мои заявки</h1>
        <p className="text-gray-600">Всего: {applications.length}</p>
      </div>
      
      <div className="grid gap-6">
        {applications.map((app) => (
          <div key={app.id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {app.program_title || `Программа #${app.program_id}`}
                </h3>
                {app.organization && (
                  <p className="text-sm text-gray-600 mb-2">{app.organization}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Заявка №{app.id}</span>
                  <span>•</span>
                  <span>Подана: {formatDate(app.submitted_at || app.last_updated)}</span>
                  {app.submission_reference && (
                    <>
                      <span>•</span>
                      <span>Номер: {app.submission_reference}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="ml-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(app.status)}`}>
                  {getStatusText(app.status)}
                </span>
              </div>
            </div>
            
            {app.form_data && (
              <div className="bg-gray-50 rounded-md p-4 mb-4">
                <h4 className="font-medium mb-2">Данные заявки:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {app.form_data.applicant?.company_name && (
                    <div>
                      <span className="text-gray-600">Компания:</span>
                      <span className="ml-2 font-medium">{app.form_data.applicant.company_name}</span>
                    </div>
                  )}
                  {app.form_data.applicant?.contact_person && (
                    <div>
                      <span className="text-gray-600">Контакт:</span>
                      <span className="ml-2 font-medium">{app.form_data.applicant.contact_person}</span>
                    </div>
                  )}
                  {app.form_data.applicant?.email && (
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">{app.form_data.applicant.email}</span>
                    </div>
                  )}
                  {app.form_data.applicant?.phone && (
                    <div>
                      <span className="text-gray-600">Телефон:</span>
                      <span className="ml-2 font-medium">{app.form_data.applicant.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {app.notes && (
                  <span>Примечания: {app.notes}</span>
                )}
              </div>
              <div className="flex gap-2">
                {app.status === 'draft' && (
                  <Link 
                    to={`/programs/${app.program_id}`} 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Продолжить →
                  </Link>
                )}
                <Link 
                  to={`/programs/${app.program_id}`} 
                  className="text-gray-600 hover:text-gray-800 text-sm"
                >
                  Просмотр программы
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function RecommendationsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Рекомендации</h1>
      <div className="card p-8 text-center">
        <p className="text-gray-600">Заполните профиль для получения персональных рекомендаций</p>
      </div>
    </div>
  )
}
