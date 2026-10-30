const { ApiError } = require('../utils/errors');

// eslint-disable-next-line no-unused-vars
const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // PostgreSQL unique violation
  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
  }

  if (err instanceof ApiError) {
    return res.status(err.status).json({ success: false, message: err.message, errors: err.details });
  }

  if (err.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'That image is too large.' : err.message;
    return res.status(400).json({ success: false, message: msg });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Your session has expired. Please sign in again.' });
  }

  console.error('[api] Unhandled error:', err);
  return res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong on our side.' : err.message,
  });
};

module.exports = { notFound, errorHandler };
