import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createReading,
  deleteReading,
  getReading,
  listReadings,
  updateReading,
} from '../services/readings.js';
import { asyncHandler, HttpError } from '../utils/httpError.js';
import {
  firstValidationError,
  idSchema,
  readingSchema,
  readingUpdateSchema,
} from '../utils/validation.js';

const router = Router();

router.use(requireAuth);

function parsePage(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function getValidId(req) {
  const parsed = idSchema.safeParse(req.params.id);
  if (!parsed.success) {
    throw new HttpError(404, 'Reading not found.');
  }
  return parsed.data;
}

router.get('/', asyncHandler(async (req, res) => {
  const page = parsePage(req.query.page, 1);
  const limit = Math.min(100, parsePage(req.query.limit, 20));

  const result = await listReadings(req.user.id, page, limit);
  return res.json(result);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const reading = await getReading(req.user.id, getValidId(req));
  return res.json({ reading });
}));

router.post('/', asyncHandler(async (req, res) => {
  const parsed = readingSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: firstValidationError(parsed) });
  }

  const reading = await createReading(req.user.id, parsed.data);
  return res.status(201).json({ reading });
}));

const updateHandler = asyncHandler(async (req, res) => {
  const parsed = readingUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: firstValidationError(parsed) });
  }

  const reading = await updateReading(
    req.user.id,
    getValidId(req),
    parsed.data,
  );
  return res.json({ reading });
});

router.put('/:id', updateHandler);
router.patch('/:id', updateHandler);

router.delete('/:id', asyncHandler(async (req, res) => {
  await deleteReading(req.user.id, getValidId(req));
  return res.status(204).send();
}));

export default router;
