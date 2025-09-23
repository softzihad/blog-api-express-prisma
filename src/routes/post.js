import express from 'express';
import { createPost, listPosts } from '../controllers/postController.js';
import { authMiddleware }  from '../middlewares/authMiddleware.js';

const router = express.Router();

// Post routes
router.get('/', authMiddleware, listPosts);
router.post('/', authMiddleware, createPost);

export const postRouter = router;