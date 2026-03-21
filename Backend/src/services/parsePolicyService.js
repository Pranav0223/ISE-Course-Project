/**
 * parsePolicyService.js
 * ─────────────────────
 * Uses Groq API (free tier) instead of Anthropic.
 * Model: llama-3.3-70b-versatile — fast, free, accurate enough for rule extraction.
 *
 * Handles BOTH input modes:
 *   1. Plain text  → buildRulesFromText(text)
 *   2. File upload → buildRulesFromFile(filePath, mimeType, extraNotes)
 *
 * Both return: { understood_as: string, rules: Rule[] }
 */

const Groq = require('groq-sdk');
const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');
const fs       = require('fs');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Schema description fed to the LLM ─────────────────────────────────────────
const SCHEMA_DESCRIPTION = `
The citizen dataset has these 11 columns — use ONLY these as "field" values:

| field             | type    | allowed values / range                                                |
|-------------------|---------|-----------------------------------------------------------------------|
| age               | integer | 18 – 80                                                               |
| gender            | string  | "Male" | "Female" | "Other"                                           |
| income_annual     | integer | 0 – 500000 (INR per year)                                             |
| state             | string  | Full state name e.g. "Uttar Pradesh", "Bihar", "Maharashtra"          |
| rural_urban       | string  | "Rural" | "Urban"                                                   |
| social_category   | string  | "General" | "OBC" | "SC" | "ST" | "Other"                          |
| occupation        | string  | "Farmer" | "Agricultural Labourer" | "Salaried" | "Self-employed"   |
|                   |         | "Daily Wage Labour" | "Unemployed"                                 |
| marital_status    | string  | "Married" | "Single" | "Widowed" | "Divorced"                      |
| disability        | boolean | true | false                                                        |
| education_level   | string  | "No Schooling" | "Primary" | "Middle School" | "Secondary"        |
|                   |         | "Higher Secondary" | "Graduate" | "Post-Graduate"                 |
| bpl_status        | string  | "APL" | "BPL" | "AAY"                                             |
`.trim();

// ── System prompt ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `
You are a policy eligibility rules extractor for an Indian government policy simulation system.

Your job is to read a policy description (or a document) and extract structured eligibility rules
that can be directly used to filter a citizen dataset.

${SCHEMA_DESCRIPTION}

OUTPUT FORMAT — respond with ONLY a valid JSON object, no markdown, no explanation, nothing else:

{
  "understood_as": "A single plain-English sentence summarising the policy target group",
  "rules": [
    {
      "field":    "field_name_from_schema",
      "operator": "operator_from_list",
      "value":    "<string | number | boolean | array>",
      "label":    "Human readable description of this rule e.g. Age > 60"
    }
  ]
}

OPERATOR REFERENCE:
- equals                → field == value        (value: string | boolean)
- not_equals            → field != value        (value: string)
- greater_than          → field > value         (value: number)
- less_than             → field < value         (value: number)
- greater_than_or_equal → field >= value        (value: number)
- less_than_or_equal    → field <= value        (value: number)
- in_list               → field IN [...]        (value: array of strings)
- not_in_list           → field NOT IN [...]    (value: array of strings)
- is_true               → field === true        (value: true)
- is_false              → field === false       (value: false)

STRICT RULES:
1. Extract ONLY rules that map to the schema columns above.
2. Ignore document submission, application process, renewal, or administrative steps.
3. For income thresholds use income_annual in INR. Convert lakhs: 1 lakh = 100000.
4. If a state is mentioned use the full official name e.g. "Uttar Pradesh" not "UP".
5. If gender is not specified do not add a gender rule.
6. For age ranges use two rules: greater_than_or_equal + less_than_or_equal.
7. Always include a human-readable "label" for every rule.
8. If the policy is too vague return empty rules array and set understood_as to "Policy text was too vague to extract specific eligibility rules."
9. Respond with ONLY the raw JSON object. No markdown fences. No explanation. No extra text.
`.trim();

// ── Text extractor from file buffer ───────────────────────────────────────────
async function extractTextFromBuffer(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const result = await pdfParse(buffer);
    return result.text.trim();
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

// ── Groq API caller ────────────────────────────────────────────────────────────
async function callGroqForRules(policyText, notes = '') {
  const userContent = notes
    ? `POLICY TEXT:\n${policyText}\n\nADDITIONAL CONTEXT FROM USER:\n${notes}`
    : `POLICY TEXT:\n${policyText}`;

  const response = await groq.chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    max_tokens:  1500,
    temperature: 0.1,   // low temperature = more consistent structured output
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userContent   },
    ],
  });

  const rawText = response.choices[0]?.message?.content || '';

  // Strip accidental markdown fences
  const cleaned = rawText.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('LLM returned malformed JSON. Please try again.');
  }

  // Shape validation
  if (!parsed.understood_as || !Array.isArray(parsed.rules)) {
    throw new Error('Unexpected response structure from LLM.');
  }

  return parsed;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Parse rules from plain policy text.
 * Called by POST /api/parse-policy
 */
async function buildRulesFromText(policyText) {
  if (!policyText || policyText.trim().length < 10) {
    throw new Error('Policy text is too short to extract rules.');
  }
  return callGroqForRules(policyText.trim());
}

/**
 * Parse rules from an uploaded policy document (PDF / DOCX).
 * Called by POST /api/parse-policy/document
 */
async function buildRulesFromFile(filePath, mimeType, notes = '') {
  const buffer = fs.readFileSync(filePath);

  let extractedText;
  try {
    extractedText = await extractTextFromBuffer(buffer, mimeType);
  } catch (err) {
    throw new Error(`Could not extract text from document: ${err.message}`);
  }

  if (!extractedText || extractedText.length < 20) {
    throw new Error('The uploaded document appears to be empty or unreadable.');
  }

  // Truncate to 8000 chars — enough for any policy document eligibility section
  const truncated = extractedText.length > 8000
    ? extractedText.slice(0, 8000) + '\n[... document truncated for processing ...]'
    : extractedText;

  return callGroqForRules(truncated, notes);
}

module.exports = { buildRulesFromText, buildRulesFromFile };