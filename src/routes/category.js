import express from 'express';
import { createCategory } from '../controllers/categoryController.js';
import { authMiddleware }  from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createCategory);


export const categoryRouter = router;