import path from 'node:path'
import fse from 'fs-extra'
import {
  ARTIFACT_STAGE_DIRS,
  getNetworkDatabaseSectionDirName,
  NETWORK_DATABASES_DIR,
  USER_WORKSPACE_DIR,
} from './workspace-structure.js'

export const DEFAULT_PROJECT_ROOT_NAME = 'ec-vc'

export const DEFAULT_PROJECT_STRUCTURE = {
  [USER_WORKSPACE_DIR]: {
    [NETWORK_DATABASES_DIR]: {
      [getNetworkDatabaseSectionDirName('Users')]: {},
      [getNetworkDatabaseSectionDirName('Artifacts')]: {
        [ARTIFACT_STAGE_DIRS[0]]: {},
        [ARTIFACT_STAGE_DIRS[1]]: {},
        [ARTIFACT_STAGE_DIRS[2]]: {},
      },
      [getNetworkDatabaseSectionDirName('Contacts')]: {},
      [getNetworkDatabaseSectionDirName('Company')]: {},
      [getNetworkDatabaseSectionDirName('Opportunities')]: {},
      [getNetworkDatabaseSectionDirName('Projects')]: {},
      [getNetworkDatabaseSectionDirName('Notes')]: {},
      [getNetworkDatabaseSectionDirName('Tasks')]: {},
      [getNetworkDatabaseSectionDirName('Agents')]: {},
    },
  },
}

export async function createProjectStructure(
  baseDirPath,
  rootName = DEFAULT_PROJECT_ROOT_NAME,
  structure = DEFAULT_PROJECT_STRUCTURE,
) {
  const rootPath = path.join(baseDirPath, rootName)

  await fse.ensureDir(rootPath)

  const created = []

  async function ensureTree(parentPath, node) {
    if (!node) return

    if (Array.isArray(node)) {
      for (const childName of node) {
        const childPath = path.join(parentPath, childName)
        await fse.ensureDir(childPath)
        created.push(childPath)
      }
      return
    }

    if (typeof node === 'object') {
      for (const [childName, childNode] of Object.entries(node)) {
        const childPath = path.join(parentPath, childName)
        await fse.ensureDir(childPath)
        created.push(childPath)
        await ensureTree(childPath, childNode)
      }
    }
  }

  await ensureTree(rootPath, structure)

  return { rootPath, created }
}
