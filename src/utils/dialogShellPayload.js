export function getDialogSectionGroupValue(section) {
  const displayGroup = String(section?.displayGroup || '').trim()
  return displayGroup ? `group:${displayGroup}` : String(section?.key || '').trim()
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

      return {
        key: group.value,
        label: group.title,
        tokens: subsectionGroups.flatMap((section) => section.tokens),
        subgroups: subsectionGroups.length > 1 ? subsectionGroups : [],
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
