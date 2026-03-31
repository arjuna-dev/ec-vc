import path from 'node:path'
import fs from 'node:fs/promises'

import { streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

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
              Pax: { type: 'number' },
              Updates: { type: 'string' },
              Website: { type: 'string' },
            },
          },
          contact: {
            type: 'object',
            properties: {
              Name: { type: 'string' },
              Personal_Email: { type: 'string' },
              Professional_Email: { type: 'string' },
              Phone: { type: 'string' },
              LinkedIn: { type: 'string' },
              Country_based: { type: 'string' },
            },
          },
          notes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' },
              },
            },
          },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                Task_Name: { type: 'string' },
                Task_Description: { type: 'string' },
                Status: { type: 'string' },
                Priority: { type: 'string' },
                Due_Date: { type: 'string' },
              },
            },
          },
          assistant: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              description: { type: 'string' },
              system_prompt: { type: 'string' },
              tools: { type: 'array', items: { type: 'string' } },
              functions: { type: 'array', items: { type: 'string' } },
              context_sources: { type: 'array', items: { type: 'string' } },
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

function buildPrompt() {
  return [
    'You are extracting structured venture opportunity data from documents.',
    'Return ONLY valid JSON.',
    'Fill fields only when confidence is high.',
    'If confidence is not high, still provide your best candidate value and set verificationFlag=true.',
    'Prefer returning Opportunity.Round_Stage for the funding series.',
    'Also propose 1-3 Notes, 1-5 Tasks, and one Assistant configuration.',
    'Read the attached source files directly. Do not wait for or rely on any intermediary markdown artifact.',
    'Use this JSON schema:',
    JSON.stringify(schemaDefinition(), null, 2),
  ].join('\n')
}

function extLower(fileName) {
  return path.extname(String(fileName || '')).toLowerCase()
}

function isImageExt(ext) {
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.tif', '.tiff'].includes(String(ext || ''))
}

