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
  },
  pipelines: {
    list: () => ipcRenderer.invoke('pipelines:list'),
    install: (pipelineId) => ipcRenderer.invoke('pipelines:install', { pipelineId }),
    uninstall: (pipelineId) => ipcRenderer.invoke('pipelines:uninstall', { pipelineId }),
    upsertMany: (rows) => ipcRenderer.invoke('pipelines:upsertMany', { rows }),
    create: (payload) => ipcRenderer.invoke('pipelines:create', payload),
    delete: (pipelineId) => ipcRenderer.invoke('pipelines:delete', { pipelineId }),
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
    update: ({ tableName, recordId, changes } = {}) =>
      ipcRenderer.invoke('databooks:update', { tableName, recordId, changes }),
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
  assistants: {
    list: () => ipcRenderer.invoke('assistants:list'),
  },
  artifacts: {
    list: () => ipcRenderer.invoke('artifacts:list'),
    upsertMany: (rows) => ipcRenderer.invoke('artifacts:upsertMany', { rows }),
    delete: (artifactId) => ipcRenderer.invoke('artifacts:delete', { artifactId }),
    download: ({ artifactId } = {}) => ipcRenderer.invoke('artifacts:download', { artifactId }),
    preview: ({ artifactId } = {}) => ipcRenderer.invoke('artifacts:preview', { artifactId }),
    share: ({ artifactId } = {}) => ipcRenderer.invoke('artifacts:share', { artifactId }),
    linkToOpportunity: ({ artifactIds, opportunityId, pipelineId } = {}) =>
      ipcRenderer.invoke('artifacts:linkToOpportunity', { artifactIds, opportunityId, pipelineId }),
    ingest: ({ filePaths, files, opportunityId, pipelineId, createdBy } = {}) =>
      ipcRenderer.invoke('artifacts:ingest', { filePaths, files, opportunityId, pipelineId, createdBy }),
    onIngestStatus: (cb) => {
      const handler = (_event, payload) => cb?.(payload)
      ipcRenderer.on('artifacts:ingest:status', handler)
      return () => ipcRenderer.removeListener('artifacts:ingest:status', handler)
    },
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
