"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MethodologyController = void 0;
const database_1 = __importDefault(require("../utils/database"));
const errorHandler_1 = require("../middleware/errorHandler");
class MethodologyController {
    constructor() {
        this.getBySlug = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { slug } = req.params;
            if (!slug) {
                throw new errorHandler_1.AppError('Slug is required', 400);
            }
            const result = await database_1.default.query(`SELECT slug, title_ru, body_ru, published, created_at, updated_at
       FROM methodology_pages
       WHERE slug = $1 AND published = TRUE
       LIMIT 1`, [slug]);
            if (result.rows.length === 0) {
                throw new errorHandler_1.AppError('Methodology not found', 404);
            }
            res.json({ success: true, data: { page: result.rows[0] } });
        });
    }
}
exports.MethodologyController = MethodologyController;
//# sourceMappingURL=MethodologyController.js.map