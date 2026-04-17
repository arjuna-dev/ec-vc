import { getFileRecordLoader } from './fileRecordLoaders'
import { resolveApprovedFileSectionKey } from './structureRegistry'

export function normalizeLiveOptionListResult(result) {
  if (Array.isArray(result)) return result
  if (!result || typeof result !== 'object') return []
  const firstArray = Object.values(result).find((value) => Array.isArray(value))
  return Array.isArray(firstArray) ? firstArray : []
}

export async function loadLiveOptionRowsForSource({
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
    const rows = Array.isArray(result?.[loader.resultKey]) ? result[loader.resultKey] : normalizeLiveOptionListResult(result)
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

export async function hydrateLiveOptionUniverseFromSystemFiles({
  bridgeValue = null,
  currentRowsBySource = {},
  skipSourceKey = '',
} = {}) {
  let nextRowsBySource = await loadLiveOptionRowsForSource({
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
    nextRowsBySource = await loadLiveOptionRowsForSource({
      sourceKey,
      bridgeValue,
      currentRowsBySource: nextRowsBySource,
      skipSourceKey,
    })
  }

  return nextRowsBySource
}
