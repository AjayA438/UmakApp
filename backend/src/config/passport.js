const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcryptjs');

const env = require('./env');
const { findCredentialsById, findCredentialsByEmail, findPublicById } = require('../services/user.service');

/**
 * Local strategy: verifies email + password on POST /api/auth/login.
 */
passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const record = await findCredentialsByEmail(String(email || '').trim().toLowerCase());
        if (!record) return done(null, false, { message: 'Invalid email or password.' });

        const valid = await bcrypt.compare(String(password || ''), record.password_hash);
        if (!valid) return done(null, false, { message: 'Invalid email or password.' });

        return done(null, record);
      } catch (error) {
        return done(error);
      }
    }
  )
);

/**
 * JWT strategy: authenticates every protected request from the mobile app
 * via the `Authorization: Bearer <token>` header.
 */
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: env.JWT_SECRET,
      algorithms: ['HS256'],
    },
    async (payload, done) => {
      try {
        if (!payload?.sub) return done(null, false);
        const user = await findPublicById(payload.sub);
        return done(null, user || false);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
