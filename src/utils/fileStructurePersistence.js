function normalizeYesNo(value = '') {
  return String(value || '').trim().toLowerCase() === 'yes' ? 'Yes' : 'No'
}

function normalizeLabel(value = '') {
  return String(value || '').trim().toLowerCase()
}

export function resolveFileRegistryRow(fileRows = [], sourceKey = '') {
  const normalizedSourceKey = String(sourceKey || '').trim().toLowerCase()
  if (!normalizedSourceKey) return null
  return (Array.isArray(fileRows) ? fileRows : []).find((row) =>
    String(row?.File_Source_Key || '').trim().toLowerCase() === normalizedSourceKey,
  ) || null
}

export function buildFileRegistryPresenceChanges(session = {}, fileRow = null) {
  if (!fileRow?.id) return []

  const viewRows = Array.isArray(session?.viewRows) ? session.viewRows : []
  const hasSystem = viewRows.some((row) => normalizeLabel(row?.label) === 'system')
  const hasLdb = viewRows.some((row) => normalizeLabel(row?.label) === 'ldb')

  const desiredSystem = hasSystem ? 'Yes' : 'No'
  const desiredLdb = hasLdb ? 'Yes' : 'No'
  const changes = []

  if (normalizeYesNo(fileRow?.Requires_System) !== desiredSystem) {
    changes.push({
      table_name: 'Files',
      record_id: String(fileRow.id || '').trim(),
      field_name: 'Requires_System',
      id_column: 'id',
      new_value: desiredSystem,
    })
  }

  if (normalizeYesNo(fileRow?.Requires_KDB) !== desiredLdb) {
    changes.push({
      table_name: 'Files',
      record_id: String(fileRow.id || '').trim(),
      field_name: 'Requires_KDB',
      id_column: 'id',
      new_value: desiredLdb,
    })
  }

  return changes
}

export async function applyFileRegistryPresenceChanges({
  bridge = null,
  fileRow = null,
  changes = [],
  actionLabel = 'file_structure_session_presence',
} = {}) {
  const normalizedChanges = Array.isArray(changes) ? changes : []
  const recordId = String(fileRow?.id || '').trim()
  if (!recordId || !normalizedChanges.length) return { changes: [] }

  await bridge?.databooks?.update?.({
    tableName: 'Files',
    recordId,
    changes: normalizedChanges,
    actionLabel,
  })

  return { changes: normalizedChanges }
}
