import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import programRoutes from './routes/programs';
import applicationRoutes from './routes/applications';
import referenceRoutes from './routes/reference';
import chatRoutes from './routes/chat';
import guidanceRoutes from './routes/guidance';
import analyticsRoutes from './routes/analytics';
import methodologyRoutes from './routes/methodology';
import { errorHandler } from './middleware/errorHandler';
import { createApplicationTables } from './utils/migrateApplicationTables';
import { createApplicationSubmissionsTable } from './utils/migrateApplicationSubmissions';
import { createProgressTable } from './utils/migrateProgressTable';
import { ensureMVPColumns } from './utils/ensureMVPColumns';

dotenv.config();

// Run essential migrations on startup (idempotent)
(async () => {
  try {
    await createApplicationTables();
    await createApplicationSubmissionsTable();
    await createProgressTable();
    // Ensure minimal columns for MVP regardless of other migration failures
    await ensureMVPColumns();
    console.log('✅ Startup migrations completed');
  } catch (err) {
    console.error('❌ Startup migrations failed (continuing to start server):', err);
  }
})();

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Vercel deployment
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Limit each IP to 100 requests per windowMs in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://business-support-platform.vercel.app',
        'https://business-support-platform-git-main-abays-projects.vercel.app',
        /^https:\/\/business-support-platform-.*\.vercel\.app$/
      ]
    : process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/guidance', guidanceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/methodology', methodologyRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use(errorHandler);

// Only start a listener when running as a standalone server (not on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📱 CORS enabled for: ${typeof corsOptions.origin === 'string' ? corsOptions.origin : 'multiple origins'}`);
  });
}

export default app;
