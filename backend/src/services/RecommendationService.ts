import { UserProfile, BusinessProgram } from '../utils/database';

interface ProgramWithScore extends BusinessProgram {
  score: number;
  matchReasons: string[];
}

export class RecommendationService {
  async getRecommendations(
    userProfile: UserProfile, 
    programs: BusinessProgram[]
  ): Promise<ProgramWithScore[]> {
    const scoredPrograms: ProgramWithScore[] = programs.map(program => {
      const { score, reasons } = this.calculateMatchScore(userProfile, program);
      return {
        ...program,
        score,
        matchReasons: reasons,
      };
    });

    // Sort by score (highest first) and return top matches
    return scoredPrograms
      .filter(program => program.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Return top 10 recommendations
  }

  private calculateMatchScore(
    userProfile: UserProfile, 
    program: BusinessProgram
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // Business type matching
    const businessTypeScore = this.matchBusinessType(userProfile, program);
    score += businessTypeScore.score;
    reasons.push(...businessTypeScore.reasons);

    // Business size matching
    const businessSizeScore = this.matchBusinessSize(userProfile, program);
    score += businessSizeScore.score;
    reasons.push(...businessSizeScore.reasons);

    // Industry matching
    const industryScore = this.matchIndustry(userProfile, program);
    score += industryScore.score;
    reasons.push(...industryScore.reasons);

    // Experience matching
    const experienceScore = this.matchExperience(userProfile, program);
    score += experienceScore.score;
    reasons.push(...experienceScore.reasons);

    // Revenue matching
    const revenueScore = this.matchRevenue(userProfile, program);
    score += revenueScore.score;
    reasons.push(...revenueScore.reasons);

    return { score: Math.round(score), reasons };
  }

  private matchBusinessType(
    userProfile: UserProfile, 
    program: BusinessProgram
  ): { score: number; reasons: string[] } {
    const targetAudience = program.target_audience.toLowerCase();
    const businessType = userProfile.business_type;
    
    let score = 0;
    const reasons: string[] = [];

    // Direct business type matches
    if (businessType === 'startup' && targetAudience.includes('стартап')) {
      score += 30;
      reasons.push('Программа специально для стартапов');
    }

    if (businessType === 'sme' && (targetAudience.includes('мсб') || targetAudience.includes('малый и средний бизнес'))) {
      score += 30;
      reasons.push('Программа для малого и среднего бизнеса');
    }

    if (businessType === 'individual' && targetAudience.includes('индивидуальн')) {
      score += 30;
      reasons.push('Программа для индивидуальных предпринимателей');
    }

    if (businessType === 'ngo' && targetAudience.includes('нко')) {
      score += 30;
      reasons.push('Программа для некоммерческих организаций');
    }

    // General business support
    if (targetAudience.includes('предпринимател') || targetAudience.includes('бизнес')) {
      score += 15;
      reasons.push('Общая поддержка предпринимательства');
    }

    return { score, reasons };
  }

  private matchBusinessSize(
    userProfile: UserProfile, 
    program: BusinessProgram
  ): { score: number; reasons: string[] } {
    const targetAudience = program.target_audience.toLowerCase();
    const businessSize = userProfile.business_size;
    
    let score = 0;
    const reasons: string[] = [];

    if (businessSize === 'micro' && targetAudience.includes('микро')) {
      score += 20;
      reasons.push('Подходит для микробизнеса');
    }

    if (businessSize === 'small' && targetAudience.includes('малый')) {
      score += 20;
      reasons.push('Подходит для малого бизнеса');
    }

    if (businessSize === 'medium' && targetAudience.includes('средний')) {
      score += 20;
      reasons.push('Подходит для среднего бизнеса');
    }

    if (businessSize === 'large' && targetAudience.includes('крупный')) {
      score += 20;
      reasons.push('Подходит для крупного бизнеса');
    }

    return { score, reasons };
  }

  private matchIndustry(
    userProfile: UserProfile, 
    program: BusinessProgram
  ): { score: number; reasons: string[] } {
    const description = program.description.toLowerCase();
    const title = program.title.toLowerCase();
    const industry = userProfile.industry.toLowerCase();
    
    let score = 0;
    const reasons: string[] = [];

    // IT industry matching
    if (industry.includes('it') || industry.includes('технолог')) {
      if (title.includes('it') || description.includes('технолог') || description.includes('цифров')) {
        score += 25;
        reasons.push('Специально для IT-сферы');
      }
    }

    // Manufacturing
    if (industry.includes('производств') || industry.includes('manufacturing')) {
      if (description.includes('производств') || description.includes('промышленн')) {
        score += 25;
        reasons.push('Поддержка производственного сектора');
      }
    }

    // Agriculture
    if (industry.includes('сельск') || industry.includes('агро')) {
      if (description.includes('сельск') || description.includes('агро')) {
        score += 25;
        reasons.push('Поддержка сельского хозяйства');
      }
    }

    // Services
    if (industry.includes('услуг') || industry.includes('сервис')) {
      if (description.includes('услуг') || description.includes('сервис')) {
        score += 20;
        reasons.push('Поддержка сферы услуг');
      }
    }

    // Tourism
    if (industry.includes('туризм')) {
      if (description.includes('туризм')) {
        score += 25;
        reasons.push('Поддержка туристической отрасли');
      }
    }

    return { score, reasons };
  }

  private matchExperience(
    userProfile: UserProfile, 
    program: BusinessProgram
  ): { score: number; reasons: string[] } {
    const description = program.description.toLowerCase();
    const title = program.title.toLowerCase();
    const experienceYears = userProfile.experience_years;
    
    let score = 0;
    const reasons: string[] = [];

    if (experienceYears <= 2) {
      if (title.includes('начинающ') || description.includes('начинающ') || 
          title.includes('стартап') || description.includes('новый бизнес')) {
        score += 20;
        reasons.push('Подходит для начинающих предпринимателей');
      }
    }

    if (experienceYears >= 5) {
      if (description.includes('опытн') || description.includes('развит') || 
          description.includes('расширен')) {
        score += 15;
        reasons.push('Программа для развития существующего бизнеса');
      }
    }

    return { score, reasons };
  }

  private matchRevenue(
    userProfile: UserProfile, 
    program: BusinessProgram
  ): { score: number; reasons: string[] } {
    const fundingAmount = program.funding_amount;
    const annualRevenue = userProfile.annual_revenue;
    
    let score = 0;
    const reasons: string[] = [];

    if (fundingAmount && annualRevenue) {
      // If funding is significant relative to revenue, it's more relevant
      const fundingToRevenueRatio = fundingAmount / annualRevenue;
      
      if (fundingToRevenueRatio >= 0.1) { // 10% or more of annual revenue
        score += 15;
        reasons.push('Размер финансирования соответствует масштабу бизнеса');
      }
    }

    if (!annualRevenue || annualRevenue === 0) {
      if (program.title.toLowerCase().includes('грант') || 
          program.title.toLowerCase().includes('микрокредит')) {
        score += 10;
        reasons.push('Подходит для стартового финансирования');
      }
    }

    return { score, reasons };
  }
}
