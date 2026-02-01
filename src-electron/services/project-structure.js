import path from 'node:path'
import fse from 'fs-extra'

export const DEFAULT_PROJECT_ROOT_NAME = 'ec-vc'

export const DEFAULT_PROJECT_STRUCTURE = {
  '0_company_docs': {
    Artifacts: {
      '0_raw': {},
      '1_llm-ready': {},
      '2_llm-generated': {},
    },
  },
  '1_pipelines': {},
  '2_porftolio': {},
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
