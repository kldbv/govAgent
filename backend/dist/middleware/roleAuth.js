"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.requireAdmin = requireAdmin;
exports.requireAdminOrManager = requireAdminOrManager;
const errorHandler_1 = require("./errorHandler");
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            throw new errorHandler_1.AppError('Authentication required', 401);
        }
        const userRole = req.user.role;
        if (!allowedRoles.includes(userRole)) {
            throw new errorHandler_1.AppError('Insufficient permissions', 403);
        }
        next();
    };
}
function requireAdmin() {
    return requireRole(['admin']);
}
function requireAdminOrManager() {
    return requireRole(['admin', 'manager']);
}
//# sourceMappingURL=roleAuth.js.map