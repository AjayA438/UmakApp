const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const env = require('../config/env');
const { ApiError } = require('../utils/errors');

fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|jpg|png|webp|gif)$/.test(file.mimetype)) return cb(null, true);
  return cb(new ApiError('Only JPG, PNG, WEBP or GIF images are allowed.', 415));
};

/** Single-image upload used for the student profile photo. */
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
});

module.exports = upload;
