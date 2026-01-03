"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROGRAM_SELECT_FIELDS_EXTENDED = exports.PROGRAM_SELECT_FIELDS = void 0;
exports.buildProgramFilters = buildProgramFilters;
exports.buildOrderClause = buildOrderClause;
exports.parseBooleanParam = parseBooleanParam;
function buildProgramFilters(filters, startParamIndex = 1, tableAlias = '') {
    const prefix = tableAlias ? `${tableAlias}.` : '';
    const conditions = [];
    const params = [];
    let paramIndex = startParamIndex;
    if (filters.program_type) {
        conditions.push(`${prefix}program_type = $${paramIndex}`);
        params.push(filters.program_type);
        paramIndex++;
    }
    if (filters.target_audience) {
        conditions.push(`${prefix}target_audience ILIKE $${paramIndex}`);
        params.push(`%${filters.target_audience}%`);
        paramIndex++;
    }
    if (filters.organization) {
        conditions.push(`${prefix}organization ILIKE $${paramIndex}`);
        params.push(`%${filters.organization}%`);
        paramIndex++;
    }
    if (filters.search) {
        conditions.push(`(${prefix}title ILIKE $${paramIndex} OR ${prefix}description ILIKE $${paramIndex})`);
        params.push(`%${filters.search}%`);
        paramIndex++;
    }
    if (filters.open_only) {
        conditions.push(`(COALESCE(${prefix}opens_at, NOW() - INTERVAL '100 years') <= NOW())`);
        conditions.push(`(COALESCE(${prefix}closes_at, ${prefix}application_deadline, NOW() + INTERVAL '100 years') >= NOW())`);
    }
    if (filters.region) {
        conditions.push(`(${prefix}supported_regions IS NULL OR $${paramIndex} = ANY(${prefix}supported_regions))`);
        params.push(filters.region);
        paramIndex++;
    }
    if (filters.oked_code) {
        conditions.push(`(${prefix}oked_filters IS NULL OR $${paramIndex} = ANY(${prefix}oked_filters) OR EXISTS (
      SELECT 1 FROM unnest(${prefix}oked_filters) as filter
      WHERE $${paramIndex} LIKE filter || '%' OR filter LIKE substring($${paramIndex}, 1, 1) || '%'
    ))`);
        params.push(filters.oked_code);
        paramIndex++;
    }
    if (filters.min_amount) {
        conditions.push(`(${prefix}max_loan_amount IS NULL OR ${prefix}max_loan_amount >= $${paramIndex})`);
        params.push(Number(filters.min_amount));
        paramIndex++;
    }
    if (filters.max_amount) {
        conditions.push(`(${prefix}min_loan_amount IS NULL OR ${prefix}min_loan_amount <= $${paramIndex})`);
        params.push(Number(filters.max_amount));
        paramIndex++;
    }
    if (filters.min_funding) {
        conditions.push(`(${prefix}funding_amount IS NULL OR ${prefix}funding_amount >= $${paramIndex})`);
        params.push(Number(filters.min_funding));
        paramIndex++;
    }
    if (filters.max_funding) {
        conditions.push(`(${prefix}funding_amount IS NULL OR ${prefix}funding_amount <= $${paramIndex})`);
        params.push(Number(filters.max_funding));
        paramIndex++;
    }
    if (filters.business_type) {
        conditions.push(`${prefix}target_audience ILIKE $${paramIndex}`);
        params.push(`%${filters.business_type}%`);
        paramIndex++;
    }
    if (filters.business_size) {
        conditions.push(`${prefix}target_audience ILIKE $${paramIndex}`);
        params.push(`%${filters.business_size}%`);
        paramIndex++;
    }
    return {
        whereClause: conditions.length > 0 ? conditions.join(' AND ') : '',
        params,
        nextParamIndex: paramIndex
    };
}
exports.PROGRAM_SELECT_FIELDS = `
  id, title, description, organization, program_type, target_audience,
  funding_amount, application_deadline, requirements, benefits,
  application_process, contact_info, created_at,
  supported_regions, min_loan_amount, max_loan_amount, oked_filters,
  required_documents, application_steps
`;
exports.PROGRAM_SELECT_FIELDS_EXTENDED = `
  ${exports.PROGRAM_SELECT_FIELDS},
  opens_at, closes_at, bank_rate, subsidy_rate, max_loan_term_months, calculator_enabled
`;
function buildOrderClause(sort, tableAlias = '', hasSearch = false) {
    const prefix = tableAlias ? `${tableAlias}.` : '';
    switch (sort) {
        case 'funding_amount':
            return `ORDER BY ${prefix}funding_amount DESC NULLS LAST`;
        case 'deadline':
            return `ORDER BY ${prefix}application_deadline ASC NULLS LAST`;
        case 'newest':
            return `ORDER BY ${prefix}created_at DESC`;
        case 'title':
            return `ORDER BY ${prefix}title ASC`;
        case 'relevance':
        default:
            return hasSearch
                ? `ORDER BY relevance_score DESC, ${prefix}created_at DESC`
                : `ORDER BY ${prefix}created_at DESC`;
    }
}
function parseBooleanParam(value) {
    return value === '1' || value === 'true' || value === true;
}
//# sourceMappingURL=queryBuilder.js.map