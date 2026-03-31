import path from 'node:path'
import fs from 'node:fs/promises'

import { Output, streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import {
  autofillExtractionOutputSchema,
  companyMatchOutputSchema,
  normalizeStructuredAutofillOutput,
  projectStructuredAutofillToLegacy,
  verificationEntriesToMap,
} from './autofill-output-schema.js'

function normalizeApiKey(value) {
  return String(value || '').trim()
}

function getGeminiClient(apiKeyFromSettings) {
  const apiKey =
    normalizeApiKey(apiKeyFromSettings) || normalizeApiKey(process.env.ECVC_GEMINI_API_KEY)
  if (!apiKey) throw new Error('Missing Gemini API key. Set it in Settings.')
  return createGoogleGenerativeAI({ apiKey })
}

function buildPrompt() {
  return [
    'You are extracting structured venture, company, fund, round, and contact data from documents.',
    'Return data using the provided structured output schema.',
    'Use exact SQLite column names wherever possible.',
    'Support multiple companies, contacts, rounds, and funds when the document mentions them.',
    'Set primary_company_ref, primary_contact_ref, primary_round_ref, and primary_fund_ref when possible.',
    'Use company base fields plus direct-data company subtables only: incorporation info, operations overview, and fund raising.',
    'Skip artifact/file-pointer-only sections for companies, funds, and rounds.',
    'For rounds, focus on direct data from Round_Overview and Round_Economics.',
    'For funds, focus on direct data from Fund_Overview and Fund_Strategy.',
    'Keep empty or unknown values as null instead of guessing.',
    'Include 1-3 notes, 1-5 tasks, and one assistant proposal when the document supports them.',
    'If a primary field is uncertain but still useful for the UI, include a verification entry with field_path, confidence, verification_flag, and evidence.',
    'Use verification field_path values that match the legacy UI keys such as company.Company_Name, contact.Name, or opportunity.Venture_Oppty_Name.',
    'Read the attached source files directly. Do not wait for or rely on any intermediary markdown artifact.',
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

async function collectStructuredStream(result) {
  let latestPartial = null
  let partialCount = 0

  for await (const partial of result.partialOutputStream) {
    latestPartial = partial
    partialCount += 1
  }

  return {
    output: await result.output,
    latestPartial,
    partialCount,
  }
}

function buildVerificationMap(suggested, modelVerification = {}) {
  const verification = {}
  for (const sectionName of ['opportunity', 'company', 'contact']) {
    const sectionValue = suggested?.[sectionName] || {}
    for (const [fieldName, value] of Object.entries(sectionValue || {})) {
      if (value === null || value === undefined || String(value).trim() === '') continue
      const key = `${sectionName}.${fieldName}`
      const modelMeta = modelVerification?.[key] || {}
      const confidenceRaw = Number(modelMeta?.confidence)
      const confidence = Number.isFinite(confidenceRaw) ? confidenceRaw : 0.9
      verification[key] = {
        confidence,
        verificationFlag: Boolean(modelMeta?.verificationFlag),
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
    'Do these company names likely refer to the same company?',
    `Extracted: ${extractedName}`,
    `Candidate: ${candidateName}`,
    'Consider spelling variants and abbreviations.',
  ].join('\n')
  const result = streamText({
    model: gemini('gemini-2.5-flash'),
    output: Output.object({ schema: companyMatchOutputSchema }),
    prompt,
  })
  const { output } = await collectStructuredStream(result)
  return {
    match: Boolean(output?.match),
    confidence: Number.isFinite(Number(output?.confidence)) ? Number(output.confidence) : 0,
    reason: String(output?.reason || '').trim() || null,
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
    output: Output.object({ schema: autofillExtractionOutputSchema }),
    messages: [{ role: 'user', content }],
  })

  const { output, partialCount } = await collectStructuredStream(result)
  const structured = normalizeStructuredAutofillOutput(output)
  const suggested = projectStructuredAutofillToLegacy(structured)
  const verification = buildVerificationMap(
    suggested,
    verificationEntriesToMap(structured.verification),
  )
  const companyMatch = await resolveCompanyMatch({
    gemini,
    suggestedCompany: suggested?.company,
    existingCompanies,
  })

  return {
    suggested,
    structured,
    verification,
    companyMatch,
    rawModel: JSON.stringify(structured, null, 2),
    diagnostics: {
      files: paths.map((filePath) => path.basename(filePath)),
      sourceFileCount: paths.length,
      structuredPartialCount: partialCount,
    },
  }
}
