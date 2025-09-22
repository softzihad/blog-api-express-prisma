import express from 'express';
import { login, register, me, upsertProfile } from '../controllers/authController.js';
import { authMiddleware }  from '../middlewares/authMiddleware.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, me);
router.put('/me/profile', authMiddleware, upsertProfile);

export const authRouter = router;