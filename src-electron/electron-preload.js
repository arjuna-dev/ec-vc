import { contextBridge, ipcRenderer } from 'electron'
import path from 'node:path'

contextBridge.exposeInMainWorld('ecvc', {
  version: 1,
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
  },
  companies: {
    list: () => ipcRenderer.invoke('companies:list'),
    create: (payload) => ipcRenderer.invoke('companies:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('companies:upsertMany', { rows }),
  },
  opportunities: {
    list: () => ipcRenderer.invoke('opportunities:list'),
    create: (payload) => ipcRenderer.invoke('opportunities:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('opportunities:upsertMany', { rows }),
  },
  contacts: {
    list: () => ipcRenderer.invoke('contacts:list'),
    create: (payload) => ipcRenderer.invoke('contacts:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('contacts:upsertMany', { rows }),
  },
  funds: {
    list: () => ipcRenderer.invoke('funds:list'),
    create: (payload) => ipcRenderer.invoke('funds:create', payload),
    upsertMany: (rows) => ipcRenderer.invoke('funds:upsertMany', { rows }),
  },
  artifacts: {
    list: () => ipcRenderer.invoke('artifacts:list'),
    upsertMany: (rows) => ipcRenderer.invoke('artifacts:upsertMany', { rows }),
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
