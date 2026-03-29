import path from 'node:path'
import fse from 'fs-extra'
import { getPipelinesSectionPath } from './workspace-structure.js'

const PIPELINE_BUCKETS = ['active', 'graveyard', 'inbound']

export async function mirrorPipelineToFs (workspaceRootPath, pipelineDirName, stageDirNames) {
  const pipelinesRoot = getPipelinesSectionPath(workspaceRootPath)
  const pipelineRoot = path.join(pipelinesRoot, pipelineDirName)

  await fse.ensureDir(pipelinesRoot)
  await fse.ensureDir(pipelineRoot)

  for (const bucket of PIPELINE_BUCKETS) {
    const bucketPath = path.join(pipelineRoot, bucket)
    await fse.ensureDir(bucketPath)

    for (const stageDirName of stageDirNames) {
      await fse.ensureDir(path.join(bucketPath, stageDirName))
    }
  }

  return { pipelineRoot }
}

export async function removePipelineFromFs (workspaceRootPath, pipelineDirName) {
  const pipelineRoot = path.join(getPipelinesSectionPath(workspaceRootPath), pipelineDirName)
  await fse.remove(pipelineRoot)
  return { pipelineRoot }
}

