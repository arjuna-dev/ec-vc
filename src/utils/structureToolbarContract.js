export function buildStructureToolbarItems({
  leftItems = [],
  rightItems = [],
  governanceItems = [],
  isRelationshipSectionLabel = () => false,
} = {}) {
  const normalizedLeftItems = (Array.isArray(leftItems) ? leftItems : []).map((item) => ({
    value: String(item?.value || item?.key || '').trim(),
    title: String(item?.title || item?.label || '').trim(),
    lane: 'left',
    tone: 'default',
    isKdb: false,
    isSystem: false,
    isGovernance: false,
    pushRight: false,
  })).filter((item) => item.value && item.title)

  const normalizedRightItems = (Array.isArray(rightItems) ? rightItems : []).map((item, index) => {
    const sectionLabels = Array.isArray(item?.sections)
      ? item.sections.map((section) => String(section?.rawLabel || section?.label || '').trim().toLowerCase()).filter(Boolean)
      : [String(item?.rawLabel || item?.label || item?.title || '').trim().toLowerCase()].filter(Boolean)

    return {
      value: String(item?.value || item?.key || '').trim(),
      title: String(item?.title || item?.label || '').trim(),
      lane: 'structural',
      tone: sectionLabels.some((label) => isRelationshipSectionLabel(label))
        ? 'ldb'
        : sectionLabels.includes('system')
          ? 'system'
          : 'structural',
      isKdb: sectionLabels.some((label) => isRelationshipSectionLabel(label)),
      isSystem: sectionLabels.includes('system'),
      isGovernance: false,
      pushRight: index === 0,
    }
  }).filter((item) => item.value && item.title)

  const normalizedGovernanceItems = (Array.isArray(governanceItems) ? governanceItems : []).map((item) => ({
    value: String(item?.value || item?.key || '').trim(),
    title: String(item?.title || item?.label || '').trim(),
    lane: 'governance',
    tone: 'governance',
    isKdb: false,
    isSystem: false,
    isGovernance: true,
    pushRight: true,
  })).filter((item) => item.value && item.title)

  return [
    ...normalizedLeftItems,
    ...normalizedRightItems,
    ...normalizedGovernanceItems,
  ]
}
