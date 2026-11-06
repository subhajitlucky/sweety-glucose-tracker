import { config } from '../config.js';

export function notFound(req, res) {
  res.status(404).json({ message: 'Not found.' });
}

// Express recognizes error middleware by its four arguments.
// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  const status = Number.isInteger(error.status) ? error.status : 500;

  if (status >= 500) {
    console.error(error);
  }

  const body = {
    message:
      status >= 500 && config.isProduction
        ? 'Something went wrong. Please try again.'
        : error.message || 'Something went wrong. Please try again.',
  };

  if (error.details) {
    body.details = error.details;
  }

  if (!config.isProduction && status >= 500 && error.stack) {
    body.stack = error.stack;
  }

  res.status(status).json(body);
}
