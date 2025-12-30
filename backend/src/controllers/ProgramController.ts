import { Request, Response } from 'express';
import pool from '../utils/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { RecommendationService } from '../services/RecommendationService';
import {
  buildProgramFilters,
  buildOrderClause,
  parseBooleanParam,
  PROGRAM_SELECT_FIELDS,
  PROGRAM_SELECT_FIELDS_EXTENDED,
  ProgramFilters
} from '../utils/queryBuilder';

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
      region,
      oked_code,
      min_amount,
      max_amount,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const open_only = parseBooleanParam(req.query.open_only);

    // Build filters using shared utility
    const filters: ProgramFilters = {
      program_type: program_type as string,
      target_audience: target_audience as string,
      organization: organization as string,
      search: search as string,
      region: region as string,
      oked_code: oked_code as string,
      min_amount: min_amount ? Number(min_amount) : undefined,
      max_amount: max_amount ? Number(max_amount) : undefined,
      open_only
    };

    const { whereClause, params, nextParamIndex } = buildProgramFilters(filters);

    // Build main query
    let query = `
      SELECT ${PROGRAM_SELECT_FIELDS}
      FROM business_programs
      WHERE is_active = true
    `;

    if (whereClause) {
      query += ` AND ${whereClause}`;
    }

    // Dynamic sorting
    const allowedSorts = ['created_at', 'funding_amount', 'application_deadline', 'title'];
    const sortColumn = allowedSorts.includes(sort_by as string) ? sort_by : 'created_at';
    const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${sortColumn} ${sortDirection} LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Get total count using same filters
    const { whereClause: countWhereClause, params: countParams } = buildProgramFilters(filters);

    let countQuery = `
      SELECT COUNT(*) as total
      FROM business_programs
      WHERE is_active = true
    `;

    if (countWhereClause) {
      countQuery += ` AND ${countWhereClause}`;
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
      `SELECT ${PROGRAM_SELECT_FIELDS_EXTENDED}
       FROM business_programs
       WHERE id = $1 AND is_active = true`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Program not found', 404);
    }

    // Map database fields to API response
    const program = {
      ...result.rows[0],
      eligible_regions: result.rows[0].supported_regions,
      eligible_oked_codes: result.rows[0].oked_filters,
    };

    res.json({
      success: true,
      data: { program },
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

    // Get active programs with pagination limit
    const programsResult = await pool.query(
      `SELECT ${PROGRAM_SELECT_FIELDS}
       FROM business_programs
       WHERE is_active = true
       ORDER BY created_at DESC
       LIMIT 100`
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
    const open_only = parseBooleanParam(req.query.open_only);
    const hasSearch = Boolean(search);

    // Build filters using shared utility
    const filters: ProgramFilters = {
      program_type: program_type as string,
      organization: organization as string,
      region: region as string,
      oked_code: oked_code as string,
      min_funding: min_funding ? Number(min_funding) : undefined,
      max_funding: max_funding ? Number(max_funding) : undefined,
      business_type: business_type as string,
      business_size: business_size as string,
      open_only
    };

    // For full-text search, we handle it separately
    const { whereClause, params, nextParamIndex } = buildProgramFilters(filters, 2, 'p');

    // Build main query with full-text search support
    let query = `
      SELECT ${PROGRAM_SELECT_FIELDS.split(',').map(f => `p.${f.trim()}`).join(', ')},
             CASE WHEN $1::text IS NOT NULL THEN
               ts_rank(to_tsvector('russian', p.title || ' ' || p.description), plainto_tsquery('russian', $1::text))
             ELSE 0 END as relevance_score
      FROM business_programs p
      WHERE p.is_active = true
    `;

    const queryParams: any[] = [search || null, ...params];

    // Add full-text search condition
    if (hasSearch) {
      query += ` AND (to_tsvector('russian', p.title || ' ' || p.description) @@ plainto_tsquery('russian', $1))`;
    }

    if (whereClause) {
      query += ` AND ${whereClause}`;
    }

    // Add ordering
    const orderClause = buildOrderClause(sort as string, 'p', hasSearch);
    query += ` ${orderClause} LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}`;
    queryParams.push(Number(limit), offset);

    const result = await pool.query(query, queryParams);

    // Get total count
    const { whereClause: countWhereClause, params: countParams } = buildProgramFilters(filters, hasSearch ? 2 : 1, 'p');

    let countQuery = `
      SELECT COUNT(*) as total
      FROM business_programs p
      WHERE p.is_active = true
    `;

    const countQueryParams: any[] = hasSearch ? [search, ...countParams] : countParams;

    if (hasSearch) {
      countQuery += ` AND (to_tsvector('russian', p.title || ' ' || p.description) @@ plainto_tsquery('russian', $1))`;
    }

    if (countWhereClause) {
      countQuery += ` AND ${countWhereClause}`;
    }

    const countResult = await pool.query(countQuery, countQueryParams);
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
