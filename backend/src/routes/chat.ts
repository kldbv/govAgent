import { Router } from 'express';
import { ChatController } from '../controllers/ChatController';
import { authenticate } from '../middleware/auth';

const router = Router();
const chatController = new ChatController();

// All chat routes require authentication
router.use(authenticate);

// Send a message to AI assistant
router.post('/message', chatController.sendMessage);

// Get chat history
router.get('/history', chatController.getChatHistory);

// Clear chat history
router.delete('/history', chatController.clearChatHistory);

// Get contextual suggestions
router.get('/suggestions', chatController.generateSuggestions);

// Get chat insights and analytics
router.get('/insights', chatController.getInsights);

export default router;
