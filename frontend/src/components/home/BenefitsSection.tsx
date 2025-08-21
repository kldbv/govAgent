import { Layers, Target, Smartphone, Eye, Users, Heart } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface Benefit {
  id: string
  title: string
  description: string
  icon: string
}

interface BenefitsSectionProps {
  title: string
  subtitle: string
  benefits: Benefit[]
}

const iconMap = {
  Layers,
  Target,
  Smartphone,
  Eye,
  Users,
  Heart
}

export default function BenefitsSection({ title, subtitle, benefits }: BenefitsSectionProps) {
  const { elementRef, isVisible } = useIntersectionObserver()

  return (
    <section ref={elementRef} className="py-20 bg-gradient-to-br from-neutral-25 to-primary-25">
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

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = iconMap[benefit.icon as keyof typeof iconMap]
            return (
              <div
                key={benefit.id}
                className={`group bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 border border-gray-100 hover:border-primary-200 ${
                  isVisible ? 'animate-slide-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary-200 group-hover:scale-110 transition-all duration-300">
                  <IconComponent size={28} className="text-primary-600" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Bottom Pattern */}
        <div className={`mt-16 text-center ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
          <div className="inline-flex items-center gap-4 bg-white rounded-full px-8 py-4 shadow-medium">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">2,500+ предпринимателей</div>
              <div className="text-sm text-gray-600">уже используют платформу</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
