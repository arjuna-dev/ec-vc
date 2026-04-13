export function getDialogViewGroupValue(view) {
  const displayGroup = String(view?.displayGroup || '').trim()
  return displayGroup ? `group:${displayGroup}` : String(view?.key || '').trim()
}

function isRelationshipSectionLabel(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'ldb'
}

export function groupDialogViews(views = []) {
  const groups = []
  for (const view of Array.isArray(views) ? views : []) {
    const value = getDialogViewGroupValue(view)
    const existing = groups.find((group) => group.value === value)
    if (existing) {
      existing.views.push(view)
      continue
    }
    groups.push({
      value,
      title: String(view?.subgroupLabel || view?.displayGroup || view?.label || '').trim(),
      views: [view],
    })
  }
  return groups
}

export function buildDialogViews({
  groupedViews = [],
  tokenFilter = () => true,
  mapToken = (token) => token,
  keepEmptySections = false,
} = {}) {
  return (Array.isArray(groupedViews) ? groupedViews : [])
    .map((group) => {
      const subgroupViews = (Array.isArray(group?.views) ? group.views : [])
        .map((view) => ({
          key: view.key,
          label: view.label,
          tokens: tokenFilter(view).map((token) => mapToken(token)),
        }))
        .filter((view) => keepEmptySections || view.tokens.length)

      const flatTokens = subgroupViews.flatMap((view) => view.tokens)
      return {
        key: group.value,
        label: group.title,
        tokens: flatTokens,
        subgroups: [],
      }
    })
    .filter((group) => keepEmptySections || group.tokens.length)
}

export function splitDialogViews(viewGroups = []) {
  const views = Array.isArray(viewGroups) ? viewGroups : []
  return {
    leftSections: views.filter((view) => {
      const viewLabel = String(view?.label || '').trim().toLowerCase()
      return ![ 'system' ].includes(viewLabel) && !isRelationshipSectionLabel(viewLabel)
    }),
    rightSections: views.filter((view) => {
      const viewLabel = String(view?.label || '').trim().toLowerCase()
      return viewLabel === 'system' || isRelationshipSectionLabel(viewLabel)
    }),
  }
}
