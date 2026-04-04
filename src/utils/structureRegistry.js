import canonicalStructure from '../../docs/canonical-structure.json'

const FILE_PAGE_ROUTE_META = Object.freeze({
  Users: { key: 'users', label: 'Users', singularLabel: 'User', routeName: 'users', path: '/users', icon: 'badge', showInWorkspaceNav: true },
  Artifacts: {
    key: 'artifacts',
    label: 'Artifacts',
    singularLabel: 'Artifact',
    routeName: 'artifacts',
    path: '/artifacts',
    icon: 'attach_file',
    showInWorkspaceNav: true,
  },
  Contacts: { key: 'contacts', label: 'Contacts', singularLabel: 'Contact', routeName: 'contacts', path: '/contacts', icon: 'people', showInWorkspaceNav: true },
  Companies: {
    key: 'companies',
    label: 'Companies',
    singularLabel: 'Company',
    routeName: 'companies',
    path: '/companies',
    icon: 'apartment',
    showInWorkspaceNav: true,
  },
  Opportunities: {
    key: 'opportunities',
    label: 'Opportunities',
    singularLabel: 'Opportunity',
    createBranchLabel: 'Opportunity Type',
    routeName: 'opportunities',
    path: '/opportunities',
    icon: 'work',
    showInWorkspaceNav: false,
    relationshipSourcePrefixes: ['Opportunity', 'Fund', 'Round'],
    createBranches: [
      { value: 'fund', label: 'Fund', icon: 'account_balance_wallet' },
      { value: 'round', label: 'Round', icon: 'donut_large' },
    ],
  },
  Funds: { key: 'funds', label: 'Funds', singularLabel: 'Fund', routeName: 'funds', path: '/funds', icon: 'account_balance', showInWorkspaceNav: false },
  Rounds: { key: 'rounds', label: 'Rounds', singularLabel: 'Round', routeName: 'rounds', path: '/rounds', icon: 'toll', showInWorkspaceNav: false },
  Projects: { key: 'projects', label: 'Projects', singularLabel: 'Project', routeName: 'projects', path: '/projects', icon: 'schema', showInWorkspaceNav: true },
  Tasks: { key: 'tasks', label: 'Tasks', singularLabel: 'Task', routeName: 'tasks', path: '/tasks', icon: 'check_circle', showInWorkspaceNav: true },
  Notes: { key: 'notes', label: 'Notes', singularLabel: 'Note', routeName: 'notes', path: '/notes', icon: 'note', showInWorkspaceNav: true },
  Roles: {
    key: 'assistants',
    label: 'Roles',
    singularLabel: 'Role',
    routeName: 'assistants',
    path: '/assistants',
    icon: 'theater_comedy',
    showInWorkspaceNav: true,
  },
  Financial_Industries: {
    key: 'industries',
    label: 'Markets',
    singularLabel: 'Market',
    routeName: 'industries',
    path: '/industries',
    icon: 'category',
    showInWorkspaceNav: false,
  },
  Round_Securities: {
    key: 'securities',
    label: 'Securities',
    singularLabel: 'Security',
    routeName: 'securities',
    path: '/securities',
    icon: 'receipt_long',
    showInWorkspaceNav: false,
  },
  Artifacts_Processed: {
    key: 'artifacts-processed',
    label: 'Ingestion',
    singularLabel: 'Ingestion',
    routeName: 'artifacts-processed',
    path: '/artifacts-processed',
    icon: 'hub',
    showInWorkspaceNav: false,
  },
})

const FILE_PAGE_ENTITY_ORDER = ['Users', 'Artifacts', 'Contacts', 'Companies', 'Opportunities', 'Funds', 'Rounds', 'Projects', 'Tasks', 'Notes', 'Roles', 'Financial_Industries', 'Round_Securities', 'Artifacts_Processed']

function normalizeSubsections(entity) {
  const subsections = entity?.subsections
  if (Array.isArray(subsections)) return subsections
  if (subsections && typeof subsections === 'object') return Object.values(subsections)
  return []
}

