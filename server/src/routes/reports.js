import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getReports } from '../services/reports.js';
import { todayISO } from '../utils/date.js';
import { asyncHandler } from '../utils/httpError.js';
import {
  firstValidationError,
  reportQuerySchema,
} from '../utils/validation.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const parsed = reportQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: firstValidationError(parsed) });
  }

  const selectedDate = parsed.data.date || todayISO();
  const reports = await getReports(req.user.id, selectedDate);

  return res.json({ reports });
}));

export default router;
