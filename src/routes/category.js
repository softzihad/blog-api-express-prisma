import express from 'express';
import { createCategory, listCategories, getSingleCategory } from '../controllers/categoryController.js';
import { authMiddleware }  from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createCategory);
router.get('/', authMiddleware, listCategories);
router.get('/:id', authMiddleware, getSingleCategory);



export const categoryRouter = router;