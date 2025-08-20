"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
const database_1 = __importDefault(require("../utils/database"));
const joi_1 = __importDefault(require("joi"));
class AdminController {
    constructor() {
        this.getDashboardStats = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            try {
                const [totalUsers, totalPrograms, totalApplications, activeApplications, recentUsers, applicationsByStatus, programsByType] = await Promise.all([
                    database_1.default.query('SELECT COUNT(*) as count FROM users'),
                    database_1.default.query('SELECT COUNT(*) as count FROM business_programs WHERE is_active = true'),
                    database_1.default.query('SELECT COUNT(*) as count FROM applications'),
                    database_1.default.query("SELECT COUNT(*) as count FROM applications WHERE status = 'under_review'"),
                    database_1.default.query(`
          SELECT COUNT(*) as count FROM users 
          WHERE created_at >= NOW() - INTERVAL '30 days'
        `),
                    database_1.default.query(`
          SELECT status, COUNT(*) as count 
          FROM applications 
          GROUP BY status 
          ORDER BY count DESC
        `),
                    database_1.default.query(`
          SELECT program_type, COUNT(*) as count 
          FROM business_programs 
          WHERE is_active = true 
          GROUP BY program_type 
          ORDER BY count DESC
        `)
                ]);
                res.json({
                    success: true,
                    data: {
                        overview: {
                            total_users: parseInt(totalUsers.rows[0].count),
                            total_programs: parseInt(totalPrograms.rows[0].count),
                            total_applications: parseInt(totalApplications.rows[0].count),
                            active_applications: parseInt(activeApplications.rows[0].count),
                            new_users_30d: parseInt(recentUsers.rows[0].count)
                        },
                        applications_by_status: applicationsByStatus.rows.map(row => ({
                            status: row.status,
                            count: parseInt(row.count)
                        })),
                        programs_by_type: programsByType.rows.map(row => ({
                            type: row.program_type,
                            count: parseInt(row.count)
                        }))
                    }
                });
            }
            catch (error) {
                console.error('Error getting dashboard stats:', error);
                throw new errorHandler_1.AppError('Failed to get dashboard statistics', 500);
            }
        });
        this.getAllUsers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 20, search, role } = req.query;
            try {
                let query = `
        SELECT u.id, u.email, u.full_name, u.role, u.created_at,
               p.business_type, p.business_size, p.industry, p.region
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        WHERE 1=1
      `;
                const params = [];
                let paramIndex = 1;
                if (search) {
                    query += ` AND (u.full_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
                    params.push(`%${search}%`);
                    paramIndex++;
                }
                if (role) {
                    query += ` AND u.role = $${paramIndex}`;
                    params.push(role);
                    paramIndex++;
                }
                query += ` ORDER BY u.created_at DESC`;
                const countQuery = query.replace('SELECT u.id, u.email, u.full_name, u.role, u.created_at, p.business_type, p.business_size, p.industry, p.region', 'SELECT COUNT(*)');
                const totalResult = await database_1.default.query(countQuery, params);
                const total = parseInt(totalResult.rows[0].count);
                const offset = (Number(page) - 1) * Number(limit);
                query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
                params.push(Number(limit), offset);
                const result = await database_1.default.query(query, params);
                res.json({
                    success: true,
                    data: {
                        users: result.rows,
                        pagination: {
                            current_page: Number(page),
                            per_page: Number(limit),
                            total,
                            total_pages: Math.ceil(total / Number(limit))
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error getting users:', error);
                throw new errorHandler_1.AppError('Failed to get users', 500);
            }
        });
        this.updateUserRole = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { userId } = req.params;
            const { role } = req.body;
            const schema = joi_1.default.object({
                role: joi_1.default.string().valid('admin', 'manager', 'user').required()
            });
            const { error } = schema.validate({ role });
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            try {
                const result = await database_1.default.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, full_name, role', [role, userId]);
                if (result.rows.length === 0) {
                    throw new errorHandler_1.AppError('User not found', 404);
                }
                res.json({
                    success: true,
                    message: 'User role updated successfully',
                    data: { user: result.rows[0] }
                });
            }
            catch (error) {
                console.error('Error updating user role:', error);
                throw new errorHandler_1.AppError('Failed to update user role', 500);
            }
        });
        this.getAllPrograms = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 20, search, type, status } = req.query;
            try {
                let query = `
        SELECT id, title as name, description, organization, program_type, funding_amount, 
               application_deadline, requirements as eligibility_criteria, is_active, 
               created_at, updated_at,
               CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status
        FROM business_programs
        WHERE 1=1
      `;
                const params = [];
                let paramIndex = 1;
                if (search) {
                    query += ` AND (title ILIKE $${paramIndex} OR organization ILIKE $${paramIndex})`;
                    params.push(`%${search}%`);
                    paramIndex++;
                }
                if (type) {
                    query += ` AND program_type = $${paramIndex}`;
                    params.push(type);
                    paramIndex++;
                }
                if (status === 'active') {
                    query += ` AND is_active = true`;
                }
                else if (status === 'inactive') {
                    query += ` AND is_active = false`;
                }
                query += ` ORDER BY created_at DESC`;
                const countQuery = query.replace(`SELECT id, title as name, description, organization, program_type, funding_amount, 
               application_deadline, requirements as eligibility_criteria, is_active, 
               created_at, updated_at,
               CASE WHEN is_active THEN 'active' ELSE 'inactive' END as status`, 'SELECT COUNT(*)');
                const totalResult = await database_1.default.query(countQuery, params);
                const total = parseInt(totalResult.rows[0].count);
                const offset = (Number(page) - 1) * Number(limit);
                query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
                params.push(Number(limit), offset);
                const result = await database_1.default.query(query, params);
                res.json({
                    success: true,
                    data: {
                        programs: result.rows,
                        pagination: {
                            current_page: Number(page),
                            per_page: Number(limit),
                            total,
                            total_pages: Math.ceil(total / Number(limit))
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error getting programs:', error);
                throw new errorHandler_1.AppError('Failed to get programs', 500);
            }
        });
        this.toggleProgramStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { programId } = req.params;
            try {
                const result = await database_1.default.query('UPDATE business_programs SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING id, title, is_active', [programId]);
                if (result.rows.length === 0) {
                    throw new errorHandler_1.AppError('Program not found', 404);
                }
                res.json({
                    success: true,
                    message: `Program ${result.rows[0].is_active ? 'activated' : 'deactivated'} successfully`,
                    data: { program: result.rows[0] }
                });
            }
            catch (error) {
                console.error('Error toggling program status:', error);
                throw new errorHandler_1.AppError('Failed to update program status', 500);
            }
        });
        this.updateProgramStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { programId } = req.params;
            const { status } = req.body;
            const schema = joi_1.default.object({
                status: joi_1.default.string().valid('active', 'inactive', 'draft').required()
            });
            const { error } = schema.validate({ status });
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            try {
                const isActive = status === 'active';
                const result = await database_1.default.query('UPDATE business_programs SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, title, is_active', [isActive, programId]);
                if (result.rows.length === 0) {
                    throw new errorHandler_1.AppError('Program not found', 404);
                }
                res.json({
                    success: true,
                    message: 'Program status updated successfully',
                    data: { program: result.rows[0] }
                });
            }
            catch (error) {
                console.error('Error updating program status:', error);
                throw new errorHandler_1.AppError('Failed to update program status', 500);
            }
        });
        this.getAllApplications = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { page = 1, limit = 20, status, program_id } = req.query;
            try {
                let query = `
        SELECT a.id, a.user_id, a.program_id, a.status, a.submitted_at, a.last_updated,
               a.submission_reference, a.notes, a.form_data,
               u.full_name as user_name, u.email as user_email,
               bp.title as program_name, bp.organization,
               COALESCE(a.form_data->>'business_plan_summary', '') as business_plan_summary,
               COALESCE(a.form_data->>'funding_request', '') as funding_request,
               COALESCE(a.form_data->>'expected_roi', '') as expected_roi
        FROM applications a
        JOIN users u ON a.user_id = u.id
        JOIN business_programs bp ON a.program_id = bp.id
        WHERE 1=1
      `;
                const params = [];
                let paramIndex = 1;
                if (status) {
                    query += ` AND a.status = $${paramIndex}`;
                    params.push(status);
                    paramIndex++;
                }
                if (program_id) {
                    query += ` AND a.program_id = $${paramIndex}`;
                    params.push(program_id);
                    paramIndex++;
                }
                query += ` ORDER BY a.last_updated DESC`;
                const countQuery = query.replace(`SELECT a.id, a.user_id, a.program_id, a.status, a.submitted_at, a.last_updated,
               a.submission_reference, a.notes, a.form_data,
               u.full_name as user_name, u.email as user_email,
               bp.title as program_name, bp.organization,
               COALESCE(a.form_data->>'business_plan_summary', '') as business_plan_summary,
               COALESCE(a.form_data->>'funding_request', '') as funding_request,
               COALESCE(a.form_data->>'expected_roi', '') as expected_roi`, 'SELECT COUNT(*)');
                const totalResult = await database_1.default.query(countQuery, params);
                const total = parseInt(totalResult.rows[0].count);
                const offset = (Number(page) - 1) * Number(limit);
                query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
                params.push(Number(limit), offset);
                const result = await database_1.default.query(query, params);
                res.json({
                    success: true,
                    data: {
                        applications: result.rows,
                        pagination: {
                            current_page: Number(page),
                            per_page: Number(limit),
                            total,
                            total_pages: Math.ceil(total / Number(limit))
                        }
                    }
                });
            }
            catch (error) {
                console.error('Error getting applications:', error);
                throw new errorHandler_1.AppError('Failed to get applications', 500);
            }
        });
        this.updateApplicationStatus = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { applicationId } = req.params;
            const { status, notes } = req.body;
            const schema = joi_1.default.object({
                status: joi_1.default.string().valid('pending', 'draft', 'under_review', 'approved', 'rejected').required(),
                notes: joi_1.default.string().max(1000).allow('', null).optional()
            });
            const { error } = schema.validate({ status, notes });
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            try {
                const result = await database_1.default.query(`UPDATE applications 
         SET status = $1, notes = $2, last_updated = NOW() 
         WHERE id = $3 
         RETURNING id, status, notes`, [status, notes || null, applicationId]);
                if (result.rows.length === 0) {
                    throw new errorHandler_1.AppError('Application not found', 404);
                }
                res.json({
                    success: true,
                    message: 'Application status updated successfully',
                    data: { application: result.rows[0] }
                });
            }
            catch (error) {
                console.error('Error updating application status:', error);
                throw new errorHandler_1.AppError('Failed to update application status', 500);
            }
        });
        this.getApplicationDetails = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { applicationId } = req.params;
            try {
                const result = await database_1.default.query(`
        SELECT a.*, 
               u.full_name as user_name, u.email as user_email,
               bp.title as program_name, bp.organization,
               p.business_type, p.business_size, p.industry, p.region,
               p.current_revenue, p.employees_count,
               COALESCE(a.form_data->>'business_plan_summary', '') as business_plan_summary,
               COALESCE(a.form_data->>'funding_request', '') as funding_request,
               COALESCE(a.form_data->>'expected_roi', '') as expected_roi,
               COALESCE(a.form_data->>'timeline', '') as timeline,
               COALESCE(
                 (SELECT json_agg(
                   json_build_object(
                     'id', f.id,
                     'field_name', f.field_name,
                     'original_name', f.original_name,
                     'file_size', f.file_size,
                     'mime_type', f.mime_type,
                     'uploaded_at', f.uploaded_at
                   )
                 ) FROM file_uploads f WHERE f.application_id = a.id),
                 '[]'::json
               ) as files
        FROM applications a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        JOIN business_programs bp ON a.program_id = bp.id
        WHERE a.id = $1
      `, [applicationId]);
                if (result.rows.length === 0) {
                    throw new errorHandler_1.AppError('Application not found', 404);
                }
                res.json({
                    success: true,
                    data: { application: result.rows[0] }
                });
            }
            catch (error) {
                console.error('Error getting application details:', error);
                throw new errorHandler_1.AppError('Failed to get application details', 500);
            }
        });
        this.createProgram = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const schema = joi_1.default.object({
                name: joi_1.default.string().required(),
                description: joi_1.default.string().required(),
                eligibility_criteria: joi_1.default.string().required(),
                funding_amount: joi_1.default.string().required(),
                application_deadline: joi_1.default.date().iso().required()
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            try {
                const result = await database_1.default.query(`
        INSERT INTO business_programs 
        (title, description, organization, program_type, funding_amount, 
         application_deadline, requirements, benefits, application_process, 
         eligible_regions, required_documents, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `, [
                    value.name,
                    value.description,
                    'Government Program',
                    'grant',
                    value.funding_amount,
                    value.application_deadline,
                    value.eligibility_criteria,
                    'Financial support for business development',
                    'Submit application through the platform',
                    [],
                    [],
                    true
                ]);
                res.status(201).json({
                    success: true,
                    message: 'Program created successfully',
                    data: { program: result.rows[0] }
                });
            }
            catch (error) {
                console.error('Error creating program:', error);
                throw new errorHandler_1.AppError('Failed to create program', 500);
            }
        });
        this.updateProgram = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { programId } = req.params;
            const schema = joi_1.default.object({
                name: joi_1.default.string().optional(),
                description: joi_1.default.string().optional(),
                eligibility_criteria: joi_1.default.string().optional(),
                funding_amount: joi_1.default.string().optional(),
                application_deadline: joi_1.default.date().iso().optional()
            });
            const { error, value } = schema.validate(req.body);
            if (error) {
                throw new errorHandler_1.AppError(error.details[0].message, 400);
            }
            try {
                const updateFields = [];
                const params = [];
                let paramIndex = 1;
                const fieldMapping = {
                    name: 'title',
                    eligibility_criteria: 'requirements'
                };
                Object.entries(value).forEach(([key, val]) => {
                    const dbField = fieldMapping[key] || key;
                    updateFields.push(`${dbField} = $${paramIndex}`);
                    params.push(val);
                    paramIndex++;
                });
                if (updateFields.length === 0) {
                    throw new errorHandler_1.AppError('No fields to update', 400);
                }
                updateFields.push(`updated_at = NOW()`);
                params.push(programId);
                const result = await database_1.default.query(`
        UPDATE business_programs 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, params);
                if (result.rows.length === 0) {
                    throw new errorHandler_1.AppError('Program not found', 404);
                }
                res.json({
                    success: true,
                    message: 'Program updated successfully',
                    data: { program: result.rows[0] }
                });
            }
            catch (error) {
                console.error('Error updating program:', error);
                throw new errorHandler_1.AppError('Failed to update program', 500);
            }
        });
        this.deleteProgram = (0, errorHandler_1.asyncHandler)(async (req, res) => {
            const { programId } = req.params;
            try {
                const applicationsResult = await database_1.default.query('SELECT COUNT(*) as count FROM applications WHERE program_id = $1', [programId]);
                const hasApplications = parseInt(applicationsResult.rows[0].count) > 0;
                if (hasApplications) {
                    await database_1.default.query('UPDATE business_programs SET is_active = false WHERE id = $1', [programId]);
                    res.json({
                        success: true,
                        message: 'Program deactivated (has existing applications)'
                    });
                }
                else {
                    const result = await database_1.default.query('DELETE FROM business_programs WHERE id = $1 RETURNING id', [programId]);
                    if (result.rows.length === 0) {
                        throw new errorHandler_1.AppError('Program not found', 404);
                    }
                    res.json({
                        success: true,
                        message: 'Program deleted successfully'
                    });
                }
            }
            catch (error) {
                console.error('Error deleting program:', error);
                throw new errorHandler_1.AppError('Failed to delete program', 500);
            }
        });
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=AdminController.js.map