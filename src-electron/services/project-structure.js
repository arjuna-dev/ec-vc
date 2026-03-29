import path from 'node:path'
import fse from 'fs-extra'
import {
  ARTIFACT_STAGE_DIRS,
  getArtifactsSectionPath,
  getNetworkDatabaseSectionDirName,
  getNetworkDatabaseSectionPath,
  getPipelinesSectionPath,
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
      [getNetworkDatabaseSectionDirName('Pipelines')]: {},
      [getNetworkDatabaseSectionDirName('Notes')]: {},
      [getNetworkDatabaseSectionDirName('Tasks')]: {},
      [getNetworkDatabaseSectionDirName('Agents')]: {},
    },
  },
}

async function removeDirectoryIfEmpty(dirPath) {
  if (!(await fse.pathExists(dirPath))) return
  const entries = await fse.readdir(dirPath)
  if (entries.length === 0) await fse.remove(dirPath)
}

async function moveDirectoryContents(sourceDir, destinationDir) {
  if (!(await fse.pathExists(sourceDir))) return

  await fse.ensureDir(destinationDir)

  for (const entryName of await fse.readdir(sourceDir)) {
    const sourcePath = path.join(sourceDir, entryName)
    const destinationPath = path.join(destinationDir, entryName)

    if (await fse.pathExists(destinationPath)) {
      const sourceStats = await fse.stat(sourcePath)
      const destinationStats = await fse.stat(destinationPath)
      if (sourceStats.isDirectory() && destinationStats.isDirectory()) {
        await moveDirectoryContents(sourcePath, destinationPath)
      }
      continue
    }

    await fse.move(sourcePath, destinationPath, { overwrite: false })
  }

  await removeDirectoryIfEmpty(sourceDir)
}

async function moveFileIfPresent(sourcePath, destinationPath) {
  if (!(await fse.pathExists(sourcePath))) return
  await fse.ensureDir(path.dirname(destinationPath))
  if (await fse.pathExists(destinationPath)) return
  await fse.move(sourcePath, destinationPath, { overwrite: false })
}

async function migrateLegacyWorkspaceStructure(rootPath) {
  const legacyCompanyDocsPath = path.join(rootPath, '0_company_docs')
  const legacyArtifactsPath = path.join(legacyCompanyDocsPath, 'Artifacts')
  const legacyPipelinesPath = path.join(rootPath, '1_pipelines')
  const legacyPortfolioPaths = [path.join(rootPath, '2_porftolio'), path.join(rootPath, '2_portfolio')]

  await moveDirectoryContents(legacyArtifactsPath, getArtifactsSectionPath(rootPath))
  await moveDirectoryContents(legacyCompanyDocsPath, getNetworkDatabaseSectionPath(rootPath, 'Company'))
  await moveDirectoryContents(legacyPipelinesPath, getPipelinesSectionPath(rootPath))
  await moveDirectoryContents(
    path.join(rootPath, USER_WORKSPACE_DIR, NETWORK_DATABASES_DIR, 'Contacts'),
    getNetworkDatabaseSectionPath(rootPath, 'Contacts'),
  )
  await moveDirectoryContents(
    path.join(rootPath, USER_WORKSPACE_DIR, NETWORK_DATABASES_DIR, 'Company'),
    getNetworkDatabaseSectionPath(rootPath, 'Company'),
  )
  await moveDirectoryContents(
    path.join(rootPath, USER_WORKSPACE_DIR, NETWORK_DATABASES_DIR, 'Companies'),
    getNetworkDatabaseSectionPath(rootPath, 'Company'),
  )
  await moveDirectoryContents(
    path.join(rootPath, USER_WORKSPACE_DIR, NETWORK_DATABASES_DIR, 'Opportunities'),
    getNetworkDatabaseSectionPath(rootPath, 'Opportunities'),
  )
  await moveDirectoryContents(
    path.join(rootPath, USER_WORKSPACE_DIR, NETWORK_DATABASES_DIR, 'Pipelines'),
    getNetworkDatabaseSectionPath(rootPath, 'Pipelines'),
  )
  await moveDirectoryContents(
    path.join(rootPath, USER_WORKSPACE_DIR, NETWORK_DATABASES_DIR, 'Notes'),
    getNetworkDatabaseSectionPath(rootPath, 'Notes'),
  )
  await moveDirectoryContents(
    path.join(rootPath, USER_WORKSPACE_DIR, NETWORK_DATABASES_DIR, 'Tasks'),
    getNetworkDatabaseSectionPath(rootPath, 'Tasks'),
  )
  await moveDirectoryContents(
    path.join(rootPath, USER_WORKSPACE_DIR, NETWORK_DATABASES_DIR, 'Artifacts'),
    getNetworkDatabaseSectionPath(rootPath, 'Artifacts'),
  )
  await moveFileIfPresent(
    path.join(rootPath, USER_WORKSPACE_DIR, '02_Users.xlsx'),
    path.join(getNetworkDatabaseSectionPath(rootPath, 'Users'), '1. Users.xlsx'),
  )

  for (const legacyPortfolioPath of legacyPortfolioPaths) {
    await moveDirectoryContents(
      legacyPortfolioPath,
      getNetworkDatabaseSectionPath(rootPath, 'Opportunities'),
    )
  }

  await removeDirectoryIfEmpty(legacyCompanyDocsPath)
  await removeDirectoryIfEmpty(legacyPipelinesPath)
  for (const legacyPortfolioPath of legacyPortfolioPaths) {
    await removeDirectoryIfEmpty(legacyPortfolioPath)
  }
}

export async function createProjectStructure(
  baseDirPath,
  rootName = DEFAULT_PROJECT_ROOT_NAME,
  structure = DEFAULT_PROJECT_STRUCTURE,
) {
  const rootPath = path.join(baseDirPath, rootName)

  await fse.ensureDir(rootPath)
  await migrateLegacyWorkspaceStructure(rootPath)

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
