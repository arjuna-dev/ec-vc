import path from 'node:path'

export const USER_WORKSPACE_DIR = 'User'
export const NETWORK_DATABASES_DIR = 'WORKSPACE FILES'
export const NETWORK_DATABASE_SECTION_DIRS = [
  'Contacts',
  'Company',
  'Opportunities',
  'Pipelines',
  'Notes',
  'Tasks',
  'Artifacts',
]
export const ARTIFACTS_SECTION_DIR = 'Artifacts'
export const PIPELINES_SECTION_DIR = 'Pipelines'
export const ARTIFACT_STAGE_DIRS = ['0_raw', '1_llm-ready', '2_llm-generated']

export function getUserWorkspacePath(workspaceRootPath) {
  return path.join(workspaceRootPath, USER_WORKSPACE_DIR)
}

export function getNetworkDatabasesPath(workspaceRootPath) {
  return path.join(getUserWorkspacePath(workspaceRootPath), NETWORK_DATABASES_DIR)
}

export function getNetworkDatabaseSectionPath(workspaceRootPath, sectionName) {
  return path.join(getNetworkDatabasesPath(workspaceRootPath), sectionName)
}

export function getArtifactsSectionPath(workspaceRootPath) {
  return getNetworkDatabaseSectionPath(workspaceRootPath, ARTIFACTS_SECTION_DIR)
}

export function getArtifactRawPath(workspaceRootPath) {
  return path.join(getArtifactsSectionPath(workspaceRootPath), ARTIFACT_STAGE_DIRS[0])
}

export function getArtifactLlmReadyPath(workspaceRootPath) {
  return path.join(getArtifactsSectionPath(workspaceRootPath), ARTIFACT_STAGE_DIRS[1])
}

export function getPipelinesSectionPath(workspaceRootPath) {
  return getNetworkDatabaseSectionPath(workspaceRootPath, PIPELINES_SECTION_DIR)
}
