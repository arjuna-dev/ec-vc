import fs from 'node:fs/promises'
import fssync from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

import fse from 'fs-extra'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

import { dbAll, dbRun, initDb } from './sqlite-db.js'

// NOTE: Temporary development setting.
// Prefer setting ECVC_OPENAI_API_KEY (or OPENAI_API_KEY) instead.
const HARDCODED_OPENAI_API_KEY = ''

const HARDCODED_GEMINI_API_KEY = 'AIzaSyDbT41Jp6RKA9QKcZrb6lQWbSiADyRSmT4'

function safeBasename(filePath) {
  return path.basename(String(filePath || ''))
}

function toPosixPath(p) {
  return String(p || '').replaceAll('\\', '/')
}

function extLower(fileName) {
  return path.extname(String(fileName || '')).toLowerCase()
}

function baseName(fileName) {
  const parsed = path.parse(String(fileName || ''))
  return parsed.name || 'artifact'
}

function isImageExt(ext) {
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.tif', '.tiff'].includes(String(ext || ''))
}

async function sha256FileHex(filePath) {
  const hash = crypto.createHash('sha256')
  await new Promise((resolve, reject) => {
    const s = fssync.createReadStream(filePath)
    s.on('error', reject)
    s.on('data', (chunk) => hash.update(chunk))
    s.on('end', resolve)
  })
  return hash.digest('hex')
}

async function ensureUniqueDestPath(destPath) {
  if (!(await fse.pathExists(destPath))) return destPath

  const parsed = path.parse(destPath)
  for (let i = 1; i < 1000; i += 1) {
    const candidate = path.join(parsed.dir, `${parsed.name} (${i})${parsed.ext}`)
    if (!(await fse.pathExists(candidate))) return candidate
  }

  throw new Error(`Could not find an available filename for: ${destPath}`)
}

async function extractWithOfficeParser(sourceFilePath) {
  const mod = await import('officeparser')
  const officeparser = mod?.default ?? mod

  if (typeof officeparser?.parseOfficeAsync === 'function') {
    return officeparser.parseOfficeAsync(sourceFilePath)
  }

  if (typeof officeparser?.parseOffice === 'function') {
    // Newer versions return a Promise; older versions use a callback.
    if (officeparser.parseOffice.length <= 1) {
      return officeparser.parseOffice(sourceFilePath)
    }

    return new Promise((resolve, reject) => {
      try {
        officeparser.parseOffice(sourceFilePath, (data, err) => {
          if (err) reject(err)
          else resolve(data)
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  throw new Error('officeparser export missing parseOfficeAsync/parseOffice')
}

function normalizeMarkdownFromText(fileName, extractedText) {
  const title = baseName(fileName)
  const content = String(extractedText || '')
    .replaceAll('\r\n', '\n')
    .trim()
  if (!content) return `# ${title}\n\n`
  return `# ${title}\n\n${content}\n`
}

function getOpenAIClient() {
  const apiKey =
    HARDCODED_OPENAI_API_KEY || process.env.ECVC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''
  if (!apiKey) {
    throw new Error(
      'Missing OpenAI API key. Set ECVC_OPENAI_API_KEY (or OPENAI_API_KEY), or hardcode HARDCODED_OPENAI_API_KEY in artifact-ingestion.js.',
    )
  }

  return createOpenAI({ apiKey })
}

function getGoogleGenerativeAIClient() {
  const apiKey = HARDCODED_GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
  if (!apiKey) {
    throw new Error('Missing Google API key. Set GOOGLE_API_KEY environment variable.')
  }

  return createGoogleGenerativeAI({ apiKey })
}

async function ocrToMarkdown({ filePath: sourceFilePath, fileName }) {
  // const openai = getOpenAIClient()
  const gemini = getGoogleGenerativeAIClient()
  const ext = extLower(fileName)

  const bytes = await fs.readFile(sourceFilePath)

  const contentParts = [
    {
      type: 'text',
      text: [
        'Extract ALL readable content from the attached document.',
        'Return a clean, LLM-friendly Markdown document.',
        'Preserve headings, lists, and tables when possible.',
        'Return ONLY Markdown (no JSON, no code fences).',
      ].join('\n'),
    },
  ]

  if (isImageExt(ext)) {
    contentParts.push({ type: 'image', image: bytes })
  } else if (ext === '.pdf') {
    contentParts.push({
      type: 'file',
      data: bytes,
      mediaType: 'application/pdf',
      filename: fileName,
    })
  } else {
    throw new Error(`OCR path only supports images and PDFs (got: ${ext || 'unknown'})`)
  }

  const result = await generateText({
    model: gemini('gemini-2.5-flash'),
    messages: [{ role: 'user', content: contentParts }],
  })

  return String(result?.text || '').trim()
}

function stripJsonFences(text) {
  const t = String(text || '').trim()
  const fenced = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return (fenced?.[1] ?? t).trim()
}

async function tryPopulateArtifactMetadata({ markdown, artifactId }) {
  try {
    const openai = getOpenAIClient()
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: [
                'You will receive a Markdown document.',
                'Return ONLY valid JSON with keys: title (string), summary (string), confidence_score (number between 0 and 1).',
                'Be concise but informative.',
                '',
                '--- MARKDOWN START ---',
                markdown,
                '--- MARKDOWN END ---',
              ].join('\n'),
            },
          ],
        },
      ],
    })

    const raw = stripJsonFences(result?.text)
    const parsed = JSON.parse(raw)

    const title = typeof parsed?.title === 'string' ? parsed.title.trim() : null
    const summary = typeof parsed?.summary === 'string' ? parsed.summary.trim() : null
    const confidence =
      typeof parsed?.confidence_score === 'number' && Number.isFinite(parsed.confidence_score)
        ? parsed.confidence_score
        : null

    dbRun(
      `
      UPDATE Artifacts
      SET
        title = COALESCE(?, title),
        summary = COALESCE(?, summary),
        confidence_score = COALESCE(?, confidence_score),
        llm_provider = COALESCE(llm_provider, 'openai'),
        llm_model = COALESCE(llm_model, 'gpt-4o-mini'),
        updated_at = datetime('now')
      WHERE artifact_id = ?
    `,
      [title, summary, confidence, artifactId],
    )
  } catch {
    // Best-effort enrichment; ingestion shouldn't fail if this step fails.
  }
}

