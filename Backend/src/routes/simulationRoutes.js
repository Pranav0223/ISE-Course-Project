/**
 * simulationRoutes.js
 * ────────────────────
 * Mounts at: /api/simulate
 *
 * Routes:
 *   POST /api/simulate  → runs simulation on citizens collection
 *
 * Auth: requires valid JWT
 */

const express    = require('express');
const router     = express.Router();
const { simulate } = require('../controllers/simulationController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, simulate);

module.exports = router;