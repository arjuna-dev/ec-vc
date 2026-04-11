export const RECORD_FEED_GROUP_OPTIONS = [
  { id: 'lifecycle', label: 'Lifecycle' },
  { id: 'actions', label: 'Actions' },
]

export const RECORD_FEED_TAB_ORDER = [
  { id: 'events', label: 'History' },
  { id: 'notes', label: 'Notes' },
  { id: 'artifacts', label: 'Artifacts' },
  { id: 'intake', label: 'Intake' },
]

export function filterRecordFeedTabs() {
  return RECORD_FEED_TAB_ORDER
}
