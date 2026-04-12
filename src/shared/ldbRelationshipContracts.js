import canonicalStructure from './canonicalStructure.js'

const GENERIC_LDB_TABLE = 'LDB_Relationships'

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

function normalizeSubsections(entity) {
  const subsections = entity?.subsections
  if (Array.isArray(subsections)) return subsections
  if (subsections && typeof subsections === 'object') return Object.values(subsections)
  return []
}

function normalizeTokens(subsection) {
  return Array.isArray(subsection?.tokens) ? subsection.tokens : []
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

const entities = Array.isArray(canonicalStructure?.entities) ? canonicalStructure.entities : []

const LDB_TOKENS = entities.flatMap((entity) => {
  const entityName = normalize(entity?.entity)
  return normalizeSubsections(entity)
    .filter((subsection) => {
      const subsectionName = normalize(subsection?.subsection).toLowerCase()
      return subsectionName === 'ldb'
    })
    .flatMap((subsection) =>
      normalizeTokens(subsection).map((token) => ({
        entityName,
        tokenName: normalize(token?.token_name),
        optionSource: normalize(token?.option_source),
        optionEntity: normalize(token?.option_entity),
        optionEntities: Array.isArray(token?.option_entities)
          ? token.option_entities.map((value) => normalize(value)).filter(Boolean)
          : [],
      })),
    )
})

function findReverseLdbToken(targetEntity, sourceEntity) {
  return (
    LDB_TOKENS.find((token) => {
      if (token.entityName !== normalize(targetEntity)) return false
      if (token.optionSource === 'live_entity') return token.optionEntity === normalize(sourceEntity)
      if (token.optionSource === 'live_entity_set') return token.optionEntities.includes(normalize(sourceEntity))
      return false
    }) || null
  )
}

const GENERIC_LDB_RELATIONSHIP_CONTRACTS = Object.freeze(
  LDB_TOKENS.filter((token) => token.optionSource === 'live_entity' && token.optionEntity)
    .filter(
      (token) =>
        !EXPLICIT_LDB_RELATIONSHIP_CONTRACTS.some(
          (contract) => contract.sourceEntity === token.entityName && contract.sourceToken === token.tokenName,
        ) &&
        !EXPLICIT_DIRECT_LDB_RELATIONSHIP_CONTRACTS.some(
          (contract) => contract.sourceEntity === token.entityName && contract.sourceToken === token.tokenName,
        ),
    )
    .map((token) => {
      const reverseToken = findReverseLdbToken(token.optionEntity, token.entityName)
      return {
        contractType: 'generic_ldb',
        joinTable: GENERIC_LDB_TABLE,
        sourceEntity: token.entityName,
        sourceToken: token.tokenName,
        targetEntity: token.optionEntity,
        targetToken: normalize(reverseToken?.tokenName),
      }
    }),
)

export const LDB_RELATIONSHIP_CONTRACTS = Object.freeze([
  ...EXPLICIT_LDB_RELATIONSHIP_CONTRACTS,
  ...EXPLICIT_DIRECT_LDB_RELATIONSHIP_CONTRACTS,
  ...GENERIC_LDB_RELATIONSHIP_CONTRACTS,
])

export function getLdbRelationshipContractForToken(entityName, tokenName) {
  const normalizedEntity = normalize(entityName)
  const normalizedToken = normalize(tokenName)
  return (
    LDB_RELATIONSHIP_CONTRACTS.find(
      (contract) => contract.sourceEntity === normalizedEntity && contract.sourceToken === normalizedToken,
    ) || null
  )
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
