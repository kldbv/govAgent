import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface Partner {
  id: string
  name: string
  logo: string
  url?: string
}

interface PartnersStripProps {
  title: string
  subtitle: string
  partners: Partner[]
}

export default function PartnersStrip({ title, subtitle, partners }: PartnersStripProps) {
  const { elementRef, isVisible } = useIntersectionObserver()

  return (
    <section ref={elementRef} className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className={`text-center mb-12 ${isVisible ? 'animate-slide-up' : 'opacity-0'}`}>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
            {title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
          {partners.map((partner, index) => (
            <div
              key={partner.id}
              className={`group ${
                isVisible ? 'animate-scale-in' : 'opacity-0'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {partner.url ? (
                <a
                  href={partner.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <PartnerLogo partner={partner} />
                </a>
              ) : (
                <PartnerLogo partner={partner} />
              )}
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className={`mt-12 text-center ${isVisible ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '0.8s' }}>
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-50 to-secondary-50 px-6 py-3 rounded-full">
            <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <span className="text-gray-700 font-medium">
              Официальные партнеры государственных программ поддержки
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

function PartnerLogo({ partner }: { partner: Partner }) {
  return (
    <div className="aspect-[5/2] bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center p-4 group-hover:border-primary-200 group-hover:bg-primary-25 transition-all duration-300">
      {/* TODO: Replace with actual partner logos */}
      <img
        src={partner.logo}
        alt={partner.name}
        className="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
        title={partner.name}
      />
    </div>
  )
}
