import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuthContext } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { BMPFieldsStep } from '@/components/BMPFieldsStep'
import { BusinessGoalsStep } from '@/components/BusinessGoalsStep'
import { EnhancedProgramsPage } from '@/components/EnhancedProgramsPage'
import { EnhancedDashboard } from '@/components/EnhancedDashboard'
import { BusinessProgram } from '@/types/program'
import { getProgramById } from '@/services/api'
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
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', minimumFractionDigits: 0 }).format(amount!)
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800 text-sm">← Назад</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <div className="badge bg-gray-100 text-gray-800 mb-2 inline-block">{program.program_type}</div>
              <h1 className="text-2xl font-bold text-gray-900 break-words">{program.title}</h1>
              <p className="text-sm text-gray-600 mt-1">{program.organization}</p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{formatAmount(program.funding_amount)}</div>
              <div className="text-sm text-gray-500">Дедлайн: {formatDate(program.application_deadline)}</div>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-2">Описание</h2>
          <p className="text-gray-700 mb-4 whitespace-pre-line">{program.description}</p>

          <h2 className="text-lg font-semibold mb-2">Требования</h2>
          <p className="text-gray-700 mb-4 whitespace-pre-line">{program.requirements}</p>

          <h2 className="text-lg font-semibold mb-2">Преимущества</h2>
          <p className="text-gray-700 mb-4 whitespace-pre-line">{program.benefits}</p>

          <h2 className="text-lg font-semibold mb-2">Процесс подачи</h2>
          <p className="text-gray-700 whitespace-pre-line">{program.application_process}</p>
        </div>

        {/* Sidebar */}
        <div className="card p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4">Информация</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div><span className="text-gray-500">Организация: </span>{program.organization}</div>
            <div><span className="text-gray-500">Тип программы: </span>{program.program_type}</div>
            <div><span className="text-gray-500">Финансирование: </span>{formatAmount(program.funding_amount)}</div>
            <div><span className="text-gray-500">Дедлайн: </span>{formatDate(program.application_deadline)}</div>
            {program.eligible_regions && program.eligible_regions.length > 0 && (
              <div>
                <div className="text-gray-500 mb-1">Регионы:</div>
                <div className="flex flex-wrap gap-1">
                  {program.eligible_regions.map((r, i) => (
                    <span key={i} className="badge bg-gray-100 text-gray-700">{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleApply} className="btn-primary w-full mt-6">
            Подать заявку
          </button>
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
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm({
    defaultValues: user?.profile || {}
  })
  const [step, setStep] = useState(1)
  const totalSteps = 3
  
  // Watch form values for progress calculation
  const watchedValues = watch()
  
  // Calculate completion percentage
  const requiredFields = [
    'business_type', 'business_size', 'industry', 'region', 'experience_years',
    'bin', 'oked_code', 'desired_loan_amount'
  ]
  const completedFields = requiredFields.filter(field => watchedValues[field as keyof typeof watchedValues])
  const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100)
  
  const onSubmit = async (data: any) => {
    try {
      await updateProfile(data)
      // Show success message or redirect
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }
  
  const nextStep = () => setStep(step + 1)
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
                <input
                  {...register('industry', { required: 'Укажите отрасль' })}
                  type="text"
                  className="input-field"
                  placeholder="Например: Информационные технологии"
                />
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
                <input
                  {...register('annual_revenue')}
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="10000000"
                />
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
                className="btn-primary"
              >
                Далее
              </button>
            </div>
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
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Мои заявки</h1>
      <div className="card p-8 text-center">
        <p className="text-gray-600">У вас пока нет поданных заявок</p>
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
