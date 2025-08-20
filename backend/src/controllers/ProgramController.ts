import { Request, Response } from 'express';
import pool from '../utils/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { RecommendationService } from '../services/RecommendationService';

export class ProgramController {
  private recommendationService = new RecommendationService();

  getPrograms = asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = 1, 
      limit = 10, 
      program_type, 
      target_audience, 
      organization, 
      search,
      // New BPM-aligned filters
      region,
      oked_code,
      min_amount,
      max_amount,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const open_only = (req.query.open_only === '1' || req.query.open_only === 'true');
    
    let query = `
      SELECT id, title, description, organization, program_type, target_audience,
             funding_amount, application_deadline, requirements, benefits,
             application_process, contact_info, created_at,
             supported_regions, min_loan_amount, max_loan_amount, oked_filters,
             required_documents, application_steps
      FROM business_programs 
      WHERE is_active = true
    `;
    
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Traditional filters
    if (program_type) {
      query += ` AND program_type = $${paramIndex}`;
      queryParams.push(program_type);
      paramIndex++;
    }

    if (target_audience) {
      query += ` AND target_audience ILIKE $${paramIndex}`;
      queryParams.push(`%${target_audience}%`);
      paramIndex++;
    }

    if (organization) {
      query += ` AND organization ILIKE $${paramIndex}`;
      queryParams.push(`%${organization}%`);
      paramIndex++;
    }

