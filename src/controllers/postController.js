import { prisma } from "../prisma.js";
import { z } from "zod";

// Zod schemas
const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  categoryId: z.number().int().positive("Valid category ID is required"),
  published: z.boolean().optional().default(false)
});

const listPostsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  category: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  published: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

const getPostSchema = z.object({
  id: z.string().transform(val => parseInt(val))
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

// Get all posts with pagination, search, and ordering
const listPosts = async (req, res) => {
  try {
    const parsed = listPostsSchema.safeParse(req.query);

    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    const { page, limit, search, category, published, sortBy, sortOrder } = parsed.data;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } }
      ];
    }

    // Filter by category
    if (category) {
      where.categoryId = category;
    }

    // Filter by published status
    if (published !== undefined) {
      where.published = published;
    }

    // Build orderBy clause
    const orderBy = { [sortBy]: sortOrder };

    // Get posts with pagination
    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, email: true }
          },
          category: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.post.count({ where })
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a single post by ID
const getPost = async (req, res) => {
  try {
    const parsed = getPostSchema.safeParse(req.params);

    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    const { id } = parsed.data;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        category: {
          select: { id: true, name: true }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Get post by ID error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export { createPost, listPosts, getPost };


// /posts?search=express&category=2&published=true&page=2&limit=20&sortBy=updatedAt&sortOrder=desc
  
// {
//     "title": "My Blog Post",
//     "content": "This is the content of my blog post",
//     "categoryId": 1,
//     "published": true
// }
