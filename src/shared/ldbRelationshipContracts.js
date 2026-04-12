import { FILE_SOURCE_REGISTRY } from 'src/utils/structureRegistry'

const GENERIC_LDB_TABLE = 'LDB_Relationships'
const EXCLUDED_LDB_SOURCE_KEYS = Object.freeze(['bb-file', 'events'])

const EXPLICIT_LDB_RELATIONSHIP_PAIRS = Object.freeze([
  {
    joinTable: 'Companies_Projects_projects',
    leftEntity: 'Companies',
    leftToken: 'Company_Project',
    rightEntity: 'Projects',
    rightToken: 'Project_Company',
  },
  {
    joinTable: 'Companies_Tasks_tasks',
    leftEntity: 'Companies',
    leftToken: 'Company_Task',
    rightEntity: 'Tasks',
    rightToken: 'Task_Company',
  },
  {
    joinTable: 'Companies_Funds_has_funds',
    leftEntity: 'Companies',
    leftToken: 'Company_Fund',
    rightEntity: 'Funds',
    rightToken: 'Fund_Company',
  },
  {
    joinTable: 'Companies_Rounds_has_rounds',
    leftEntity: 'Companies',
    leftToken: 'Company_Round',
    rightEntity: 'Rounds',
    rightToken: 'Round_Company',
  },
  {
    joinTable: 'Contacts_Companies_related_contacts',
    leftEntity: 'Contacts',
    leftToken: 'Contact_Company',
    rightEntity: 'Companies',
    rightToken: 'Company_Contact',
  },
  {
    joinTable: 'Contacts_Funds_funds_invested',
    leftEntity: 'Contacts',
    leftToken: 'Contact_Fund',
    rightEntity: 'Funds',
    rightToken: 'Fund_Contact',
  },
  {
    joinTable: 'Contacts_Rounds_rounds_invested',
    leftEntity: 'Contacts',
    leftToken: 'Contact_Round',
    rightEntity: 'Rounds',
    rightToken: 'Round_Contact',
  },
  {
    joinTable: 'Contacts_Projects_project_roles',
    leftEntity: 'Contacts',
    leftToken: 'Contact_Project',
    rightEntity: 'Projects',
    rightToken: 'Project_Contact',
  },
  {
    joinTable: 'Projects_Funds_related_fund',
    leftEntity: 'Projects',
    leftToken: 'Project_Fund',
    rightEntity: 'Funds',
    rightToken: 'Fund_Project',
  },
  {
    joinTable: 'Projects_Rounds_related_round',
    leftEntity: 'Projects',
    leftToken: 'Project_Round',
    rightEntity: 'Rounds',
    rightToken: 'Round_Project',
  },
  {
    joinTable: 'Tasks_Projects_projects',
    leftEntity: 'Tasks',
    leftToken: 'Task_Project',
    rightEntity: 'Projects',
    rightToken: 'Project_Task',
  },
  {
    joinTable: 'Users_Roles',
    leftEntity: 'Users',
    leftToken: 'User_Role_Link',
    rightEntity: 'Roles',
    rightToken: 'Role_User',
    leftJoinColumn: 'user_id',
    rightJoinColumn: 'role_id',
  },
])

function normalize(value) {
  return String(value || '').trim()
}

function normalizeEntityName(value) {
  return normalize(value)
}

function normalizeTokenSegment(value) {
  return normalize(value)
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
}

function buildDirectionalContract(pair, direction = 'left') {
  const fromLeft = direction === 'left'
  return {
    contractType: 'join_table',
    joinTable: pair.joinTable,
    sourceEntity: fromLeft ? pair.leftEntity : pair.rightEntity,
    sourceToken: fromLeft ? pair.leftToken : pair.rightToken,
    targetEntity: fromLeft ? pair.rightEntity : pair.leftEntity,
    targetToken: fromLeft ? pair.rightToken : pair.leftToken,
    sourceJoinColumn: fromLeft
      ? normalize(pair.leftJoinColumn) || 'from_id'
      : normalize(pair.rightJoinColumn) || 'to_id',
    targetJoinColumn: fromLeft
      ? normalize(pair.rightJoinColumn) || 'to_id'
      : normalize(pair.leftJoinColumn) || 'from_id',
  }
}

const EXPLICIT_LDB_RELATIONSHIP_CONTRACTS = Object.freeze(
  EXPLICIT_LDB_RELATIONSHIP_PAIRS.flatMap((pair) => [
    buildDirectionalContract(pair, 'left'),
    buildDirectionalContract(pair, 'right'),
  ]),
)

const EXPLICIT_DIRECT_LDB_RELATIONSHIP_CONTRACTS = Object.freeze([
  {
    contractType: 'direct_foreign_key',
    sourceEntity: 'Contacts',
    sourceToken: 'Contact_User',
    targetEntity: 'Users',
    targetToken: 'User_Contact',
    ownerTable: 'Contacts',
    ownerIdColumn: 'id',
    ownerField: 'linked_user_id',
  },
  {
    contractType: 'reverse_direct_foreign_key',
    sourceEntity: 'Users',
    sourceToken: 'User_Contact',
    targetEntity: 'Contacts',
    targetToken: 'Contact_User',
    ownerTable: 'Contacts',
    ownerIdColumn: 'id',
    ownerField: 'linked_user_id',
  },
])

