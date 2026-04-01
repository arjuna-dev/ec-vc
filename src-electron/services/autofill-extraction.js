import path from 'node:path'
import fs from 'node:fs/promises'

import { Output, streamText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import {
  autofillExtractionOutputSchema,
  getPrimaryEntities,
  normalizeStructuredAutofillOutput,
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
    'Each extracted entity should include source_refs and field_sources when you can identify the source file and page.',
    'For field_sources, use exact field paths like Company_Name, Fund_Target_Size, or Round_Pre_Valuation.',
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

async function collectStructuredStream(result, { emitStatus } = {}) {
  let latestPartial = null
  let partialCount = 0

  for await (const partial of result.partialOutputStream) {
    latestPartial = partial
    partialCount += 1
    emitStatus?.({
      type: 'partial',
      partialCount,
      partial,
    })
  }

  return {
    output: await result.output,
    latestPartial,
    partialCount,
  }
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

function buildEntityMatchResult(entityType, candidate, similarity) {
  if (!candidate) return null
  return {
    entityType,
    matched_id: String(candidate?.id || '').trim() || null,
    similarity,
    candidate,
  }
}

function resolveCompanyMatch({ suggestedCompany, existingCompanies }) {
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
  // Intentionally disconnected from the old LLM verification step.
  // Fuzzy matching is enough for now; leave the previous idea out of the hot path.
  return buildEntityMatchResult('company', top, top.similarity)
}

function resolveContactMatch({ suggestedContact, existingContacts }) {
  const extractedLabel = [
    suggestedContact?.Name,
    suggestedContact?.Professional_Email,
    suggestedContact?.Personal_Email,
    suggestedContact?.Phone,
  ]
    .filter(Boolean)
    .join(' ')
    .trim()
  if (!extractedLabel) return null

  const candidates = (Array.isArray(existingContacts) ? existingContacts : [])
    .map((contact) => {
      const candidateLabel = [
        contact?.Name,
        contact?.Professional_Email,
        contact?.Personal_Email,
        contact?.Phone,
      ]
        .filter(Boolean)
        .join(' ')
        .trim()
      return {
        id: String(contact?.id || '').trim(),
        Name: String(contact?.Name || '').trim(),
        Personal_Email: String(contact?.Personal_Email || '').trim() || null,
        Professional_Email: String(contact?.Professional_Email || '').trim() || null,
        Phone: String(contact?.Phone || '').trim() || null,
        similarity: jaccardSimilarity(extractedLabel, candidateLabel),
      }
    })
    .filter((contact) => contact.id && contact.similarity >= 0.55)
    .sort((a, b) => b.similarity - a.similarity)

  return buildEntityMatchResult('contact', candidates[0] || null, candidates[0]?.similarity || 0)
}

function resolveRoundMatch({ suggestedRound, existingRounds }) {
  const extractedName = String(suggestedRound?.Round_Name || '').trim()
  if (!extractedName) return null
  const candidates = (Array.isArray(existingRounds) ? existingRounds : [])
    .map((round) => ({
      id: String(round?.id || '').trim(),
      Round_Name: String(round?.Round_Name || '').trim(),
      sponsor_company_id: round?.sponsor_company_id ?? null,
      similarity: jaccardSimilarity(extractedName, round?.Round_Name),
    }))
    .filter((round) => round.id && round.Round_Name && round.similarity >= 0.55)
    .sort((a, b) => b.similarity - a.similarity)

  return buildEntityMatchResult('round', candidates[0] || null, candidates[0]?.similarity || 0)
}

function resolveFundMatch({ suggestedFund, existingFunds }) {
  const extractedName = String(suggestedFund?.Fund_Name || '').trim()
  if (!extractedName) return null
  const candidates = (Array.isArray(existingFunds) ? existingFunds : [])
    .map((fund) => ({
      id: String(fund?.id || '').trim(),
      Fund_Name: String(fund?.Fund_Name || '').trim(),
      similarity: jaccardSimilarity(extractedName, fund?.Fund_Name),
    }))
    .filter((fund) => fund.id && fund.Fund_Name && fund.similarity >= 0.55)
    .sort((a, b) => b.similarity - a.similarity)

  return buildEntityMatchResult('fund', candidates[0] || null, candidates[0]?.similarity || 0)
}

export async function previewAutofillFromFiles({
  filePaths = [],
  apiKeys = {},
  existingCompanies = [],
  existingContacts = [],
  existingRounds = [],
  existingFunds = [],
  emitStatus,
} = {}) {
  const paths = Array.isArray(filePaths) ? filePaths.map((p) => String(p || '').trim()).filter(Boolean) : []
  if (!paths.length) throw new Error('No files provided for autofill')

  const gemini = getGeminiClient(apiKeys?.gemini)
  const content = await buildSourceFileParts(paths)
  const result = streamText({
    model: gemini('gemini-2.5-flash'),
    output: Output.object({ schema: autofillExtractionOutputSchema }),
    messages: [{ role: 'user', content }],
  })

  const { output, partialCount } = await collectStructuredStream(result, { emitStatus })
  const structured = normalizeStructuredAutofillOutput(output)
  const primaryEntities = getPrimaryEntities(structured)
  const duplicateMatches = {
    company: resolveCompanyMatch({
      suggestedCompany: primaryEntities.company,
      existingCompanies,
    }),
    contact: resolveContactMatch({
      suggestedContact: primaryEntities.contact,
      existingContacts,
    }),
    round: resolveRoundMatch({
      suggestedRound: primaryEntities.round,
      existingRounds,
    }),
    fund: resolveFundMatch({
      suggestedFund: primaryEntities.fund,
      existingFunds,
    }),
  }

  return {
    structured,
    rawModel: JSON.stringify(structured, null, 2),
    duplicateMatches,
    diagnostics: {
      files: paths.map((filePath) => path.basename(filePath)),
      sourceFileCount: paths.length,
      structuredPartialCount: partialCount,
    },
  }
}
