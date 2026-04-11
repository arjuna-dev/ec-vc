import canonicalStructure from '../shared/canonicalStructure.js'
import { formatSharedDisplayLabel } from '../shared/labelFormatting.js'

export const DEFAULT_L1_REQUIRED_SUBSECTIONS = Object.freeze(['System', 'KDB'])
export const DEFAULT_L1_OPTIONAL_STANDARD_SUBSECTIONS = Object.freeze(['General'])
export const DEFAULT_L1_REQUIRED_RUNTIME_CAPABILITIES = Object.freeze(['list', 'create', 'delete'])

const FILE_PAGE_ROUTE_META = Object.freeze({
  Building_Blocks: {
    key: 'bb-file',
    label: 'BB Shell',
    singularLabel: 'Building Block',
    routeName: 'bb-file',
    path: '/bb-file',
    icon: 'dashboard_customize',
    showInWorkspaceNav: false,
    shellGroup: 'system_level',
    fileGuidePath: 'docs/100/Draft/100-BB_Shell.md',
    primaryStewardDoc: {
      id: 'design-steward',
      label: 'Design Steward',
      caption: 'docs/020/Active/020_Design_Steward.md',
      path: 'docs/020/Active/020_Design_Steward.md',
      icon: 'description',
    },
    requiredSubsections: ['General', 'Usage', 'Anatomy', 'Source', 'Reconstruction', 'Variants'],
    optionalStandardSubsections: [],
    requiredRuntimeCapabilities: ['list', 'create', 'delete'],
    requiresReciprocalKdb: false,
    level_1: 'BB',
    address: 'BB.0.0',
    structureToken: 'Building_Blocks_File',
    customSubsections: [
      {
        subsection: 'General',
        subsection_address: 'BB.1.0',
        structure_token: 'Building_Blocks_General',
        tokens: [
          { level_3: '1', address: 'BB.1.1', token_name: 'BB_Name', label: 'Name', db_field_aliases: ['Name'] },
          { level_3: '2', address: 'BB.1.2', token_name: 'BB_Summary', label: 'Summary', db_field_aliases: ['Summary'] },
          { level_3: '3', address: 'BB.1.3', token_name: 'BB_Category', label: 'Category', db_field_aliases: ['Category'] },
          { level_3: '4', address: 'BB.1.4', token_name: 'BB_Status', label: 'Status', db_field_aliases: ['Status'] },
        ],
      },
      {
        subsection: 'Usage',
        subsection_address: 'BB.2.0',
        structure_token: 'Building_Blocks_Usage',
        tokens: [
          { level_3: '1', address: 'BB.2.1', token_name: 'BB_Used_In', label: 'Used In', db_field_aliases: ['Used_In'] },
          { level_3: '2', address: 'BB.2.2', token_name: 'BB_Used_In_Shells', label: 'Used In Shells', db_field_aliases: ['Used_In_Shells'] },
          { level_3: '3', address: 'BB.2.3', token_name: 'BB_Use_When', label: 'Use When', db_field_aliases: ['Use_When'] },
          { level_3: '4', address: 'BB.2.4', token_name: 'BB_Avoid_When', label: 'Avoid When', db_field_aliases: ['Avoid_When'] },
        ],
      },
      {
        subsection: 'Anatomy',
        subsection_address: 'BB.3.0',
        structure_token: 'Building_Blocks_Anatomy',
        tokens: [
          { level_3: '1', address: 'BB.3.1', token_name: 'BB_Anatomy', label: 'Anatomy', db_field_aliases: ['Anatomy'] },
          { level_3: '2', address: 'BB.3.2', token_name: 'BB_Required_Parts', label: 'Required Parts', db_field_aliases: ['Required_Parts'] },
          { level_3: '3', address: 'BB.3.3', token_name: 'BB_Built_From_BBs', label: 'Built From BBs', db_field_aliases: ['Built_From_BBs'] },
        ],
      },
      {
        subsection: 'Source',
        subsection_address: 'BB.4.0',
        structure_token: 'Building_Blocks_Source',
        tokens: [
          { level_3: '1', address: 'BB.4.1', token_name: 'BB_Source_Path', label: 'Source Path', db_field_aliases: ['Source_Path'] },
          { level_3: '2', address: 'BB.4.2', token_name: 'BB_Owner', label: 'Owner', db_field_aliases: ['Owner'] },
          { level_3: '3', address: 'BB.4.3', token_name: 'BB_Extraction_Status', label: 'Extraction Status', db_field_aliases: ['Extraction_Status'] },
        ],
      },
      {
        subsection: 'Reconstruction',
        subsection_address: 'BB.5.0',
        structure_token: 'Building_Blocks_Reconstruction',
        tokens: [
          { level_3: '1', address: 'BB.5.1', token_name: 'BB_Reconstruction_Notes', label: 'Reconstruction Notes', db_field_aliases: ['Reconstruction_Notes'] },
          { level_3: '2', address: 'BB.5.2', token_name: 'BB_Convergence_Rule', label: 'Convergence Rule', db_field_aliases: ['Convergence_Rule'] },
          { level_3: '3', address: 'BB.5.3', token_name: 'BB_Prompt', label: 'Prompt', db_field_aliases: ['Prompt'] },
        ],
      },
      {
        subsection: 'Variants',
        subsection_address: 'BB.6.0',
        structure_token: 'Building_Blocks_Variants',
        tokens: [
          { level_3: '1', address: 'BB.6.1', token_name: 'BB_Variants', label: 'Variants', db_field_aliases: ['Variants'] },
        ],
      },
    ],
  },
  Events: {
    key: 'events',
    label: 'History',
    singularLabel: 'History Entry',
    routeName: 'history',
    path: '/history',
    icon: 'history',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'files',
    shellGroup: 'knowledge_db',
    fileGuidePath: 'docs/100/Draft/100-Events.md',
    primaryStewardDoc: {
      id: 'provenance-steward',
      label: 'Provenance Steward',
      caption: 'docs/020/Active/020_Provenance_Steward.md',
      path: 'docs/020/Active/020_Provenance_Steward.md',
      icon: 'description',
    },
  },
  Files: {
    key: 'file-system',
    label: 'System Files',
    singularLabel: 'File',
    routeName: 'file-system',
    path: '/file-system',
    icon: 'folder_open',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'files',
    shellGroup: 'system_level',
    fileGuidePath: 'docs/100/Active/100-System_Files.md',
    birthDefaults: {
      File_Owner: 'Owner',
      File_Steward: 'File Steward',
      Ownership_Mode: 'root_owned',
    },
    extraReferenceDocs: [
      {
        id: 'open-issues',
        label: 'Open Issues',
        caption: 'docs/100/Active/100-System_Files_Open_Issues.md',
        path: 'docs/100/Active/100-System_Files_Open_Issues.md',
        icon: 'description',
      },
    ],
  },
  Users: { key: 'users', label: 'Users', singularLabel: 'User', routeName: 'users', path: '/users', icon: 'badge', showInWorkspaceNav: true, workspaceNavGroup: 'files', shellGroup: 'first_order', fileGuidePath: 'docs/100/Draft/100-Users.md' },
  Artifacts: {
    key: 'artifacts',
    label: 'Artifacts',
    singularLabel: 'Artifact',
    routeName: 'artifacts',
    path: '/artifacts',
    icon: 'attach_file',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'files',
    shellGroup: 'first_order',
    fileGuidePath: 'docs/100/Draft/100-Artifacts.md',
    primaryStewardDoc: {
      id: 'provenance-steward',
      label: 'Provenance Steward',
      caption: 'docs/020/Active/020_Provenance_Steward.md',
      path: 'docs/020/Active/020_Provenance_Steward.md',
      icon: 'description',
    },
  },
  Contacts: { key: 'contacts', label: 'Contacts', singularLabel: 'Contact', routeName: 'contacts', path: '/contacts', icon: 'people', showInWorkspaceNav: true, workspaceNavGroup: 'files', shellGroup: 'first_order', fileGuidePath: 'docs/100/Draft/100-Contacts.md' },
  Companies: {
    key: 'companies',
    label: 'Companies',
    singularLabel: 'Company',
    routeName: 'companies',
    path: '/companies',
    icon: 'apartment',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'files',
    shellGroup: 'first_order',
    fileGuidePath: 'docs/100/Draft/100-Companies.md',
    viewForks: [
      {
        value: 'overview',
        label: 'Overview',
        sectionRawLabels: ['Operations', 'Business', 'Market', 'Results'],
      },
      {
        value: 'operations',
        label: 'Operations',
        sectionRawLabels: ['Operations'],
      },
      {
        value: 'business',
        label: 'Business',
        sectionRawLabels: ['Business'],
      },
      {
        value: 'market',
        label: 'Market',
        sectionRawLabels: ['Market'],
      },
      {
        value: 'results',
        label: 'Results',
        sectionRawLabels: ['Results'],
      },
      {
        value: 'business-plan',
        label: 'Business Plan',
        sectionRawLabels: ['Business_Plan'],
      },
      {
        value: 'capital-structure',
        label: 'Capital Structure',
        sectionRawLabels: ['Capital_Structure'],
      },
    ],
  },
  Opportunities: {
    key: 'opportunities',
    label: 'Opportunities',
    singularLabel: 'Opportunity',
    createBranchLabel: 'Opportunity Type',
    createBranchTokenName: 'Opportunity_Kind',
    routeName: 'opportunities',
    path: '/opportunities',
    icon: 'work',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'files',
    relationshipSourcePrefixes: ['Opportunity', 'Fund', 'Round'],
    shellGroup: 'first_order',
    fileGuidePath: 'docs/100/Draft/100-Opportunities.md',
    createBranches: [
      { value: 'fund', label: 'Fund', icon: 'account_balance_wallet', targetSourceKey: 'funds' },
      { value: 'round', label: 'Round', icon: 'donut_large', targetSourceKey: 'rounds' },
    ],
  },
  Funds: { key: 'funds', label: 'Funds', singularLabel: 'Fund', routeName: 'funds', path: '/funds', icon: 'account_balance', showInWorkspaceNav: false, shellGroup: 'first_order', fileGuidePath: 'docs/100/Draft/100-Funds.md' },
  Rounds: { key: 'rounds', label: 'Rounds', singularLabel: 'Round', routeName: 'rounds', path: '/rounds', icon: 'toll', showInWorkspaceNav: false, shellGroup: 'first_order', fileGuidePath: 'docs/100/Draft/100-Rounds.md' },
  Projects: { key: 'projects', label: 'Projects', singularLabel: 'Project', routeName: 'projects', path: '/projects', icon: 'schema', showInWorkspaceNav: true, workspaceNavGroup: 'files', shellGroup: 'first_order', fileGuidePath: 'docs/100/Draft/100-Projects.md' },
  Tasks: {
    key: 'tasks',
    label: 'Tasks',
    singularLabel: 'Task',
    routeName: 'tasks',
    path: '/tasks',
    icon: 'check_circle',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'files',
    shellGroup: 'first_order',
    fileGuidePath: 'docs/100/Draft/100-Tasks.md',
    tokenOverrides: {
      Task_Team_Owner: { option_entity: 'Contacts' },
      Task_Team_Assigned: { option_entity: 'Contacts' },
      Task_Team_Support: { option_entity: 'Contacts' },
    },
  },
  Notes: { key: 'notes', label: 'Notes', singularLabel: 'Note', routeName: 'notes', path: '/notes', icon: 'note', showInWorkspaceNav: true, workspaceNavGroup: 'files', shellGroup: 'first_order', fileGuidePath: 'docs/100/Draft/100-Notes.md' },
  Roles: {
    key: 'user-roles',
    label: 'User Roles',
    singularLabel: 'User Role',
    routeName: 'user-roles',
    path: '/user-roles',
    icon: 'theater_comedy',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'local-dbs',
    shellGroup: 'knowledge_db',
    runtimeEntityName: 'Roles',
    fileGuidePath: 'docs/100/Draft/100-User_Roles.md',
  },
  Companion_Roles: {
    key: 'companion-roles',
    label: 'Companion Roles',
    singularLabel: 'Companion Role',
    routeName: 'companion-roles',
    path: '/companion-roles',
    icon: 'smart_toy',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'local-dbs',
    shellGroup: 'knowledge_db',
    runtimeEntityName: 'Companion_Roles',
    fileGuidePath: 'docs/100/Draft/100-Companion_Roles.md',
  },
  Markets: {
    key: 'markets',
    label: 'Markets',
    singularLabel: 'Market',
    routeName: 'markets',
    path: '/markets',
    icon: 'category',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'local-dbs',
    shellGroup: 'knowledge_db',
    fileGuidePath: 'docs/100/Draft/100-Markets.md',
    primaryStewardDoc: {
      id: 'glossary-steward',
      label: 'Glossary Steward',
      caption: 'docs/020/Active/020_Glossary_Steward.md',
      path: 'docs/020/Active/020_Glossary_Steward.md',
      icon: 'description',
    },
  },
  Securities: {
    key: 'securities',
    label: 'Securities',
    singularLabel: 'Security',
    routeName: 'securities',
    path: '/securities',
    icon: 'receipt_long',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'local-dbs',
    shellGroup: 'knowledge_db',
    fileGuidePath: 'docs/100/Draft/100-Securities.md',
    primaryStewardDoc: {
      id: 'glossary-steward',
      label: 'Glossary Steward',
      caption: 'docs/020/Active/020_Glossary_Steward.md',
      path: 'docs/020/Active/020_Glossary_Steward.md',
      icon: 'description',
    },
  },
  Intake: {
    key: 'intake',
    label: 'Intake',
    singularLabel: 'Intake',
    routeName: 'intake',
    path: '/intake',
    icon: 'hub',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'local-dbs',
    shellGroup: 'knowledge_db',
    runtimeEntityName: 'Intake',
    fileGuidePath: 'docs/100/Draft/100-Intake.md',
  },
})

