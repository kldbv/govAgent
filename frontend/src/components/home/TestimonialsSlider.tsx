import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface Testimonial {
  id: string
  name: string
  position: string
  company: string
  content: string
  avatar: string
  rating: number
}

interface TestimonialsSliderProps {
  title: string
  testimonials: Testimonial[]
}

const TestimonialsSlider = function TestimonialsSlider({ title, testimonials }: TestimonialsSliderProps) {
  const { elementRef, isVisible } = useIntersectionObserver()
  const [currentIndex, setCurrentIndex] = useState(0)
  
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }
  
  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'text-secondary-400 fill-current' : 'text-gray-300'}
      />
    ))
  }

  return (
    <section ref={elementRef} className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-primary-100 text-lg">
            Истории успеха наших клиентов
          </p>
        </div>

        {/* Slider */}
        <div className="relative">
          {/* Navigation */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10">
            <button
              onClick={prevSlide}
              className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
            >
              <ChevronLeft size={20} />
            </button>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10">
            <button
              onClick={nextSlide}
              className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Testimonial Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 lg:p-12 border border-white/20">
            <div className={`${isVisible ? 'animate-scale-in' : 'opacity-0'}`}>
              {/* Quote Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Quote size={28} className="text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center max-w-4xl mx-auto">
                {/* Rating */}
                <div className="flex justify-center gap-1 mb-6">
                  {renderStars(testimonials[currentIndex]?.rating || 5)}
                </div>

                {/* Quote */}
                <blockquote className="text-xl lg:text-2xl font-medium text-white/90 leading-relaxed mb-8">
                  "{testimonials[currentIndex]?.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                    {/* TODO: Replace with actual avatars */}
                    <img
                      src={testimonials[currentIndex]?.avatar}
                      alt={testimonials[currentIndex]?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-white text-lg">
                      {testimonials[currentIndex]?.name}
                    </div>
                    <div className="text-primary-200">
                      {testimonials[currentIndex]?.position}, {testimonials[currentIndex]?.company}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentIndex === index
                    ? 'bg-white w-8'
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default React.memo(TestimonialsSlider)
