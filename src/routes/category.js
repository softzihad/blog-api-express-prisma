import express from 'express';
import { createCategory, listCategories } from '../controllers/categoryController.js';
import { authMiddleware }  from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authMiddleware, createCategory);
router.get('/', authMiddleware, listCategories);



export const categoryRouter = router;