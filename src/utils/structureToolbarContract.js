export function buildStructureToolbarItems({
  leftItems = [],
  rightItems = [],
  governanceItems = [],
  isRelationshipSectionLabel = () => false,
} = {}) {
  const structuralTonePriority = Object.freeze({
    ldb: 0,
    system: 1,
    structural: 2,
  })

  const normalizedLeftItems = (Array.isArray(leftItems) ? leftItems : []).map((item) => ({
    value: String(item?.value || item?.key || '').trim(),
    title: String(item?.title || item?.label || '').trim(),
    lane: 'left',
    tone: 'default',
  })).filter((item) => item.value && item.title)

  const normalizedRightItems = (Array.isArray(rightItems) ? rightItems : [])
    .map((item) => {
      const sectionLabels = Array.isArray(item?.sections)
        ? item.sections.map((section) => String(section?.label || section?.rawLabel || '').trim().toLowerCase()).filter(Boolean)
        : [String(item?.label || item?.rawLabel || item?.title || '').trim().toLowerCase()].filter(Boolean)

      return {
        value: String(item?.value || item?.key || '').trim(),
        title: String(item?.title || item?.label || '').trim(),
        lane: 'structural',
        tone: sectionLabels.some((label) => isRelationshipSectionLabel(label))
          ? 'ldb'
          : sectionLabels.includes('system')
            ? 'system'
            : 'structural',
      }
    })
    .filter((item) => item.value && item.title)
    .sort((leftItem, rightItem) => {
      const leftPriority = structuralTonePriority[leftItem.tone] ?? 99
      const rightPriority = structuralTonePriority[rightItem.tone] ?? 99
      if (leftPriority !== rightPriority) return leftPriority - rightPriority
      return leftItem.title.localeCompare(rightItem.title)
    })

  const normalizedGovernanceItems = (Array.isArray(governanceItems) ? governanceItems : []).map((item) => ({
    value: String(item?.value || item?.key || '').trim(),
    title: String(item?.title || item?.label || '').trim(),
    lane: 'governance',
    tone: 'governance',
  })).filter((item) => item.value && item.title)

  return [
    ...normalizedLeftItems,
    ...normalizedRightItems,
    ...normalizedGovernanceItems,
  ]
}
