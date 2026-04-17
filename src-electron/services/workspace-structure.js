import path from 'node:path'

export const OWNER_ROOT_DIR = 'Owner'
export const OWNER_FILES_DIR = 'Owner Files'
export const AUXILIARY_FILES_DIR = 'Auxiliary Files'
export const ACTIVE_DIR = 'Active'
export const ARCHIVED_DIR = 'Archived'
export const ARTIFACTS_DIR = 'Artifacts'
export const ARTIFACT_STAGE_DIRS = ['0_raw', '1_llm-ready', '2_llm-generated']

export function getOwnerPath(workspaceRootPath) {
  return path.join(workspaceRootPath, OWNER_ROOT_DIR)
}

export function getOwnerFilesPath(workspaceRootPath) {
  return path.join(getOwnerPath(workspaceRootPath), OWNER_FILES_DIR)
}

export function getAuxiliaryFilesPath(workspaceRootPath) {
  return path.join(getOwnerPath(workspaceRootPath), AUXILIARY_FILES_DIR)
}

export function getOwnerFilesActivePath(workspaceRootPath) {
  return path.join(getOwnerFilesPath(workspaceRootPath), ACTIVE_DIR)
}

export function getOwnerFilesArchivedPath(workspaceRootPath) {
  return path.join(getOwnerFilesPath(workspaceRootPath), ARCHIVED_DIR)
}

export function getAuxiliaryFilesActivePath(workspaceRootPath) {
  return path.join(getAuxiliaryFilesPath(workspaceRootPath), ACTIVE_DIR)
}

export function getAuxiliaryFilesArchivedPath(workspaceRootPath) {
  return path.join(getAuxiliaryFilesPath(workspaceRootPath), ARCHIVED_DIR)
}

export function getArtifactsPath(workspaceRootPath) {
  return path.join(getOwnerFilesActivePath(workspaceRootPath), ARTIFACTS_DIR)
}

export function getArtifactRawPath(workspaceRootPath) {
  return path.join(getArtifactsPath(workspaceRootPath), ARTIFACT_STAGE_DIRS[0])
}

export function getArtifactLlmReadyPath(workspaceRootPath) {
  return path.join(getArtifactsPath(workspaceRootPath), ARTIFACT_STAGE_DIRS[1])
}
