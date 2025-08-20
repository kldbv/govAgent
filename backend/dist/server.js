"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const programs_1 = __importDefault(require("./routes/programs"));
const applications_1 = __importDefault(require("./routes/applications"));
const reference_1 = __importDefault(require("./routes/reference"));
const chat_1 = __importDefault(require("./routes/chat"));
const guidance_1 = __importDefault(require("./routes/guidance"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const methodology_1 = __importDefault(require("./routes/methodology"));
const errorHandler_1 = require("./middleware/errorHandler");
const migrateApplicationTables_1 = require("./utils/migrateApplicationTables");
const migrateApplicationSubmissions_1 = require("./utils/migrateApplicationSubmissions");
const migrateProgressTable_1 = require("./utils/migrateProgressTable");
const ensureMVPColumns_1 = require("./utils/ensureMVPColumns");
dotenv_1.default.config();
(async () => {
    try {
        await (0, migrateApplicationTables_1.createApplicationTables)();
        await (0, migrateApplicationSubmissions_1.createApplicationSubmissionsTable)();
        await (0, migrateProgressTable_1.createProgressTable)();
        await (0, ensureMVPColumns_1.ensureMVPColumns)();
        console.log('✅ Startup migrations completed');
    }
    catch (err) {
        console.error('❌ Startup migrations failed (continuing to start server):', err);
    }
})();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}
app.use((0, helmet_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 1000 : 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
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
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/programs', programs_1.default);
app.use('/api/applications', applications_1.default);
app.use('/api/reference', reference_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/guidance', guidance_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/methodology', methodology_1.default);
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
app.use(errorHandler_1.errorHandler);
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📱 CORS enabled for: ${typeof corsOptions.origin === 'string' ? corsOptions.origin : 'multiple origins'}`);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map