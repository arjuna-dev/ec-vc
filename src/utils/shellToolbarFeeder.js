function normalizeLabel(value = '') {
  return String(value || '').trim()
}

function normalizeLabelKey(value = '') {
  return normalizeLabel(value).toLowerCase()
}

function defaultGetGroupValue(section = {}) {
  return String(section?.key || '').trim()
}

function defaultGetGroupTitle(section = {}) {
  return normalizeLabel(section?.label || section?.title || section?.key)
}

export function createRelationshipLabelMatcher(relationshipLabels = ['ldb']) {
  const relationshipLabelSet = new Set(
    (Array.isArray(relationshipLabels) ? relationshipLabels : [])
      .map((value) => normalizeLabelKey(value))
      .filter(Boolean),
  )

  return (label = '') => relationshipLabelSet.has(normalizeLabelKey(label))
}

export function buildShellToolbarFeed({
  sections = [],
  governanceItems = [],
  relationshipLabels = ['ldb'],
  systemLabels = ['system'],
  groupBy = 'none',
  getGroupValue = defaultGetGroupValue,
  getGroupTitle = defaultGetGroupTitle,
} = {}) {
  const normalizedSections = Array.isArray(sections) ? sections.filter(Boolean) : []
  const isRelationshipSectionLabel = createRelationshipLabelMatcher(relationshipLabels)
  const systemLabelSet = new Set(
    (Array.isArray(systemLabels) ? systemLabels : [])
      .map((value) => normalizeLabelKey(value))
      .filter(Boolean),
  )

  const groupedSections = groupBy === 'display-group'
    ? normalizedSections.reduce((groups, section) => {
        const groupValue = normalizeLabel(getGroupValue(section))
        const groupTitle = normalizeLabel(getGroupTitle(section))
        if (!groupValue || !groupTitle) return groups

        const existing = groups.find((group) => group.value === groupValue)
        if (existing) {
          existing.sections.push(section)
          return groups
        }

        groups.push({
          value: groupValue,
          title: groupTitle,
          sections: [section],
        })
        return groups
      }, [])
    : normalizedSections
      .map((section) => {
        const value = normalizeLabel(section?.key || section?.value)
        const title = normalizeLabel(section?.label || section?.title || section?.key)
        if (!value || !title) return null
        return {
          value,
          title,
          sections: [section],
        }
      })
      .filter(Boolean)

  const leftItems = []
  const rightItems = []

  groupedSections.forEach((group) => {
    const sectionLabels = (Array.isArray(group.sections) ? group.sections : [])
      .map((section) => normalizeLabel(section?.label || section?.title || section?.key))
      .filter(Boolean)

    const isStructural = sectionLabels.some((label) => (
      isRelationshipSectionLabel(label) || systemLabelSet.has(normalizeLabelKey(label))
    ))

    const item = {
      value: group.value,
      title: group.title,
      sections: group.sections,
    }

    if (isStructural) rightItems.push(item)
    else leftItems.push(item)
  })

  return {
    leftItems,
    rightItems,
    governanceItems: (Array.isArray(governanceItems) ? governanceItems : []).map((item) => ({
      value: normalizeLabel(item?.value || item?.key),
      title: normalizeLabel(item?.title || item?.label),
    })).filter((item) => item.value && item.title),
    isRelationshipSectionLabel,
  }
}
