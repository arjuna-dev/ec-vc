export function getDialogSectionGroupValue(section) {
  const subgroupKey = String(section?.subgroupKey || '').trim()
  if (subgroupKey) return `subgroup:${subgroupKey}`
  const displayGroup = String(section?.displayGroup || '').trim()
  return displayGroup ? `group:${displayGroup}` : String(section?.key || '').trim()
}

function isRelationshipSectionLabel(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'ldb'
}

export function groupDialogSections(sections = []) {
  const groups = []
  for (const section of Array.isArray(sections) ? sections : []) {
    const value = getDialogSectionGroupValue(section)
    const existing = groups.find((group) => group.value === value)
    if (existing) {
      existing.sections.push(section)
      continue
    }
    groups.push({
      value,
      title: String(section?.subgroupLabel || section?.displayGroup || section?.label || '').trim(),
      sections: [section],
    })
  }
  return groups
}

export function buildDialogSections({
  groupedSections = [],
  tokenFilter = () => true,
  mapToken = (token) => token,
  keepEmptySections = false,
} = {}) {
  return (Array.isArray(groupedSections) ? groupedSections : [])
    .map((group) => {
      const subsectionGroups = (Array.isArray(group?.sections) ? group.sections : [])
        .map((section) => ({
          key: section.key,
          label: section.label,
          tokens: tokenFilter(section).map((token) => mapToken(token)),
        }))
        .filter((section) => keepEmptySections || section.tokens.length)

      const flatTokens = subsectionGroups.flatMap((section) => section.tokens)
      return {
        key: group.value,
        label: group.title,
        rawLabel: String(group?.title || group?.sections?.[0]?.label || group?.sections?.[0]?.rawLabel || '').trim(),
        tokens: flatTokens,
        subgroups: subsectionGroups.length > 1 ? subsectionGroups : [],
      }
    })
    .filter((group) => keepEmptySections || group.tokens.length)
}

export function splitDialogSections(sectionGroups = []) {
  const sections = Array.isArray(sectionGroups) ? sectionGroups : []
  return {
    leftSections: sections.filter((section) => {
      const sectionLabel = String(section?.label || section?.rawLabel || '').trim().toLowerCase()
      return ![ 'system' ].includes(sectionLabel) && !isRelationshipSectionLabel(sectionLabel)
    }),
    rightSections: sections.filter((section) => {
      const sectionLabel = String(section?.label || section?.rawLabel || '').trim().toLowerCase()
      return sectionLabel === 'system' || isRelationshipSectionLabel(sectionLabel)
    }),
  }
}
