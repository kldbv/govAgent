import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/hooks/useAuth'
import { LogOut, Phone, Mail } from 'lucide-react'
import { ChatWidget } from './ChatWidget'
import { useState, useEffect } from 'react'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated, user, logout } = useAuthContext()
  const location = useLocation()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const role = typeof user?.role === 'string' ? user.role.toLowerCase().trim() : ''
  
  // Debug logging for role checks
  console.log('Layout render - user:', user, 'role:', role, 'isAuthenticated:', isAuthenticated)

  const isActive = (path: string) => location.pathname === path

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Info Bar */}
      <div className="bg-primary-900 text-white py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Phone size={14} />
                <span>Горячая линия: +7 (727) 244-50-40</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Mail size={14} />
                <span>info@businesssupport.kz</span>
              </div>
            </div>
            <div className="text-xs text-primary-200">
              Работаем: Пн-Пт 9:00-18:00
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className={`bg-white border-b transition-all duration-300 sticky top-0 z-50 ${
        isScrolled ? 'shadow-medium' : 'shadow-soft'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                BS
              </div>
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-primary-600 whitespace-nowrap">
                  BusinessSupport KZ
                </div>
                <div className="text-xs text-gray-500 whitespace-nowrap">
                  Поддержка предпринимательства
                </div>
              </div>
            </Link>

            {/* Main Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {!isAuthenticated && (
                <Link 
                  to="/" 
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive('/') 
                      ? 'text-primary-600' 
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Главная
                  {isActive('/') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                  )}
                </Link>
              )}
              
              <Link 
                to="/programs" 
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive('/programs') 
                    ? 'text-primary-600' 
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Программы
                {isActive('/programs') && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                )}
              </Link>

              {(!user || !['admin', 'manager'].includes(role)) && (
                <>
                  <Link 
                    to="/grants" 
                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive('/grants') 
                        ? 'text-primary-600' 
                        : 'text-gray-700 hover:text-primary-600'
                    }`}
                  >
                    Гранты
                    {isActive('/grants') && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                    )}
                  </Link>
                  <Link 
                    to="/subsidies" 
                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive('/subsidies') 
                        ? 'text-primary-600' 
                        : 'text-gray-700 hover:text-primary-600'
                    }`}
                  >
                    Субсидии
                    {isActive('/subsidies') && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                    )}
                  </Link>
                  <Link 
                    to="/how-to-apply" 
                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive('/how-to-apply') 
                        ? 'text-primary-600' 
                        : 'text-gray-700 hover:text-primary-600'
                    }`}
                  >
                    Методология
                    {isActive('/how-to-apply') && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                    )}
                  </Link>
                </>
              )}

              {isAuthenticated && (!user || !['admin', 'manager'].includes(role)) && (
                <>
                  <Link 
                    to="/dashboard" 
                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive('/dashboard') 
                        ? 'text-primary-600' 
                        : 'text-gray-700 hover:text-primary-600'
                    }`}
                  >
                    Кабинет
                    {isActive('/dashboard') && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                    )}
                  </Link>
                  <Link 
                    to="/recommendations" 
                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive('/recommendations') 
                        ? 'text-primary-600' 
                        : 'text-gray-700 hover:text-primary-600'
                    }`}
                  >
                    Рекомендации
                    {isActive('/recommendations') && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                    )}
                  </Link>
                  <Link 
                    to="/applications" 
                    className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive('/applications') 
                        ? 'text-primary-600' 
                        : 'text-gray-700 hover:text-primary-600'
                    }`}
                  >
                    Заявки
                    {isActive('/applications') && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                    )}
                  </Link>
                </>
              )}
              
              {user && role === 'admin' && (
                <Link 
                  to="/admin" 
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith('/admin') 
                      ? 'text-primary-600' 
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Админ
                  {location.pathname.startsWith('/admin') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                  )}
                </Link>
              )}

              {user && role === 'manager' && (
                <Link 
                  to="/manager" 
                  className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith('/manager') 
                      ? 'text-primary-600' 
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  Менеджер
                  {location.pathname.startsWith('/manager') && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                  )}
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={logout}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut size={14} />
                    <span className="hidden sm:inline">Выход</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link 
                    to="/login" 
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    Войти
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
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

      {/* Enhanced Footer */}
      <footer className="bg-neutral-800 text-white">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                  BS
                </div>
                <div>
                  <div className="text-lg font-bold">
                    BusinessSupport KZ
                  </div>
                  <div className="text-sm text-gray-400">
                    Поддержка предпринимательства
                  </div>
                </div>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
                Единая цифровая платформа для получения государственной поддержки бизнеса в Казахстане. 
                Помогаем предпринимателям найти и получить подходящие программы финансирования.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone size={16} />
                  <span>+7 (727) 244-50-40</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Mail size={16} />
                  <span>info@businesssupport.kz</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-white mb-6">Программы</h3>
              <ul className="space-y-3">
                <li><Link to="/grants" className="text-gray-300 hover:text-white transition-colors">Гранты</Link></li>
                <li><Link to="/subsidies" className="text-gray-300 hover:text-white transition-colors">Субсидии</Link></li>
                <li><Link to="/programs" className="text-gray-300 hover:text-white transition-colors">Все программы</Link></li>
                <li><Link to="/how-to-apply" className="text-gray-300 hover:text-white transition-colors">Методология</Link></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="font-semibold text-white mb-6">Поддержка</h3>
              <ul className="space-y-3">
                <li><Link to="/instructions" className="text-gray-300 hover:text-white transition-colors">Инструкции</Link></li>
                <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Контакты</Link></li>
                <li><Link to="/faq" className="text-gray-300 hover:text-white transition-colors">Вопросы и ответы</Link></li>
                <li><a href="tel:+77272445040" className="text-gray-300 hover:text-white transition-colors">Горячая линия</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-gray-400 text-sm">
                © 2024 BusinessSupport KZ. Все права защищены.
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <Link to="/privacy" className="hover:text-white transition-colors">Политика конфиденциальности</Link>
                <Link to="/terms" className="hover:text-white transition-colors">Условия использования</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Chat Widget */}
      <ChatWidget 
        isAuthenticated={isAuthenticated}
        onAuthRequired={() => navigate('/login')}
      />
    </div>
  )
}
