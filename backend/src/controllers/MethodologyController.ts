import { Request, Response } from 'express';
import pool from '../utils/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class MethodologyController {
  getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    if (!slug) {
      throw new AppError('Slug is required', 400);
    }

    const result = await pool.query(
      `SELECT slug, title_ru, body_ru, published, created_at, updated_at
       FROM methodology_pages
       WHERE slug = $1 AND published = TRUE
       LIMIT 1`,
      [slug]
    );

    if (result.rows.length === 0) {
      throw new AppError('Methodology not found', 404);
    }

    res.json({ success: true, data: { page: result.rows[0] } });
  });
}

