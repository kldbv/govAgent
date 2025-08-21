import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface CallToActionProps {
  title: string
  subtitle: string
  buttonText: string
  buttonLink: string
}

export default function CallToAction({ title, subtitle, buttonText, buttonLink }: CallToActionProps) {
  const { elementRef, isVisible } = useIntersectionObserver()

  const benefits = [
    "Регистрация за 2 минуты",
    "Бесплатные консультации",
    "Персональные рекомендации",
    "Поддержка 24/7"
  ]

  return (
    <section ref={elementRef} className="py-20 bg-gradient-to-br from-neutral-25 to-primary-25 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-100 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-large p-8 lg:p-16 border border-gray-100">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className={`space-y-8 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium">
                  <Sparkles size={16} />
                  Начните прямо сейчас
                </div>
                
                <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
                  {title}
                </h2>
                
                <p className="text-xl text-gray-600 leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {/* Benefits List */}
              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 ${
                      isVisible ? 'animate-slide-up' : 'opacity-0'
                    }`}
                    style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                  >
                    <div className="w-6 h-6 bg-success-100 rounded-full flex items-center justify-center">
                      <CheckCircle size={14} className="text-success-600" />
                    </div>
                    <span className="text-gray-700 font-medium">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className={`pt-4 ${isVisible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
                <Link
                  to={buttonLink}
                  className="group inline-flex items-center gap-3 bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-all duration-300 shadow-large hover:shadow-glow-lg"
                >
                  {buttonText}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Visual */}
            <div className={`relative ${isVisible ? 'animate-scale-in' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl border-2 border-primary-200 flex items-center justify-center relative overflow-hidden">
                {/* TODO: Replace with actual CTA image */}
                <div className="text-center p-8">
                  <div className="w-24 h-24 bg-primary-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
                    <Sparkles size={40} className="text-white" />
                  </div>
                  <p className="text-primary-700 font-medium">
                    Здесь будет изображение<br />
                    успешной регистрации<br />
                    или dashboard превью
                  </p>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-4 right-4 bg-success-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-bounce-in">
                  Бесплатно
                </div>
                <div className="absolute bottom-4 left-4 bg-secondary-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-bounce-in" style={{ animationDelay: '0.5s' }}>
                  24/7
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