function firstStageIdForPipeline(pipelineId) {
  const rows = dbAll(
    `
    SELECT stage_id
    FROM Pipeline_Stages
    WHERE pipeline_id = ?
    ORDER BY position ASC
    LIMIT 1
  `,
    [String(pipelineId || '')],
  )
  return rows?.[0]?.stage_id || null
}

export async function ingestArtifactsFromPaths({
  workspaceRoot,
  filePaths,
  opportunityId,
  pipelineId,
  emitStatus,
} = {}) {
  initDb()

  const files = Array.isArray(filePaths) ? filePaths : []
  const oppty = String(opportunityId || '')
  const pipeline = String(pipelineId || '')
  if (!oppty) throw new Error('opportunityId is required')
  if (!pipeline) throw new Error('pipelineId is required')
  if (!workspaceRoot) throw new Error('workspaceRoot is required')
  if (files.length === 0) {
    emitStatus?.({
      type: 'error',
      message: 'Could not save the raw file. Please try again.',
    })
    throw new Error('No files provided to ingestion (filePaths was empty).')
  }

  const stageId = firstStageIdForPipeline(pipeline)

  const rawDir = path.join(workspaceRoot, '0_company_docs', 'Artifacts', '0_raw')
  const llmDir = path.join(workspaceRoot, '0_company_docs', 'Artifacts', '1_llm-ready')
  await fse.ensureDir(rawDir)
  await fse.ensureDir(llmDir)

  const results = []

  for (const srcPath of files) {
    const sourceFilePath = String(srcPath || '')
    if (!sourceFilePath) {
      emitStatus?.({
        type: 'error',
        message: 'Could not save the raw file. Please try again.',
      })
      throw new Error('Dropped file path was empty (could not resolve local file path).')
    }
    if (!(await fse.pathExists(sourceFilePath))) {
      emitStatus?.({
        type: 'error',
        message: 'Could not save the raw file. Please try again.',
      })
      throw new Error(`Dropped file path does not exist: ${sourceFilePath}`)
    }

    const originalFileName = safeBasename(sourceFilePath)
    const originalExt = extLower(originalFileName)

    emitStatus?.({ type: 'info', message: 'File received. Creating artifact records.' })

    // --- Save raw file
    let rawAbsPath
    try {
      rawAbsPath = await ensureUniqueDestPath(path.join(rawDir, originalFileName))
      await fs.copyFile(sourceFilePath, rawAbsPath)
    } catch (e) {
      emitStatus?.({
        type: 'error',
        message: 'Could not save the raw file. Please try again.',
      })
      throw e
    }

    const rawRelPath = toPosixPath(
      path.join('0_company_docs', 'Artifacts', '0_raw', path.basename(rawAbsPath)),
    )
    const rawArtifactId = `artifact:${crypto.randomUUID()}`

    try {
      const stat = await fs.stat(rawAbsPath)
      const hash = await sha256FileHex(rawAbsPath)
      dbRun(
        `
        INSERT INTO Artifacts (
          artifact_id,
          opportunity_id,
          pipeline_id,
          stage_id,
          artifact_type,
          fs_path,
          fs_hash,
          fs_size_bytes,
          generated_by,
          title,
          status,
          artifact_format
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          rawArtifactId,
          oppty,
          pipeline,
          stageId,
          'raw',
          rawRelPath,
          hash,
          stat.size,
          'user',
          baseName(originalFileName),
          'created',
          originalExt.replace('.', '') || null,
        ],
      )
    } catch (e) {
      emitStatus?.({
        type: 'error',
        message: 'Could not create the artifact record. Please try again.',
      })
      throw e
    }

    // --- Markdown special case (copy to llm-ready)
    if (originalExt === '.md') {
      let llmAbsPath
      try {
        llmAbsPath = await ensureUniqueDestPath(path.join(llmDir, originalFileName))
        await fs.copyFile(rawAbsPath, llmAbsPath)
      } catch (e) {
        emitStatus?.({
          type: 'error',
          message: 'Could not create the LLM ready Markdown file. Please try again.',
        })
        throw e
      }

      const llmRelPath = toPosixPath(
        path.join('0_company_docs', 'Artifacts', '1_llm-ready', path.basename(llmAbsPath)),
      )
      const llmArtifactId = `artifact:${crypto.randomUUID()}`

      try {
        const stat = await fs.stat(llmAbsPath)
        const hash = await sha256FileHex(llmAbsPath)
        dbRun(
          `
          INSERT INTO Artifacts (
            artifact_id,
            opportunity_id,
            pipeline_id,
            stage_id,
            artifact_type,
            fs_path,
            fs_hash,
            fs_size_bytes,
            generated_by,
            original_artifact_id,
            title,
            status,
            artifact_format
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          [
            llmArtifactId,
            oppty,
            pipeline,
            stageId,
            'llm-ready',
            llmRelPath,
            hash,
            stat.size,
            'system',
            rawArtifactId,
            baseName(originalFileName),
            'created',
            'md',
          ],
        )
      } catch (e) {
        emitStatus?.({
          type: 'error',
          message: 'Could not create the artifact record. Please try again.',
        })
        throw e
      }

      results.push({
        source: sourceFilePath,
        raw: { artifact_id: rawArtifactId, fs_path: rawRelPath },
        llm_ready: { artifact_id: llmArtifactId, fs_path: llmRelPath },
      })
      continue
    }

    // --- Create LLM-ready Markdown
    const llmMdFileName = `${baseName(originalFileName)}.md`
    let markdown = ''

    try {
      if (originalExt === '.pdf') {
        emitStatus?.({
          type: 'info',
          message: 'PDF detected. Using LLM to create LLM ready Markdown.',
        })
        markdown = await ocrToMarkdown({ filePath: rawAbsPath, fileName: originalFileName })
      } else if (isImageExt(originalExt)) {
        emitStatus?.({
          type: 'info',
          message: 'Image detected. Using LLM to create LLM ready Markdown.',
        })
        markdown = await ocrToMarkdown({ filePath: rawAbsPath, fileName: originalFileName })
      } else {
        emitStatus?.({ type: 'info', message: 'Creating LLM ready Markdown from the file.' })

        try {
          if (originalExt === '.txt') {
            const txt = await fs.readFile(rawAbsPath, 'utf8')
            markdown = normalizeMarkdownFromText(originalFileName, txt)
          } else {
            const extracted = await extractWithOfficeParser(rawAbsPath)
            const maybeText = String(extracted || '').trim()
            if (!maybeText) throw new Error('officeparser returned empty content')
            markdown = normalizeMarkdownFromText(originalFileName, maybeText)
          }
        } catch {
          emitStatus?.({
            type: 'info',
            message: 'OCR required. Using LLM to create LLM ready Markdown.',
          })
          markdown = await ocrToMarkdown({ filePath: rawAbsPath, fileName: originalFileName })
        }
      }
    } catch (e) {
      emitStatus?.({
        type: 'error',
        message: 'Could not create the LLM ready Markdown file. Please try again.',
      })
      throw e
    }

    let llmAbsPath
    try {
      llmAbsPath = await ensureUniqueDestPath(path.join(llmDir, llmMdFileName))
      await fs.writeFile(llmAbsPath, markdown, 'utf8')
    } catch (e) {
      emitStatus?.({
        type: 'error',
        message: 'Could not create the LLM ready Markdown file. Please try again.',
      })
      throw e
    }

    const llmRelPath = toPosixPath(
      path.join('0_company_docs', 'Artifacts', '1_llm-ready', path.basename(llmAbsPath)),
    )
    const llmArtifactId = `artifact:${crypto.randomUUID()}`

    try {
      const stat = await fs.stat(llmAbsPath)
      const hash = await sha256FileHex(llmAbsPath)
      dbRun(
        `
        INSERT INTO Artifacts (
          artifact_id,
          opportunity_id,
          pipeline_id,
          stage_id,
          artifact_type,
          fs_path,
          fs_hash,
          fs_size_bytes,
          generated_by,
          original_artifact_id,
          title,
          status,
          artifact_format
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          llmArtifactId,
          oppty,
          pipeline,
          stageId,
          'llm-ready',
          llmRelPath,
          hash,
          stat.size,
          'llm',
          rawArtifactId,
          baseName(originalFileName),
          'created',
          'md',
        ],
      )
    } catch (e) {
      emitStatus?.({
        type: 'error',
        message: 'Could not create the artifact record. Please try again.',
      })
      throw e
    }

    await tryPopulateArtifactMetadata({ markdown, artifactId: llmArtifactId })

    results.push({
      source: sourceFilePath,
      raw: { artifact_id: rawArtifactId, fs_path: rawRelPath },
      llm_ready: { artifact_id: llmArtifactId, fs_path: llmRelPath },
    })
  }

  emitStatus?.({
    type: 'success',
    message: `Successfully created and saved ${files.length} artifact${files.length === 1 ? '' : 's'} with database records.`,
  })

  return { results }
}
