const nodemailer = require('nodemailer');
const env = require('../config/env');

/**
 * When SMTP_* is not configured the mailer runs in dev mode: nothing is
 * delivered, instead the full message is printed to the server console so the
 * password-reset / contact flows stay testable locally.
 */
function createTransport() {
  if (!env.isMailConfigured) {
    return nodemailer.createTransport({ jsonTransport: true });
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE || env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
}

/** Minimal, dependency-free branded email template. */
function renderEmail({ title, intro, ctaLabel, ctaUrl, footer }) {
  const button = ctaUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0;"><tr><td style="background:#14532D;border-radius:12px;">
         <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:600;font-family:Arial,sans-serif;">${ctaLabel}</a>
       </td></tr></table>
       <p style="color:#6b7280;font-size:13px;">Or paste this code in the app: <b style="color:#14532D;">${ctaLabel === 'Open Campus OS' ? '' : ''}${ctaUrl.split('token=')[1] || ''}</b></p>`
    : '';

  return `<!doctype html><html><body style="margin:0;background:#f0f6f1;padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;padding:36px;font-family:Arial,Helvetica,sans-serif;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#5D9A6D;font-weight:700;">Campus OS</p>
          <h1 style="margin:0 0 12px;font-size:24px;color:#14532D;">${title}</h1>
          <p style="margin:0;font-size:15px;line-height:1.6;color:#374151;">${intro}</p>
          ${button}
          <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;">${footer || 'If you did not request this, you can safely ignore this email.'}</p>
        </td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

async function sendMail({ to, subject, text, html, replyTo }) {
  const info = await createTransport().sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    text,
    html,
    replyTo,
  });

  if (!env.isMailConfigured) {
    console.info('\n────────── 📧 [dev mailer] ──────────');
    console.info(`To:      ${to}`);
    console.info(`Subject: ${subject}`);
    console.info(text);
    console.info('──────────────────────────────────────\n');
  }

  return info;
}

const sendPasswordResetEmail = (to, token) => {
  const ctaUrl = `${env.APP_CLIENT_URL}/reset-password?token=${token}`;
  return sendMail({
    to,
    subject: 'Reset your Campus OS password',
    text: `Hi! Use this link to reset your Campus OS password: ${ctaUrl}\n\nThe link is valid for 30 minutes. If you did not request this, ignore this email.`,
    html: renderEmail({
      title: 'Reset your password',
      intro: 'We received a request to reset the password for your Campus OS account. Click the button below to choose a new one.',
      ctaLabel: 'Reset password',
      ctaUrl,
    }),
  });
};

const sendContactEmail = ({ fromName, fromEmail, subject, message }) =>
  sendMail({
    to: env.CONTACT_EMAIL,
    replyTo: fromEmail,
    subject: `[Campus OS] ${subject}`,
    text: `From: ${fromName} <${fromEmail}>\n\n${message}`,
    html: renderEmail({
      title: subject,
      intro: message.replace(/\n/g, '<br/>'),
      footer: `Sent from Campus OS · ${fromName} &lt;${fromEmail}&gt;`,
    }),
  });

module.exports = { sendMail, sendPasswordResetEmail, sendContactEmail, renderEmail };
