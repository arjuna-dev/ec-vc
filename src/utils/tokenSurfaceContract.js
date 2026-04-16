function normalizeSurfaceOption(option) {
  if (option == null) return null

  if (typeof option === 'object' && !Array.isArray(option)) {
    const value = String(option?.value ?? '').trim()
    const label = String(option?.label ?? value).trim()
    if (!value && !label) return null
    return {
      value: value || label,
      label: label || value,
    }
  }

  const normalized = String(option || '').trim()
  if (!normalized) return null
  return { value: normalized, label: normalized }
}

export function getTokenInputKind(token = {}) {
  const tokenType = String(token?.tokenType || '').trim().toLowerCase()
  if (tokenType === 'select_single') return 'select'
  if (['textarea', 'long_text', 'rich_text'].includes(tokenType)) return 'textarea'
  return 'text'
}

export function getStaticInputOptionsForToken(token = {}) {
  const directOptions = Array.isArray(token?.inputOptions)
    ? token.inputOptions.map((option) => normalizeSurfaceOption(option)).filter(Boolean)
    : []
  if (directOptions.length) return directOptions

  const optionSource = String(token?.optionSource || '').trim().toLowerCase()
  const rawOptionList = String(token?.optionList || '').trim()
  if (!rawOptionList) return []
  if (!['static', 'manual', 'option_list'].includes(optionSource)) return []

  return rawOptionList
    .split(',')
    .map((option) => normalizeSurfaceOption(option))
    .filter(Boolean)
}

export function getTokenInputOptions(token = {}, { resolveDynamicOptions } = {}) {
  const staticOptions = getStaticInputOptionsForToken(token)
  if (staticOptions.length) return staticOptions

  if (typeof resolveDynamicOptions === 'function') {
    const dynamicOptions = resolveDynamicOptions(token)
    if (Array.isArray(dynamicOptions) && dynamicOptions.length) {
      return dynamicOptions.map((option) => normalizeSurfaceOption(option)).filter(Boolean)
    }
  }

  return []
}

export function buildSurfaceColumnFromToken(
  token = {},
  {
    width = 170,
    editable = false,
    headerClass = '',
    cellClass = '',
    resolveDynamicOptions,
  } = {},
) {
  const kind = getTokenInputKind(token)
  const isSelect = kind === 'select'

  return {
    key: String(token?.key || '').trim(),
    label: String(token?.label || token?.key || 'Field').trim(),
    width,
    kind,
    options: isSelect ? getTokenInputOptions(token, { resolveDynamicOptions }) : [],
    headerClass,
    cellClass,
    editable: Boolean(editable),
  }
}

export function buildSelectSurfaceColumn(
  {
    key = '',
    label = '',
    width = 170,
    editable = false,
    headerClass = '',
    cellClass = '',
  } = {},
  options = [],
) {
  return {
    key: String(key || '').trim(),
    label: String(label || key || 'Field').trim(),
    width,
    kind: 'select',
    options: (Array.isArray(options) ? options : []).map((option) => normalizeSurfaceOption(option)).filter(Boolean),
    headerClass,
    cellClass,
    editable: Boolean(editable),
  }
}
