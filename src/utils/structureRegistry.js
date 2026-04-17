
export const DEFAULT_L1_REQUIRED_RUNTIME_CAPABILITIES = Object.freeze(['list', 'create', 'delete'])

export const OWNER_PACK_FILE_KEYS = Object.freeze([
  'file-system',
  'events',
  'users',
  'companion',
  'contacts',
  'companies',
  'projects',
  'tasks',
  'notes',
  'artifacts',
  'user-roles',
  'companion-roles',
  'intake',
])

export const VC_PACK_FILE_KEYS = Object.freeze([
  'opportunities',
  'funds',
  'rounds',
  'markets',
  'securities',
])

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
    fileGuidePath: 'docs/100/Archive/100-BB_Shell.md',
    primaryStewardDoc: {
      id: 'design-steward',
      label: 'Design',
      caption: 'docs/000/j. UXDesign.md',
      path: 'docs/000/j. UXDesign.md',
      icon: 'description',
    },
    requiredSubsections: ['General', 'Usage', 'Anatomy', 'Source', 'Reconstruction', 'Variants'],
    optionalStandardSubsections: [],
    requiredRuntimeCapabilities: ['list', 'create', 'delete'],
    address: 'BB.0.0',
    structureToken: 'Building_Blocks_File',
    customSubsections: [
      {
        subsection: 'General',
        subsection_address: 'BB.1.0',
        structure_token: 'Building_Blocks_General',
        tokens: [
          { address: 'BB.1.1', token_name: 'BB_Name', label: 'Name', db_field_aliases: ['Name'] },
          { address: 'BB.1.2', token_name: 'BB_Summary', label: 'Summary', db_field_aliases: ['Summary'] },
          { address: 'BB.1.3', token_name: 'BB_Category', label: 'Category', db_field_aliases: ['Category'] },
          { address: 'BB.1.4', token_name: 'BB_Status', label: 'Status', db_field_aliases: ['Status'] },
        ],
      },
      {
        subsection: 'Usage',
        subsection_address: 'BB.2.0',
        structure_token: 'Building_Blocks_Usage',
        tokens: [
          { address: 'BB.2.1', token_name: 'BB_Used_In', label: 'Used In', db_field_aliases: ['Used_In'] },
          { address: 'BB.2.2', token_name: 'BB_Used_In_Shells', label: 'Used In Shells', db_field_aliases: ['Used_In_Shells'] },
          { address: 'BB.2.3', token_name: 'BB_Use_When', label: 'Use When', db_field_aliases: ['Use_When'] },
          { address: 'BB.2.4', token_name: 'BB_Avoid_When', label: 'Avoid When', db_field_aliases: ['Avoid_When'] },
        ],
      },
      {
        subsection: 'Anatomy',
        subsection_address: 'BB.3.0',
        structure_token: 'Building_Blocks_Anatomy',
        tokens: [
          { address: 'BB.3.1', token_name: 'BB_Anatomy', label: 'Anatomy', db_field_aliases: ['Anatomy'] },
          { address: 'BB.3.2', token_name: 'BB_Required_Parts', label: 'Required Parts', db_field_aliases: ['Required_Parts'] },
          { address: 'BB.3.3', token_name: 'BB_Built_From_BBs', label: 'Built From BBs', db_field_aliases: ['Built_From_BBs'] },
        ],
      },
      {
        subsection: 'Source',
        subsection_address: 'BB.4.0',
        structure_token: 'Building_Blocks_Source',
        tokens: [
          { address: 'BB.4.1', token_name: 'BB_Source_Path', label: 'Source Path', db_field_aliases: ['Source_Path'] },
          { address: 'BB.4.2', token_name: 'BB_Owner', label: 'Owner', db_field_aliases: ['Owner'] },
          { address: 'BB.4.3', token_name: 'BB_Extraction_Status', label: 'Extraction Status', db_field_aliases: ['Extraction_Status'] },
        ],
      },
      {
        subsection: 'Reconstruction',
        subsection_address: 'BB.5.0',
        structure_token: 'Building_Blocks_Reconstruction',
        tokens: [
          { address: 'BB.5.1', token_name: 'BB_Reconstruction_Notes', label: 'Reconstruction Notes', db_field_aliases: ['Reconstruction_Notes'] },
          { address: 'BB.5.2', token_name: 'BB_Convergence_Rule', label: 'Convergence Rule', db_field_aliases: ['Convergence_Rule'] },
          { address: 'BB.5.3', token_name: 'BB_Prompt', label: 'Prompt', db_field_aliases: ['Prompt'] },
        ],
      },
      {
        subsection: 'Variants',
        subsection_address: 'BB.6.0',
        structure_token: 'Building_Blocks_Variants',
        tokens: [
          { address: 'BB.6.1', token_name: 'BB_Variants', label: 'Variants', db_field_aliases: ['Variants'] },
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
    fileGuidePath: 'docs/100/a2. History.md',
    primaryStewardDoc: {
      id: 'provenance-steward',
      label: 'Provenance Steward',
      caption: 'docs/000/g. Intake.md',
      path: 'docs/000/g. Intake.md',
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
    fileGuidePath: 'docs/000/c. System.md',
    birthDefaults: {
      File_Owner: 'Owner',
      File_Steward: 'File Steward',
      Ownership_Mode: 'root_owned',
    },
    extraReferenceDocs: [],
  },
  Users: { key: 'users', label: 'Users', singularLabel: 'User', routeName: 'users', path: '/users', icon: 'badge', showInWorkspaceNav: true, workspaceNavGroup: 'files', shellGroup: 'first_order', fileGuidePath: 'docs/100/a5. Users.md' },
  Companion: {
    key: 'companion',
    label: 'Companion',
    singularLabel: 'Companion',
    routeName: 'companion',
    path: '/companion',
    icon: 'smart_toy',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'files',
    shellGroup: 'knowledge_db',
    fileGuidePath: 'docs/002/a. Companion.md',
  },
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
    fileGuidePath: 'docs/100/c6. Artifacts.md',
    primaryStewardDoc: {
      id: 'provenance-steward',
      label: 'Provenance Steward',
      caption: 'docs/000/g. Intake.md',
      path: 'docs/000/g. Intake.md',
      icon: 'description',
    },
  },
  Contacts: { key: 'contacts', label: 'Contacts', singularLabel: 'Contact', routeName: 'contacts', path: '/contacts', icon: 'people', showInWorkspaceNav: true, workspaceNavGroup: 'files', shellGroup: 'first_order', fileGuidePath: 'docs/100/a4. Contacts.md' },
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
    fileGuidePath: 'docs/100/c1. Companies.md',
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
    createBranchLabel: 'Opportunity Fork',
    createBranchTokenName: 'Opportunity_Kind',
    routeName: 'opportunities',
    path: '/opportunities',
    icon: 'work',
    showInWorkspaceNav: true,
    workspaceNavGroup: 'files',
    shellGroup: 'first_order',
    fileGuidePath: 'docs/100/c2. Opportunities.md',
    createBranches: [
      { value: 'fund', label: 'Fund', icon: 'account_balance_wallet', targetSourceKey: 'funds' },
      { value: 'round', label: 'Round', icon: 'donut_large', targetSourceKey: 'rounds' },
    ],
  },
  Funds: { key: 'funds', label: 'Funds', singularLabel: 'Fund', routeName: 'funds', path: '/funds', icon: 'account_balance', showInWorkspaceNav: false, shellGroup: 'first_order', fileGuidePath: 'docs/100/c7. Funds.md' },
  Rounds: { key: 'rounds', label: 'Rounds', singularLabel: 'Round', routeName: 'rounds', path: '/rounds', icon: 'toll', showInWorkspaceNav: false, shellGroup: 'first_order', fileGuidePath: 'docs/100/c8. Rounds.md' },
  Projects: { key: 'projects', label: 'Projects', singularLabel: 'Project', routeName: 'projects', path: '/projects', icon: 'schema', showInWorkspaceNav: true, workspaceNavGroup: 'files', shellGroup: 'first_order', fileGuidePath: 'docs/100/c3. Projects.md' },
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
    fileGuidePath: 'docs/100/c4. Tasks.md',
    tokenOverrides: {
      Task_Team_Owner: { option_entity: 'Contacts' },
      Task_Team_Assigned: { option_entity: 'Contacts' },
      Task_Team_Support: { option_entity: 'Contacts' },
    },
  },
  Notes: { key: 'notes', label: 'Notes', singularLabel: 'Note', routeName: 'notes', path: '/notes', icon: 'note', showInWorkspaceNav: true, workspaceNavGroup: 'files', shellGroup: 'first_order', fileGuidePath: 'docs/100/c5. Notes.md' },
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
    fileGuidePath: 'docs/100/a3. User_Roles.md',
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
    fileGuidePath: 'docs/100/Archive/100-Companion_Roles.md',
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
    fileGuidePath: 'docs/100/d1. Markets.md',
    primaryStewardDoc: {
      id: 'glossary-steward',
      label: 'Glossary Steward',
      caption: 'docs/000/b. LAMP.md',
      path: 'docs/000/b. LAMP.md',
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
    fileGuidePath: 'docs/100/d2. Securities.md',
    primaryStewardDoc: {
      id: 'glossary-steward',
      label: 'Glossary Steward',
      caption: 'docs/000/b. LAMP.md',
      path: 'docs/000/b. LAMP.md',
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
    fileGuidePath: 'docs/100/b2. Intake.md',
  },
})

