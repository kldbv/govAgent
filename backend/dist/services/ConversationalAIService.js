"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationalAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const database_1 = __importDefault(require("../utils/database"));
class ConversationalAIService {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async analyzeUserIntent(message, userProfile) {
        const systemPrompt = `
    You are an AI assistant for a Kazakhstan business support platform. Analyze user messages to understand their intent and extract relevant business information.

    User Profile Context: ${userProfile ? JSON.stringify(userProfile, null, 2) : 'No profile available'}

    Analyze the user's message and respond with a JSON object containing:
    1. intent: One of ['profile_completion', 'program_search', 'guidance_request', 'general_question']
    2. extracted_data: Object with any business information mentioned (business_type, business_size, industry, location, region, funding_needs, oked_code, program_types)
    3. confidence: Number between 0-1 indicating confidence in the analysis
    4. suggested_actions: Array of strings suggesting next steps

    Focus on Kazakhstan-specific business context, regions (Almaty, Astana, etc.), and common business types in Kazakhstan.
    
    Respond only with valid JSON.
    `;
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.3,
                max_tokens: 800
            });
            const response = completion.choices[0]?.message?.content;
            if (!response) {
                throw new Error('No response from OpenAI');
            }
            return JSON.parse(response);
        }
        catch (error) {
            console.error('Error analyzing user intent:', error);
            return {
                intent: 'general_question',
                extracted_data: {},
                confidence: 0.1,
                suggested_actions: ['Please rephrase your question for better assistance']
            };
        }
    }
    async generateResponse(message, intent, userProfile, chatHistory) {
        const systemPrompt = `
    You are a helpful AI assistant for a Kazakhstan business support platform. You help businesses find government programs, grants, and support services.

    Context:
    - Platform serves Kazakhstan businesses
    - Available programs include grants, loans, tax incentives, training programs
    - User profile: ${userProfile ? JSON.stringify(userProfile, null, 2) : 'Not available'}
    - Detected intent: ${intent.intent}
    - Extracted data: ${JSON.stringify(intent.extracted_data)}

    Guidelines:
    1. Be helpful and conversational in Russian or English based on user preference
    2. If profile is incomplete, guide user to complete it
    3. For program searches, mention you can find specific programs
    4. Always be encouraging and supportive
    5. Use Kazakhstan-specific business terminology when appropriate
    6. Keep responses concise but informative
    `;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...(chatHistory || []).slice(-10),
            { role: 'user', content: message }
        ];
        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4',
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            });
            return completion.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
        }
        catch (error) {
            console.error('Error generating AI response:', error);
            return 'I\'m having trouble processing your request right now. Please try again in a moment.';
        }
    }
    async saveChatMessage(userId, message, response, intent) {
        try {
            await database_1.default.query(`INSERT INTO chat_history (user_id, user_message, ai_response, intent, extracted_data, confidence, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [userId, message, response, intent.intent, JSON.stringify(intent.extracted_data), intent.confidence]);
        }
        catch (error) {
            console.error('Error saving chat message:', error);
        }
    }
    async getChatHistory(userId, limit = 20) {
        try {
            const result = await database_1.default.query(`SELECT user_message, ai_response, created_at 
         FROM chat_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`, [userId, limit]);
            const messages = [];
            result.rows.reverse().forEach(row => {
                messages.push({ role: 'user', content: row.user_message }, { role: 'assistant', content: row.ai_response });
            });
            return messages;
        }
        catch (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }
    }
    async updateProfileFromIntent(userId, intent) {
        const { extracted_data } = intent;
        if (!extracted_data || Object.keys(extracted_data).length === 0) {
            return;
        }
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (extracted_data.business_type) {
            updates.push(`business_type = $${paramIndex}`);
            values.push(extracted_data.business_type);
            paramIndex++;
        }
        if (extracted_data.business_size) {
            updates.push(`business_size = $${paramIndex}`);
            values.push(extracted_data.business_size);
            paramIndex++;
        }
        if (extracted_data.industry) {
            updates.push(`industry = $${paramIndex}`);
            values.push(extracted_data.industry);
            paramIndex++;
        }
        if (extracted_data.location) {
            updates.push(`location = $${paramIndex}`);
            values.push(extracted_data.location);
            paramIndex++;
        }
        if (extracted_data.region) {
            updates.push(`region = $${paramIndex}`);
            values.push(extracted_data.region);
            paramIndex++;
        }
        if (extracted_data.funding_needs) {
            updates.push(`desired_loan_amount = $${paramIndex}`);
            values.push(extracted_data.funding_needs);
            paramIndex++;
        }
        if (extracted_data.oked_code) {
            updates.push(`oked_code = $${paramIndex}`);
            values.push(extracted_data.oked_code);
            paramIndex++;
        }
        if (updates.length === 0) {
            return;
        }
        try {
            values.push(userId);
            await database_1.default.query(`UPDATE user_profiles 
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE user_id = $${paramIndex}`, values);
        }
        catch (error) {
            console.error('Error updating profile from intent:', error);
        }
    }
}
exports.ConversationalAIService = ConversationalAIService;
//# sourceMappingURL=ConversationalAIService.js.map