const FILE_PAGE_ENTITY_ORDER = [
  'Files',
  'Building_Blocks',
  'Events',
  'Users',
  'Contacts',
  'Roles',
  'Companion_Roles',
  'Projects',
  'Tasks',
  'Notes',
  'Artifacts',
  'Intake',
  'Companies',
  'Opportunities',
  'Funds',
  'Rounds',
  'Markets',
  'Securities',
]

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
      return level !== '0'
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

function normalizeReferenceDoc(doc = {}) {
  const id = String(doc?.id || '').trim()
  const label = String(doc?.label || '').trim()
  const path = String(doc?.path || '').trim()
  if (!id || !label || !path) return null
  return {
    id,
    label,
    caption: String(doc?.caption || path).trim(),
    path,
    icon: String(doc?.icon || 'description').trim() || 'description',
  }
}

function formatLabel(value) {
  return formatSharedDisplayLabel(value)
}

function formatSubsectionLabel(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'kdb') return 'LDB'
  return formatLabel(value)
}

function stripTokenEntityPrefix(tokenName = '', prefixes = []) {
  const rawTokenName = String(tokenName || '').trim()
  if (!rawTokenName) return ''

  const normalizedPrefixes = (Array.isArray(prefixes) ? prefixes : [])
    .map((prefix) => String(prefix || '').trim())
    .filter(Boolean)

  for (const prefix of normalizedPrefixes) {
    const candidate = `${prefix}_`
    if (rawTokenName.startsWith(candidate)) return rawTokenName.slice(candidate.length)
  }

  return rawTokenName
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

  const canonicalEntityName = String(meta.canonicalEntityName || entityName).trim()
  const runtimeEntityName = String(meta.runtimeEntityName || entityName).trim()
  const sourceEntity = canonicalEntitiesByName[canonicalEntityName]
  const customSubsections = Array.isArray(meta.customSubsections) ? meta.customSubsections : null
  if (!sourceEntity && !customSubsections) return null
  const entityTokenPrefixes = [
    String(sourceEntity?.structure_token?.token_name || '').trim(),
    String(meta.singularLabel || '').trim().replace(/\s+/g, '_'),
    canonicalEntityName.endsWith('s') ? canonicalEntityName.slice(0, -1) : canonicalEntityName,
  ]
    .map((value) => String(value || '').trim())
    .filter(Boolean)

  const sourceSubsections = customSubsections || normalizeSubsections(sourceEntity)
  const tokenOverrides = meta.tokenOverrides && typeof meta.tokenOverrides === 'object' ? meta.tokenOverrides : {}
  const subsections = sourceSubsections
    .map((subsection) => ({
      key: String(subsection?.structure_token || subsection?.subsection || '').trim() || `${entityName}_${subsection?.level_2 || ''}`,
      level_2: String(subsection?.level_2 || resolveAddressPart(subsection?.subsection_address, 1) || '').trim(),
      address: String(subsection?.subsection_address || '').trim(),
      label: formatSubsectionLabel(subsection?.subsection),
      rawLabel: String(subsection?.subsection || '').trim(),
      structureToken: String(subsection?.structure_token || '').trim(),
      subgroupKey: String(subsection?.subgroup_key || '').trim(),
      subgroupLabel: String(subsection?.subgroup_label || '').trim(),
      subgroupAddress: String(subsection?.subgroup_address || '').trim(),
      displayGroup: String(subsection?.display_group || '').trim(),
      tokens: normalizeTokens(subsection).map((token) => {
        const tokenName = String(token?.token_name || '').trim()
        const override = tokenOverrides[tokenName] && typeof tokenOverrides[tokenName] === 'object'
          ? tokenOverrides[tokenName]
          : {}

        return {
          key: String(token?.token_name || token?.address || '').trim(),
          level_3: String(token?.level_3 || '').trim(),
          address: String(token?.address || '').trim(),
          tokenName,
          dbFieldAliases: normalizeDbFieldAliases(token),
          dbWriteField: String(token?.db_write_field || '').trim(),
          dbWriteTable: String(token?.db_write_table || '').trim(),
          dbWriteIdColumn: String(token?.db_write_id_column || '').trim(),
          tokenType: String(override.token_type ?? token?.token_type ?? '').trim(),
          inputSource: String(override.input_source ?? token?.input_source ?? '').trim(),
          optionSource: String(override.option_source ?? token?.option_source ?? '').trim(),
          optionList: String(override.option_list ?? token?.option_list ?? '').trim(),
          optionEntity: String(override.option_entity ?? token?.option_entity ?? '').trim(),
          optionValueMode: String(override.option_value_mode ?? token?.option_value_mode ?? '').trim(),
          optionEntities: Array.isArray(override.option_entities)
            ? override.option_entities.map((value) => String(value || '').trim()).filter(Boolean)
            : Array.isArray(token?.option_entities)
              ? token.option_entities.map((value) => String(value || '').trim()).filter(Boolean)
              : [],
          optionSubset: override.option_subset && typeof override.option_subset === 'object'
            ? { ...override.option_subset }
            : token?.option_subset && typeof token.option_subset === 'object'
              ? { ...token.option_subset }
              : null,
          subsetEntity: String(override.subset_entity ?? token?.subset_entity ?? '').trim(),
          subsetShape: Array.isArray(override.subset_shape)
            ? override.subset_shape.map((value) => String(value || '').trim()).filter(Boolean)
            : Array.isArray(token?.subset_shape)
              ? token.subset_shape.map((value) => String(value || '').trim()).filter(Boolean)
              : [],
          relationshipGroup: String(override.relationship_group ?? token?.relationship_group ?? '').trim(),
          label: formatLabel(
            stripTokenEntityPrefix(String(override.label ?? token?.label ?? token?.token_name ?? '').trim(), entityTokenPrefixes),
          ),
        }
      }),
    }))
    .sort(compareSubsectionDisplayOrder)

  return {
    ...meta,
    entityName: runtimeEntityName,
    canonicalEntityName,
    fileGuidePath: String(meta.fileGuidePath || '').trim(),
    birthDefaults: meta.birthDefaults && typeof meta.birthDefaults === 'object' ? { ...meta.birthDefaults } : {},
    primaryStewardDoc: normalizeReferenceDoc(meta.primaryStewardDoc),
    extraReferenceDocs: (Array.isArray(meta.extraReferenceDocs) ? meta.extraReferenceDocs : []).map(normalizeReferenceDoc).filter(Boolean),
    requiredSubsections: Array.isArray(meta.requiredSubsections) ? meta.requiredSubsections : [...DEFAULT_L1_REQUIRED_SUBSECTIONS],
    optionalStandardSubsections: Array.isArray(meta.optionalStandardSubsections)
      ? meta.optionalStandardSubsections
      : [...DEFAULT_L1_OPTIONAL_STANDARD_SUBSECTIONS],
    requiredRuntimeCapabilities: Array.isArray(meta.requiredRuntimeCapabilities)
      ? meta.requiredRuntimeCapabilities
      : [...DEFAULT_L1_REQUIRED_RUNTIME_CAPABILITIES],
    requiresReciprocalKdb: meta.requiresReciprocalKdb !== false,
    level_1: String(meta.level_1 || sourceEntity?.level_1 || resolveAddressPart(sourceEntity?.entity_address, 0) || '').trim(),
    address: String(meta.address || sourceEntity?.entity_address || '').trim(),
    structureToken: String(meta.structureToken || sourceEntity?.structure_token?.token_name || sourceEntity?.structure_token || '').trim(),
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
    shellGroup: String(entry.shellGroup || '').trim(),
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
        subgroupKey: subsection.subgroupKey,
        subgroupLabel: subsection.subgroupLabel,
        subgroupAddress: subsection.subgroupAddress,
        displayGroup: subsection.displayGroup,
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

const TEST_SHELL_RENDERABLE_KEYS = ['bb-file', 'file-system', 'events', 'users', 'artifacts', 'contacts', 'companies', 'opportunities', 'projects', 'notes', 'tasks', 'user-roles', 'companion-roles', 'markets', 'securities', 'intake']

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
    parentKey: entry.workspaceNavGroup === 'local-dbs' ? 'local-dbs' : 'workspace',
  })),
)