function resolveAddressPart(address, index) {
  return String(address || '')
    .split('.')
    .map((part) => String(part || '').trim())
    .filter(Boolean)[index] || ''
}

function normalizeTokens(subsection) {
  const tokens = Array.isArray(subsection?.tokens) ? subsection.tokens : []
  return tokens
    .filter((token) => {
      const level = String(token?.level_3 ?? token?.level ?? '').trim()
      return level !== '0' && level !== '2'
    })
    .map((token, index) => ({
      ...token,
      level_3: String(token?.level_3 || resolveAddressPart(token?.address, 2) || index + 1),
    }))
}

function normalizeDbFieldAliases(token) {
  const aliases = Array.isArray(token?.db_field_aliases) ? token.db_field_aliases : []
  return aliases
    .map((alias) => String(alias || '').trim())
    .filter(Boolean)
}

function normalizeOptionItems(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (item && typeof item === 'object') {
        const label = String(item.label ?? item.value ?? '').trim()
        const value = item.value ?? label
        if (!label) return null
        return { label, value }
      }
      const value = String(item || '').trim()
      if (!value) return null
      return { label: value, value }
    })
    .filter(Boolean)
}

function formatLabel(value) {
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function getSubsectionDisplayRank(subsection) {
  const rawLabel = String(subsection?.rawLabel || subsection?.label || '').trim().toLowerCase()
  if (rawLabel === 'kdb') return 998
  if (rawLabel === 'system') return 999
  return Number(subsection?.level_2 || 0)
}

function compareSubsectionDisplayOrder(a, b) {
  const rankDifference = getSubsectionDisplayRank(a) - getSubsectionDisplayRank(b)
  if (rankDifference !== 0) return rankDifference
  return Number(a?.level_2 || 0) - Number(b?.level_2 || 0)
}

const canonicalEntitiesByName = Object.fromEntries((canonicalStructure?.entities || []).map((entity) => [entity.entity, entity]))
export const CANONICAL_OPTION_LISTS = Object.freeze(
  Object.fromEntries(
    Object.entries(canonicalStructure?.option_lists || {}).map(([listName, items]) => [listName, normalizeOptionItems(items)]),
  ),
)

function buildEntityRegistry(entityName) {
  const meta = FILE_PAGE_ROUTE_META[entityName]
  if (!meta) return null

  const sourceEntity = canonicalEntitiesByName[entityName]
  if (!sourceEntity) return null

  const subsections = normalizeSubsections(sourceEntity)
    .map((subsection) => ({
      key: String(subsection?.structure_token || subsection?.subsection || '').trim() || `${entityName}_${subsection?.level_2 || ''}`,
      level_2: String(subsection?.level_2 || resolveAddressPart(subsection?.subsection_address, 1) || '').trim(),
      address: String(subsection?.subsection_address || '').trim(),
      label: formatLabel(subsection?.subsection),
      rawLabel: String(subsection?.subsection || '').trim(),
      structureToken: String(subsection?.structure_token || '').trim(),
      tokens: normalizeTokens(subsection).map((token) => ({
        key: String(token?.token_name || token?.address || '').trim(),
        level_3: String(token?.level_3 || '').trim(),
        address: String(token?.address || '').trim(),
        tokenName: String(token?.token_name || '').trim(),
        dbFieldAliases: normalizeDbFieldAliases(token),
        tokenType: String(token?.token_type || '').trim(),
        inputSource: String(token?.input_source || '').trim(),
        optionSource: String(token?.option_source || '').trim(),
        optionList: String(token?.option_list || '').trim(),
        optionEntity: String(token?.option_entity || '').trim(),
        optionEntities: Array.isArray(token?.option_entities)
          ? token.option_entities.map((value) => String(value || '').trim()).filter(Boolean)
          : [],
        optionSubset: token?.option_subset && typeof token.option_subset === 'object' ? { ...token.option_subset } : null,
        subsetEntity: String(token?.subset_entity || '').trim(),
        subsetShape: Array.isArray(token?.subset_shape)
          ? token.subset_shape.map((value) => String(value || '').trim()).filter(Boolean)
          : [],
        label: formatLabel(String(token?.token_name || '').trim().replace(`${meta.singularLabel}_`, '')),
      })),
    }))
    .sort(compareSubsectionDisplayOrder)

  return {
    ...meta,
    entityName,
    level_1: String(sourceEntity?.level_1 || resolveAddressPart(sourceEntity?.entity_address, 0) || '').trim(),
    address: String(sourceEntity?.entity_address || '').trim(),
    structureToken: String(sourceEntity?.structure_token?.token_name || sourceEntity?.structure_token || '').trim(),
    subsections,
  }
}

export const FILE_PAGE_REGISTRY = Object.freeze(
  FILE_PAGE_ENTITY_ORDER.map((entityName) => buildEntityRegistry(entityName)).filter(Boolean),
)

export const FILE_PAGE_REGISTRY_BY_KEY = Object.freeze(
  Object.fromEntries(FILE_PAGE_REGISTRY.map((entry) => [entry.key, entry])),
)

export const LEVEL_1_FILE_REGISTRY = Object.freeze(
  FILE_PAGE_REGISTRY.map((entry) => ({
    key: entry.key,
    entityName: entry.entityName,
    label: entry.label,
    singularLabel: entry.singularLabel,
    level_1: entry.level_1,
    address: entry.address,
    structureToken: entry.structureToken,
    routeName: entry.routeName,
    path: entry.path,
    icon: entry.icon,
    relationshipSourcePrefixes: Array.isArray(entry.relationshipSourcePrefixes) ? entry.relationshipSourcePrefixes : [],
  })),
)

export const LEVEL_2_FILE_REGISTRY_BY_KEY = Object.freeze(
  Object.fromEntries(
    FILE_PAGE_REGISTRY.map((entry) => [
      entry.key,
      entry.subsections.map((subsection) => ({
        key: subsection.key,
        level_2: subsection.level_2,
        address: subsection.address,
        label: subsection.label,
        rawLabel: subsection.rawLabel,
        structureToken: subsection.structureToken,
      })),
    ]),
  ),
)

export const LEVEL_3_FILE_REGISTRY_BY_KEY = Object.freeze(
  Object.fromEntries(
    FILE_PAGE_REGISTRY.map((entry) => [
      entry.key,
      entry.subsections.flatMap((subsection) =>
        subsection.tokens.map((token) => ({
          ...token,
          parentKey: subsection.key,
          parentLabel: subsection.label,
          parentLevel_2: subsection.level_2,
        })),
      ),
    ]),
  ),
)

const TEST_SHELL_RENDERABLE_KEYS = ['users', 'artifacts', 'contacts', 'companies', 'opportunities', 'projects', 'notes', 'tasks', 'assistants', 'industries', 'securities', 'artifacts-processed']

export const TEST_SHELL_SECTION_OPTIONS = Object.freeze(
  LEVEL_1_FILE_REGISTRY.filter((entry) => TEST_SHELL_RENDERABLE_KEYS.includes(entry.key)).map((entry) => ({
    label: entry.label,
    value: entry.key,
  })),
)

export const WORKSPACE_FILE_NAV_ITEMS = Object.freeze(
  FILE_PAGE_REGISTRY.filter((entry) => entry.showInWorkspaceNav).map((entry) => ({
    label: entry.label,
    to: entry.path,
    exact: true,
    icon: entry.icon,
  })),
)

export function getFilePageRegistryEntry(key) {
  return FILE_PAGE_REGISTRY_BY_KEY[String(key || '').trim().toLowerCase()] || null
}

export function getCanonicalTokenFieldNames(token = {}) {
  return Array.from(
    new Set(
      [token.tokenName, ...(Array.isArray(token.dbFieldAliases) ? token.dbFieldAliases : [])]
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  )
}

export function getCanonicalTokenValue(row = {}, token = {}) {
  const fieldNames = getCanonicalTokenFieldNames(token)
  for (const fieldName of fieldNames) {
    const value = row?.[fieldName]
    if (value != null && !(typeof value === 'string' && !value.trim())) return value
  }
  return null
}
