/**
 * simulationController.js
 * ────────────────────────
 * POST /api/simulate
 * Body: { policy_text, rules: Rule[] }
 *
 * Filters the citizens collection using the rules,
 * then returns counts and breakdowns by:
 *   - social_category
 *   - rural_urban
 *   - gender
 *   - top 5 states by coverage %
 */

const Citizen = require('../models/CitizenModel');

// ── Build MongoDB query from rules array ───────────────────────────────────────
const buildMongoQuery = (rules) => {
  const query = {};

  rules.forEach(({ field, operator, value }) => {
    switch (operator) {
      case 'equals':
        query[field] = value;
        break;
      case 'not_equals':
        query[field] = { $ne: value };
        break;
      case 'greater_than':
        query[field] = { ...query[field], $gt: value };
        break;
      case 'less_than':
        query[field] = { ...query[field], $lt: value };
        break;
      case 'greater_than_or_equal':
        query[field] = { ...query[field], $gte: value };
        break;
      case 'less_than_or_equal':
        query[field] = { ...query[field], $lte: value };
        break;
      case 'in_list':
        query[field] = { $in: Array.isArray(value) ? value : [value] };
        break;
      case 'not_in_list':
        query[field] = { $nin: Array.isArray(value) ? value : [value] };
        break;
      case 'is_true':
        query[field] = true;
        break;
      case 'is_false':
        query[field] = false;
        break;
      default:
        break;
    }
  });

  return query;
};

// ── Count by field helper ──────────────────────────────────────────────────────
const countByField = async (matchQuery, groupField) => {
  const results = await Citizen.aggregate([
    { $match: matchQuery },
    { $group: { _id: `$${groupField}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  // Convert to { FieldValue: count } object
  return results.reduce((acc, { _id, count }) => {
    if (_id !== null && _id !== undefined) acc[_id] = count;
    return acc;
  }, {});
};

// ── Main controller ────────────────────────────────────────────────────────────
const simulate = async (req, res) => {
  try {
    const { policy_text, rules } = req.body;

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return res.status(400).json({ message: 'Rules array is required and must not be empty.' });
    }

    // Build the MongoDB filter from rules
    const matchQuery = buildMongoQuery(rules);

    // Total population
    const total_population = await Citizen.countDocuments();

    // Eligible count
    const eligible_count = await Citizen.countDocuments(matchQuery);

    const coverage_percent = total_population > 0
      ? parseFloat(((eligible_count / total_population) * 100).toFixed(2))
      : 0;

    // ── Breakdowns ─────────────────────────────────────────────────────────
    const [social_category, rural_urban, gender] = await Promise.all([
      countByField(matchQuery, 'social_category'),
      countByField(matchQuery, 'rural_urban'),
      countByField(matchQuery, 'gender'),
    ]);

    // ── Top 5 states by coverage % ─────────────────────────────────────────
    // Get eligible count per state
    const eligibleByState = await Citizen.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$state', eligible: { $sum: 1 } } },
    ]);

    // Get total count per state
    const totalByState = await Citizen.aggregate([
      { $group: { _id: '$state', total: { $sum: 1 } } },
    ]);

    const totalMap = totalByState.reduce((acc, { _id, total }) => {
      acc[_id] = total;
      return acc;
    }, {});

    const stateStats = eligibleByState.map(({ _id: state, eligible }) => ({
      state,
      count:       eligible,
      state_total: totalMap[state] || 0,
      coverage:    totalMap[state] ? (eligible / totalMap[state]) * 100 : 0,
    }));

    // Sort by coverage %, take top 5
    const all_states = stateStats
      .sort((a, b) => b.coverage - a.coverage)
      
      .map(({ state, count, state_total }) => ({ state, count, state_total }));

    return res.status(200).json({
      policy_text,
      total_population,
      eligible_count,
      excluded_count:   total_population - eligible_count,
      coverage_percent,
      breakdowns: {
        social_category,
        rural_urban,
        gender,
        all_states,
      },
    });

  } catch (error) {
    console.error('[simulate]', error.message);
    return res.status(500).json({ message: 'Simulation failed.', error: error.message });
  }
};

module.exports = { simulate };