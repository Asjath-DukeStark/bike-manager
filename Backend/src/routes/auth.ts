import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

/**
 * POST /api/auth/login
 * Body: { username: string, pin: string }
 * Returns: { data: { token: string } }
 */
router.post('/login', (req: Request, res: Response): void => {
  const { username, pin } = req.body as { username?: string; pin?: string };

  if (!username || !pin) {
    res.status(400).json({ error: 'Username and PIN are required.' });
    return;
  }

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPin = process.env.ADMIN_PIN || '1234';
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';

  if (!secret) {
    res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET is not set.' });
    return;
  }

  // Validate credentials
  if (username !== adminUsername || pin !== adminPin) {
    res.status(401).json({ error: 'Incorrect username or PIN.' });
    return;
  }

  // Sign JWT
  const token = jwt.sign({ username }, secret, { expiresIn } as jwt.SignOptions);

  res.json({ data: { token } });
});

export default router;
