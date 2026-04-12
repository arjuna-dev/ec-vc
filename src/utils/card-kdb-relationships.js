export const CARD_KDB_RELATIONSHIP_DEFS = [
  { value: 'users', label: 'Users', icon: 'badge' },
  { value: 'artifacts', label: 'Artifacts', icon: 'attach_file' },
  { value: 'contacts', label: 'Contacts', icon: 'person' },
  { value: 'companies', label: 'Companies', icon: 'apartment' },
  { value: 'opportunities', label: 'Opportunities', icon: 'paid' },
  { value: 'projects', label: 'Projects', icon: 'workspaces' },
  { value: 'tasks', label: 'Tasks', icon: 'task_alt' },
  { value: 'notes', label: 'Notes', icon: 'note' },
  { value: 'events', label: 'History', icon: 'event' },
]

export function buildCardRelationshipOptions() {
  return CARD_KDB_RELATIONSHIP_DEFS.map((definition) => ({
    value: definition.value,
    icon: definition.icon,
    attrs: {
      class: 'ec-card-kdb-option',
      'aria-label': definition.label,
      'data-tooltip': definition.label,
    },
  }))
}

export function resolveCardRelationshipPanel(storedValue, itemsByType) {
  if (CARD_KDB_RELATIONSHIP_DEFS.some((definition) => definition.value === storedValue)) return storedValue
  return CARD_KDB_RELATIONSHIP_DEFS.find((definition) => (itemsByType?.[definition.value] || []).length)?.value || CARD_KDB_RELATIONSHIP_DEFS[0]?.value || ''
}

export function getCardRelationshipLabel(relationshipKey) {
  return CARD_KDB_RELATIONSHIP_DEFS.find((definition) => definition.value === relationshipKey)?.label || 'Relationship'
}
