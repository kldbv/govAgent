"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.test' });
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
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
beforeAll(() => {
    jest.setTimeout(30000);
});
afterAll(() => {
});
//# sourceMappingURL=setup.js.map