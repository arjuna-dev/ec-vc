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
    status: 'defaultVerificationState',
    dataStatus: 'defaultVerificationState',
    defaultVerificationState: 'defaultVerificationState',
    label: 'label',
  }
  return aliases[normalizedField] || normalizedField
}

function parseOptionListValue(value = '') {
  return String(value ?? '')
    .split(',')
    .map((entry) => String(entry || '').trim())
    .filter(Boolean)
}

export function updateStructureTokenField(sections = [], tokenKey = '', field = '', value = '') {
  const normalizedKey = String(tokenKey || '').trim()
  const targetField = mapTokenFieldName(field)
  if (!normalizedKey || !targetField) return cloneFileStructureSections(sections)

  return cloneFileStructureSections(sections).map((section) => ({
    ...section,
    tokens: (Array.isArray(section?.tokens) ? section.tokens : []).map((token) => {
      if (String(token?.key || '').trim() !== normalizedKey) return token
      if (targetField === 'optionList') {
        const normalizedValue = String(value ?? '').trim()
        return {
          ...token,
          optionList: normalizedValue,
          inputOptions: parseOptionListValue(normalizedValue),
        }
      }
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

export function appendDraftStructureView(sections = []) {
  const nextSections = cloneFileStructureSections(sections)
  const nextIndex = nextSections.length + 1
  nextSections.push({
    key: `draft-view-${Date.now()}`,
    label: `Draft View ${nextIndex}`,
    address: '',
    structureToken: '',
    displayGroup: '',
    tokens: [],
    editable: true,
    isDraft: true,
  })
  return nextSections
}

export function appendDraftStructureToken(sections = [], parentViewKey = '') {
  const normalizedParentKey = String(parentViewKey || '').trim()
  if (!normalizedParentKey) return cloneFileStructureSections(sections)

  return cloneFileStructureSections(sections).map((section) => {
    if (String(section?.key || '').trim() !== normalizedParentKey) return section
    const nextIndex = (Array.isArray(section?.tokens) ? section.tokens.length : 0) + 1
    return {
      ...section,
      tokens: [
        ...(Array.isArray(section?.tokens) ? section.tokens : []),
        {
          key: `draft-token-${Date.now()}`,
          tokenName: `Draft_Token_${nextIndex}`,
          label: `Draft Token ${nextIndex}`,
          tokenType: 'text',
          optionSource: '',
          optionEntity: '',
          optionList: '',
          definition: '',
          defaultVerificationState: 'Input',
          dbFieldAliases: [],
          dbWriteField: '',
          fieldClass: '',
          parentKey: normalizedParentKey,
          parentLabel: section.label,
          editable: true,
          isDraft: true,
        },
      ],
    }
  })
}