export function getFilePageRegistryEntry(key) {
  const normalizedKey = String(key || '').trim().toLowerCase()
  const aliases = {
    files: 'file-system',
    file: 'file-system',
    'system files': 'file-system',
    history: 'events',
    roles: 'user-roles',
    'user roles': 'user-roles',
    intake: 'intake',
    ingestion: 'intake',
    'artifacts-processed': 'intake',
    artifacts_processed: 'intake',
  }
  return FILE_PAGE_REGISTRY_BY_KEY[aliases[normalizedKey] || normalizedKey] || null
}

export function getFilePageRegistryEntryByRouteName(routeName) {
  const normalizedRouteName = String(routeName || '').trim().toLowerCase()
  return LEVEL_1_FILE_REGISTRY.find((entry) => entry.routeName === normalizedRouteName) || null
}

export function getFilePageRegistryEntryByEntityName(entityName) {
  const normalizedEntityName = String(entityName || '').trim()
  return LEVEL_1_FILE_REGISTRY.find((entry) => String(entry.entityName || '').trim() === normalizedEntityName) || null
}

export function getFilePageRegistryEntryByEntityReference(entityName) {
  const normalizedEntityName = String(entityName || '').trim()
  if (!normalizedEntityName) return null

  const legacyEntityAliases = {
    Intake: 'intake',
    Roles: 'user-roles',
    History: 'events',
  }

  return (
    getFilePageRegistryEntryByEntityName(normalizedEntityName)
    || getFilePageRegistryEntry(legacyEntityAliases[normalizedEntityName] || normalizedEntityName)
  )
}

