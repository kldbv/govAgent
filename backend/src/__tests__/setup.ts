import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';

// Mock OpenAI for tests
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                intent: 'general_question',
                extracted_data: {},
                confidence: 0.8,
                suggested_actions: ['Test suggestion']
              })
            }
          }]
        })
      }
    }
  }));
});

// Global test timeout
beforeAll(() => {
  jest.setTimeout(30000);
});

afterAll(() => {
  // Clean up any resources
});
