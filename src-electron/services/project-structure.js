import path from 'node:path'
import fse from 'fs-extra'

export const DEFAULT_PROJECT_ROOT_NAME = 'ec-vc'

export const DEFAULT_PROJECT_STRUCTURE = {
  '00_dealflow': ['inbox', 'screening', 'rejected'],
  '01_diligence': ['market', 'product', 'financials'],
  '02_outputs': ['memos', 'models', 'exports'],
}

export async function createProjectStructure (baseDirPath, rootName = DEFAULT_PROJECT_ROOT_NAME, structure = DEFAULT_PROJECT_STRUCTURE) {
  const rootPath = path.join(baseDirPath, rootName)

  await fse.ensureDir(rootPath)

  const created = []
  for (const [parent, children] of Object.entries(structure)) {
    const parentPath = path.join(rootPath, parent)
    await fse.ensureDir(parentPath)
    created.push(parentPath)

    for (const child of children) {
      const childPath = path.join(parentPath, child)
      await fse.ensureDir(childPath)
      created.push(childPath)
    }
  }

  return { rootPath, created }
}
