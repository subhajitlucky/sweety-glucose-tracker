import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';
import { AUTH_COOKIE_NAME, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/httpError.js';
import {
  firstValidationError,
  loginSchema,
  registerSchema,
} from '../utils/validation.js';

const router = Router();
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  };
}

function setSessionCookie(res, user) {
  const token = jwt.sign({}, config.jwtSecret, {
    subject: user.id,
    expiresIn: '7d',
  });

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: SESSION_DURATION_MS,
    path: '/',
  });
}

router.post('/register', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: firstValidationError(parsed) });
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  let result;
  try {
    result = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, passwordHash],
    );
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'An account with this email already exists. Try logging in instead.',
      });
    }
    throw error;
  }

  const user = result.rows[0];
  setSessionCookie(res, user);

  return res.status(201).json({ user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: firstValidationError(parsed) });
  }

  const { email, password } = parsed.data;
  const result = await query(
    'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
    [email],
  );

  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ message: 'Email or password is incorrect.' });
  }

  setSessionCookie(res, user);

  return res.json({ user: publicUser(user) });
}));

router.post('/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
  });
  return res.status(204).send();
});

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

export default router;
