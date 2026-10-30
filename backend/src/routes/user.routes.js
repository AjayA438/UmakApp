const { Router } = require('express');

const userService = require('../services/user.service');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { badRequest } = require('../utils/errors');
const { isValidEmail } = require('../utils/validators');

const router = Router();

router.use(authenticate);

/** GET /api/user/profile */
router.get('/profile', async (req, res, next) => {
  try {
    const user = await userService.findPublicById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

/** GET /api/user/stats — counters shown on the Profile screen. */
router.get('/stats', async (req, res, next) => {
  try {
    res.json({ success: true, stats: await userService.getStats(req.user.id) });
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/user/profile — { fullName?, schoolName?, language?, email? } */
router.patch('/profile', async (req, res, next) => {
  try {
    const { fullName, schoolName, language, email } = req.body || {};

    if (fullName !== undefined && String(fullName).trim().length < 2) throw badRequest('Please enter a valid name.');
    if (email !== undefined && !isValidEmail(email)) throw badRequest('Please enter a valid email address.');
    if (language !== undefined && !['en', 'de', 'es', 'fr', 'pt'].includes(language)) {
      throw badRequest('Unsupported language.');
    }

    if (email !== undefined && email !== req.user.email) {
      const existing = await userService.findPublicByEmail(email);
      if (existing) throw badRequest('That email is already in use.');
      const { query } = require('../config/db');
      await query('update users set email = $2, updated_at = now() where id = $1', [req.user.id, email]);
    }

    const user = await userService.updateProfile(req.user.id, { fullName, schoolName, language });
    res.json({ success: true, message: 'Profile updated.', user });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/user/avatar — multipart/form-data, field name: `photo`.
 * The image lands in backend/uploads and is served back at /uploads/<file>.
 */
router.post('/avatar', upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) throw badRequest('No image received. Send the file in a "photo" field.');

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await userService.setAvatar(req.user.id, avatarUrl);
    res.json({ success: true, message: 'Profile photo updated.', user, avatarUrl });
  } catch (error) {
    next(error);
  }
});

/** POST /api/user/reset-account — clears tasks + courses, keeps the login. */
router.post('/reset-account', async (req, res, next) => {
  try {
    await userService.clearLearningData(req.user.id);
    res.json({ success: true, message: 'All tasks and courses were deleted.' });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/user/account — deletes the user (rows cascade). */
router.delete('/account', async (req, res, next) => {
  try {
    // The JWT already proves the session; if the client sends a password
    // (e.g. a web client asking for re-authentication) it must match.
    const { password } = req.body || {};
    if (password) {
      const bcrypt = require('bcryptjs');
      const credentials = await userService.findCredentialsById(req.user.id);
      const valid = credentials && (await bcrypt.compare(password, credentials.password_hash));
      if (!valid) throw badRequest('Incorrect password.', { password: 'Incorrect password.' });
    }

    await userService.deleteUser(req.user.id);
    res.json({ success: true, message: 'Your account has been deleted.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
