import { copyToClipboard } from 'quasar'

export async function copySelectionSummary({
  rows = [],
  getLabel = (row) => String(row?.id || '').trim(),
  entityLabel = 'items',
} = {}) {
  const safeRows = Array.isArray(rows) ? rows : []
  const labels = safeRows
    .map((row, index) => String(getLabel(row, index) || '').trim())
    .filter(Boolean)

  const header = `${labels.length || safeRows.length} selected ${entityLabel}`
  const lines = labels.length ? [header, '', ...labels.map((label) => `- ${label}`)] : [header]
  const text = lines.join('\n')

  await copyToClipboard(text)
  return text
}
