const rateLimit = require('express-rate-limit');

const message = (seconds) => ({
  success: false,
  message: `Too many requests. Please try again in ${Math.ceil(seconds / 60)} minute(s).`,
});

/** Broad limiter for the whole /api surface. */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(message(req.rateLimit.resetTime - Date.now())),
});

/** Stricter limiter for login / signup / logout. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(message(req.rateLimit.resetTime - Date.now())),
});

/** Very strict limiter for password-reset emails (protects the SMTP quota). */
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(message(req.rateLimit.resetTime - Date.now())),
});

const graphqlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(message(req.rateLimit.resetTime - Date.now())),
});

module.exports = { apiLimiter, authLimiter, passwordResetLimiter, graphqlLimiter };
