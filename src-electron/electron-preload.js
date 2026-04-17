import { contextBridge, ipcRenderer, webUtils } from 'electron'
import path from 'node:path'

function extractIpcErrorMessage(error, channel) {
  const raw = String(error?.message || error || '').trim()
  const prefix = `Error invoking remote method '${channel}':`
  if (raw.startsWith(prefix)) return raw.slice(prefix.length).trim()
  return raw
}

function normalizeCompaniesDeleteError(error) {
  const message = extractIpcErrorMessage(error, 'companies:delete')
  if (message.includes('FOREIGN KEY constraint failed')) {
    return 'You cannot delete a company which is associated with an existing Opportunity.'
  }
  return message || 'Failed to delete company.'
}

const api = {
  version: 1,
  files: {
    getPathForFile: (file) => {
      try {
        return webUtils.getPathForFile(file)
      } catch {
        return null
      }
    },
  },
  fs: {
    homedir: () => ipcRenderer.invoke('fs:homedir'),
    readdir: (dirPath) => ipcRenderer.invoke('fs:readdir', dirPath),
    mkdirp: (dirPath) => ipcRenderer.invoke('fs:mkdirp', dirPath),
    createProjectStructure: (baseDirPath) => ipcRenderer.invoke('project:createStructure', baseDirPath),
    workspaceRoot: () => ipcRenderer.invoke('workspace:getRoot'),
    setWorkspaceRoot: (rootPath) => ipcRenderer.invoke('workspace:setRoot', { rootPath }),
    openWorkspaceRoot: () => ipcRenderer.invoke('workspace:openRoot'),
  },
  docs: {
    read: (relativePath) => ipcRenderer.invoke('docs:read', { relativePath }),
    write: ({ relativePath, content } = {}) => ipcRenderer.invoke('docs:write', { relativePath, content }),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    set: (payload) => ipcRenderer.invoke('settings:set', payload),
  },
  userSettings: {
    get: () => ipcRenderer.invoke('user-settings:get'),
    set: (payload) => ipcRenderer.invoke('user-settings:set', payload),
  },
  autofill: {
    previewFromFiles: ({ filePaths, context } = {}) =>
      ipcRenderer.invoke('autofill:previewFromFiles', { filePaths, context }),
    onPreviewStatus: (cb) => {
      const handler = (_event, payload) => cb?.(payload)
      ipcRenderer.on('autofill:preview:status', handler)
      return () => ipcRenderer.removeListener('autofill:preview:status', handler)
    },
  },
  projects: {
    list: () => ipcRenderer.invoke('projects:list'),
    upsertMany: (rows) => ipcRenderer.invoke('projects:upsertMany', { rows }),
    create: (payload) => ipcRenderer.invoke('projects:create', payload),
    delete: (projectId) => ipcRenderer.invoke('projects:delete', { projectId }),
  },
  events: {
    list: ({ limit } = {}) => ipcRenderer.invoke('events:list', { limit }),
    create: (payload) => ipcRenderer.invoke('events:create', payload),
    delete: (eventId) => ipcRenderer.invoke('events:delete', { eventId }),
  },
  history: {
    list: ({ limit } = {}) => ipcRenderer.invoke('history:list', { limit }),
    create: (payload) => ipcRenderer.invoke('history:create', payload),
    delete: (historyId) => ipcRenderer.invoke('history:delete', { historyId }),
  },
  'file-system': {
    list: () => ipcRenderer.invoke('file-system:list'),
    create: (payload) => ipcRenderer.invoke('file-system:create', payload),
    delete: (fileId) => ipcRenderer.invoke('file-system:delete', { fileId }),
  },
  companies: {
    list: () => ipcRenderer.invoke('companies:list'),
    create: (payload) => ipcRenderer.invoke('companies:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('companies:upsertMany', { rows }),
    delete: async (companyId) => {
      try {
        return await ipcRenderer.invoke('companies:delete', { companyId })
      } catch (error) {
        throw new Error(normalizeCompaniesDeleteError(error))
      }
    },
  },
  funds: {
    list: () => ipcRenderer.invoke('funds:list'),
    create: (payload) => ipcRenderer.invoke('funds:create', payload),
    delete: (fundId) => ipcRenderer.invoke('funds:delete', { fundId }),
  },
  rounds: {
    list: () => ipcRenderer.invoke('rounds:list'),
    create: (payload) => ipcRenderer.invoke('rounds:create', payload),
    delete: (roundId) => ipcRenderer.invoke('rounds:delete', { roundId }),
  },
  opportunities: {
    list: () => ipcRenderer.invoke('opportunities:list'),
    create: (payload) => ipcRenderer.invoke('opportunities:create', payload),
    update: (payload) => ipcRenderer.invoke('opportunities:update', payload),
    upsertMany: (rows) => ipcRenderer.invoke('opportunities:upsertMany', { rows }),
    delete: (opportunityId) => ipcRenderer.invoke('opportunities:delete', { opportunityId }),
  },
  records: {
    view: (tableName, recordId) => ipcRenderer.invoke('records:view', { tableName, recordId }),
    history: (tableName, recordId) => ipcRenderer.invoke('records:history', { tableName, recordId }),
    viewHistoryEntry: (snapshotId) => ipcRenderer.invoke('records:viewHistoryEntry', { snapshotId }),
    update: ({ tableName, recordId, changes, actionId, actionLabel } = {}) =>
      ipcRenderer.invoke('records:update', { tableName, recordId, changes, actionId, actionLabel }),
  },
  databooks: {
    view: (tableName, recordId) => ipcRenderer.invoke('records:view', { tableName, recordId }),
    versions: (tableName, recordId) => ipcRenderer.invoke('records:history', { tableName, recordId }),
    viewSnapshot: (snapshotId) => ipcRenderer.invoke('records:viewHistoryEntry', { snapshotId }),
    update: ({ tableName, recordId, changes, actionId, actionLabel } = {}) =>
      ipcRenderer.invoke('records:update', { tableName, recordId, changes, actionId, actionLabel }),
  },
  verification: {
    list: ({ tableName, recordId } = {}) =>
      ipcRenderer.invoke('verification:list', { tableName, recordId }),
    upsert: ({ tableName, recordId, fieldName, state, source, confidence, actionId, actionLabel } = {}) =>
      ipcRenderer.invoke('verification:upsert', {
        tableName,
        recordId,
        fieldName,
        state,
        source,
        confidence,
        actionId,
        actionLabel,
      }),
  },
  audit: {
    me: () => ipcRenderer.invoke('audit:me'),
    setUserLabel: (userLabel) => ipcRenderer.invoke('audit:setUserLabel', { userLabel }),
    events: (filters) => ipcRenderer.invoke('audit:events', filters),
    history: (filters) => ipcRenderer.invoke('audit:history', filters),
  },
  links: {
    openExternal: (url) => ipcRenderer.invoke('links:openExternal', { url }),
  },
  contacts: {
    list: () => ipcRenderer.invoke('contacts:list'),
    create: (payload) => ipcRenderer.invoke('contacts:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('contacts:upsertMany', { rows }),
    delete: (contactId) => ipcRenderer.invoke('contacts:delete', { contactId }),
  },
  users: {
    list: () => ipcRenderer.invoke('users:list'),
    create: (payload) => ipcRenderer.invoke('users:create', payload),
    delete: (userId) => ipcRenderer.invoke('users:delete', { userId }),
  },
  markets: {
    list: () => ipcRenderer.invoke('markets:list'),
    create: (payload) => ipcRenderer.invoke('markets:create', payload),
    delete: (marketId) => ipcRenderer.invoke('markets:delete', { marketId }),
  },
  securities: {
    list: () => ipcRenderer.invoke('securities:list'),
    create: (payload) => ipcRenderer.invoke('securities:create', payload),
    delete: (securityId) => ipcRenderer.invoke('securities:delete', { securityId }),
  },
  notes: {
    list: () => ipcRenderer.invoke('notes:list'),
    create: (payload) => ipcRenderer.invoke('notes:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('notes:upsertMany', { rows }),
    delete: (noteId) => ipcRenderer.invoke('notes:delete', { noteId }),
  },
  tasks: {
    list: () => ipcRenderer.invoke('tasks:list'),
    create: (payload) => ipcRenderer.invoke('tasks:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('tasks:upsertMany', { rows }),
    delete: (taskId) => ipcRenderer.invoke('tasks:delete', { taskId }),
  },
  roles: {
    list: () => ipcRenderer.invoke('roles:list'),
    create: (payload) => ipcRenderer.invoke('roles:create', payload),
    delete: (roleId) => ipcRenderer.invoke('roles:delete', { roleId }),
  },
  'companion-roles': {
    list: () => ipcRenderer.invoke('companion-roles:list'),
    create: (payload) => ipcRenderer.invoke('companion-roles:create', payload),
    delete: (companionRoleId) => ipcRenderer.invoke('companion-roles:delete', { companionRoleId }),
  },
  'bb-file': {
    list: () => ipcRenderer.invoke('bb-file:list'),
    create: (payload) => ipcRenderer.invoke('bb-file:create', payload),
    delete: (blockId) => ipcRenderer.invoke('bb-file:delete', { blockId }),
  },
  artifacts: {
    list: () => ipcRenderer.invoke('artifacts:list'),
    create: (payload) => ipcRenderer.invoke('artifacts:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('artifacts:upsertMany', { rows }),
    delete: (artifactId) => ipcRenderer.invoke('artifacts:delete', { artifactId }),
    download: ({ artifactId } = {}) => ipcRenderer.invoke('artifacts:download', { artifactId }),
    preview: ({ artifactId } = {}) => ipcRenderer.invoke('artifacts:preview', { artifactId }),
    share: ({ artifactId } = {}) => ipcRenderer.invoke('artifacts:share', { artifactId }),
    openRawFolder: () => ipcRenderer.invoke('artifacts:openRawFolder'),
    linkToOpportunity: ({ artifactIds, opportunityId, pipelineId } = {}) =>
      ipcRenderer.invoke('artifacts:linkToOpportunity', { artifactIds, opportunityId, pipelineId }),
    ingest: ({ filePaths, files, opportunityId, pipelineId, createdBy, duplicateStrategy } = {}) =>
      ipcRenderer.invoke('artifacts:ingest', {
        filePaths,
        files,
        opportunityId,
        pipelineId,
        createdBy,
        duplicateStrategy,
      }),
    onIngestStatus: (cb) => {
      const handler = (_event, payload) => cb?.(payload)
      ipcRenderer.on('artifacts:ingest:status', handler)
      return () => ipcRenderer.removeListener('artifacts:ingest:status', handler)
    },
  },
  intake: {
    list: () => ipcRenderer.invoke('intake:list'),
    create: (payload) => ipcRenderer.invoke('intake:create', payload),
    delete: (intakeId) =>
      ipcRenderer.invoke('intake:delete', { intakeId }),
  },
  db: {
    info: () => ipcRenderer.invoke('db:info'),
    query: (sql, params) => ipcRenderer.invoke('db:query', { sql, params }),
    execute: (sql, params) => ipcRenderer.invoke('db:execute', { sql, params }),
  },
  path: {
    sep: path.sep,
    dirname: (p) => path.dirname(p),
    join: (...parts) => path.join(...parts),
    normalize: (p) => path.normalize(p),
    parse: (p) => path.parse(p),
  },
}

api['user-roles'] = api.roles
api.ingestion = api.intake
api['artifacts-processed'] = api.intake
api.filesystem = api['file-system']

contextBridge.exposeInMainWorld('ecvc', api)
