import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization Header
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ error: 'Authorization header missing or invalid' });
    }

    // Extract Token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token not provided' });
    }

    // Verify Token
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token has expired' });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      return res.status(401).json({ error: 'Token verification failed' });
    }

    // Extract userId from payload
    const userId = payload?.userId;
    if (!userId || (typeof userId !== 'string' && typeof userId !== 'number')) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user without password
    const { password, ...safeUser } = user;
    req.user = safeUser;

    next();
  } catch (err) {
    console.error('authMiddleware error:', err.message || err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export { authMiddleware };
