const { Router } = require('express');

const { authenticate } = require('../middleware/auth');
const { sendContactEmail } = require('../utils/mailer');
const { badRequest } = require('../utils/errors');

const router = Router();

/**
 * POST /api/contact — { subject, message }
 * The message is forwarded to env.CONTACT_EMAIL through Nodemailer.
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { subject, message } = req.body || {};
    if (!subject || String(subject).trim().length < 2) throw badRequest('Please add a subject.');
    if (!message || String(message).trim().length < 10) throw badRequest('Please write at least 10 characters.');

    await sendContactEmail({
      fromName: req.user.fullName,
      fromEmail: req.user.email,
      subject: String(subject).trim().slice(0, 120),
      message: String(message).trim().slice(0, 4000),
    });

    res.json({ success: true, message: 'Thanks! Your message is on its way to our team.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
