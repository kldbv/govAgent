import { RecommendationService } from '../../services/RecommendationService';

// Mock database
jest.mock('../../utils/database', () => ({
  query: jest.fn()
}));

describe('RecommendationService', () => {
  let recommendationService: RecommendationService;

  beforeEach(() => {
    recommendationService = new RecommendationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateMatchScore', () => {
    it('should return high score for perfect match', () => {
      const userProfile = {
        business_type: 'ТОО',
        business_size: 'Малый',
        industry: 'IT',
        region: 'Алматы',
        desired_loan_amount: 5000000,
        oked_code: '62.01'
      };

      const program = {
        target_audience: 'Малый бизнес',
        supported_regions: ['Алматы', 'Астана'],
        min_loan_amount: 1000000,
        max_loan_amount: 10000000,
        oked_filters: ['62.01', '62.02']
      };

      const score = recommendationService.calculateMatchScore(userProfile, program);
      
      expect(score).toBeGreaterThan(80);
    });

    it('should return low score for poor match', () => {
      const userProfile = {
        business_type: 'ТОО',
        business_size: 'Крупный',
        industry: 'Manufacturing',
        region: 'Шымкент',
        desired_loan_amount: 50000000,
        oked_code: '25.11'
      };

      const program = {
        target_audience: 'Малый бизнес',
        supported_regions: ['Алматы'],
        min_loan_amount: 1000000,
        max_loan_amount: 10000000,
        oked_filters: ['62.01']
      };

      const score = recommendationService.calculateMatchScore(userProfile, program);
      
      expect(score).toBeLessThan(50);
    });

    it('should handle missing profile fields gracefully', () => {
      const userProfile = {
        business_type: 'ТОО',
        business_size: 'Малый'
      };

      const program = {
        target_audience: 'Малый бизнес',
        supported_regions: ['Алматы'],
        min_loan_amount: 1000000,
        max_loan_amount: 10000000
      };

      expect(() => {
        recommendationService.calculateMatchScore(userProfile, program);
      }).not.toThrow();
    });
  });

  describe('validateBIN', () => {
    it('should validate correct BIN format', () => {
      const validBINs = [
        '123456789012',
        '987654321098'
      ];

      validBINs.forEach(bin => {
        expect(recommendationService.validateBIN(bin)).toBe(true);
      });
    });

    it('should reject invalid BIN format', () => {
      const invalidBINs = [
        '12345678901',  // too short
        '1234567890123', // too long
        '12345678901a',  // contains letter
        ''               // empty
      ];

      invalidBINs.forEach(bin => {
        expect(recommendationService.validateBIN(bin)).toBe(false);
      });
    });
  });

  describe('matchOKEDCodes', () => {
    it('should match exact OKED codes', () => {
      const userCode = '62.01';
      const programCodes = ['62.01', '62.02', '63.11'];
      
      expect(recommendationService.matchOKEDCodes(userCode, programCodes)).toBe(true);
    });

    it('should match hierarchical OKED codes', () => {
      const userCode = '62.01.1';
      const programCodes = ['62.01', '63.11'];
      
      expect(recommendationService.matchOKEDCodes(userCode, programCodes)).toBe(true);
    });

    it('should not match unrelated OKED codes', () => {
      const userCode = '25.11';
      const programCodes = ['62.01', '63.11'];
      
      expect(recommendationService.matchOKEDCodes(userCode, programCodes)).toBe(false);
    });

    it('should handle empty or null codes', () => {
      expect(recommendationService.matchOKEDCodes(null, ['62.01'])).toBe(false);
      expect(recommendationService.matchOKEDCodes('62.01', [])).toBe(false);
      expect(recommendationService.matchOKEDCodes('62.01', null)).toBe(false);
    });
  });

  describe('checkRegionOverlap', () => {
    it('should match exact region names', () => {
      const userRegion = 'Алматы';
      const programRegions = ['Алматы', 'Астана', 'Шымкент'];
      
      expect(recommendationService.checkRegionOverlap(userRegion, programRegions)).toBe(true);
    });

    it('should handle case-insensitive matching', () => {
      const userRegion = 'алматы';
      const programRegions = ['Алматы', 'Астана'];
      
      expect(recommendationService.checkRegionOverlap(userRegion, programRegions)).toBe(true);
    });

    it('should not match different regions', () => {
      const userRegion = 'Караганда';
      const programRegions = ['Алматы', 'Астана'];
      
      expect(recommendationService.checkRegionOverlap(userRegion, programRegions)).toBe(false);
    });

    it('should handle null/empty values', () => {
      expect(recommendationService.checkRegionOverlap(null, ['Алматы'])).toBe(false);
      expect(recommendationService.checkRegionOverlap('Алматы', [])).toBe(false);
      expect(recommendationService.checkRegionOverlap('Алматы', null)).toBe(false);
    });
  });

  describe('isLoanAmountInRange', () => {
    it('should return true for amount within range', () => {
      const amount = 5000000;
      const minLoan = 1000000;
      const maxLoan = 10000000;
      
      expect(recommendationService.isLoanAmountInRange(amount, minLoan, maxLoan)).toBe(true);
    });

    it('should return true for amount at boundaries', () => {
      const minLoan = 1000000;
      const maxLoan = 10000000;
      
      expect(recommendationService.isLoanAmountInRange(minLoan, minLoan, maxLoan)).toBe(true);
      expect(recommendationService.isLoanAmountInRange(maxLoan, minLoan, maxLoan)).toBe(true);
    });

    it('should return false for amount outside range', () => {
      const minLoan = 1000000;
      const maxLoan = 10000000;
      
      expect(recommendationService.isLoanAmountInRange(500000, minLoan, maxLoan)).toBe(false);
      expect(recommendationService.isLoanAmountInRange(15000000, minLoan, maxLoan)).toBe(false);
    });

    it('should handle null/undefined values', () => {
      expect(recommendationService.isLoanAmountInRange(null, 1000000, 10000000)).toBe(true);
      expect(recommendationService.isLoanAmountInRange(5000000, null, null)).toBe(true);
    });
  });

  describe('getScoreWeights', () => {
    it('should return default weights', () => {
      const weights = recommendationService.getScoreWeights();
      
      expect(weights).toHaveProperty('businessType');
      expect(weights).toHaveProperty('businessSize');
      expect(weights).toHaveProperty('industry');
      expect(weights).toHaveProperty('region');
      expect(weights).toHaveProperty('loanAmount');
      expect(weights).toHaveProperty('okedCode');
      expect(weights).toHaveProperty('bin');
      
      // Check that weights sum to 100
      const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      expect(totalWeight).toBe(100);
    });
  });
});
