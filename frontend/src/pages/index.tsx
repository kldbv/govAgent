import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/hooks/useAuth'

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

// Basic stub pages
export function ProgramsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Программы поддержки бизнеса</h1>
      <div className="card p-8 text-center">
        <p className="text-gray-600 mb-4">Загружаем программы...</p>
        <div className="loading-spinner mx-auto" />
      </div>
    </div>
  )
}

export function ProgramDetailPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Детали программы</h1>
      <div className="card p-8 text-center">
        <p className="text-gray-600">Загружаем информацию о программе...</p>
      </div>
    </div>
  )
}

export function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Личный кабинет</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-2">Мои заявки</h3>
          <p className="text-gray-600">0 активных заявок</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold mb-2">Рекомендации</h3>
          <p className="text-gray-600">Заполните профиль для получения рекомендаций</p>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold mb-2">Профиль</h3>
          <p className="text-gray-600">Настройте профиль компании</p>
        </div>
      </div>
    </div>
  )
}

export function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">Профиль</h1>
      <div className="card p-8">
        <p className="text-gray-600 text-center">
          Форма редактирования профиля будет здесь
        </p>
      </div>
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
