"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = require("./errorHandler");
const database_1 = __importDefault(require("../utils/database"));
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new errorHandler_1.AppError('Access token is required', 401);
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new errorHandler_1.AppError('JWT secret not configured', 500);
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const result = await database_1.default.query('SELECT id, email, full_name FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User not found', 401);
        }
        req.user = result.rows[0];
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            next(new errorHandler_1.AppError('Invalid token', 401));
        }
        else {
            next(error);
        }
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.js.map