export function getFilePageReferenceDocs(sourceKey = '') {
  const entry = getFilePageRegistryEntry(sourceKey)
  if (!entry) return []

  const docs = []

  if (String(entry.fileGuidePath || '').trim()) {
    docs.push({
      id: `${entry.key}-guide`,
      label: `${entry.label} Guide`,
      caption: entry.fileGuidePath,
      path: entry.fileGuidePath,
      icon: 'description',
    })
  }

  docs.push(
    entry.primaryStewardDoc || {
      id: 'file-steward',
      label: 'File Steward',
      caption: 'docs/020/Active/020_File_Steward.md',
      path: 'docs/020/Active/020_File_Steward.md',
      icon: 'description',
    },
  )

  docs.push({
    id: 'architect-steward',
    label: 'Architect Steward',
    caption: 'docs/020/Active/020_Architect_Steward.md',
    path: 'docs/020/Active/020_Architect_Steward.md',
    icon: 'description',
  })

  docs.push({
    id: 'ux-steward',
    label: 'UX Steward',
    caption: 'docs/020/Active/020_UX_Steward.md',
    path: 'docs/020/Active/020_UX_Steward.md',
    icon: 'description',
  })

  docs.push(...entry.extraReferenceDocs)

  return Array.from(new Map(docs.map((doc) => [doc.id, doc])).values()).slice(0, 5)
}

