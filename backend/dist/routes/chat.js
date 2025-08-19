"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ChatController_1 = require("../controllers/ChatController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const chatController = new ChatController_1.ChatController();
router.use(auth_1.authenticate);
router.post('/message', chatController.sendMessage);
router.get('/history', chatController.getChatHistory);
router.delete('/history', chatController.clearChatHistory);
router.get('/suggestions', chatController.generateSuggestions);
router.get('/insights', chatController.getInsights);
exports.default = router;
//# sourceMappingURL=chat.js.map