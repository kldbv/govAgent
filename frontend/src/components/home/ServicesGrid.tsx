import { Link } from 'react-router-dom'
import { Award, TrendingUp, MessageCircle, BookOpen, ArrowRight } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface Service {
  id: string
  title: string
  description: string
  icon: string
  link: string
}

interface ServicesGridProps {
  title: string
  subtitle: string
  services: Service[]
}

const iconMap = {
  Award,
  TrendingUp,
  MessageCircle,
  BookOpen
}

export default function ServicesGrid({ title, subtitle, services }: ServicesGridProps) {
  const { elementRef, isVisible } = useIntersectionObserver()

  return (
    <section ref={elementRef} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => {
            const IconComponent = iconMap[service.icon as keyof typeof iconMap]
            return (
              <div
                key={service.id}
                className={`group card-hover p-8 text-center border-2 border-transparent hover:border-primary-200 transition-all duration-300 ${
                  isVisible ? 'animate-slide-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-200 transition-colors duration-300">
                  <IconComponent size={32} className="text-primary-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {service.description}
                </p>

                {/* CTA */}
                <Link
                  to={service.link}
                  className="inline-flex items-center gap-2 text-primary-600 font-medium hover:text-primary-700 transition-colors group-hover:gap-3"
                >
                  Подробнее
                  <ArrowRight size={16} className="transition-transform" />
                </Link>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className={`text-center mt-12 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
          <Link
            to="/programs"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-all duration-300 shadow-large hover:shadow-glow"
          >
            Посмотреть все программы
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  )
}
