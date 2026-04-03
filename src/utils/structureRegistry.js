import canonicalStructure from '../../docs/canonical-structure.json'
import workbookSchemaCompanion from '../../docs/workbook-schema-companion.json'

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
  Funds: { key: 'funds', label: 'Funds', singularLabel: 'Fund', routeName: 'funds', path: '/funds', icon: 'account_balance', showInWorkspaceNav: false },
  Rounds: { key: 'rounds', label: 'Rounds', singularLabel: 'Round', routeName: 'rounds', path: '/rounds', icon: 'toll', showInWorkspaceNav: false },
  Projects: { key: 'projects', label: 'Projects', singularLabel: 'Project', routeName: 'projects', path: '/projects', icon: 'schema', showInWorkspaceNav: true },
  Tasks: { key: 'tasks', label: 'Tasks', singularLabel: 'Task', routeName: 'tasks', path: '/tasks', icon: 'check_circle', showInWorkspaceNav: true },
  Notes: { key: 'notes', label: 'Notes', singularLabel: 'Note', routeName: 'notes', path: '/notes', icon: 'note', showInWorkspaceNav: true },
})

const FILE_PAGE_ENTITY_ORDER = ['Users', 'Artifacts', 'Contacts', 'Companies', 'Funds', 'Rounds', 'Projects', 'Tasks', 'Notes']

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

function formatLabel(value) {
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

const canonicalEntitiesByName = Object.fromEntries((canonicalStructure?.entities || []).map((entity) => [entity.entity, entity]))
const companionEntitiesByName = Object.fromEntries((workbookSchemaCompanion?.entities || []).map((entity) => [entity.entity, entity]))

function buildEntityRegistry(entityName) {
  const meta = FILE_PAGE_ROUTE_META[entityName]
  if (!meta) return null

  const sourceEntity = canonicalEntitiesByName[entityName] || companionEntitiesByName[entityName]
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
        tokenType: String(token?.token_type || '').trim(),
        label: formatLabel(String(token?.token_name || '').trim().replace(`${meta.singularLabel}_`, '')),
      })),
    }))
    .sort((a, b) => Number(a.level_2 || 0) - Number(b.level_2 || 0))

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

export const TEST_SHELL_SECTION_OPTIONS = Object.freeze(
  LEVEL_1_FILE_REGISTRY.map((entry) => ({
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
