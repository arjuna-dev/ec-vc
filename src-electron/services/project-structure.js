import path from 'node:path'
import fse from 'fs-extra'

export const DEFAULT_PROJECT_ROOT_NAME = 'ec-vc'

export const DEFAULT_PROJECT_STRUCTURE = {
  '0_company_docs': {},
  '1_pipelines': {
    pipeline_x: {
      active: {
        '1_thesis_alignment': {},
        '2_team_analysis': {},
        '3_investment_committee': {},
        '4_due_diligence': {},
        '5_closing_documents': {},
      },
      graveyard: {
        '1_thesis_alignment': {},
        '2_team_analysis': {},
        '3_investment_committee': {},
        '4_due_diligence': {},
        '5_closing_documents': {},
      },
      inbound: {
        '1_thesis_alignment': {
          '260128_NebulaAI_20M_SeriesA': {},
        },
        '2_team_analysis': {},
        '3_investment_committee': {},
        '4_due_diligence': {},
        '5_closing_documents': {},
      },
    },
  },
  '2_porftolio': {},
}

export async function createProjectStructure (baseDirPath, rootName = DEFAULT_PROJECT_ROOT_NAME, structure = DEFAULT_PROJECT_STRUCTURE) {
  const rootPath = path.join(baseDirPath, rootName)

  await fse.ensureDir(rootPath)

  const created = []

  async function ensureTree (parentPath, node) {
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
