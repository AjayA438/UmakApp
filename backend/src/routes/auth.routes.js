const { Router } = require('express');
const passport = require('passport');

const authService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth');
const { passwordResetLimiter } = require('../middleware/rateLimiter');
const { validateSignup, validateLogin, isStrongPassword, isValidEmail } = require('../utils/validators');
const { badRequest } = require('../utils/errors');

const router = Router();

/**
 * POST /api/auth/signup
 * Body: { fullName, email, password, schoolName? }
 */
router.post('/signup', async (req, res, next) => {
  try {
    const { fullName, email, password, schoolName } = req.body || {};
    validateSignup({ fullName, email, password });

    const { user, token } = await authService.register({ fullName, email, password, schoolName });
    res.status(201).json({ success: true, message: 'Welcome to Campus OS!', user, token });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password } — verified by the Passport local strategy.
 */
router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ success: false, message: info?.message || 'Invalid email or password.' });

    const payload = authService.login(user);
    return res.json({ success: true, message: `Welcome back, ${user.full_name}!`, ...payload });
  })(req, res, next);
});

/**
 * POST /api/auth/forgot-password
 * Body: { email } — always answers 200 to prevent account enumeration.
 * Rate limited to 5 requests / hour per IP.
 */
router.post('/forgot-password', passwordResetLimiter, async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!isValidEmail(email)) throw badRequest('Please enter a valid email address.');

    await authService.forgotPassword(email);
    res.json({
      success: true,
      message: 'If an account exists for that email, a password reset link is on its way.',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (!isStrongPassword(password)) {
      throw badRequest('Password must be at least 8 characters and contain a letter and a number.', {
        password: 'Password must be at least 8 characters and contain a letter and a number.',
      });
    }

    await authService.resetPassword({ token, password });
    res.json({ success: true, message: 'Password updated. You can sign in now.' });
  } catch (error) {
    next(error);
  }
});

/** GET /api/auth/me — current session check. */
router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

/** POST /api/auth/logout — the app is stateless (JWT), so logout = discard the token. */
router.post('/logout', authenticate, (req, res) => {
  res.json({ success: true, message: 'Signed out.' });
});

module.exports = router;
