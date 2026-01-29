import { contextBridge, ipcRenderer } from 'electron'
import path from 'node:path'

contextBridge.exposeInMainWorld('ecvc', {
  version: 1,
  fs: {
    homedir: () => ipcRenderer.invoke('fs:homedir'),
    readdir: (dirPath) => ipcRenderer.invoke('fs:readdir', dirPath),
    mkdirp: (dirPath) => ipcRenderer.invoke('fs:mkdirp', dirPath),
    createProjectStructure: (baseDirPath) => ipcRenderer.invoke('project:createStructure', baseDirPath),
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