async function extractWithOfficeParser(sourceFilePath) {
  const mod = await import('officeparser')
  const officeparser = mod?.default ?? mod

  if (typeof officeparser?.parseOfficeAsync === 'function') {
    return officeparser.parseOfficeAsync(sourceFilePath)
  }

  if (typeof officeparser?.parseOffice === 'function') {
    if (officeparser.parseOffice.length <= 1) {
      return officeparser.parseOffice(sourceFilePath)
    }

    return new Promise((resolve, reject) => {
      try {
        officeparser.parseOffice(sourceFilePath, (data, err) => {
          if (err) reject(err)
          else resolve(data)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  throw new Error('officeparser export missing parseOfficeAsync/parseOffice')
}

async function buildSourceFileParts(filePaths = []) {
  const content = [{ type: 'text', text: buildPrompt() }]

  for (const [index, filePath] of filePaths.entries()) {
    const resolvedPath = String(filePath || '').trim()
    if (!resolvedPath) continue

    const fileName = path.basename(resolvedPath)
    const ext = extLower(fileName)
    const bytes = await fs.readFile(resolvedPath)

    if (ext === '.pdf') {
      content.push({
        type: 'text',
        text: `\nSOURCE FILE ${index + 1}: ${fileName}\nExtract structured data directly from this PDF.`,
      })
      content.push({
        type: 'file',
        data: bytes,
        mediaType: 'application/pdf',
        filename: fileName,
      })
      continue
    }

    if (isImageExt(ext)) {
      content.push({
        type: 'text',
        text: `\nSOURCE FILE ${index + 1}: ${fileName}\nExtract structured data directly from this image.`,
      })
      content.push({ type: 'image', image: bytes })
      continue
    }

    let extractedText = ''
    if (ext === '.md' || ext === '.txt') {
      extractedText = String(bytes.toString('utf8') || '').trim()
    } else {
      try {
        extractedText = String(await extractWithOfficeParser(resolvedPath) || '').trim()
      } catch {
        extractedText = ''
      }
    }

    if (!extractedText) {
      throw new Error(`Could not extract text from source file: ${fileName}`)
    }

    content.push({
      type: 'text',
      text: `\nSOURCE FILE ${index + 1}: ${fileName}\n\n${extractedText}`,
    })
  }

  return content
}

async function collectStreamText(result) {
  let output = ''
  for await (const chunk of result.textStream) {
    output += chunk
  }
  return String(output || '')
}

function stripHumanVerifyDelimiters(value) {
  if (value === null || value === undefined) return value
  return String(value)
    .replaceAll('[[HUMAN_VERIFY]]', '')
    .replaceAll('[[/HUMAN_VERIFY]]', '')
    .replaceAll('[HUMAN_VERIFY]', '')
    .replaceAll('[/HUMAN_VERIFY]', '')
    .trim()
}

function normalizeSuggested(input) {
  const suggested = input?.suggested || {}
  const normalizeList = (list, mapper) =>
    (Array.isArray(list) ? list : []).map((row) => mapper(row || {})).filter(Boolean)
  return {
    opportunity: Object.fromEntries(
      Object.entries(suggested?.opportunity || {}).map(([k, v]) => [k, stripHumanVerifyDelimiters(v)]),
    ),
    company: Object.fromEntries(
      Object.entries(suggested?.company || {}).map(([k, v]) => [k, stripHumanVerifyDelimiters(v)]),
    ),
    contact: Object.fromEntries(
      Object.entries(suggested?.contact || {}).map(([k, v]) => [k, stripHumanVerifyDelimiters(v)]),
    ),
    notes: normalizeList(suggested?.notes, (row) => {
      const title = stripHumanVerifyDelimiters(row?.title)
      const content = stripHumanVerifyDelimiters(row?.content)
      if (!String(content || '').trim()) return null
      return { title: String(title || '').trim() || null, content: String(content).trim() }
    }),
    tasks: normalizeList(suggested?.tasks, (row) => {
      const name = stripHumanVerifyDelimiters(row?.Task_Name)
      if (!String(name || '').trim()) return null
      return {
        Task_Name: String(name).trim(),
        Task_Description: stripHumanVerifyDelimiters(row?.Task_Description) || null,
        Status: stripHumanVerifyDelimiters(row?.Status) || null,
        Priority: stripHumanVerifyDelimiters(row?.Priority) || null,
        Due_Date: stripHumanVerifyDelimiters(row?.Due_Date) || null,
      }
    }),
    assistant: {
      name: stripHumanVerifyDelimiters(suggested?.assistant?.name) || null,
      version: stripHumanVerifyDelimiters(suggested?.assistant?.version) || 'v1',
      description: stripHumanVerifyDelimiters(suggested?.assistant?.description) || null,
      system_prompt: stripHumanVerifyDelimiters(suggested?.assistant?.system_prompt) || null,
      tools: Array.isArray(suggested?.assistant?.tools)
        ? suggested.assistant.tools.map((v) => stripHumanVerifyDelimiters(v)).filter(Boolean)
        : [],
      functions: Array.isArray(suggested?.assistant?.functions)
        ? suggested.assistant.functions.map((v) => stripHumanVerifyDelimiters(v)).filter(Boolean)
        : [],
      context_sources: Array.isArray(suggested?.assistant?.context_sources)
        ? suggested.assistant.context_sources.map((v) => stripHumanVerifyDelimiters(v)).filter(Boolean)
        : [],
    },
  }
}

function buildVerificationMap(suggested, modelVerification = {}) {
  const verification = {}
  for (const sectionName of ['opportunity', 'company', 'contact']) {
    const sectionValue = suggested?.[sectionName] || {}
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

function bigrams(value) {
  const s = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const out = new Set()
  for (let i = 0; i < s.length - 1; i += 1) out.add(s.slice(i, i + 2))
  return out
}

function jaccardSimilarity(a, b) {
  const A = bigrams(a)
  const B = bigrams(b)
  if (!A.size || !B.size) return 0
  let intersection = 0
  for (const x of A) if (B.has(x)) intersection += 1
  const union = A.size + B.size - intersection
  return union > 0 ? intersection / union : 0
}

async function confirmCompanyMatchWithLlm(gemini, extractedName, candidateName) {
  const prompt = [
    'Answer with ONLY JSON: {"match":true|false,"confidence":0..1,"reason":"..."}',
    'Do these company names likely refer to the same company?',
    `Extracted: ${extractedName}`,
    `Candidate: ${candidateName}`,
    'Consider spelling variants and abbreviations.',
  ].join('\n')
  const result = streamText({ model: gemini('gemini-2.5-flash'), prompt })
  const parsed = parseJsonFromModel(await collectStreamText(result))
  return {
    match: Boolean(parsed?.match),
    confidence: Number.isFinite(Number(parsed?.confidence)) ? Number(parsed.confidence) : 0,
    reason: String(parsed?.reason || '').trim() || null,
  }
}

async function resolveCompanyMatch({ gemini, suggestedCompany, existingCompanies }) {
  const extractedName = String(suggestedCompany?.Company_Name || '').trim()
  if (!extractedName) return null
  const candidates = (Array.isArray(existingCompanies) ? existingCompanies : [])
    .map((c) => ({
      id: String(c?.id || '').trim(),
      Company_Name: String(c?.Company_Name || '').trim(),
      Company_Type: String(c?.Company_Type || '').trim() || null,
      One_Liner: String(c?.One_Liner || '').trim() || null,
      Website: String(c?.Website || '').trim() || null,
      similarity: jaccardSimilarity(extractedName, c?.Company_Name),
    }))
    .filter((c) => c.id && c.Company_Name)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5)

  if (!candidates.length || candidates[0].similarity < 0.45) return null

  const top = candidates[0]
  const llm = await confirmCompanyMatchWithLlm(gemini, extractedName, top.Company_Name)
  if (!llm.match || llm.confidence < 0.65) return null
  return {
    company_id: top.id,
    confidence: llm.confidence,
    reason: llm.reason || 'Fuzzy and LLM match confirmed.',
    company: {
      id: top.id,
      Company_Name: top.Company_Name,
      Company_Type: top.Company_Type,
      One_Liner: top.One_Liner,
      Website: top.Website,
    },
  }
}

export async function previewAutofillFromFiles({ filePaths = [], apiKeys = {}, existingCompanies = [] } = {}) {
  const paths = Array.isArray(filePaths) ? filePaths.map((p) => String(p || '').trim()).filter(Boolean) : []
  if (!paths.length) throw new Error('No files provided for autofill')

  const gemini = getGeminiClient(apiKeys?.gemini)
  const content = await buildSourceFileParts(paths)
  const result = streamText({
    model: gemini('gemini-2.5-flash'),
    messages: [{ role: 'user', content }],
  })

  const rawModel = await collectStreamText(result)
  const parsed = parseJsonFromModel(rawModel)
  const suggested = normalizeSuggested(parsed)
  const verification = buildVerificationMap(suggested, parsed?.verification)
  const companyMatch = await resolveCompanyMatch({
    gemini,
    suggestedCompany: suggested?.company,
    existingCompanies,
  })

  return {
    suggested,
    verification,
    companyMatch,
    rawModel,
    diagnostics: {
      files: paths.map((filePath) => path.basename(filePath)),
      sourceFileCount: paths.length,
    },
  }
}
