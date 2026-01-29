import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import fse from 'fs-extra'

import { app, BrowserWindow, ipcMain } from 'electron'
import { createProjectStructure, DEFAULT_PROJECT_ROOT_NAME } from './services/project-structure.js'
import { closeDb, dbAll, dbRun, getDbInfo, initDb } from './services/sqlite-db.js'
import { mirrorPipelineToFs, removePipelineFromFs } from './services/pipeline-mirror.js'

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

const currentDir = fileURLToPath(new URL('.', import.meta.url))

let mainWindow

async function ensureWorkspace() {
  const baseDirPath = app.getPath('userData')
  return createProjectStructure(baseDirPath, DEFAULT_PROJECT_ROOT_NAME, undefined)
}

function listPipelines() {
  return dbAll(
    `
    SELECT pipeline_id, name, dir_name, is_default, install_status, install_error
    FROM Pipelines
    ORDER BY is_default DESC, name ASC
  `,
  )
}

async function installPipeline(pipelineId) {
  const workspace = await ensureWorkspace()

  const pipeline = dbAll(
    'SELECT pipeline_id, name, dir_name, install_status FROM Pipelines WHERE pipeline_id = ? LIMIT 1',
    [pipelineId],
  )?.[0]
  if (!pipeline) throw new Error(`Unknown pipeline: ${pipelineId}`)
  if (pipeline.install_status === 'installed') return { ok: true }

  dbRun(
    "UPDATE Pipelines SET install_status = 'installing', install_error = NULL, updated_at = datetime('now') WHERE pipeline_id = ?",
    [pipelineId],
  )

  const stages = dbAll(
    'SELECT name FROM Pipeline_Stages WHERE pipeline_id = ? ORDER BY position ASC',
    [pipelineId],
  ).map((r) => r.name)

  try {
    await mirrorPipelineToFs(workspace.rootPath, pipeline.dir_name, stages)
    dbRun(
      "UPDATE Pipelines SET install_status = 'installed', installed_at = datetime('now'), uninstalled_at = NULL, updated_at = datetime('now') WHERE pipeline_id = ?",
      [pipelineId],
    )
    return { ok: true }
  } catch (e) {
    dbRun(
      "UPDATE Pipelines SET install_status = 'error', install_error = ?, updated_at = datetime('now') WHERE pipeline_id = ?",
      [e?.message || String(e), pipelineId],
    )
    throw e
  }
}

async function uninstallPipeline(pipelineId) {
  const workspace = await ensureWorkspace()

  const pipeline = dbAll(
    'SELECT pipeline_id, name, dir_name, install_status FROM Pipelines WHERE pipeline_id = ? LIMIT 1',
    [pipelineId],
  )?.[0]
  if (!pipeline) throw new Error(`Unknown pipeline: ${pipelineId}`)
  if (pipeline.install_status === 'not_installed') return { ok: true }

  dbRun(
    "UPDATE Pipelines SET install_status = 'uninstalling', install_error = NULL, updated_at = datetime('now') WHERE pipeline_id = ?",
    [pipelineId],
  )

  try {
    await removePipelineFromFs(workspace.rootPath, pipeline.dir_name)
    dbRun(
      "UPDATE Pipelines SET install_status = 'not_installed', uninstalled_at = datetime('now'), updated_at = datetime('now') WHERE pipeline_id = ?",
      [pipelineId],
    )
    return { ok: true }
  } catch (e) {
    dbRun(
      "UPDATE Pipelines SET install_status = 'error', install_error = ?, updated_at = datetime('now') WHERE pipeline_id = ?",
      [e?.message || String(e), pipelineId],
    )
    throw e
  }
}

function registerIpc() {
  ipcMain.handle('fs:homedir', () => os.homedir())

  ipcMain.handle('fs:readdir', async (_event, dirPath) => {
    const resolvedPath = path.resolve(String(dirPath || ''))

    const dirents = await fs.readdir(resolvedPath, { withFileTypes: true })
    const entries = dirents
      .filter((d) => !d.name.startsWith('.'))
      .map((d) => {
        const entryPath = path.join(resolvedPath, d.name)
        return {
          name: d.name,
          path: entryPath,
          type: d.isDirectory() ? 'directory' : d.isFile() ? 'file' : 'other',
        }
      })
      .sort((a, b) => {
        if (a.type !== b.type) {
          if (a.type === 'directory') return -1
          if (b.type === 'directory') return 1
        }
        return a.name.localeCompare(b.name)
      })

    return { path: resolvedPath, entries }
  })

  ipcMain.handle('fs:mkdirp', async (_event, dirPath) => {
    const resolvedPath = path.resolve(String(dirPath || ''))
    await fse.ensureDir(resolvedPath)
    return { path: resolvedPath }
  })

  ipcMain.handle('project:createStructure', async (_event, baseDirPath) => {
    const resolvedBase = path.resolve(String(baseDirPath || ''))
    return createProjectStructure(resolvedBase)
  })

  ipcMain.handle('workspace:getRoot', async () => {
    const result = await ensureWorkspace()
    return { rootPath: result.rootPath }
  })

  ipcMain.handle('pipelines:list', async () => {
    initDb()
    return { pipelines: listPipelines() }
  })

  ipcMain.handle('pipelines:install', async (_event, { pipelineId } = {}) => {
    initDb()
    return installPipeline(String(pipelineId || ''))
  })

  ipcMain.handle('pipelines:uninstall', async (_event, { pipelineId } = {}) => {
    initDb()
    return uninstallPipeline(String(pipelineId || ''))
  })

  ipcMain.handle('db:info', () => getDbInfo())

  ipcMain.handle('db:query', (_event, { sql, params } = {}) => {
    return dbAll(sql, params)
  })

  ipcMain.handle('db:execute', (_event, { sql, params } = {}) => {
    return dbRun(sql, params)
  })
}

async function createWindow() {
  /**
   * Initial window options
   */
  const preloadFolder = process.env.QUASAR_ELECTRON_PRELOAD_FOLDER || 'preload'
  const preloadExt = process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION || '.cjs'

  mainWindow = new BrowserWindow({
    icon: path.resolve(currentDir, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      // More info: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.resolve(currentDir, path.join(preloadFolder, 'electron-preload' + preloadExt)),
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL) => {
      console.error('[did-fail-load]', { errorCode, errorDescription, validatedURL })
    },
  )

  if (process.env.DEV) {
    await mainWindow.loadURL(process.env.APP_URL)
  } else {
    await mainWindow.loadFile(path.resolve(currentDir, 'index.html'))
  }

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools()
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  initDb()
  registerIpc()
  ensureWorkspace()
  return createWindow()
})

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    closeDb()
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('before-quit', () => {
  closeDb()
})
