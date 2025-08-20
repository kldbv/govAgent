import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';

export type UserRole = 'admin' | 'manager' | 'user';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const userRole = req.user.role as UserRole;
    
    if (!allowedRoles.includes(userRole)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
}

export function requireAdmin() {
  return requireRole(['admin']);
}

export function requireAdminOrManager() {
  return requireRole(['admin', 'manager']);
}
