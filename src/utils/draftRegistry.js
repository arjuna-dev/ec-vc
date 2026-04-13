import { ref } from 'vue'

const draftRegistryBySource = ref({})

function normalizeSourceKey(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeDraftId(value) {
  return String(value || '').trim()
}

export function upsertDraftRegistryEntry(sourceKey, draftId, values = {}, meta = {}) {
  const normalizedSourceKey = normalizeSourceKey(sourceKey)
  const normalizedDraftId = normalizeDraftId(draftId)
  if (!normalizedSourceKey || !normalizedDraftId) return
  const existingRows = Array.isArray(draftRegistryBySource.value[normalizedSourceKey])
    ? draftRegistryBySource.value[normalizedSourceKey]
    : []
  const nextEntry = {
    id: normalizedDraftId,
    sourceKey: normalizedSourceKey,
    values: values && typeof values === 'object' ? { ...values } : {},
    meta: meta && typeof meta === 'object' ? { ...meta } : {},
    updatedAt: Date.now(),
  }
  draftRegistryBySource.value = {
    ...draftRegistryBySource.value,
    [normalizedSourceKey]: [
      nextEntry,
      ...existingRows.filter((entry) => normalizeDraftId(entry?.id) !== normalizedDraftId),
    ],
  }
}

export function removeDraftRegistryEntry(sourceKey, draftId) {
  const normalizedSourceKey = normalizeSourceKey(sourceKey)
  const normalizedDraftId = normalizeDraftId(draftId)
  if (!normalizedSourceKey || !normalizedDraftId) return
  const existingRows = Array.isArray(draftRegistryBySource.value[normalizedSourceKey])
    ? draftRegistryBySource.value[normalizedSourceKey]
    : []
  draftRegistryBySource.value = {
    ...draftRegistryBySource.value,
    [normalizedSourceKey]: existingRows.filter((entry) => normalizeDraftId(entry?.id) !== normalizedDraftId),
  }
}

export function getDraftRegistryBySource() {
  return draftRegistryBySource.value
}

export function getDraftRegistryEntries() {
  const entries = []
  Object.entries(draftRegistryBySource.value).forEach(([sourceKey, rows]) => {
    if (!Array.isArray(rows)) return
    rows.forEach((row) => {
      entries.push({ ...row, sourceKey })
    })
  })
  return entries
}
