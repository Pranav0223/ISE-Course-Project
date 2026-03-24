const Groq    = require('groq-sdk');
const mammoth = require('mammoth');
const fs      = require('fs');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SCHEMA_DESCRIPTION = `
The citizen dataset has these 11 columns — use ONLY these as "field" values:

| field             | type    | allowed values / range                                                          |
|-------------------|---------|---------------------------------------------------------------------------------|
| age               | integer | 18 to 80                                                                        |
| gender            | string  | "Male" or "Female" or "Other"                                                   |
| income_annual     | integer | 0 to 500000 (INR per year)                                                      |
| state             | string  | Full state name e.g. "Uttar Pradesh", "Bihar", "Maharashtra"                    |
| rural_urban       | string  | "Rural" or "Urban"                                                              |
| social_category   | string  | "General" or "OBC" or "SC" or "ST" or "Other"                                  |
| occupation        | string  | "Farmer" or "Agricultural Labourer" or "Salaried" or "Self-employed" or "Daily Wage Labour" or "Unemployed" |
| marital_status    | string  | "Married" or "Single" or "Widowed" or "Divorced"                                |
| disability        | boolean | true or false                                                                   |
| education_level   | string  | "No Schooling" or "Primary" or "Middle School" or "Secondary" or "Higher Secondary" or "Graduate" or "Post-Graduate" |
| bpl_status        | string  | "APL" or "BPL" or "AAY"                                                         |
`.trim();

const SYSTEM_PROMPT = `
You are a policy eligibility rules extractor for an Indian government policy simulation system.
Your job is to read a policy description and extract structured eligibility rules.

${SCHEMA_DESCRIPTION}

OUTPUT FORMAT: respond with ONLY a valid JSON object, no markdown, no explanation, nothing else:

{
  "understood_as": "A single plain-English sentence summarising the policy target group",
  "rules": [
    {
      "field":    "field_name_from_schema",
      "operator": "operator_from_list",
      "value":    "string or number or boolean or array",
      "label":    "Human readable description e.g. Age greater than 60"
    }
  ]
}

OPERATORS:
- equals
- not_equals
- greater_than
- less_than
- greater_than_or_equal
- less_than_or_equal
- in_list
- not_in_list
- is_true
- is_false

STRICT RULES:
1. Only use fields from the schema above.
2. Ignore application process, document submission, or administrative steps.
3. Convert lakhs to INR: 1 lakh = 100000.
4. Use full state names e.g. "Uttar Pradesh" not "UP".
5. For age ranges use two rules: greater_than_or_equal and less_than_or_equal.
6. Always include a label for every rule.
7. Do NOT add rules that are not explicitly stated. Do not infer rules.
8. If a category is given priority but not explicitly required, do not add it as a rule.
9. Respond with ONLY raw JSON. No markdown fences. No extra text whatsoever.
`.trim();

async function extractTextFromBuffer(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const PDFParser = require('pdf2json');
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);
      pdfParser.on('pdfParser_dataError', (errData) => {
        reject(new Error(errData.parserError));
      });
      pdfParser.on('pdfParser_dataReady', () => {
        const text = pdfParser.getRawTextContent();
        resolve(text.trim());
      });
      pdfParser.parseBuffer(buffer);
    });
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

async function callGroqForRules(policyText, notes) {
  const extra = notes || '';
  const userContent = extra
    ? `POLICY TEXT:\n${policyText}\n\nADDITIONAL CONTEXT:\n${extra}`
    : `POLICY TEXT:\n${policyText}`;

  const response = await groq.chat.completions.create({
    model:       'llama-3.3-70b-versatile',
    max_tokens:  1500,
    temperature: 0.1,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user',   content: userContent   },
    ],
  });

  const rawText = response.choices[0] && response.choices[0].message
    ? response.choices[0].message.content
    : '';

  const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('LLM returned malformed JSON. Please try again.');
  }

  if (!parsed.understood_as || !Array.isArray(parsed.rules)) {
    throw new Error('Unexpected response structure from LLM.');
  }

  return parsed;
}

async function buildRulesFromText(policyText) {
  if (!policyText || policyText.trim().length < 10) {
    throw new Error('Policy text is too short to extract rules.');
  }
  return callGroqForRules(policyText.trim(), '');
}

async function buildRulesFromFile(filePath, mimeType, notes) {
  const buffer = fs.readFileSync(filePath);

  let extractedText;
  try {
    extractedText = await extractTextFromBuffer(buffer, mimeType);
  } catch (err) {
    throw new Error('Could not extract text from document: ' + err.message);
  }

  if (!extractedText || extractedText.length < 20) {
    throw new Error('The uploaded document appears to be empty or unreadable.');
  }

  const truncated = extractedText.length > 8000
    ? extractedText.slice(0, 8000) + '\n[... document truncated ...]'
    : extractedText;

  return callGroqForRules(truncated, notes || '');
}

module.exports = { buildRulesFromText, buildRulesFromFile };