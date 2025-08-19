import pool from '../utils/database';

interface AnalyticsEvent {
  user_id: number | null;
  event_type: string;
  event_category: string;
  event_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: Date;
}

interface AnalyticsDashboard {
  overview: {
    total_users: number;
    active_users_24h: number;
    total_programs: number;
    total_applications: number;
    total_chat_sessions: number;
  };
  user_engagement: {
    daily_active_users: { date: string; count: number }[];
    top_features: { feature: string; usage_count: number }[];
    user_journey_funnel: { step: string; users: number; conversion_rate: number }[];
  };
  program_analytics: {
    most_viewed_programs: { program_id: number; program_title: string; views: number }[];
    applications_by_status: { status: string; count: number }[];
    conversion_rates: { metric: string; rate: number }[];
  };
  chat_analytics: {
    total_messages: number;
    avg_session_length: number;
    common_intents: { intent: string; count: number }[];
    satisfaction_score: number;
  };
}

export class AnalyticsService {
  
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO analytics_events (user_id, event_type, event_category, event_data, ip_address, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          event.user_id || null,
          event.event_type,
          event.event_category,
          JSON.stringify(event.event_data || {}),
          event.ip_address || null,
          event.user_agent || null
        ]
      );
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      // Don't throw - analytics should not break the main functionality
    }
  }

  async getDashboardMetrics(): Promise<AnalyticsDashboard> {
    try {
      const [
        overview,
        userEngagement,
        programAnalytics,
        chatAnalytics
      ] = await Promise.all([
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
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  }

  private async getOverviewMetrics() {
    const queries = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM analytics_events 
                  WHERE created_at >= NOW() - INTERVAL '24 hours'`),
      pool.query('SELECT COUNT(*) as count FROM business_programs WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM applications'),
      pool.query(`SELECT COUNT(DISTINCT user_id) as count FROM chat_history`)
    ]);

    return {
      total_users: parseInt(queries[0].rows[0].count),
      active_users_24h: parseInt(queries[1].rows[0].count),
      total_programs: parseInt(queries[2].rows[0].count),
      total_applications: parseInt(queries[3].rows[0].count),
      total_chat_sessions: parseInt(queries[4].rows[0].count)
    };
  }

  private async getUserEngagementMetrics() {
    // Daily active users for the last 7 days
    const dailyActiveUsersResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT user_id) as count
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '7 days'
        AND user_id IS NOT NULL
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Top features by usage
    const topFeaturesResult = await pool.query(`
      SELECT 
        event_category as feature,
        COUNT(*) as usage_count
      FROM analytics_events 
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY event_category
      ORDER BY usage_count DESC
      LIMIT 10
    `);

    // User journey funnel
    const funnelSteps = [
      { step: 'Registration', query: 'SELECT COUNT(*) FROM users' },
      { step: 'Profile Completion', query: 'SELECT COUNT(*) FROM user_profiles' },
      { step: 'Program Views', query: `SELECT COUNT(DISTINCT user_id) FROM analytics_events 
                                      WHERE event_category = 'program' AND event_type = 'view'` },
      { step: 'Application Started', query: `SELECT COUNT(DISTINCT user_id) FROM applications` },
      { step: 'Application Submitted', query: `SELECT COUNT(DISTINCT user_id) FROM applications 
                                              WHERE status != 'draft'` }
    ];

    const funnelResults = await Promise.all(
      funnelSteps.map(step => pool.query(step.query))
    );

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

  private async getProgramAnalyticsMetrics() {
    // Most viewed programs
    const mostViewedResult = await pool.query(`
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

    // Applications by status
    const applicationsByStatusResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM applications
      GROUP BY status
      ORDER BY count DESC
    `);

    // Conversion rates
    const totalProgramViews = await pool.query(`
      SELECT COUNT(*) as count FROM analytics_events 
      WHERE event_category = 'program' AND event_type = 'view'
        AND created_at >= NOW() - INTERVAL '30 days'
    `);

    const totalApplications = await pool.query(`
      SELECT COUNT(*) as count FROM applications 
      WHERE last_updated >= NOW() - INTERVAL '30 days'
    `);

    const submittedApplications = await pool.query(`
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

  private async getChatAnalyticsMetrics() {
    const queries = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM chat_history'),
      pool.query(`
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
      pool.query(`
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

    // Calculate average session length in minutes
    const sessionLengths = queries[2].rows.map(row => {
      const lengthMs = row.session_length ? parseInt(row.session_length) : 0;
      return lengthMs / (1000 * 60); // Convert to minutes
    });

    const avgSessionLength = sessionLengths.length > 0
      ? sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length
      : 0;

    return {
      total_messages: totalMessages,
      avg_session_length: Math.round(avgSessionLength * 100) / 100,
      common_intents: commonIntents,
      satisfaction_score: 4.2 // This would be calculated from user feedback in a real system
    };
  }

  async trackPageView(userId: number | null, page: string, additionalData?: Record<string, any>) {
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

  async trackProgramView(userId: number | null, programId: number, programTitle: string) {
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

  async trackApplicationAction(userId: number, programId: number, action: string, additionalData?: Record<string, any>) {
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

  async trackChatInteraction(userId: number, intent: string, confidence: number) {
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

  async trackSearch(userId: number | null, query: string, results_count: number) {
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

  async getUserAnalytics(userId: number) {
    try {
      const queries = await Promise.all([
        pool.query(`
          SELECT event_category, COUNT(*) as count
          FROM analytics_events 
          WHERE user_id = $1 
          GROUP BY event_category
          ORDER BY count DESC
        `, [userId]),
        
        pool.query(`
          SELECT COUNT(*) as count FROM applications WHERE user_id = $1
        `, [userId]),
        
        pool.query(`
          SELECT COUNT(*) as count FROM chat_history WHERE user_id = $1
        `, [userId]),
        
        pool.query(`
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
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }
}
