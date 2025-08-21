import { Award, Users, TrendingUp, CheckCircle } from 'lucide-react'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useEffect, useState } from 'react'

interface Stat {
  id: string
  value: string
  label: string
  icon: string
}

interface StatsBannerProps {
  title: string
  stats: Stat[]
}

const iconMap = {
  Award,
  Users,
  TrendingUp,
  CheckCircle
}

function AnimatedCounter({ value, isVisible }: { value: string, isVisible: boolean }) {
  const [displayValue, setDisplayValue] = useState('0')
  
  useEffect(() => {
    if (!isVisible) return
    
    // Extract numeric part and suffix
    const match = value.match(/^([\d,]+(?:\.\d+)?)\s*(.*)$/)
    if (!match) {
      setDisplayValue(value)
      return
    }
    
    const [, numStr, suffix] = match
    const targetNum = parseFloat(numStr.replace(/,/g, ''))
    
    if (isNaN(targetNum)) {
      setDisplayValue(value)
      return
    }
    
    let currentNum = 0
    const increment = targetNum / 60 // 60 frames for smooth animation
    const timer = setInterval(() => {
      currentNum += increment
      if (currentNum >= targetNum) {
        currentNum = targetNum
        clearInterval(timer)
      }
      
      const formattedNum = currentNum < 10 
        ? currentNum.toFixed(1)
        : Math.round(currentNum).toLocaleString()
      
      setDisplayValue(`${formattedNum}${suffix ? ' ' + suffix : ''}`)
    }, 16) // ~60fps
    
    return () => clearInterval(timer)
  }, [value, isVisible])
  
  return <span>{displayValue}</span>
}

export default function StatsBanner({ title, stats }: StatsBannerProps) {
  const { elementRef, isVisible } = useIntersectionObserver()

  return (
    <section ref={elementRef} className="py-20 bg-primary-600 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-mesh-gradient from-primary-600 via-primary-700 to-primary-800 bg-300% animate-gradient-shift"></div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className={`text-center mb-16 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            {title}
          </h2>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const IconComponent = iconMap[stat.icon as keyof typeof iconMap]
            return (
              <div
                key={stat.id}
                className={`text-center group ${
                  isVisible ? 'animate-counter' : 'opacity-0'
                }`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Icon */}
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/20 transition-all duration-300">
                  <IconComponent size={32} className="text-white" />
                </div>

                {/* Value */}
                <div className="text-3xl lg:text-4xl font-bold mb-2 group-hover:scale-110 transition-transform duration-300">
                  <AnimatedCounter value={stat.value} isVisible={isVisible} />
                </div>

                {/* Label */}
                <div className="text-primary-100 font-medium">
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom Quote */}
        <div className={`mt-16 text-center ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '1s' }}>
          <blockquote className="text-xl lg:text-2xl font-medium text-primary-100 max-w-4xl mx-auto">
            "Развиваем предпринимательство в Казахстане через доступные и эффективные программы поддержки"
          </blockquote>
        </div>
      </div>
    </section>
  )
}
