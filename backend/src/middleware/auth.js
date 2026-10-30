const passport = require('passport');
const { unauthorized } = require('../utils/errors');

/** Rejects the request unless a valid JWT was supplied. */
const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return next(unauthorized('Your session has expired. Please sign in again.'));
    req.user = user;
    return next();
  })(req, res, next);
};

module.exports = { authenticate };
