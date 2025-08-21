import React, { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Calendar, ArrowRight } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { Link } from 'react-router-dom'

interface NewsItem {
  id: string
  title: string
  excerpt: string
  date: string
  category: string
  image: string
}

interface NewsCarouselProps {
  title: string
  viewAllText: string
  news: NewsItem[]
}

const NewsCarousel = function NewsCarousel({ title, viewAllText, news }: NewsCarouselProps) {
  const { elementRef, isVisible } = useIntersectionObserver()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  
  const itemsPerView = Math.min(3, news.length)
  const totalItems = news.length
  
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1
      // Reset to beginning when we reach the end of original items
      if (nextIndex >= totalItems) {
        return 0
      }
      return nextIndex
    })
  }, [totalItems])
  
  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => {
      const prevIndex = prev - 1
      // Go to end when we go before the beginning
      if (prevIndex < 0) {
        return totalItems - 1
      }
      return prevIndex
    })
  }, [totalItems])
  
  // Auto-scroll functionality
  useEffect(() => {
    if (!isAutoPlaying || !isVisible || news.length <= 1) return
    
    const interval = setInterval(() => {
      nextSlide()
    }, 4000) // Change slide every 4 seconds
    
    return () => clearInterval(interval)
  }, [isAutoPlaying, isVisible, nextSlide, news.length])
  
  // Pause auto-scroll on hover
  const handleMouseEnter = () => setIsAutoPlaying(false)
  const handleMouseLeave = () => setIsAutoPlaying(true)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-KZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <section ref={elementRef} className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`flex justify-between items-center mb-12 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {title}
            </h2>
            <p className="text-gray-600">Актуальная информация о программах поддержки</p>
          </div>
          <Link 
            to="/news"
            className="hidden md:flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            {viewAllText}
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Carousel */}
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Navigation Buttons */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10">
            <button
              onClick={prevSlide}
              className="w-12 h-12 bg-white shadow-medium rounded-full flex items-center justify-center text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10">
            <button
              onClick={nextSlide}
              className="w-12 h-12 bg-white shadow-medium rounded-full flex items-center justify-center text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Cards Container */}
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
            >
              {news.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className={`flex-shrink-0 w-full md:w-1/2 lg:w-1/3 px-4 ${
                    isVisible ? 'animate-slide-up' : 'opacity-0'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Link to={`/news/${item.id}`}>
                    <article className="bg-white rounded-2xl shadow-soft hover:shadow-medium transition-all duration-300 overflow-hidden group cursor-pointer">
                    {/* Image */}
                    <div className="aspect-[16/9] bg-gradient-to-br from-primary-100 to-primary-200 relative overflow-hidden">
                      {/* TODO: Replace with actual news images */}
                      <img 
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                        <Calendar size={14} />
                        <time dateTime={item.date}>
                          {formatDate(item.date)}
                        </time>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {item.title}
                      </h3>
                      
                      <p className="text-gray-600 line-clamp-3 mb-4">
                        {item.excerpt}
                      </p>

                      <div className="flex items-center gap-2 text-primary-600 font-medium group-hover:gap-3 transition-all">
                        Читать далее
                        <ArrowRight size={16} />
                      </div>
                    </div>
                    </article>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {news.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentIndex === index
                    ? 'bg-primary-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          
          {/* Auto-scroll indicator */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full ${
                isAutoPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`} />
              {isAutoPlaying ? 'Автопрокрутка включена' : 'Наведите курсор для паузы'}
            </div>
          </div>
        </div>

        {/* Mobile View All Button */}
        <div className="md:hidden text-center mt-8">
          <Link 
            to="/news"
            className="flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors mx-auto"
          >
            {viewAllText}
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default React.memo(NewsCarousel)