const FILE_PAGE_ENTITY_ORDER = [
  'Files',
  'Building_Blocks',
  'Events',
  'Users',
  'Companion',
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

const runtimeFileStructuresBySource = {}
const runtimeStructureSubscribers = new Set()
let runtimeStructureVersion = 0

function buildEntityRegistry(entityName) {
  const meta = FILE_PAGE_ROUTE_META[entityName]
  if (!meta) return null

  const canonicalEntityName = String(meta.canonicalEntityName || entityName).trim()
  const runtimeEntityName = String(meta.runtimeEntityName || entityName).trim()
  const customSubsections = Array.isArray(meta.customSubsections) ? meta.customSubsections : []
  const sourceKey = String(meta.key || '').trim()
  const filePack = OWNER_PACK_FILE_KEYS.includes(sourceKey)
    ? 'owner'
    : VC_PACK_FILE_KEYS.includes(sourceKey)
      ? 'vc'
      : 'auxiliary'

  return {
    ...meta,
    sourceKey,
    entityName: runtimeEntityName,
    canonicalEntityName,
    filePack,
    fileGuidePath: String(meta.fileGuidePath || '').trim(),
    birthDefaults: meta.birthDefaults && typeof meta.birthDefaults === 'object' ? { ...meta.birthDefaults } : {},
    primaryStewardDoc: normalizeReferenceDoc(meta.primaryStewardDoc),
    extraReferenceDocs: (Array.isArray(meta.extraReferenceDocs) ? meta.extraReferenceDocs : []).map(normalizeReferenceDoc).filter(Boolean),
    requiredRuntimeCapabilities: Array.isArray(meta.requiredRuntimeCapabilities)
      ? meta.requiredRuntimeCapabilities
      : [...DEFAULT_L1_REQUIRED_RUNTIME_CAPABILITIES],
    address: String(meta.address || '').trim(),
    structureToken: String(meta.structureToken || '').trim(),
    subsections: customSubsections,
  }
}

export const FILE_PAGE_REGISTRY = Object.freeze(
  FILE_PAGE_ENTITY_ORDER.map((entityName) => buildEntityRegistry(entityName)).filter(Boolean),
)

export const FILE_PAGE_REGISTRY_BY_KEY = Object.freeze(
  Object.fromEntries(FILE_PAGE_REGISTRY.map((entry) => [entry.key, entry])),
)

export const FILE_PAGE_REGISTRY_BY_SOURCEKEY = Object.freeze(
  Object.fromEntries(FILE_PAGE_REGISTRY.map((entry) => [entry.sourceKey || entry.key, entry])),
)

function normalizeRuntimeFileStatus(value = '') {
  return String(value || '').trim().toLowerCase()
}

function shouldHydrateRuntimeFileStructure(row = {}) {
  const status = normalizeRuntimeFileStatus(row?.File_Status)
  if (!status) return true
  return status !== 'archived'
}

function normalizeRuntimeToken(token = {}, section = {}, index = 0, sourceKey = '') {
  return {
    ...token,
    key: String(token?.key || token?.tokenName || token?.address || `${sourceKey}-token-${index + 1}`).trim(),
    tokenName: String(token?.tokenName || '').trim(),
    tokenRole: String(token?.tokenRole || token?.token_role || '').trim(),
    tokenOrder: String(token?.tokenOrder || token?.token_order || '').trim(),
    address: String(token?.address || '').trim(),
    label: String(token?.label || '').trim(),
    tokenType: String(token?.tokenType || token?.token_type || '').trim(),
    optionSource: String(token?.optionSource || token?.option_source || '').trim(),
    optionEntity: String(token?.optionEntity || token?.option_entity || '').trim(),
    optionList: String(token?.optionList || token?.option_list || '').trim(),
    optionEntities: Array.isArray(token?.optionEntities)
      ? token.optionEntities.map((value) => String(value || '').trim()).filter(Boolean)
      : [],
    inputOptions: Array.isArray(token?.inputOptions)
      ? token.inputOptions.map((value) => String(value || '').trim()).filter(Boolean)
      : [],
    definition: String(token?.definition || token?.Definition || '').trim(),
    defaultVerificationState: String(
      token?.defaultVerificationState || token?.default_verification_state || '',
    ).trim(),
    defaultVerificationSource: String(
      token?.defaultVerificationSource || token?.default_verification_source || '',
    ).trim(),
    dbWriteField: String(token?.dbWriteField || token?.db_write_field || '').trim(),
    fieldClass: String(token?.fieldClass || token?.field_class || '').trim(),
    relationshipGroup: String(token?.relationshipGroup || token?.relationship_group || '').trim(),
    editable: typeof token?.editable === 'boolean' ? token.editable : token?.editable,
    parentKey: String(section?.key || '').trim(),
    parentLabel: String(section?.label || '').trim(),
  }
}

export function setRuntimeFileStructures(fileRows = []) {
  const nextMap = {}
  for (const row of Array.isArray(fileRows) ? fileRows : []) {
    if (!shouldHydrateRuntimeFileStructure(row)) continue
    const sourceKey = String(row?.sourceKey || '').trim().toLowerCase()
    if (!sourceKey) continue
    const rawStructure = String(row?.Structure || '').trim()
    if (!rawStructure) continue
    try {
      const parsed = JSON.parse(rawStructure)
      if (!parsed || typeof parsed !== 'object') continue
      const sections = Array.isArray(parsed.sections) ? parsed.sections : []
      const normalizedSections = sections.map((section, index) => ({
        key: String(section?.key || section?.structureToken || section?.label || `${sourceKey}-section-${index + 1}`).trim(),
        address: String(section?.address || '').trim(),
        label: String(section?.label || '').trim(),
        structureToken: String(section?.structureToken || '').trim(),
        displayGroup: String(section?.displayGroup || '').trim(),
        tokens: Array.isArray(section?.tokens) ? section.tokens : [],
      }))
      const tokens = normalizedSections.flatMap((section) =>
        (Array.isArray(section.tokens) ? section.tokens : []).map((token, index) =>
          normalizeRuntimeToken(token, section, index, sourceKey),
        ),
      )
      nextMap[sourceKey] = {
        sections: normalizedSections.map((section) => ({
          key: section.key,
          address: section.address,
          label: section.label,
          structureToken: section.structureToken,
          displayGroup: section.displayGroup,
        })),
        tokens,
      }
    } catch {
      continue
    }
  }
  Object.keys(runtimeFileStructuresBySource).forEach((key) => delete runtimeFileStructuresBySource[key])
  Object.assign(runtimeFileStructuresBySource, nextMap)
  runtimeStructureVersion += 1
  runtimeStructureSubscribers.forEach((listener) => {
    try {
      listener(runtimeStructureVersion)
    } catch {
      // ignore subscriber errors
    }
  })
}

export function getRuntimeStructureVersion() {
  return runtimeStructureVersion
}

export function subscribeRuntimeFileStructures(listener) {
  if (typeof listener !== 'function') return () => {}
  runtimeStructureSubscribers.add(listener)
  return () => runtimeStructureSubscribers.delete(listener)
}

export const FILE_SOURCE_REGISTRY = Object.freeze(
  FILE_PAGE_REGISTRY.map((entry) => ({
    sourceKey: entry.sourceKey || entry.key,
    entityName: entry.entityName,
    label: entry.label,
    singularLabel: entry.singularLabel,
    address: entry.address,
    structureToken: entry.structureToken,
    routeName: entry.routeName,
    path: entry.path,
    icon: entry.icon,
    shellGroup: String(entry.shellGroup || '').trim(),
  })),
)

const TEST_SHELL_RENDERABLE_KEYS = ['bb-file', 'file-system', 'events', 'users', 'companion', 'artifacts', 'contacts', 'companies', 'opportunities', 'projects', 'notes', 'tasks', 'user-roles', 'companion-roles', 'markets', 'securities', 'intake']

export const TEST_SHELL_SECTION_OPTIONS = Object.freeze(
  FILE_SOURCE_REGISTRY.filter((entry) => TEST_SHELL_RENDERABLE_KEYS.includes(entry.sourceKey)).map((entry) => ({
    label: entry.label,
    value: entry.sourceKey,
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

export function getFilePageRegistryEntry(sourceKey) {
  const normalizedKey = String(sourceKey || '').trim().toLowerCase()
  const aliases = {
    intake: 'intake',
  }
  return (
    FILE_PAGE_REGISTRY_BY_SOURCEKEY[aliases[normalizedKey] || normalizedKey]
    || FILE_PAGE_REGISTRY_BY_KEY[aliases[normalizedKey] || normalizedKey]
    || null
  )
}

export function getFilePageRegistryEntryByRouteName(routeName) {
  const normalizedRouteName = String(routeName || '').trim().toLowerCase()
  return FILE_SOURCE_REGISTRY.find((entry) => entry.routeName === normalizedRouteName) || null
}

export function getFilePageRegistryEntryByEntityName(entityName) {
  const normalizedEntityName = String(entityName || '').trim()
  return FILE_SOURCE_REGISTRY.find((entry) => String(entry.entityName || '').trim() === normalizedEntityName) || null
}

export function getFilePageRegistryEntryByEntityReference(entityName) {
  const normalizedEntityName = String(entityName || '').trim()
  if (!normalizedEntityName) return null

  return (
    getFilePageRegistryEntryByEntityName(normalizedEntityName)
    || getFilePageRegistryEntry(normalizedEntityName)
  )
}

export function resolveApprovedFileSectionKey(value, entityName = '') {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) return getFilePageRegistryEntryByEntityReference(entityName)?.sourceKey || ''

  const normalizedLower = normalizedValue.toLowerCase()
  const entry = (
    getFilePageRegistryEntry(normalizedLower)
    || getFilePageRegistryEntryByRouteName(normalizedLower)
    || getFilePageRegistryEntryByEntityReference(normalizedValue)
    || FILE_SOURCE_REGISTRY.find((candidate) =>
      [candidate.sourceKey, candidate.routeName, candidate.entityName, candidate.label, candidate.singularLabel]
        .some((field) => String(field || '').trim().toLowerCase() === normalizedLower),
    )
  )

  return String(entry?.sourceKey || '').trim().toLowerCase()
}

export function buildFileShellPayload(sourceKey = '') {
  const normalizedSourceKey = String(sourceKey || '').trim().toLowerCase()
  const registryEntry = getFilePageRegistryEntry(normalizedSourceKey) || null
  const runtimeStructure = runtimeFileStructuresBySource[normalizedSourceKey] || null
  const sections = Array.isArray(runtimeStructure?.sections) ? runtimeStructure.sections : []
  const tokens = Array.isArray(runtimeStructure?.tokens) ? runtimeStructure.tokens : []

  return {
    sourceKey: normalizedSourceKey,
    registryEntry,
    sections,
    tokens,
  }
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
      caption: 'docs/000/d. File.md',
      path: 'docs/000/d. File.md',
      icon: 'description',
    },
  )

  docs.push({
    id: 'architect-steward',
    label: 'Architect Steward',
    caption: 'docs/000/a. DAMP.md',
    path: 'docs/000/a. DAMP.md',
    icon: 'description',
  })

  docs.push({
    id: 'ux-steward',
    label: 'UX',
    caption: 'docs/000/j. UXDesign.md',
    path: 'docs/000/j. UXDesign.md',
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
  const payload = buildFileShellPayload(sourceKey)
  if (!payload.registryEntry) return null
  return payload.tokens.find((token) => String(token.tokenRole || '').trim().toLowerCase() === 'title') || null
}

export function getRegistrySummaryTokenForSource(sourceKey = '') {
  const payload = buildFileShellPayload(sourceKey)
  if (!payload.registryEntry) return null
  return payload.tokens.find((token) => String(token.tokenRole || '').trim().toLowerCase() === 'summary') || null
}

export function getRuntimeTableNameForEntityName(entityName = '') {
  const normalized = String(entityName || '').trim()
  if (!normalized) return ''

  const aliasMap = {
    events: 'Events',
    'file-system': 'Files',
    companies: 'Companies',
    companion: 'Companion',
    contacts: 'Contacts',
    users: 'Users',
    markets: 'Markets',
    artifacts: 'Artifacts',
    'user-roles': 'Roles',
    'companion-roles': 'Companion_Roles',
    'bb-file': 'Building_Blocks',
    opportunities: 'Opportunities',
    funds: 'Funds',
    rounds: 'Rounds',
    projects: 'Projects',
    tasks: 'Tasks',
    notes: 'Notes',
    securities: 'Securities',
    intake: 'Intake',
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

export function getViewForks(sourceKey = '') {
  const entry = getFilePageRegistryEntry(sourceKey)
  if (!entry) return []

  return Array.from(
    new Map(
      (Array.isArray(entry.viewForks) ? entry.viewForks : [])
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
  const explicitWriteField = String(token?.dbWriteField || '').trim()
  return Array.from(
    new Set(
      [explicitWriteField, token.tokenName]
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  )
}

export function getCanonicalTokenWriteFieldName(token = {}) {
  const explicitWriteField = String(token?.dbWriteField || '').trim()
  if (explicitWriteField) return explicitWriteField
  return ''
}

export function getDefaultTokenCreateValue(token = {}) {
  const role = String(token?.tokenRole || '').trim().toLowerCase()
  if (role === 'status') return 'Draft'
  return null
}

export function getCanonicalTokenWriteTarget(token = {}, fallbackTableName = '', fallbackIdColumn = 'id') {
  const fieldName = getCanonicalTokenWriteFieldName(token)
  if (!fieldName) return null

  return {
    tableName: String(fallbackTableName || '').trim(),
    idColumn: String(fallbackIdColumn || 'id').trim() || 'id',
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

