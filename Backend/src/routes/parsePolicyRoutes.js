/**
 * parsePolicyRoutes.js
 * ─────────────────────
 * Mounts at: /api/parse-policy
 *
 * Routes:
 *   POST /api/parse-policy            → plain text
 *   POST /api/parse-policy/document   → file upload (PDF / DOCX)
 *
 * Auth: both routes require a valid JWT (authMiddleware)
 */

const express  = require('express');
const multer   = require('multer');
const path     = require('path');
const os       = require('os');
const { parsePolicyText, parsePolicyDocument } = require('../controllers/parsePolicyController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ── Multer config ──────────────────────────────────────────────────────────────
// Store files in the OS temp directory so they're automatically cleaned up
// even if something crashes before we manually delete them.
const upload = multer({
  dest: os.tmpdir(),

  limits: {
    fileSize: 10 * 1024 * 1024,   // 10 MB hard limit
    files:    1,
  },

  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word documents (.pdf, .doc, .docx) are accepted.'));
    }
  },
});

// ── Multer error handler (file too large / wrong type) ─────────────────────────
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File exceeds the 10 MB limit.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

// ── Routes ─────────────────────────────────────────────────────────────────────

// Plain text
router.post(
  '/',
  authMiddleware,
  parsePolicyText
);

// File upload
router.post(
  '/document',
  authMiddleware,
  upload.single('document'),
  handleMulterError,
  parsePolicyDocument
);

module.exports = router;