"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferenceController = void 0;
const database_1 = __importDefault(require("../utils/database"));
const errorHandler_1 = require("../middleware/errorHandler");
class ReferenceController {
    constructor() {
        this.getRegions = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const result = await database_1.default.query(`
      SELECT code, name_ru as name, name_kz, region_type
      FROM regions 
      ORDER BY 
        CASE region_type 
          WHEN 'city' THEN 1 
          ELSE 2 
        END,
        name_ru
    `);
            res.json({
                success: true,
                data: { regions: result.rows },
            });
        });
        this.getOkedCodes = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { level, parent_code, search } = req.query;
            let query = `
      SELECT id, code, name_en, name_ru, name_kz, parent_code, level,
             CASE WHEN EXISTS(SELECT 1 FROM oked_codes o2 WHERE o2.parent_code = oked_codes.code) 
                  THEN false ELSE true END as is_leaf
      FROM oked_codes 
      WHERE 1=1
    `;
            const queryParams = [];
            let paramIndex = 1;
            if (level) {
                query += ` AND level = $${paramIndex}`;
                queryParams.push(Number(level));
                paramIndex++;
            }
            if (parent_code) {
                query += ` AND parent_code = $${paramIndex}`;
                queryParams.push(parent_code);
                paramIndex++;
            }
            if (search) {
                query += ` AND (name_ru ILIKE $${paramIndex} OR name_en ILIKE $${paramIndex} OR name_kz ILIKE $${paramIndex} OR code ILIKE $${paramIndex})`;
                queryParams.push(`%${search}%`);
                paramIndex++;
            }
            query += ` ORDER BY level, code LIMIT 100`;
            const result = await database_1.default.query(query, queryParams);
            res.json({
                success: true,
                data: { oked_codes: result.rows },
            });
        });
        this.getOkedHierarchy = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const result = await database_1.default.query(`
      SELECT id, code, name_en, name_ru, name_kz, parent_code, level,
             CASE WHEN EXISTS(SELECT 1 FROM oked_codes o2 WHERE o2.parent_code = oked_codes.code) 
                  THEN false ELSE true END as is_leaf
      FROM oked_codes 
      ORDER BY level, code
    `);
            const codes = result.rows;
            const hierarchy = [];
            const codeMap = new Map();
            codes.forEach(code => {
                const node = {
                    ...code,
                    children: []
                };
                codeMap.set(code.code, node);
            });
            codes.forEach(code => {
                const node = codeMap.get(code.code);
                if (code.parent_code && codeMap.has(code.parent_code)) {
                    codeMap.get(code.parent_code).children.push(node);
                }
                else if (code.level === 1) {
                    hierarchy.push(node);
                }
            });
            res.json({
                success: true,
                data: { hierarchy },
            });
        });
        this.getProgramStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const stats = await Promise.all([
                database_1.default.query(`
        SELECT program_type, COUNT(*) as count 
        FROM business_programs 
        WHERE is_active = true 
        GROUP BY program_type 
        ORDER BY count DESC
      `),
                database_1.default.query(`
        SELECT unnest(supported_regions) as region, COUNT(*) as count
        FROM business_programs 
        WHERE is_active = true AND supported_regions IS NOT NULL
        GROUP BY region
        ORDER BY count DESC
        LIMIT 10
      `),
                database_1.default.query(`
        SELECT unnest(oked_filters) as oked_code, COUNT(*) as count
        FROM business_programs 
        WHERE is_active = true AND oked_filters IS NOT NULL
        GROUP BY oked_code
        ORDER BY count DESC
        LIMIT 10
      `),
                database_1.default.query(`
        SELECT 
          COUNT(*) as total_programs,
          AVG(funding_amount) as avg_funding,
          MIN(funding_amount) as min_funding,
          MAX(funding_amount) as max_funding
        FROM business_programs 
        WHERE is_active = true AND funding_amount IS NOT NULL
      `)
            ]);
            res.json({
                success: true,
                data: {
                    by_type: stats[0].rows,
                    by_region: stats[1].rows,
                    by_oked: stats[2].rows,
                    totals: stats[3].rows[0]
                },
            });
        });
    }
}
exports.ReferenceController = ReferenceController;
//# sourceMappingURL=ReferenceController.js.map