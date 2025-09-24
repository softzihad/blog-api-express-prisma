import { prisma } from "../prisma.js";
import { z } from 'zod';

// Zod schemas
const createTagSchema = z.object({
  name: z.string().min(1, "Tag name is required")
});

const listTagsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

const updateTagSchema = z.object({
  name: z.string().min(1, "Tag name is required")
});

// Create a new tag
const createTag = async (req, res) => {
  try {
    const parsed = createTagSchema.safeParse(req.body);

    // Validation failed
    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    // Extract name
    const { name } = parsed.data;

    // if tag is already exists
    const existingTag = await prisma.tag.findUnique({
      where: { name: name }
    });

    if (existingTag) {
      return res.status(400).json({ error: 'Tag already exists' });
    }

    // Create tag
    const tag = await prisma.tag.create({ 
      data: { name }
    });
    res.status(201).json(tag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors.map(e => e.message) });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// List all tags with search, pagination, and sorting
const listTags = async (req, res) => {
  try {
    const queryParams = listTagsSchema.parse(req.query);
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

    // Get tags with pagination and search
    const tags = await prisma.tag.findMany({
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
    const totalTags = await prisma.tag.count({ where });
    const totalPages = Math.ceil(totalTags / limit);

    res.json({
      tags,
      pagination: {
        currentPage: page,
        totalPages,
        totalTags,
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

// Get single tag by ID
const getTag = async (req, res) => {
  try {
    // Validate ID param
    const id  = Number(req.params.id);    
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid id" });

    // Fetch tag with its posts
    const tag = await prisma.tag.findUnique({
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

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTag = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Invalid id" });

    // Validate input
    const parsed = updateTagSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ errors: parsed.error.flatten() });
    }

    const { name } = parsed.data;

    // Check if tag exists
    const existingTag = await prisma.tag.findUnique({
      where: { id: id }
    });

    if (!existingTag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Check if new name already exists (excluding current tag)
    const nameExists = await prisma.tag.findFirst({
      where: {
        name: name,
        NOT: { id: id }
      }
    });

    if (nameExists) {
      return res.status(400).json({ error: 'Tag name already exists' });
    }

    // Update tag
    const updatedTag = await prisma.tag.update({
      where: { id: id },
      data: { name }
    });

    res.json(updatedTag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors.map(e => e.message) });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export { createTag, listTags, getTag, updateTag };