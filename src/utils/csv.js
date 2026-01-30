function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function rowsToCsv(headers, rows) {
  const cols = (headers || []).map(String)
  const lines = []
  lines.push(cols.map(escapeCsvValue).join(','))
  for (const row of rows || []) {
    lines.push(cols.map((h) => escapeCsvValue(row?.[h])).join(','))
  }
  return lines.join('\n')
}

function parseCsvLine(line) {
  const out = []
  let i = 0
  let cur = ''
  let inQuotes = false

  while (i < line.length) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        const next = line[i + 1]
        if (next === '"') {
          cur += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      cur += ch
      i += 1
      continue
    }

    if (ch === '"') {
      inQuotes = true
      i += 1
      continue
    }

    if (ch === ',') {
      out.push(cur)
      cur = ''
      i += 1
      continue
    }

    cur += ch
    i += 1
  }

  out.push(cur)
  return out
}

export function csvToRows(text) {
  const raw = String(text || '')
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)

  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCsvLine(lines[0]).map((h) => h.trim()).filter(Boolean)
  const rows = []

  for (let idx = 1; idx < lines.length; idx += 1) {
    const values = parseCsvLine(lines[idx])
    const row = {}
    for (let j = 0; j < headers.length; j += 1) {
      row[headers[j]] = values[j] ?? ''
    }
    rows.push(row)
  }

  return { headers, rows }
}

