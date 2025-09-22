import { prisma } from "../prisma.js";
import { z } from 'zod';

// Zod schemas
const createCategorySchema = z.object({
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


// list all categories



export { createCategory, listCategories };