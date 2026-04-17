import path from 'node:path'
import fse from 'fs-extra'
import {
  ACTIVE_DIR,
  ARCHIVED_DIR,
  ARTIFACT_STAGE_DIRS,
  ARTIFACTS_DIR,
  AUXILIARY_FILES_DIR,
  OWNER_FILES_DIR,
  OWNER_ROOT_DIR,
} from './workspace-structure.js'

export const DEFAULT_PROJECT_ROOT_NAME = 'ec-vc'

export const DEFAULT_PROJECT_STRUCTURE = {
  [OWNER_ROOT_DIR]: {
    [OWNER_FILES_DIR]: {
      [ACTIVE_DIR]: {
        [ARTIFACTS_DIR]: {
          [ARTIFACT_STAGE_DIRS[0]]: {},
          [ARTIFACT_STAGE_DIRS[1]]: {},
          [ARTIFACT_STAGE_DIRS[2]]: {},
        },
      },
      [ARCHIVED_DIR]: {},
    },
    [AUXILIARY_FILES_DIR]: {
      [ACTIVE_DIR]: {},
      [ARCHIVED_DIR]: {},
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
