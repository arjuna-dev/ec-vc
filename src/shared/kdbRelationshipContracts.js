const KDB_RELATIONSHIP_PAIRS = Object.freeze([
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
])

function normalize(value) {
  return String(value || '').trim()
}

function buildDirectionalContract(pair, direction = 'left') {
  const fromLeft = direction === 'left'
  return {
    joinTable: pair.joinTable,
    sourceEntity: fromLeft ? pair.leftEntity : pair.rightEntity,
    sourceToken: fromLeft ? pair.leftToken : pair.rightToken,
    targetEntity: fromLeft ? pair.rightEntity : pair.leftEntity,
    targetToken: fromLeft ? pair.rightToken : pair.leftToken,
    sourceJoinColumn: 'from_id',
    targetJoinColumn: 'to_id',
  }
}

export const KDB_RELATIONSHIP_CONTRACTS = Object.freeze(
  KDB_RELATIONSHIP_PAIRS.flatMap((pair) => [
    buildDirectionalContract(pair, 'left'),
    buildDirectionalContract(pair, 'right'),
  ]),
)

export function getKdbRelationshipContractForToken(entityName, tokenName) {
  const normalizedEntity = normalize(entityName)
  const normalizedToken = normalize(tokenName)
  return (
    KDB_RELATIONSHIP_CONTRACTS.find(
      (contract) => contract.sourceEntity === normalizedEntity && contract.sourceToken === normalizedToken,
    ) || null
  )
}

export function getKdbRelationshipContractsForEntity(entityName) {
  const normalizedEntity = normalize(entityName)
  return KDB_RELATIONSHIP_CONTRACTS.filter((contract) => contract.sourceEntity === normalizedEntity)
}
