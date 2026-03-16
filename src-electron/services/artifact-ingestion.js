import fs from 'node:fs/promises'
import fssync from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

import fse from 'fs-extra'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

import { dbAll, dbRun, initDb } from './sqlite-db.js'

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

function normalizeApiKey(value) {
  return String(value || '').trim()
}

function getOpenAIClient({ apiKeyFromSettings } = {}) {
  const apiKey =
    normalizeApiKey(apiKeyFromSettings) ||
    normalizeApiKey(process.env.ECVC_OPENAI_API_KEY) ||
    normalizeApiKey(process.env.OPENAI_API_KEY)
  if (!apiKey) {
    throw new Error(
      'Missing OpenAI API key. Set it in Settings, or configure ECVC_OPENAI_API_KEY / OPENAI_API_KEY.',
    )
  }

  return createOpenAI({ apiKey })
}

function getGoogleGenerativeAIClient({ apiKeyFromSettings } = {}) {
  const apiKey = normalizeApiKey(apiKeyFromSettings) || normalizeApiKey(process.env.GOOGLE_API_KEY)
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set it in Settings, or configure GOOGLE_API_KEY.')
  }

  return createGoogleGenerativeAI({ apiKey })
}

async function ocrToMarkdown({ filePath: sourceFilePath, fileName, geminiApiKey }) {
  // const openai = getOpenAIClient()
  const gemini = getGoogleGenerativeAIClient({ apiKeyFromSettings: geminiApiKey })
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

async function tryPopulateArtifactMetadata({ markdown, artifactId, openaiApiKey }) {
  try {
    const openai = getOpenAIClient({ apiKeyFromSettings: openaiApiKey })
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
                'Return ONLY valid JSON with keys: title (string), summary (string)',
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
    dbRun(
      `
      UPDATE Artifacts
      SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        updated_at = datetime('now')
      WHERE artifact_id = ?
    `,
      [title, summary, artifactId],
    )
  } catch {
    // Best-effort enrichment; ingestion shouldn't fail if this step fails.
  }
}

function emitFileStageStatus(emitStatus, fileName, updates = {}) {
  const payload = {
    type: 'progress',
    fileName,
    message: updates.message || '',
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'uploadStatus')) {
    payload.uploadStatus = updates.uploadStatus
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'markdownStatus')) {
    payload.markdownStatus = updates.markdownStatus
  }
  if (Object.prototype.hasOwnProperty.call(updates, 'extractionStatus')) {
    payload.extractionStatus = updates.extractionStatus
  }
  emitStatus?.(payload)
}

export async function buildLlmReadyMarkdownFromFile(sourceFilePath, { geminiApiKey } = {}) {
  const resolvedPath = String(sourceFilePath || '')
  if (!resolvedPath) throw new Error('sourceFilePath is required')
  if (!(await fse.pathExists(resolvedPath))) {
    throw new Error(`Source file path does not exist: ${resolvedPath}`)
  }

  const fileName = safeBasename(resolvedPath)
  const ext = extLower(fileName)
  if (ext === '.md') {
    const md = await fs.readFile(resolvedPath, 'utf8')
    return String(md || '').trim()
  }
  if (ext === '.txt') {
    const txt = await fs.readFile(resolvedPath, 'utf8')
    return normalizeMarkdownFromText(fileName, txt)
  }
  if (ext === '.pdf' || isImageExt(ext)) {
    return ocrToMarkdown({ filePath: resolvedPath, fileName, geminiApiKey })
  }

  try {
    const extracted = await extractWithOfficeParser(resolvedPath)
    const maybeText = String(extracted || '').trim()
    if (!maybeText) throw new Error('officeparser returned empty content')
    return normalizeMarkdownFromText(fileName, maybeText)
  } catch {
    return ocrToMarkdown({ filePath: resolvedPath, fileName, geminiApiKey })
  }
}

