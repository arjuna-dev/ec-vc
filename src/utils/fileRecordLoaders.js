import { resolveApprovedFileSectionKey } from './structureRegistry'

export const FILE_RECORD_LOADERS = Object.freeze({
  'file-system': { listFn: (bridgeValue) => bridgeValue?.['file-system']?.list?.(), resultKey: 'files', recordIdField: 'id' },
  events: { listFn: (bridgeValue) => bridgeValue?.events?.list?.(), resultKey: 'events', recordIdField: 'id' },
  users: { listFn: (bridgeValue) => bridgeValue?.users?.list?.(), resultKey: 'users', recordIdField: 'id' },
  companion: { listFn: (bridgeValue) => bridgeValue?.companion?.list?.(), resultKey: 'companion', recordIdField: 'id' },
  markets: { listFn: (bridgeValue) => bridgeValue?.markets?.list?.(), resultKey: 'markets', recordIdField: 'id' },
  securities: { listFn: (bridgeValue) => bridgeValue?.securities?.list?.(), resultKey: 'securities', recordIdField: 'id' },
  artifacts: { listFn: (bridgeValue) => bridgeValue?.artifacts?.list?.(), resultKey: 'artifacts', recordIdField: 'artifact_id' },
  contacts: { listFn: (bridgeValue) => bridgeValue?.contacts?.list?.(), resultKey: 'contacts', recordIdField: 'id' },
  companies: { listFn: (bridgeValue) => bridgeValue?.companies?.list?.(), resultKey: 'companies', recordIdField: 'id' },
  opportunities: { listFn: (bridgeValue) => bridgeValue?.opportunities?.list?.(), resultKey: 'opportunities', recordIdField: 'id' },
  funds: { listFn: (bridgeValue) => bridgeValue?.funds?.list?.(), resultKey: 'funds', recordIdField: 'id' },
  rounds: { listFn: (bridgeValue) => bridgeValue?.rounds?.list?.(), resultKey: 'rounds', recordIdField: 'id' },
  projects: { listFn: (bridgeValue) => bridgeValue?.projects?.list?.(), resultKey: 'projects', recordIdField: 'id' },
  notes: { listFn: (bridgeValue) => bridgeValue?.notes?.list?.(), resultKey: 'notes', recordIdField: 'id' },
  tasks: { listFn: (bridgeValue) => bridgeValue?.tasks?.list?.(), resultKey: 'tasks', recordIdField: 'id' },
  'bb-file': { listFn: (bridgeValue) => bridgeValue?.['bb-file']?.list?.(), resultKey: 'buildingBlocks', recordIdField: 'id' },
  'user-roles': { listFn: (bridgeValue) => bridgeValue?.['user-roles']?.list?.(), resultKey: 'roles', recordIdField: 'id' },
  'companion-roles': { listFn: (bridgeValue) => bridgeValue?.['companion-roles']?.list?.() ?? { companionRoles: [] }, resultKey: 'companionRoles', recordIdField: 'id' },
  intake: { listFn: (bridgeValue) => bridgeValue?.intake?.list?.(), resultKey: 'intake', recordIdField: 'id' },
})

export function getFileRecordLoader(sourceKey = '') {
  return FILE_RECORD_LOADERS[String(sourceKey || '').trim().toLowerCase()] || null
}

export function normalizeFileRecordListResult(result) {
  if (Array.isArray(result)) return result
  if (!result || typeof result !== 'object') return []
  const firstArray = Object.values(result).find((value) => Array.isArray(value))
  return Array.isArray(firstArray) ? firstArray : []
}

export async function loadFileRecordRows({
  sourceKey = '',
  bridgeValue = null,
  currentRowsBySource = {},
  skipSourceKey = '',
} = {}) {
  const normalizedSourceKey = String(sourceKey || '').trim().toLowerCase()
  const normalizedSkipSourceKey = String(skipSourceKey || '').trim().toLowerCase()
  if (!normalizedSourceKey || normalizedSourceKey === normalizedSkipSourceKey) return currentRowsBySource
  if (Array.isArray(currentRowsBySource?.[normalizedSourceKey])) return currentRowsBySource

  const loader = getFileRecordLoader(normalizedSourceKey)
  if (!loader || !bridgeValue) {
    return {
      ...currentRowsBySource,
      [normalizedSourceKey]: [],
    }
  }

  try {
    const result = await loader.listFn(bridgeValue)
    const rows = Array.isArray(result?.[loader.resultKey]) ? result[loader.resultKey] : normalizeFileRecordListResult(result)
    return {
      ...currentRowsBySource,
      [normalizedSourceKey]: rows,
    }
  } catch {
    return {
      ...currentRowsBySource,
      [normalizedSourceKey]: [],
    }
  }
}

export async function hydrateFileRecordUniverseFromSystemFiles({
  bridgeValue = null,
  currentRowsBySource = {},
  skipSourceKey = '',
} = {}) {
  let nextRowsBySource = await loadFileRecordRows({
    sourceKey: 'file-system',
    bridgeValue,
    currentRowsBySource,
    skipSourceKey,
  })

  const systemRows = Array.isArray(nextRowsBySource?.['file-system']) ? nextRowsBySource['file-system'] : []
  for (const row of systemRows) {
    const sourceKey = resolveApprovedFileSectionKey(
      row?.sourceKey || row?.File_Route_Name || row?.File_Runtime_Entity || row?.File_Canonical_Entity,
    )
    if (!sourceKey || sourceKey === 'bb-file' || Array.isArray(nextRowsBySource?.[sourceKey])) continue
    nextRowsBySource = await loadFileRecordRows({
      sourceKey,
      bridgeValue,
      currentRowsBySource: nextRowsBySource,
      skipSourceKey,
    })
  }

  return nextRowsBySource
}
