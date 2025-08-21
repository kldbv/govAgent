import { useState } from 'react'
import { Calendar, Clock, ChevronRight, Search, Filter, Newspaper, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface NewsArticle {
  id: number
  title: string
  excerpt: string
  content: string
  category: 'grants' | 'subsidies' | 'programs' | 'regulations' | 'events'
  date: string
  readTime: string
  imageUrl?: string
  featured: boolean
}

const newsArticles: NewsArticle[] = [
  {
    id: 1,
    title: "Запущена новая программа грантов для IT-стартапов",
    excerpt: "Министерство цифрового развития объявило о старте программы поддержки технологических стартапов с общим бюджетом 5 млрд тенге.",
    content: "Подробная информация о новой программе грантов...",
    category: "grants",
    date: "2024-03-15",
    readTime: "3 мин",
    imageUrl: "/api/placeholder/600/300",
    featured: true
  },
  {
    id: 2,
    title: "Изменения в программе субсидирования процентных ставок",
    excerpt: "С 1 апреля 2024 года вступают в силу новые условия субсидирования для малого и среднего бизнеса.",
    content: "Подробности об изменениях в программе субсидирования...",
    category: "subsidies",
    date: "2024-03-12",
    readTime: "5 мин",
    featured: false
  },
  {
    id: 3,
    title: "Открыта регистрация на бесплатные бизнес-тренинги",
    excerpt: "Национальная палата предпринимателей проводит серию обучающих семинаров для начинающих предпринимателей.",
    content: "Информация о бизнес-тренингах...",
    category: "events",
    date: "2024-03-10",
    readTime: "2 мин",
    featured: false
  },
  {
    id: 4,
    title: "Новые налоговые льготы для экспортеров",
    excerpt: "Правительство утвердило дополнительные льготы для компаний, осуществляющих экспорт товаров и услуг.",
    content: "Детали о налоговых льготах...",
    category: "regulations",
    date: "2024-03-08",
    readTime: "4 мин",
    featured: false
  },
  {
    id: 5,
    title: "Результаты первого квартала программ поддержки",
    excerpt: "Опубликован отчет о результатах работы программ государственной поддержки бизнеса за первый квартал 2024 года.",
    content: "Статистика и результаты программ...",
    category: "programs",
    date: "2024-03-05",
    readTime: "6 мин",
    featured: false
  },
  {
    id: 6,
    title: "Упрощение процедур подачи заявок онлайн",
    excerpt: "Внедрены новые цифровые инструменты для упрощения процесса подачи заявок на получение государственной поддержки.",
    content: "Информация об упрощении процедур...",
    category: "programs",
    date: "2024-03-01",
    readTime: "3 мин",
    featured: false
  }
]

const categories = [
  { id: 'all', name: 'Все новости', count: newsArticles.length },
  { id: 'grants', name: 'Гранты', count: newsArticles.filter(n => n.category === 'grants').length },
  { id: 'subsidies', name: 'Субсидии', count: newsArticles.filter(n => n.category === 'subsidies').length },
  { id: 'programs', name: 'Программы', count: newsArticles.filter(n => n.category === 'programs').length },
  { id: 'regulations', name: 'Регулирование', count: newsArticles.filter(n => n.category === 'regulations').length },
  { id: 'events', name: 'Мероприятия', count: newsArticles.filter(n => n.category === 'events').length }
]

export default function NewsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNews = newsArticles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const featuredNews = newsArticles.filter(article => article.featured)
  const regularNews = filteredNews.filter(article => !article.featured)

  const getCategoryName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      grants: 'Гранты',
      subsidies: 'Субсидии', 
      programs: 'Программы',
      regulations: 'Регулирование',
      events: 'Мероприятия'
    }
    return categoryMap[category] || category
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Newspaper className="mx-auto h-16 w-16 text-primary-200 mb-4" />
            <h1 className="text-4xl font-bold mb-4">Новости и обновления</h1>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              Актуальная информация о программах поддержки, изменениях в законодательстве и новых возможностях для бизнеса
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured News */}
        {selectedCategory === 'all' && featuredNews.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Главные новости</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredNews.map(article => (
                <div key={article.id} className="card overflow-hidden hover:shadow-lg transition-shadow">
                  {article.imageUrl && (
                    <div className="aspect-w-16 aspect-h-9">
                      <img 
                        src={article.imageUrl} 
                        alt={article.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                        {getCategoryName(article.category)}
                      </span>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        {formatDate(article.date)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        {article.readTime}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    <Link 
                      to={`/news/${article.id}`}
                      className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Читать далее
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="card p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Категории</h3>
              <nav className="space-y-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                      {category.count}
                    </span>
                  </button>
                ))}
              </nav>

              {/* Newsletter Subscription */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Подписка на новости</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Получайте последние новости на email
                </p>
                <div className="space-y-2">
                  <input 
                    type="email" 
                    placeholder="Ваш email"
                    className="w-full px-3 py-2 text-sm border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 transition-colors">
                    Подписаться
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Search and Filter */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Поиск новостей..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field pl-10 w-full"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-field pl-10 pr-8"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* News List */}
            <div className="space-y-6">
              {regularNews.map(article => (
                <div key={article.id} className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                          {getCategoryName(article.category)}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          {formatDate(article.date)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          {article.readTime}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {article.excerpt}
                      </p>
                      <Link 
                        to={`/news/${article.id}`}
                        className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Читать полностью
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                    {article.imageUrl && (
                      <div className="hidden sm:block w-32 h-24 flex-shrink-0">
                        <img 
                          src={article.imageUrl} 
                          alt={article.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredNews.length === 0 && (
              <div className="text-center py-12">
                <Newspaper className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Новости не найдены
                </h3>
                <p className="text-gray-500">
                  Попробуйте изменить критерии поиска или выбрать другую категорию
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