const LDB_ENTITY_UNIVERSE = FILE_SOURCE_REGISTRY
  .filter((entry) => entry?.key && !EXCLUDED_LDB_SOURCE_KEYS.includes(String(entry.key || '').trim().toLowerCase()))
  .map((entry) => ({
    key: normalize(entry?.key),
    entityName: normalize(entry?.entityName),
    singularLabel: normalize(entry?.singularLabel),
    label: normalize(entry?.label),
  }))
  .filter((entry) => entry.entityName)

function buildLdbTokenName(source, target) {
  const sourceLabel = source.singularLabel || source.label || source.entityName
  const targetLabel = target.singularLabel || target.label || target.entityName
  return `${normalizeTokenSegment(sourceLabel)}_${normalizeTokenSegment(targetLabel)}`
}

function buildEntityPairKey(sourceEntity, targetEntity) {
  return `${normalizeEntityName(sourceEntity)}::${normalizeEntityName(targetEntity)}`
}

const EXPLICIT_ENTITY_PAIR_KEYS = new Set([
  ...EXPLICIT_LDB_RELATIONSHIP_CONTRACTS.map((contract) => buildEntityPairKey(contract.sourceEntity, contract.targetEntity)),
  ...EXPLICIT_DIRECT_LDB_RELATIONSHIP_CONTRACTS.map((contract) => buildEntityPairKey(contract.sourceEntity, contract.targetEntity)),
])

const GENERIC_LDB_RELATIONSHIP_CONTRACTS = Object.freeze(
  LDB_ENTITY_UNIVERSE.flatMap((source) =>
    LDB_ENTITY_UNIVERSE
      .filter((target) => target.entityName !== source.entityName)
      .map((target) => {
        const pairKey = buildEntityPairKey(source.entityName, target.entityName)
        if (EXPLICIT_ENTITY_PAIR_KEYS.has(pairKey)) return null
        return {
          contractType: 'generic_ldb',
          joinTable: GENERIC_LDB_TABLE,
          sourceEntity: source.entityName,
          sourceToken: buildLdbTokenName(source, target),
          targetEntity: target.entityName,
          targetToken: buildLdbTokenName(target, source),
        }
      })
      .filter(Boolean),
  ),
)

export const LDB_RELATIONSHIP_CONTRACTS = Object.freeze([
  ...EXPLICIT_LDB_RELATIONSHIP_CONTRACTS,
  ...EXPLICIT_DIRECT_LDB_RELATIONSHIP_CONTRACTS,
  ...GENERIC_LDB_RELATIONSHIP_CONTRACTS,
])

function resolveTargetEntityFromToken(token) {
  if (!token) return ''
  const explicit = normalizeEntityName(token?.targetEntity || token?.optionEntity || token?.option_entity)
  if (explicit) return explicit
  const optionEntities = Array.isArray(token?.optionEntities)
    ? token.optionEntities
    : Array.isArray(token?.option_entities)
      ? token.option_entities
      : []
  if (optionEntities.length === 1) return normalizeEntityName(optionEntities[0])
  return ''
}

export function getLdbRelationshipContractForEntityPair(sourceEntity, targetEntity) {
  const normalizedSource = normalizeEntityName(sourceEntity)
  const normalizedTarget = normalizeEntityName(targetEntity)
  if (!normalizedSource || !normalizedTarget) return null
  return (
    LDB_RELATIONSHIP_CONTRACTS.find(
      (contract) =>
        normalizeEntityName(contract.sourceEntity) === normalizedSource
        && normalizeEntityName(contract.targetEntity) === normalizedTarget,
    ) || null
  )
}

export function getLdbRelationshipContractForToken(entityName, tokenOrName, targetEntity = '') {
  const normalizedEntity = normalizeEntityName(entityName)
  if (!normalizedEntity) return null

  const resolvedTarget = normalizeEntityName(targetEntity) || (typeof tokenOrName === 'object' ? resolveTargetEntityFromToken(tokenOrName) : '')
  if (!resolvedTarget) return null
  return getLdbRelationshipContractForEntityPair(normalizedEntity, resolvedTarget)
}

export function getLdbRelationshipContractsForEntity(entityName) {
  const normalizedEntity = normalize(entityName)
  return LDB_RELATIONSHIP_CONTRACTS.filter((contract) => contract.sourceEntity === normalizedEntity)
}

export function isGenericLdbRelationshipContract(contract) {
  return normalize(contract?.contractType) === 'generic_ldb'
}

export function isDirectLdbRelationshipContract(contract) {
  const contractType = normalize(contract?.contractType)
  return contractType === 'direct_foreign_key' || contractType === 'reverse_direct_foreign_key'
}

export function getGenericLdbRelationshipTableName() {
  return GENERIC_LDB_TABLE
}