export function getFilePageBirthDefaults(sourceKey = '') {
  const entry = getFilePageRegistryEntry(sourceKey)
  return entry?.birthDefaults && typeof entry.birthDefaults === 'object'
    ? { ...entry.birthDefaults }
    : {}
}

export function getRegistryTitleTokenForSource(sourceKey = '') {
  const entry = getFilePageRegistryEntry(sourceKey)
  if (!entry) return null
  const generalSection = entry.subsections.find((section) => String(section.rawLabel || '').trim().toLowerCase() === 'general')
  return generalSection?.tokens?.find((token) => String(token.level_3 || '').trim() === '1') || null
}

export function validateLevel1BootstrapContracts({ bridgeValue = null, sourceKeys = [] } = {}) {
  const scopedKeys = Array.isArray(sourceKeys)
    ? sourceKeys.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)
    : []
  const entries = scopedKeys.length
    ? scopedKeys.map((key) => getFilePageRegistryEntry(key)).filter(Boolean)
    : [...FILE_PAGE_REGISTRY]

  return entries.flatMap((entry) => {
    const issues = []
    const subsectionLabels = new Set(
      (Array.isArray(entry?.subsections) ? entry.subsections : [])
        .map((section) => String(section?.label || section?.rawLabel || '').trim().toLowerCase())
        .filter(Boolean),
    )

    if (!String(entry?.key || '').trim()) issues.push({ severity: 'error', sourceKey: entry?.key || '', issue: 'Missing source key.' })
    if (!String(entry?.routeName || '').trim()) issues.push({ severity: 'error', sourceKey: entry.key, issue: 'Missing route name.' })
    if (!String(entry?.path || '').trim()) issues.push({ severity: 'error', sourceKey: entry.key, issue: 'Missing route path.' })
    if (!String(entry?.canonicalEntityName || '').trim()) issues.push({ severity: 'error', sourceKey: entry.key, issue: 'Missing canonical entity name.' })
    if (!String(entry?.entityName || '').trim()) issues.push({ severity: 'error', sourceKey: entry.key, issue: 'Missing runtime entity name.' })

    const missingSubsections = (Array.isArray(entry?.requiredSubsections) ? entry.requiredSubsections : [])
      .map((label) => String(label || '').trim())
      .filter(Boolean)
      .filter((label) => !subsectionLabels.has(label.toLowerCase()))
    missingSubsections.forEach((label) => {
      issues.push({
        severity: 'error',
        sourceKey: entry.key,
        issue: `Missing required subsection: ${label}.`,
      })
    })

    if (bridgeValue) {
      const bridgeSource = bridgeValue?.[entry.key] || null
      if (!bridgeSource) {
        issues.push({
          severity: 'warn',
          sourceKey: entry.key,
          issue: 'Missing runtime bridge source.',
        })
      } else {
        ;(Array.isArray(entry?.requiredRuntimeCapabilities) ? entry.requiredRuntimeCapabilities : [])
          .map((capability) => String(capability || '').trim())
          .filter(Boolean)
          .forEach((capability) => {
            if (typeof bridgeSource?.[capability] !== 'function') {
              issues.push({
                severity: 'warn',
                sourceKey: entry.key,
                issue: `Missing runtime capability: ${capability}.`,
              })
            }
          })
      }
    }

    return issues
  })
}

