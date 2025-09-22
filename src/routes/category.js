import express from 'express';
import { createCategory, listCategories, getCategory } from '../controllers/categoryController.js';
import { authMiddleware }  from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createCategory);
router.get('/', authMiddleware, listCategories);
router.get('/:id', authMiddleware, getCategory);



export const categoryRouter = router;