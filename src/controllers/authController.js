import { prisma } from "../prisma.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// Zod schemas
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required')
});

// JWT generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
};

const register = async (req, res) => {
  try {
    // Validate input
    const data = registerSchema.parse(req.body);

    // Hash password
    const hashed = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password: hashed }
    });

    // Generate JWT
    const token = generateToken(user.id);

    // Send response
    res.status(201).json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ errors: err.errors.map(e => e.message) });

    if (err.code === 'P2002') return res.status(400).json({ error: 'Email already in use' });

    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    // Validate input
    const data = loginSchema.parse(req.body);
    
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Check password
    const match = await bcrypt.compare(data.password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    // Generate JWT
    const token = generateToken(user.id);

    // Send response
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ errors: err.errors.map(e => e.message) });

    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const me = async (req, res) => {
  res.json({ user: req.user });
};

export { register, login, me };
