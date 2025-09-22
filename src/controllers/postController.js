import { prisma } from "../prisma.js";
import { z } from "zod";

// Zod schemas
const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  categoryId: z.number().int().positive("Valid category ID is required"),
  published: z.boolean().optional().default(false)
});

// Create a new post
const createPost = async (req, res) => {
  try {
    const data = createPostSchema.parse(req.body);
    const authorId = req.user.id; // From auth middleware

    // Check if category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });

    if (!categoryExists) {
      return res.status(400).json({ error: 'Category not found' });
    }

    const post = await prisma.post.create({
      data: {
        ...data,
        authorId
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors.map(e => e.message) });
    }
    console.error('Post creation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export { createPost };
