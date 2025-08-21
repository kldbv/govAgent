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
        const industry = userProfile.industry.toLowerCase();
        let score = 0;
        const reasons = [];
        if (industry.includes('it') || industry.includes('технолог')) {
            if (title.includes('it') || description.includes('технолог') || description.includes('цифров')) {
                score += 25;
                reasons.push('Специально для IT-сферы');
            }
        }
        if (industry.includes('производств') || industry.includes('manufacturing')) {
            if (description.includes('производств') || description.includes('промышленн')) {
                score += 25;
                reasons.push('Поддержка производственного сектора');
            }
        }
        if (industry.includes('сельск') || industry.includes('агро')) {
            if (description.includes('сельск') || description.includes('агро')) {
                score += 25;
                reasons.push('Поддержка сельского хозяйства');
            }
        }
        if (industry.includes('услуг') || industry.includes('сервис')) {
            if (description.includes('услуг') || description.includes('сервис')) {
                score += 20;
                reasons.push('Поддержка сферы услуг');
            }
        }
        if (industry.includes('туризм')) {
            if (description.includes('туризм')) {
                score += 25;
                reasons.push('Поддержка туристической отрасли');
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
}
exports.RecommendationService = RecommendationService;
//# sourceMappingURL=RecommendationService.js.map