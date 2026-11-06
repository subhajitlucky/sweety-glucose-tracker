import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { healthCheck } from './db.js';
import authRoutes from './routes/auth.js';
import readingRoutes from './routes/readings.js';
import reportRoutes from './routes/reports.js';
import { errorHandler, notFound } from './middleware/error.js';
import { asyncHandler } from './utils/httpError.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: config.clientUrl,
    credentials: true,
  }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  if (!config.isTest) {
    app.use((req, res, next) => {
      const startedAt = Date.now();
      res.on('finish', () => {
        console.log(
          `${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`,
        );
      });
      next();
    });
  }

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 40,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => config.isTest,
    message: { message: 'Too many attempts. Please try again in a few minutes.' },
  });

  app.get('/api/health', asyncHandler(async (req, res) => {
    await healthCheck();
    res.json({ status: 'ok' });
  }));

  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/readings', readingRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api', notFound);

  const indexHtml = path.join(config.publicDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(config.publicDir, { index: false }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      return res.sendFile(indexHtml);
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