export function getRuntimeTableNameForEntityName(entityName = '') {
  const normalized = String(entityName || '').trim()
  if (!normalized) return ''

  const aliasMap = {
    events: 'Events',
    event: 'Events',
    history: 'Events',
    files: 'Files',
    file: 'Files',
    'file-system': 'Files',
    file_system: 'Files',
    'system files': 'Files',
    companies: 'Companies',
    company: 'Companies',
    contacts: 'Contacts',
    contact: 'Contacts',
    users: 'Users',
    user: 'Users',
    markets: 'Markets',
    market: 'Markets',
    artifacts: 'Artifacts',
    artifact: 'Artifacts',
    roles: 'Roles',
    role: 'Roles',
    'user-roles': 'Roles',
    user_roles: 'Roles',
    'user roles': 'Roles',
    companion_roles: 'Companion_Roles',
    'companion roles': 'Companion_Roles',
    'companion-role': 'Companion_Roles',
    'companion role': 'Companion_Roles',
    building_blocks: 'Building_Blocks',
    'building blocks': 'Building_Blocks',
    'bb file': 'Building_Blocks',
    'bb-file': 'Building_Blocks',
    building_block: 'Building_Blocks',
    'building block': 'Building_Blocks',
    opportunities: 'Opportunities',
    opportunity: 'Opportunities',
    funds: 'Funds',
    fund: 'Funds',
    rounds: 'Rounds',
    round: 'Rounds',
    projects: 'Projects',
    project: 'Projects',
    tasks: 'Tasks',
    task: 'Tasks',
    notes: 'Notes',
    note: 'Notes',
    securities: 'Securities',
    security: 'Securities',
    intake: 'Intake',
    ingestion: 'Intake',
    artifact_processed: 'Intake',
    'artifact-processed': 'Intake',
    artifacts_processed: 'Intake',
    'artifacts-processed': 'Intake',
    'artifact processed': 'Intake',
  }

  const normalizedKey = normalized.toLowerCase()
  if (aliasMap[normalizedKey]) return aliasMap[normalizedKey]

  const entry = getFilePageRegistryEntryByEntityName(normalized)
  return String(entry?.entityName || normalized).trim()
}

