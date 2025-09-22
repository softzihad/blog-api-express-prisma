import { prisma } from "../prisma.js";
import { z } from 'zod';

// Zod schemas
const createCategorySchema = z.object({
  name: z.string().min(1, "name is required")
});

const listCategoriesSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

const updateCategorySchema = z.object({
  name: z.string().min(1, "name is required")
});


// Create a new category
const createCategory = async (req, res) => {
  try {
    const data = createCategorySchema.parse(req.body);

    // if category is already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name: data.name }
    });
    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = await prisma.category.create({ data });
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors.map(e => e.message) });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


// List all categories with search, pagination, and sorting
const listCategories = async (req, res) => {
  try {
    const queryParams = listCategoriesSchema.parse(req.query);
    const { page, limit, search, sortBy, sortOrder } = queryParams;

    const skip = (page - 1) * limit;

    // Build where clause for search
    const where = search
      ? {
          name: {
            contains: search
          }
        }
      : {};

    // Build orderBy clause
    const orderBy = {
      [sortBy]: sortOrder
    };

    // Get categories with pagination and search
    const categories = await prisma.category.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        posts: true,
        _count: {
          select: { posts: true }
        }
      }
    });

    // Get total count for pagination
    const totalCategories = await prisma.category.count({ where });
    const totalPages = Math.ceil(totalCategories / limit);

    res.json({
      categories,
      pagination: {
        currentPage: page,
        totalPages,
        totalCategories,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        limit
      },
      filters: {
        search: search || null,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors.map(e => e.message) });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get single category by ID
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        posts: {
          include: {
            author: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { posts: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update category by ID
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateCategorySchema.parse(req.body);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if new name already exists (excluding current category)
    const nameExists = await prisma.category.findFirst({
      where: {
        name: data.name,
        NOT: { id: parseInt(id) }
      }
    });

    if (nameExists) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data
    });

    res.json(updatedCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors.map(e => e.message) });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// API Usage:
// GET /categories?page=1&limit=5&search=tech&sortBy=name&sortOrder=asc
// GET /categories/:id
// PUT /categories/:id

export { createCategory, listCategories, getCategory, updateCategory };