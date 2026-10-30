const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const env = require('../config/env');

const signToken = (user) =>
  jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: 'HS256',
  });

const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

/**
 * Password-reset tokens are random, shown once in the email, and stored in the
 * database only as a SHA-256 hash so a DB leak cannot leak usable tokens.
 */
function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, hash: sha256(token) };
}

module.exports = { signToken, verifyToken, sha256, generateResetToken };
