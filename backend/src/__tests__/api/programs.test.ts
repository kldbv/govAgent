import request from 'supertest';
import express from 'express';
import cors from 'cors';
import programRoutes from '../../routes/programs';
import { errorHandler } from '../../middleware/errorHandler';

// Mock database
const mockQuery = jest.fn();
jest.mock('../../utils/database', () => ({
  query: mockQuery
}));

// Mock services
jest.mock('../../services/RecommendationService');
jest.mock('../../services/GuidanceService');
jest.mock('../../services/InstructionService');

describe('Programs API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/programs', programRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/programs', () => {
    it('should return list of programs', async () => {
      const mockPrograms = [
        {
          id: 1,
          title: 'Test Program 1',
          description: 'Test description',
          organization: 'Test Org',
          program_type: 'Grant',
          funding_amount: 1000000
        },
        {
          id: 2,
          title: 'Test Program 2',
          description: 'Test description 2',
          organization: 'Test Org 2',
          program_type: 'Loan',
          funding_amount: 2000000
        }
      ];

      // Mock the database query for programs
      mockQuery
        .mockResolvedValueOnce({ rows: mockPrograms }) // Main query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }); // Count query

      const response = await request(app)
        .get('/api/programs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.programs).toHaveLength(2);
      expect(response.body.data.programs[0].title).toBe('Test Program 1');
      expect(response.body.data.pagination).toHaveProperty('total', 2);
    });

    it('should handle program filtering by type', async () => {
      const mockPrograms = [
        {
          id: 1,
          title: 'Grant Program',
          program_type: 'Grant',
          funding_amount: 1000000
        }
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: mockPrograms })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] });

      const response = await request(app)
        .get('/api/programs?program_type=Grant')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.programs).toHaveLength(1);
      expect(response.body.data.programs[0].program_type).toBe('Grant');
    });

    it('should handle pagination', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '50' }] });

      const response = await request(app)
        .get('/api/programs?page=2&limit=10')
        .expect(200);

      expect(response.body.data.pagination.current_page).toBe(2);
      expect(response.body.data.pagination.per_page).toBe(10);
      expect(response.body.data.pagination.total_pages).toBe(5);
    });
  });

  describe('GET /api/programs/search', () => {
    it('should search programs by text', async () => {
      const mockPrograms = [
        {
          id: 1,
          title: 'IT Development Program',
          description: 'Support for IT businesses',
          relevance_score: 0.95
        }
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: mockPrograms })
        .mockResolvedValueOnce({ rows: [{ total: '1' }] });

      const response = await request(app)
        .get('/api/programs/search?search=IT')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.programs).toHaveLength(1);
      expect(response.body.data.programs[0].title).toContain('IT');
    });

    it('should search with multiple filters', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      const response = await request(app)
        .get('/api/programs/search?search=startup&region=Алматы&min_funding=1000000')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('plainto_tsquery'),
        expect.arrayContaining(['startup'])
      );
    });
  });

  describe('GET /api/programs/stats', () => {
    it('should return program statistics', async () => {
      const mockTypeStats = [
        { program_type: 'Grant', count: '10' },
        { program_type: 'Loan', count: '8' }
      ];

      const mockOrgStats = [
        { organization: 'DAMU Fund', count: '5' },
        { organization: 'KazInnovations', count: '7' }
      ];

      const mockRegionStats = [
        { region: 'Алматы', count: '8' },
        { region: 'Астана', count: '6' }
      ];

      const mockFundingStats = [{
        min_funding: '100000',
        max_funding: '50000000',
        avg_funding: '5000000',
        total_programs: '18'
      }];

      mockQuery
        .mockResolvedValueOnce({ rows: mockTypeStats })
        .mockResolvedValueOnce({ rows: mockOrgStats })
        .mockResolvedValueOnce({ rows: mockRegionStats })
        .mockResolvedValueOnce({ rows: mockFundingStats });

      const response = await request(app)
        .get('/api/programs/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toHaveProperty('total_programs', 18);
      expect(response.body.data.stats.by_type).toHaveProperty('Grant', 10);
      expect(response.body.data.stats.by_organization).toHaveProperty('DAMU Fund', 5);
      expect(response.body.data.stats.funding_range).toHaveProperty('average', 5000000);
    });
  });

  describe('GET /api/programs/:id', () => {
    it('should return single program by ID', async () => {
      const mockProgram = {
        id: 1,
        title: 'Test Program',
        description: 'Test description',
        organization: 'Test Org',
        program_type: 'Grant',
        funding_amount: 1000000,
        application_deadline: '2024-12-31'
      };

      mockQuery.mockResolvedValueOnce({ rows: [mockProgram] });

      const response = await request(app)
        .get('/api/programs/1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.program.id).toBe(1);
      expect(response.body.data.program.title).toBe('Test Program');
    });

    it('should return 404 for non-existent program', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/programs/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Program not found');
    });

    it('should handle invalid program ID', async () => {
      const response = await request(app)
        .get('/api/programs/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/programs')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('error');
    });

    it('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/programs?page=invalid&limit=abc')
        .expect(200); // Should still work with default values

      expect(response.body.data.pagination.current_page).toBe(1);
      expect(response.body.data.pagination.per_page).toBe(10);
    });
  });

  describe('Advanced filtering', () => {
    it('should filter by region array', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await request(app)
        .get('/api/programs?region=Алматы')
        .expect(200);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('supported_regions IS NULL OR'),
        expect.arrayContaining(['Алматы'])
      );
    });

    it('should filter by OKED code with hierarchy', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await request(app)
        .get('/api/programs?oked_code=62.01')
        .expect(200);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('oked_filters'),
        expect.arrayContaining(['62.01'])
      );
    });

    it('should filter by loan amount range', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await request(app)
        .get('/api/programs?min_amount=1000000&max_amount=5000000')
        .expect(200);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('max_loan_amount'),
        expect.arrayContaining([1000000, 5000000])
      );
    });
  });
});
