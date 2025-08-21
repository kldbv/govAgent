import { Link, useLocation } from 'react-router-dom'
import { useAuthContext } from '@/hooks/useAuth'
import { User, LogOut, Search, Home, FileText, Star } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user, logout } = useAuthContext()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="text-xl font-bold text-primary-600">
                BusinessSupport KZ
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/') 
                    ? 'text-primary-600 bg-primary-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Home size={16} />
                <span>Главная</span>
              </Link>
              
              <Link 
                to="/programs" 
                className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/programs') 
                    ? 'text-primary-600 bg-primary-50' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Search size={16} />
                <span>Программы</span>
              </Link>

              {isAuthenticated && (
                <>
                  <Link 
                    to="/dashboard" 
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/dashboard') 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <User size={16} />
                    <span>Кабинет</span>
                  </Link>
                  
                  <Link 
                    to="/recommendations" 
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/recommendations') 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Star size={16} />
                    <span>Рекомендации</span>
                  </Link>
                  
                  <Link 
                    to="/applications" 
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive('/applications') 
                        ? 'text-primary-600 bg-primary-50' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <FileText size={16} />
                    <span>Заявки</span>
                  </Link>
                </>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    Привет, {user.full_name}!
                  </span>
                  <Link 
                    to="/profile"
                    className="btn-ghost flex items-center space-x-1"
                  >
                    <User size={16} />
                    <span>Профиль</span>
                  </Link>
                  <button 
                    onClick={logout}
                    className="btn-ghost flex items-center space-x-1 text-red-600 hover:text-red-700"
                  >
                    <LogOut size={16} />
                    <span>Выход</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link to="/login" className="btn-secondary">
                    Войти
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>&copy; 2024 BusinessSupport KZ. Все права защищены.</p>
            <p className="mt-2">
              Платформа для поиска программ поддержки бизнеса в Казахстане
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