export function getCreateBranchTokenName(sourceKey = '') {
  const entry = getFilePageRegistryEntry(sourceKey)
  return String(entry?.createBranchTokenName || '').trim()
}

export function getCreateBranches(sourceKey = '') {
  const entry = getFilePageRegistryEntry(sourceKey)
  return Array.isArray(entry?.createBranches) ? entry.createBranches : []
}

export function getCreateBranchEntry(sourceKey = '', branchValue = '') {
  const normalizedBranchValue = String(branchValue || '').trim().toLowerCase()
  return getCreateBranches(sourceKey).find((branch) => String(branch?.value || '').trim().toLowerCase() === normalizedBranchValue) || null
}

function buildAutoFileSpecificViewForks(entry) {
  if (!entry) return null
  const coreLabels = new Set(['general', 'system', 'kdb'])
  const fileSpecificSections = (Array.isArray(entry.subsections) ? entry.subsections : [])
    .map((section) => ({
      rawLabel: String(section?.rawLabel || '').trim(),
      label: String(section?.label || '').trim(),
    }))
    .filter((section) => section.rawLabel && !coreLabels.has(section.rawLabel.toLowerCase()))

  return fileSpecificSections.map((section) => ({
    value: String(section.rawLabel || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, ''),
    label: section.label || section.rawLabel,
    sectionRawLabels: [section.rawLabel],
    forkGroup: 'file-specific',
  }))
}