    if (search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // New BMP-aligned filters
    if (open_only) {
      query += ` AND (COALESCE(opens_at, NOW() - INTERVAL '100 years') <= NOW())`;
      query += ` AND (COALESCE(closes_at, application_deadline, NOW() + INTERVAL '100 years') >= NOW())`;
    }

    if (region) {
      query += ` AND (supported_regions IS NULL OR $${paramIndex} = ANY(supported_regions))`;
      queryParams.push(region);
      paramIndex++;
    }

    if (oked_code) {
      query += ` AND (oked_filters IS NULL OR $${paramIndex} = ANY(oked_filters) OR EXISTS (
        SELECT 1 FROM unnest(oked_filters) as filter 
        WHERE $${paramIndex} LIKE filter || '%' OR filter LIKE substring($${paramIndex}, 1, 1) || '%'
      ))`;
      queryParams.push(oked_code);
      paramIndex++;
    }

    if (min_amount) {
      query += ` AND (max_loan_amount IS NULL OR max_loan_amount >= $${paramIndex})`;
      queryParams.push(Number(min_amount));
      paramIndex++;
    }

    if (max_amount) {
      query += ` AND (min_loan_amount IS NULL OR min_loan_amount <= $${paramIndex})`;
      queryParams.push(Number(max_amount));
      paramIndex++;
    }

    // Dynamic sorting
    const allowedSorts = ['created_at', 'funding_amount', 'application_deadline', 'title'];
    const sortColumn = allowedSorts.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';
    
    // Add ordering and pagination
    query += ` ORDER BY ${sortColumn} ${sortDirection} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(Number(limit), offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM business_programs 
      WHERE is_active = true
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (program_type) {
      countQuery += ` AND program_type = $${countParamIndex}`;
      countParams.push(program_type);
      countParamIndex++;
    }

    if (target_audience) {
      countQuery += ` AND target_audience ILIKE $${countParamIndex}`;
      countParams.push(`%${target_audience}%`);
      countParamIndex++;
    }

    if (organization) {
      countQuery += ` AND organization ILIKE $${countParamIndex}`;
      countParams.push(`%${organization}%`);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (open_only) {
      countQuery += ` AND (COALESCE(opens_at, NOW() - INTERVAL '100 years') <= NOW())`;
      countQuery += ` AND (COALESCE(closes_at, application_deadline, NOW() + INTERVAL '100 years') >= NOW())`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        programs: result.rows,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  });

  getProgramById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, title, description, organization, program_type, target_audience,
              funding_amount, application_deadline, requirements, benefits,
              application_process, contact_info, created_at
       FROM business_programs 
       WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Program not found', 404);
    }

    res.json({
      success: true,
      data: { program: result.rows[0] },
    });
  });

  getRecommendations = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;

    // Get user profile
    const profileResult = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      throw new AppError('User profile not found. Please complete your profile first.', 400);
    }

    const userProfile = profileResult.rows[0];

    // Get all active programs
    const programsResult = await pool.query(
      `SELECT id, title, description, organization, program_type, target_audience,
              funding_amount, application_deadline, requirements, benefits,
              application_process, contact_info, created_at
       FROM business_programs 
       WHERE is_active = true
       ORDER BY created_at DESC`
    );

    const programs = programsResult.rows;
    
    // Get recommendations using the recommendation service
    const recommendations = await this.recommendationService.getRecommendations(
      userProfile,
      programs
    );

    res.json({
      success: true,
      data: { recommendations },
    });
  });

  getProgramStats = asyncHandler(async (req: Request, res: Response) => {
    // Get stats by type
    const typeStatsResult = await pool.query(
      `SELECT program_type, COUNT(*) as count 
       FROM business_programs 
       WHERE is_active = true 
       GROUP BY program_type`
    );

    // Get stats by organization
    const orgStatsResult = await pool.query(
      `SELECT organization, COUNT(*) as count 
       FROM business_programs 
       WHERE is_active = true 
       GROUP BY organization`
    );

    // Get stats by region (unnest supported_regions)
    const regionStatsResult = await pool.query(
      `SELECT unnest(supported_regions) as region, COUNT(*) as count 
       FROM business_programs 
       WHERE is_active = true AND supported_regions IS NOT NULL
       GROUP BY region`
    );

    // Get funding range stats
    const fundingStatsResult = await pool.query(
      `SELECT 
         MIN(funding_amount) as min_funding,
         MAX(funding_amount) as max_funding,
         AVG(funding_amount) as avg_funding,
         COUNT(*) as total_programs
       FROM business_programs 
       WHERE is_active = true AND funding_amount IS NOT NULL`
    );

    const byType: Record<string, number> = {};
    typeStatsResult.rows.forEach(row => {
      byType[row.program_type] = parseInt(row.count);
    });

    const byOrganization: Record<string, number> = {};
    orgStatsResult.rows.forEach(row => {
      byOrganization[row.organization] = parseInt(row.count);
    });

    const byRegion: Record<string, number> = {};
    regionStatsResult.rows.forEach(row => {
      byRegion[row.region] = parseInt(row.count);
    });

    const fundingStats = fundingStatsResult.rows[0];

    res.json({
      success: true,
      data: {
        stats: {
          total_programs: parseInt(fundingStats?.total_programs || '0'),
          by_type: byType,
          by_organization: byOrganization,
          by_region: byRegion,
          funding_range: {
            min: parseFloat(fundingStats?.min_funding || '0'),
            max: parseFloat(fundingStats?.max_funding || '0'),
            average: parseFloat(fundingStats?.avg_funding || '0')
          }
        }
      }
    });
  });

  searchPrograms = asyncHandler(async (req: Request, res: Response) => {
    const { 
      page = 1, 
      limit = 12, 
      search,
      program_type, 
      organization,
      region,
      oked_code,
      min_funding,
      max_funding,
      business_type,
      business_size,
      sort = 'relevance'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const open_only = (req.query.open_only === '1' || req.query.open_only === 'true');
    
    let query = `
      SELECT p.id, p.title, p.description, p.organization, p.program_type, p.target_audience,
             p.funding_amount, p.application_deadline, p.requirements, p.benefits,
             p.application_process, p.contact_info, p.created_at,
             p.supported_regions, p.min_loan_amount, p.max_loan_amount, p.oked_filters,
             p.required_documents, p.application_steps,
             CASE WHEN $1::text IS NOT NULL THEN
               ts_rank(to_tsvector('russian', p.title || ' ' || p.description), plainto_tsquery('russian', $1::text))
             ELSE 0 END as relevance_score
      FROM business_programs p
      WHERE p.is_active = true
    `;
    
    const queryParams: any[] = [search || null];
    let paramIndex = 2;

    // Text search
    if (search) {
      query += ` AND (to_tsvector('russian', p.title || ' ' || p.description) @@ plainto_tsquery('russian', $1))`;
    }

    // Program type filter
    if (program_type) {
      query += ` AND p.program_type = $${paramIndex}`;
      queryParams.push(program_type);
      paramIndex++;
    }

    // Organization filter
    if (organization) {
      query += ` AND p.organization = $${paramIndex}`;
      queryParams.push(organization);
      paramIndex++;
    }

    // Region filter
    if (region) {
      query += ` AND (p.supported_regions IS NULL OR $${paramIndex} = ANY(p.supported_regions))`;
      queryParams.push(region);
      paramIndex++;
    }

    // Open only filter
    if (open_only) {
      query += ` AND (COALESCE(p.opens_at, NOW() - INTERVAL '100 years') <= NOW())`;
      query += ` AND (COALESCE(p.closes_at, p.application_deadline, NOW() + INTERVAL '100 years') >= NOW())`;
    }

    // OKED filter with hierarchical matching
    if (oked_code) {
      query += ` AND (p.oked_filters IS NULL OR $${paramIndex} = ANY(p.oked_filters) OR EXISTS (
        SELECT 1 FROM unnest(p.oked_filters) as filter 
        WHERE $${paramIndex} LIKE filter || '%' OR filter LIKE substring($${paramIndex}, 1, 1) || '%'
      ))`;
      queryParams.push(oked_code);
      paramIndex++;
    }

    // Funding range filters
    if (min_funding) {
      query += ` AND (p.funding_amount IS NULL OR p.funding_amount >= $${paramIndex})`;
      queryParams.push(Number(min_funding));
      paramIndex++;
    }

    if (max_funding) {
      query += ` AND (p.funding_amount IS NULL OR p.funding_amount <= $${paramIndex})`;
      queryParams.push(Number(max_funding));
      paramIndex++;
    }

    // Business type/size filters (match against target_audience)
    if (business_type) {
      query += ` AND p.target_audience ILIKE $${paramIndex}`;
      queryParams.push(`%${business_type}%`);
      paramIndex++;
    }

    if (business_size) {
      query += ` AND p.target_audience ILIKE $${paramIndex}`;
      queryParams.push(`%${business_size}%`);
      paramIndex++;
    }

    // Sorting
    let orderClause = '';
    switch (sort) {
      case 'funding_amount':
        orderClause = 'ORDER BY p.funding_amount DESC NULLS LAST';
        break;
      case 'deadline':
        orderClause = 'ORDER BY p.application_deadline ASC NULLS LAST';
        break;
      case 'newest':
        orderClause = 'ORDER BY p.created_at DESC';
        break;
      case 'title':
        orderClause = 'ORDER BY p.title ASC';
        break;
      case 'relevance':
      default:
        orderClause = search 
          ? 'ORDER BY relevance_score DESC, p.created_at DESC'
          : 'ORDER BY p.created_at DESC';
        break;
    }
    
    query += ` ${orderClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(Number(limit), offset);

    const result = await pool.query(query, queryParams);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM business_programs p
      WHERE p.is_active = true
    `;
    
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (to_tsvector('russian', p.title || ' ' || p.description) @@ plainto_tsquery('russian', $${countParamIndex}))`;
      countParams.push(search);
      countParamIndex++;
    }

    if (program_type) {
      countQuery += ` AND p.program_type = $${countParamIndex}`;
      countParams.push(program_type);
      countParamIndex++;
    }

    if (organization) {
      countQuery += ` AND p.organization = $${countParamIndex}`;
      countParams.push(organization);
      countParamIndex++;
    }

    if (region) {
      countQuery += ` AND (p.supported_regions IS NULL OR $${countParamIndex} = ANY(p.supported_regions))`;
      countParams.push(region);
      countParamIndex++;
    }

    if (open_only) {
      countQuery += ` AND (COALESCE(p.opens_at, NOW() - INTERVAL '100 years') <= NOW())`;
      countQuery += ` AND (COALESCE(p.closes_at, p.application_deadline, NOW() + INTERVAL '100 years') >= NOW())`;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: {
        programs: result.rows,
        pagination: {
          current_page: Number(page),
          per_page: Number(limit),
          total,
          total_pages: Math.ceil(total / Number(limit)),
          has_next: Number(page) * Number(limit) < total,
          has_prev: Number(page) > 1
        }
      }
    });
  });
}
