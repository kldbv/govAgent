import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../../routes/auth';
import { errorHandler } from '../../middleware/errorHandler';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock database
const mockQuery = jest.fn();
jest.mock('../../utils/database', () => ({
  query: mockQuery
}));

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock jwt
jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth API', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    app.use(errorHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'Test123456',
      full_name: 'Test User',
      phone: '+77771234567'
    };

    it('should register a new user successfully', async () => {
      // Mock database responses
      mockQuery
        .mockResolvedValueOnce({ rows: [] }) // Check if user exists
        .mockResolvedValueOnce({ // Insert new user
          rows: [{ 
            id: 1, 
            email: 'test@example.com', 
            full_name: 'Test User',
            created_at: new Date()
          }]
        });

      // Mock bcrypt
      mockBcrypt.hash.mockResolvedValueOnce('hashedPassword' as never);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.data.user).toHaveProperty('full_name', 'Test User');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject registration with existing email', async () => {
      mockQuery.mockResolvedValueOnce({ 
        rows: [{ id: 1, email: 'test@example.com' }] 
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User with this email already exists');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // too short
        full_name: '', // empty
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });

    it('should validate email format', async () => {
      const invalidEmailData = {
        ...validRegistrationData,
        email: 'not-an-email'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidEmailData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const weakPasswordData = {
        ...validRegistrationData,
        password: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle database errors', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData)
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'Test123456'
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
      full_name: 'Test User',
      phone: '+77771234567',
      is_active: true,
      created_at: new Date()
    };

    it('should login user successfully', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
      mockBcrypt.compare.mockResolvedValueOnce(true as never);
      mockJwt.sign.mockReturnValueOnce('fake-jwt-token' as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('token', 'fake-jwt-token');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should reject login with wrong password', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
      mockBcrypt.compare.mockResolvedValueOnce(false as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login for non-existent user', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login for inactive user', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockQuery.mockResolvedValueOnce({ rows: [inactiveUser] });

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Account is deactivated');
    });

    it('should validate login input', async () => {
      const invalidLoginData = {
        email: 'not-an-email',
        password: ''
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLoginData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    const validChangePasswordData = {
      current_password: 'OldPassword123',
      new_password: 'NewPassword123'
    };

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedOldPassword',
      full_name: 'Test User'
    };

    // Mock authentication middleware
    const authMiddleware = (req: any, res: any, next: any) => {
      req.user = { id: 1, email: 'test@example.com' };
      next();
    };

    beforeEach(() => {
      // Override the authenticate middleware for these tests
      jest.doMock('../../middleware/auth', () => ({
        authenticate: authMiddleware
      }));
    });

    it('should change password successfully', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockUser] }) // Get user
        .mockResolvedValueOnce({ rows: [] }); // Update password
      
      mockBcrypt.compare.mockResolvedValueOnce(true as never);
      mockBcrypt.hash.mockResolvedValueOnce('hashedNewPassword' as never);

      // Create a new app instance with mocked auth
      const testApp = express();
      testApp.use(cors());
      testApp.use(express.json());
      testApp.use((req: any, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
      });
      testApp.use('/api/auth', authRoutes);
      testApp.use(errorHandler);

      const response = await request(testApp)
        .post('/api/auth/change-password')
        .send(validChangePasswordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password changed successfully');
    });

    it('should reject wrong current password', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] });
      mockBcrypt.compare.mockResolvedValueOnce(false as never);

      const testApp = express();
      testApp.use(cors());
      testApp.use(express.json());
      testApp.use((req: any, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
      });
      testApp.use('/api/auth', authRoutes);
      testApp.use(errorHandler);

      const response = await request(testApp)
        .post('/api/auth/change-password')
        .send(validChangePasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Current password is incorrect');
    });

    it('should validate new password strength', async () => {
      const weakPasswordData = {
        current_password: 'OldPassword123',
        new_password: '123' // too weak
      };

      const testApp = express();
      testApp.use(cors());
      testApp.use(express.json());
      testApp.use((req: any, res, next) => {
        req.user = { id: 1, email: 'test@example.com' };
        next();
      });
      testApp.use('/api/auth', authRoutes);
      testApp.use(errorHandler);

      const response = await request(testApp)
        .post('/api/auth/change-password')
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Input validation', () => {
    it('should sanitize input data', async () => {
      const maliciousData = {
        email: 'test@example.com<script>alert("xss")</script>',
        password: 'Test123456',
        full_name: '<script>alert("xss")</script>Test User',
        phone: '+77771234567'
      };

      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ 
          rows: [{ id: 1, email: 'test@example.com', full_name: 'Test User' }]
        });

      mockBcrypt.hash.mockResolvedValueOnce('hashedPassword' as never);

      const response = await request(app)
        .post('/api/auth/register')
        .send(maliciousData)
        .expect(201);

      expect(response.body.data.user.full_name).not.toContain('<script>');
    });
  });
});
