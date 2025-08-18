# Deployment Guide

## Quick Start

### 1. Development Setup

```bash
# Install dependencies for all packages
npm install
cd backend && npm install
cd ../frontend && npm install

# Set up backend environment
cd backend
cp .env.example .env
# Edit .env with your actual database URL and JWT secret

# Run database migrations and seed data
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev  # This starts both backend and frontend
```

### 2. Vercel Deployment

1. **Connect your GitHub repository to Vercel**
   - Go to vercel.com and import your project
   - Connect your GitHub repository

2. **Set up environment variables in Vercel dashboard:**
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_lxaf5BsGo9FS@ep-silent-cake-a2w4nzwl-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   JWT_SECRET=your-super-secret-jwt-key-for-production
   NODE_ENV=production
   ```

3. **Deploy**
   - Vercel will automatically build and deploy your application
   - The `vercel.json` configuration is already set up

## Architecture Overview

### Backend (`/backend`)
- **Framework**: Node.js + Express + TypeScript
- **Database**: Neon PostgreSQL
- **Authentication**: JWT with bcrypt password hashing
- **Security**: Helmet, CORS, rate limiting
- **API Structure**:
  - `/api/auth/*` - Authentication endpoints
  - `/api/programs/*` - Business programs
  - `/api/applications/*` - Application management

### Frontend (`/frontend`)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **Routing**: React Router
- **State Management**: React Context (Auth)
- **HTTP Client**: Axios

### Database Schema
- `users` - User accounts
- `user_profiles` - Business profile information
- `business_programs` - Support programs (11 pre-seeded)
- `applications` - User applications to programs

## Key Features

1. **Authentication System**
   - User registration and login
   - JWT token-based authentication
   - Password hashing with bcrypt (12 rounds)

2. **Business Support Programs**
   - 11 real Kazakhstan government programs
   - Search and filtering capabilities
   - Detailed program information

3. **Recommendation Engine**
   - Matches users with suitable programs
   - Based on business type, size, industry, experience
   - Scoring algorithm with explanation

4. **Application Management**
   - Submit applications to programs
   - Track application status
   - View application history

5. **User Profiles**
   - Business information
   - Industry and size classification
   - Experience and revenue data

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Programs
- `GET /api/programs` - List programs (with pagination, filtering)
- `GET /api/programs/:id` - Get specific program
- `GET /api/programs/recommendations` - Get personalized recommendations

### Applications
- `POST /api/applications` - Submit application
- `GET /api/applications` - Get user's applications
- `GET /api/applications/:id` - Get specific application

## Environment Variables

### Backend
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=development|production
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### Frontend
```bash
VITE_API_URL=/api  # Uses proxy in development, direct in production
```

## Development Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build TypeScript
npm run start        # Start production server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Security Features

- JWT authentication with proper token verification
- Password hashing with bcrypt (12 rounds)
- CORS protection with environment-specific origins
- Rate limiting to prevent abuse
- Input validation with Joi
- Helmet middleware for security headers
- SQL injection protection with parameterized queries

## Production Considerations

1. **Environment Variables**: Set secure JWT_SECRET in production
2. **Database**: Uses Neon PostgreSQL (already configured)
3. **CORS**: Production origins are configured in server.ts
4. **Rate Limiting**: Enabled for production (100 req/15min per IP)
5. **Error Handling**: Different error details for dev/prod environments

## Support

The application includes:
- Comprehensive error handling
- Toast notifications for user feedback
- Loading states and proper UX
- Responsive design for all devices
- Modern React patterns with TypeScript
- Proper separation of concerns
- API documentation through code comments
