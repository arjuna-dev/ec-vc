export const CARD_KDB_RELATIONSHIP_DEFS = [
  { value: 'users', label: 'Users', icon: 'badge' },
  { value: 'artifacts', label: 'Artifacts', icon: 'attach_file' },
  { value: 'contacts', label: 'Contacts', icon: 'person' },
  { value: 'companies', label: 'Companies', icon: 'apartment' },
  { value: 'opportunities', label: 'Opportunities', icon: 'paid' },
  { value: 'projects', label: 'Projects', icon: 'workspaces' },
  { value: 'notes', label: 'Notes', icon: 'note' },
  { value: 'tasks', label: 'Tasks', icon: 'task_alt' },
]

const RELATIONSHIP_TARGET_PREFIXES = {
  users: ['User'],
  artifacts: ['Artifact'],
  contacts: ['Contact'],
  companies: ['Company'],
  opportunities: ['Opportunity', 'Fund', 'Round'],
  projects: ['Project'],
  notes: ['Note'],
  tasks: ['Task'],
}

const RELATIONSHIP_ID_KEYS = {
  users: ['user'],
  artifacts: ['artifact'],
  contacts: ['contact'],
  companies: ['company'],
  opportunities: ['opportunity', 'fund', 'round'],
  projects: ['project'],
  notes: ['note'],
  tasks: ['task'],
}

function splitRelationshipValues(value) {
  return String(value || '')
    .split('|')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function uniqueRelationshipValues(values) {
  return [...new Set(values.filter(Boolean))]
}

function getGenericRelationshipItems(row, sourcePrefixes, relationshipKey) {
  const targetPrefixes = RELATIONSHIP_TARGET_PREFIXES[relationshipKey] || []
  const relatedIdKeys = RELATIONSHIP_ID_KEYS[relationshipKey] || []
  const values = []

  for (const sourcePrefix of sourcePrefixes) {
    for (const targetPrefix of targetPrefixes) {
      values.push(...splitRelationshipValues(row?.[`${sourcePrefix}_${targetPrefix}`]))
    }
  }

  for (const relatedIdKey of relatedIdKeys) {
    values.push(...splitRelationshipValues(row?.[`related_${relatedIdKey}_ids`]))
  }

  return uniqueRelationshipValues(values).slice(0, 4)
}

export function buildCardRelationshipItems(row, sourcePrefixes, overrides = {}) {
  return CARD_KDB_RELATIONSHIP_DEFS.reduce((accumulator, definition) => {
    const override = overrides[definition.value]
    const values =
      typeof override === 'function'
        ? override(row)
        : getGenericRelationshipItems(row, sourcePrefixes, definition.value)

    accumulator[definition.value] = uniqueRelationshipValues(values || []).slice(0, 4)
    return accumulator
  }, {})
}

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
