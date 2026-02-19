import path from 'node:path'

import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

import { buildLlmReadyMarkdownFromFile } from './artifact-ingestion.js'

function normalizeApiKey(value) {
  return String(value || '').trim()
}

function stripJsonFences(text) {
  const t = String(text || '').trim()
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return (fenced?.[1] ?? t).trim()
}

function parseJsonFromModel(text) {
  const raw = stripJsonFences(text)
  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}$/)
    if (!match) throw new Error('Model did not return valid JSON')
    return JSON.parse(match[0])
  }
}

function getGeminiClient(apiKeyFromSettings) {
  const apiKey =
    normalizeApiKey(apiKeyFromSettings) || normalizeApiKey(process.env.ECVC_GEMINI_API_KEY)
  if (!apiKey) throw new Error('Missing Gemini API key. Set it in Settings.')
  return createGoogleGenerativeAI({ apiKey })
}

function schemaDefinition() {
  return {
    type: 'object',
    required: ['suggested', 'verification'],
    properties: {
      suggested: {
        type: 'object',
        properties: {
          opportunity: {
            type: 'object',
            properties: {
              Venture_Oppty_Name: { type: 'string' },
              kind: { type: 'string', enum: ['round', 'fund'] },
              Round_Stage: { type: 'string' },
              Type_of_Security: { type: 'string' },
              Investment_Ask: { type: 'number' },
              Round_Amount: { type: 'number' },
              Hard_Commits: { type: 'number' },
              Soft_Commits: { type: 'number' },
              Pre_Valuation: { type: 'number' },
              Post_Valuation: { type: 'number' },
              Previous_Post: { type: 'number' },
              First_Close_Date: { type: 'string' },
              Next_Close_Date: { type: 'string' },
              Final_Close_Date: { type: 'string' },
              Pipeline_Stage: { type: 'string' },
              Pipeline_Status: { type: 'string' },
              Raising_Status: { type: 'string' },
              Board_Seats: { type: 'string' },
              Information_Rights: { type: 'string' },
              Voting_Rights: { type: 'string' },
              Liquidation_Preference: { type: 'string' },
              Anti_Dilution_Provisions: { type: 'string' },
              Conversion_Features: { type: 'string' },
              Most_Favored_Nation: { type: 'string' },
              ROFO_ROR: { type: 'string' },
              Co_Sale_Right: { type: 'string' },
              Tag_Drag_Along: { type: 'string' },
              Put_Option: { type: 'string' },
              Over_Allotment_Option: { type: 'string' },
              Stacked_Series: { type: 'string' },
            },
          },
          company: {
            type: 'object',
            properties: {
              Company_Name: { type: 'string' },
              Company_Type: { type: 'string' },
              One_Liner: { type: 'string' },
              Status: { type: 'string' },
              Date_of_Incorporation: { type: 'string' },
              Amount_Raised_AUMs: { type: 'number' },
              Pax: { type: 'number' },
              Updates: { type: 'string' },
              Website: { type: 'string' },
            },
          },
          contact: {
            type: 'object',
            properties: {
              Name: { type: 'string' },
              Email: { type: 'string' },
              Phone: { type: 'string' },
              LinkedIn: { type: 'string' },
              Role: { type: 'string' },
              Stakeholder_type: { type: 'string' },
              Closeness_Level: { type: 'string' },
              Comment: { type: 'string' },
              Expertise: { type: 'string' },
              Degrees_Program: { type: 'string' },
              University: { type: 'string' },
              Credentials: { type: 'string' },
              Tenure_at_Firm_yrs: { type: 'number' },
              Country_based: { type: 'string' },
            },
          },
        },
      },
      verification: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            confidence: { type: 'number' },
            verificationFlag: { type: 'boolean' },
            evidence: { type: 'string' },
          },
        },
      },
    },
  }
}

function buildPrompt({ markdownDocs = [] } = {}) {
  const docsBody = markdownDocs
    .map((doc, i) => {
      const name = path.basename(String(doc?.filePath || `document_${i + 1}`))
      return `## DOCUMENT ${i + 1}: ${name}\n\n${String(doc?.markdown || '').trim()}`
    })
    .join('\n\n')

  return [
    'You are extracting structured venture opportunity data from documents.',
    'Return ONLY valid JSON.',
    'Fill fields only when confidence is high.',
    'If confidence is not high, still provide your best candidate value wrapped in [[HUMAN_VERIFY]]...[[/HUMAN_VERIFY]] and set verificationFlag=true.',
    'Use this JSON schema:',
    JSON.stringify(schemaDefinition(), null, 2),
    '',
    'Documents:',
    docsBody,
  ].join('\n')
}

function normalizeSuggested(input) {
  const suggested = input?.suggested || {}
  return {
    opportunity: suggested?.opportunity || {},
    company: suggested?.company || {},
    contact: suggested?.contact || {},
  }
}

function buildVerificationMap(suggested, modelVerification = {}) {
  const verification = {}
  for (const [sectionName, sectionValue] of Object.entries(suggested || {})) {
    for (const [fieldName, value] of Object.entries(sectionValue || {})) {
      if (value === null || value === undefined || String(value).trim() === '') continue
      const key = `${sectionName}.${fieldName}`
      const rawText = String(value)
      const hasDelimiter = /\[\[HUMAN_VERIFY\]\]/.test(rawText)
      const modelMeta = modelVerification?.[key] || {}
      const confidenceRaw = Number(modelMeta?.confidence)
      const confidence = Number.isFinite(confidenceRaw) ? confidenceRaw : hasDelimiter ? 0.5 : 0.9
      verification[key] = {
        confidence,
        verificationFlag: hasDelimiter || Boolean(modelMeta?.verificationFlag),
        evidence: String(modelMeta?.evidence || '').trim() || null,
      }
    }
  }
  return verification
}

export async function previewAutofillFromFiles({ filePaths = [], apiKeys = {} } = {}) {
  const paths = Array.isArray(filePaths) ? filePaths.map((p) => String(p || '').trim()).filter(Boolean) : []
  if (!paths.length) throw new Error('No files provided for autofill')

  const markdownDocs = []
  for (const filePath of paths) {
    const markdown = await buildLlmReadyMarkdownFromFile(filePath, {
      geminiApiKey: normalizeApiKey(apiKeys?.gemini),
    })
    markdownDocs.push({ filePath, markdown })
  }

  const gemini = getGeminiClient(apiKeys?.gemini)
  const prompt = buildPrompt({ markdownDocs })
  const result = await generateText({
    model: gemini('gemini-2.5-flash'),
    prompt,
  })

  const parsed = parseJsonFromModel(result?.text)
  const suggested = normalizeSuggested(parsed)
  const verification = buildVerificationMap(suggested, parsed?.verification)

  return {
    suggested,
    verification,
    rawModel: String(result?.text || ''),
    diagnostics: {
      files: markdownDocs.map((d) => path.basename(d.filePath)),
      markdownCount: markdownDocs.length,
    },
  }
}
