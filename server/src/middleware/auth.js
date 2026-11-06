import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { query } from '../db.js';
import { asyncHandler } from '../utils/httpError.js';

export const AUTH_COOKIE_NAME = 'sweety_session';

function getToken(req) {
  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }

  const header = req.get('authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }

  return null;
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Please log in to continue.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
  }

  if (!payload?.sub) {
    return res.status(401).json({ message: 'Please log in to continue.' });
  }

  const result = await query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [payload.sub],
  );

  if (result.rowCount === 0) {
    res.clearCookie(AUTH_COOKIE_NAME, { path: '/' });
    return res.status(401).json({ message: 'Please log in to continue.' });
  }

  const user = result.rows[0];
  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at,
  };

  return next();
});
