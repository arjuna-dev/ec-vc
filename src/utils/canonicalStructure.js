import canonicalStructure from '../../docs/canonical-structure.json'

const ENTITY_MAP = new Map(
  (canonicalStructure?.entities || []).map((entity) => [entity.entity, entity]),
)

const ACRONYM_LABELS = new Map([
  ['ID', 'ID'],
  ['HQ', 'HQ'],
  ['KDB', 'KDB'],
  ['PEmail', 'Professional Email'],
  ['BEmail', 'Personal Email'],
  ['DateTime', 'Date/Time'],
  ['LinkedIn', 'LinkedIn'],
  ['Inc', 'Incorporation'],
  ['FS', 'Financial Statements'],
  ['BP', 'Business Plan'],
  ['CAC', 'CAC'],
  ['LTV', 'LTV'],
  ['ICP', 'ICP'],
  ['IS', 'Income Statement'],
  ['BS', 'Balance Sheet'],
  ['CF', 'Cash Flow'],
  ['IP', 'IP'],
  ['Pax', 'PAX'],
  ['Ops', 'Operations'],
])

export function getCanonicalEntityStructure(entityName) {
  return ENTITY_MAP.get(entityName) || null
}

export function getCanonicalSubsections(entityName) {
  return getCanonicalEntityStructure(entityName)?.subsections || []
}

export function getCanonicalSubsectionOptions(entityName) {
  return getCanonicalSubsections(entityName).map((subsection) => ({
    value: subsection.subsection_address,
    label: formatSubsectionLabel(subsection.subsection),
  }))
}

export function getCanonicalSubsection(entityName, subsectionAddress) {
  return (
    getCanonicalSubsections(entityName).find(
      (subsection) => subsection.subsection_address === subsectionAddress,
    ) || null
  )
}

export function getCanonicalDefaultSubsection(entityName) {
  return getCanonicalSubsections(entityName)[0]?.subsection_address || ''
}

export function formatCanonicalTokenLabel(tokenName, entityLabel) {
  const normalized = String(tokenName || '').trim()
  if (!normalized) return ''

  const withoutPrefix = entityLabel
    ? normalized.replace(new RegExp(`^${entityLabel}_`, 'i'), '')
    : normalized

  return withoutPrefix
    .split('_')
    .filter(Boolean)
    .map((part) => ACRONYM_LABELS.get(part) || part)
    .join(' ')
}

function formatSubsectionLabel(value) {
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => ACRONYM_LABELS.get(part) || part)
    .join(' ')
}
