import { Link } from 'react-router-dom'
import { ArrowRight, Play, CheckCircle, TrendingUp } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { VideoModal } from '@/components/VideoModal'
import { useState } from 'react'

interface HeroSectionProps {
  title: string
  subtitle: string
  description: string
  ctaPrimary: string
  ctaSecondary: string
}

export default function HeroSection({
  title,
  subtitle,
  description,
  ctaPrimary,
  ctaSecondary
}: HeroSectionProps) {
  const { elementRef, isVisible } = useIntersectionObserver()
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

  return (
    <section 
      ref={elementRef}
      className="relative bg-hero-pattern from-primary-600 via-primary-700 to-primary-800 text-white overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/90 via-primary-700/80 to-primary-800/90"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-white/5 rounded-full animate-float"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-white/3 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white/7 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className={`space-y-8 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium">
                <CheckCircle size={16} />
                Государственная поддержка бизнеса
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                {title}
              </h1>
              <p className="text-xl lg:text-2xl text-primary-100 font-medium">
                {subtitle}
              </p>
              <p className="text-lg text-primary-50 leading-relaxed">
                {description}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/programs" 
                className="group bg-white text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-large hover:shadow-glow"
              >
                {ctaPrimary}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => setIsVideoModalOpen(true)}
                className="group border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm"
              >
                <Play size={20} />
                {ctaSecondary}
              </button>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2 text-primary-100">
                <TrendingUp size={16} />
                <span className="font-medium">87% успешных заявок</span>
              </div>
              <div className="flex items-center gap-2 text-primary-100">
                <CheckCircle size={16} />
                <span className="font-medium">2,500+ предпринимателей</span>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className={`relative ${isVisible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
            <div className="relative">
              {/* Main Image Placeholder */}
              <div className="aspect-[4/3] bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center">
                {/* TODO: Replace with actual hero image */}
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp size={40} className="text-white" />
                  </div>
                  <p className="text-white/80 text-sm">
                    Здесь будет изображение<br />
                    успешного предпринимателя<br />
                    или инфографика
                  </p>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg p-4 shadow-large animate-float">
                <div className="text-primary-600 font-bold text-2xl">15+</div>
                <div className="text-gray-600 text-sm">Программ</div>
              </div>
              
              <div className="absolute -bottom-4 -left-4 bg-success-500 text-white rounded-lg p-4 shadow-large animate-float" style={{ animationDelay: '1s' }}>
                <div className="font-bold text-2xl">1.2 млрд</div>
                <div className="text-success-100 text-sm">Тенге поддержки</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Video Modal */}
      <VideoModal 
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        title="Как работает платформа BusinessSupport KZ"
      />
    </section>
  )
}
