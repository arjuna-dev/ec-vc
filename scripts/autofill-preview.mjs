import path from 'node:path'
import process from 'node:process'

import { previewAutofillFromFiles } from '../src-electron/services/autofill-extraction.js'

function parseArgs(argv = []) {
  const args = { kind: 'round', files: [] }
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || '').trim()
    if (!token) continue
    if (token === '--kind') {
      args.kind = String(argv[i + 1] || '').trim().toLowerCase() || 'round'
      i += 1
      continue
    }
    if (token === '--out') {
      args.out = String(argv[i + 1] || '').trim()
      i += 1
      continue
    }
    if (token === '--help' || token === '-h') {
      args.help = true
      continue
    }
    args.files.push(token)
  }
  return args
}

function printHelp() {
  console.log('Usage: npm run autofill:preview -- [--kind round|fund] [--out output.json] <file1> <file2> ...')
  console.log('Example: npm run autofill:preview -- --kind round ./docs/sample.pdf')
}

async function run() {
  const { kind, files, out, help } = parseArgs(process.argv.slice(2))
  if (help) {
    printHelp()
    process.exit(0)
  }

  if (!files.length) {
    printHelp()
    throw new Error('No source files provided.')
  }

  const normalizedKind = kind === 'fund' ? 'fund' : 'round'
  const filePaths = files.map((value) => path.resolve(String(value || '').trim())).filter(Boolean)
  const geminiApiKey = String(process.env.ECVC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim()

  if (!geminiApiKey) {
    throw new Error('Missing API key. Set ECVC_GEMINI_API_KEY (or GEMINI_API_KEY).')
  }

  const result = await previewAutofillFromFiles({
    filePaths,
    apiKeys: { gemini: geminiApiKey },
    existingCompanies: [],
    existingContacts: [],
    existingRounds: [],
    existingFunds: [],
    context: { kind: normalizedKind },
    emitStatus: (status) => {
      const stage = String(status?.stage || status?.type || 'status')
      const message = String(status?.message || '').trim()
      if (message) console.log(`[autofill:${stage}] ${message}`)
    },
  })

  const output = JSON.stringify(result, null, 2)
  if (out) {
    const fs = await import('node:fs/promises')
    await fs.writeFile(path.resolve(out), `${output}\n`, 'utf8')
    console.log(`Saved autofill preview to ${path.resolve(out)}`)
    return
  }

  console.log(output)
}

run().catch((error) => {
  console.error(error?.message || String(error))
  process.exit(1)
})

