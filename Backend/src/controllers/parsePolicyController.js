/**
 * parsePolicyController.js
 * ─────────────────────────
 * Handles:
 *   POST /api/parse-policy           → plain text input
 *   POST /api/parse-policy/document  → file upload (PDF / DOCX)
 */

const { buildRulesFromText, buildRulesFromFile } = require('../services/parsePolicyService');
const fs = require('fs');

// ── POST /api/parse-policy ─────────────────────────────────────────────────────
const parsePolicyText = async (req, res) => {
  try {
    const { policy_text } = req.body;

    if (!policy_text || typeof policy_text !== 'string') {
      return res.status(400).json({ message: 'policy_text is required.' });
    }

    if (policy_text.trim().length < 10) {
      return res.status(400).json({ message: 'Policy description is too short.' });
    }

    const result = await buildRulesFromText(policy_text);
    return res.status(200).json(result);

  } catch (error) {
    console.error('[parsePolicyText]', error.message);
    return res.status(500).json({
      message: error.message || 'Failed to parse policy text.',
    });
  }
};

// ── POST /api/parse-policy/document ───────────────────────────────────────────
const parsePolicyDocument = async (req, res) => {
  let filePath = null;

  try {
    // multer puts the uploaded file at req.file
    if (!req.file) {
      return res.status(400).json({ message: 'No document uploaded.' });
    }

    filePath = req.file.path;
    const mimeType = req.file.mimetype;
    const notes    = req.body.notes || '';

    // Validate MIME type
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!allowed.includes(mimeType)) {
      return res.status(400).json({
        message: 'Unsupported file type. Please upload a PDF or Word document.',
      });
    }

    const result = await buildRulesFromFile(filePath, mimeType, notes);
    return res.status(200).json(result);

  } catch (error) {
    console.error('[parsePolicyDocument]', error.message);
    return res.status(500).json({
      message: error.message || 'Failed to parse policy document.',
    });
  } finally {
    // Always clean up the temp file after processing
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

module.exports = { parsePolicyText, parsePolicyDocument };