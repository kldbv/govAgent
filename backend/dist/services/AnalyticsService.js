"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const database_1 = __importDefault(require("../utils/database"));
class AnalyticsService {
    async trackEvent(event) {
        try {
            await database_1.default.query(`INSERT INTO analytics_events (user_id, event_type, event_category, event_data, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [
                event.user_id || null,
                event.event_type,
                event.event_category,
                JSON.stringify(event.event_data || {}),
                event.ip_address || null,
                event.user_agent || null
            ]);
        }
        catch (error) {
            console.error('Error tracking analytics event:', error);
        }
    }
    async getDashboardMetrics() {
        try {
            const [overview, userEngagement, programAnalytics, chatAnalytics] = await Promise.all([
                this.getOverviewMetrics(),
                this.getUserEngagementMetrics(),
                this.getProgramAnalyticsMetrics(),
                this.getChatAnalyticsMetrics()
            ]);
            return {
                overview,
                user_engagement: userEngagement,
                program_analytics: programAnalytics,
                chat_analytics: chatAnalytics
            };
        }
        catch (error) {
            console.error('Error getting dashboard metrics:', error);
            throw error;
        }
    }
    async getOverviewMetrics() {
        const queries = await Promise.all([
            database_1.default.query('SELECT COUNT(*) as count FROM users'),
            database_1.default.query(`SELECT COUNT(DISTINCT user_id) as count FROM analytics_events 
                  WHERE created_at >= NOW() - INTERVAL '24 hours'`),
            database_1.default.query('SELECT COUNT(*) as count FROM business_programs WHERE is_active = true'),
            database_1.default.query('SELECT COUNT(*) as count FROM applications'),
            database_1.default.query(`SELECT COUNT(DISTINCT user_id) as count FROM chat_history`)
        ]);
        return {
            total_users: parseInt(queries[0].rows[0].count),
            active_users_24h: parseInt(queries[1].rows[0].count),
            total_programs: parseInt(queries[2].rows[0].count),
            total_applications: parseInt(queries[3].rows[0].count),
            total_chat_sessions: parseInt(queries[4].rows[0].count)
        };
    }
    async getUserEngagementMetrics() {
        const dailyActiveUsersResult = await database_1.default.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as count
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '7 days'
        AND user_id IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
        const topFeaturesResult = await database_1.default.query(`
      SELECT 
        event_category as feature,
        COUNT(*) as usage_count
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY event_category
      ORDER BY usage_count DESC
      LIMIT 10
    `);
        const funnelSteps = [
            { step: 'Registration', query: 'SELECT COUNT(*) FROM users' },
            { step: 'Profile Completion', query: 'SELECT COUNT(*) FROM user_profiles' },
            { step: 'Program Views', query: `SELECT COUNT(DISTINCT user_id) FROM analytics_events 
                                      WHERE event_category = 'program' AND event_type = 'view'` },
            { step: 'Application Started', query: `SELECT COUNT(DISTINCT user_id) FROM applications` },
            { step: 'Application Submitted', query: `SELECT COUNT(DISTINCT user_id) FROM applications 
                                              WHERE status != 'draft'` }
        ];
        const funnelResults = await Promise.all(funnelSteps.map(step => database_1.default.query(step.query)));
        const userJourneyFunnel = funnelSteps.map((step, index) => {
            const users = parseInt(funnelResults[index].rows[0].count);
            const previousUsers = index > 0 ? parseInt(funnelResults[index - 1].rows[0].count) : users;
            const conversionRate = previousUsers > 0 ? (users / previousUsers) * 100 : 100;
            return {
                step: step.step,
                users,
                conversion_rate: Math.round(conversionRate * 100) / 100
            };
        });
        return {
            daily_active_users: dailyActiveUsersResult.rows.map(row => ({
                date: row.date,
                count: parseInt(row.count)
            })),
            top_features: topFeaturesResult.rows.map(row => ({
                feature: row.feature,
                usage_count: parseInt(row.usage_count)
            })),
            user_journey_funnel: userJourneyFunnel
        };
    }
    async getProgramAnalyticsMetrics() {
        const mostViewedResult = await database_1.default.query(`
      SELECT 
        ae.event_data->>'program_id' as program_id,
        bp.title as program_title,
        COUNT(*) as views
      FROM analytics_events ae
      JOIN business_programs bp ON bp.id = CAST(ae.event_data->>'program_id' AS INTEGER)
      WHERE ae.event_category = 'program' 
        AND ae.event_type = 'view'
        AND ae.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY ae.event_data->>'program_id', bp.title
      ORDER BY views DESC
      LIMIT 10
    `);
        const applicationsByStatusResult = await database_1.default.query(`
      SELECT status, COUNT(*) as count
      FROM applications
      GROUP BY status
      ORDER BY count DESC
    `);
        const totalProgramViews = await database_1.default.query(`
      SELECT COUNT(*) as count FROM analytics_events 
      WHERE event_category = 'program' AND event_type = 'view'
        AND created_at >= NOW() - INTERVAL '30 days'
    `);
        const totalApplications = await database_1.default.query(`
      SELECT COUNT(*) as count FROM applications 
      WHERE last_updated >= NOW() - INTERVAL '30 days'
    `);
        const submittedApplications = await database_1.default.query(`
      SELECT COUNT(*) as count FROM applications 
      WHERE status != 'draft' AND last_updated >= NOW() - INTERVAL '30 days'
    `);
        const viewToApplicationRate = totalProgramViews.rows[0].count > 0
            ? (parseInt(totalApplications.rows[0].count) / parseInt(totalProgramViews.rows[0].count)) * 100
            : 0;
        const draftToSubmissionRate = parseInt(totalApplications.rows[0].count) > 0
            ? (parseInt(submittedApplications.rows[0].count) / parseInt(totalApplications.rows[0].count)) * 100
            : 0;
        return {
            most_viewed_programs: mostViewedResult.rows.map(row => ({
                program_id: parseInt(row.program_id),
                program_title: row.program_title,
                views: parseInt(row.views)
            })),
            applications_by_status: applicationsByStatusResult.rows.map(row => ({
                status: row.status,
                count: parseInt(row.count)
            })),
            conversion_rates: [
                { metric: 'View to Application', rate: Math.round(viewToApplicationRate * 100) / 100 },
                { metric: 'Draft to Submission', rate: Math.round(draftToSubmissionRate * 100) / 100 }
            ]
        };
    }
    async getChatAnalyticsMetrics() {
        const queries = await Promise.all([
            database_1.default.query('SELECT COUNT(*) as count FROM chat_history'),
            database_1.default.query(`
        SELECT 
          intent,
          COUNT(*) as count
        FROM chat_history 
        WHERE intent IS NOT NULL
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY intent
        ORDER BY count DESC
        LIMIT 5
      `),
            database_1.default.query(`
        SELECT 
          user_id,
          COUNT(*) as message_count,
          MAX(created_at) - MIN(created_at) as session_length
        FROM chat_history
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY user_id
        HAVING COUNT(*) > 1
      `)
        ]);
        const totalMessages = parseInt(queries[0].rows[0].count);
        const commonIntents = queries[1].rows.map(row => ({
            intent: row.intent,
            count: parseInt(row.count)
        }));
        const sessionLengths = queries[2].rows.map(row => {
            const lengthMs = row.session_length ? parseInt(row.session_length) : 0;
            return lengthMs / (1000 * 60);
        });
        const avgSessionLength = sessionLengths.length > 0
            ? sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length
            : 0;
        return {
            total_messages: totalMessages,
            avg_session_length: Math.round(avgSessionLength * 100) / 100,
            common_intents: commonIntents,
            satisfaction_score: 4.2
        };
    }
    async trackPageView(userId, page, additionalData) {
        await this.trackEvent({
            user_id: userId,
            event_type: 'page_view',
            event_category: 'navigation',
            event_data: {
                page,
                ...additionalData
            }
        });
    }
    async trackProgramView(userId, programId, programTitle) {
        await this.trackEvent({
            user_id: userId,
            event_type: 'view',
            event_category: 'program',
            event_data: {
                program_id: programId,
                program_title: programTitle
            }
        });
    }
    async trackApplicationAction(userId, programId, action, additionalData) {
        await this.trackEvent({
            user_id: userId,
            event_type: action,
            event_category: 'application',
            event_data: {
                program_id: programId,
                ...additionalData
            }
        });
    }
    async trackChatInteraction(userId, intent, confidence) {
        await this.trackEvent({
            user_id: userId,
            event_type: 'message',
            event_category: 'chat',
            event_data: {
                intent,
                confidence
            }
        });
    }
    async trackSearch(userId, query, results_count) {
        await this.trackEvent({
            user_id: userId,
            event_type: 'search',
            event_category: 'program_discovery',
            event_data: {
                query,
                results_count
            }
        });
    }
    async getUserAnalytics(userId) {
        try {
            const queries = await Promise.all([
                database_1.default.query(`
          SELECT event_category, COUNT(*) as count
          FROM analytics_events 
          WHERE user_id = $1 
          GROUP BY event_category
          ORDER BY count DESC
        `, [userId]),
                database_1.default.query(`
          SELECT COUNT(*) as count FROM applications WHERE user_id = $1
        `, [userId]),
                database_1.default.query(`
          SELECT COUNT(*) as count FROM chat_history WHERE user_id = $1
        `, [userId]),
                database_1.default.query(`
          SELECT created_at
          FROM analytics_events 
          WHERE user_id = $1 
          ORDER BY created_at DESC 
          LIMIT 1
        `, [userId])
            ]);
            return {
                activity_breakdown: queries[0].rows.map(row => ({
                    category: row.event_category,
                    count: parseInt(row.count)
                })),
                total_applications: parseInt(queries[1].rows[0].count),
                total_chat_messages: parseInt(queries[2].rows[0].count),
                last_active: queries[3].rows[0]?.created_at || null
            };
        }
        catch (error) {
            console.error('Error getting user analytics:', error);
            throw error;
        }
    }
}
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=AnalyticsService.js.map