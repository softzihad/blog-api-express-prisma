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
    const parsed = createPostSchema.safeParse(req.body);
    const authorId = req.user.id; // From auth middleware

    // Validation failed
    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    // Extract data
    const { ...data } = parsed.data;

    // Check if category exists
    const categoryExists = await prisma.category.findUnique({
      where: { id: data.categoryId }
    });

    if (!categoryExists) {
      return res.status(400).json({ error: 'Category not found' });
    }

    // Create post
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

// {
//     "title": "My Blog Post",
//     "content": "This is the content of my blog post",
//     "categoryId": 1,
//     "published": true
// }
