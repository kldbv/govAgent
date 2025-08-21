import HeroSection from '@/components/home/HeroSection'
import ServicesGrid from '@/components/home/ServicesGrid'
import BenefitsSection from '@/components/home/BenefitsSection'
import StatsBanner from '@/components/home/StatsBanner'
import NewsCarousel from '@/components/home/NewsCarousel'
import PartnersStrip from '@/components/home/PartnersStrip'
import TestimonialsSlider from '@/components/home/TestimonialsSlider'
import CallToAction from '@/components/home/CallToAction'
import { landingContent } from '@/data/landingContent'

export default function HomePage() {
  return (
    <div className="relative">
      {/* Hero Section */}
      <HeroSection
        title={landingContent.hero.title}
        subtitle={landingContent.hero.subtitle}
        description={landingContent.hero.description}
        ctaPrimary={landingContent.hero.ctaPrimary}
        ctaSecondary={landingContent.hero.ctaSecondary}
      />

      {/* Services Grid */}
      <ServicesGrid
        title={landingContent.services.title}
        subtitle={landingContent.services.subtitle}
        services={landingContent.services.items}
      />

      {/* Benefits Section */}
      <BenefitsSection
        title={landingContent.benefits.title}
        subtitle={landingContent.benefits.subtitle}
        benefits={landingContent.benefits.items}
      />

      {/* Stats Banner */}
      <StatsBanner
        title={landingContent.stats.title}
        stats={landingContent.stats.items}
      />

      {/* News Carousel */}
      <NewsCarousel
        title={landingContent.news.title}
        viewAllText={landingContent.news.viewAllText}
        news={landingContent.news.items}
      />

      {/* Partners Strip */}
      <PartnersStrip
        title={landingContent.partners.title}
        subtitle={landingContent.partners.subtitle}
        partners={landingContent.partners.logos}
      />

      {/* Testimonials */}
      <TestimonialsSlider
        title={landingContent.testimonials.title}
        testimonials={landingContent.testimonials.items}
      />

      {/* Final CTA */}
      <CallToAction
        title={landingContent.cta.title}
        subtitle={landingContent.cta.subtitle}
        buttonText={landingContent.cta.buttonText}
        buttonLink={landingContent.cta.buttonLink}
      />
    </div>
  )
}
