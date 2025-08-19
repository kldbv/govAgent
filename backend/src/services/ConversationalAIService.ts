import OpenAI from 'openai';
import pool from '../utils/database';

interface UserProfile {
  id: number;
  user_id: number;
  business_type: string;
  business_size: string;
  industry: string;
  location: string;
  annual_revenue?: number;
  employee_count?: number;
  funding_stage: string;
  bin?: string;
  oked_code?: string;
  region?: string;
  desired_loan_amount?: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ConversationIntent {
  intent: 'profile_completion' | 'program_search' | 'guidance_request' | 'general_question';
  extracted_data: {
    business_type?: string;
    business_size?: string;
    industry?: string;
    location?: string;
    region?: string;
    funding_needs?: number;
    oked_code?: string;
    program_types?: string[];
  };
  confidence: number;
  suggested_actions: string[];
}

export class ConversationalAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeUserIntent(message: string, userProfile?: UserProfile): Promise<ConversationIntent> {
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

      return JSON.parse(response) as ConversationIntent;
    } catch (error) {
      console.error('Error analyzing user intent:', error);
      
      // Fallback intent analysis
      return {
        intent: 'general_question',
        extracted_data: {},
        confidence: 0.1,
        suggested_actions: ['Please rephrase your question for better assistance']
      };
    }
  }

  async generateResponse(
    message: string, 
    intent: ConversationIntent,
    userProfile?: UserProfile,
    chatHistory?: ChatMessage[]
  ): Promise<string> {
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

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(chatHistory || []).slice(-10), // Keep last 10 messages for context
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
    } catch (error) {
      console.error('Error generating AI response:', error);
      return 'I\'m having trouble processing your request right now. Please try again in a moment.';
    }
  }

  async saveChatMessage(userId: number, message: string, response: string, intent: ConversationIntent): Promise<void> {
    try {
      await pool.query(
        `INSERT INTO chat_history (user_id, user_message, ai_response, intent, extracted_data, confidence, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [userId, message, response, intent.intent, JSON.stringify(intent.extracted_data), intent.confidence]
      );
    } catch (error) {
      console.error('Error saving chat message:', error);
      // Don't throw - chat should continue even if saving fails
    }
  }

  async getChatHistory(userId: number, limit: number = 20): Promise<ChatMessage[]> {
    try {
      const result = await pool.query(
        `SELECT user_message, ai_response, created_at 
         FROM chat_history 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
      );

      const messages: ChatMessage[] = [];
      
      // Convert to chat format (reverse order to get chronological)
      result.rows.reverse().forEach(row => {
        messages.push(
          { role: 'user', content: row.user_message },
          { role: 'assistant', content: row.ai_response }
        );
      });

      return messages;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  }

  async updateProfileFromIntent(userId: number, intent: ConversationIntent): Promise<void> {
    const { extracted_data } = intent;
    
    if (!extracted_data || Object.keys(extracted_data).length === 0) {
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Map extracted data to profile fields
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
      await pool.query(
        `UPDATE user_profiles 
         SET ${updates.join(', ')}, updated_at = NOW()
         WHERE user_id = $${paramIndex}`,
        values
      );
    } catch (error) {
      console.error('Error updating profile from intent:', error);
    }
  }
}
