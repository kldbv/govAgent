"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationService = void 0;
class RecommendationService {
    async getRecommendations(userProfile, programs) {
        const scoredPrograms = programs.map(program => {
            const { score, reasons } = this.calculateMatchScore(userProfile, program);
            return {
                ...program,
                score,
                matchReasons: reasons,
            };
        });
        return scoredPrograms
            .filter(program => program.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    calculateMatchScore(userProfile, program) {
        let score = 0;
        const reasons = [];
        const businessTypeScore = this.matchBusinessType(userProfile, program);
        score += businessTypeScore.score;
        reasons.push(...businessTypeScore.reasons);
        const businessSizeScore = this.matchBusinessSize(userProfile, program);
        score += businessSizeScore.score;
        reasons.push(...businessSizeScore.reasons);
        const industryScore = this.matchIndustry(userProfile, program);
        score += industryScore.score;
        reasons.push(...industryScore.reasons);
        const okedScore = this.matchOkedCode(userProfile, program);
        score += okedScore.score;
        reasons.push(...okedScore.reasons);
        const regionScore = this.matchRegion(userProfile, program);
        score += regionScore.score;
        reasons.push(...regionScore.reasons);
        const loanScore = this.matchLoanAmount(userProfile, program);
        score += loanScore.score;
        reasons.push(...loanScore.reasons);
        const experienceScore = this.matchExperience(userProfile, program);
        score += experienceScore.score;
        reasons.push(...experienceScore.reasons);
        const revenueScore = this.matchRevenue(userProfile, program);
        score += revenueScore.score;
        reasons.push(...revenueScore.reasons);
        return { score: Math.round(score), reasons };
    }
    matchBusinessType(userProfile, program) {
        const targetAudience = program.target_audience.toLowerCase();
        const businessType = userProfile.business_type;
        let score = 0;
        const reasons = [];
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
        if (targetAudience.includes('предпринимател') || targetAudience.includes('бизнес')) {
            score += 15;
            reasons.push('Общая поддержка предпринимательства');
        }
        return { score, reasons };
    }
    matchBusinessSize(userProfile, program) {
        const targetAudience = program.target_audience.toLowerCase();
        const businessSize = userProfile.business_size;
        let score = 0;
        const reasons = [];
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
    matchIndustry(userProfile, program) {
        const description = program.description.toLowerCase();
        const title = program.title.toLowerCase();
        const targetAudience = program.target_audience.toLowerCase();
        const industry = userProfile.industry.toLowerCase();
        const combinedText = `${title} ${description} ${targetAudience}`;
        let score = 0;
        const reasons = [];
        if (industry.includes('it') || industry.includes('технолог') || industry.includes('информацион')) {
            if (combinedText.includes('it') || combinedText.includes('технолог') ||
                combinedText.includes('цифров') || combinedText.includes('стартап')) {
                score += 35;
                reasons.push('Специально для IT-сферы');
            }
        }
        if (industry.includes('производств') || industry.includes('manufacturing') ||
            industry.includes('промышлен') || industry.includes('обрабатыва')) {
            if (combinedText.includes('производств') || combinedText.includes('промышленн') ||
                combinedText.includes('индустриал') || combinedText.includes('обрабатыва') ||
                combinedText.includes('экспорт')) {
                score += 35;
                reasons.push('Поддержка производственного сектора');
            }
        }
        if (industry.includes('сельск') || industry.includes('агро') || industry.includes('фермер')) {
            if (combinedText.includes('сельск') || combinedText.includes('агро') ||
                combinedText.includes('фермер') || combinedText.includes('апк')) {
                score += 35;
                reasons.push('Поддержка сельского хозяйства');
            }
        }
        if (industry.includes('услуг') || industry.includes('сервис')) {
            if (combinedText.includes('услуг') || combinedText.includes('сервис')) {
                score += 30;
                reasons.push('Поддержка сферы услуг');
            }
        }
        if (industry.includes('туризм') || industry.includes('гостинич')) {
            if (combinedText.includes('туризм') || combinedText.includes('гостинич') ||
                combinedText.includes('туристич')) {
                score += 35;
                reasons.push('Поддержка туристической отрасли');
            }
        }
        if (industry.includes('торгов') || industry.includes('коммерц') || industry.includes('ритейл')) {
            if (combinedText.includes('торгов') || combinedText.includes('коммерц') ||
                combinedText.includes('экспорт')) {
                score += 30;
                reasons.push('Поддержка торговой деятельности');
            }
        }
        if (industry.includes('строитель') || industry.includes('недвижим')) {
            if (combinedText.includes('строитель') || combinedText.includes('недвижим')) {
                score += 30;
                reasons.push('Поддержка строительной отрасли');
            }
        }
        if (!industry.includes('it') && !industry.includes('технолог') && !industry.includes('информацион') && !industry.includes('телеком')) {
            const isITProgram = combinedText.includes('it-стартап') ||
                combinedText.includes('it стартап') ||
                (combinedText.includes('it') && combinedText.includes('стартап')) ||
                combinedText.includes('технологических стартап');
            if (isITProgram) {
                score -= 40;
                reasons.push('Программа не соответствует вашей отрасли');
            }
        }
        return { score, reasons };
    }
    matchExperience(userProfile, program) {
        const description = program.description.toLowerCase();
        const title = program.title.toLowerCase();
        const experienceYears = userProfile.experience_years;
        let score = 0;
        const reasons = [];
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
    matchRevenue(userProfile, program) {
        const fundingAmount = program.funding_amount;
        const annualRevenue = userProfile.annual_revenue;
        let score = 0;
        const reasons = [];
        if (fundingAmount && annualRevenue) {
            const fundingToRevenueRatio = fundingAmount / annualRevenue;
            if (fundingToRevenueRatio >= 0.1) {
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
    matchOkedCode(userProfile, program) {
        let score = 0;
        const reasons = [];
        if (userProfile.oked_code && program.oked_filters && program.oked_filters.length > 0) {
            const userOked = userProfile.oked_code;
            if (program.oked_filters.includes(userOked)) {
                score += 35;
                reasons.push('Точное соответствие по коду ОКЭД');
            }
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
    matchRegion(userProfile, program) {
        let score = 0;
        const reasons = [];
        if (program.supported_regions && program.supported_regions.length > 0) {
            if (program.supported_regions.includes(userProfile.region)) {
                score += 25;
                reasons.push('Программа действует в вашем регионе');
            }
            else if (program.supported_regions.includes('ALL')) {
                score += 15;
                reasons.push('Программа действует во всех регионах');
            }
        }
        else {
            score += 15;
            reasons.push('Программа без региональных ограничений');
        }
        return { score, reasons };
    }
    matchLoanAmount(userProfile, program) {
        let score = 0;
        const reasons = [];
        if (userProfile.desired_loan_amount && program.min_loan_amount && program.max_loan_amount) {
            const desired = userProfile.desired_loan_amount;
            const min = program.min_loan_amount;
            const max = program.max_loan_amount;
            if (desired >= min && desired <= max) {
                score += 30;
                reasons.push('Размер займа соответствует вашим потребностям');
            }
            else if (desired < min) {
                score += 15;
                reasons.push('Программа может покрыть ваши потребности в финансировании');
            }
            else if (desired > max) {
                score += 5;
                reasons.push('Программа может частично покрыть ваши потребности');
            }
        }
        else if (userProfile.desired_loan_amount && program.funding_amount) {
            const ratio = program.funding_amount / userProfile.desired_loan_amount;
            if (ratio >= 0.8 && ratio <= 1.5) {
                score += 20;
                reasons.push('Размер финансирования близок к желаемому');
            }
        }
        return { score, reasons };
    }
}
exports.RecommendationService = RecommendationService;
//# sourceMappingURL=RecommendationService.js.map