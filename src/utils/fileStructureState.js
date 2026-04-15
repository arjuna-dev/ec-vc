function cloneToken(token = {}) {
  return {
    ...token,
  }
}

function cloneSection(section = {}) {
  return {
    ...section,
    tokens: (Array.isArray(section?.tokens) ? section.tokens : []).map((token) => cloneToken(token)),
  }
}

export function cloneFileStructureSections(sections = []) {
  return (Array.isArray(sections) ? sections : []).map((section) => cloneSection(section))
}

export function renameStructureView(sections = [], viewKey = '', nextLabel = '') {
  const normalizedKey = String(viewKey || '').trim()
  const normalizedLabel = String(nextLabel || '').trim()
  if (!normalizedKey || !normalizedLabel) return cloneFileStructureSections(sections)

  return cloneFileStructureSections(sections).map((section) => {
    if (String(section?.key || '').trim() !== normalizedKey) return section
    return {
      ...section,
      label: normalizedLabel,
    }
  })
}

function mapTokenFieldName(field = '') {
  const normalizedField = String(field || '').trim()
  const aliases = {
    type: 'tokenType',
    fieldClass: 'fieldClass',
    dbWriteField: 'dbWriteField',
    optionSource: 'optionSource',
    optionEntity: 'optionEntity',
    optionList: 'optionList',
    definition: 'definition',
    label: 'label',
  }
  return aliases[normalizedField] || normalizedField
}

export function updateStructureTokenField(sections = [], tokenKey = '', field = '', value = '') {
  const normalizedKey = String(tokenKey || '').trim()
  const targetField = mapTokenFieldName(field)
  if (!normalizedKey || !targetField) return cloneFileStructureSections(sections)

  return cloneFileStructureSections(sections).map((section) => ({
    ...section,
    tokens: (Array.isArray(section?.tokens) ? section.tokens : []).map((token) => {
      if (String(token?.key || '').trim() !== normalizedKey) return token
      return {
        ...token,
        [targetField]: String(value ?? '').trim(),
      }
    }),
  }))
}

export function deleteStructureTokens(sections = [], tokenKeys = []) {
  const deletedKeys = new Set((Array.isArray(tokenKeys) ? tokenKeys : []).map((key) => String(key || '').trim()).filter(Boolean))
  if (!deletedKeys.size) return cloneFileStructureSections(sections)

  return cloneFileStructureSections(sections).map((section) => ({
    ...section,
    tokens: (Array.isArray(section?.tokens) ? section.tokens : []).filter((token) => !deletedKeys.has(String(token?.key || '').trim())),
  }))
}

export function collectStructureTokenKeys(sections = []) {
  return cloneFileStructureSections(sections).flatMap((section) =>
    (Array.isArray(section?.tokens) ? section.tokens : []).map((token) => String(token?.key || '').trim()).filter(Boolean),
  )
}
