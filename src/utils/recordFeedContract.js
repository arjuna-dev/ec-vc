export const RECORD_FEED_GROUP_OPTIONS = [
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'actions', label: 'Actions' },
]

export const RECORD_FEED_TAB_ORDER = [
  { id: 'events', label: 'Events' },
  { id: 'notes', label: 'Notes' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'intake', label: 'Intake' },
]

export function filterRecordFeedTabs(items = []) {
  const activeKeys = new Set(
    (Array.isArray(items) ? items : [])
      .map((item) => String(item?.feedKey || '').trim())
      .filter(Boolean),
  )
  return RECORD_FEED_TAB_ORDER.filter((tab) => activeKeys.has(tab.id))
}
