import { copySelectionSummary } from 'src/utils/selectionShare'

export function openFirstSelectedRecord(rows, openRecordView) {
  const firstRow = Array.isArray(rows) ? rows[0] : null
  if (!firstRow || typeof openRecordView !== 'function') return
  return openRecordView(firstRow)
}

export async function shareRecordSelection({
  rows,
  entityLabel,
  getLabel,
  singularLabel,
  pluralLabel,
  notify,
} = {}) {
  const normalizedRows = Array.isArray(rows) ? rows : []
  const selectedCount = normalizedRows.length
  if (!selectedCount) return false

  try {
    await copySelectionSummary({
      rows: normalizedRows,
      getLabel,
      entityLabel,
    })

    if (typeof notify === 'function') {
      notify({
        type: 'positive',
        message: `Copied ${selectedCount} selected ${selectedCount === 1 ? singularLabel : pluralLabel}.`,
      })
    }

    return true
  } catch (error) {
    if (typeof notify === 'function') {
      notify({
        type: 'negative',
        message: error?.message || String(error),
      })
    }
    return false
  }
}
