import express from 'express';
import { login, register, me } from '../controllers/authController.js';
import { authMiddleware }  from '../middlewares/authMiddleware.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);

export const authRouter = router;