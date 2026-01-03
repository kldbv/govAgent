"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgramController = void 0;
const database_1 = __importDefault(require("../utils/database"));
const errorHandler_1 = require("../middleware/errorHandler");
const RecommendationService_1 = require("../services/RecommendationService");
const queryBuilder_1 = require("../utils/queryBuilder");
class ProgramController {
    constructor() {
        this.recommendationService = new RecommendationService_1.RecommendationService();
        this.getPrograms = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 10, program_type, target_audience, organization, search, region, oked_code, min_amount, max_amount, sort_by = 'created_at', sort_order = 'DESC' } = req.query;
            const offset = (Number(page) - 1) * Number(limit);
            const open_only = (0, queryBuilder_1.parseBooleanParam)(req.query.open_only);
            const filters = {
                program_type: program_type,
                target_audience: target_audience,
                organization: organization,
                search: search,
                region: region,
                oked_code: oked_code,
                min_amount: min_amount ? Number(min_amount) : undefined,
                max_amount: max_amount ? Number(max_amount) : undefined,
                open_only
            };
            const { whereClause, params, nextParamIndex } = (0, queryBuilder_1.buildProgramFilters)(filters);
            let query = `
      SELECT ${queryBuilder_1.PROGRAM_SELECT_FIELDS}
      FROM business_programs
      WHERE is_active = true
    `;
            if (whereClause) {
                query += ` AND ${whereClause}`;
            }
            const allowedSorts = ['created_at', 'funding_amount', 'application_deadline', 'title'];
            const sortColumn = allowedSorts.includes(sort_by) ? sort_by : 'created_at';
            const sortDirection = sort_order === 'ASC' ? 'ASC' : 'DESC';
            query += ` ORDER BY ${sortColumn} ${sortDirection} LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}`;
            params.push(Number(limit), offset);
            const result = await database_1.default.query(query, params);
            const { whereClause: countWhereClause, params: countParams } = (0, queryBuilder_1.buildProgramFilters)(filters);
            let countQuery = `
      SELECT COUNT(*) as total
      FROM business_programs
      WHERE is_active = true
    `;
            if (countWhereClause) {
                countQuery += ` AND ${countWhereClause}`;
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
            const result = await database_1.default.query(`SELECT ${queryBuilder_1.PROGRAM_SELECT_FIELDS_EXTENDED}
       FROM business_programs
       WHERE id = $1 AND is_active = true`, [id]);
            if (result.rows.length === 0) {
                throw new errorHandler_1.AppError('Program not found', 404);
            }
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
        this.getRecommendations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const userId = req.user?.id;
            const profileResult = await database_1.default.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]);
            if (profileResult.rows.length === 0) {
                throw new errorHandler_1.AppError('User profile not found. Please complete your profile first.', 400);
            }
            const userProfile = profileResult.rows[0];
            const programsResult = await database_1.default.query(`SELECT ${queryBuilder_1.PROGRAM_SELECT_FIELDS}
       FROM business_programs
       WHERE is_active = true
       ORDER BY created_at DESC
       LIMIT 100`);
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
            const open_only = (0, queryBuilder_1.parseBooleanParam)(req.query.open_only);
            const hasSearch = Boolean(search);
            const filters = {
                program_type: program_type,
                organization: organization,
                region: region,
                oked_code: oked_code,
                min_funding: min_funding ? Number(min_funding) : undefined,
                max_funding: max_funding ? Number(max_funding) : undefined,
                business_type: business_type,
                business_size: business_size,
                open_only
            };
            const { whereClause, params, nextParamIndex } = (0, queryBuilder_1.buildProgramFilters)(filters, 2, 'p');
            let query = `
      SELECT ${queryBuilder_1.PROGRAM_SELECT_FIELDS.split(',').map(f => `p.${f.trim()}`).join(', ')},
             CASE WHEN $1::text IS NOT NULL THEN
               ts_rank(to_tsvector('russian', p.title || ' ' || p.description), plainto_tsquery('russian', $1::text))
             ELSE 0 END as relevance_score
      FROM business_programs p
      WHERE p.is_active = true
    `;
            const queryParams = [search || null, ...params];
            if (hasSearch) {
                query += ` AND (to_tsvector('russian', p.title || ' ' || p.description) @@ plainto_tsquery('russian', $1))`;
            }
            if (whereClause) {
                query += ` AND ${whereClause}`;
            }
            const orderClause = (0, queryBuilder_1.buildOrderClause)(sort, 'p', hasSearch);
            query += ` ${orderClause} LIMIT $${nextParamIndex} OFFSET $${nextParamIndex + 1}`;
            queryParams.push(Number(limit), offset);
            const result = await database_1.default.query(query, queryParams);
            const { whereClause: countWhereClause, params: countParams } = (0, queryBuilder_1.buildProgramFilters)(filters, hasSearch ? 2 : 1, 'p');
            let countQuery = `
      SELECT COUNT(*) as total
      FROM business_programs p
      WHERE p.is_active = true
    `;
            const countQueryParams = hasSearch ? [search, ...countParams] : countParams;
            if (hasSearch) {
                countQuery += ` AND (to_tsvector('russian', p.title || ' ' || p.description) @@ plainto_tsquery('russian', $1))`;
            }
            if (countWhereClause) {
                countQuery += ` AND ${countWhereClause}`;
            }
            const countResult = await database_1.default.query(countQuery, countQueryParams);
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