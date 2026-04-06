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

contextBridge.exposeInMainWorld('ecvc', {
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
    install: (projectId) => ipcRenderer.invoke('projects:install', { projectId }),
    uninstall: (projectId) => ipcRenderer.invoke('projects:uninstall', { projectId }),
    upsertMany: (rows) => ipcRenderer.invoke('projects:upsertMany', { rows }),
    create: (payload) => ipcRenderer.invoke('projects:create', payload),
    delete: (projectId) => ipcRenderer.invoke('projects:delete', { projectId }),
  },
  pipelines: {
    list: () => ipcRenderer.invoke('projects:list'),
    install: (pipelineId) => ipcRenderer.invoke('projects:install', { projectId: pipelineId }),
    uninstall: (pipelineId) => ipcRenderer.invoke('projects:uninstall', { projectId: pipelineId }),
    upsertMany: (rows) => ipcRenderer.invoke('projects:upsertMany', { rows }),
    create: (payload) => ipcRenderer.invoke('projects:create', payload),
    delete: (pipelineId) => ipcRenderer.invoke('projects:delete', { projectId: pipelineId }),
  },
  events: {
    list: ({ limit } = {}) => ipcRenderer.invoke('events:list', { limit }),
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
    create: (payload) => ipcRenderer.invoke('funds:create', payload),
  },
  rounds: {
    create: (payload) => ipcRenderer.invoke('rounds:create', payload),
  },
  opportunities: {
    list: () => ipcRenderer.invoke('opportunities:list'),
    create: (payload) => ipcRenderer.invoke('opportunities:create', payload),
    update: (payload) => ipcRenderer.invoke('opportunities:update', payload),
    upsertMany: (rows) => ipcRenderer.invoke('opportunities:upsertMany', { rows }),
    delete: (opportunityId) => ipcRenderer.invoke('opportunities:delete', { opportunityId }),
  },
  databooks: {
    view: (tableName, recordId) => ipcRenderer.invoke('databooks:view', { tableName, recordId }),
    versions: (tableName, recordId) => ipcRenderer.invoke('databooks:versions', { tableName, recordId }),
    viewSnapshot: (snapshotId) => ipcRenderer.invoke('databooks:viewSnapshot', { snapshotId }),
    update: ({ tableName, recordId, changes, actionId, actionLabel } = {}) =>
      ipcRenderer.invoke('databooks:update', { tableName, recordId, changes, actionId, actionLabel }),
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
  industries: {
    list: () => ipcRenderer.invoke('industries:list'),
    create: (payload) => ipcRenderer.invoke('industries:create', payload),
    delete: (industryId) => ipcRenderer.invoke('industries:delete', { industryId }),
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
  artifacts: {
    list: () => ipcRenderer.invoke('artifacts:list'),
    create: (payload) => ipcRenderer.invoke('artifacts:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('artifacts:upsertMany', { rows }),
    delete: (artifactId) => ipcRenderer.invoke('artifacts:delete', { artifactId }),
    download: ({ artifactId } = {}) => ipcRenderer.invoke('artifacts:download', { artifactId }),
    preview: ({ artifactId } = {}) => ipcRenderer.invoke('artifacts:preview', { artifactId }),
    share: ({ artifactId } = {}) => ipcRenderer.invoke('artifacts:share', { artifactId }),
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
  'artifacts-processed': {
    list: () => ipcRenderer.invoke('artifacts-processed:list'),
    create: (payload) => ipcRenderer.invoke('artifacts-processed:create', payload),
    delete: (processedArtifactId) =>
      ipcRenderer.invoke('artifacts-processed:delete', { processedArtifactId }),
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
})
