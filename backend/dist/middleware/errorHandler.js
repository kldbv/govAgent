"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
const errorHandler = (error, req, res, next) => {
    const { statusCode = 500, message } = error;
    console.error(`\n=== ERROR DETAILS ===`);
    console.error(`Status: ${statusCode}`);
    console.error(`Message: ${message}`);
    console.error(`Path: ${req.method} ${req.originalUrl}`);
    console.error(`User: ${req.user?.email || 'Not authenticated'}`);
    if (process.env.NODE_ENV === 'development') {
        console.error(`Stack:`, error.stack);
    }
    console.error(`==================\n`);
    const extra = {};
    const anyErr = error;
    if (anyErr?.code)
        extra.code = anyErr.code;
    if (anyErr?.detail)
        extra.detail = anyErr.detail;
    res.status(statusCode).json({
        success: false,
        error: {
            message: statusCode === 500 ? 'Internal server error' : message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
            ...extra,
        },
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map