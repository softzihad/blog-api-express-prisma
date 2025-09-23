import express from 'express';
import { createTag, listTags } from '../controllers/tagController.js';
import { authMiddleware }  from '../middlewares/authMiddleware.js';

const router = express.Router();

// Tag routes
router.post('/', authMiddleware, createTag);
router.get('/', authMiddleware, listTags);


export const tagRouter = router;