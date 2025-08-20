"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramController = void 0;
const database_1 = __importDefault(require("../utils/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const RecommendationService_1 = require("../services/RecommendationService");
class ProgramController {
    constructor() {
        this.recommendationService = new RecommendationService_1.RecommendationService();
        this.getPrograms = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 10, program_type, target_audience, organization, search, region, oked_code, min_amount, max_amount, sort_by = 'created_at', sort_order = 'DESC' } = req.query;
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
            const queryParams = [];
            let paramIndex = 1;
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
            const allowedSorts = ['created_at', 'funding_amount', 'application_deadline', 'title'];
            const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
            const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';
            query += ` ORDER BY ${sortColumn} ${sortDirection} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            queryParams.push(Number(limit), offset);
            const result = await database_1.default.query(query, queryParams);
            let countQuery = `
      SELECT COUNT(*) as total
      FROM business_programs 
      WHERE is_active = true
    `;
            const countParams = [];
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
            const countResult = await database_1.default.query(countQuery, countParams);
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
        this.getProgramById = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { id } = req.params;
            const result = await database_1.default.query(`SELECT id, title, description, organization, program_type, target_audience,
              funding_amount, application_deadline, requirements, benefits,
              application_process, contact_info, created_at
       FROM business_programs 
       WHERE id = $1 AND is_active = true`, [id]);
            if (result.rows.length === 0) {
                throw new errorHandler_1.AppError('Program not found', 404);
            }
            res.json({
                success: true,
                data: { program: result.rows[0] },
            });
        });
        this.getRecommendations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const profileResult = await database_1.default.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
            if (profileResult.rows.length === 0) {
                throw new errorHandler_1.AppError('User profile not found. Please complete your profile first.', 400);
            }
            const userProfile = profileResult.rows[0];
            const programsResult = await database_1.default.query(`SELECT id, title, description, organization, program_type, target_audience,
              funding_amount, application_deadline, requirements, benefits,
              application_process, contact_info, created_at
       FROM business_programs 
       WHERE is_active = true
       ORDER BY created_at DESC`);
            const programs = programsResult.rows;
            const recommendations = await this.recommendationService.getRecommendations(userProfile, programs);
            res.json({
                success: true,
                data: { recommendations },
            });
        });
        this.getProgramStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const typeStatsResult = await database_1.default.query(`SELECT program_type, COUNT(*) as count 
       FROM business_programs 
       WHERE is_active = true 
       GROUP BY program_type`);
            const orgStatsResult = await database_1.default.query(`SELECT organization, COUNT(*) as count 
       FROM business_programs 
       WHERE is_active = true 
       GROUP BY organization`);
            const regionStatsResult = await database_1.default.query(`SELECT unnest(supported_regions) as region, COUNT(*) as count 
       FROM business_programs 
       WHERE is_active = true AND supported_regions IS NOT NULL
       GROUP BY region`);
            const fundingStatsResult = await database_1.default.query(`SELECT 
         MIN(funding_amount) as min_funding,
         MAX(funding_amount) as max_funding,
         AVG(funding_amount) as avg_funding,
         COUNT(*) as total_programs
       FROM business_programs 
       WHERE is_active = true AND funding_amount IS NOT NULL`);
            const byType = {};
            typeStatsResult.rows.forEach(row => {
                byType[row.program_type] = parseInt(row.count);
            });
            const byOrganization = {};
            orgStatsResult.rows.forEach(row => {
                byOrganization[row.organization] = parseInt(row.count);
            });
            const byRegion = {};
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
        this.searchPrograms = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 12, search, program_type, organization, region, oked_code, min_funding, max_funding, business_type, business_size, sort = 'relevance' } = req.query;
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
            const queryParams = [search || null];
            let paramIndex = 2;
            if (search) {
                query += ` AND (to_tsvector('russian', p.title || ' ' || p.description) @@ plainto_tsquery('russian', $1))`;
            }
            if (program_type) {
                query += ` AND p.program_type = $${paramIndex}`;
                queryParams.push(program_type);
                paramIndex++;
            }
            if (organization) {
                query += ` AND p.organization = $${paramIndex}`;
                queryParams.push(organization);
                paramIndex++;
            }
            if (region) {
                query += ` AND (p.supported_regions IS NULL OR $${paramIndex} = ANY(p.supported_regions))`;
                queryParams.push(region);
                paramIndex++;
            }
            if (open_only) {
                query += ` AND (COALESCE(p.opens_at, NOW() - INTERVAL '100 years') <= NOW())`;
                query += ` AND (COALESCE(p.closes_at, p.application_deadline, NOW() + INTERVAL '100 years') >= NOW())`;
            }
            if (oked_code) {
                query += ` AND (p.oked_filters IS NULL OR $${paramIndex} = ANY(p.oked_filters) OR EXISTS (
        SELECT 1 FROM unnest(p.oked_filters) as filter 
        WHERE $${paramIndex} LIKE filter || '%' OR filter LIKE substring($${paramIndex}, 1, 1) || '%'
      ))`;
                queryParams.push(oked_code);
                paramIndex++;
            }
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
            const result = await database_1.default.query(query, queryParams);
            let countQuery = `
      SELECT COUNT(*) as total
      FROM business_programs p
      WHERE p.is_active = true
    `;
            const countParams = [];
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
            const countResult = await database_1.default.query(countQuery, countParams);
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
}
exports.ProgramController = ProgramController;
//# sourceMappingURL=ProgramController.js.map