export function getViewForks(sourceKey = '') {
  const entry = getFilePageRegistryEntry(sourceKey)
  if (!entry) return []

  const forks = []
  forks.push(...buildAutoFileSpecificViewForks(entry))

  if (Array.isArray(entry.viewForks)) {
    forks.push(...entry.viewForks)
  }

  return Array.from(
    new Map(
      forks
        .filter((fork) => String(fork?.value || '').trim() && String(fork?.label || '').trim())
        .map((fork) => [String(fork.value || '').trim().toLowerCase(), fork]),
    ).values(),
  )
}

export function getViewForkEntry(sourceKey = '', forkValue = '') {
  const normalizedForkValue = String(forkValue || '').trim().toLowerCase()
  return getViewForks(sourceKey).find((fork) => String(fork?.value || '').trim().toLowerCase() === normalizedForkValue) || null
}

export function getFilePageCreateSurface(sourceKey = '') {
  const entry = getFilePageRegistryEntry(sourceKey)
  return String(entry?.createSurface || 'record-dialog').trim().toLowerCase() || 'record-dialog'
}

export function getFilePageEditSurface(sourceKey = '') {
  const entry = getFilePageRegistryEntry(sourceKey)
  return String(entry?.editSurface || getFilePageCreateSurface(sourceKey) || 'record-dialog').trim().toLowerCase() || 'record-dialog'
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

export function getCanonicalTokenWriteFieldName(token = {}) {
  const explicitWriteField = String(token?.dbWriteField || '').trim()
  if (explicitWriteField) return explicitWriteField
  const aliases = Array.isArray(token?.dbFieldAliases)
    ? token.dbFieldAliases.map((value) => String(value || '').trim()).filter(Boolean)
    : []
  if (aliases.length) return aliases[0]
  return String(token?.tokenName || '').trim()
}

export function getCanonicalTokenWriteTarget(token = {}, fallbackTableName = '', fallbackIdColumn = 'id') {
  const fieldName = getCanonicalTokenWriteFieldName(token)
  if (!fieldName) return null

  return {
    tableName: String(token?.dbWriteTable || fallbackTableName || '').trim(),
    idColumn: String(token?.dbWriteIdColumn || fallbackIdColumn || 'id').trim() || 'id',
    fieldName,
  }
}

export function getCanonicalTokenValue(row = {}, token = {}) {
  const fieldNames = getCanonicalTokenFieldNames(token)
  for (const fieldName of fieldNames) {
    const value = row?.[fieldName]
    if (value != null && !(typeof value === 'string' && !value.trim())) return value
  }
  return null
}
