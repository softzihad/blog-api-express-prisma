import express from 'express';
import { createCategory, listCategories, getCategory, updateCategory } from '../controllers/categoryController.js';
import { authMiddleware }  from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createCategory);
router.get('/', authMiddleware, listCategories);
router.get('/:id', authMiddleware, getCategory);
router.put('/:id', authMiddleware, updateCategory);



export const categoryRouter = router;