const SHELL_FIELD_SELECTION_STORAGE_KEY = 'ecvc:shell-field-selection-by-source'

function normalizeSelectionMap(value) {
  if (!value || typeof value !== 'object') return {}
  return Object.fromEntries(
    Object.entries(value)
      .map(([sourceKey, keys]) => [
        String(sourceKey || '').trim().toLowerCase(),
        Array.from(new Set((Array.isArray(keys) ? keys : []).map((key) => String(key || '').trim()).filter(Boolean))),
      ])
      .filter(([sourceKey]) => Boolean(sourceKey)),
  )
}

export function loadShellFieldSelectionMap() {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    return normalizeSelectionMap(JSON.parse(window.localStorage.getItem(SHELL_FIELD_SELECTION_STORAGE_KEY) || '{}'))
  } catch {
    return {}
  }
}

export function persistShellFieldSelectionMap(value) {
  const normalized = normalizeSelectionMap(value)
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(SHELL_FIELD_SELECTION_STORAGE_KEY, JSON.stringify(normalized))
  }
  return normalized
}
