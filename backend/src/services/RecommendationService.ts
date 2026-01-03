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

    // Industry/OKED matching
    const industryScore = this.matchIndustry(userProfile, program);
    score += industryScore.score;
    reasons.push(...industryScore.reasons);

    // OKED code matching (new BPM feature)
    const okedScore = this.matchOkedCode(userProfile, program);
    score += okedScore.score;
    reasons.push(...okedScore.reasons);

    // Region matching (new BPM feature)
    const regionScore = this.matchRegion(userProfile, program);
    score += regionScore.score;
    reasons.push(...regionScore.reasons);

    // Loan amount matching (new BPM feature)
    const loanScore = this.matchLoanAmount(userProfile, program);
    score += loanScore.score;
    reasons.push(...loanScore.reasons);

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
    const targetAudience = program.target_audience.toLowerCase();
    const industry = userProfile.industry.toLowerCase();
    const combinedText = `${title} ${description} ${targetAudience}`;

    let score = 0;
    const reasons: string[] = [];

    // IT industry matching
    if (industry.includes('it') || industry.includes('технолог') || industry.includes('информацион')) {
      if (combinedText.includes('it') || combinedText.includes('технолог') ||
          combinedText.includes('цифров') || combinedText.includes('стартап')) {
        score += 35;
        reasons.push('Специально для IT-сферы');
      }
    }

    // Manufacturing - check for production-related keywords
    if (industry.includes('производств') || industry.includes('manufacturing') ||
        industry.includes('промышлен') || industry.includes('обрабатыва')) {
      if (combinedText.includes('производств') || combinedText.includes('промышленн') ||
          combinedText.includes('индустриал') || combinedText.includes('обрабатыва') ||
          combinedText.includes('экспорт')) {
        score += 35;
        reasons.push('Поддержка производственного сектора');
      }
    }

    // Agriculture
    if (industry.includes('сельск') || industry.includes('агро') || industry.includes('фермер')) {
      if (combinedText.includes('сельск') || combinedText.includes('агро') ||
          combinedText.includes('фермер') || combinedText.includes('апк')) {
        score += 35;
        reasons.push('Поддержка сельского хозяйства');
      }
    }

    // Services
    if (industry.includes('услуг') || industry.includes('сервис')) {
      if (combinedText.includes('услуг') || combinedText.includes('сервис')) {
        score += 30;
        reasons.push('Поддержка сферы услуг');
      }
    }

    // Tourism
    if (industry.includes('туризм') || industry.includes('гостинич')) {
      if (combinedText.includes('туризм') || combinedText.includes('гостинич') ||
          combinedText.includes('туристич')) {
        score += 35;
        reasons.push('Поддержка туристической отрасли');
      }
    }

    // Trade/Commerce
    if (industry.includes('торгов') || industry.includes('коммерц') || industry.includes('ритейл')) {
      if (combinedText.includes('торгов') || combinedText.includes('коммерц') ||
          combinedText.includes('экспорт')) {
        score += 30;
        reasons.push('Поддержка торговой деятельности');
      }
    }

    // Construction
    if (industry.includes('строитель') || industry.includes('недвижим')) {
      if (combinedText.includes('строитель') || combinedText.includes('недвижим')) {
        score += 30;
        reasons.push('Поддержка строительной отрасли');
      }
    }

    // Apply negative score if program is clearly for different industry
    // This prevents IT programs from ranking high for manufacturing users
    if (!industry.includes('it') && !industry.includes('технолог') && !industry.includes('информацион') && !industry.includes('телеком')) {
      // Check if program is IT-focused (title and description already lowercase)
      const isITProgram = combinedText.includes('it-стартап') ||
                          combinedText.includes('it стартап') ||
                          (combinedText.includes('it') && combinedText.includes('стартап')) ||
                          combinedText.includes('технологических стартап');
      if (isITProgram) {
        score -= 40; // Strong penalty for IT programs when user is not in IT
        reasons.push('Программа не соответствует вашей отрасли');
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

  // New BPM-aligned matching methods
  private matchOkedCode(
    userProfile: UserProfile, 
    program: BusinessProgram
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    if (userProfile.oked_code && program.oked_filters && program.oked_filters.length > 0) {
      const userOked = userProfile.oked_code;
      
      // Exact match
      if (program.oked_filters.includes(userOked)) {
        score += 35;
        reasons.push('Точное соответствие по коду ОКЭД');
      } 
      // Parent category match (e.g., user has "62.01" and program accepts "J" or "62")
      else {
        for (const filter of program.oked_filters) {
          if (userOked.startsWith(filter) || filter.startsWith(userOked.substring(0, 1))) {
            score += 20;
            reasons.push('Соответствие по категории ОКЭД');
            break;
          }
        }
      }
    }

    return { score, reasons };
  }

  private matchRegion(
    userProfile: UserProfile, 
    program: BusinessProgram
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    if (program.supported_regions && program.supported_regions.length > 0) {
      if (program.supported_regions.includes(userProfile.region)) {
        score += 25;
        reasons.push('Программа действует в вашем регионе');
      } else if (program.supported_regions.includes('ALL')) {
        score += 15;
        reasons.push('Программа действует во всех регионах');
      }
    } else {
      // If no region restrictions, assume nationwide
      score += 15;
      reasons.push('Программа без региональных ограничений');
    }

    return { score, reasons };
  }

  private matchLoanAmount(
    userProfile: UserProfile, 
    program: BusinessProgram
  ): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    if (userProfile.desired_loan_amount && program.min_loan_amount && program.max_loan_amount) {
      const desired = userProfile.desired_loan_amount;
      const min = program.min_loan_amount;
      const max = program.max_loan_amount;

      if (desired >= min && desired <= max) {
        score += 30;
        reasons.push('Размер займа соответствует вашим потребностям');
      } else if (desired < min) {
        // User wants less, but program offers more - still relevant
        score += 15;
        reasons.push('Программа может покрыть ваши потребности в финансировании');
      } else if (desired > max) {
        // User wants more than program offers - less relevant
        score += 5;
        reasons.push('Программа может частично покрыть ваши потребности');
      }
    } else if (userProfile.desired_loan_amount && program.funding_amount) {
      // Fallback to general funding amount matching
      const ratio = program.funding_amount / userProfile.desired_loan_amount;
      if (ratio >= 0.8 && ratio <= 1.5) {
        score += 20;
        reasons.push('Размер финансирования близок к желаемому');
      }
    }

    return { score, reasons };
  }
}
