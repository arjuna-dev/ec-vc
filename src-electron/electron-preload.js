import { contextBridge, ipcRenderer, webUtils } from 'electron'
import path from 'node:path'

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
    delete: (companyId) => ipcRenderer.invoke('companies:delete', { companyId }),
  },
  opportunities: {
    list: () => ipcRenderer.invoke('opportunities:list'),
    create: (payload) => ipcRenderer.invoke('opportunities:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('opportunities:upsertMany', { rows }),
    delete: (opportunityId) => ipcRenderer.invoke('opportunities:delete', { opportunityId }),
  },
  contacts: {
    list: () => ipcRenderer.invoke('contacts:list'),
    create: (payload) => ipcRenderer.invoke('contacts:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('contacts:upsertMany', { rows }),
    delete: (contactId) => ipcRenderer.invoke('contacts:delete', { contactId }),
  },
  artifacts: {
    list: () => ipcRenderer.invoke('artifacts:list'),
    upsertMany: (rows) => ipcRenderer.invoke('artifacts:upsertMany', { rows }),
    delete: (artifactId) => ipcRenderer.invoke('artifacts:delete', { artifactId }),
    ingest: ({ filePaths, files, opportunityId, pipelineId } = {}) =>
      ipcRenderer.invoke('artifacts:ingest', { filePaths, files, opportunityId, pipelineId }),
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
