import { Link } from 'react-router-dom'
import { Search, Star, FileText, Users, TrendingUp, Award } from 'lucide-react'

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Найдите подходящую программу поддержки бизнеса
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Платформа для поиска и подачи заявок на государственные программы поддержки предпринимательства в Казахстане
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/programs" className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium text-lg transition-colors">
                Найти программы
              </Link>
              <Link to="/register" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg font-medium text-lg transition-colors">
                Зарегистрироваться
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Как это работает
            </h2>
            <p className="text-xl text-gray-600">
              Простой процесс для получения поддержки вашего бизнеса
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Найдите программу</h3>
              <p className="text-gray-600">
                Ищите среди доступных программ государственной поддержки бизнеса
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star size={32} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Получите рекомендации</h3>
              <p className="text-gray-600">
                Персональные рекомендации на основе профиля вашего бизнеса
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Подайте заявку</h3>
              <p className="text-gray-600">
                Подавайте заявки на подходящие программы прямо через платформу
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={32} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">11+</div>
              <div className="text-gray-600">Активных программ</div>
            </div>

            <div>
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">1000+</div>
              <div className="text-gray-600">Предпринимателей</div>
            </div>

            <div>
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={32} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">500M+</div>
              <div className="text-gray-600">Тенге поддержки</div>
            </div>

            <div>
              <div className="bg-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={32} className="text-white" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">95%</div>
              <div className="text-gray-600">Успешных заявок</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Готовы развивать свой бизнес?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            Присоединяйтесь к тысячам предпринимателей, которые уже получили поддержку
          </p>
          <Link 
            to="/register" 
            className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium text-lg transition-colors inline-block"
          >
            Начать сейчас
          </Link>
        </div>
      </section>
    </div>
  )
}
