import { Request, Response } from 'express';
import pool from '../utils/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class ReferenceController {
  // Get all Kazakhstan regions
  getRegions = asyncHandler(async (req: Request, res: Response) => {
    const result = await pool.query(`
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

  // Get OKED codes with optional filtering
  getOkedCodes = asyncHandler(async (req: Request, res: Response) => {
    const { level, parent_code, search } = req.query;

    let query = `
      SELECT id, code, name_en, name_ru, name_kz, parent_code, level,
             CASE WHEN EXISTS(SELECT 1 FROM oked_codes o2 WHERE o2.parent_code = oked_codes.code) 
                  THEN false ELSE true END as is_leaf
      FROM oked_codes 
      WHERE 1=1
    `;
    
    const queryParams: any[] = [];
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

    query += ` ORDER BY level, code LIMIT 100`; // Limit results for performance

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: { oked_codes: result.rows },
    });
  });

  // Get OKED tree structure (hierarchical)
  getOkedHierarchy = asyncHandler(async (req: Request, res: Response) => {
    // Get all OKED codes
    const result = await pool.query(`
      SELECT id, code, name_en, name_ru, name_kz, parent_code, level,
             CASE WHEN EXISTS(SELECT 1 FROM oked_codes o2 WHERE o2.parent_code = oked_codes.code) 
                  THEN false ELSE true END as is_leaf
      FROM oked_codes 
      ORDER BY level, code
    `);

    // Build tree structure
    const codes = result.rows;
    const hierarchy: any[] = [];
    const codeMap = new Map();

    // First pass: create all nodes
    codes.forEach(code => {
      const node = {
        ...code,
        children: []
      };
      codeMap.set(code.code, node);
    });

    // Second pass: build hierarchy
    codes.forEach(code => {
      const node = codeMap.get(code.code);
      if (code.parent_code && codeMap.has(code.parent_code)) {
        codeMap.get(code.parent_code).children.push(node);
      } else if (code.level === 1) {
        // Root level items (level 1)
        hierarchy.push(node);
      }
    });

    res.json({
      success: true,
      data: { hierarchy },
    });
  });

  // Get program statistics
  getProgramStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await Promise.all([
      // By program type
      pool.query(`
        SELECT program_type, COUNT(*) as count 
        FROM business_programs 
        WHERE is_active = true 
        GROUP BY program_type 
        ORDER BY count DESC
      `),
      
      // By region (most common supported regions)
      pool.query(`
        SELECT unnest(supported_regions) as region, COUNT(*) as count
        FROM business_programs 
        WHERE is_active = true AND supported_regions IS NOT NULL
        GROUP BY region
        ORDER BY count DESC
        LIMIT 10
      `),
      
      // By OKED filters
      pool.query(`
        SELECT unnest(oked_filters) as oked_code, COUNT(*) as count
        FROM business_programs 
        WHERE is_active = true AND oked_filters IS NOT NULL
        GROUP BY oked_code
        ORDER BY count DESC
        LIMIT 10
      `),
      
      // Total statistics
      pool.query(`
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
