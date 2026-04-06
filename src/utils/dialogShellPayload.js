export function getDialogSectionGroupValue(section) {
  const displayGroup = String(section?.displayGroup || '').trim()
  return displayGroup ? `group:${displayGroup}` : String(section?.key || '').trim()
}

function formatRelationshipGroupLabel(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'first_order') return 'First-Order'
  if (normalized === 'knowledge_db') return 'Knowledge DB'
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function buildKdbSubgroups(tokens = []) {
  const groups = new Map()
  for (const token of Array.isArray(tokens) ? tokens : []) {
    const key = String(token?.relationshipGroup || '').trim().toLowerCase()
    if (!key) continue
    const existing = groups.get(key)
    if (existing) {
      existing.tokens.push(token)
      continue
    }
    groups.set(key, {
      key: `kdb:${key}`,
      label: formatRelationshipGroupLabel(key),
      tokens: [token],
    })
  }
  return Array.from(groups.values()).filter((group) => group.tokens.length)
}

export function groupDialogLevel2Sections(level2Sections = []) {
  const groups = []
  for (const section of Array.isArray(level2Sections) ? level2Sections : []) {
    const value = getDialogSectionGroupValue(section)
    const existing = groups.find((group) => group.value === value)
    if (existing) {
      existing.sections.push(section)
      continue
    }
    groups.push({
      value,
      title: String(section?.displayGroup || section?.label || '').trim(),
      sections: [section],
    })
  }
  return groups
}

export function buildDialogSectionGroups({
  groupedSections = [],
  tokenFilter = () => true,
  mapToken = (token) => token,
} = {}) {
  return (Array.isArray(groupedSections) ? groupedSections : [])
    .map((group) => {
      const subsectionGroups = (Array.isArray(group?.sections) ? group.sections : [])
        .map((section) => ({
          key: section.key,
          label: section.label,
          tokens: tokenFilter(section).map((token) => mapToken(token)),
        }))
        .filter((section) => section.tokens.length)

      const flatTokens = subsectionGroups.flatMap((section) => section.tokens)
      const isKdbGroup = String(group?.title || '').trim().toLowerCase() === 'kdb'
      const kdbSubgroups = isKdbGroup ? buildKdbSubgroups(flatTokens) : []

      return {
        key: group.value,
        label: group.title,
        tokens: flatTokens,
        subgroups: kdbSubgroups.length ? kdbSubgroups : subsectionGroups.length > 1 ? subsectionGroups : [],
      }
    })
    .filter((group) => group.tokens.length)
}

export function splitDialogSections(sectionGroups = []) {
  const sections = Array.isArray(sectionGroups) ? sectionGroups : []
  return {
    leftSections: sections.filter((section) => !['kdb', 'system'].includes(String(section?.label || '').trim().toLowerCase())),
    rightSections: sections.filter((section) => ['kdb', 'system'].includes(String(section?.label || '').trim().toLowerCase())),
  }
}