export async function ingestArtifactsFromPaths({
  workspaceRoot,
  filePaths,
  opportunityId,
  emitStatus,
  apiKeys = {},
} = {}) {
  initDb()

  const files = Array.isArray(filePaths) ? filePaths : []
  const openaiApiKey = normalizeApiKey(apiKeys?.openai)
  const geminiApiKey = normalizeApiKey(apiKeys?.gemini)
  const oppty = String(opportunityId || '').trim() || null
  if (!workspaceRoot) throw new Error('workspaceRoot is required')
  if (files.length === 0) {
    emitStatus?.({
      type: 'error',
      message: 'Could not save the raw file. Please try again.',
    })
    throw new Error('No files provided to ingestion (filePaths was empty).')
  }

  const rawDir = path.join(workspaceRoot, '0_company_docs', 'Artifacts', '0_raw')
  const llmDir = path.join(workspaceRoot, '0_company_docs', 'Artifacts', '1_llm-ready')
  await fse.ensureDir(rawDir)
  await fse.ensureDir(llmDir)

  const seenInputNames = new Set()
  for (const srcPath of files) {
    const fileName = safeBasename(srcPath)
    const normalized = fileName.toLowerCase()
    if (seenInputNames.has(normalized)) {
      emitStatus?.({
        type: 'error',
        message: `Duplicate filename "${fileName}" in this upload. Rename the file and try again.`,
      })
      throw new Error(`Duplicate filename in upload: "${fileName}". Rename the file and try again.`)
    }
    seenInputNames.add(normalized)

    const rawCandidatePath = path.join(rawDir, fileName)
    if (await fse.pathExists(rawCandidatePath)) {
      const rawRelPath = toPosixPath(path.join('0_company_docs', 'Artifacts', '0_raw', fileName))
      const refs = Number(
        dbAll('SELECT COUNT(*) AS c FROM Artifact_Details WHERE fs_path = ?', [rawRelPath])?.[0]
          ?.c || 0,
      )
      if (refs > 0) {
        emitStatus?.({
          type: 'error',
          message: `A file named "${fileName}" already exists. Rename the file and try again.`,
        })
        throw new Error(
          `Duplicate filename: "${fileName}" already exists. Rename the file and try again.`,
        )
      }

      try {
        await fse.remove(rawCandidatePath)
      } catch (e) {
        emitStatus?.({
          type: 'error',
          message: `Found a stale file named "${fileName}" but could not clean it up automatically.`,
        })
        throw e
      }
    }
  }

  const results = []
  const stagedFiles = []

  emitStatus?.({
    type: 'info',
    message: 'Copying all files into workspace before markdown generation.',
  })

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
    emitFileStageStatus(emitStatus, originalFileName, {
      uploadStatus: 'pending',
      message: `Copying "${originalFileName}" into workspace...`,
    })

    // --- Save raw file
    let rawAbsPath
    try {
      rawAbsPath = path.join(rawDir, originalFileName)
      await fs.copyFile(sourceFilePath, rawAbsPath)
    } catch (e) {
      emitStatus?.({
        type: 'error',
        message: 'Could not save the raw file. Please try again.',
      })
      throw e
    }
    emitFileStageStatus(emitStatus, originalFileName, {
      uploadStatus: 'uploaded',
      markdownStatus: 'pending',
      message: `"${originalFileName}" copied.`,
    })

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
          title,
          artifact_format
        ) VALUES (?, ?, ?, ?)
      `,
        [
          rawArtifactId,
          oppty,
          baseName(originalFileName),
          originalExt.replace('.', '') || null,
        ],
      )
      dbRun(
        `
        INSERT INTO Artifact_Raw (
          artifact_id,
          fs_path,
          fs_hash,
          fs_size_bytes
        ) VALUES (?, ?, ?, ?)
      `,
        [rawArtifactId, rawRelPath, hash, stat.size],
      )
    } catch (e) {
      emitStatus?.({
        type: 'error',
        message: `Could not create raw artifact DB record for "${originalFileName}": ${e?.message || String(e)}`,
      })
      throw e
    }

    stagedFiles.push({
      sourceFilePath,
      originalFileName,
      originalExt,
      rawAbsPath,
      rawRelPath,
      rawArtifactId,
    })
  }

  emitStatus?.({
    type: 'info',
    message: 'All files copied. Generating markdown for each file.',
  })

  for (const item of stagedFiles) {
    const { sourceFilePath, originalFileName, originalExt, rawAbsPath, rawRelPath, rawArtifactId } =
      item
    emitFileStageStatus(emitStatus, originalFileName, {
      markdownStatus: 'pending',
      message: `Generating markdown for "${originalFileName}"...`,
    })

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
            title,
            artifact_format
          ) VALUES (?, ?, ?, ?)
        `,
          [
            llmArtifactId,
            oppty,
            baseName(originalFileName),
            'md',
          ],
        )
        dbRun(
          `
          INSERT INTO Artifact_Llm_Ready (
            artifact_id,
            original_artifact_id,
            generated_by,
            fs_path,
            fs_hash,
            fs_size_bytes
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
          [llmArtifactId, rawArtifactId, 'system', llmRelPath, hash, stat.size],
        )
      } catch (e) {
        emitStatus?.({
          type: 'error',
          message: `Could not create markdown artifact DB record for "${originalFileName}": ${e?.message || String(e)}`,
        })
        throw e
      }

      results.push({
        source: sourceFilePath,
        raw: { artifact_id: rawArtifactId, fs_path: rawRelPath },
        llm_ready: { artifact_id: llmArtifactId, fs_path: llmRelPath },
      })
      emitFileStageStatus(emitStatus, originalFileName, {
        markdownStatus: 'completed',
        message: `"${originalFileName}" markdown generated`,
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
          message: `Processing "${originalFileName}" with AI to extract PDF text. This can take a while.`,
        })
        markdown = await ocrToMarkdown({
          filePath: rawAbsPath,
          fileName: originalFileName,
          geminiApiKey,
        })
        emitFileStageStatus(emitStatus, originalFileName, {
          markdownStatus: 'completed',
          message: `${originalFileName} markdown generated`,
        })
      } else if (isImageExt(originalExt)) {
        emitStatus?.({
          type: 'info',
          message: 'Image detected. Using LLM to create LLM ready Markdown.',
        })
        markdown = await ocrToMarkdown({
          filePath: rawAbsPath,
          fileName: originalFileName,
          geminiApiKey,
        })
        emitFileStageStatus(emitStatus, originalFileName, {
          markdownStatus: 'completed',
          message: `${originalFileName} markdown generated`,
        })
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
          emitFileStageStatus(emitStatus, originalFileName, {
            markdownStatus: 'completed',
            message: `${originalFileName} markdown generated`,
          })
        } catch {
          emitStatus?.({
            type: 'info',
            message: 'OCR required. Using LLM to create LLM ready Markdown.',
          })
          markdown = await ocrToMarkdown({
            filePath: rawAbsPath,
            fileName: originalFileName,
            geminiApiKey,
          })
          emitFileStageStatus(emitStatus, originalFileName, {
            markdownStatus: 'completed',
            message: `${originalFileName} markdown generated`,
          })
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
          title,
          artifact_format
        ) VALUES (?, ?, ?, ?)
      `,
        [
          llmArtifactId,
          oppty,
          baseName(originalFileName),
          'md',
        ],
      )
      dbRun(
        `
        INSERT INTO Artifact_Llm_Ready (
          artifact_id,
          original_artifact_id,
          generated_by,
          fs_path,
          fs_hash,
          fs_size_bytes,
          llm_provider,
          llm_model
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [llmArtifactId, rawArtifactId, 'llm', llmRelPath, hash, stat.size, 'google', 'gemini-2.5-flash'],
      )
    } catch (e) {
      emitStatus?.({
        type: 'error',
        message: `Could not create markdown artifact DB record for "${originalFileName}": ${e?.message || String(e)}`,
      })
      throw e
    }

    await tryPopulateArtifactMetadata({ markdown, artifactId: llmArtifactId, openaiApiKey })

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
