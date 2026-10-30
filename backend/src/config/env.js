require('dotenv').config();

const path = require('path');

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT || 5000),
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  APP_CLIENT_URL: process.env.APP_CLIENT_URL || 'http://localhost:19006',

  DATABASE_URL: process.env.DATABASE_URL || '',
  DB_SSL: process.env.DB_SSL || '',

  JWT_SECRET: process.env.JWT_SECRET || 'dev_only_secret_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT || 587),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_FROM: process.env.SMTP_FROM || 'Campus OS <no-reply@campusos.app>',
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || 'support@campusos.app',

  MAX_UPLOAD_MB: Number(process.env.MAX_UPLOAD_MB || 5),
  UPLOAD_DIR: path.join(__dirname, '..', '..', 'uploads'),
};

env.isProduction = env.NODE_ENV === 'production';
env.isMailConfigured = Boolean(env.SMTP_HOST);

if (env.isProduction && (!env.DATABASE_URL || env.JWT_SECRET === 'dev_only_secret_change_me')) {
  throw new Error('DATABASE_URL and a strong JWT_SECRET are required in production.');
}

module.exports = env;
