import express from 'express';
import { login, register, me} from '../controllers/authController.js';

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.get('/me', me);

export const authRouter = router;