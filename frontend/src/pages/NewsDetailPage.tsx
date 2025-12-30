import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Calendar, Clock, ChevronLeft, ArrowRight, Share2, BookOpen, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import DOMPurify from 'dompurify'
import { NewsArticle, getNewsArticleById, getRelatedNews } from '@/data/newsData'

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [relatedNews, setRelatedNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadArticle = () => {
      if (!id) {
        navigate('/news')
        return
      }

      const foundArticle = getNewsArticleById(id)
      
      if (!foundArticle) {
        navigate('/news')
        return
      }

      setArticle(foundArticle)
      
      // Get related news (same category, excluding current article)
      const related = getRelatedNews(foundArticle.id, foundArticle.category, 3)
      
      setRelatedNews(related)
      setLoading(false)
    }

    loadArticle()
  }, [id, navigate])

  const getCategoryName = (category: string) => {
    return category // Возвращаем категорию как есть, так как теперь она уже на русском языке
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.excerpt,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Ссылка скопирована в буфер обмена')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!article) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link 
            to="/news"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Вернуться к новостям
          </Link>
        </div>

        {/* Article Header */}
        <article className="card overflow-hidden">
          {/* Article Meta */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
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
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <BookOpen className="w-4 h-4" />
                {article.author}
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              {article.excerpt}
            </p>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-gray-400" />
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Share Button */}
            <div className="flex justify-end">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
              >
                <Share2 className="w-4 h-4" />
                Поделиться
              </button>
            </div>
          </div>

          {/* Article Image */}
          {article.imageUrl && (
            <div className="aspect-w-16 aspect-h-9">
              <img 
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="p-6">
            <div 
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }}
            />
          </div>
        </article>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Похожие новости</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedNews.map(news => (
                <Link 
                  key={news.id}
                  to={`/news/${news.id}`}
                  className="card p-4 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {getCategoryName(news.category)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(news.date)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                    {news.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                    {news.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-primary-600 text-sm font-medium">
                    Читать далее
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 card p-6 bg-primary-50 border-primary-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">
              Хотите получать последние новости?
            </h3>
            <p className="text-primary-700 mb-4">
              Подпишитесь на нашу рассылку и будьте в курсе всех обновлений программ поддержки
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Ваш email"
                className="flex-1 px-4 py-2 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button className="btn-primary whitespace-nowrap">
                Подписаться
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
