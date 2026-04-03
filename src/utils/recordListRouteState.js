export function normalizeRouteQueryValue(value, allowedValues, fallbackValue) {
  const normalized = String(value || '').trim().toLowerCase()
  return allowedValues.has(normalized) ? normalized : fallbackValue
}

export function buildRouteQueryWithState(currentQuery = {}, stateEntries = []) {
  const nextQuery = { ...currentQuery }

  for (const entry of stateEntries) {
    if (!entry?.key) continue
    const value = entry.value
    const fallbackValue = entry.fallbackValue

    if (value === fallbackValue || value == null || value === '') {
      delete nextQuery[entry.key]
      continue
    }

    nextQuery[entry.key] = value
  }

  return nextQuery
}

export function syncRouteQueryState({
  router,
  currentQuery = {},
  currentState = {},
  stateEntries = [],
}) {
  const normalizedEntries = stateEntries.map((entry) => ({
    ...entry,
    value: currentState[entry.key],
  }))

  const nextQuery = buildRouteQueryWithState(currentQuery, normalizedEntries)
  const currentKeys = Object.keys(currentQuery)
  const nextKeys = Object.keys(nextQuery)
  const changed =
    currentKeys.length !== nextKeys.length ||
    nextKeys.some((key) => currentQuery[key] !== nextQuery[key]) ||
    currentKeys.some((key) => !(key in nextQuery))

  if (!changed) return Promise.resolve()

  return router.replace({ query: nextQuery })
}
