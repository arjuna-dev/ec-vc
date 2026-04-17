export const FILE_RECORD_LOADERS = Object.freeze({
  'file-system': { listFn: (bridgeValue) => bridgeValue?.['file-system']?.list?.(), resultKey: 'files', recordIdField: 'id' },
  events: { listFn: (bridgeValue) => bridgeValue?.events?.list?.(), resultKey: 'events', recordIdField: 'id' },
  users: { listFn: (bridgeValue) => bridgeValue?.users?.list?.(), resultKey: 'users', recordIdField: 'id' },
  markets: { listFn: (bridgeValue) => bridgeValue?.markets?.list?.(), resultKey: 'markets', recordIdField: 'id' },
  securities: { listFn: (bridgeValue) => bridgeValue?.securities?.list?.(), resultKey: 'securities', recordIdField: 'id' },
  artifacts: { listFn: (bridgeValue) => bridgeValue?.artifacts?.list?.(), resultKey: 'artifacts', recordIdField: 'artifact_id' },
  contacts: { listFn: (bridgeValue) => bridgeValue?.contacts?.list?.(), resultKey: 'contacts', recordIdField: 'id' },
  companies: { listFn: (bridgeValue) => bridgeValue?.companies?.list?.(), resultKey: 'companies', recordIdField: 'id' },
  opportunities: { listFn: (bridgeValue) => bridgeValue?.opportunities?.list?.(), resultKey: 'opportunities', recordIdField: 'id' },
  funds: { listFn: (bridgeValue) => bridgeValue?.funds?.list?.(), resultKey: 'funds', recordIdField: 'id' },
  rounds: { listFn: (bridgeValue) => bridgeValue?.rounds?.list?.(), resultKey: 'rounds', recordIdField: 'id' },
  projects: { listFn: (bridgeValue) => bridgeValue?.projects?.list?.(), resultKey: 'projects', recordIdField: 'id' },
  notes: { listFn: (bridgeValue) => bridgeValue?.notes?.list?.(), resultKey: 'notes', recordIdField: 'id' },
  tasks: { listFn: (bridgeValue) => bridgeValue?.tasks?.list?.(), resultKey: 'tasks', recordIdField: 'id' },
  'bb-file': { listFn: (bridgeValue) => bridgeValue?.['bb-file']?.list?.(), resultKey: 'buildingBlocks', recordIdField: 'id' },
  'user-roles': { listFn: (bridgeValue) => bridgeValue?.['user-roles']?.list?.(), resultKey: 'roles', recordIdField: 'id' },
  'companion-roles': { listFn: (bridgeValue) => bridgeValue?.['companion-roles']?.list?.() ?? { companionRoles: [] }, resultKey: 'companionRoles', recordIdField: 'id' },
  intake: { listFn: (bridgeValue) => bridgeValue?.intake?.list?.(), resultKey: 'intake', recordIdField: 'id' },
})

export function getFileRecordLoader(sourceKey = '') {
  return FILE_RECORD_LOADERS[String(sourceKey || '').trim().toLowerCase()] || null
}
