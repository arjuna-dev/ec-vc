const STORAGE_KEY = 'ecvc_token_meta_overrides_v1'

function safeParse(value) {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function loadTokenMetadataOverrides() {
  if (typeof window === 'undefined') return {}
  return safeParse(window.localStorage?.getItem(STORAGE_KEY))
}

export function persistTokenMetadataOverrides(value = {}) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(value || {}))
  } catch {
    // ignore persistence failures
  }
}

export function getTokenMetadataOverride(overrides = {}, sourceKey = '', tokenKey = '') {
  const normalizedSource = String(sourceKey || '').trim()
  const normalizedToken = String(tokenKey || '').trim()
  if (!normalizedSource || !normalizedToken) return null
  const bySource = overrides?.[normalizedSource]
  if (!bySource || typeof bySource !== 'object') return null
  return bySource?.[normalizedToken] && typeof bySource[normalizedToken] === 'object'
    ? bySource[normalizedToken]
    : null
}

export function mergeTokenMetadata(token, override = null) {
  if (!override || !token) return token
  const next = { ...token }
  const tokenType = String(override.tokenType || '').trim()
  const optionSource = String(override.optionSource || '').trim()
  const optionEntity = String(override.optionEntity || '').trim()
  const optionList = String(override.optionList || '').trim()
  const dbWriteField = String(override.dbWriteField || '').trim()
  const fieldClass = String(override.fieldClass || '').trim()

  if (tokenType) next.tokenType = tokenType
  if (optionSource) next.optionSource = optionSource
  if (optionEntity) next.optionEntity = optionEntity
  if (optionList) next.optionList = optionList
  if (dbWriteField) next.dbWriteField = dbWriteField
  if (fieldClass) next.fieldClass = fieldClass

  return next
}

