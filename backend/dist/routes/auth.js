"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const authController = new AuthController_1.AuthController();
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth_1.authenticate, authController.getProfile);
router.put('/profile', auth_1.authenticate, authController.updateProfile);
exports.default = router;
//# sourceMappingURL=auth.js.map