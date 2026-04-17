import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'
import fse from 'fs-extra'
import isEmail from 'validator/lib/isEmail.js'

import { app, BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron'
import { createProjectStructure, DEFAULT_PROJECT_ROOT_NAME } from './services/project-structure.js'
import { closeDb, dbAll, dbRun, getDbInfo, initDb } from './services/sqlite-db.js'
import { ingestArtifactsFromPaths } from './services/artifact-ingestion.js'
import { getArtifactRawPath } from './services/workspace-structure.js'
import { previewAutofillFromFiles } from './services/autofill-extraction.js'
import {
  getNetworkDatabasesPath,
  NETWORK_DATABASES_DIR,
  NETWORK_DATABASE_SECTION_DIRS,
  USER_WORKSPACE_DIR,
} from './services/workspace-structure.js'
import {
  getGenericLdbRelationshipTableName,
  getLdbRelationshipContractForToken,
  getLdbRelationshipContractsForEntity,
  isDirectLdbRelationshipContract,
  isGenericLdbRelationshipContract,
} from '../src/shared/ldbRelationshipContracts.js'
import { formatSharedDisplayLabel } from '../src/shared/labelFormatting.js'
import { DEFAULT_BUILDING_BLOCK_FILE_ROWS } from '../src/utils/buildingBlocks.js'
import { FILE_PAGE_REGISTRY, getCreateBranches, getViewForks } from '../src/utils/structureRegistry.js'

const APP_DISPLAY_NAME = 'EC VC'

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

const currentDir = fileURLToPath(new URL('.', import.meta.url))

let mainWindow
const repoRootPath = path.resolve(currentDir, '..', '..')

if (app.getName() !== APP_DISPLAY_NAME) {
  app.setName(APP_DISPLAY_NAME)
}

function resolveRepoMarkdownPath(relativePath) {
  const raw = String(relativePath || '').trim()
  if (!raw) throw new Error('Document path is required.')

  const normalized = path.normalize(raw)
  const resolved = path.resolve(repoRootPath, normalized)
  const relativeFromRepo = path.relative(repoRootPath, resolved)
  const isInsideRepo =
    relativeFromRepo && !relativeFromRepo.startsWith('..') && !path.isAbsolute(relativeFromRepo)

  if (!isInsideRepo) throw new Error('Document path must stay inside the repository root.')
  if (path.extname(resolved).toLowerCase() !== '.md') {
    throw new Error('Only markdown documents can be edited through this surface.')
  }

  return resolved
}

function compareWorkspaceEntries(a, b, orderMap = null) {
  if (a.type !== b.type) {
    if (a.type === 'directory') return -1
    if (b.type === 'directory') return 1
  }

  if (orderMap && a.type === 'directory' && b.type === 'directory') {
    const aRank = orderMap.get(a.name)
    const bRank = orderMap.get(b.name)
    const hasARank = aRank !== undefined
    const hasBRank = bRank !== undefined

    if (hasARank && hasBRank && aRank !== bRank) return aRank - bRank
    if (hasARank !== hasBRank) return hasARank ? -1 : 1
  }

  return a.name.localeCompare(b.name)
}

async function ensureWorkspace() {
  const database = initDb()
  const overrideRoot = normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.workspaceRoot))
  const baseDirPath = overrideRoot ? path.dirname(overrideRoot) : app.getPath('userData')
  const rootName = overrideRoot ? path.basename(overrideRoot) : DEFAULT_PROJECT_ROOT_NAME
  return createProjectStructure(baseDirPath, rootName, undefined)
}

async function syncWorkspaceWorkbooksSafe() {}

function listProjects() {
  return dbAll(
    `
    SELECT 
      p.id,
      p.Project_Name,
      p.created_by,
      p.created_at,
      p.updated_at
    FROM Projects p
    ORDER BY p.Project_Name ASC
    `,
  ).map((row) => ({
    ...row,
    name: row.Project_Name,
  }))
}

function upsertProjects(rows = []) {
  const database = initDb()
  const input = Array.isArray(rows) ? rows : []

  const tx = database.transaction(() => {
    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const r of input) {
      const projectId =
        normalizeNullableString(r?.project_id) ||
        `project:${crypto.randomUUID()}`
      const name = normalizeNullableString(r?.name)
      if (!name) {
        skipped++
        continue
      }

      const exists = database
        .prepare('SELECT 1 FROM Projects WHERE id = ? LIMIT 1')
        .get(projectId)

      database
        .prepare(
          `
          INSERT INTO Projects (id, Project_Name, created_at, updated_at)
          VALUES (@project_id, @Project_Name, datetime('now'), datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            Project_Name = excluded.Project_Name,
            updated_at = datetime('now')
        `,
        )
        .run({
          project_id: projectId,
          Project_Name: name,
        })

      database
        .prepare(
          `
          INSERT INTO Project_Overview (project_id, created_at, updated_at)
          VALUES (?, datetime('now'), datetime('now'))
          ON CONFLICT(project_id) DO NOTHING
        `,
        )
        .run(projectId)

      if (exists) updated++
      else inserted++
    }

    return { inserted, updated, skipped }
  })

  return tx()
}

function createProject(payload = {}) {
  const database = initDb()
  const actor = getAuditActor(database)
  const name =
    normalizeNullableString(payload.Project_Name) ||
    normalizeNullableString(payload.name)
  if (!name) throw new Error('Project name is required')

  const projectId =
    normalizeNullableString(payload.project_id) ||
    `project:${crypto.randomUUID()}`

  const tx = database.transaction(() => {
    database
      .prepare(
        `
        INSERT INTO Projects (id, created_by, Project_Name, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `,
      )
      .run(
        projectId,
        normalizeNullableString(payload?.created_by) || actor.user_id,
        name,
      )

    database
      .prepare(
        `
        INSERT INTO Project_Overview (project_id, created_at, updated_at)
        VALUES (?, datetime('now'), datetime('now'))
      `,
      )
      .run(projectId)
  })

  tx()

  return { id: projectId }
}

function listCompanies() {
  return dbAll(
    `
    SELECT
      c.id,
      c.Company_Name,
      c.Short_Name,
      c.Website,
      c.One_Liner,
      c.Description,
      c.Notable_News,
      c.Updates,
      c.created_by,
      c.created_at,
      c.updated_at,
      cii.Company_Type,
      cii.Legal_Entity,
      cii.Date_of_Incorporation,
      cii.incorporation_country,
      cii.Incorporation_Type,
      coo.Company_Stage,
      coo.Status,
      coo.headquarters_city,
      coo.PAX_Count,
      coo.PAX_Known
    FROM Companies c
    LEFT JOIN Company_Incorporation_Info cii ON cii.company_id = c.id
    LEFT JOIN Company_Operations_Overview coo ON coo.company_id = c.id
    WHERE c.Company_Name IS NOT NULL AND c.Company_Name <> ''
    ORDER BY c.Company_Name ASC
  `,
  )
}

function normalizeCompanyType(database, value) {
  const candidate = normalizeNullableString(value)
  if (!candidate) return null
  const allowed = [
    'Venture',
    'Corporation',
    'Asset Manager',
    'Academia',
    'Government',
    'Other',
  ]
  return allowed.find((item) => item.toLowerCase() === candidate.toLowerCase()) || null
}

function normalizeCompanyStage(value) {
  const candidate = normalizeNullableString(value)
  if (!candidate) return null
  const normalized = candidate.toLowerCase()
  return ['early', 'mid', 'late'].includes(normalized) ? normalized : null
}

function normalizeNullableIntegerId(value) {
  const numberValue = normalizeNullableNumber(value)
  if (numberValue == null) return null
  const intValue = Math.trunc(numberValue)
  return intValue > 0 ? intValue : null
}

function normalizeTaskStatus(value) {
  const candidate = normalizeNullableString(value)
  if (!candidate) return null
  const normalized = candidate.trim().toLowerCase()
  const allowed = new Map([
    ['backlog', 'Backlog'],
    ['in progress', 'In Progress'],
    ['in_progress', 'In Progress'],
    ['completed', 'Completed'],
    ['closed', 'Closed'],
  ])
  return allowed.get(normalized) || null
}

function normalizeCompanyStatus(value) {
  const candidate = normalizeNullableString(value)
  if (!candidate) return null
  const normalized = candidate.trim().toLowerCase()
  const allowed = new Map([
    ['ongoing', 'ongoing'],
    ['active', 'ongoing'],
    ['open', 'ongoing'],
    ['operating', 'ongoing'],
    ['live', 'ongoing'],
    ['current', 'ongoing'],
    ['closed', 'closed'],
    ['inactive', 'closed'],
    ['shutdown', 'closed'],
    ['shut down', 'closed'],
    ['terminated', 'closed'],
    ['ended', 'closed'],
  ])
  return allowed.get(normalized) || null
}

function normalizeTaskPriorityRank(value) {
  const candidate = normalizeNullableString(value)
  if (!candidate) return null
  const normalized = candidate.trim().toLowerCase()
  const allowed = new Map([
    ['low', 'Low'],
    ['mid-low', 'Mid-Low'],
    ['mid low', 'Mid-Low'],
    ['mid', 'Mid'],
    ['mid-high', 'Mid-High'],
    ['mid high', 'Mid-High'],
    ['high', 'High'],
  ])
  return allowed.get(normalized) || null
}

function normalizeTaskContactIds(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value]
  return [...new Set(values.map((entry) => normalizeNullableString(entry)).filter(Boolean))]
}

function upsertTaskOverview(database, taskId, source = {}) {
  const payload = {
    task_id: taskId,
    Task_Summary:
      normalizeNullableString(source.Task_Summary) ||
      normalizeNullableString(source.Task_Description) ||
      normalizeNullableString(source.Task_Summary_Text),
    Task_Status: normalizeTaskStatus(source.Task_Status || source.Status) || 'Backlog',
    Task_Priority_Rank:
      normalizeTaskPriorityRank(source.Task_Priority_Rank || source.Priority) || 'Mid',
    Task_Start_Date: normalizeNullableString(source.Task_Start_Date || source.Start_Date),
    Task_Due_Date: normalizeNullableString(source.Task_Due_Date || source.Due_Date),
    Task_End_Date: normalizeNullableString(source.Task_End_Date || source.End_Date),
  }

  database
    .prepare(
      `
      INSERT INTO Task_Overview (
        task_id, Task_Summary, Task_Status, Task_Priority_Rank, Task_Start_Date, Task_Due_Date,
        Task_End_Date, created_at, updated_at
      ) VALUES (
        @task_id, @Task_Summary, @Task_Status, @Task_Priority_Rank, @Task_Start_Date, @Task_Due_Date,
        @Task_End_Date, datetime('now'), datetime('now')
      )
      ON CONFLICT(task_id) DO UPDATE SET
        Task_Summary = excluded.Task_Summary,
        Task_Status = excluded.Task_Status,
        Task_Priority_Rank = excluded.Task_Priority_Rank,
        Task_Start_Date = excluded.Task_Start_Date,
        Task_Due_Date = excluded.Task_Due_Date,
        Task_End_Date = excluded.Task_End_Date,
        updated_at = datetime('now')
    `,
    )
    .run(payload)
}

function replaceTaskContactLinks(database, tableName, taskId, contactIds) {
  database.prepare(`DELETE FROM ${tableName} WHERE task_id = ?`).run(taskId)
  const insert = database.prepare(
    `INSERT OR IGNORE INTO ${tableName} (task_id, contact_id) VALUES (?, ?)`,
  )
  for (const contactId of contactIds) insert.run(taskId, contactId)
}

function upsertTaskTeam(database, taskId, source = {}) {
  const ownerId =
    normalizeNullableString(source.Task_Team_Owner) || normalizeNullableString(source.contact_id)

  database
    .prepare(
      `
      INSERT INTO Task_Team (task_id, Task_Team_Owner, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(task_id) DO UPDATE SET
        Task_Team_Owner = excluded.Task_Team_Owner,
        updated_at = datetime('now')
    `,
    )
    .run(taskId, ownerId)

  replaceTaskContactLinks(
    database,
    'Task_Team_Assigned',
    taskId,
    normalizeTaskContactIds(source.Task_Team_Assigned),
  )
  replaceTaskContactLinks(
    database,
    'Task_Team_Support',
    taskId,
    normalizeTaskContactIds(source.Task_Team_Support),
  )
}

function syncTaskRelations(database, taskId, source = {}) {
  const companyId = normalizeNullableString(source.company_id || source.Task_Company)
  const projectId = normalizeNullableString(source.project_id || source.Task_Project)
  const roundId =
    normalizeNullableString(source.round_id || source.Task_Round) ||
    (() => {
      const candidate = normalizeNullableString(source.opportunity_id)
      if (!candidate) return null
      const round = database.prepare('SELECT id FROM Rounds WHERE id = ? LIMIT 1').get(candidate)
      return round?.id || null
    })()
  const fundId =
    normalizeNullableString(source.fund_id || source.Task_Fund) ||
    (() => {
      const candidate = normalizeNullableString(source.opportunity_id)
      if (!candidate) return null
      const fund = database.prepare('SELECT id FROM Funds WHERE id = ? LIMIT 1').get(candidate)
      return fund?.id || null
    })()

  database.prepare('DELETE FROM Tasks_Companies_related_companies WHERE from_id = ?').run(taskId)
  database.prepare('DELETE FROM Tasks_Projects_projects WHERE from_id = ?').run(taskId)
  database.prepare('DELETE FROM Tasks_Rounds_related_round WHERE from_id = ?').run(taskId)
  database.prepare('DELETE FROM Tasks_Funds_related_fund WHERE from_id = ?').run(taskId)

  if (companyId) {
    database
      .prepare('INSERT OR IGNORE INTO Tasks_Companies_related_companies (from_id, to_id) VALUES (?, ?)')
      .run(taskId, companyId)
  }
  if (projectId) {
    database
      .prepare('INSERT OR IGNORE INTO Tasks_Projects_projects (from_id, to_id) VALUES (?, ?)')
      .run(taskId, projectId)
  }
  if (roundId) {
    database
      .prepare('INSERT OR IGNORE INTO Tasks_Rounds_related_round (from_id, to_id) VALUES (?, ?)')
      .run(taskId, roundId)
  }
  if (fundId) {
    database
      .prepare('INSERT OR IGNORE INTO Tasks_Funds_related_fund (from_id, to_id) VALUES (?, ?)')
      .run(taskId, fundId)
  }
}

function upsertCompanyIncorporationInfo(database, companyId, source = {}) {
  const payload = {
    company_id: companyId,
    Company_Type: normalizeCompanyType(database, source.Company_Type),
    Legal_Entity: normalizeNullableString(source.Legal_Entity),
    Date_of_Incorporation: normalizeNullableString(source.Date_of_Incorporation),
    incorporation_country:
      normalizeNullableString(source.incorporation_country) ||
      normalizeNullableString(source.incorporation_country_id) ||
      normalizeNullableString(source.Incorporation_Country_Id) ||
      normalizeNullableString(source.Incorporation_Country),
    Incorporation_Type: normalizeNullableString(source.Incorporation_Type),
  }

  if (
    !hasMeaningfulValue(payload.Company_Type) &&
    !hasMeaningfulValue(payload.Legal_Entity) &&
    !hasMeaningfulValue(payload.Date_of_Incorporation) &&
    !hasMeaningfulValue(payload.incorporation_country) &&
    !hasMeaningfulValue(payload.Incorporation_Type)
  ) {
    return
  }

  database
    .prepare(
      `
      INSERT INTO Company_Incorporation_Info (
        company_id, Company_Type, Legal_Entity, Date_of_Incorporation, incorporation_country,
        Incorporation_Type
      ) VALUES (
        @company_id, @Company_Type, @Legal_Entity, @Date_of_Incorporation, @incorporation_country,
        @Incorporation_Type
      )
      ON CONFLICT(company_id) DO UPDATE SET
        Company_Type = COALESCE(excluded.Company_Type, Company_Incorporation_Info.Company_Type),
        Legal_Entity = COALESCE(excluded.Legal_Entity, Company_Incorporation_Info.Legal_Entity),
        Date_of_Incorporation = COALESCE(excluded.Date_of_Incorporation, Company_Incorporation_Info.Date_of_Incorporation),
        incorporation_country = COALESCE(excluded.incorporation_country, Company_Incorporation_Info.incorporation_country),
        Incorporation_Type = COALESCE(excluded.Incorporation_Type, Company_Incorporation_Info.Incorporation_Type),
        updated_at = datetime('now')
    `,
    )
    .run(payload)
}

function upsertCompanyOperationsOverview(database, companyId, source = {}) {
  const payload = {
    company_id: companyId,
    Company_Stage: normalizeCompanyStage(source.Company_Stage),
    Status: normalizeCompanyStatus(source.Status),
    headquarters_city:
      normalizeNullableString(source.headquarters_city) ||
      normalizeNullableString(source.headquarters_city_id) ||
      normalizeNullableString(source.Headquarters_City_Id) ||
      normalizeNullableString(source.Headquarters_City) ||
      normalizeNullableString(source.city_id),
    PAX_Count:
      normalizeNullableNumber(source.PAX_Count) ??
      normalizeNullableNumber(source.Pax_Count) ??
      normalizeNullableNumber(source.Pax),
    PAX_Known:
      normalizeNullableNumber(source.PAX_Known) ?? normalizeNullableNumber(source.Pax_Known),
    business_structure_artifact_id:
      normalizeNullableString(source.business_structure_artifact_id) ||
      normalizeNullableString(source.Business_Structure_Artifact_Id),
    corporate_structure_artifact_id:
      normalizeNullableString(source.corporate_structure_artifact_id) ||
      normalizeNullableString(source.Corporate_Structure_Artifact_Id),
    organizational_structure_artifact_id:
      normalizeNullableString(source.organizational_structure_artifact_id) ||
      normalizeNullableString(source.Organizational_Structure_Artifact_Id),
  }

  if (
    !hasMeaningfulValue(payload.Company_Stage) &&
    !hasMeaningfulValue(payload.Status) &&
    !hasMeaningfulValue(payload.headquarters_city) &&
    !hasMeaningfulValue(payload.PAX_Count) &&
    !hasMeaningfulValue(payload.PAX_Known) &&
    !hasMeaningfulValue(payload.business_structure_artifact_id) &&
    !hasMeaningfulValue(payload.corporate_structure_artifact_id) &&
    !hasMeaningfulValue(payload.organizational_structure_artifact_id)
  ) {
    return
  }

  database
    .prepare(
      `
      INSERT INTO Company_Operations_Overview (
        company_id, Company_Stage, Status, headquarters_city, PAX_Count, PAX_Known,
        business_structure_artifact_id, corporate_structure_artifact_id, organizational_structure_artifact_id
      ) VALUES (
        @company_id, @Company_Stage, @Status, @headquarters_city, @PAX_Count, @PAX_Known,
        @business_structure_artifact_id, @corporate_structure_artifact_id, @organizational_structure_artifact_id
      )
      ON CONFLICT(company_id) DO UPDATE SET
        Company_Stage = COALESCE(excluded.Company_Stage, Company_Operations_Overview.Company_Stage),
        Status = COALESCE(excluded.Status, Company_Operations_Overview.Status),
        headquarters_city = COALESCE(excluded.headquarters_city, Company_Operations_Overview.headquarters_city),
        PAX_Count = COALESCE(excluded.PAX_Count, Company_Operations_Overview.PAX_Count),
        PAX_Known = COALESCE(excluded.PAX_Known, Company_Operations_Overview.PAX_Known),
        business_structure_artifact_id = COALESCE(excluded.business_structure_artifact_id, Company_Operations_Overview.business_structure_artifact_id),
        corporate_structure_artifact_id = COALESCE(excluded.corporate_structure_artifact_id, Company_Operations_Overview.corporate_structure_artifact_id),
        organizational_structure_artifact_id = COALESCE(excluded.organizational_structure_artifact_id, Company_Operations_Overview.organizational_structure_artifact_id),
        updated_at = datetime('now')
    `,
    )
    .run(payload)
}

function upsertCompanySubtable(database, tableName, companyId, values = {}) {
  const entries = Object.entries(values).filter(([, value]) => hasMeaningfulValue(value))
  if (!entries.length) return

  const columnNames = ['company_id', ...entries.map(([key]) => key)]
  const insertPlaceholders = columnNames.map((name) => `@${name}`).join(', ')
  const updateAssignments = entries
    .map(([key]) => {
      const q = quoteIdentifier(key)
      return `${q} = COALESCE(excluded.${q}, ${quoteIdentifier(tableName)}.${q})`
    })
    .concat("updated_at = datetime('now')")
    .join(', ')

  const payload = Object.fromEntries([['company_id', companyId], ...entries])
  database
    .prepare(
      `
      INSERT INTO ${quoteIdentifier(tableName)} (${columnNames.map(quoteIdentifier).join(', ')})
      VALUES (${insertPlaceholders})
      ON CONFLICT(company_id) DO UPDATE SET
        ${updateAssignments}
    `,
    )
    .run(payload)
}

function normalizeCompanyContactSet(items = []) {
  const input = Array.isArray(items) ? items : []
  const ids = []
  for (const item of input) {
    if (typeof item === 'string' || typeof item === 'number') {
      const id = normalizeNullableString(item)
      if (id) ids.push(id)
      continue
    }

    if (!item || typeof item !== 'object') continue
    const existingId = normalizeNullableString(item.id)
    if (existingId) {
      ids.push(existingId)
      continue
    }

    const created = createContact(item)
    if (created?.id) ids.push(created.id)
  }

  return [...new Set(ids)]
}

function syncCompanyContactSet(database, tableName, companyId, items = []) {
  if (!Array.isArray(items)) return
  const contactIds = normalizeCompanyContactSet(items)

  database
    .prepare(`DELETE FROM ${quoteIdentifier(tableName)} WHERE company_id = ?`)
    .run(companyId)

  const insert = database.prepare(
    `INSERT OR IGNORE INTO ${quoteIdentifier(tableName)} (company_id, contact_id) VALUES (?, ?)`,
  )
  for (const contactId of contactIds) {
    insert.run(companyId, contactId)
  }
}

function listCompanyContacts(database, tableName, companyId) {
  return database
    .prepare(
      `
      SELECT
        c.id,
        c.Name,
        c.Personal_Email,
        c.Professional_Email,
        c.Phone,
        c.Country_based,
        c.LinkedIn
      FROM ${quoteIdentifier(tableName)} link
      JOIN Contacts c ON c.id = link.contact_id
      WHERE link.company_id = ?
      ORDER BY COALESCE(c.Name, '') ASC, c.id ASC
    `,
    )
    .all(companyId)
}

function createCompany(payload = {}) {
  const name = normalizeNullableString(payload.Company_Name)
  if (!name) throw new Error('Company name is required')

  const database = initDb()
  const actor = getAuditActor(database)

  const existing = database
    .prepare('SELECT id, Company_Name FROM Companies WHERE Company_Name = ? LIMIT 1')
    .get(name)
  const statusValue = existing
    ? resolveRecordStatus(payload, null)
    : resolveRecordStatus(payload, 'Draft')

  const mainFields = {
    Company_Name: name,
    Short_Name: normalizeNullableString(payload.Short_Name) || normalizeNullableString(payload.shortening),
    Website: normalizeNullableString(payload.Website),
    One_Liner: normalizeNullableString(payload.One_Liner),
    Description: normalizeNullableString(payload.Description),
    Notable_News: normalizeNullableString(payload.Notable_News),
    Updates: normalizeNullableString(payload.Updates),
    Status: statusValue,
    created_by: actor.user_id,
  }
  const explicitId = normalizeNullableIntegerId(payload.id)

  const tx = database.transaction(() => {
    let companyId = existing?.id ?? null

    if (!existing) {
      const result = explicitId
        ? database
            .prepare(
              `
              INSERT INTO Companies (
                id, Company_Name, Short_Name, Website, One_Liner, Description, Notable_News,
                Updates, Status, created_by
              ) VALUES (
                @id, @Company_Name, @Short_Name, @Website, @One_Liner, @Description, @Notable_News,
                @Updates, @Status, @created_by
              )
            `,
            )
            .run({ id: explicitId, ...mainFields })
        : database
            .prepare(
              `
              INSERT INTO Companies (
                Company_Name, Short_Name, Website, One_Liner, Description, Notable_News,
                Updates, Status, created_by
              ) VALUES (
                @Company_Name, @Short_Name, @Website, @One_Liner, @Description, @Notable_News,
                @Updates, @Status, @created_by
              )
            `,
            )
            .run(mainFields)
      companyId = explicitId ?? Number(result.lastInsertRowid)
    } else {
      database
        .prepare(
          `
          UPDATE Companies SET
            Short_Name = COALESCE(@Short_Name, Short_Name),
            Website = COALESCE(@Website, Website),
            One_Liner = COALESCE(@One_Liner, One_Liner),
            Description = COALESCE(@Description, Description),
            Notable_News = COALESCE(@Notable_News, Notable_News),
            Updates = COALESCE(@Updates, Updates),
            Status = COALESCE(@Status, Status),
            updated_at = datetime('now')
          WHERE id = @id
        `,
        )
        .run({ id: companyId, ...mainFields })
    }

    database
      .prepare('INSERT OR IGNORE INTO Company_Incorporation_Info (company_id) VALUES (?)')
      .run(companyId)
    database
      .prepare('INSERT OR IGNORE INTO Company_Operations_Overview (company_id) VALUES (?)')
      .run(companyId)
    database
      .prepare('INSERT OR IGNORE INTO Company_Business_Overview (company_id) VALUES (?)')
      .run(companyId)
    database
      .prepare('INSERT OR IGNORE INTO Company_Market_Overview (company_id) VALUES (?)')
      .run(companyId)
    database
      .prepare('INSERT OR IGNORE INTO Company_Results_Overview (company_id) VALUES (?)')
      .run(companyId)
    database
      .prepare('INSERT OR IGNORE INTO Company_Business_Plan (company_id) VALUES (?)')
      .run(companyId)
    database
      .prepare('INSERT OR IGNORE INTO Company_Fund_Raising (company_id) VALUES (?)')
      .run(companyId)

    upsertCompanyIncorporationInfo(database, companyId, payload)
    upsertCompanyOperationsOverview(database, companyId, payload)
    upsertCompanySubtable(database, 'Company_Business_Overview', companyId, {
      Mission_Vision: normalizeNullableString(payload.Mission_Vision),
      Products_Services: normalizeNullableString(payload.Products_Services),
      Key_Features: normalizeNullableString(payload.Key_Features),
      Development_Stage: normalizeNullableString(payload.Development_Stage),
      ICP: normalizeNullableString(payload.ICP),
      Business_Model: normalizeNullableString(payload.Business_Model),
      Pricing: normalizeNullableString(payload.Pricing),
      Placement_Distribution: normalizeNullableString(payload.Placement_Distribution),
    })
    upsertCompanySubtable(database, 'Company_Market_Overview', companyId, {
      Industry: normalizeNullableString(payload.Industry),
      Niche: normalizeNullableString(payload.Niche),
      Demand_Analysis: normalizeNullableString(payload.Demand_Analysis),
      Supply_Analysis: normalizeNullableString(payload.Supply_Analysis),
    })
    upsertCompanySubtable(database, 'Company_Results_Overview', companyId, {
      Traction_Overview: normalizeNullableString(payload.Traction_Overview),
      Unit_Sales_By_Type_Artifact_Id: normalizeNullableString(payload.Unit_Sales_By_Type_Artifact_Id),
      Unit_Sales_By_Region_Artifact_Id: normalizeNullableString(payload.Unit_Sales_By_Region_Artifact_Id),
      Unit_Sales_By_Customer_Mix_Artifact_Id: normalizeNullableString(payload.Unit_Sales_By_Customer_Mix_Artifact_Id),
      Revenue_Breakdown_By_Type_Artifact_Id: normalizeNullableString(payload.Revenue_Breakdown_By_Type_Artifact_Id),
      Revenue_Breakdown_By_Region_Artifact_Id: normalizeNullableString(payload.Revenue_Breakdown_By_Region_Artifact_Id),
      Revenue_Breakdown_By_Customer_Mix_Artifact_Id: normalizeNullableString(payload.Revenue_Breakdown_By_Customer_Mix_Artifact_Id),
      Revenue_Breakdown_Top_10_Artifact_Id: normalizeNullableString(payload.Revenue_Breakdown_Top_10_Artifact_Id),
      Cohorts_Analysis_By_Date_Artifact_Id: normalizeNullableString(payload.Cohorts_Analysis_By_Date_Artifact_Id),
      Cohorts_Analysis_By_Product_Service_Artifact_Id: normalizeNullableString(payload.Cohorts_Analysis_By_Product_Service_Artifact_Id),
      Direct_Costs_By_Product_Service_Artifact_Id: normalizeNullableString(payload.Direct_Costs_By_Product_Service_Artifact_Id),
      Sales_Marketing_Costs_By_Product_Service_Artifact_Id: normalizeNullableString(payload.Sales_Marketing_Costs_By_Product_Service_Artifact_Id),
      Customer_Acquisition_Cost: normalizeNullableNumber(payload.Customer_Acquisition_Cost),
      Customer_Lifetime_Value: normalizeNullableNumber(payload.Customer_Lifetime_Value),
      General_Admin_Expenses: normalizeNullableNumber(payload.General_Admin_Expenses),
      Tech_Expenditure: normalizeNullableNumber(payload.Tech_Expenditure),
      Income_Statement_Artifact_Id: normalizeNullableString(payload.Income_Statement_Artifact_Id),
      Balance_Sheet_Artifact_Id: normalizeNullableString(payload.Balance_Sheet_Artifact_Id),
      Cash_Flow_Artifact_Id: normalizeNullableString(payload.Cash_Flow_Artifact_Id),
      Tax_Filings_Artifact_Id: normalizeNullableString(payload.Tax_Filings_Artifact_Id),
      Bank_Statements_Artifact_Id: normalizeNullableString(payload.Bank_Statements_Artifact_Id),
    })
    upsertCompanySubtable(database, 'Company_Business_Plan', companyId, {
      Overview: normalizeNullableString(payload.Overview),
      Forecast: normalizeNullableString(payload.Forecast),
      Short_Term_Objectives: normalizeNullableString(payload.Short_Term_Objectives),
      Long_Term_Objectives: normalizeNullableString(payload.Long_Term_Objectives),
      Use_of_Resources: normalizeNullableString(payload.Use_of_Resources),
      Runway_Analysis: normalizeNullableString(payload.Runway_Analysis),
      Capital_Needs: normalizeNullableString(payload.Capital_Needs),
      Funding_Strategy: normalizeNullableString(payload.Funding_Strategy),
    })
    upsertCompanySubtable(database, 'Company_Fund_Raising', companyId, {
      Shareholder_Structure_Artifact_Id: normalizeNullableString(payload.Shareholder_Structure_Artifact_Id),
      Rounds_Funds_Count:
        normalizeNullableNumber(payload.Rounds_Funds_Count) ??
        normalizeNullableNumber(payload.Rounds_Count),
      Amount_Raised: normalizeNullableNumber(payload.Amount_Raised),
    })
    syncCompanyContactSet(
      database,
      'Company_Incorporation_Legal_Founders',
      companyId,
      payload.Legal_Founders,
    )
    syncCompanyContactSet(
      database,
      'Company_Operations_Leadership_Team',
      companyId,
      payload.Leadership_Team,
    )
    syncCompanyContactSet(
      database,
      'Company_Operations_Advisors',
      companyId,
      payload.Advisors,
    )
    syncCompanyContactSet(
      database,
      'Company_Fund_Raising_Shareholders',
      companyId,
      payload.Shareholders,
    )
    return companyId
  })

  const id = tx()

  return { id, Company_Name: name }
}

function listOpportunities() {
  return dbAll(
    `
    SELECT *
    FROM (
      SELECT
        r.id,
        'round' AS kind,
        ro.sponsor_company_id AS company_id,
        ro.Round_Target_Size AS Investment_Ask,
        ro.Round_Commited_Amounts AS Hard_Commits,
        NULL AS Soft_Commits,
        NULL AS First_Close_Date,
        NULL AS Next_Close_Date,
        ro.Round_Close_Date AS Final_Close_Date,
        NULL AS Round_Stage,
        ro.Security_Type AS Type_of_Security,
        ro.Round_Target_Size AS Round_Amount,
        re.Round_Pre_Valuation AS Pre_Valuation,
        re.Round_Post_Valuation AS Post_Valuation,
        re.Round_Previous_Post_Valuation AS Previous_Post,
        r.Round_Name AS opportunity_name,
        r.Round_Name AS Venture_Oppty_Name,
        NULL AS Fund_Type,
        NULL AS Fund_Size_Target,
        ro.Round_Raising_Status AS Raising_Status,
        r.created_at,
        c.Company_Name
      FROM Rounds r
      LEFT JOIN Round_Overview ro ON ro.round_id = r.id
      LEFT JOIN Round_Economics re ON re.round_id = r.id
      LEFT JOIN Companies c ON c.id = ro.sponsor_company_id

      UNION ALL

      SELECT
        f.id,
        'fund' AS kind,
        NULL AS company_id,
        fo.Fund_Target_Size AS Investment_Ask,
        fo.Fund_Commited_Amounts AS Hard_Commits,
        NULL AS Soft_Commits,
        NULL AS First_Close_Date,
        NULL AS Next_Close_Date,
        fo.Fund_Close_Date AS Final_Close_Date,
        NULL AS Round_Stage,
        NULL AS Type_of_Security,
        NULL AS Round_Amount,
        NULL AS Pre_Valuation,
        NULL AS Post_Valuation,
        NULL AS Previous_Post,
        f.Fund_Name AS opportunity_name,
        f.Fund_Name AS Venture_Oppty_Name,
        NULL AS Fund_Type,
        fo.Fund_Target_Size AS Fund_Size_Target,
        fo.Fund_Raising_Status AS Raising_Status,
        f.created_at,
        NULL AS Company_Name
      FROM Funds f
      LEFT JOIN Fund_Overview fo ON fo.fund_id = f.id
    ) opportunities
    ORDER BY created_at DESC, id DESC
  `,
  )
}

function listContacts() {
  const database = initDb()
  ensureContactsProvenanceColumns(database)
  ensureOwnerUserProfile(database)
  return dbAll(
    `
    SELECT
      c.id,
      c.Name,
      c.Personal_Email,
      c.Professional_Email,
      c.Phone,
      c.Country_based,
      c.LinkedIn,
      c.created_by,
      c.created_at,
      c.updated_at,
      c.linked_user_id,
      u.User_Name AS Linked_User_Name,
      ur.role_id AS linked_role_id,
      r.Role_Name AS Linked_User_Role
    FROM Contacts c
    LEFT JOIN Users u ON u.id = c.linked_user_id
    LEFT JOIN Users_Roles ur ON ur.user_id = c.linked_user_id
    LEFT JOIN Roles r ON r.id = ur.role_id
    ORDER BY COALESCE(c.Name, '') ASC, c.id DESC
  `,
  )
}

function ensureContactsProvenanceColumns(database) {
  const contactsMeta = getTableMeta(database, 'Contacts')
  if (!contactsMeta.columnsSet.has('created_by')) {
    database.exec('ALTER TABLE Contacts ADD COLUMN created_by TEXT')
  }
  if (!contactsMeta.columnsSet.has('created_at')) {
    database.exec('ALTER TABLE Contacts ADD COLUMN created_at TEXT')
  }
  if (!contactsMeta.columnsSet.has('updated_at')) {
    database.exec('ALTER TABLE Contacts ADD COLUMN updated_at TEXT')
  }
  database.exec(`
    UPDATE Contacts
    SET
      created_at = COALESCE(created_at, datetime('now')),
      updated_at = COALESCE(updated_at, datetime('now'))
    WHERE created_at IS NULL OR updated_at IS NULL
  `)
}

function listRounds() {
  return dbAll(
    `
    SELECT
      r.id,
      r.Round_Name,
      ro.sponsor_company_id,
      ro.Round_Raising_Status,
      ro.Security_Type,
      ro.Round_Target_Size,
      ro.Round_Commited_Amounts,
      ro.Round_Close_Date
    FROM Rounds r
    LEFT JOIN Round_Overview ro ON ro.round_id = r.id
    ORDER BY COALESCE(r.Round_Name, '') ASC, r.id DESC
  `,
  )
}

function listFunds() {
  return dbAll(
    `
    SELECT
      f.id,
      f.Fund_Name,
      fo.Fund_Raising_Status,
      fo.Fund_Target_Size,
      fo.Fund_Commited_Amounts,
      fo.Fund_Close_Date
    FROM Funds f
    LEFT JOIN Fund_Overview fo ON fo.fund_id = f.id
    ORDER BY COALESCE(f.Fund_Name, '') ASC, f.id DESC
  `,
  )
}

function listUsers() {
  const database = initDb()
  ensureOwnerUserProfile(database)
  return dbAll(
    `
    SELECT
      u.id,
      u.User_Name,
      u.User_PEmail,
      ur.role_id,
      r.Role_Name,
      u.created_at,
      u.updated_at
    FROM Users u
    LEFT JOIN Users_Roles ur ON ur.user_id = u.id
    LEFT JOIN Roles r ON r.id = ur.role_id
    ORDER BY COALESCE(u.User_Name, '') ASC, u.id ASC
  `,
  )
}

function createEvent(payload = {}) {
  const database = initDb()
  const actor = getAuditActor(database)
  const eventId = normalizeNullableString(payload?.id) || `event:${crypto.randomUUID()}`
  const tableName =
    normalizeNullableString(payload?.table_name) ||
    normalizeNullableString(payload?.Event_Source_Table) ||
    'Events'
  const recordId =
    normalizeNullableString(payload?.record_id) ||
    normalizeNullableString(payload?.Event_Source_Record_ID) ||
    eventId
  const fieldName =
    normalizeNullableString(payload?.field_name) ||
    normalizeNullableString(payload?.Event_Field) ||
    'Event_Name'
  const actionId = normalizeNullableString(payload?.action_id)
  const actionLabel =
    normalizeNullableString(payload?.action_label) ||
    normalizeNullableString(payload?.Event_Action) ||
    'Create Event'
  const oldValue = payload?.old_value ?? null
  const newValue =
    payload?.new_value ??
    normalizeNullableString(payload?.Event_Name) ??
    normalizeNullableString(payload?.Event_Summary) ??
    null
  const editedBy = normalizeNullableString(payload?.edited_by) || actor.user_id
  const providedPayload = payload?.payload && typeof payload.payload === 'object'
    ? payload.payload
    : null
  const summaryPayload = {
    actor_label: normalizeNullableString(payload?.actor_label) || actor.user_label,
    entity_label: normalizeNullableString(payload?.entity_label) || 'Event',
    record_label:
      normalizeNullableString(payload?.Event_Name) ||
      normalizeNullableString(payload?.record_label) ||
      'Event',
    field_label:
      normalizeNullableString(payload?.Event_Field) ||
      normalizeNullableString(payload?.field_label) ||
      'Event',
    action_label: actionLabel,
    old_display_value: normalizeNullableString(oldValue),
    new_display_value:
      normalizeNullableString(payload?.Event_Summary) ||
      normalizeNullableString(newValue),
    feed_tab:
      normalizeNullableString(payload?.feed_tab) ||
      resolveAuditFeedTab(tableName),
  }

  writeAuditEvent(database, {
    tableName,
    recordId,
    fieldName,
    oldValue,
    newValue,
    editedBy,
    actionId,
    actionLabel,
    payload: providedPayload || summaryPayload,
  })

  return { id: eventId }
}

function listMarkets() {
  return dbAll(
    `
    SELECT
      id,
      Market_Name,
      Market_Summary,
      created_at,
      updated_at
    FROM Markets
    ORDER BY COALESCE(Market_Name, '') ASC, id ASC
  `,
  )
}

function createMarket(payload = {}) {
  const database = initDb()
  const name =
    normalizeNullableString(payload?.Market_Name) ||
    normalizeNullableString(payload?.Name) ||
    normalizeNullableString(payload?.title)
  if (!name) throw new Error('Market name is required')

  const id = normalizeNullableString(payload?.id) || `market:${crypto.randomUUID()}`
  const summary =
    normalizeNullableString(payload?.Market_Summary) ||
    normalizeNullableString(payload?.Summary) ||
    normalizeNullableString(payload?.description)
  const statusValue = resolveRecordStatus(payload, 'Draft')

  database
    .prepare(
      `
      INSERT INTO Markets (id, Market_Name, Market_Summary, Status, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    )
    .run(id, name, summary, statusValue)

  return { id }
}

function listSecurities() {
  return dbAll(
    `
    SELECT
      id,
      Security_Name,
      Security_Summary,
      created_at,
      updated_at
    FROM Securities
    ORDER BY COALESCE(Security_Name, '') ASC, id ASC
  `,
  )
}

function createSecurity(payload = {}) {
  const database = initDb()
  const name =
    normalizeNullableString(payload?.Security_Name) ||
    normalizeNullableString(payload?.Name) ||
    normalizeNullableString(payload?.title)
  if (!name) throw new Error('Security name is required')

  const id = normalizeNullableString(payload?.id) || `security:${crypto.randomUUID()}`
  const summary =
    normalizeNullableString(payload?.Security_Summary) ||
    normalizeNullableString(payload?.Summary) ||
    normalizeNullableString(payload?.description)
  const statusValue = resolveRecordStatus(payload, 'Draft')

  database
    .prepare(
      `
      INSERT INTO Securities (id, Security_Name, Security_Summary, Status, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    )
    .run(id, name, summary, statusValue)

  return { id }
}

function createUser(payload = {}) {
  const database = initDb()
  ensureDefaultRoles(database)
  const userName =
    normalizeNullableString(payload?.User_Name) || normalizeNullableString(payload?.Name)
  const userEmail =
    normalizeNullableString(payload?.User_PEmail) ||
    normalizeNullableString(payload?.Professional_Email) ||
    normalizeNullableString(payload?.Personal_Email) ||
    normalizeNullableString(payload?.Email)

  if (!userName) throw new Error('User name is required')
  if (userEmail && !isEmail(userEmail)) throw new Error('Primary email must be a valid email address')

  const explicitId = normalizeNullableString(payload?.id)
  const existing = userEmail
    ? database
      .prepare('SELECT id FROM Users WHERE User_PEmail = ? LIMIT 1')
      .get(userEmail)
    : null
  const userId = explicitId || existing?.id || `user:${crypto.randomUUID()}`
  const statusValue = existing ? resolveRecordStatus(payload, null) : resolveRecordStatus(payload, 'Draft')

  database
    .prepare(
      `
      INSERT INTO Users (
        id, User_Name, User_PEmail, Status, created_at, updated_at
      ) VALUES (
        @id, @User_Name, @User_PEmail, @Status, datetime('now'), datetime('now')
      )
      ON CONFLICT(id) DO UPDATE SET
        User_Name = excluded.User_Name,
        User_PEmail = excluded.User_PEmail,
        Status = COALESCE(excluded.Status, Status),
        updated_at = datetime('now')
    `,
    )
    .run({
      id: userId,
      User_Name: userName,
      User_PEmail: userEmail || null,
      Status: statusValue,
    })

  ensureUserRoleAssignmentRow(database, userId)
  if (!userEmail) {
    const unverifiedRoleId = normalizeNullableString(
      database
        .prepare("SELECT id FROM Roles WHERE lower(trim(Role_Name)) = 'unverified' LIMIT 1")
        .get()?.id,
    )
    if (unverifiedRoleId) {
      assignUserRole(database, userId, unverifiedRoleId, userId)
    }
  }
  const contactId = upsertLinkedContactForUserProfile(database, {
    userId,
    name: userName,
    email: userEmail || '',
    profile: payload,
    preferredContactId:
      normalizeNullableString(payload?.Contact_Id) ||
      normalizeNullableString(payload?.contact_id),
  })

  return {
    id: userId,
    User_Name: userName,
    User_PEmail: userEmail || '',
    contact_id: contactId,
  }
}

function listNotes() {
  return dbAll(
    `
    SELECT
      n.id,
      n.Note_Name,
      n.Note_Content,
      n.created_by,
      n.created_at,
      u.User_Name AS created_by_name,
      u.User_PEmail AS created_by_email
    FROM Notes n
    LEFT JOIN Users u ON u.id = n.created_by
    ORDER BY n.created_at DESC, n.id DESC
  `,
  )
}

function createNote(payload = {}) {
  const database = initDb()
  const actor = getAuditActor(database, { requireUser: true })
  const noteName = normalizeNullableString(payload?.Note_Name) || normalizeNullableString(payload?.title)
  if (!noteName) throw new Error('Note name is required')
  const noteContent =
    normalizeNullableString(payload?.Note_Content) || normalizeNullableString(payload?.content) || ''
  const statusValue = resolveRecordStatus(payload, 'Draft')

  const id = normalizeNullableString(payload?.id) || `note:${crypto.randomUUID()}`
  database
    .prepare(
      `
      INSERT INTO Notes (id, created_by, Note_Name, Note_Content, Status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    )
    .run(id, actor.user_id, noteName, noteContent, statusValue)
  return { id }
}

function upsertNotes(rows = []) {
  const database = initDb()
  const input = Array.isArray(rows) ? rows : []
  const tx = database.transaction(() => {
    let inserted = 0
    let updated = 0
    let skipped = 0
    for (const r of input) {
      const id = normalizeNullableString(r?.id) || `note:${crypto.randomUUID()}`
      const noteName = normalizeNullableString(r?.Note_Name) || normalizeNullableString(r?.title)
      if (!noteName) {
        skipped += 1
        continue
      }
      const noteContent =
        normalizeNullableString(r?.Note_Content) || normalizeNullableString(r?.content) || ''
      const exists = database.prepare('SELECT 1 FROM Notes WHERE id = ? LIMIT 1').get(id)
      database
        .prepare(
          `
          INSERT INTO Notes (id, created_by, Note_Name, Note_Content, created_at, updated_at)
          VALUES (@id, @created_by, @Note_Name, @Note_Content, datetime('now'), datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            created_by = excluded.created_by,
            Note_Name = excluded.Note_Name,
            Note_Content = excluded.Note_Content,
            updated_at = datetime('now')
        `,
        )
        .run({
          id,
          created_by: normalizeNullableString(r?.created_by),
          Note_Name: noteName,
          Note_Content: noteContent,
        })
      if (exists) updated += 1
      else inserted += 1
    }
    return { inserted, updated, skipped }
  })
  return tx()
}

function listTasksForPage() {
  return dbAll(
    `
    SELECT DISTINCT
      t.id,
      t.Task_Name,
      tov.Task_Summary,
      tov.Task_Status,
      tov.Task_Priority_Rank,
      tov.Task_Due_Date,
      t.created_at,
      COALESCE(r.Round_Name, f.Fund_Name) AS opportunity_name,
      COALESCE(r.id, f.id) AS opportunity_id,
      owner.Name AS contact_name,
      owner.id AS contact_id,
      co.Company_Name AS company_name,
      co.id AS company_id
    FROM Tasks t
    LEFT JOIN Task_Overview tov ON tov.task_id = t.id
    LEFT JOIN Task_Team tt ON tt.task_id = t.id
    LEFT JOIN Contacts owner ON owner.id = tt.Task_Team_Owner
    LEFT JOIN Tasks_Rounds_related_round trr ON trr.from_id = t.id
    LEFT JOIN Rounds r ON r.id = trr.to_id
    LEFT JOIN Tasks_Funds_related_fund trf ON trf.from_id = t.id
    LEFT JOIN Funds f ON f.id = trf.to_id
    LEFT JOIN Tasks_Companies_related_companies tcr ON tcr.from_id = t.id
    LEFT JOIN Companies co ON co.id = tcr.to_id
    ORDER BY t.created_at DESC, t.id DESC
  `,
  )
}

function createTask(payload = {}) {
  const database = initDb()
  const actor = getAuditActor(database, { requireUser: true })
  const taskName = normalizeNullableString(payload?.Task_Name)
  if (!taskName) throw new Error('Task name is required')
  const taskId = normalizeNullableString(payload?.id) || `task:${crypto.randomUUID()}`
  const statusValue = resolveRecordStatus(payload, 'Draft')

  database
    .prepare(
      `
      INSERT INTO Tasks (id, created_by, Task_Name, Status, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    )
    .run(
      taskId,
      normalizeNullableString(payload?.Task_Creator) ||
        normalizeNullableString(payload?.created_by) ||
        actor.user_id,
      taskName,
      statusValue,
    )

  upsertTaskOverview(database, taskId, payload)
  upsertTaskTeam(database, taskId, payload)
  syncTaskRelations(database, taskId, payload)

  return { id: taskId }
}

function upsertTasks(rows = []) {
  const database = initDb()
  const actor = getAuditActor(database, { requireUser: true })
  const input = Array.isArray(rows) ? rows : []
  const tx = database.transaction(() => {
    let inserted = 0
    let updated = 0
    let skipped = 0
    for (const r of input) {
      const taskName = normalizeNullableString(r?.Task_Name)
      if (!taskName) {
        skipped += 1
        continue
      }
      const taskId = normalizeNullableString(r?.id) || `task:${crypto.randomUUID()}`
      const exists = database.prepare('SELECT 1 FROM Tasks WHERE id = ? LIMIT 1').get(taskId)
      const statusValue = exists ? resolveRecordStatus(r, null) : resolveRecordStatus(r, 'Draft')
      database
        .prepare(
          `
          INSERT INTO Tasks (id, created_by, Task_Name, Status, created_at, updated_at)
          VALUES (@id, @created_by, @Task_Name, @Status, datetime('now'), datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            created_by = excluded.created_by,
            Task_Name = excluded.Task_Name,
            Status = COALESCE(excluded.Status, Status),
            updated_at = datetime('now')
        `,
        )
        .run({
          id: taskId,
          created_by:
            normalizeNullableString(r?.Task_Creator) ||
            normalizeNullableString(r?.created_by) ||
            actor.user_id,
          Task_Name: taskName,
          Status: statusValue,
        })

      upsertTaskOverview(database, taskId, r)
      upsertTaskTeam(database, taskId, r)
      syncTaskRelations(database, taskId, r)

      if (exists) updated += 1
      else inserted += 1
    }
    return { inserted, updated, skipped }
  })
  return tx()
}

function listRoles() {
  const database = initDb()
  ensureDefaultRoles(database)
  return dbAll(
    `
    SELECT
      id,
      Role_Name,
      Role_Summary,
      created_at
    FROM Roles
    ORDER BY created_at DESC, id DESC
  `,
  )
}

function listCompanionRoles() {
  const database = initDb()
  ensureDefaultCompanionRoles(database)
  return dbAll(
    `
    SELECT
      id,
      Companion_Role_Name,
      Companion_Role_Summary,
      Companion_Role_Type,
      Companion_Role_Status,
      Companion_Role_Contract_Path,
      created_at
    FROM Companion_Roles
    ORDER BY created_at DESC, id DESC
  `,
  )
}

const BASE_FILE_TOKEN_FIELDS = Object.freeze({
  'file-system': { nameField: 'File_Name', summaryField: 'File_Summary' },
  companies: { nameField: 'Company_Name', summaryField: 'One_Liner' },
  contacts: { nameField: 'Name', summaryField: '' },
  users: { nameField: 'User_Name', summaryField: '' },
  notes: { nameField: 'Note_Name', summaryField: 'Note_Content' },
  tasks: { nameField: 'Task_Name', summaryField: 'Task_Summary' },
  projects: { nameField: 'Project_Name', summaryField: '' },
  artifacts: { nameField: 'title', summaryField: '' },
  opportunities: { nameField: 'Venture_Oppty_Name', summaryField: '' },
  funds: { nameField: 'Fund_Name', summaryField: '' },
  rounds: { nameField: 'Round_Name', summaryField: '' },
  markets: { nameField: 'Market_Name', summaryField: 'Market_Summary' },
  securities: { nameField: 'Security_Name', summaryField: 'Security_Summary' },
  events: { nameField: 'Event_Name', summaryField: 'Event_Summary' },
  'bb-file': { nameField: 'Name', summaryField: 'Summary' },
  intake: { nameField: 'Intake_Name', summaryField: '' },
  'user-roles': { nameField: 'Role_Name', summaryField: 'Role_Summary' },
  'companion-roles': { nameField: 'Companion_Role_Name', summaryField: 'Companion_Role_Summary' },
})

function buildBaseFileStructure(entry) {
  const sourceKey = String(entry?.key || '').trim().toLowerCase()
  const mapping = BASE_FILE_TOKEN_FIELDS[sourceKey] || { nameField: '', summaryField: '' }
  const nameField = String(mapping.nameField || '').trim()
  const summaryField = String(mapping.summaryField || '').trim()
  const nameTokenName = nameField || 'Name'
  const summaryTokenName = summaryField || 'Summary'
  const makeWriteTarget = (fieldName) => ({ dbWriteField: fieldName })

  return {
    version: 1,
    sections: [
      {
        key: `${sourceKey}-system`,
        label: 'System',
        address: '',
        structureToken: '',
        displayGroup: '',
        tokens: [
          {
            key: 'ID',
            tokenName: 'ID',
            tokenRole: 'id',
            tokenOrder: '1',
            address: '',
            label: 'ID',
            tokenType: 'id',
            optionSource: '',
            optionEntity: '',
            optionList: '',
            optionEntities: [],
            ...makeWriteTarget('id'),
            relationshipGroup: '',
            definition: '',
            defaultVerificationState: 'Verified',
            defaultVerificationSource: 'system_defined',
          },
          {
            key: 'History',
            tokenName: 'History',
            tokenRole: '',
            tokenOrder: '2',
            address: '',
            label: 'History',
            tokenType: 'event_log',
            optionSource: '',
            optionEntity: '',
            optionList: '',
            optionEntities: [],
            ...makeWriteTarget(''),
            relationshipGroup: '',
            definition: '',
            defaultVerificationState: 'Verified',
            defaultVerificationSource: 'system_defined',
          },
          {
            key: 'System_Status',
            tokenName: 'System_Status',
            tokenRole: 'status',
            tokenOrder: '3',
            address: '',
            label: 'System.Status',
            tokenType: 'select_single',
            optionSource: 'static',
            optionEntity: '',
            optionList: 'Active, Archived',
            optionEntities: [],
            inputOptions: ['Active', 'Archived'],
            ...makeWriteTarget('File_Status'),
            relationshipGroup: '',
            definition: '',
            defaultVerificationState: 'Verified',
            defaultVerificationSource: 'system_defined',
          },
        ],
      },
      {
        key: `${sourceKey}-general`,
        label: 'General',
        address: '',
        structureToken: '',
        displayGroup: '',
        tokens: [
          {
            key: nameTokenName,
            tokenName: nameTokenName,
            tokenRole: 'title',
            tokenOrder: '1',
            address: '',
            label: 'Name',
            tokenType: 'text',
            optionSource: '',
            optionEntity: '',
            optionList: '',
            optionEntities: [],
            ...makeWriteTarget(nameField),
            relationshipGroup: '',
            definition: '',
            defaultVerificationState: 'Input',
            defaultVerificationSource: 'system_defined',
          },
            {
              key: summaryTokenName,
              tokenName: summaryTokenName,
              tokenRole: 'summary',
              tokenOrder: '2',
            address: '',
            label: 'Summary',
            tokenType: 'text',
            optionSource: '',
            optionEntity: '',
            optionList: '',
            optionEntities: [],
              ...makeWriteTarget(summaryField),
              relationshipGroup: '',
              definition: '',
              defaultVerificationState: 'Input',
              defaultVerificationSource: 'system_defined',
            },
          ],
        },
      {
        key: `${sourceKey}-ldb`,
        label: 'LDB',
        address: '',
        structureToken: '',
        displayGroup: '',
        tokens: [],
      },
      {
        key: `${sourceKey}-other`,
        label: 'Other',
        address: '',
        structureToken: '',
        displayGroup: '',
        tokens: [],
      },
    ],
  }
}

function buildDefinedStructureJson(entry) {
  return JSON.stringify(buildBaseFileStructure(entry))
}

function getFileRegistryForkMode(entry) {
  const sourceKey = String(entry?.key || '').trim()
  const hasCreateBranches = getCreateBranches(sourceKey).length > 0
  const hasViewForks = getViewForks(sourceKey).length > 0
  if (hasCreateBranches && hasViewForks) return 'view_and_create'
  if (hasCreateBranches) return 'create'
  if (hasViewForks) return 'view'
  return 'none'
}

function getFileRegistryForkEnabled(entry) {
  return getFileRegistryForkMode(entry) === 'none' ? 'No' : 'Yes'
}

function buildCreateForkInstructions(entry) {
  const sourceKey = String(entry?.key || '').trim()
  const branches = getCreateBranches(sourceKey)
  if (!branches.length) return ''
  return JSON.stringify({
    type: 'create',
    sourceKey,
    label: String(entry?.createBranchLabel || '').trim() || 'Type',
    tokenName: String(entry?.createBranchTokenName || '').trim(),
    options: branches.map((branch) => ({
      value: String(branch?.value || '').trim(),
      label: String(branch?.label || '').trim(),
      targetSourceKey: String(branch?.targetSourceKey || '').trim(),
    })),
  })
}

function buildViewForkInstructions(entry) {
  const sourceKey = String(entry?.key || '').trim()
  const forks = getViewForks(sourceKey)
  if (!forks.length) return ''
  return JSON.stringify({
    type: 'view',
    sourceKey,
    options: forks.map((fork) => ({
      value: String(fork?.value || '').trim(),
      label: String(fork?.label || '').trim(),
      sectionRawLabels: Array.isArray(fork?.sectionRawLabels)
        ? fork.sectionRawLabels.map((label) => String(label || '').trim()).filter(Boolean)
        : [],
    })),
  })
}

function buildDefaultFileRegistryRow(entry, index) {
  const sourceKey = String(entry?.key || '').trim()
  const guidePath = FILE_GUIDE_PATH_BY_SOURCE_KEY[sourceKey] || null
  return {
    id: `file:${sourceKey || index + 1}`,
    File_Order: index + 1,
    File_Name: String(entry?.label || entry?.singularLabel || entry?.key || '').trim(),
    File_Summary: `System definition for ${String(entry?.label || entry?.singularLabel || 'file').trim()}.`,
    File_Status: getDefaultFileStatusForGuidePath(guidePath),
    File_Guide_Path: guidePath,
    File_Class: 'L1',
    File_Bucket: getDefaultFileBucketForSourceKey(sourceKey),
    Ownership_Mode: 'root_owned',
    File_Owner: 'Owner',
    File_Steward: 'File Steward',
    Rulebook_Dependencies: 'docs/010/System.md',
    Fork_Mode: getFileRegistryForkMode(entry),
    Fork_Enabled: getFileRegistryForkEnabled(entry),
    Create_Fork_Instructions: buildCreateForkInstructions(entry),
    View_Fork_Instructions: buildViewForkInstructions(entry),
    Defined_Structure: buildDefinedStructureJson(entry),
    Glossary_Terms: '',
    sourceKey,
    File_Canonical_Entity: String(entry?.canonicalEntityName || '').trim(),
    File_Runtime_Entity: String(entry?.entityName || '').trim(),
    File_Route_Name: String(entry?.routeName || '').trim(),
    File_Path: String(entry?.path || '').trim(),
  }
}

function getFileRegistryEntryBySourceKey(sourceKey) {
  const normalizedSourceKey = String(sourceKey || '').trim()
  return FILE_PAGE_REGISTRY.find((entry) => String(entry?.key || '').trim() === normalizedSourceKey) || null
}

function buildDraftFileDefinitionRow(sourceKey, payload = {}) {
  const normalizedSourceKey = String(sourceKey || '').trim()
  const normalizedFileStatus =
    normalizeFileStatusValue(payload?.File_Status) ||
    normalizeFileStatusValue(payload?.Status) ||
    'Archived'
  const normalizedFileBucket =
    normalizeFileBucketValue(payload?.File_Bucket) ||
    normalizeFileBucketValue(payload?.Bucket) ||
    getDefaultFileBucketForSourceKey(normalizedSourceKey)
  return {
    id: normalizeNullableString(payload?.id) || `file:${normalizedSourceKey || crypto.randomUUID()}`,
    File_Order: payload?.File_Order ?? null,
    File_Name:
      normalizeNullableString(payload?.File_Name) ||
      normalizeNullableString(payload?.Name) ||
      normalizeNullableString(payload?.title) ||
      'Untitled File',
    File_Summary:
      normalizeNullableString(payload?.File_Summary) ||
      normalizeNullableString(payload?.Summary) ||
      '',
    File_Status: normalizedFileStatus,
    File_Guide_Path: normalizeNullableString(payload?.File_Guide_Path) || '',
    File_Class: normalizeNullableString(payload?.File_Class) || 'L1',
    File_Bucket: normalizedFileBucket,
    Ownership_Mode: normalizeNullableString(payload?.Ownership_Mode) || 'root_owned',
    File_Owner: normalizeNullableString(payload?.File_Owner) || 'Owner',
    File_Steward: normalizeNullableString(payload?.File_Steward) || 'File Steward',
    Rulebook_Dependencies: normalizeNullableString(payload?.Rulebook_Dependencies) || '',
    Fork_Mode: normalizeNullableString(payload?.Fork_Mode) || 'none',
    Fork_Enabled: normalizeNullableString(payload?.Fork_Enabled) || 'No',
    Create_Fork_Instructions: normalizeNullableString(payload?.Create_Fork_Instructions) || '',
    View_Fork_Instructions: normalizeNullableString(payload?.View_Fork_Instructions) || '',
    Defined_Structure: normalizeNullableString(payload?.Defined_Structure) || '',
    Glossary_Terms: normalizeNullableString(payload?.Glossary_Terms) || '',
    sourceKey: normalizedSourceKey,
    File_Canonical_Entity: normalizeNullableString(payload?.File_Canonical_Entity) || '',
    File_Runtime_Entity: normalizeNullableString(payload?.File_Runtime_Entity) || '',
    File_Route_Name: normalizeNullableString(payload?.File_Route_Name) || normalizedSourceKey,
    File_Path: normalizeNullableString(payload?.File_Path) || (normalizedSourceKey ? `/${normalizedSourceKey}` : ''),
  }
}

const ACCEPTED_FILE_STATUS_VALUES = Object.freeze(['Active', 'Archived'])
const ACCEPTED_FILE_BUCKET_VALUES = Object.freeze(['Owner', 'Companion', 'Work', 'Shared'])
const ACCEPTED_FORK_MODE_VALUES = Object.freeze(['none', 'view', 'create', 'view_and_create'])
const PROTECTED_BOOTSTRAP_FILE_SOURCE_KEYS = new Set(['file-system', 'events', 'bb-file'])
const FILE_BUCKET_BY_SOURCE_KEY = Object.freeze({
  'file-system': 'Shared',
  events: 'Shared',
  users: 'Owner',
  contacts: 'Shared',
  'user-roles': 'Owner',
  'companion-roles': 'Companion',
  projects: 'Work',
  tasks: 'Work',
  notes: 'Work',
  artifacts: 'Work',
  intake: 'Work',
  companies: 'Shared',
  opportunities: 'Shared',
  funds: 'Shared',
  rounds: 'Shared',
  markets: 'Shared',
  securities: 'Shared',
  'bb-file': 'Shared',
})
const FILE_GUIDE_PATH_BY_SOURCE_KEY = Object.freeze({
  'bb-file': 'docs/100/Archive/100-BB_Shell.md',
  events: 'docs/100/Archive/100-Events.md',
  'file-system': 'docs/010/System.md',
  users: 'docs/100/Archive/100-Users.md',
  artifacts: 'docs/100/Archive/100-Artifacts.md',
  contacts: 'docs/100/Archive/100-Contacts.md',
  companies: 'docs/100/Archive/100-Companies.md',
  opportunities: 'docs/100/Archive/100-Opportunities.md',
  funds: 'docs/100/Archive/100-Funds.md',
  rounds: 'docs/100/Archive/100-Rounds.md',
  projects: 'docs/100/Archive/100-Projects.md',
  tasks: 'docs/100/Archive/100-Tasks.md',
  notes: 'docs/100/Archive/100-Notes.md',
  'user-roles': 'docs/100/Archive/100-User_Roles.md',
  'companion-roles': 'docs/100/Archive/100-Companion_Roles.md',
  markets: 'docs/100/Archive/100-Markets.md',
  securities: 'docs/100/Archive/100-Securities.md',
  intake: 'docs/100/Archive/100-Intake.md',
})

function getDefaultFileStatusForGuidePath(guidePath = '') {
  const normalizedPath = String(guidePath || '').trim().toLowerCase()
  if (normalizedPath.startsWith('docs/') && !normalizedPath.includes('/archive/')) return 'Active'
  if (normalizedPath.includes('/active/')) return 'Active'
  if (normalizedPath.includes('/archive/')) return 'Archived'
  return 'Archived'
}

function normalizeFileStatusValue(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized === 'active') return 'Active'
  if (['archived', 'archive', 'draft', 'partial', 'hidden'].includes(normalized)) return 'Archived'
  const match = ACCEPTED_FILE_STATUS_VALUES.find((status) => status.toLowerCase() === normalized)
  return match || ''
}

function getDefaultFileBucketForSourceKey(sourceKey = '') {
  const normalized = String(sourceKey || '').trim().toLowerCase()
  return FILE_BUCKET_BY_SOURCE_KEY[normalized] || 'Shared'
}

function normalizeFileBucketValue(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  if (!normalized) return ''
  const match = ACCEPTED_FILE_BUCKET_VALUES.find((bucket) => bucket.toLowerCase() === normalized)
  return match || ''
}

function normalizeYesNoValue(value) {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized === 'yes') return 'Yes'
  if (normalized === 'no') return 'No'
  return ''
}

function normalizeForkModeValue(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return ACCEPTED_FORK_MODE_VALUES.includes(normalized) ? normalized : ''
}

function buildFilesAcceptanceValidation(rows = []) {
  const issues = []
  const rowsBySourceKey = new Map()

  rows.forEach((row) => {
    const sourceKey = String(row?.sourceKey || '').trim()
    if (sourceKey && !rowsBySourceKey.has(sourceKey)) rowsBySourceKey.set(sourceKey, row)
  })

  const addIssue = ({ severity = 'warn', sourceKey = '', fileId = '', field = '', issue = '', suggestedAction = '' } = {}) => {
    if (!issue) return
    issues.push({
      severity,
      sourceKey: String(sourceKey || '').trim(),
      fileId: String(fileId || '').trim(),
      field: String(field || '').trim(),
      issue: String(issue || '').trim(),
      suggestedAction: String(suggestedAction || '').trim(),
    })
  }

  const parseDefinedStructure = (rawValue = '') => {
    const raw = String(rawValue || '').trim()
    if (!raw) return { parsed: null, error: 'missing' }
    try {
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return { parsed: null, error: 'invalid' }
      return { parsed, error: '' }
    } catch {
      return { parsed: null, error: 'invalid' }
    }
  }

  const getSectionByLabel = (sections = [], label = '') => {
    const normalized = String(label || '').trim().toLowerCase()
    if (!normalized) return null
    return (Array.isArray(sections) ? sections : []).find((section) =>
      String(section?.label || '').trim().toLowerCase() === normalized,
    ) || null
  }

  const tokenHasRole = (tokens = [], role = '') => {
    const normalized = String(role || '').trim().toLowerCase()
    if (!normalized) return false
    return (Array.isArray(tokens) ? tokens : []).some(
      (token) => String(token?.tokenRole || token?.token_role || '').trim().toLowerCase() === normalized,
    )
  }

  const tokenHasType = (tokens = [], type = '') => {
    const normalized = String(type || '').trim().toLowerCase()
    if (!normalized) return false
    return (Array.isArray(tokens) ? tokens : []).some(
      (token) => String(token?.tokenType || token?.token_type || '').trim().toLowerCase() === normalized,
    )
  }

  FILE_PAGE_REGISTRY.forEach((entry, index) => {
    const sourceKey = String(entry?.key || '').trim()
    const row = rowsBySourceKey.get(sourceKey)
    const expected = buildDefaultFileRegistryRow(entry, index)

    if (!row) {
      addIssue({
        severity: 'error',
        sourceKey,
        field: 'sourceKey',
        issue: 'Registry entry exists in structureRegistry but no System Files row was found.',
        suggestedAction: 'Create or reseed the System Files row before trusting runtime acceptance.',
      })
      return
    }

    const definedStructure = String(row?.Defined_Structure || '').trim()
    if (!definedStructure) {
      addIssue({
        severity: 'error',
        sourceKey,
        fileId: String(row?.id || '').trim(),
        field: 'Defined_Structure',
        issue: 'Defined_Structure is missing for this file. Runtime shells cannot render views or tokens without it.',
        suggestedAction: 'Seed the base System/General/LDB structure for this file inside System Files.',
      })
    } else {
      const { parsed, error } = parseDefinedStructure(definedStructure)
      if (error === 'invalid') {
        addIssue({
          severity: 'error',
          sourceKey,
          fileId: String(row?.id || '').trim(),
          field: 'Defined_Structure',
          issue: 'Defined_Structure is not valid JSON and cannot be parsed.',
          suggestedAction: 'Rebuild the structure payload for this file before trusting runtime shells.',
        })
      } else if (parsed) {
        const sections = Array.isArray(parsed.sections) ? parsed.sections : []
        const systemSection = getSectionByLabel(sections, 'System')
        const generalSection = getSectionByLabel(sections, 'General')

        if (!systemSection) {
          addIssue({
            severity: 'error',
            sourceKey,
            fileId: String(row?.id || '').trim(),
            field: 'Defined_Structure',
            issue: 'Defined_Structure is missing the System section.',
            suggestedAction: 'Restore the System section with ID + History tokens.',
          })
        } else {
          const systemTokens = Array.isArray(systemSection.tokens) ? systemSection.tokens : []
          if (!tokenHasRole(systemTokens, 'id')) {
            addIssue({
              severity: 'error',
              sourceKey,
              fileId: String(row?.id || '').trim(),
              field: 'Defined_Structure',
              issue: 'System section is missing the ID token (tokenRole: id).',
              suggestedAction: 'Restore the ID token in the System section.',
            })
          }
          if (!tokenHasType(systemTokens, 'event_log')) {
            addIssue({
              severity: 'error',
              sourceKey,
              fileId: String(row?.id || '').trim(),
              field: 'Defined_Structure',
              issue: 'System section is missing the History token (tokenType: event_log).',
              suggestedAction: 'Restore the History token in the System section.',
            })
          }
        }

        if (!generalSection) {
          addIssue({
            severity: 'error',
            sourceKey,
            fileId: String(row?.id || '').trim(),
            field: 'Defined_Structure',
            issue: 'Defined_Structure is missing the General section.',
            suggestedAction: 'Restore the General section with Name + Summary tokens.',
          })
        } else {
          const generalTokens = Array.isArray(generalSection.tokens) ? generalSection.tokens : []
          if (!tokenHasRole(generalTokens, 'title')) {
            addIssue({
              severity: 'error',
              sourceKey,
              fileId: String(row?.id || '').trim(),
              field: 'Defined_Structure',
              issue: 'General section is missing the Name token (tokenRole: title).',
              suggestedAction: 'Restore the Name token in the General section.',
            })
          }
          if (!tokenHasRole(generalTokens, 'summary')) {
            addIssue({
              severity: 'error',
              sourceKey,
              fileId: String(row?.id || '').trim(),
              field: 'Defined_Structure',
              issue: 'General section is missing the Summary token (tokenRole: summary).',
              suggestedAction: 'Restore the Summary token in the General section.',
            })
          }
        }
      }
    }

    const fileId = String(row?.id || '').trim()
    const statusValue = normalizeFileStatusValue(row?.File_Status)
    const expectedGuideRequired = !PROTECTED_BOOTSTRAP_FILE_SOURCE_KEYS.has(sourceKey)
    const guidePath = String(row?.File_Guide_Path || '').trim()

    if (!statusValue) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId,
        field: 'File_Status',
        issue: `File_Status "${String(row?.File_Status || '').trim()}" is outside the approved acceptance vocabulary.`,
        suggestedAction: 'Normalize File_Status to Active or Archived.',
      })
    }

    if (String(row?.File_Canonical_Entity || '').trim() !== expected.File_Canonical_Entity) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId,
        field: 'File_Canonical_Entity',
        issue: `Canonical entity drift: expected "${expected.File_Canonical_Entity}".`,
        suggestedAction: 'Align the System Files row with structureRegistry or update the executable registry intentionally.',
      })
    }

    if (String(row?.File_Runtime_Entity || '').trim() !== expected.File_Runtime_Entity) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId,
        field: 'File_Runtime_Entity',
        issue: `Runtime entity drift: expected "${expected.File_Runtime_Entity}".`,
        suggestedAction: 'Align runtime entity naming with structureRegistry and runtime ownership.',
      })
    }

    if (String(row?.File_Route_Name || '').trim() !== expected.File_Route_Name) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId,
        field: 'File_Route_Name',
        issue: `Route name drift: expected "${expected.File_Route_Name}".`,
        suggestedAction: 'Align the route name with the executable registry before treating the file as accepted.',
      })
    }

    if (String(row?.File_Path || '').trim() !== expected.File_Path) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId,
        field: 'File_Path',
        issue: `Route path drift: expected "${expected.File_Path}".`,
        suggestedAction: 'Align the route path with structureRegistry or change the registry intentionally.',
      })
    }

    if (Number(row?.File_Order || 0) !== Number(expected.File_Order || 0)) {
      addIssue({
        severity: 'info',
        sourceKey,
        fileId,
        field: 'File_Order',
        issue: `File order differs from the executable registry seed (${expected.File_Order}).`,
        suggestedAction: 'Keep if intentional, otherwise realign the row order with the registry seed.',
      })
    }

    if (normalizeForkModeValue(row?.Fork_Mode) !== expected.Fork_Mode) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId,
        field: 'Fork_Mode',
        issue: `Fork_Mode drift: expected "${expected.Fork_Mode}".`,
        suggestedAction: 'Align fork mode with the registry-declared branch or view-fork behavior.',
      })
    }

    if (normalizeYesNoValue(row?.Fork_Enabled) !== expected.Fork_Enabled) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId,
        field: 'Fork_Enabled',
        issue: `Fork_Enabled drift: expected "${expected.Fork_Enabled}".`,
        suggestedAction: 'Align fork enabled state with the registry-declared fork availability.',
      })
    }

    if (String(row?.Create_Fork_Instructions || '').trim() !== String(expected.Create_Fork_Instructions || '').trim()) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId,
        field: 'Create_Fork_Instructions',
        issue: 'Create fork instructions drift from registry truth.',
        suggestedAction: 'Reseed or realign create fork instructions with the registry-declared branch payload.',
      })
    }

    if (String(row?.View_Fork_Instructions || '').trim() !== String(expected.View_Fork_Instructions || '').trim()) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId,
        field: 'View_Fork_Instructions',
        issue: 'View fork instructions drift from registry truth.',
        suggestedAction: 'Reseed or realign view fork instructions with the registry-declared fork payload.',
      })
    }

    if (statusValue === 'Active' && expectedGuideRequired && !guidePath) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId,
        field: 'File_Guide_Path',
        issue: 'Active file is missing File_Guide_Path and does not qualify as a protected bootstrap exception.',
        suggestedAction: 'Add a real guide path or move the file to Archived until the guide exists.',
      })
    }

    if (statusValue && statusValue !== 'Active' && entry.showInWorkspaceNav) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId,
        field: 'File_Status',
        issue: `System Files status is "${statusValue}" while structureRegistry still marks this file visible in workspace navigation.`,
        suggestedAction: 'Promote the guide and file status to Active, hide the file from workspace nav, or mark it as an explicit bootstrap exception.',
      })
    }
  })

  rows.forEach((row) => {
    const sourceKey = String(row?.sourceKey || '').trim()
    if (!sourceKey) {
      addIssue({
        severity: 'warn',
        fileId: String(row?.id || '').trim(),
        field: 'sourceKey',
        issue: 'System Files row is missing sourceKey.',
        suggestedAction: 'Add the missing source key or remove the orphan row.',
      })
      return
    }
    if (!getFileRegistryEntryBySourceKey(sourceKey)) {
      addIssue({
        severity: 'warn',
        sourceKey,
        fileId: String(row?.id || '').trim(),
        field: 'sourceKey',
        issue: 'System Files row has no matching structureRegistry entry.',
        suggestedAction: 'Add the registry entry or retire the row if the file is no longer accepted.',
      })
    }
  })

  const severityCounts = issues.reduce(
    (counts, issue) => {
      const severity = String(issue?.severity || 'info').trim().toLowerCase()
      if (severity === 'error') counts.error += 1
      else if (severity === 'warn') counts.warn += 1
      else counts.info += 1
      return counts
    },
    { error: 0, warn: 0, info: 0 },
  )

  return {
    checkedAt: new Date().toISOString(),
    statuses: [...ACCEPTED_FILE_STATUS_VALUES],
    protectedBootstrapSourceKeys: [...PROTECTED_BOOTSTRAP_FILE_SOURCE_KEYS],
    rowCount: rows.length,
    registryCount: FILE_PAGE_REGISTRY.length,
    driftFree: issues.length === 0,
    severityCounts,
    issues,
  }
}

function listFiles() {
  initDb()
  const files = dbAll(
    `
      SELECT
        id,
        File_Order,
        File_Name,
        File_Summary,
        File_Status,
        File_Guide_Path,
        File_Class,
        File_Bucket,
        Ownership_Mode,
        File_Owner,
        File_Steward,
        Rulebook_Dependencies,
        Fork_Mode,
        Fork_Enabled,
        Create_Fork_Instructions,
        View_Fork_Instructions,
        Defined_Structure,
        Glossary_Terms,
        sourceKey,
        File_Canonical_Entity,
        File_Runtime_Entity,
        File_Route_Name,
        File_Path,
        File_EventLog,
        created_by,
        created_at,
        updated_at
      FROM Files
      ORDER BY COALESCE(File_Order, 9999), File_Name, id
    `,
  )
  return {
    files,
    validation: buildFilesAcceptanceValidation(files),
  }
}

function createFile(payload = {}) {
  const database = initDb()
  const name =
    normalizeNullableString(payload?.File_Name) ||
    normalizeNullableString(payload?.Name) ||
    normalizeNullableString(payload?.title)

  if (!name) throw new Error('File name is required')

  const sourceKey =
    normalizeNullableString(payload?.sourceKey) ||
    normalizeNullableString(payload?.sourceKey) ||
    toFileSourceKey(name)
  if (!sourceKey) throw new Error('File source key is required')

  const registryEntry = getFileRegistryEntryBySourceKey(sourceKey)
  const registryDefaults = registryEntry
    ? buildDefaultFileRegistryRow(registryEntry, FILE_PAGE_REGISTRY.indexOf(registryEntry))
    : buildDraftFileDefinitionRow(sourceKey, payload)
  const existingFile = database.prepare('SELECT id FROM Files WHERE sourceKey = ? LIMIT 1').get(sourceKey)
  if (existingFile?.id) throw new Error('File source key is already in use')

  const duplicateActiveName = database
    .prepare(
      `
      SELECT id
      FROM Files
      WHERE lower(trim(File_Name)) = lower(trim(?))
        AND lower(trim(COALESCE(File_Status, ''))) = 'active'
      LIMIT 1
    `,
    )
    .get(name)
  if (duplicateActiveName?.id) throw new Error('File name is already in use by another active file')

  const actor = getAuditActor(database)

  const id = normalizeNullableString(payload?.id) || `file:${crypto.randomUUID()}`
  const normalizedFileStatus =
    normalizeFileStatusValue(payload?.File_Status) ||
    normalizeFileStatusValue(payload?.Status) ||
    registryDefaults.File_Status
  const normalizedFileBucket =
    normalizeFileBucketValue(payload?.File_Bucket) ||
    normalizeFileBucketValue(payload?.Bucket) ||
    registryDefaults.File_Bucket

  database.prepare(`
    INSERT INTO Files (
      id,
      File_Order,
      File_Name,
      File_Summary,
      File_Status,
      File_Guide_Path,
      File_Class,
      File_Bucket,
      Ownership_Mode,
      File_Owner,
      File_Steward,
      Rulebook_Dependencies,
      Fork_Mode,
      Fork_Enabled,
      Create_Fork_Instructions,
      View_Fork_Instructions,
      Defined_Structure,
      Glossary_Terms,
      sourceKey,
      File_Canonical_Entity,
      File_Runtime_Entity,
      File_Route_Name,
      File_Path,
      File_EventLog,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      @id,
      @File_Order,
      @File_Name,
      @File_Summary,
      @File_Status,
      @File_Guide_Path,
      @File_Class,
      @File_Bucket,
      @Ownership_Mode,
      @File_Owner,
      @File_Steward,
      @Rulebook_Dependencies,
      @Fork_Mode,
      @Fork_Enabled,
      @Create_Fork_Instructions,
      @View_Fork_Instructions,
      @Defined_Structure,
      @Glossary_Terms,
      @sourceKey,
      @File_Canonical_Entity,
      @File_Runtime_Entity,
      @File_Route_Name,
      @File_Path,
      @File_EventLog,
      @created_by,
      datetime('now'),
      datetime('now')
    )
  `).run({
    id,
    File_Order: payload?.File_Order ?? registryDefaults.File_Order,
    File_Name: name,
    File_Summary:
      normalizeNullableString(payload?.File_Summary) ||
      normalizeNullableString(payload?.Summary) ||
      registryDefaults.File_Summary,
    File_Status: normalizedFileStatus,
    File_Guide_Path: normalizeNullableString(payload?.File_Guide_Path) || registryDefaults.File_Guide_Path,
    File_Class: normalizeNullableString(payload?.File_Class) || registryDefaults.File_Class,
    File_Bucket: normalizedFileBucket,
    Ownership_Mode: normalizeNullableString(payload?.Ownership_Mode) || registryDefaults.Ownership_Mode,
    File_Owner: normalizeNullableString(payload?.File_Owner) || registryDefaults.File_Owner,
    File_Steward: normalizeNullableString(payload?.File_Steward) || registryDefaults.File_Steward,
    Rulebook_Dependencies: normalizeNullableString(payload?.Rulebook_Dependencies) || registryDefaults.Rulebook_Dependencies,
    Fork_Mode: normalizeNullableString(payload?.Fork_Mode) || registryDefaults.Fork_Mode,
    Fork_Enabled: normalizeNullableString(payload?.Fork_Enabled) || registryDefaults.Fork_Enabled,
    Create_Fork_Instructions:
      normalizeNullableString(payload?.Create_Fork_Instructions) || registryDefaults.Create_Fork_Instructions,
    View_Fork_Instructions:
      normalizeNullableString(payload?.View_Fork_Instructions) || registryDefaults.View_Fork_Instructions,
    Defined_Structure: normalizeNullableString(payload?.Defined_Structure) || registryDefaults.Defined_Structure,
    Glossary_Terms: normalizeNullableString(payload?.Glossary_Terms) || registryDefaults.Glossary_Terms,
    sourceKey,
    File_Canonical_Entity: normalizeNullableString(payload?.File_Canonical_Entity) || registryDefaults.File_Canonical_Entity,
    File_Runtime_Entity: normalizeNullableString(payload?.File_Runtime_Entity) || registryDefaults.File_Runtime_Entity,
    File_Route_Name: normalizeNullableString(payload?.File_Route_Name) || registryDefaults.File_Route_Name,
    File_Path: normalizeNullableString(payload?.File_Path) || registryDefaults.File_Path,
    File_EventLog: normalizeNullableString(payload?.File_EventLog),
    created_by: actor.user_id,
  })

  return { id }
}

function toFileSourceKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function ensureDefaultBuildingBlocks(database) {
  const buildingBlockMeta = getTableMeta(database, 'Building_Blocks')
  if (!buildingBlockMeta.columnsSet.has('Used_In_Shells')) {
    database.exec('ALTER TABLE Building_Blocks ADD COLUMN Used_In_Shells TEXT')
  }
  if (!buildingBlockMeta.columnsSet.has('Built_From_BBs')) {
    database.exec('ALTER TABLE Building_Blocks ADD COLUMN Built_From_BBs TEXT')
  }
  if (!buildingBlockMeta.columnsSet.has('Convergence_Rule')) {
    database.exec('ALTER TABLE Building_Blocks ADD COLUMN Convergence_Rule TEXT')
  }

  const insertRow = database.prepare(`
    INSERT INTO Building_Blocks (
      id,
      Sort_Order,
      Name,
      Summary,
      Category,
      Status,
      Used_In,
      Used_In_Shells,
      Use_When,
      Avoid_When,
      Built_From_BBs,
      Anatomy,
      Required_Parts,
      Source_Path,
      Owner,
      Extraction_Status,
      Reconstruction_Notes,
      Convergence_Rule,
      Prompt,
      Variants,
      created_by,
      created_at,
      updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
    )
  `)
  const backfillShellUsage = database.prepare(`
    UPDATE Building_Blocks
    SET Used_In_Shells = ?
    WHERE id = ?
      AND COALESCE(TRIM(Used_In_Shells), '') = ''
  `)
  const backfillConvergenceRule = database.prepare(`
    UPDATE Building_Blocks
    SET Convergence_Rule = ?
    WHERE id = ?
      AND COALESCE(TRIM(Convergence_Rule), '') = ''
  `)
  const syncCanonicalRow = database.prepare(`
    UPDATE Building_Blocks
    SET
      Sort_Order = ?,
      Name = ?,
      Summary = ?,
      Category = ?,
      Status = ?,
      Used_In = ?,
      Used_In_Shells = ?,
      Use_When = ?,
      Avoid_When = ?,
      Built_From_BBs = ?,
      Anatomy = ?,
      Required_Parts = ?,
      Source_Path = ?,
      Owner = ?,
      Extraction_Status = ?,
      Reconstruction_Notes = ?,
      Convergence_Rule = ?,
      Prompt = ?,
      Variants = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `)

  const actor = getAuditActor(database, { requireUser: false })
  const fallbackUserId = normalizeNullableString(actor?.user_id)
  const existingIds = new Set(
    database
      .prepare('SELECT id FROM Building_Blocks')
      .all()
      .map((row) => normalizeNullableString(row?.id))
      .filter(Boolean),
  )

  const tx = database.transaction(() => {
    DEFAULT_BUILDING_BLOCK_FILE_ROWS.forEach((row) => {
      const normalizedId = normalizeNullableString(row?.id) || `bb:${crypto.randomUUID()}`
      if (existingIds.has(normalizedId)) return

      insertRow.run(
        normalizedId,
        Number(row?.Sort_Order || 0) || null,
        normalizeNullableString(row?.Name) || 'Untitled Building Block',
        normalizeNullableString(row?.Summary),
        normalizeNullableString(row?.Category),
        normalizeNullableString(row?.Status),
        normalizeNullableString(row?.Used_In),
      normalizeNullableString(row?.Used_In_Shells),
      normalizeNullableString(row?.Use_When),
      normalizeNullableString(row?.Avoid_When),
      normalizeNullableString(row?.Built_From_BBs),
      normalizeNullableString(row?.Anatomy),
      normalizeNullableString(row?.Required_Parts),
        normalizeNullableString(row?.Source_Path),
        normalizeNullableString(row?.Owner),
        normalizeNullableString(row?.Extraction_Status),
        normalizeNullableString(row?.Reconstruction_Notes),
        normalizeNullableString(row?.Convergence_Rule),
        normalizeNullableString(row?.Prompt),
        normalizeNullableString(row?.Variants),
        fallbackUserId,
      )
      existingIds.add(normalizedId)
    })
    DEFAULT_BUILDING_BLOCK_FILE_ROWS.forEach((row) => {
      const normalizedId = normalizeNullableString(row?.id)
      if (!normalizedId) return
      syncCanonicalRow.run(
        Number(row?.Sort_Order || 0) || null,
        normalizeNullableString(row?.Name) || 'Untitled Building Block',
        normalizeNullableString(row?.Summary),
        normalizeNullableString(row?.Category),
        normalizeNullableString(row?.Status),
        normalizeNullableString(row?.Used_In),
        normalizeNullableString(row?.Used_In_Shells),
        normalizeNullableString(row?.Use_When),
        normalizeNullableString(row?.Avoid_When),
        normalizeNullableString(row?.Built_From_BBs),
        normalizeNullableString(row?.Anatomy),
        normalizeNullableString(row?.Required_Parts),
        normalizeNullableString(row?.Source_Path),
        normalizeNullableString(row?.Owner),
        normalizeNullableString(row?.Extraction_Status),
        normalizeNullableString(row?.Reconstruction_Notes),
        normalizeNullableString(row?.Convergence_Rule),
        normalizeNullableString(row?.Prompt),
        normalizeNullableString(row?.Variants),
        normalizedId,
      )
      backfillShellUsage.run(
        normalizeNullableString(row?.Used_In_Shells),
        normalizedId,
      )
      backfillConvergenceRule.run(
        normalizeNullableString(row?.Convergence_Rule),
        normalizedId,
      )
    })
  })

  tx()
}

function listBuildingBlocks() {
  const database = initDb()
  ensureDefaultBuildingBlocks(database)
  return dbAll(
    `
    SELECT
      id,
      Sort_Order,
      Name,
      Summary,
      Category,
      Status,
      Used_In,
      Used_In_Shells,
      Use_When,
      Avoid_When,
      Built_From_BBs,
      Anatomy,
      Required_Parts,
      Source_Path,
      Owner,
      Extraction_Status,
      Reconstruction_Notes,
      Convergence_Rule,
      Prompt,
      Variants,
      created_at,
      updated_at
    FROM Building_Blocks
    ORDER BY COALESCE(Sort_Order, 999999), created_at, id
  `,
  )
}

function createBuildingBlock(payload = {}) {
  const database = initDb()
  ensureDefaultBuildingBlocks(database)
  const actor = getAuditActor(database)
  const name =
    normalizeNullableString(payload?.Name) ||
    normalizeNullableString(payload?.BB_Name) ||
    normalizeNullableString(payload?.title)

  if (!name) throw new Error('Building block name is required')

  const id = normalizeNullableString(payload?.id) || `bb:${crypto.randomUUID()}`
  const existingMaxSortOrder = Number(
    database.prepare('SELECT COALESCE(MAX(Sort_Order), 0) AS maxSortOrder FROM Building_Blocks').get()?.maxSortOrder || 0,
  )

  database
    .prepare(
      `
      INSERT INTO Building_Blocks (
        id,
        Sort_Order,
        Name,
        Summary,
        Category,
        Status,
        Used_In,
        Used_In_Shells,
        Use_When,
        Avoid_When,
        Built_From_BBs,
        Anatomy,
        Required_Parts,
        Source_Path,
        Owner,
        Extraction_Status,
        Reconstruction_Notes,
        Convergence_Rule,
        Prompt,
        Variants,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
      )
    `,
    )
    .run(
      id,
      Number(payload?.Sort_Order || 0) || existingMaxSortOrder + 1,
      name,
      normalizeNullableString(payload?.Summary) || normalizeNullableString(payload?.BB_Summary),
      normalizeNullableString(payload?.Category) || normalizeNullableString(payload?.BB_Category) || 'Building Blocks',
      normalizeNullableString(payload?.Status) || normalizeNullableString(payload?.BB_Status) || 'Extract Next',
      normalizeNullableString(payload?.Used_In) || normalizeNullableString(payload?.BB_Used_In),
      normalizeNullableString(payload?.Used_In_Shells) || normalizeNullableString(payload?.BB_Used_In_Shells),
      normalizeNullableString(payload?.Use_When) || normalizeNullableString(payload?.BB_Use_When),
      normalizeNullableString(payload?.Avoid_When) || normalizeNullableString(payload?.BB_Avoid_When),
      normalizeNullableString(payload?.Built_From_BBs) || normalizeNullableString(payload?.BB_Built_From_BBs),
      normalizeNullableString(payload?.Anatomy) || normalizeNullableString(payload?.BB_Anatomy),
      normalizeNullableString(payload?.Required_Parts) || normalizeNullableString(payload?.BB_Required_Parts),
      normalizeNullableString(payload?.Source_Path) || normalizeNullableString(payload?.BB_Source_Path),
      normalizeNullableString(payload?.Owner) || normalizeNullableString(payload?.BB_Owner) || actor.user_label || 'BB File',
      normalizeNullableString(payload?.Extraction_Status) || normalizeNullableString(payload?.BB_Extraction_Status),
      normalizeNullableString(payload?.Reconstruction_Notes) || normalizeNullableString(payload?.BB_Reconstruction_Notes),
      normalizeNullableString(payload?.Convergence_Rule) || normalizeNullableString(payload?.BB_Convergence_Rule),
      normalizeNullableString(payload?.Prompt) || normalizeNullableString(payload?.BB_Prompt),
      normalizeNullableString(payload?.Variants) || normalizeNullableString(payload?.BB_Variants),
      normalizeNullableString(payload?.created_by) || actor.user_id,
    )

  return { id }
}

function createRole(payload = {}) {
  const database = initDb()
  const actor = getAuditActor(database)
  const name =
    normalizeNullableString(payload?.Role_Name) ||
    normalizeNullableString(payload?.Name) ||
    normalizeNullableString(payload?.title)

  if (!name) throw new Error('Role name is required')

  const id = normalizeNullableString(payload?.id) || `role:${crypto.randomUUID()}`
  const summary =
    normalizeNullableString(payload?.Role_Summary) ||
    normalizeNullableString(payload?.Summary) ||
    normalizeNullableString(payload?.description)

  database
    .prepare(
      `
      INSERT INTO Roles (
        id, Role_Name, Role_Summary, created_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, datetime('now'), datetime('now')
      )
    `,
    )
    .run(
      id,
      name,
      summary,
      normalizeNullableString(payload?.created_by) || actor.user_id,
    )

  return { id }
}

function createCompanionRole(payload = {}) {
  const database = initDb()
  const actor = getAuditActor(database)
  const name =
    normalizeNullableString(payload?.Companion_Role_Name) ||
    normalizeNullableString(payload?.Name) ||
    normalizeNullableString(payload?.title)

  if (!name) throw new Error('Companion role name is required')

  const id = normalizeNullableString(payload?.id) || `companion-role:${crypto.randomUUID()}`
  const summary =
    normalizeNullableString(payload?.Companion_Role_Summary) ||
    normalizeNullableString(payload?.Summary) ||
    normalizeNullableString(payload?.description)
  const roleType =
    normalizeNullableString(payload?.Companion_Role_Type) ||
    normalizeNullableString(payload?.Type) ||
    'Companion'
  const roleStatus =
    normalizeNullableString(payload?.Companion_Role_Status) ||
    normalizeNullableString(payload?.Status) ||
    'Draft'
  const contractPath =
    normalizeNullableString(payload?.Companion_Role_Contract_Path) ||
    normalizeNullableString(payload?.Contract_Path)

  database
    .prepare(
      `
      INSERT INTO Companion_Roles (
        id,
        Companion_Role_Name,
        Companion_Role_Summary,
        Companion_Role_Type,
        Companion_Role_Status,
        Companion_Role_Contract_Path,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
      )
    `,
    )
    .run(
      id,
      name,
      summary,
      roleType,
      roleStatus,
      contractPath,
      normalizeNullableString(payload?.created_by) || actor.user_id,
    )

  return { id }
}

function listRecordHistoryEntries(tableName, recordId) {
  const config = getRecordTableConfig(tableName)
  const rid = normalizeNullableString(recordId)
  if (!rid) throw new Error('recordId is required')
  return dbAll(
    `
    SELECT
      id,
      table_name,
      record_id,
      created_at,
      created_by
    FROM databook_snapshots
    WHERE table_name = ? AND record_id = ?
    ORDER BY datetime(created_at) DESC, id DESC
  `,
    [config.tableName, rid],
  )
}

function getRecordHistoryEntry(snapshotId) {
  const sid = String(snapshotId || '').trim()
  if (!sid) throw new Error('snapshotId is required')
  const row = dbAll(
    `
    SELECT
      id,
      table_name,
      record_id,
      payload_json,
      created_at,
      created_by
    FROM databook_snapshots
    WHERE id = ?
    LIMIT 1
  `,
    [sid],
  )?.[0]
  if (!row) throw new Error(`Snapshot not found: ${sid}`)
  return {
    ...row,
    payload: JSON.parse(String(row.payload_json || '{}')),
  }
}

// eslint-disable-next-line no-unused-vars
function getLegacyOpportunityDatabookView(opportunityId) {
  const oid = String(opportunityId || '').trim()
  if (!oid) throw new Error('opportunityId is required')
  const database = initDb()
  const hasTableStmt = database.prepare(
    `SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`,
  )
  const hasTable = (name) => Boolean(hasTableStmt.get(name))
  const unique = (values) => [...new Set(values.filter((v) => String(v || '').trim()))]
  const quote = (name) => `"${String(name).replaceAll('"', '""')}"`

  const readEdgeIds = (tableNames, targetId) => {
    const ids = []
    for (const table of tableNames) {
      if (!hasTable(table)) continue
      const fromRows = database
        .prepare(`SELECT from_id AS related_id FROM ${quote(table)} WHERE to_id = ?`)
        .all(targetId)
      const toRows = database
        .prepare(`SELECT to_id AS related_id FROM ${quote(table)} WHERE from_id = ?`)
        .all(targetId)
      ids.push(...fromRows.map((r) => r.related_id), ...toRows.map((r) => r.related_id))
    }
    return unique(ids)
  }

  const selectByIds = (table, ids, sql) => {
    if (!hasTable(table) || !ids.length) return []
    const placeholders = ids.map(() => '?').join(', ')
    return database.prepare(sql(placeholders)).all(...ids)
  }

  const opportunity = dbAll(
    `
    SELECT
      o.id,
      o.kind,
      o.company_id,
      COALESCE(
        o.Venture_Oppty_Name,
        CASE
          WHEN c.Company_Name IS NOT NULL AND c.Company_Name <> '' THEN
            replace(trim(c.Company_Name), ' ', '_') || '_' || substr(COALESCE(o.created_at, datetime('now')), 1, 10)
          ELSE o.id
        END
      ) AS opportunity_name,
      o.Venture_Oppty_Name,
      o.Raising_Status,
      o.Investment_Ask,
      o.Hard_Commits,
      o.Soft_Commits,
      o.First_Close_Date,
      o.Next_Close_Date,
      o.Final_Close_Date,
      o.Round_Stage,
      o.Type_of_Security,
      o.Round_Amount,
      o.Pre_Valuation,
      o.Post_Valuation,
      o.Previous_Post,
      o.created_at,
      c.Company_Name
    FROM Opportunities o
    LEFT JOIN Companies c ON c.id = o.company_id
    WHERE o.id = ?
    LIMIT 1
  `,
    [oid],
  )?.[0]
  if (!opportunity) throw new Error(`Opportunity not found: ${oid}`)

  const fund =
    hasTable('Fund_Opportunities') && hasTable('Opportunities')
      ? dbAll(
          `
          SELECT
            f.opportunity_id,
            f.Fund_Type,
            f.Fund_Size_Target,
            f.Initial_Ticket_Size,
            f.Target_Positions,
            f.Follow_on_Reserve,
            f.Investment_Stages,
            f.Company_Stages
          FROM Fund_Opportunities f
          WHERE f.opportunity_id = ?
          LIMIT 1
        `,
          [oid],
        )?.[0] || null
      : null

  const round =
    hasTable('Round_Opportunities') && hasTable('Opportunities')
      ? dbAll(
          `
          SELECT
            r.opportunity_id,
            r.Round_Stage,
            r.Type_of_Security,
            r.Round_Amount,
            r.Pre_Valuation,
            r.Post_Valuation,
            r.Previous_Post
          FROM Round_Opportunities r
          WHERE r.opportunity_id = ?
          LIMIT 1
        `,
          [oid],
        )?.[0] || null
      : null

  const contactIds = readEdgeIds(
    [
      'Contacts_Opportunities_captable_individual',
      'Contacts_Opportunities_captable_individuals_fund',
      'Contacts_Opportunities_rounds_invested',
      'Contacts_Opportunities_funds_invested',
      'Contacts_Funds_captable_individual',
      'Contacts_Funds_captable_individuals',
      'Contacts_Funds_rounds_invested',
      'Contacts_Funds_funds_invested',
    ],
    oid,
  )

  const primaryContact =
    hasTable('Contacts') && contactIds.length
      ? selectByIds(
          'Contacts',
          contactIds,
          (placeholders) => `
            SELECT
              id, Name, Personal_Email, Professional_Email, Phone, LinkedIn, Country_based
            FROM Contacts
            WHERE id IN (${placeholders})
            ORDER BY COALESCE(Name, ''), id
            LIMIT 1
          `,
        )?.[0] || null
      : null

  const projectIds = readEdgeIds(
    [
      'Projects_Opportunities_parent_project',
      'Projects_Opportunities_parent_project_fund',
      'Projects_Opportunities_related_round',
      'Projects_Opportunities_related_fund',
      'Projects_Funds_parent_project',
      'Projects_Funds_related_round',
      'Projects_Funds_related_fund',
    ],
    oid,
  )

  const projects = selectByIds(
    'Projects',
    projectIds,
    (placeholders) => `
      SELECT
        p.id AS project_id,
        p.Project_Name,
        po.Project_Status AS project_status,
        po.Project_Priority_Rank AS project_priority,
        po.Project_Due_Date AS project_due_date
      FROM Projects p
      LEFT JOIN Project_Overview po ON po.project_id = p.id
      WHERE p.id IN (${placeholders})
      ORDER BY COALESCE(p.Project_Name, ''), p.id
    `,
  )

  const directTaskIds = readEdgeIds(
    [
      'Tasks_Rounds_tasks',
      'Tasks_Rounds_related_round',
      'Tasks_Funds_tasks',
      'Tasks_Funds_related_fund',
    ],
    oid,
  )

  const projectTaskIds = []
  if (projectIds.length) {
    const placeholders = projectIds.map(() => '?').join(', ')
    if (hasTable('Projects_Tasks_has_tasks')) {
      const fromRows = database
        .prepare(
          `SELECT to_id AS task_id FROM Projects_Tasks_has_tasks WHERE from_id IN (${placeholders})`,
        )
        .all(...projectIds)
      const toRows = database
        .prepare(
          `SELECT from_id AS task_id FROM Projects_Tasks_has_tasks WHERE to_id IN (${placeholders})`,
        )
        .all(...projectIds)
      projectTaskIds.push(...fromRows.map((r) => r.task_id), ...toRows.map((r) => r.task_id))
    }
    if (hasTable('Tasks_Projects_projects')) {
      const fromRows = database
        .prepare(
          `SELECT from_id AS task_id FROM Tasks_Projects_projects WHERE to_id IN (${placeholders})`,
        )
        .all(...projectIds)
      const toRows = database
        .prepare(
          `SELECT to_id AS task_id FROM Tasks_Projects_projects WHERE from_id IN (${placeholders})`,
        )
        .all(...projectIds)
      projectTaskIds.push(...fromRows.map((r) => r.task_id), ...toRows.map((r) => r.task_id))
    }
  }

  const taskIds = unique([...directTaskIds, ...projectTaskIds])
  const tasks = selectByIds(
    'Tasks',
    taskIds,
    (placeholders) => `
      SELECT
        t.id AS task_id,
        t.Task_Name,
        tov.Task_Status AS task_status,
        tov.Task_Priority_Rank AS task_priority,
        tov.Task_Due_Date AS task_due_date
      FROM Tasks t
      LEFT JOIN Task_Overview tov ON tov.task_id = t.id
      WHERE id IN (${placeholders})
      ORDER BY COALESCE(tov.Task_Due_Date, ''), COALESCE(t.Task_Name, ''), t.id
    `,
  )

  const artifacts = hasTable('Artifacts')
    ? dbAll(
        `
        SELECT
          a.artifact_id,
          a.title AS artifact_title,
          a.artifact_type,
          a.fs_path,
          a.created_at AS artifact_created_at
        FROM Artifact_Details a
        WHERE a.opportunity_id = ?
        ORDER BY COALESCE(a.created_at, ''), a.artifact_id
      `,
        [oid],
      )
    : []

  const fields = []
  const addField = ({
    section,
    label,
    value,
    tableName = null,
    recordId = null,
    fieldName = null,
    idColumn = null,
  }) => {
    const safeSection = String(section || '').trim() || 'General'
    const safeLabel = String(label || '').trim() || 'Field'
    const normalizedValue = value == null ? '' : String(value)
    const editable = Boolean(tableName && recordId && fieldName && idColumn)
    const key = editable
      ? `${tableName}:${idColumn}:${recordId}:${fieldName}`
      : `readonly:${safeSection}:${safeLabel}:${fields.length + 1}`
    fields.push({
      key,
      section: safeSection,
      label: safeLabel,
      value: normalizedValue,
      editable,
      table_name: tableName,
      record_id: recordId,
      field_name: fieldName,
      id_column: idColumn,
    })
  }

  addField({
    section: 'Opportunity',
    label: 'Opportunity Name',
    value: opportunity.opportunity_name || opportunity.Venture_Oppty_Name || opportunity.id,
    tableName: 'Opportunities',
    recordId: opportunity.id,
    fieldName: 'Venture_Oppty_Name',
    idColumn: 'id',
  })
  addField({ section: 'Opportunity', label: 'Kind', value: opportunity.kind })
  addField({
    section: 'Opportunity',
    label: 'Raising Status',
    value: opportunity.Raising_Status,
    tableName: 'Opportunities',
    recordId: opportunity.id,
    fieldName: 'Raising_Status',
    idColumn: 'id',
  })
  addField({
    section: 'Opportunity',
    label: 'Investment Ask',
    value: opportunity.Investment_Ask,
    tableName: 'Opportunities',
    recordId: opportunity.id,
    fieldName: 'Investment_Ask',
    idColumn: 'id',
  })
  addField({
    section: 'Opportunity',
    label: 'Hard Commits',
    value: opportunity.Hard_Commits,
    tableName: 'Opportunities',
    recordId: opportunity.id,
    fieldName: 'Hard_Commits',
    idColumn: 'id',
  })
  addField({
    section: 'Opportunity',
    label: 'Soft Commits',
    value: opportunity.Soft_Commits,
    tableName: 'Opportunities',
    recordId: opportunity.id,
    fieldName: 'Soft_Commits',
    idColumn: 'id',
  })
  addField({
    section: 'Opportunity',
    label: 'First Close Date',
    value: opportunity.First_Close_Date,
    tableName: 'Opportunities',
    recordId: opportunity.id,
    fieldName: 'First_Close_Date',
    idColumn: 'id',
  })
  addField({
    section: 'Opportunity',
    label: 'Next Close Date',
    value: opportunity.Next_Close_Date,
    tableName: 'Opportunities',
    recordId: opportunity.id,
    fieldName: 'Next_Close_Date',
    idColumn: 'id',
  })
  addField({
    section: 'Opportunity',
    label: 'Final Close Date',
    value: opportunity.Final_Close_Date,
    tableName: 'Opportunities',
    recordId: opportunity.id,
    fieldName: 'Final_Close_Date',
    idColumn: 'id',
  })

  if (opportunity.company_id && hasTable('Companies')) {
    const companyRow = getCompanyAggregate(database, opportunity.company_id)
    if (companyRow) {
      addField({
        section: 'Company',
        label: 'Company Name',
        value: companyRow.Company_Name,
        tableName: 'Companies',
        recordId: companyRow.id,
        fieldName: 'Company_Name',
        idColumn: 'id',
      })
      addField({
        section: 'Company',
        label: 'Company Type',
        value: companyRow.Company_Type,
        tableName: 'Company_Incorporation_Info',
        recordId: companyRow.id,
        fieldName: 'Company_Type',
        idColumn: 'company_id',
      })
      addField({
        section: 'Company',
        label: 'Website',
        value: companyRow.Website,
        tableName: 'Companies',
        recordId: companyRow.id,
        fieldName: 'Website',
        idColumn: 'id',
      })
      addField({
        section: 'Company',
        label: 'One Liner',
        value: companyRow.One_Liner,
        tableName: 'Companies',
        recordId: companyRow.id,
        fieldName: 'One_Liner',
        idColumn: 'id',
      })
      addField({
        section: 'Company',
        label: 'Status',
        value: companyRow.Status,
        tableName: 'Company_Operations_Overview',
        recordId: companyRow.id,
        fieldName: 'Status',
        idColumn: 'company_id',
      })
      addField({
        section: 'Company',
        label: 'Date of Incorporation',
        value: companyRow.Date_of_Incorporation,
        tableName: 'Company_Incorporation_Info',
        recordId: companyRow.id,
        fieldName: 'Date_of_Incorporation',
        idColumn: 'company_id',
      })
      addField({
        section: 'Company',
        label: 'PAX Count',
        value: companyRow.PAX_Count,
        tableName: 'Company_Operations_Overview',
        recordId: companyRow.id,
        fieldName: 'PAX_Count',
        idColumn: 'company_id',
      })
      addField({
        section: 'Company',
        label: 'Updates',
        value: companyRow.Updates,
        tableName: 'Companies',
        recordId: companyRow.id,
        fieldName: 'Updates',
        idColumn: 'id',
      })
    }
  }

  if (primaryContact) {
    addField({
      section: 'Primary Contact',
      label: 'Name',
      value: primaryContact.Name,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Name',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'Personal Email',
      value: primaryContact.Personal_Email,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Personal_Email',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'Professional Email',
      value: primaryContact.Professional_Email,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Professional_Email',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'Phone',
      value: primaryContact.Phone,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Phone',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'LinkedIn',
      value: primaryContact.LinkedIn,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'LinkedIn',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'Country Based',
      value: primaryContact.Country_based,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Country_based',
      idColumn: 'id',
    })
  }

  if (opportunity.kind === 'fund' && fund) {
    addField({
      section: 'Fund',
      label: 'Fund Type',
      value: fund.Fund_Type,
      tableName: 'Fund_Opportunities',
      recordId: fund.opportunity_id,
      fieldName: 'Fund_Type',
      idColumn: 'opportunity_id',
    })
    addField({
      section: 'Fund',
      label: 'Fund Size Target',
      value: fund.Fund_Size_Target,
      tableName: 'Fund_Opportunities',
      recordId: fund.opportunity_id,
      fieldName: 'Fund_Size_Target',
      idColumn: 'opportunity_id',
    })
    addField({
      section: 'Fund',
      label: 'Initial Ticket Size',
      value: fund.Initial_Ticket_Size,
      tableName: 'Fund_Opportunities',
      recordId: fund.opportunity_id,
      fieldName: 'Initial_Ticket_Size',
      idColumn: 'opportunity_id',
    })
    addField({
      section: 'Fund',
      label: 'Target Positions',
      value: fund.Target_Positions,
      tableName: 'Fund_Opportunities',
      recordId: fund.opportunity_id,
      fieldName: 'Target_Positions',
      idColumn: 'opportunity_id',
    })
    addField({
      section: 'Fund',
      label: 'Follow-on Reserve',
      value: fund.Follow_on_Reserve,
      tableName: 'Fund_Opportunities',
      recordId: fund.opportunity_id,
      fieldName: 'Follow_on_Reserve',
      idColumn: 'opportunity_id',
    })
  } else if (opportunity.kind === 'round') {
    const roundRecordId = round?.opportunity_id || opportunity.id
    const roundTable = round ? 'Round_Opportunities' : 'Opportunities'
    const roundIdColumn = round ? 'opportunity_id' : 'id'
    addField({
      section: 'Round',
      label: 'Round Stage',
      value: round?.Round_Stage ?? opportunity.Round_Stage,
      tableName: roundTable,
      recordId: roundRecordId,
      fieldName: 'Round_Stage',
      idColumn: roundIdColumn,
    })
    addField({
      section: 'Round',
      label: 'Security Type',
      value: round?.Type_of_Security ?? opportunity.Type_of_Security,
      tableName: roundTable,
      recordId: roundRecordId,
      fieldName: 'Type_of_Security',
      idColumn: roundIdColumn,
    })
    addField({
      section: 'Round',
      label: 'Round Amount',
      value: round?.Round_Amount ?? opportunity.Round_Amount,
      tableName: roundTable,
      recordId: roundRecordId,
      fieldName: 'Round_Amount',
      idColumn: roundIdColumn,
    })
    addField({
      section: 'Round',
      label: 'Pre Valuation',
      value: round?.Pre_Valuation ?? opportunity.Pre_Valuation,
      tableName: roundTable,
      recordId: roundRecordId,
      fieldName: 'Pre_Valuation',
      idColumn: roundIdColumn,
    })
    addField({
      section: 'Round',
      label: 'Post Valuation',
      value: round?.Post_Valuation ?? opportunity.Post_Valuation,
      tableName: roundTable,
      recordId: roundRecordId,
      fieldName: 'Post_Valuation',
      idColumn: roundIdColumn,
    })
    addField({
      section: 'Round',
      label: 'Previous Post',
      value: round?.Previous_Post ?? opportunity.Previous_Post,
      tableName: roundTable,
      recordId: roundRecordId,
      fieldName: 'Previous_Post',
      idColumn: roundIdColumn,
    })
  }

  projects.forEach((project, index) => {
    const prefix = `Project ${index + 1}`
    addField({
      section: prefix,
      label: 'Project Name',
      value: project.Project_Name,
      tableName: 'Projects',
      recordId: project.project_id,
      fieldName: 'Project_Name',
      idColumn: 'id',
    })
    addField({
      section: prefix,
      label: 'Status',
      value: project.project_status,
      tableName: 'Project_Overview',
      recordId: project.project_id,
      fieldName: 'Project_Status',
      idColumn: 'project_id',
    })
    addField({
      section: prefix,
      label: 'Priority',
      value: project.project_priority,
      tableName: 'Project_Overview',
      recordId: project.project_id,
      fieldName: 'Project_Priority_Rank',
      idColumn: 'project_id',
    })
    addField({
      section: prefix,
      label: 'Due Date',
      value: project.project_due_date,
      tableName: 'Project_Overview',
      recordId: project.project_id,
      fieldName: 'Project_Due_Date',
      idColumn: 'project_id',
    })
  })

  tasks.forEach((task, index) => {
    const prefix = `Task ${index + 1}`
    addField({
      section: prefix,
      label: 'Task Name',
      value: task.Task_Name,
      tableName: 'Tasks',
      recordId: task.task_id,
      fieldName: 'Task_Name',
      idColumn: 'id',
    })
    addField({
      section: prefix,
      label: 'Status',
      value: task.task_status,
      tableName: 'Task_Overview',
      recordId: task.task_id,
      fieldName: 'Task_Status',
      idColumn: 'task_id',
    })
    addField({
      section: prefix,
      label: 'Priority',
      value: task.task_priority,
      tableName: 'Task_Overview',
      recordId: task.task_id,
      fieldName: 'Task_Priority_Rank',
      idColumn: 'task_id',
    })
    addField({
      section: prefix,
      label: 'Due Date',
      value: task.task_due_date,
      tableName: 'Task_Overview',
      recordId: task.task_id,
      fieldName: 'Task_Due_Date',
      idColumn: 'task_id',
    })
  })

  artifacts.forEach((artifact, index) => {
    const prefix = `Artifact ${index + 1}`
    addField({
      section: prefix,
      label: 'Title',
      value: artifact.artifact_title,
      tableName: 'Artifacts',
      recordId: artifact.artifact_id,
      fieldName: 'title',
      idColumn: 'artifact_id',
    })
    addField({
      section: prefix,
      label: 'Type',
      value: artifact.artifact_type,
      tableName: 'Artifacts',
      recordId: artifact.artifact_id,
      fieldName: 'artifact_type',
      idColumn: 'artifact_id',
    })
  })

  const maxRows = Math.max(projects.length, tasks.length, artifacts.length, 1)
  const rows = Array.from({ length: maxRows }, (_, i) => {
    const project = projects[i] || {}
    const task = tasks[i] || {}
    const artifact = artifacts[i] || {}
    return {
      row_index: i + 1,
      opportunity_id: opportunity.id,
      opportunity_name:
        opportunity.opportunity_name || opportunity.Venture_Oppty_Name || opportunity.id,
      kind: opportunity.kind,
      Raising_Status: opportunity.Raising_Status,
      Company_Name: opportunity.Company_Name,
      Investment_Ask: opportunity.Investment_Ask,
      Hard_Commits: opportunity.Hard_Commits,
      Soft_Commits: opportunity.Soft_Commits,
      First_Close_Date: opportunity.First_Close_Date,
      Next_Close_Date: opportunity.Next_Close_Date,
      Final_Close_Date: opportunity.Final_Close_Date,
      Round_Stage: round?.Round_Stage ?? opportunity.Round_Stage ?? null,
      Type_of_Security: round?.Type_of_Security ?? opportunity.Type_of_Security ?? null,
      Round_Amount: round?.Round_Amount ?? opportunity.Round_Amount ?? null,
      Pre_Valuation: round?.Pre_Valuation ?? opportunity.Pre_Valuation ?? null,
      Post_Valuation: round?.Post_Valuation ?? opportunity.Post_Valuation ?? null,
      Previous_Post: round?.Previous_Post ?? opportunity.Previous_Post ?? null,
      primary_contact_id: primaryContact?.id || null,
      primary_contact_name: primaryContact?.Name || null,
      primary_contact_email:
        primaryContact?.Professional_Email || primaryContact?.Personal_Email || null,
      primary_contact_phone: primaryContact?.Phone || null,
      primary_contact_role: null,
      Fund_Type: fund?.Fund_Type || null,
      Fund_Size_Target: fund?.Fund_Size_Target || null,
      Initial_Ticket_Size: fund?.Initial_Ticket_Size || null,
      Target_Positions: fund?.Target_Positions || null,
      Follow_on_Reserve: fund?.Follow_on_Reserve || null,
      Investment_Stages: fund?.Investment_Stages || null,
      Company_Stages: fund?.Company_Stages || null,
      ...project,
      ...task,
      ...artifact,
    }
  })

  return { opportunity, rows, fields }
}

const DATABOOK_TABLE_CONFIGS = Object.freeze({
  Events: {
    tableName: 'events',
    entityLabel: 'Event',
    displayColumns: ['action_label', 'field_name', 'record_id', 'id'],
    readonlyColumns: new Set(['id', 'edited_at']),
  },
  Building_Blocks: {
    tableName: 'Building_Blocks',
    entityLabel: 'Building Block',
    displayColumns: ['Name', 'Summary', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Companies: {
    tableName: 'Companies',
    entityLabel: 'Company',
    displayColumns: ['Company_Name', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Contacts: {
    tableName: 'Contacts',
    entityLabel: 'Contact',
    displayColumns: ['Name', 'Professional_Email', 'Personal_Email', 'id'],
    readonlyColumns: new Set(['id']),
  },
  Users: {
    tableName: 'Users',
    entityLabel: 'User',
    displayColumns: ['User_Name', 'User_PEmail', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Markets: {
    tableName: 'Markets',
    entityLabel: 'Market',
    displayColumns: ['Market_Name', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Securities: {
    tableName: 'Securities',
    entityLabel: 'Security',
    displayColumns: ['Security_Name', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Artifacts: {
    tableName: 'Artifacts',
    entityLabel: 'Artifact',
    displayColumns: ['title', 'artifact_id'],
    readonlyColumns: new Set(['artifact_id', 'created_at', 'updated_at']),
  },
  Roles: {
    tableName: 'Roles',
    entityLabel: 'Role',
    displayColumns: ['Role_Name', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Companion_Roles: {
    tableName: 'Companion_Roles',
    entityLabel: 'Companion Role',
    displayColumns: ['Companion_Role_Name', 'Companion_Role_Type', 'Companion_Role_Status', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Files: {
    tableName: 'Files',
    entityLabel: 'File',
    displayColumns: ['File_Name', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Opportunities: {
    tableName: 'Opportunities',
    entityLabel: 'Opportunity',
    displayColumns: ['Venture_Oppty_Name', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Funds: {
    tableName: 'Funds',
    entityLabel: 'Fund',
    displayColumns: ['Fund_Name', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Rounds: {
    tableName: 'Rounds',
    entityLabel: 'Round',
    displayColumns: ['Round_Name', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Projects: {
    tableName: 'Projects',
    entityLabel: 'Project',
    displayColumns: ['Project_Name', 'id'],
    readonlyColumns: new Set([
      'id',
      'created_at',
      'updated_at',
    ]),
  },
  Tasks: {
    tableName: 'Tasks',
    entityLabel: 'Task',
    displayColumns: ['Task_Name', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Notes: {
    tableName: 'Notes',
    entityLabel: 'Note',
    displayColumns: ['Note_Name', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
  Intake: {
    tableName: 'Intake',
    entityLabel: 'Intake',
    displayColumns: ['Intake_Name', 'id'],
    readonlyColumns: new Set(['id', 'created_at', 'updated_at']),
  },
})

const DATABOOK_TABLE_ALIASES = Object.freeze({
  bb_file: 'Building_Blocks',
  'bb-file': 'Building_Blocks',
  bb: 'Building_Blocks',
  building_blocks: 'Building_Blocks',
  'building blocks': 'Building_Blocks',
  'building block': 'Building_Blocks',
  companies: 'Companies',
  company: 'Companies',
  contacts: 'Contacts',
  contact: 'Contacts',
  users: 'Users',
  user: 'Users',
  markets: 'Markets',
  market: 'Markets',
  artifacts: 'Artifacts',
  artifact: 'Artifacts',
  files: 'Files',
  file: 'Files',
  'file-system': 'Files',
  file_system: 'Files',
  'system files': 'Files',
  roles: 'Roles',
  role: 'Roles',
  opportunities: 'Opportunities',
  opportunity: 'Opportunities',
  funds: 'Funds',
  fund: 'Funds',
  rounds: 'Rounds',
  round: 'Rounds',
  projects: 'Projects',
  project: 'Projects',
  tasks: 'Tasks',
  task: 'Tasks',
  notes: 'Notes',
  note: 'Notes',
  securities: 'Securities',
  security: 'Securities',
  intake: 'Intake',
  ingestion: 'Intake',
  artifact_processed: 'Intake',
  'artifact-processed': 'Intake',
  artifacts_processed: 'Intake',
  'artifacts-processed': 'Intake',
})

function getRecordTableConfig(tableName) {
  const raw = normalizeNullableString(tableName)
  if (!raw) throw new Error('tableName is required')
  const canonical = DATABOOK_TABLE_ALIASES[String(raw).toLowerCase()] || raw
  const config = DATABOOK_TABLE_CONFIGS[canonical]
  if (!config) throw new Error(`Unsupported record table: ${raw}`)
  return config
}

function getRecordPrimaryKeyColumn(database, tableName) {
  const tableMeta = getTableMeta(database, tableName)
  const idColumn = tableMeta?.pkColumn
  if (!idColumn) throw new Error(`Record table ${tableName} must have a primary key`)
  return idColumn
}

function resolveRecordDisplayLabel(record, config, fallback = '') {
  for (const columnName of config.displayColumns || []) {
    const value = normalizeNullableString(record?.[columnName])
    if (value) return value
  }
  return normalizeNullableString(fallback) || ''
}

function listLdbRelationshipItems(database, contract, sourceRecordId) {
  const targetConfig = getRecordTableConfig(contract.targetEntity)
  const targetTableName = targetConfig.tableName
  const targetIdColumn = getRecordPrimaryKeyColumn(database, targetTableName)
  const rows = isDirectLdbRelationshipContract(contract)
    ? normalizeNullableString(contract?.contractType) === 'direct_foreign_key'
      ? database
          .prepare(
            `
            SELECT target.${quoteIdentifier(targetIdColumn)} AS id, target.*
            FROM ${quoteIdentifier(contract.ownerTable)} owner
            JOIN ${quoteIdentifier(targetTableName)} target
              ON target.${quoteIdentifier(targetIdColumn)} = owner.${quoteIdentifier(contract.ownerField)}
            WHERE owner.${quoteIdentifier(contract.ownerIdColumn)} = ?
            ORDER BY target.${quoteIdentifier(targetIdColumn)}
          `,
          )
          .all(sourceRecordId)
      : database
          .prepare(
            `
            SELECT target.${quoteIdentifier(targetIdColumn)} AS id, target.*
            FROM ${quoteIdentifier(contract.ownerTable)} owner
            JOIN ${quoteIdentifier(targetTableName)} target
              ON target.${quoteIdentifier(targetIdColumn)} = owner.${quoteIdentifier(contract.ownerIdColumn)}
            WHERE owner.${quoteIdentifier(contract.ownerField)} = ?
            ORDER BY target.${quoteIdentifier(targetIdColumn)}
          `,
          )
          .all(sourceRecordId)
    : isGenericLdbRelationshipContract(contract)
      ? database
        .prepare(
          `
          SELECT rel.target_record_id AS id, target.*
          FROM ${quoteIdentifier(getGenericLdbRelationshipTableName())} rel
          JOIN ${quoteIdentifier(targetTableName)} target
            ON target.${quoteIdentifier(targetIdColumn)} = rel.target_record_id
          WHERE rel.source_entity = ?
            AND rel.source_record_id = ?
            AND rel.source_token = ?
            AND rel.target_entity = ?
          ORDER BY target.${quoteIdentifier(targetIdColumn)}
        `,
        )
        .all(contract.sourceEntity, sourceRecordId, contract.sourceToken, contract.targetEntity)
      : database
        .prepare(
          `
          SELECT rel.${quoteIdentifier(contract.targetJoinColumn)} AS id, target.*
          FROM ${quoteIdentifier(contract.joinTable)} rel
          JOIN ${quoteIdentifier(targetTableName)} target
            ON target.${quoteIdentifier(targetIdColumn)} = rel.${quoteIdentifier(contract.targetJoinColumn)}
          WHERE rel.${quoteIdentifier(contract.sourceJoinColumn)} = ?
          ORDER BY target.${quoteIdentifier(targetIdColumn)}
        `,
        )
        .all(sourceRecordId)

  return rows.map((row) => ({
    id: normalizeNullableString(row?.id),
    label:
      resolveRecordDisplayLabel(row, targetConfig, normalizeNullableString(row?.id)) ||
      normalizeNullableString(row?.id) ||
      '',
  }))
}

function buildLdbRelationshipFields(database, entityName, recordId, idColumn = 'id') {
  return getLdbRelationshipContractsForEntity(entityName).map((contract) => {
    const relatedItems = listLdbRelationshipItems(database, contract, recordId).filter((item) => item.id)
    return {
      key: `${entityName}|${recordId}|${contract.sourceToken}`,
      section: 'LDB',
      label: formatRecordFieldLabel(contract.sourceToken),
      value: relatedItems.map((item) => item.label).join(', '),
      editable: true,
      table_name: entityName,
      record_id: recordId,
      field_name: contract.sourceToken,
      id_column: idColumn,
      relationship_ids: relatedItems.map((item) => item.id),
      related_items: relatedItems,
      relationship_join_table: contract.joinTable,
      relationship_target_entity: contract.targetEntity,
    }
  })
}

function normalizeRelationshipIds(rawValue) {
  if (Array.isArray(rawValue)) {
    return Array.from(new Set(rawValue.map((value) => normalizeNullableString(value)).filter(Boolean)))
  }

  const normalizedText = normalizeNullableString(rawValue)
  if (!normalizedText) return []

  try {
    const parsed = JSON.parse(normalizedText)
    if (Array.isArray(parsed)) {
      return Array.from(new Set(parsed.map((value) => normalizeNullableString(value)).filter(Boolean)))
    }
  } catch {
    // ignore
  }

  return Array.from(
    new Set(
      normalizedText
        .split(',')
        .map((value) => normalizeNullableString(value))
        .filter(Boolean),
    ),
  )
}

function formatRecordFieldLabel(fieldName) {
  return formatSharedDisplayLabel(fieldName)
}

function resolveRecordEntityName(record, config, recordId) {
  for (const columnName of config.displayColumns || []) {
    const value = normalizeNullableString(record?.[columnName])
    if (value) return value
  }
  return recordId
}

function isRecordFieldEditable(config, tableMeta, columnName) {
  if (!columnName) return false
  if (columnName === tableMeta.pkColumn) return false
  if (config.readonlyColumns?.has?.(columnName)) return false
  return true
}

function getCompanyAggregate(database, companyId) {
  const row =
    database
      .prepare(
        `
        SELECT
          c.id,
          c.Company_Name,
          c.Short_Name,
          c.Website,
          c.One_Liner,
          c.Description,
          c.Notable_News,
          c.Updates,
          c.created_by,
          c.created_at,
          c.updated_at,
          cii.Company_Type,
          cii.Legal_Entity,
          cii.Date_of_Incorporation,
          cii.incorporation_country,
          cii.Incorporation_Type,
          coo.Company_Stage,
          coo.Status,
          coo.headquarters_city,
          coo.PAX_Count,
          coo.PAX_Known,
          coo.business_structure_artifact_id,
          coo.corporate_structure_artifact_id,
          coo.organizational_structure_artifact_id,
          cbo.Mission_Vision,
          cbo.Products_Services,
          cbo.Key_Features,
          cbo.Development_Stage,
          cbo.ICP,
          cbo.Business_Model,
          cbo.Pricing,
          cbo.Placement_Distribution,
          cmo.Industry,
          cmo.Niche,
          cmo.Demand_Analysis,
          cmo.Supply_Analysis,
          cro.Traction_Overview,
          cro.Unit_Sales_By_Type_Artifact_Id,
          cro.Unit_Sales_By_Region_Artifact_Id,
          cro.Unit_Sales_By_Customer_Mix_Artifact_Id,
          cro.Revenue_Breakdown_By_Type_Artifact_Id,
          cro.Revenue_Breakdown_By_Region_Artifact_Id,
          cro.Revenue_Breakdown_By_Customer_Mix_Artifact_Id,
          cro.Revenue_Breakdown_Top_10_Artifact_Id,
          cro.Cohorts_Analysis_By_Date_Artifact_Id,
          cro.Cohorts_Analysis_By_Product_Service_Artifact_Id,
          cro.Direct_Costs_By_Product_Service_Artifact_Id,
          cro.Sales_Marketing_Costs_By_Product_Service_Artifact_Id,
          cro.Customer_Acquisition_Cost,
          cro.Customer_Lifetime_Value,
          cro.General_Admin_Expenses,
          cro.Tech_Expenditure,
          cro.Income_Statement_Artifact_Id,
          cro.Balance_Sheet_Artifact_Id,
          cro.Cash_Flow_Artifact_Id,
          cro.Tax_Filings_Artifact_Id,
          cro.Bank_Statements_Artifact_Id,
          cbp.Overview,
          cbp.Forecast,
          cbp.Short_Term_Objectives,
          cbp.Long_Term_Objectives,
          cbp.Use_of_Resources,
          cbp.Runway_Analysis,
          cbp.Capital_Needs,
          cbp.Funding_Strategy,
          cfr.Shareholder_Structure_Artifact_Id,
          cfr.Rounds_Funds_Count,
          cfr.Amount_Raised
        FROM Companies c
        LEFT JOIN Company_Incorporation_Info cii ON cii.company_id = c.id
        LEFT JOIN Company_Operations_Overview coo ON coo.company_id = c.id
        LEFT JOIN Company_Business_Overview cbo ON cbo.company_id = c.id
        LEFT JOIN Company_Market_Overview cmo ON cmo.company_id = c.id
        LEFT JOIN Company_Results_Overview cro ON cro.company_id = c.id
        LEFT JOIN Company_Business_Plan cbp ON cbp.company_id = c.id
        LEFT JOIN Company_Fund_Raising cfr ON cfr.company_id = c.id
        WHERE c.id = ?
        LIMIT 1
      `,
      )
      .get(companyId) || null

  if (!row) return null

  row.Legal_Founders = listCompanyContacts(database, 'Company_Incorporation_Legal_Founders', row.id)
  row.Leadership_Team = listCompanyContacts(database, 'Company_Operations_Leadership_Team', row.id)
  row.Advisors = listCompanyContacts(database, 'Company_Operations_Advisors', row.id)
  row.Shareholders = listCompanyContacts(database, 'Company_Fund_Raising_Shareholders', row.id)
  return row
}

function buildCompanyRecordView(database, recordId) {
  const rid = normalizeNullableString(recordId)
  if (!rid) throw new Error('recordId is required')

  const row = getCompanyAggregate(database, rid)
  if (!row) throw new Error(`Company not found: ${rid}`)

  const mainFields = [
    'id',
    'Company_Name',
    'Short_Name',
    'Website',
    'One_Liner',
    'Description',
    'Notable_News',
    'Updates',
    'created_by',
    'created_at',
    'updated_at',
  ]
  const incorporationFields = [
    'Company_Type',
    'Legal_Entity',
    'Date_of_Incorporation',
    'incorporation_country',
    'Incorporation_Type',
  ]
  const operationsFields = [
    'Company_Stage',
    'Status',
    'headquarters_city',
    'PAX_Count',
    'PAX_Known',
    'business_structure_artifact_id',
    'corporate_structure_artifact_id',
    'organizational_structure_artifact_id',
  ]
  const businessOverviewFields = [
    'Mission_Vision',
    'Products_Services',
    'Key_Features',
    'Development_Stage',
    'ICP',
    'Business_Model',
    'Pricing',
    'Placement_Distribution',
  ]
  const marketOverviewFields = [
    'Industry',
    'Niche',
    'Demand_Analysis',
    'Supply_Analysis',
  ]
  const resultsOverviewFields = [
    'Traction_Overview',
    'Unit_Sales_By_Type_Artifact_Id',
    'Unit_Sales_By_Region_Artifact_Id',
    'Unit_Sales_By_Customer_Mix_Artifact_Id',
    'Revenue_Breakdown_By_Type_Artifact_Id',
    'Revenue_Breakdown_By_Region_Artifact_Id',
    'Revenue_Breakdown_By_Customer_Mix_Artifact_Id',
    'Revenue_Breakdown_Top_10_Artifact_Id',
    'Cohorts_Analysis_By_Date_Artifact_Id',
    'Cohorts_Analysis_By_Product_Service_Artifact_Id',
    'Direct_Costs_By_Product_Service_Artifact_Id',
    'Sales_Marketing_Costs_By_Product_Service_Artifact_Id',
    'Customer_Acquisition_Cost',
    'Customer_Lifetime_Value',
    'General_Admin_Expenses',
    'Tech_Expenditure',
    'Income_Statement_Artifact_Id',
    'Balance_Sheet_Artifact_Id',
    'Cash_Flow_Artifact_Id',
    'Tax_Filings_Artifact_Id',
    'Bank_Statements_Artifact_Id',
  ]
  const businessPlanFields = [
    'Overview',
    'Forecast',
    'Short_Term_Objectives',
    'Long_Term_Objectives',
    'Use_of_Resources',
    'Runway_Analysis',
    'Capital_Needs',
    'Funding_Strategy',
  ]
  const fundRaisingFields = [
    'Shareholder_Structure_Artifact_Id',
    'Rounds_Funds_Count',
    'Amount_Raised',
  ]

  const fields = [
    ...mainFields.map((columnName) => ({
      key: `Companies|${rid}|${columnName}`,
      section: 'Company',
      label: formatRecordFieldLabel(columnName),
      value: row?.[columnName] == null ? '' : String(row[columnName]),
      editable: !new Set(['id', 'created_at', 'updated_at']).has(columnName),
      table_name: 'Companies',
      record_id: rid,
      field_name: columnName,
      id_column: 'id',
    })),
    ...incorporationFields.map((columnName) => ({
      key: `Company_Incorporation_Info|${rid}|${columnName}`,
      section: 'Company Incorporation',
      label: formatRecordFieldLabel(columnName),
      value: row?.[columnName] == null ? '' : String(row[columnName]),
      editable: !new Set(['created_at', 'updated_at']).has(columnName),
      table_name: 'Company_Incorporation_Info',
      record_id: rid,
      field_name: columnName,
      id_column: 'company_id',
    })),
    ...operationsFields.map((columnName) => ({
      key: `Company_Operations_Overview|${rid}|${columnName}`,
      section: 'Company Operations',
      label: formatRecordFieldLabel(columnName),
      value: row?.[columnName] == null ? '' : String(row[columnName]),
      editable: !new Set(['created_at', 'updated_at']).has(columnName),
      table_name: 'Company_Operations_Overview',
      record_id: rid,
      field_name: columnName,
      id_column: 'company_id',
    })),
    ...businessOverviewFields.map((columnName) => ({
      key: `Company_Business_Overview|${rid}|${columnName}`,
      section: 'Business Overview',
      label: formatRecordFieldLabel(columnName),
      value: row?.[columnName] == null ? '' : String(row[columnName]),
      editable: !new Set(['created_at', 'updated_at']).has(columnName),
      table_name: 'Company_Business_Overview',
      record_id: rid,
      field_name: columnName,
      id_column: 'company_id',
    })),
    ...marketOverviewFields.map((columnName) => ({
      key: `Company_Market_Overview|${rid}|${columnName}`,
      section: 'Market Overview',
      label: formatRecordFieldLabel(columnName),
      value: row?.[columnName] == null ? '' : String(row[columnName]),
      editable: !new Set(['created_at', 'updated_at']).has(columnName),
      table_name: 'Company_Market_Overview',
      record_id: rid,
      field_name: columnName,
      id_column: 'company_id',
    })),
    ...resultsOverviewFields.map((columnName) => ({
      key: `Company_Results_Overview|${rid}|${columnName}`,
      section: 'Results Overview',
      label: formatRecordFieldLabel(columnName),
      value: row?.[columnName] == null ? '' : String(row[columnName]),
      editable: !new Set(['created_at', 'updated_at']).has(columnName),
      table_name: 'Company_Results_Overview',
      record_id: rid,
      field_name: columnName,
      id_column: 'company_id',
    })),
    ...businessPlanFields.map((columnName) => ({
      key: `Company_Business_Plan|${rid}|${columnName}`,
      section: 'Business Plan',
      label: formatRecordFieldLabel(columnName),
      value: row?.[columnName] == null ? '' : String(row[columnName]),
      editable: !new Set(['created_at', 'updated_at']).has(columnName),
      table_name: 'Company_Business_Plan',
      record_id: rid,
      field_name: columnName,
      id_column: 'company_id',
    })),
    ...fundRaisingFields.map((columnName) => ({
      key: `Company_Fund_Raising|${rid}|${columnName}`,
      section: 'Fund Raising',
      label: formatRecordFieldLabel(columnName),
      value: row?.[columnName] == null ? '' : String(row[columnName]),
      editable: !new Set(['created_at', 'updated_at']).has(columnName),
      table_name: 'Company_Fund_Raising',
      record_id: rid,
      field_name: columnName,
      id_column: 'company_id',
    })),
  ]
  const relationshipFields = buildLdbRelationshipFields(database, 'Companies', rid, 'id')

  return {
    table_name: 'Companies',
    record_id: rid,
    entity_label: 'Company',
    entity_name: normalizeNullableString(row.Company_Name) || rid,
    record: row,
    sections: [
      {
        id: 'company-fields',
        label: 'Company',
        kind: 'fields',
        items: fields,
      },
      {
        id: 'ldb-relationships',
        label: 'LDB',
        kind: 'relationships',
        items: relationshipFields,
      },
    ],
    fields: [...fields, ...relationshipFields],
  }
}

function createRecordField({
  tableName,
  recordId,
  fieldName,
  value,
  editable,
  idColumn,
  keyPrefix = null,
}) {
  const prefix = keyPrefix || tableName
  return {
    key: `${prefix}|${recordId}|${fieldName}`,
    section: '',
    label: formatRecordFieldLabel(fieldName),
    value: value == null ? '' : String(value),
    editable: Boolean(editable),
    table_name: tableName,
    record_id: recordId,
    field_name: fieldName,
    id_column: idColumn,
  }
}

function buildUserRecordView(database, recordId) {
  const rid = normalizeNullableString(recordId)
  if (!rid) throw new Error('recordId is required')
  const actor = getAuditActor(database)
  const ownerUserId = getOwnerUserId(database)
  const ownerContactId = getOwnerContactId(database)
  const actorIsOwner = isOwnerActor(database, actor)
  const isOwnerUserRecord = Boolean(ownerUserId && rid === ownerUserId)

  const row =
    database
      .prepare(
        `
        SELECT
          u.id,
          u.User_Name,
          u.User_PEmail,
          ur.role_id,
          r.Role_Name,
          u.created_at,
          u.updated_at
        FROM Users u
        LEFT JOIN Users_Roles ur ON ur.user_id = u.id
        LEFT JOIN Roles r ON r.id = ur.role_id
        WHERE u.id = ?
        LIMIT 1
      `,
      )
      .get(rid) || null

  if (!row) throw new Error(`User not found: ${rid}`)

  const metadataFieldNames = ['id', 'User_Name', 'User_PEmail', 'created_at', 'updated_at']
  const metadataFields = metadataFieldNames.map((fieldName) =>
    createRecordField({
      tableName: 'Users',
      recordId: rid,
      fieldName,
      value: row?.[fieldName],
      editable:
        !new Set(['id', 'created_at', 'updated_at']).has(fieldName) &&
        (!isOwnerUserRecord || actorIsOwner),
      idColumn: 'id',
    }),
  )

  const roleField = {
    key: `Users|${rid}|User_Role`,
    section: 'System',
    label: 'User Role',
    value: normalizeNullableString(row?.Role_Name) || '',
    editable: !isOwnerUserRecord,
    table_name: 'Users',
    record_id: rid,
    field_name: 'User_Role',
    id_column: 'id',
    relationship_ids: normalizeNullableString(row?.role_id) ? [normalizeNullableString(row.role_id)] : [],
    related_items: normalizeNullableString(row?.role_id)
      ? [
          {
            id: normalizeNullableString(row.role_id),
            label: normalizeNullableString(row?.Role_Name) || normalizeNullableString(row.role_id),
          },
        ]
      : [],
    relationship_target_entity: 'Roles',
  }

  const fields = [...metadataFields, roleField].map((field) => ({
    ...field,
    section: 'Metadata',
  }))
  const relationshipFields = buildLdbRelationshipFields(database, 'Users', rid, 'id').map((field) => {
    if (
      field.field_name === 'User_Contact' &&
      ownerContactId &&
      Array.isArray(field.relationship_ids) &&
      field.relationship_ids.includes(ownerContactId)
    ) {
      return {
        ...field,
        editable: false,
      }
    }
    return field
  })

  return {
    table_name: 'Users',
    record_id: rid,
    entity_label: 'User',
    entity_name: normalizeNullableString(row.User_Name) || normalizeNullableString(row.User_PEmail) || rid,
    record: row,
    sections: [
      {
        id: 'metadata',
        label: 'Metadata',
        kind: 'fields',
        items: metadataFields,
      },
      {
        id: 'ldb-relationships',
        label: 'LDB',
        kind: 'relationships',
        items: relationshipFields,
      },
    ],
    fields: [...fields, ...relationshipFields],
  }
}

function buildContactRecordView(database, recordId) {
  const rid = normalizeNullableString(recordId)
  if (!rid) throw new Error('recordId is required')

  const row =
    database
      .prepare(
        `
        SELECT
          c.id,
          c.Name,
          c.Personal_Email,
          c.Professional_Email,
          c.Phone,
          c.Country_based,
          c.LinkedIn,
          c.linked_user_id,
          u.User_Name AS Linked_User_Name,
          ur.role_id AS linked_role_id,
          r.Role_Name AS Linked_User_Role
        FROM Contacts c
        LEFT JOIN Users u ON u.id = c.linked_user_id
        LEFT JOIN Users_Roles ur ON ur.user_id = c.linked_user_id
        LEFT JOIN Roles r ON r.id = ur.role_id
        WHERE c.id = ?
        LIMIT 1
      `,
      )
      .get(rid) || null

  if (!row) throw new Error(`Contact not found: ${rid}`)

  const actor = getAuditActor(database)
  const ownerContactId = getOwnerContactId(database)
  const isOwnerContactRecord = Boolean(ownerContactId && rid === ownerContactId)
  const canEditOwnerContact = !isOwnerContactRecord || isOwnerActor(database, actor)

  const metadataFieldNames = [
    'id',
    'Name',
    'Personal_Email',
    'Professional_Email',
    'Phone',
    'Country_based',
    'LinkedIn',
  ]
  const metadataFields = metadataFieldNames.map((fieldName) =>
    createRecordField({
      tableName: 'Contacts',
      recordId: rid,
      fieldName,
      value: row?.[fieldName],
      editable:
        !new Set(['id']).has(fieldName) &&
        canEditOwnerContact,
      idColumn: 'id',
    }),
  )

  const linkedRoleField = {
    key: `Contacts|${rid}|Contact_User_Role`,
    section: 'System',
    label: 'Contact User Role',
    value: normalizeNullableString(row?.Linked_User_Role) || '',
    editable: false,
    table_name: 'Users',
    record_id: normalizeNullableString(row?.linked_user_id),
    field_name: 'User_Role',
    id_column: 'id',
    relationship_ids: normalizeNullableString(row?.linked_role_id)
      ? [normalizeNullableString(row.linked_role_id)]
      : [],
    related_items: normalizeNullableString(row?.linked_role_id)
      ? [
          {
            id: normalizeNullableString(row.linked_role_id),
            label:
              normalizeNullableString(row?.Linked_User_Role) ||
              normalizeNullableString(row.linked_role_id),
          },
        ]
      : [],
    relationship_target_entity: 'Roles',
  }

  const relationshipFields = buildLdbRelationshipFields(database, 'Contacts', rid, 'id')

  return {
    table_name: 'Contacts',
    record_id: rid,
    entity_label: 'Contact',
    entity_name: normalizeNullableString(row.Name) || normalizeNullableString(row.Personal_Email) || rid,
    record: row,
    sections: [
      {
        id: 'metadata',
        label: 'Metadata',
        kind: 'fields',
        items: metadataFields,
      },
      {
        id: 'ldb-relationships',
        label: 'LDB',
        kind: 'relationships',
        items: relationshipFields,
      },
    ],
    fields: [...metadataFields, { ...linkedRoleField, section: 'Metadata' }, ...relationshipFields],
  }
}

function getRecordView(tableName, recordId) {
  const database = initDb()
  const config = getRecordTableConfig(tableName)
  const rid = normalizeNullableString(recordId)
  if (!rid) throw new Error('recordId is required')

  if (config.tableName === 'Companies') {
    return buildCompanyRecordView(database, rid)
  }
  if (config.tableName === 'Users') {
    return buildUserRecordView(database, rid)
  }
  if (config.tableName === 'Contacts') {
    return buildContactRecordView(database, rid)
  }

  const tableMeta = getTableMeta(database, config.tableName)
  const idColumn = tableMeta.pkColumn
  if (!idColumn) throw new Error(`Record table ${config.tableName} must have a primary key`)

  const row = database
    .prepare(
      `SELECT * FROM ${quoteIdentifier(config.tableName)} WHERE ${quoteIdentifier(idColumn)} = ? LIMIT 1`,
    )
    .get(rid)
  if (!row) throw new Error(`${config.entityLabel} not found: ${rid}`)

  const actor = getAuditActor(database)
  const ownerContactId = getOwnerContactId(database)
  const isProtectedOwnerContact = config.tableName === 'Contacts' && ownerContactId && rid === ownerContactId
  const canEditProtectedOwnerContact = !isProtectedOwnerContact || isOwnerActor(database, actor)

  const fields = tableMeta.columnNames.map((columnName) => ({
    key: `${config.tableName}|${rid}|${columnName}`,
    section: config.entityLabel,
    label: formatRecordFieldLabel(columnName),
    value: row?.[columnName] == null ? '' : String(row[columnName]),
    editable:
      isRecordFieldEditable(config, tableMeta, columnName) &&
      canEditProtectedOwnerContact,
    table_name: config.tableName,
    record_id: rid,
    field_name: columnName,
    id_column: idColumn,
  }))
  const relationshipFields = buildLdbRelationshipFields(database, config.tableName, rid, idColumn)

  return {
    table_name: config.tableName,
    record_id: rid,
    entity_label: config.entityLabel,
    entity_name: resolveRecordEntityName(row, config, rid),
    record: row,
    sections: [
      {
        id: 'metadata',
        label: config.entityLabel,
        kind: 'fields',
        items: fields,
      },
      {
        id: 'ldb-relationships',
        label: 'LDB',
        kind: 'relationships',
        items: relationshipFields,
      },
    ],
    fields: [...fields, ...relationshipFields],
  }
}

function createContact(payload = {}) {
  const database = initDb()
  ensureContactsProvenanceColumns(database)
  const actor = getAuditActor(database)
  const id = normalizeNullableString(payload.id) || `contact:${crypto.randomUUID()}`
  const name = normalizeNullableString(payload.Name)
  if (!name) throw new Error('Contact name is required')
  const personalEmail =
    normalizeNullableString(payload.Personal_Email) || normalizeNullableString(payload.Email)
  const professionalEmail = normalizeNullableString(payload.Professional_Email)
  const statusValue = resolveRecordStatus(payload, 'Draft')

  database
    .prepare(
      `
      INSERT INTO Contacts (
        id, Name, Personal_Email, Professional_Email, Phone, Country_based, LinkedIn, linked_user_id, Status, created_by, created_at, updated_at
      ) VALUES (
        @id, @Name, @Personal_Email, @Professional_Email, @Phone, @Country_based, @LinkedIn, @linked_user_id, @Status, @created_by, datetime('now'), datetime('now')
      )
    `,
    )
    .run({
      id,
      Name: name,
      Personal_Email: personalEmail,
      Professional_Email: professionalEmail,
      Phone: normalizeNullableString(payload.Phone),
      LinkedIn: normalizeNullableString(payload.LinkedIn),
      Country_based: normalizeNullableString(payload.Country_based),
      linked_user_id: normalizeNullableString(payload.linked_user_id),
      Status: statusValue,
      created_by: normalizeNullableString(payload.created_by) || actor.user_id,
    })

  return { id }
}

function listArtifacts() {
  return dbAll(
    `
    SELECT
      a.artifact_id,
      a.original_artifact_id,
      a.title,
      a.artifact_type,
      a.artifact_format,
      a.type,
      a.fs_path,
      a.round_id,
      a.fund_id,
      COALESCE(a.round_id, a.fund_id) AS opportunity_id,
      a.created_by,
      a.created_at
    FROM Artifact_Details a
    WHERE a.artifact_type = 'raw'
    ORDER BY a.created_at DESC
  `,
  )
}

function normalizeArtifactFormatFromPath(filePath = '', fallbackName = '') {
  const target = String(filePath || fallbackName || '').trim().toLowerCase()
  if (target.endsWith('.pdf')) return 'pdf'
  if (target.endsWith('.doc')) return 'doc'
  if (target.endsWith('.docx')) return 'docx'
  if (target.endsWith('.ppt')) return 'ppt'
  if (target.endsWith('.pptx')) return 'pptx'
  if (target.endsWith('.xls')) return 'xls'
  if (target.endsWith('.xlsx')) return 'xlsx'
  if (target.endsWith('.csv')) return 'csv'
  if (target.endsWith('.txt')) return 'txt'
  if (target.endsWith('.md')) return 'md'
  if (target.endsWith('.json')) return 'json'
  if (target.endsWith('.html') || target.endsWith('.htm')) return 'html'
  if (target.endsWith('.png')) return 'png'
  if (target.endsWith('.jpg')) return 'jpg'
  if (target.endsWith('.jpeg')) return 'jpeg'
  if (target.endsWith('.webp')) return 'webp'
  if (target.endsWith('.gif')) return 'gif'
  if (target.endsWith('.tif')) return 'tif'
  if (target.endsWith('.tiff')) return 'tiff'
  return 'other'
}

function createArtifact(payload = {}) {
  const database = initDb()
  const actor = getAuditActor(database)
  const fsPath =
    normalizeNullableString(payload?.fs_path) ||
    normalizeNullableString(payload?.path)
  if (!fsPath) throw new Error('Artifact file path is required')

  const title =
    normalizeNullableString(payload?.title) ||
    normalizeNullableString(payload?.name) ||
    path.basename(fsPath)
  const artifactId = normalizeNullableString(payload?.artifact_id) || `artifact:${crypto.randomUUID()}`
  const artifactFormat =
    normalizeNullableString(payload?.artifact_format) || normalizeArtifactFormatFromPath(fsPath, title)
  const description =
    normalizeNullableString(payload?.description) ||
    normalizeNullableString(payload?.summary)
  const fsHash = normalizeNullableString(payload?.fs_hash)
  const fsSizeBytes = normalizeNullableNumber(payload?.fs_size_bytes) ?? normalizeNullableNumber(payload?.size)
  const statusValue = resolveRecordStatus(payload, 'Draft')

  database
    .prepare(
      `
      INSERT INTO Artifacts (
        artifact_id, round_id, fund_id, created_by, artifact_format, type, title, description, Status, created_at, updated_at
      ) VALUES (
        @artifact_id, NULL, NULL, @created_by, @artifact_format, NULL, @title, @description, @Status, datetime('now'), datetime('now')
      )
    `,
    )
    .run({
      artifact_id: artifactId,
      created_by: actor.user_id,
      artifact_format: artifactFormat,
      title,
      description,
      Status: statusValue,
    })

  database
    .prepare(
      `
      INSERT INTO Artifact_Raw (
        artifact_id, fs_path, fs_hash, fs_size_bytes
      ) VALUES (
        @artifact_id, @fs_path, @fs_hash, @fs_size_bytes
      )
    `,
    )
    .run({
      artifact_id: artifactId,
      fs_path: fsPath,
      fs_hash: fsHash,
      fs_size_bytes: fsSizeBytes,
    })

  return { id: artifactId, artifact_id: artifactId, title }
}

function listIntake() {
  return dbAll(
    `
    SELECT
      id,
      Intake_Name,
      Intake_Summary,
      Original_Artifact_Id,
      Created_Files_JSON,
      Working,
      created_by,
      created_at,
      updated_at
    FROM Intake
    ORDER BY created_at DESC, id DESC
  `,
  )
}

function createIntake(payload = {}) {
  const database = initDb()
  const actor = getAuditActor(database)
  const name =
    normalizeNullableString(payload?.Intake_Name) ||
    normalizeNullableString(payload?.Processed_Artifact_Name) ||
    normalizeNullableString(payload?.Name) ||
    normalizeNullableString(payload?.title)

  if (!name) throw new Error('Intake name is required')

  const id = normalizeNullableString(payload?.id) || `intake:${crypto.randomUUID()}`
  const summary =
    normalizeNullableString(payload?.Intake_Summary) ||
    normalizeNullableString(payload?.Processed_Artifact_Summary) ||
    normalizeNullableString(payload?.Summary) ||
    normalizeNullableString(payload?.description)
  const originalArtifactId =
    normalizeNullableString(payload?.Original_Artifact_Id) ||
    normalizeNullableString(payload?.original_artifact_id)
  const createdFilesValue = Array.isArray(payload?.Created_Files)
    ? JSON.stringify(payload.Created_Files)
    : normalizeNullableString(payload?.Created_Files_JSON) || null
  const workingValue =
    payload?.Working === true || String(payload?.Working || '').trim() === '1' ? 1 : 0
  const statusValue = resolveRecordStatus(payload, 'Draft')

  database
    .prepare(
      `
      INSERT INTO Intake (
        id,
        Intake_Name,
        Intake_Summary,
        Original_Artifact_Id,
        Created_Files_JSON,
        Working,
        Status,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @Intake_Name,
        @Intake_Summary,
        @Original_Artifact_Id,
        @Created_Files_JSON,
        @Working,
        @Status,
        @created_by,
        datetime('now'),
        datetime('now')
      )
    `,
    )
    .run({
      id,
      Intake_Name: name,
      Intake_Summary: summary,
      Original_Artifact_Id: originalArtifactId,
      Created_Files_JSON: createdFilesValue,
      Working: workingValue,
      Status: statusValue,
      created_by: actor.user_id,
    })

  return { id }
}

function isPathWithinRoot(rootPath, targetPath) {
  const root = path.resolve(String(rootPath || ''))
  const target = path.resolve(String(targetPath || ''))
  const rel = path.relative(root, target)
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
}

async function resolveArtifactFileForAction(artifactId) {
  const database = initDb()
  const workspace = await ensureWorkspace()
  const id = normalizeNullableString(artifactId)
  if (!id) throw new Error('artifactId is required')

  const artifact = database
    .prepare(
      `
      SELECT artifact_id, fs_path, title
      FROM Artifact_Details
      WHERE artifact_id = ?
      LIMIT 1
    `,
    )
    .get(id)

  if (!artifact) throw new Error('Artifact not found.')

  const relativePath = normalizeLegacyArtifactWorkspacePath(normalizeNullableString(artifact.fs_path))
  if (!relativePath) throw new Error('Artifact file path is missing.')

  const absolutePath = path.resolve(workspace.rootPath, relativePath)
  if (!isPathWithinRoot(workspace.rootPath, absolutePath)) {
    throw new Error('Artifact file is outside the workspace root.')
  }

  const exists = await fse.pathExists(absolutePath)
  if (!exists) throw new Error('Artifact file could not be found on disk.')

  return {
    artifactId: artifact.artifact_id,
    absolutePath,
    fileName: path.basename(absolutePath),
    title: normalizeNullableString(artifact.title),
  }
}

function normalizeLegacyArtifactWorkspacePath(relativePath) {
  const normalized = String(relativePath || '').trim()
  if (!normalized) return ''

  return normalized
    .replace(/User[\\/]+WORKSPACE FILES[\\/]+Artifacts(?=[\\/])/i, 'User/WORKSPACE FILES/2. Artifacts')
    .replace(/User[\\/]+WORKSPACE FILES[\\/]+Company(?=[\\/])/i, 'User/WORKSPACE FILES/4. Companies')
}

async function deleteArtifact(artifactId) {
  const database = initDb()
  const id = String(artifactId || '').trim()
  if (!id) throw new Error('artifactId is required')

  const artifact = database
    .prepare('SELECT artifact_id, fs_path FROM Artifact_Details WHERE artifact_id = ? LIMIT 1')
    .get(id)
  if (!artifact) return { changes: 0, file_deleted: false, cleanup_warning: null }

  const fsPath = normalizeLegacyArtifactWorkspacePath(normalizeNullableString(artifact.fs_path))
  const result = database.prepare('DELETE FROM Artifacts WHERE artifact_id = ?').run(id)

  let fileDeleted = false
  let cleanupWarning = null

  if (result.changes > 0 && fsPath) {
    const refs = Number(
      database.prepare('SELECT COUNT(*) AS c FROM Artifact_Details WHERE fs_path = ?').get(fsPath)
        ?.c || 0,
    )
    if (refs === 0) {
      try {
        const workspace = await ensureWorkspace()
        const candidate = path.resolve(workspace.rootPath, fsPath)
        if (isPathWithinRoot(workspace.rootPath, candidate)) {
          await fse.remove(candidate)
          fileDeleted = true
        }
      } catch (e) {
        cleanupWarning = e?.message || String(e)
      }
    }
  }

  return { changes: result.changes, file_deleted: fileDeleted, cleanup_warning: cleanupWarning }
}

function deleteRow(tableName, idColumn, idValue) {
  const database = initDb()
  const t = String(tableName)
  const col = String(idColumn)
  const value = String(idValue || '')
  if (!value) throw new Error(`${col} is required`)
  const result = database.prepare(`DELETE FROM ${t} WHERE ${col} = ?`).run(value)
  return { changes: result.changes }
}

function deleteOpportunityRow(opportunityId) {
  const database = initDb()
  const oid = String(opportunityId || '').trim()
  if (!oid) throw new Error('opportunityId is required')

  const roundExists = Boolean(database.prepare('SELECT 1 FROM Rounds WHERE id = ? LIMIT 1').get(oid))
  if (roundExists) {
    const result = database.prepare('DELETE FROM Rounds WHERE id = ?').run(oid)
    return { changes: result.changes, table: 'Rounds' }
  }

  const fundExists = Boolean(database.prepare('SELECT 1 FROM Funds WHERE id = ? LIMIT 1').get(oid))
  if (fundExists) {
    const result = database.prepare('DELETE FROM Funds WHERE id = ?').run(oid)
    return { changes: result.changes, table: 'Funds' }
  }

  return { changes: 0, table: null }
}

function upsertCompanies(rows = []) {
  const database = initDb()
  const input = Array.isArray(rows) ? rows : []

  const tx = database.transaction(() => {
    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const r of input) {
      const companyName = normalizeNullableString(r?.Company_Name)
      if (!companyName) {
        skipped++
        continue
      }

      const existing = database
        .prepare('SELECT id FROM Companies WHERE Company_Name = ? LIMIT 1')
        .get(companyName)
      createCompany(r)
      if (existing?.id || normalizeNullableIntegerId(r?.id)) updated++
      else inserted++
    }

    return { inserted, updated, skipped }
  })

  return tx()
}

function upsertContacts(rows = []) {
  const database = initDb()
  const input = Array.isArray(rows) ? rows : []

  const tx = database.transaction(() => {
    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const r of input) {
      const id = normalizeNullableString(r?.id) || `contact:${crypto.randomUUID()}`
      const name = normalizeNullableString(r?.Name)
      const personalEmail =
        normalizeNullableString(r?.Personal_Email) || normalizeNullableString(r?.Email)
      const professionalEmail = normalizeNullableString(r?.Professional_Email)

      if (!name && !personalEmail && !professionalEmail && !normalizeNullableString(r?.Phone)) {
        skipped++
        continue
      }

      const payload = {
        id,
        Name: name,
        Personal_Email: personalEmail,
        Professional_Email: professionalEmail,
        Phone: normalizeNullableString(r?.Phone),
        LinkedIn: normalizeNullableString(r?.LinkedIn),
        Country_based: normalizeNullableString(r?.Country_based),
      }

      const exists = database.prepare('SELECT 1 FROM Contacts WHERE id = ? LIMIT 1').get(id)

      database
        .prepare(
          `
          INSERT INTO Contacts (
            id, Name, Personal_Email, Professional_Email, Phone, LinkedIn, Country_based
          )
          VALUES (
            @id, @Name, @Personal_Email, @Professional_Email, @Phone, @LinkedIn, @Country_based
          )
          ON CONFLICT(id) DO UPDATE SET
            Name = excluded.Name,
            Personal_Email = excluded.Personal_Email,
            Professional_Email = excluded.Professional_Email,
            Phone = excluded.Phone,
            LinkedIn = excluded.LinkedIn,
            Country_based = excluded.Country_based
        `,
        )
        .run(payload)

      if (exists) updated++
      else inserted++
    }

    return { inserted, updated, skipped }
  })

  return tx()
}

function upsertArtifacts(rows = []) {
  const database = initDb()
  const input = Array.isArray(rows) ? rows : []

  const tx = database.transaction(() => {
    let inserted = 0
    let updated = 0
    let skipped = 0
    const errors = []

    for (const r of input) {
      const artifactId =
        normalizeNullableString(r?.artifact_id) || `artifact:${crypto.randomUUID()}`
      const opportunityId = normalizeNullableString(r?.opportunity_id)
      const roundId =
        normalizeNullableString(r?.round_id) ||
        (opportunityId && !opportunityId.startsWith('fund:') ? opportunityId : null)
      const fundId =
        normalizeNullableString(r?.fund_id) ||
        (opportunityId && opportunityId.startsWith('fund:') ? opportunityId : null)
      const artifactType = normalizeNullableString(r?.artifact_type)
      const fsPath = normalizeNullableString(r?.fs_path)
      const generatedBy = normalizeNullableString(r?.generated_by) || 'user'

      if ((!roundId && !fundId) || !artifactType || !fsPath) {
        skipped++
        continue
      }

      const exists = database
        .prepare('SELECT 1 FROM Artifacts WHERE artifact_id = ? LIMIT 1')
        .get(artifactId)

      const payload = {
        artifact_id: artifactId,
        round_id: roundId,
        fund_id: fundId,
        artifact_format: normalizeNullableString(r?.artifact_format),
        fs_path: fsPath,
        fs_hash: normalizeNullableString(r?.fs_hash),
        fs_size_bytes: normalizeNullableNumber(r?.fs_size_bytes),
        source_artifact_id: normalizeNullableString(r?.source_artifact_id),
        generated_by: generatedBy,
        llm_provider: normalizeNullableString(r?.llm_provider),
        llm_model: normalizeNullableString(r?.llm_model),
        assistant_system_prompt_id: normalizeNullableString(r?.assistant_system_prompt_id),
        original_artifact_id: normalizeNullableString(r?.original_artifact_id),
        title: normalizeNullableString(r?.title),
        description:
          normalizeNullableString(r?.description) || normalizeNullableString(r?.summary),
      }

      try {
        database
          .prepare(
            `
            INSERT INTO Artifacts (
              artifact_id, round_id, fund_id, artifact_format, title, description
            )
            VALUES (
              @artifact_id, @round_id, @fund_id, @artifact_format, @title, @description
            )
            ON CONFLICT(artifact_id) DO UPDATE SET
              round_id = excluded.round_id,
              fund_id = excluded.fund_id,
              artifact_format = excluded.artifact_format,
              title = excluded.title,
              description = excluded.description,
              updated_at = datetime('now')
          `,
          )
          .run(payload)

        database.prepare('DELETE FROM Artifact_Raw WHERE artifact_id = ?').run(artifactId)
        database.prepare('DELETE FROM Artifact_Llm_Ready WHERE artifact_id = ?').run(artifactId)
        database.prepare('DELETE FROM Artifact_Llm_Generated WHERE artifact_id = ?').run(artifactId)

        if (artifactType === 'raw') {
          database
            .prepare(
              `
              INSERT INTO Artifact_Raw (
                artifact_id, fs_path, fs_hash, fs_size_bytes
              ) VALUES (
                @artifact_id, @fs_path, @fs_hash, @fs_size_bytes
              )
            `,
            )
            .run(payload)
        } else if (artifactType === 'llm-ready') {
          database
            .prepare(
              `
              INSERT INTO Artifact_Llm_Ready (
                artifact_id, source_artifact_id, original_artifact_id, assistant_system_prompt_id,
                generated_by, llm_provider, llm_model, fs_path, fs_hash, fs_size_bytes
              ) VALUES (
                @artifact_id, @source_artifact_id, @original_artifact_id, @assistant_system_prompt_id,
                @generated_by, @llm_provider, @llm_model, @fs_path, @fs_hash, @fs_size_bytes
              )
            `,
            )
            .run({
              ...payload,
              generated_by: payload.generated_by === 'system' ? 'system' : 'llm',
            })
        } else if (artifactType === 'llm-generated') {
          database
            .prepare(
              `
              INSERT INTO Artifact_Llm_Generated (
                artifact_id, source_artifact_id, original_artifact_id, assistant_system_prompt_id,
                llm_provider, llm_model, fs_path, fs_hash, fs_size_bytes
              ) VALUES (
                @artifact_id, @source_artifact_id, @original_artifact_id, @assistant_system_prompt_id,
                @llm_provider, @llm_model, @fs_path, @fs_hash, @fs_size_bytes
              )
            `,
            )
            .run(payload)
        } else {
          throw new Error(`Unsupported artifact_type: ${artifactType}`)
        }

        if (exists) updated++
        else inserted++
      } catch (e) {
        errors.push({ artifact_id: artifactId, error: e?.message || String(e) })
      }
    }

    return { inserted, updated, skipped, errors }
  })

  return tx()
}

function linkArtifactsToOpportunity({ artifactIds = [], opportunityId } = {}) {
  const database = initDb()
  const oid = normalizeNullableString(opportunityId)
  if (!oid) throw new Error('opportunityId is required')
  const roundExists = Boolean(database.prepare('SELECT 1 FROM Rounds WHERE id = ? LIMIT 1').get(oid))
  const fundExists = Boolean(database.prepare('SELECT 1 FROM Funds WHERE id = ? LIMIT 1').get(oid))
  if (!roundExists && !fundExists) throw new Error('Opportunity not found')

  const ids = Array.isArray(artifactIds)
    ? artifactIds.map((id) => normalizeNullableString(id)).filter(Boolean)
    : []
  if (!ids.length) return { linked: 0 }

  const tx = database.transaction(() => {
    const stmt = database.prepare(
      `
      UPDATE Artifacts
      SET
        round_id = ?,
        fund_id = ?,
        updated_at = datetime('now')
      WHERE artifact_id = ?
    `,
    )
    let linked = 0
    for (const artifactId of ids) {
      const result = stmt.run(roundExists ? oid : null, fundExists ? oid : null, artifactId)
      linked += Number(result?.changes || 0)
    }
    return { linked }
  })

  return tx()
}

function normalizeNullableString(value) {
  const v = value === undefined || value === null ? '' : String(value)
  const t = v.trim()
  return t.length ? t : null
}

function resolveRecordStatus(payload, fallback = null) {
  const raw = normalizeNullableString(
    payload?.Status ??
      payload?.status ??
      payload?.Record_Status ??
      payload?.record_status ??
      payload?.recordStatus,
  )
  if (raw) return raw
  return fallback
}

function normalizeNullableNumber(value) {
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeOpportunityKind(value) {
  const v = normalizeNullableString(value)
  if (!v) return null
  const k = String(v).toLowerCase()
  return k === 'fund' ? 'fund' : k === 'round' ? 'round' : null
}

function companyIsAssetManager(database, companyId) {
  if (!companyId) return false
  const row = database
    .prepare('SELECT Company_Type FROM Company_Incorporation_Info WHERE company_id = ? LIMIT 1')
    .get(companyId)
  return (
    String(row?.Company_Type || '')
      .trim()
      .toLowerCase() === 'asset manager'
  )
}

function upsertFundSubtype(database, opportunityId, source = {}) {
  database
    .prepare(
      `
      INSERT INTO Fund_Opportunities (
        opportunity_id, Fund_Type, Fund_Size_Target, Initial_Ticket_Size, Target_Positions,
        Follow_on_Reserve, Investment_Stages, Company_Stages
      ) VALUES (
        @opportunity_id, @Fund_Type, @Fund_Size_Target, @Initial_Ticket_Size, @Target_Positions,
        @Follow_on_Reserve, @Investment_Stages, @Company_Stages
      )
      ON CONFLICT(opportunity_id) DO UPDATE SET
        Fund_Type = excluded.Fund_Type,
        Fund_Size_Target = excluded.Fund_Size_Target,
        Initial_Ticket_Size = excluded.Initial_Ticket_Size,
        Target_Positions = excluded.Target_Positions,
        Follow_on_Reserve = excluded.Follow_on_Reserve,
        Investment_Stages = excluded.Investment_Stages,
        Company_Stages = excluded.Company_Stages,
        updated_at = datetime('now')
    `,
    )
    .run({
      opportunity_id: opportunityId,
      Fund_Type: normalizeNullableString(source.Fund_Type),
      Fund_Size_Target: normalizeNullableNumber(source.Fund_Size_Target),
      Initial_Ticket_Size: normalizeNullableNumber(source.Initial_Ticket_Size),
      Target_Positions: normalizeNullableNumber(source.Target_Positions),
      Follow_on_Reserve: normalizeNullableNumber(source.Follow_on_Reserve),
      Investment_Stages: normalizeNullableString(source.Investment_Stages),
      Company_Stages: normalizeNullableString(source.Company_Stages),
    })
}

function makeOpportunityNameFromCompany(companyName, dateSource = null) {
  const base = String(companyName || '')
    .trim()
    .replace(/\s+/g, '_')
  if (!base) return null
  const d = dateSource instanceof Date ? dateSource : new Date()
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = String(d.getFullYear())
  return `${day}_${month}_${year}_${base}`
}

function deriveOpportunityName(
  database,
  { companyId = null, companyName = null, contactName = null, fundingSeries = null } = {},
) {
  const baseEntity = normalizeNullableString(companyName) || normalizeNullableString(contactName)
  const series = normalizeNullableString(fundingSeries)

  const byFallback = makeOpportunityNameFromCompany(baseEntity)
  if (byFallback && series) return `${byFallback}_${String(series).trim().replace(/\s+/g, '_')}`
  if (byFallback) return byFallback
  if (!companyId)
    return series ? `${makeOpportunityNameFromCompany('Opportunity')}_${series}` : null
  const row = database
    .prepare('SELECT Company_Name FROM Companies WHERE id = ? LIMIT 1')
    .get(companyId)
  const fromCompany = makeOpportunityNameFromCompany(row?.Company_Name)
  if (!fromCompany) return null
  return series ? `${fromCompany}_${String(series).trim().replace(/\s+/g, '_')}` : fromCompany
}

function quoteIdentifier(name) {
  return `"${String(name || '').replaceAll('"', '""')}"`
}

function getTableMeta(database, tableName) {
  const table = String(tableName || '').trim()
  if (!table) throw new Error('table_name is required')
  const exists = database
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=? LIMIT 1")
    .get(table)
  if (!exists) throw new Error(`Unknown table: ${table}`)
  const cols = database.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all()
  const columnNames = cols.map((c) => c?.name).filter(Boolean)
  const pkColumn = cols.find((c) => Number(c?.pk) === 1)?.name || null
  const types = Object.fromEntries(
    cols.map((c) => [c?.name, String(c?.type || '').toUpperCase()]).filter(([k]) => Boolean(k)),
  )
  return {
    table,
    columnNames,
    columnsSet: new Set(columnNames),
    pkColumn,
    types,
  }
}

function coerceValueForColumn(rawValue, declaredType = '') {
  if (rawValue === undefined || rawValue === null) return null
  const text = String(rawValue).trim()
  if (!text.length) return null
  const t = String(declaredType || '').toUpperCase()
  if (/(INT|REAL|FLOA|DOUB|NUM|DEC)/.test(t)) {
    const plainNumericPattern = /^[+-]?(?:\d+|\d*\.\d+)(?:\s*[kKmMbB])?$/
    const commaNumericPattern = /^[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?(?:\s*[kKmMbB])?$/
    if (!plainNumericPattern.test(text) && !commaNumericPattern.test(text)) {
      throw new Error(`Invalid number "${text}". Use formats like 1000000, 1,000,000, 1M, 2.5K.`)
    }
    const normalized = text.replaceAll(',', '').replace(/\s+/g, '')
    const parts = normalized.match(/^([+-]?(?:\d+|\d*\.\d+))([kKmMbB])?$/)
    if (!parts) {
      throw new Error(`Invalid number "${text}". Use formats like 1000000, 1,000,000, 1M, 2.5K.`)
    }
    const base = Number(parts[1])
    const suffix = String(parts[2] || '').toUpperCase()
    const multiplier = suffix === 'K' ? 1e3 : suffix === 'M' ? 1e6 : suffix === 'B' ? 1e9 : 1
    const n = base * multiplier
    if (!Number.isFinite(n)) throw new Error(`Expected numeric value, got "${text}"`)
    return n
  }
  return text
}

function sanitizeRecordUpdateError(error) {
  const message = normalizeNullableString(error?.message) || String(error || '')
  if (!message) return 'Could not save record changes. Please try again.'
  if (message.includes('Invalid number')) return message
  if (message.includes('Expected numeric value')) {
    return `${message}. Use formats like 1000000, 1,000,000, 1M, 2.5K.`
  }
  if (message.includes('Unknown column') || message.includes('Unknown id_column')) {
    return 'Could not save because one field no longer matches the current schema. Reload and try again.'
  }
  if (message.includes('Missing id_column')) {
    return 'Could not save because one field is missing its record identifier. Reload and try again.'
  }
  if (message.includes('Record not found')) {
    return 'Could not save because a record no longer exists. Reload and try again.'
  }
  if (message.includes('table_name is required')) {
    return 'Could not save because one field target is missing. Reload and try again.'
  }
  if (message.includes('Saving is blocked: set your user profile before editing.')) return message
  return message
}

function stringifyEventValue(value) {
  if (value === undefined || value === null) return null
  return String(value)
}

function stringifyEventPayload(payload) {
  if (!payload || typeof payload !== 'object') return null
  return JSON.stringify(payload)
}

function parseEventPayload(payloadJson) {
  const normalized = normalizeNullableString(payloadJson)
  if (!normalized) return null
  try {
    return JSON.parse(normalized)
  } catch {
    return null
  }
}

function resolveAuditActorDisplayLabel(database, userId) {
  const user = getUserById(database, userId)
  return (
    normalizeNullableString(user?.User_Name) ||
    normalizeNullableString(user?.User_PEmail) ||
    normalizeNullableString(userId) ||
    'User'
  )
}

function resolveAuditRecordContext(database, tableName, recordId) {
  try {
    const config = getRecordTableConfig(tableName)
    const tableMeta = getTableMeta(database, config.tableName)
    const idColumn = tableMeta?.pkColumn
    if (!idColumn) {
      return {
        tableName: normalizeNullableString(tableName),
        entityLabel: '',
        recordLabel: normalizeNullableString(recordId) || 'Record',
        row: null,
      }
    }

    const row = database
      .prepare(
        `SELECT * FROM ${quoteIdentifier(config.tableName)} WHERE ${quoteIdentifier(idColumn)} = ? LIMIT 1`,
      )
      .get(recordId)

    return {
      tableName: config.tableName,
      entityLabel: normalizeNullableString(config.entityLabel),
      recordLabel: resolveRecordDisplayLabel(row || {}, config, normalizeNullableString(recordId) || 'Record'),
      row: row || null,
    }
  } catch {
    return {
      tableName: normalizeNullableString(tableName),
      entityLabel: '',
      recordLabel: normalizeNullableString(recordId) || 'Record',
      row: null,
    }
  }
}

function resolveAuditRelationshipLabels(database, targetEntity, ids = []) {
  const normalizedIds = Array.isArray(ids) ? ids.map((value) => normalizeNullableString(value)).filter(Boolean) : []
  if (!normalizedIds.length) return []
  try {
    const targetConfig = getRecordTableConfig(targetEntity)
    const targetIdColumn = getRecordPrimaryKeyColumn(database, targetConfig.tableName)
    const placeholders = normalizedIds.map(() => '?').join(', ')
    const rows = database
      .prepare(
        `SELECT * FROM ${quoteIdentifier(targetConfig.tableName)} WHERE ${quoteIdentifier(targetIdColumn)} IN (${placeholders})`,
      )
      .all(...normalizedIds)
    const labelById = new Map(
      rows.map((row) => [
        normalizeNullableString(row?.[targetIdColumn]),
        resolveRecordDisplayLabel(row, targetConfig, normalizeNullableString(row?.[targetIdColumn])),
      ]),
    )
    return normalizedIds.map((id) => labelById.get(id) || id)
  } catch {
    return normalizedIds
  }
}

function resolveAuditCurrentFieldDisplayValue(database, tableName, recordId, fieldName) {
  const normalizedFieldName = normalizeNullableString(fieldName)
  if (!normalizedFieldName) return ''

  const relationshipContract = getLdbRelationshipContractForToken(tableName, normalizedFieldName)
  if (relationshipContract) {
    return listLdbRelationshipItems(database, relationshipContract, recordId)
      .map((item) => normalizeNullableString(item?.label))
      .filter(Boolean)
      .join(', ')
  }

  try {
    const recordContext = resolveAuditRecordContext(database, tableName, recordId)
    return normalizeNullableString(recordContext?.row?.[normalizedFieldName]) || ''
  } catch {
    return ''
  }
}

function resolveAuditFeedTab() {
  return 'events'
}

function buildAuditEventPayload(
  database,
  {
    tableName,
    recordId,
    fieldName,
    oldValue,
    newValue,
    editedBy,
    actionLabel = null,
  } = {},
) {
  const normalizedFieldName = normalizeNullableString(String(fieldName || '').replace(/__verification$/, ''))
  const action = normalizeNullableString(actionLabel)?.toLowerCase() || ''
  const recordContext = resolveAuditRecordContext(database, tableName, recordId)
  const payload = {
    actor_label: resolveAuditActorDisplayLabel(database, editedBy),
    record_label: recordContext.recordLabel,
    entity_label: recordContext.entityLabel,
    field_label: formatRecordFieldLabel(normalizedFieldName),
    feed_tab: resolveAuditFeedTab(tableName),
  }

  if (String(fieldName || '').endsWith('__verification') || action.includes('verification')) {
    const currentDisplay = resolveAuditCurrentFieldDisplayValue(database, tableName, recordId, normalizedFieldName)
    if (currentDisplay) payload.new_display_value = currentDisplay
    const nextVerification = parseEventPayload(newValue)
    if (nextVerification?.state) payload.verification_state = normalizeNullableString(nextVerification.state)
    if (nextVerification?.source) payload.verification_source = normalizeNullableString(nextVerification.source)
    return payload
  }

  const relationshipContract = getLdbRelationshipContractForToken(tableName, normalizedFieldName)
  if (relationshipContract) {
    const oldIds = normalizeRelationshipIds(oldValue)
    const newIds = normalizeRelationshipIds(newValue)
    const oldLabels = resolveAuditRelationshipLabels(database, relationshipContract.targetEntity, oldIds)
    const newLabels = resolveAuditRelationshipLabels(database, relationshipContract.targetEntity, newIds)
    payload.relationship_target_entity = normalizeNullableString(relationshipContract.targetEntity)
    try {
      payload.relationship_target_label = normalizeNullableString(getRecordTableConfig(relationshipContract.targetEntity)?.entityLabel)
    } catch {
      payload.relationship_target_label = ''
    }
    payload.old_display_values = oldLabels
    payload.new_display_values = newLabels
    payload.old_display_value = oldLabels.join(', ')
    payload.new_display_value = newLabels.join(', ')
    return payload
  }

  payload.old_display_value = normalizeNullableString(oldValue) || ''
  payload.new_display_value = normalizeNullableString(newValue) || ''
  return payload
}

function writeAuditEvent(
  database,
  {
    tableName,
    recordId,
    fieldName,
    oldValue,
    newValue,
    editedBy,
    actionId = null,
    actionLabel = null,
    payload = null,
  } = {},
) {
  const normalizedOldValue = stringifyEventValue(oldValue)
  const normalizedNewValue = stringifyEventValue(newValue)
  const normalizedPayload = stringifyEventPayload(
    payload || buildAuditEventPayload(database, { tableName, recordId, fieldName, oldValue, newValue, editedBy, actionLabel }),
  )
  if (actionId) {
    const existingEvent = database
      .prepare(
        `
        SELECT id, old_value, payload_json
        FROM events
        WHERE action_id = ? AND table_name = ? AND record_id = ? AND field_name = ?
        LIMIT 1
      `,
      )
      .get(actionId, tableName, recordId, fieldName)

    if (existingEvent?.id) {
      database
        .prepare(
          `
          UPDATE events
          SET
            action_label = ?,
            old_value = COALESCE(old_value, ?),
            new_value = ?,
            payload_json = COALESCE(?, payload_json),
            edited_by = ?,
            edited_at = datetime('now')
          WHERE id = ?
        `,
        )
        .run(
          actionLabel,
          normalizedOldValue,
          normalizedNewValue,
          normalizedPayload,
          editedBy,
          existingEvent.id,
        )
      return existingEvent.id
    }
  }

  const eventId = `event:${crypto.randomUUID()}`
  database
    .prepare(
      `
      INSERT INTO events (
        id, table_name, record_id, field_name, action_id, action_label, old_value, new_value,
        payload_json, edited_by, edited_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
    )
    .run(
      eventId,
      tableName,
      recordId,
      fieldName,
      actionId,
      actionLabel,
      normalizedOldValue,
      normalizedNewValue,
      normalizedPayload,
      editedBy,
    )
  return eventId
}

function normalizeLifecycleActionLabel(actionLabel) {
  const normalized = normalizeNullableString(actionLabel)?.toLowerCase()
  if (!normalized) return 'modified'
  if (normalized === 'create' || normalized.includes('create')) return 'created'
  if (normalized === 'delete' || normalized.includes('delete') || normalized.includes('remove')) return 'deleted'
  if (
    normalized === 'update' ||
    normalized === 'modified' ||
    normalized.includes('update') ||
    normalized.includes('edit')
  ) return 'modified'
  if (normalized === 'created' || normalized === 'modified' || normalized === 'deleted') return normalized
  return normalized
}

function resolveLifecycleRecordId(result = {}, fallback = null) {
  return (
    normalizeNullableString(result?.id) ||
    normalizeNullableString(result?.artifact_id) ||
    normalizeNullableString(result?.project_id) ||
    normalizeNullableString(fallback)
  )
}

function writeLifecycleAuditEvent(
  database,
  {
    tableName,
    recordId,
    actionLabel = 'modified',
    recordLabel = '',
    oldValue = null,
    newValue = null,
  } = {},
) {
  const normalizedTableName = normalizeNullableString(tableName)
  const normalizedRecordId = normalizeNullableString(recordId)
  if (!normalizedTableName || !normalizedRecordId) return null

  const actor = getAuditActor(database)
  const normalizedActionLabel = normalizeLifecycleActionLabel(actionLabel)
  const recordContext = resolveAuditRecordContext(database, normalizedTableName, normalizedRecordId)
  const resolvedRecordLabel =
    normalizeNullableString(recordLabel) ||
    normalizeNullableString(recordContext?.recordLabel) ||
    normalizedRecordId

  return writeAuditEvent(database, {
    tableName: normalizedTableName,
    recordId: normalizedRecordId,
    fieldName: 'record',
    oldValue,
    newValue,
    editedBy: normalizeNullableString(actor?.user_id) || null,
    actionLabel: normalizedActionLabel,
    payload: {
      actor_label: resolveAuditActorDisplayLabel(database, actor.user_id),
      entity_label: normalizeNullableString(recordContext?.entityLabel) || normalizedTableName,
      record_label: resolvedRecordLabel,
      field_label: 'Record',
      old_display_value: normalizeNullableString(oldValue),
      new_display_value: normalizeNullableString(newValue) || resolvedRecordLabel,
      action_label: normalizedActionLabel,
      feed_tab: resolveAuditFeedTab(normalizedTableName),
    },
  })
}

function auditCreatedRecord(tableName, result = {}, payload = {}) {
  const database = initDb()
  const recordId = resolveLifecycleRecordId(result)
  if (!recordId) return null
  return writeLifecycleAuditEvent(database, {
    tableName,
    recordId,
    actionLabel: 'created',
    newValue:
      normalizeNullableString(payload?.Name) ||
      normalizeNullableString(payload?.Summary) ||
      normalizeNullableString(payload?.title) ||
      null,
  })
}

function auditDeletedRecord(tableName, recordId) {
  const database = initDb()
  const normalizedRecordId = normalizeNullableString(recordId)
  if (!normalizedRecordId) return null
  return writeLifecycleAuditEvent(database, {
    tableName,
    recordId: normalizedRecordId,
    actionLabel: 'deleted',
    oldValue: normalizedRecordId,
  })
}

const APP_SETTING_KEYS = {
  openaiApiKey: 'openai_api_key',
  geminiApiKey: 'gemini_api_key',
  userId: 'user_id',
  userContactId: 'user_contact_id',
  workspaceRoot: 'workspace_root',
}

function setAppSetting(database, key, value) {
  database
    .prepare(
      `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = datetime('now')
    `,
    )
    .run(String(key), value == null ? null : String(value))
}

function getAppSetting(database, key) {
  const row = database
    .prepare('SELECT value FROM app_settings WHERE key = ? LIMIT 1')
    .get(String(key))
  return row?.value ?? null
}

function getApiSettings(database) {
  return {
    openaiApiKey: normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.openaiApiKey)),
    geminiApiKey: normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.geminiApiKey)),
  }
}

function getSettingsPayload(database) {
  const apiSettings = getApiSettings(database)
  return {
    ...apiSettings,
  }
}

function setApiSettings(payload = {}) {
  const database = initDb()
  const openaiApiKey = normalizeNullableString(payload?.openaiApiKey)
  const geminiApiKey = normalizeNullableString(payload?.geminiApiKey)

  setAppSetting(database, APP_SETTING_KEYS.openaiApiKey, openaiApiKey)
  setAppSetting(database, APP_SETTING_KEYS.geminiApiKey, geminiApiKey)
  return getSettingsPayload(database)
}

function getUserById(database, userId) {
  const id = normalizeNullableString(userId)
  if (!id) return null
  return (
    database
      .prepare(
        `
      SELECT
        u.id,
        u.User_Name,
        u.User_PEmail,
        ur.role_id,
        r.Role_Name,
        u.created_at,
        u.updated_at
      FROM Users u
      LEFT JOIN Users_Roles ur ON ur.user_id = u.id
      LEFT JOIN Roles r ON r.id = ur.role_id
      WHERE u.id = ?
      LIMIT 1
    `,
      )
      .get(id) || null
  )
}

function ensureDefaultRoles(database, actorUserId = null) {
  const defaultRoles = [
    {
      id: 'role:owner',
      name: 'Owner',
      summary: 'Default owner role for the local workspace.',
    },
    {
      id: 'role:admin',
      name: 'Admin',
      summary: 'Administrative role for managing records, structure, and permissions.',
    },
    {
      id: 'role:guest',
      name: 'Guest',
      summary: 'Restricted role for view-oriented access with limited editing rights.',
    },
    {
      id: 'role:unverified',
      name: 'Unverified',
      summary: 'Draft user role for identities that exist but do not yet hold verified credentials or access.',
    },
  ]

  for (const role of defaultRoles) {
    const existing = database
      .prepare('SELECT id FROM Roles WHERE lower(trim(Role_Name)) = lower(trim(?)) LIMIT 1')
      .get(role.name)
    if (existing?.id) continue

    database
      .prepare(
        `
        INSERT INTO Roles (
          id, Role_Name, Role_Summary, created_by, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, datetime('now'), datetime('now')
        )
      `,
      )
      .run(role.id, role.name, role.summary, normalizeNullableString(actorUserId))
  }

  const ownerRow = database
    .prepare("SELECT id FROM Roles WHERE lower(trim(Role_Name)) = 'owner' LIMIT 1")
    .get()
  return normalizeNullableString(ownerRow?.id) || 'role:owner'
}

function ensureDefaultCompanionRoles(database, actorUserId = null) {
  const defaultCompanionRoles = [
    {
      id: 'companion-role:master-companion',
      name: 'Master Companion',
      summary: 'Bootstrap operator responsible for sequential genesis and contract alignment.',
      type: 'Companion',
      status: 'Active',
      contractPath: 'docs/020/020_Master_Companion.md',
    },
    {
      id: 'companion-role:intake-steward',
      name: 'Intake Steward',
      summary: 'Steward role that governs intake extraction, logic, and proposal review.',
      type: 'Companion',
      status: 'Active',
      contractPath: 'docs/020/020_Intake_Steward.md',
    },
    {
      id: 'companion-role:point-tracker',
      name: 'Point Tracker',
      summary: 'Maintains score, progress, and verification checkpoints for the game layer.',
      type: 'Companion',
      status: 'Draft',
      contractPath: 'docs/020/020_Point_Tracker.md',
    },
    {
      id: 'companion-role:quest-builder',
      name: 'Quest Builder',
      summary: 'Defines and curates quests, tasks, and progression logic for game loops.',
      type: 'Companion',
      status: 'Draft',
      contractPath: 'docs/020/020_Quest_Builder.md',
    },
  ]

  for (const role of defaultCompanionRoles) {
    const existing = database
      .prepare('SELECT id FROM Companion_Roles WHERE lower(trim(Companion_Role_Name)) = lower(trim(?)) LIMIT 1')
      .get(role.name)
    if (existing?.id) {
      database
        .prepare(
          `
          UPDATE Companion_Roles
          SET
            Companion_Role_Summary = ?,
            Companion_Role_Type = ?,
            Companion_Role_Status = ?,
            Companion_Role_Contract_Path = ?,
            updated_at = datetime('now')
          WHERE id = ?
        `,
        )
        .run(
          role.summary,
          role.type,
          role.status,
          role.contractPath,
          existing.id,
        )
      continue
    }

    database
      .prepare(
        `
        INSERT INTO Companion_Roles (
          id,
          Companion_Role_Name,
          Companion_Role_Summary,
          Companion_Role_Type,
          Companion_Role_Status,
          Companion_Role_Contract_Path,
          created_by,
          created_at,
          updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
        )
      `,
      )
      .run(
        role.id,
        role.name,
        role.summary,
        role.type,
        role.status,
        role.contractPath,
        normalizeNullableString(actorUserId),
      )
  }
}

function ensureOwnerDb(database, ownerUserId) {
  const normalizedUserId = normalizeNullableString(ownerUserId)
  if (!normalizedUserId) return null

  const ownerDbId = 'owner_db'
  database
    .prepare(
      `
      INSERT INTO Owner (
        id, owner_user_id, created_at, updated_at
      ) VALUES (
        ?, ?, datetime('now'), datetime('now')
      )
      ON CONFLICT(id) DO UPDATE SET
        owner_user_id = excluded.owner_user_id,
        updated_at = datetime('now')
    `,
    )
    .run(ownerDbId, normalizedUserId)

  return ownerDbId
}

function getOwnerUserId(database) {
  const ownerUserId = normalizeNullableString(
    database
      .prepare(
        `
        SELECT owner_user_id
        FROM Owner
        WHERE id = 'owner_db'
        LIMIT 1
      `,
      )
      .get()?.owner_user_id,
  )
  if (ownerUserId) return ownerUserId
  return normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.userId))
}

function getOwnerContactId(database) {
  const ownerUserId = getOwnerUserId(database)
  if (!ownerUserId) return ''
  return normalizeNullableString(
    database
      .prepare(
        `
        SELECT id
        FROM Contacts
        WHERE linked_user_id = ?
        LIMIT 1
      `,
      )
      .get(ownerUserId)?.id,
  )
}

function getOwnerIdentityStatus(database) {
  const ownerUserId = getOwnerUserId(database)
  const ownerUser = ownerUserId ? getUserById(database, ownerUserId) : null
  const ownerContactId = getOwnerContactId(database)
  const ownerContact = ownerContactId ? getContactById(database, ownerContactId) : null
  const ownerName = normalizeNullableString(ownerUser?.User_Name)
  const ownerEmail = normalizeNullableString(ownerUser?.User_PEmail)
  const hasOwnerUser = Boolean(ownerUserId && ownerUser)
  const hasOwnerEmail = Boolean(ownerEmail && isEmail(ownerEmail))
  const hasOwnerContact = Boolean(ownerContactId && ownerContact)
  const ownerIdsAligned = Boolean(ownerUserId && ownerContactId && ownerUserId === ownerContactId)
  const ownerContactLinked = Boolean(ownerContact && normalizeNullableString(ownerContact.linked_user_id) === ownerUserId)
  const isComplete =
    hasOwnerUser &&
    Boolean(ownerName) &&
    hasOwnerEmail &&
    hasOwnerContact &&
    ownerIdsAligned &&
    ownerContactLinked

  let message = ''
  if (!hasOwnerUser) message = 'Owner user is missing.'
  else if (!ownerName) message = 'Owner name is missing.'
  else if (!hasOwnerEmail) message = 'Owner email is missing.'
  else if (!hasOwnerContact) message = 'Owner contact is missing.'
  else if (!ownerIdsAligned) message = 'Owner contact id must match owner user id.'
  else if (!ownerContactLinked) message = 'Owner contact must stay linked to owner user.'

  return {
    isComplete,
    message,
    ownerUserId: ownerUserId || null,
    ownerContactId: ownerContactId || null,
    ownerName: ownerName || '',
    ownerEmail: ownerEmail || '',
  }
}

function isOwnerActor(database, actor = null) {
  const ownerUserId = getOwnerUserId(database)
  const actorUserId = normalizeNullableString(actor?.user_id)
  return Boolean(ownerUserId && actorUserId && ownerUserId === actorUserId)
}

function assertOwnerAuthorityChangeAllowed(database, change) {
  const ownerUserId = getOwnerUserId(database)
  if (!ownerUserId) return

  if (
    change.change_kind === 'field' &&
    change.table_name === 'Owner' &&
    change.field_name === 'owner_user_id'
  ) {
    throw new Error('Owner designation can only change through an explicit ownership transfer flow.')
  }

  if (
    change.change_kind === 'field' &&
    change.table_name === 'Users_Roles' &&
    change.field_name === 'role_id' &&
    change.record_id === ownerUserId
  ) {
    throw new Error('Owner designation is locked and cannot be changed from normal editing.')
  }
}

function assertOwnerRecordEditAllowed(database, actor, change) {
  const ownerUserId = getOwnerUserId(database)
  const ownerContactId = getOwnerContactId(database)
  if (!ownerUserId && !ownerContactId) return

  const touchesOwnerUser = change.table_name === 'Users' && change.record_id === ownerUserId
  const touchesOwnerContact = change.table_name === 'Contacts' && change.record_id === ownerContactId
  const touchesOwnerIdentityLink =
    change.change_kind === 'relationship' &&
    ((change.table_name === 'Users' && change.record_id === ownerUserId) ||
      (change.table_name === 'Contacts' && change.record_id === ownerContactId))

  if (!touchesOwnerUser && !touchesOwnerContact && !touchesOwnerIdentityLink) return
  if (isOwnerActor(database, actor)) return

  throw new Error('Only the owner can edit owner profile data.')
}

function assertUserDeleteAllowed(database, userId) {
  const normalizedUserId = normalizeNullableString(userId)
  if (!normalizedUserId) throw new Error('User ID is required')

  const ownerUserId = getOwnerUserId(database)
  if (ownerUserId && normalizedUserId === ownerUserId) {
    throw new Error('The owner user cannot be deleted from normal editing.')
  }

  const linkedContactId = normalizeNullableString(
    database
      .prepare('SELECT id FROM Contacts WHERE linked_user_id = ? LIMIT 1')
      .get(normalizedUserId)?.id,
  )
  if (linkedContactId) {
    throw new Error('This user is linked to a contact. Delete the account flow instead of deleting the user directly.')
  }
}

function assertContactDeleteAllowed(database, contactId) {
  const normalizedContactId = normalizeNullableString(contactId)
  if (!normalizedContactId) throw new Error('Contact ID is required')

  const ownerContactId = getOwnerContactId(database)
  if (ownerContactId && normalizedContactId === ownerContactId) {
    throw new Error('The owner contact cannot be deleted from normal editing.')
  }

  const linkedUserId = normalizeNullableString(
    database
      .prepare('SELECT linked_user_id FROM Contacts WHERE id = ? LIMIT 1')
      .get(normalizedContactId)?.linked_user_id,
  )
  if (linkedUserId) {
    throw new Error('This contact is linked to a user. Delete the account flow instead of deleting the contact directly.')
  }
}

function ensureUserRoleAssignmentRow(database, userId, assignedBy = null) {
  const normalizedUserId = normalizeNullableString(userId)
  if (!normalizedUserId) return

  database
    .prepare(
      `
      INSERT INTO Users_Roles (
        user_id, role_id, assigned_by, created_at, updated_at
      ) VALUES (
        ?, NULL, ?, datetime('now'), datetime('now')
      )
      ON CONFLICT(user_id) DO NOTHING
    `,
    )
    .run(normalizedUserId, normalizeNullableString(assignedBy))
}

function assignUserRole(database, userId, roleId, assignedBy = null) {
  const normalizedUserId = normalizeNullableString(userId)
  const normalizedRoleId = normalizeNullableString(roleId)
  if (!normalizedUserId || !normalizedRoleId) return

  if (normalizedRoleId === 'role:owner') {
    const ownerUserId = getOwnerUserId(database)
    if (ownerUserId && normalizedUserId !== ownerUserId) {
      throw new Error('The Owner role can only be assigned to the canonical owner user.')
    }
  }

  database
    .prepare(
      `
      INSERT INTO Users_Roles (
        user_id, role_id, assigned_by, created_at, updated_at
      ) VALUES (
        ?, ?, ?, datetime('now'), datetime('now')
      )
      ON CONFLICT(user_id) DO UPDATE SET
        role_id = excluded.role_id,
        assigned_by = excluded.assigned_by,
        updated_at = datetime('now')
    `,
    )
    .run(normalizedUserId, normalizedRoleId, normalizeNullableString(assignedBy) || normalizedUserId)
}

function upsertLinkedContactForUserProfile(
  database,
  { userId, name, email, profile = {}, preferredContactId = '', forceContactId = '' } = {},
) {
  const normalizedUserId = normalizeNullableString(userId)
  const normalizedName = normalizeNullableString(name)
  const normalizedEmail = normalizeNullableString(email)
  if (!normalizedUserId || !normalizedName) {
    throw new Error('User contact bootstrap requires user id and name.')
  }

  const forcedContactId = normalizeNullableString(forceContactId)
  const storedContactId = forcedContactId || normalizeNullableString(preferredContactId)
  const existingContact =
    (storedContactId &&
      database.prepare('SELECT id FROM Contacts WHERE id = ? LIMIT 1').get(storedContactId)) ||
    database.prepare('SELECT id FROM Contacts WHERE linked_user_id = ? LIMIT 1').get(normalizedUserId)

  const desiredContactId = forcedContactId || existingContact?.id || `contact:${crypto.randomUUID()}`
  if (existingContact?.id && desiredContactId && existingContact.id !== desiredContactId) {
    database
      .prepare(
        `
        UPDATE Contacts
        SET id = ?, updated_at = datetime('now')
        WHERE id = ?
      `,
      )
      .run(desiredContactId, existingContact.id)
  }

  const contactId = desiredContactId
  const personalEmail = normalizeNullableString(profile?.Personal_Email) || normalizedEmail
  const professionalEmail = normalizeNullableString(profile?.Professional_Email)

  database
    .prepare(
      `
      INSERT INTO Contacts (
        id, Name, Personal_Email, Professional_Email, Phone, Country_based, LinkedIn, linked_user_id
      ) VALUES (
        @id, @Name, @Personal_Email, @Professional_Email, @Phone, @Country_based, @LinkedIn, @linked_user_id
      )
      ON CONFLICT(id) DO UPDATE SET
        Name = excluded.Name,
        Personal_Email = excluded.Personal_Email,
        Professional_Email = excluded.Professional_Email,
        Phone = COALESCE(excluded.Phone, Contacts.Phone),
        Country_based = COALESCE(excluded.Country_based, Contacts.Country_based),
        LinkedIn = COALESCE(excluded.LinkedIn, Contacts.LinkedIn),
        linked_user_id = excluded.linked_user_id
    `,
    )
    .run({
      id: contactId,
      Name: normalizedName,
      Personal_Email: personalEmail,
      Professional_Email: professionalEmail,
      Phone: normalizeNullableString(profile?.Phone),
      Country_based: normalizeNullableString(profile?.Country_based),
      LinkedIn: normalizeNullableString(profile?.LinkedIn),
      linked_user_id: normalizedUserId,
    })

  return contactId
}

function createOrUpdateUserProfile(database, profile = {}) {
  const name = normalizeNullableString(profile?.Name)
  if (!name) throw new Error('User name is required')

  const email =
    normalizeNullableString(profile?.User_PEmail) ||
    normalizeNullableString(profile?.Professional_Email) ||
    normalizeNullableString(profile?.Personal_Email) ||
    normalizeNullableString(profile?.Email)
  if (!email) throw new Error('User email is required')
  if (!isEmail(email)) throw new Error('User email must be a valid email address')

  const storedUserId = normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.userId))
  const existingByEmail = database
    .prepare('SELECT id FROM Users WHERE User_PEmail = ? LIMIT 1')
    .get(email)
  const userId =
    normalizeNullableString(profile?.linked_user_id) ||
    storedUserId ||
    existingByEmail?.id ||
    `user:${crypto.randomUUID()}`

  database
    .prepare(
      `
      INSERT INTO Users (
        id, User_Name, User_PEmail, created_at, updated_at
      ) VALUES (
        @id, @User_Name, @User_PEmail, datetime('now'), datetime('now')
      )
      ON CONFLICT(id) DO UPDATE SET
        User_Name = excluded.User_Name,
        User_PEmail = excluded.User_PEmail,
        updated_at = datetime('now')
    `,
    )
    .run({
      id: userId,
      User_Name: name,
      User_PEmail: email,
    })

  const contactId = upsertLinkedContactForUserProfile(database, {
    userId,
    name,
    email,
    profile,
    preferredContactId: getAppSetting(database, APP_SETTING_KEYS.userContactId),
    forceContactId: userId,
  })

  setAppSetting(database, APP_SETTING_KEYS.userId, userId)
  setAppSetting(database, APP_SETTING_KEYS.userContactId, contactId)
  setAppSetting(database, 'user_label', name)
  const ownerRoleId = ensureDefaultRoles(database, userId)
  ensureOwnerDb(database, userId)
  ensureUserRoleAssignmentRow(database, userId, userId)
  assignUserRole(database, userId, ownerRoleId, userId)

  return { userId, contactId, email, name }
}

function ensureOwnerUserProfile(database) {
  const storedUserId = normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.userId))
  const existingUser = storedUserId ? getUserById(database, storedUserId) : null
  if (existingUser) {
    const ownerRoleId = ensureDefaultRoles(database, existingUser.id)
    const ownerContactId = upsertLinkedContactForUserProfile(database, {
      userId: existingUser.id,
      name: existingUser.User_Name,
      email: existingUser.User_PEmail,
      profile: {
        Name: existingUser.User_Name,
        User_PEmail: existingUser.User_PEmail,
      },
      preferredContactId: getAppSetting(database, APP_SETTING_KEYS.userContactId),
      forceContactId: existingUser.id,
    })
    setAppSetting(database, APP_SETTING_KEYS.userContactId, ownerContactId)
    ensureOwnerDb(database, existingUser.id)
    ensureUserRoleAssignmentRow(database, existingUser.id, existingUser.id)
    assignUserRole(database, existingUser.id, ownerRoleId, existingUser.id)
    return existingUser
  }

  const storedContactId = normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.userContactId))
  const contact =
    storedContactId
      ? database
          .prepare(
            `
            SELECT
              id,
              Name,
              Personal_Email,
              Professional_Email,
              Phone,
              Country_based,
              LinkedIn,
              linked_user_id
            FROM Contacts
            WHERE id = ?
            LIMIT 1
          `,
          )
          .get(storedContactId)
      : null

  if (!contact) return null

  createOrUpdateUserProfile(database, contact)
  const nextUserId = normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.userId))
  return nextUserId ? getUserById(database, nextUserId) : null
}

function ensureAuditActor(database) {
  let userId = normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.userId))
  let userContactId = normalizeNullableString(
    getAppSetting(database, APP_SETTING_KEYS.userContactId),
  )
  let userLabel = ''

  if (userId) {
    const user = getUserById(database, userId)
    userLabel = normalizeNullableString(user?.User_Name)
    if (!user) {
      setAppSetting(database, APP_SETTING_KEYS.userId, null)
      userId = ''
    }
  }

  if (userContactId) {
    const row = database
      .prepare('SELECT id, Name, linked_user_id FROM Contacts WHERE id = ? LIMIT 1')
      .get(userContactId)
    if (!row?.id) {
      setAppSetting(database, APP_SETTING_KEYS.userContactId, null)
      userContactId = ''
    } else {
      userLabel = userLabel || normalizeNullableString(row?.Name)
      if (!userId && normalizeNullableString(row?.linked_user_id)) {
        userId = normalizeNullableString(row.linked_user_id)
        setAppSetting(database, APP_SETTING_KEYS.userId, userId)
      }
    }
  }

  if (userId && !userContactId) {
    const linkedContact = database
      .prepare('SELECT id, Name FROM Contacts WHERE linked_user_id = ? LIMIT 1')
      .get(userId)
    if (linkedContact?.id) {
      userContactId = linkedContact.id
      userLabel = userLabel || normalizeNullableString(linkedContact?.Name)
      setAppSetting(database, APP_SETTING_KEYS.userContactId, userContactId)
    }
  }

  return {
    user_id: userId || null,
    user_label: userLabel,
    user_contact_id: userContactId || null,
  }
}

function getAuditActor(database, { requireLabel = false, requireUser = false } = {}) {
  const actor = ensureAuditActor(database)
  if ((requireUser || requireLabel) && !actor.user_id) {
    throw new Error('Saving is blocked: set your user profile before editing.')
  }
  if (requireLabel && !actor.user_label) {
    throw new Error('Saving is blocked: set your user profile before editing.')
  }
  return actor
}

function setAuditUserLabel(label) {
  const database = initDb()
  const trimmed = normalizeNullableString(label)
  if (!trimmed) throw new Error('User name should not be empty')
  const existingUser = getUserById(database, getAppSetting(database, APP_SETTING_KEYS.userId))
  const existingEmail = normalizeNullableString(existingUser?.User_PEmail)
  if (!existingEmail) throw new Error('User email is required before setting the user name.')
  createOrUpdateUserProfile(database, { Name: trimmed, User_PEmail: existingEmail })
  return getAuditActor(database)
}

function toUserFriendlySaveError(error, entityLabel = 'record') {
  const message = String(error?.message || error || '').trim()
  if (message.includes('set your user profile before editing')) {
    return `Set up your user profile first before creating ${entityLabel}.`
  }
  if (message.includes('User email is required')) {
    return 'Enter a valid email address in User Settings before saving.'
  }
  return message || `Could not save ${entityLabel}.`
}

function getContactById(database, contactId) {
  const id = normalizeNullableString(contactId)
  if (!id) return null
  return (
    database
      .prepare(
        `
      SELECT
        id,
        Name,
        Personal_Email,
        Professional_Email,
        Phone,
        LinkedIn,
        Country_based,
        linked_user_id
      FROM Contacts
      WHERE id = ?
      LIMIT 1
    `,
      )
      .get(id) || null
  )
}

function getUserSettingsPayload(database) {
  ensureOwnerUserProfile(database)
  const ownerIdentity = getOwnerIdentityStatus(database)
  const actor = getAuditActor(database)
  const ownerUserId = getOwnerUserId(database)
  const ownerContactId = getOwnerContactId(database)
  const userId = normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.userId))
  const user = userId ? getUserById(database, userId) : null
  const userContactId = normalizeNullableString(
    getAppSetting(database, APP_SETTING_KEYS.userContactId),
  )
  const userContact = userContactId ? getContactById(database, userContactId) : null
  return {
    auditUserId: actor.user_id,
    ownerUserId: ownerUserId || null,
    ownerContactId: ownerContactId || null,
    ownerSetupComplete: ownerIdentity.isComplete,
    requiresOwnerSetup: !ownerIdentity.isComplete,
    ownerSetupMessage: ownerIdentity.message || '',
    canEditOwnerSettings: !ownerUserId || actor.user_id === ownerUserId,
    userId: user?.id || null,
    user,
    userContactId: userContact?.id || null,
    userContact,
  }
}

function setUserSettings(payload = {}) {
  const database = initDb()
  ensureOwnerUserProfile(database)
  const actor = getAuditActor(database)
  const ownerUserId = getOwnerUserId(database)
  if (ownerUserId && actor.user_id && actor.user_id !== ownerUserId) {
    throw new Error('Only the owner can update Owner Settings.')
  }
  const contactPayload =
    payload && typeof payload === 'object' && !Array.isArray(payload) ? payload.contact : null
  if (!contactPayload || typeof contactPayload !== 'object') {
    throw new Error('contact is required')
  }

  createOrUpdateUserProfile(database, contactPayload)
  return getUserSettingsPayload(database)
}

function listEvents(filters = {}) {
  const database = initDb()
  const where = []
  const params = []
  const tableName = normalizeNullableString(filters.table_name)
  const recordId = normalizeNullableString(filters.record_id)
  const actionId = normalizeNullableString(filters.action_id)
  const editedBy = normalizeNullableString(filters.edited_by || filters.edited_by_uuid)
  const since = normalizeNullableString(filters.since)
  const until = normalizeNullableString(filters.until)
  const limitRaw = Number(filters.limit)
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(1000, Math.floor(limitRaw))) : 200

  if (tableName) {
    where.push('table_name = ?')
    params.push(tableName)
  }
  if (recordId) {
    where.push('record_id = ?')
    params.push(recordId)
  }
  if (actionId) {
    where.push('action_id = ?')
    params.push(actionId)
  }
  if (editedBy) {
    where.push('edited_by = ?')
    params.push(editedBy)
  }
  if (since) {
    where.push('edited_at >= ?')
    params.push(since)
  }
  if (until) {
    where.push('edited_at <= ?')
    params.push(until)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  return database
    .prepare(
      `
      SELECT
        id,
        table_name,
        record_id,
        field_name,
        action_id,
        action_label,
        old_value,
        new_value,
        payload_json,
        edited_by,
        edited_at
      FROM events
      ${whereSql}
      ORDER BY edited_at DESC, id DESC
      LIMIT ?
    `,
    )
    .all(...params, limit)
    .map((row) => ({
      ...row,
      payload: parseEventPayload(row?.payload_json),
    }))
}

const EVENT_RELATION_FIELD_BY_ENTITY_LABEL = Object.freeze({
  User: 'Event_User',
  Contact: 'Event_Contact',
  Company: 'Event_Company',
  Artifact: 'Event_Artifact',
  Opportunity: 'Event_Opportunity',
  Fund: 'Event_Fund',
  Round: 'Event_Round',
  Project: 'Event_Project',
  Task: 'Event_Task',
  Note: 'Event_Note',
  Role: 'Event_Role',
  Market: 'Event_Market',
  Security: 'Event_Security',
  Intake: 'Event_Intake',
})

function appendUniqueEventRelation(target, fieldName, values) {
  const normalizedFieldName = normalizeNullableString(fieldName)
  if (!normalizedFieldName) return
  const nextValues = Array.isArray(values) ? values : [values]
  const normalizedValues = nextValues.map((value) => normalizeNullableString(value)).filter(Boolean)
  if (!normalizedValues.length) return
  const existing = Array.isArray(target[normalizedFieldName]) ? target[normalizedFieldName] : []
  target[normalizedFieldName] = Array.from(new Set([...existing, ...normalizedValues]))
}

function buildEventShellSummary({ actorLabel, recordLabel, fieldLabel, actionLabel, nextValue, previousValue }) {
  const action = normalizeNullableString(actionLabel)?.toLowerCase() || ''
  if (action.includes('create')) {
    return {
      title: `Created ${recordLabel || 'record'}`,
      summary: `${actorLabel || 'User'} created ${recordLabel || 'record'}`,
    }
  }

  if (action.includes('delete')) {
    return {
      title: `Deleted ${recordLabel || 'record'}`,
      summary: `${actorLabel || 'User'} deleted ${recordLabel || 'record'}`,
    }
  }

  if (action.includes('verification')) {
    const payloadObject = event?.payload && typeof event.payload === 'object' ? event.payload : {}
    const verificationStateLabel = formatVerificationStateLabel(payloadObject?.verification_state)
    return {
      title: `${verificationStateLabel} ${fieldLabel || 'field'}`,
      summary: nextValue
        ? `${actorLabel || 'User'} marked "${nextValue}" as ${verificationStateLabel.toLowerCase()} for ${fieldLabel || 'field'} on ${recordLabel || 'record'}`
        : `${actorLabel || 'User'} marked ${fieldLabel || 'field'} as ${verificationStateLabel.toLowerCase()} for ${recordLabel || 'record'}`,
    }
  }

  if (!previousValue && nextValue) {
    return {
      title: `Added ${fieldLabel || 'field'}`,
      summary: `${actorLabel || 'User'} added "${nextValue}" as ${fieldLabel || 'field'} for ${recordLabel || 'record'}`,
    }
  }

  if (previousValue && !nextValue) {
    return {
      title: `Cleared ${fieldLabel || 'field'}`,
      summary: `${actorLabel || 'User'} cleared ${fieldLabel || 'field'} for ${recordLabel || 'record'}`,
    }
  }

  if (nextValue) {
    return {
      title: `Updated ${fieldLabel || 'field'}`,
      summary: `${actorLabel || 'User'} updated ${fieldLabel || 'field'} to "${nextValue}" for ${recordLabel || 'record'}`,
    }
  }

  return {
    title: `Updated ${fieldLabel || 'record'}`,
    summary: `${actorLabel || 'User'} updated ${fieldLabel || 'record'} for ${recordLabel || 'record'}`,
  }
}

function formatVerificationStateLabel(state) {
  const normalized = normalizeNullableString(state)?.toLowerCase()
  if (normalized === 'verified') return 'Verified'
  if (normalized === 'default_preselected_unverified') return 'Pre-Selected'
  if (normalized === 'suggested_unverified') return 'Suggested'
  if (normalized === 'rejected') return 'Rejected'
  return 'Verification Updated'
}

function listEventRows(limit = 200) {
  const database = initDb()
  const events = listEvents({ limit })
  return events.map((event) => {
    const payload = event?.payload && typeof event.payload === 'object' ? event.payload : {}
    const actorLabel =
      normalizeNullableString(payload.actor_label) ||
      resolveAuditActorDisplayLabel(database, event?.edited_by)
    const recordLabel =
      normalizeNullableString(payload.record_label) ||
      normalizeNullableString(event?.record_id) ||
      'Record'
    const entityLabel = normalizeNullableString(payload.entity_label)
    const fieldLabel =
      normalizeNullableString(payload.field_label) ||
      formatRecordFieldLabel(String(event?.field_name || '').replace(/__verification$/, ''))
    const nextValue = normalizeNullableString(payload.new_display_value)
    const previousValue = normalizeNullableString(payload.old_display_value)
    const { title, summary } = buildEventShellSummary({
      actorLabel,
      recordLabel,
      fieldLabel,
      actionLabel: event?.action_label,
      nextValue,
      previousValue,
    })

    const row = {
      id: normalizeNullableString(event?.id),
      Event_Name: title,
      Event_Summary: summary,
      actor_label: actorLabel,
      field_label: fieldLabel,
      action_label: normalizeNullableString(event?.action_label),
      edited_at: normalizeNullableString(event?.edited_at),
      source_table_name: normalizeNullableString(event?.table_name),
      source_record_id: normalizeNullableString(event?.record_id),
      payload_json: normalizeNullableString(event?.payload_json),
    }

    appendUniqueEventRelation(row, 'Event_User', actorLabel)

    const sourceFieldName = EVENT_RELATION_FIELD_BY_ENTITY_LABEL[entityLabel]
    if (sourceFieldName) appendUniqueEventRelation(row, sourceFieldName, recordLabel)

    const relationshipTargetLabel = normalizeNullableString(payload.relationship_target_label)
    const relationshipFieldName = EVENT_RELATION_FIELD_BY_ENTITY_LABEL[relationshipTargetLabel]
    const impactedValues =
      Array.isArray(payload.new_display_values) && payload.new_display_values.length
        ? payload.new_display_values
        : Array.isArray(payload.old_display_values)
          ? payload.old_display_values
          : []
    if (relationshipFieldName) appendUniqueEventRelation(row, relationshipFieldName, impactedValues)

    return row
  })
}

function listFieldVerificationMetadata({ tableName, recordId } = {}) {
  const database = initDb()
  const normalizedTableName = normalizeNullableString(tableName)
  const normalizedRecordId = normalizeNullableString(recordId)
  if (!normalizedTableName || !normalizedRecordId) {
    throw new Error('tableName and recordId are required')
  }

  return database
    .prepare(
      `
      SELECT
        id,
        table_name,
        record_id,
        field_name,
        state,
        source,
        confidence,
        verified_by,
        verified_at,
        created_at,
        updated_at
      FROM Field_Verification_Metadata
      WHERE table_name = ? AND record_id = ?
      ORDER BY field_name ASC
    `,
    )
    .all(normalizedTableName, normalizedRecordId)
}

function upsertFieldVerificationMetadata(payload = {}) {
  const database = initDb()
  const actor = getAuditActor(database)
  const tableName = normalizeNullableString(payload?.tableName)
  const recordId = normalizeNullableString(payload?.recordId)
  const fieldName = normalizeNullableString(payload?.fieldName)
  const state = normalizeNullableString(payload?.state)
  const source = normalizeNullableString(payload?.source)
  const confidence = normalizeNullableString(payload?.confidence)
  const actionId = normalizeNullableString(payload?.actionId)
  const actionLabel = normalizeNullableString(payload?.actionLabel) || 'verification_state_change'

  if (!tableName || !recordId || !fieldName || !state) {
    throw new Error('tableName, recordId, fieldName, and state are required')
  }

  const existingMetadata = database
    .prepare(
      `
      SELECT
        id,
        state,
        source,
        confidence,
        verified_by,
        verified_at
      FROM Field_Verification_Metadata
      WHERE table_name = ? AND record_id = ? AND field_name = ?
      LIMIT 1
    `,
    )
    .get(tableName, recordId, fieldName)
  const verifiedBy = state === 'verified' ? actor.user_id : null
  const verifiedAt = state === 'verified' ? new Date().toISOString() : null
  const existingId = normalizeNullableString(existingMetadata?.id)
  const id = existingId || `fieldmeta:${crypto.randomUUID()}`

  database
    .prepare(
      `
      INSERT INTO Field_Verification_Metadata (
        id,
        table_name,
        record_id,
        field_name,
        state,
        source,
        confidence,
        verified_by,
        verified_at,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @table_name,
        @record_id,
        @field_name,
        @state,
        @source,
        @confidence,
        @verified_by,
        @verified_at,
        datetime('now'),
        datetime('now')
      )
      ON CONFLICT(table_name, record_id, field_name) DO UPDATE SET
        state = excluded.state,
        source = excluded.source,
        confidence = excluded.confidence,
        verified_by = excluded.verified_by,
        verified_at = excluded.verified_at,
        updated_at = datetime('now')
    `,
    )
    .run({
      id,
      table_name: tableName,
      record_id: recordId,
      field_name: fieldName,
      state,
      source,
      confidence,
      verified_by: verifiedBy,
      verified_at: verifiedAt,
    })

  const previousVerificationState = existingMetadata
    ? {
        state: normalizeNullableString(existingMetadata.state),
        source: normalizeNullableString(existingMetadata.source),
        confidence: normalizeNullableString(existingMetadata.confidence),
        verified_by: normalizeNullableString(existingMetadata.verified_by),
        verified_at: normalizeNullableString(existingMetadata.verified_at),
      }
    : null
  const nextVerificationState = {
    state,
    source,
    confidence,
    verified_by: verifiedBy,
    verified_at: verifiedAt,
  }

  if (JSON.stringify(previousVerificationState) !== JSON.stringify(nextVerificationState)) {
    writeAuditEvent(database, {
      tableName,
      recordId,
      fieldName: `${fieldName}__verification`,
      actionId,
      actionLabel,
      oldValue: previousVerificationState ? JSON.stringify(previousVerificationState) : null,
      newValue: JSON.stringify(nextVerificationState),
      editedBy: actor.user_id,
    })
  }

  return {
    id,
    table_name: tableName,
    record_id: recordId,
    field_name: fieldName,
    state,
    source,
    confidence,
    verified_by: verifiedBy,
    verified_at: verifiedAt,
    action_id: actionId,
    action_label: actionLabel,
  }
}

function applyAuditedChanges(
  changes = [],
  { createRecordHistoryFor = null, actionId = null, actionLabel = null } = {},
) {
  const database = initDb()
  const normalizedChanges = (Array.isArray(changes) ? changes : [])
    .map((change) => ({
      change_kind: normalizeNullableString(change?.change_kind) || 'field',
      table_name: normalizeNullableString(change?.table_name),
      record_id: normalizeNullableString(change?.record_id),
      field_name: normalizeNullableString(change?.field_name),
      relationship_token: normalizeNullableString(change?.relationship_token),
      target_entity: normalizeNullableString(change?.target_entity),
      id_column: normalizeNullableString(change?.id_column),
      new_value: change?.new_value,
    }))
    .filter((change) =>
      change.change_kind === 'relationship'
        ? change.table_name && change.record_id && change.relationship_token
        : change.table_name && change.record_id && change.field_name,
    )

  if (!normalizedChanges.length) {
    const actor = getAuditActor(database)
    return { updated: 0, events_created: 0, snapshot_id: null, actor }
  }

  const actor = getAuditActor(database)
  for (const change of normalizedChanges) {
    assertOwnerAuthorityChangeAllowed(database, change)
    assertOwnerRecordEditAllowed(database, actor, change)
  }

  const runChanges = () => {
    let updated = 0
    let eventsCreated = 0

    for (const change of normalizedChanges) {
      if (change.change_kind === 'relationship') {
        const resolvedTargetEntity = change.target_entity || resolveTargetEntityFromSharedToken(change.relationship_token)
        const relationshipContract = getLdbRelationshipContractForToken(change.table_name, change.relationship_token, resolvedTargetEntity)
        if (!relationshipContract) {
          throw new Error(`Relationship contract is not wired for ${change.relationship_token} on ${change.table_name}`)
        }

        const requestedIds = normalizeRelationshipIds(change.new_value)
        const currentIds = isDirectLdbRelationshipContract(relationshipContract)
          ? normalizeNullableString(relationshipContract?.contractType) === 'direct_foreign_key'
            ? [
                normalizeNullableString(
                  database
                    .prepare(
                      `
                      SELECT ${quoteIdentifier(relationshipContract.ownerField)} AS related_id
                      FROM ${quoteIdentifier(relationshipContract.ownerTable)}
                      WHERE ${quoteIdentifier(relationshipContract.ownerIdColumn)} = ?
                      LIMIT 1
                    `,
                    )
                    .get(change.record_id)?.related_id,
                ),
              ].filter(Boolean)
            : database
                .prepare(
                  `
                  SELECT ${quoteIdentifier(relationshipContract.ownerIdColumn)} AS related_id
                  FROM ${quoteIdentifier(relationshipContract.ownerTable)}
                  WHERE ${quoteIdentifier(relationshipContract.ownerField)} = ?
                  ORDER BY ${quoteIdentifier(relationshipContract.ownerIdColumn)}
                `,
                )
                .all(change.record_id)
                .map((row) => normalizeNullableString(row?.related_id))
                .filter(Boolean)
          : isGenericLdbRelationshipContract(relationshipContract)
            ? database
              .prepare(
                `
                SELECT target_record_id AS related_id
                FROM ${quoteIdentifier(getGenericLdbRelationshipTableName())}
                WHERE source_entity = ?
                  AND source_record_id = ?
                  AND source_token = ?
                  AND target_entity = ?
              `,
              )
              .all(
                relationshipContract.sourceEntity,
                change.record_id,
                relationshipContract.sourceToken,
                relationshipContract.targetEntity,
              )
              .map((row) => normalizeNullableString(row?.related_id))
              .filter(Boolean)
            : database
              .prepare(
                `
                SELECT ${quoteIdentifier(relationshipContract.targetJoinColumn)} AS related_id
                FROM ${quoteIdentifier(relationshipContract.joinTable)}
                WHERE ${quoteIdentifier(relationshipContract.sourceJoinColumn)} = ?
              `,
              )
              .all(change.record_id)
              .map((row) => normalizeNullableString(row?.related_id))
              .filter(Boolean)

        const currentSet = new Set(currentIds)
        const requestedSet = new Set(requestedIds)
        const toInsert = requestedIds.filter((id) => !currentSet.has(id))
        const toDelete = currentIds.filter((id) => !requestedSet.has(id))

        if (isDirectLdbRelationshipContract(relationshipContract)) {
          if (requestedIds.length > 1) {
            throw new Error(`${change.relationship_token} supports only one linked record at a time`)
          }

          if (
            normalizeNullableString(relationshipContract?.contractType) === 'reverse_direct_foreign_key' &&
            normalizeNullableString(change.relationship_token) === 'User_Contact' &&
            requestedIds.length === 0
          ) {
            throw new Error('User Contact cannot be blank.')
          }

          const requestedId = requestedIds[0] || null
          if (normalizeNullableString(relationshipContract?.contractType) === 'direct_foreign_key') {
            database
              .prepare(
                `
                UPDATE ${quoteIdentifier(relationshipContract.ownerTable)}
                SET ${quoteIdentifier(relationshipContract.ownerField)} = ?
                WHERE ${quoteIdentifier(relationshipContract.ownerIdColumn)} = ?
              `,
              )
              .run(requestedId, change.record_id)
          } else {
            database
              .prepare(
                `
                UPDATE ${quoteIdentifier(relationshipContract.ownerTable)}
                SET ${quoteIdentifier(relationshipContract.ownerField)} = NULL
                WHERE ${quoteIdentifier(relationshipContract.ownerField)} = ?
              `,
              )
              .run(change.record_id)
            if (requestedId) {
              database
                .prepare(
                  `
                  UPDATE ${quoteIdentifier(relationshipContract.ownerTable)}
                  SET ${quoteIdentifier(relationshipContract.ownerField)} = ?
                  WHERE ${quoteIdentifier(relationshipContract.ownerIdColumn)} = ?
                `,
                )
                .run(change.record_id, requestedId)
            }
          }
        } else {
          for (const relatedId of toDelete) {
            if (isGenericLdbRelationshipContract(relationshipContract)) {
              database
                .prepare(
                  `
                  DELETE FROM ${quoteIdentifier(getGenericLdbRelationshipTableName())}
                  WHERE source_entity = ?
                    AND source_record_id = ?
                    AND source_token = ?
                    AND target_entity = ?
                    AND target_record_id = ?
                `,
                )
                .run(
                  relationshipContract.sourceEntity,
                  change.record_id,
                  relationshipContract.sourceToken,
                  relationshipContract.targetEntity,
                  relatedId,
                )

              if (relationshipContract.targetToken) {
                database
                  .prepare(
                    `
                    DELETE FROM ${quoteIdentifier(getGenericLdbRelationshipTableName())}
                    WHERE source_entity = ?
                      AND source_record_id = ?
                      AND source_token = ?
                      AND target_entity = ?
                      AND target_record_id = ?
                  `,
                  )
                  .run(
                    relationshipContract.targetEntity,
                    relatedId,
                    relationshipContract.targetToken,
                    relationshipContract.sourceEntity,
                    change.record_id,
                  )
              }
            } else {
              database
                .prepare(
                  `
                  DELETE FROM ${quoteIdentifier(relationshipContract.joinTable)}
                  WHERE ${quoteIdentifier(relationshipContract.sourceJoinColumn)} = ?
                    AND ${quoteIdentifier(relationshipContract.targetJoinColumn)} = ?
                `,
                )
                .run(change.record_id, relatedId)
            }
          }

          for (const relatedId of toInsert) {
            if (isGenericLdbRelationshipContract(relationshipContract)) {
              database
                .prepare(
                  `
                  INSERT OR IGNORE INTO ${quoteIdentifier(getGenericLdbRelationshipTableName())} (
                    id,
                    source_entity,
                    source_record_id,
                    source_token,
                    target_entity,
                    target_record_id
                  ) VALUES (?, ?, ?, ?, ?, ?)
                `,
                )
                .run(
                  `ldbrel:${crypto.randomUUID()}`,
                  relationshipContract.sourceEntity,
                  change.record_id,
                  relationshipContract.sourceToken,
                  relationshipContract.targetEntity,
                  relatedId,
                )

              if (relationshipContract.targetToken) {
                database
                  .prepare(
                    `
                    INSERT OR IGNORE INTO ${quoteIdentifier(getGenericLdbRelationshipTableName())} (
                      id,
                      source_entity,
                      source_record_id,
                      source_token,
                      target_entity,
                      target_record_id
                    ) VALUES (?, ?, ?, ?, ?, ?)
                  `,
                  )
                  .run(
                    `ldbrel:${crypto.randomUUID()}`,
                    relationshipContract.targetEntity,
                    relatedId,
                    relationshipContract.targetToken,
                    relationshipContract.sourceEntity,
                    change.record_id,
                  )
              }
            } else {
            database
              .prepare(
                `
                INSERT OR IGNORE INTO ${quoteIdentifier(relationshipContract.joinTable)} (
                  ${quoteIdentifier(relationshipContract.sourceJoinColumn)},
                  ${quoteIdentifier(relationshipContract.targetJoinColumn)}
                ) VALUES (?, ?)
              `,
              )
              .run(change.record_id, relatedId)
            }
          }
        }

        if (toInsert.length || toDelete.length) {
          updated += 1
          writeAuditEvent(database, {
            tableName: change.table_name,
            recordId: change.record_id,
            fieldName: change.relationship_token,
            actionId,
            actionLabel,
            oldValue: JSON.stringify(currentIds),
            newValue: JSON.stringify(requestedIds),
            editedBy: actor.user_id,
          })
          eventsCreated += 1
        }
        continue
      }

      const tableMeta = getTableMeta(database, change.table_name)
      if (tableMeta.table === 'events') {
        throw new Error('Direct writes to events are not allowed')
      }

      if (!tableMeta.columnsSet.has(change.field_name)) {
        throw new Error(`Unknown column ${change.field_name} on ${change.table_name}`)
      }

      const idColumn = change.id_column || tableMeta.pkColumn
      if (!idColumn) {
        throw new Error(`Missing id_column for table ${change.table_name}`)
      }
      if (!tableMeta.columnsSet.has(idColumn)) {
        throw new Error(`Unknown id_column ${idColumn} on ${change.table_name}`)
      }

      const currentRow = database
        .prepare(
          `SELECT ${quoteIdentifier(change.field_name)} AS value FROM ${quoteIdentifier(change.table_name)} WHERE ${quoteIdentifier(idColumn)} = ? LIMIT 1`,
        )
        .get(change.record_id)
      if (!currentRow) {
        throw new Error(`Record not found in ${change.table_name}: ${idColumn}=${change.record_id}`)
      }

      const oldValue = currentRow.value
      const newValue = coerceValueForColumn(change.new_value, tableMeta.types[change.field_name])
      if (oldValue === newValue) continue

      const hasUpdatedAt =
        tableMeta.columnsSet.has('updated_at') && change.field_name !== 'updated_at'
      if (hasUpdatedAt) {
        database
          .prepare(
            `UPDATE ${quoteIdentifier(change.table_name)} SET ${quoteIdentifier(change.field_name)} = ?, updated_at = datetime('now') WHERE ${quoteIdentifier(idColumn)} = ?`,
          )
          .run(newValue, change.record_id)
      } else {
        database
          .prepare(
            `UPDATE ${quoteIdentifier(change.table_name)} SET ${quoteIdentifier(change.field_name)} = ? WHERE ${quoteIdentifier(idColumn)} = ?`,
          )
          .run(newValue, change.record_id)
      }

      updated += 1

      writeAuditEvent(database, {
        tableName: change.table_name,
        recordId: change.record_id,
        fieldName: change.field_name,
        actionId,
        actionLabel,
        oldValue,
        newValue,
        editedBy: actor.user_id,
      })
      eventsCreated += 1
    }

    let snapshotId = null
    if (createRecordHistoryFor?.tableName && createRecordHistoryFor?.recordId) {
      const config = getRecordTableConfig(createRecordHistoryFor.tableName)
      const recordId = normalizeNullableString(createRecordHistoryFor.recordId)
      const snapshotPayload = getRecordView(config.tableName, recordId)
      snapshotId = `snapshot:${crypto.randomUUID()}`
      database
        .prepare(
          `
          INSERT INTO databook_snapshots (
            id, table_name, record_id, payload_json, created_by, created_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        `,
        )
        .run(
          snapshotId,
          config.tableName,
          recordId,
          JSON.stringify(snapshotPayload),
          actor.user_id,
        )
    }

    return {
      updated,
      events_created: eventsCreated,
      snapshot_id: snapshotId,
      actor,
    }
  }

  return runChanges()
}

function hasMeaningfulValue(value) {
  if (value === null || value === undefined) return false
  if (typeof value === 'number') return Number.isFinite(value)
  return String(value).trim().length > 0
}

function pickMeaningfulFields(source = {}, fields = []) {
  const out = {}
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(source, field)) continue
    if (hasMeaningfulValue(source[field])) out[field] = source[field]
  }
  return out
}

function upsertCompanyFromAutofill(database, companyPayload = {}, fallbackCompanyId = null) {
  const companyFields = pickMeaningfulFields(companyPayload, [
    'id',
    'Company_Name',
    'Short_Name',
    'Company_Type',
    'One_Liner',
    'Description',
    'Notable_News',
    'Status',
    'Company_Stage',
    'Date_of_Incorporation',
    'Legal_Entity',
    'Incorporation_Type',
    'Incorporation_Country',
    'incorporation_country',
    'headquarters_city',
    'Pax',
    'PAX_Count',
    'PAX_Known',
    'Updates',
    'Website',
    'Mission_Vision',
    'Products_Services',
    'Key_Features',
    'Development_Stage',
    'ICP',
    'Business_Model',
    'Pricing',
    'Placement_Distribution',
    'Industry',
    'Niche',
    'Demand_Analysis',
    'Supply_Analysis',
    'Traction_Overview',
    'Unit_Sales_By_Type_Artifact_Id',
    'Unit_Sales_By_Region_Artifact_Id',
    'Unit_Sales_By_Customer_Mix_Artifact_Id',
    'Revenue_Breakdown_By_Type_Artifact_Id',
    'Revenue_Breakdown_By_Region_Artifact_Id',
    'Revenue_Breakdown_By_Customer_Mix_Artifact_Id',
    'Revenue_Breakdown_Top_10_Artifact_Id',
    'Cohorts_Analysis_By_Date_Artifact_Id',
    'Cohorts_Analysis_By_Product_Service_Artifact_Id',
    'Direct_Costs_By_Product_Service_Artifact_Id',
    'Sales_Marketing_Costs_By_Product_Service_Artifact_Id',
    'Customer_Acquisition_Cost',
    'Customer_Lifetime_Value',
    'General_Admin_Expenses',
    'Tech_Expenditure',
    'Income_Statement_Artifact_Id',
    'Balance_Sheet_Artifact_Id',
    'Cash_Flow_Artifact_Id',
    'Tax_Filings_Artifact_Id',
    'Bank_Statements_Artifact_Id',
    'Overview',
    'Forecast',
    'Short_Term_Objectives',
    'Long_Term_Objectives',
    'Use_of_Resources',
    'Runway_Analysis',
    'Capital_Needs',
    'Funding_Strategy',
    'Shareholder_Structure_Artifact_Id',
    'Legal_Founders',
    'Leadership_Team',
    'Advisors',
    'Shareholders',
  ])
  if (!hasMeaningfulValue(companyFields.Company_Name)) return fallbackCompanyId

  const existing = database
    .prepare('SELECT id FROM Companies WHERE Company_Name = ? LIMIT 1')
    .get(normalizeNullableString(companyFields.Company_Name))
  const id =
    normalizeNullableIntegerId(companyFields.id) ||
    normalizeNullableIntegerId(fallbackCompanyId) ||
    existing?.id
  const result = createCompany({
    ...companyFields,
    id,
    Company_Type: normalizeNullableString(companyFields.Company_Type) || 'Other',
  })
  return normalizeNullableIntegerId(result?.id) || normalizeNullableIntegerId(id)
}

function createOrUpdatePrimaryContactForOpportunity(
  database,
  opportunityId,
  kind,
  contactPayload = {},
) {
  const payload = pickMeaningfulFields(contactPayload, [
    'id',
    'Name',
    'Personal_Email',
    'Professional_Email',
    'Email',
    'Phone',
    'LinkedIn',
    'Country_based',
  ])
  const personalEmail =
    normalizeNullableString(payload.Personal_Email) || normalizeNullableString(payload.Email)
  const professionalEmail = normalizeNullableString(payload.Professional_Email)
  if (
    !hasMeaningfulValue(payload.Name) &&
    !personalEmail &&
    !professionalEmail &&
    !hasMeaningfulValue(payload.Phone)
  ) {
    return null
  }

  const existing =
    (professionalEmail || personalEmail) &&
    database
      .prepare(
        `
        SELECT id
        FROM Contacts
        WHERE Professional_Email = ? OR Personal_Email = ?
        ORDER BY id DESC
        LIMIT 1
      `,
      )
      .get(professionalEmail || personalEmail, personalEmail || professionalEmail)

  let contactId = normalizeNullableString(payload.id) || existing?.id
  if (!contactId) {
    contactId = `contact:${crypto.randomUUID()}`
    database
      .prepare(
        `
        INSERT INTO Contacts (
          id, Name, Personal_Email, Professional_Email, Phone, LinkedIn, Country_based
        ) VALUES (
          @id, @Name, @Personal_Email, @Professional_Email, @Phone, @LinkedIn, @Country_based
        )
      `,
      )
      .run({
        id: contactId,
        Name: normalizeNullableString(payload.Name),
        Personal_Email: personalEmail,
        Professional_Email: professionalEmail,
        Phone: normalizeNullableString(payload.Phone),
        LinkedIn: normalizeNullableString(payload.LinkedIn),
        Country_based: normalizeNullableString(payload.Country_based),
      })
  } else {
    database
      .prepare(
        `
        UPDATE Contacts SET
          Name = COALESCE(@Name, Name),
          Personal_Email = COALESCE(@Personal_Email, Personal_Email),
          Professional_Email = COALESCE(@Professional_Email, Professional_Email),
          Phone = COALESCE(@Phone, Phone),
          LinkedIn = COALESCE(@LinkedIn, LinkedIn),
          Country_based = COALESCE(@Country_based, Country_based)
        WHERE id = @id
      `,
      )
      .run({
        id: contactId,
        Name: normalizeNullableString(payload.Name),
        Personal_Email: personalEmail,
        Professional_Email: professionalEmail,
        Phone: normalizeNullableString(payload.Phone),
        LinkedIn: normalizeNullableString(payload.LinkedIn),
        Country_based: normalizeNullableString(payload.Country_based),
      })
  }

  const edgeTable =
    kind === 'fund'
      ? 'Contacts_Opportunities_captable_individuals_fund'
      : 'Contacts_Opportunities_captable_individual'
  database
    .prepare(`INSERT OR IGNORE INTO ${edgeTable} (from_id, to_id) VALUES (?, ?)`)
    .run(contactId, opportunityId)
  return contactId
}

// eslint-disable-next-line no-unused-vars
function createNotesForOpportunity(database, opportunityId, notes = []) {
  const rows = Array.isArray(notes) ? notes : []
  for (const note of rows) {
    const noteContent =
      normalizeNullableString(note?.Note_Content) || normalizeNullableString(note?.content)
    if (!noteContent) continue
    const exists = database
      .prepare('SELECT 1 FROM Notes WHERE Note_Content = ? LIMIT 1')
      .get(noteContent)
    if (exists) continue
    database
      .prepare(
        `
        INSERT INTO Notes (
          id, created_by, Note_Name, Note_Content, created_at, updated_at
        ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
      )
      .run(
        normalizeNullableString(note?.id) || `note:${crypto.randomUUID()}`,
        normalizeNullableString(note?.created_by),
        normalizeNullableString(note?.Note_Name) || normalizeNullableString(note?.title),
        noteContent,
      )
  }
}

// eslint-disable-next-line no-unused-vars
function createTasksForOpportunity(database, opportunityId, kind, tasks = []) {
  const rows = Array.isArray(tasks) ? tasks : []
  const edgeTable = kind === 'fund' ? 'Tasks_Funds_related_fund' : 'Tasks_Rounds_related_round'
  for (const task of rows) {
    const taskName = normalizeNullableString(task?.Task_Name)
    if (!taskName) continue
    const exists = database
      .prepare(
        `
        SELECT 1
        FROM Tasks t
        JOIN ${edgeTable} e ON e.from_id = t.id
        WHERE e.to_id = ? AND t.Task_Name = ?
        LIMIT 1
      `,
      )
      .get(opportunityId, taskName)
    if (exists) continue
    const taskId = normalizeNullableString(task?.id) || `task:${crypto.randomUUID()}`
    database
      .prepare(
        `
        INSERT INTO Tasks (id, created_by, Task_Name, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `,
      )
      .run(
        taskId,
        normalizeNullableString(task?.Task_Creator) || normalizeNullableString(task?.created_by),
        taskName,
      )
    upsertTaskOverview(database, taskId, task)
    upsertTaskTeam(database, taskId, task)
    database
      .prepare(`INSERT OR IGNORE INTO ${edgeTable} (from_id, to_id) VALUES (?, ?)`)
      .run(taskId, opportunityId)
  }
}

function createAssistantPromptFromProposal(database, proposal = {}) {
  const systemPrompt = normalizeNullableString(proposal?.system_prompt)
  if (!systemPrompt) return null
  const id =
    normalizeNullableString(proposal?.assistant_system_prompt_id) ||
    `assistant_prompt:${crypto.randomUUID()}`
  const tools = Array.isArray(proposal?.tools) ? proposal.tools : []
  const functions = Array.isArray(proposal?.functions) ? proposal.functions : []
  const contextSources = Array.isArray(proposal?.context_sources) ? proposal.context_sources : []
  const inputContract = JSON.stringify({ tools, functions, context_sources: contextSources })

  database
    .prepare(
      `
      INSERT INTO Assistant_System_Prompts (
        assistant_system_prompt_id, name, version, description, system_prompt, input_contract,
        output_contract, schema_name, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      ON CONFLICT(assistant_system_prompt_id) DO UPDATE SET
        name = excluded.name,
        version = excluded.version,
        description = excluded.description,
        system_prompt = excluded.system_prompt,
        input_contract = excluded.input_contract,
        output_contract = excluded.output_contract,
        schema_name = excluded.schema_name,
        updated_at = datetime('now')
    `,
    )
    .run(
      id,
      normalizeNullableString(proposal?.name) || 'Deal Analyst Assistant',
      normalizeNullableString(proposal?.version) || 'v1',
      normalizeNullableString(proposal?.description),
      systemPrompt,
      inputContract,
      JSON.stringify({ purpose: 'Opportunity ingest populate' }),
      'opportunity_ingest_assistant',
    )

  return id
}

function createRecordHistoryEntry(tableName, recordId, { source = 'create' } = {}) {
  const database = initDb()
  const config = getRecordTableConfig(tableName)
  const rid = normalizeNullableString(recordId)
  if (!rid) throw new Error('recordId is required')
  const actor = getAuditActor(database)
  const snapshotPayload = getRecordView(config.tableName, rid)
  snapshotPayload.__meta = {
    source,
    table_name: config.tableName,
    record_id: rid,
    created_at: new Date().toISOString(),
  }
  const snapshotId = `snapshot:${crypto.randomUUID()}`
  database
    .prepare(
      `
      INSERT INTO databook_snapshots (
        id, table_name, record_id, payload_json, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `,
    )
    .run(
      snapshotId,
      config.tableName,
      rid,
      JSON.stringify(snapshotPayload),
      actor.user_id,
    )
  return snapshotId
}

function createRecordHistoryEntryForOpportunity(opportunityId, options = {}) {
  return createRecordHistoryEntry('Opportunities', opportunityId, options)
}

function createRecordHistoryEntryForFund(fundId, options = {}) {
  return createRecordHistoryEntry('Funds', fundId, options)
}

function createRecordHistoryEntryForRound(roundId, options = {}) {
  return createRecordHistoryEntry('Rounds', roundId, options)
}

function normalizeEntityRaisingStatus(value) {
  const candidate = normalizeNullableString(value)
  if (!candidate) return null

  const normalized = candidate.toLowerCase()
  if (['raising', 'open', 'ongoing', 'active', 'in progress', 'in-progress'].includes(normalized)) {
    return 'Raising'
  }
  if (['raised', 'closed', 'complete', 'completed'].includes(normalized)) {
    return 'Raised'
  }
  if (['abandoned', 'inactive', 'dropped', 'lost'].includes(normalized)) {
    return 'Abandoned'
  }
  return null
}

function normalizeRoundSecurityType(value) {
  const candidate = normalizeNullableString(value)
  if (!candidate) return null

  const normalized = candidate.toLowerCase().replace(/[\s-]+/g, '_')
  const directMap = {
    debt_secured: 'Debt_Secured',
    debt_unsecured: 'Debt_Unsecured',
    debt_structured: 'Debt_Structured',
    equity_common: 'Equity_Common',
    common: 'Equity_Common',
    equity_preferred: 'Equity_Preferred',
    preferred: 'Equity_Preferred',
    equity_safe: 'Equity_SAFE',
    safe: 'Equity_SAFE',
  }

  return directMap[normalized] || null
}

function maybeCreatePrimaryContact(contactPayload = {}) {
  const hasContactData = [
    contactPayload?.Name,
    contactPayload?.Personal_Email,
    contactPayload?.Professional_Email,
    contactPayload?.Phone,
    contactPayload?.LinkedIn,
  ].some(hasMeaningfulValue)
  if (!hasContactData) return null
  return createContact(contactPayload)?.id || null
}

function assertUniqueOpportunityName(database, name, kind) {
  const normalizedName = normalizeNullableString(name)
  if (!normalizedName) throw new Error(`${kind} name is required`)

  const existingRound = database
    .prepare('SELECT id FROM Rounds WHERE lower(Round_Name) = lower(?) LIMIT 1')
    .get(normalizedName)
  if (existingRound?.id) throw new Error(`Opportunity name already exists: ${normalizedName}`)

  const existingFund = database
    .prepare('SELECT id FROM Funds WHERE lower(Fund_Name) = lower(?) LIMIT 1')
    .get(normalizedName)
  if (existingFund?.id) throw new Error(`Opportunity name already exists: ${normalizedName}`)
}

function resolveUniqueOpportunityName(database, name, kind) {
  const normalizedName = normalizeNullableString(name)
  if (!normalizedName) throw new Error(`${kind} name is required`)

  try {
    assertUniqueOpportunityName(database, normalizedName, kind)
    return normalizedName
  } catch (error) {
    const message = String(error?.message || '')
    const autoPattern = /^New\s+.*#\d+$/i
    if (!autoPattern.test(normalizedName)) {
      throw error
    }
    const match = normalizedName.match(/^(.*#)(\d+)$/)
    const base = match ? match[1] : `${normalizedName} #`
    const start = match ? Number(match[2]) : 1
    for (let counter = start + 1; counter < start + 200; counter += 1) {
      const candidate = `${base}${counter}`
      try {
        assertUniqueOpportunityName(database, candidate, kind)
        return candidate
      } catch {
        // keep searching
      }
    }
    throw new Error(message || `Opportunity name already exists: ${normalizedName}`)
  }
}

function createFund(payload = {}) {
  const database = initDb()
  const actor = getAuditActor(database, { requireUser: true })

  if (payload?.company) {
    createCompany(payload.company)
  }

  const primaryContactId = maybeCreatePrimaryContact(payload.primary_contact)
  const fundId = normalizeNullableString(payload?.id) || `fund:${crypto.randomUUID()}`
  const fundName =
    normalizeNullableString(payload?.Fund_Name) ||
    normalizeNullableString(payload?.Venture_Oppty_Name) ||
    normalizeNullableString(payload?.company?.Company_Name) ||
    normalizeNullableString(payload?.primary_contact?.Name) ||
    fundId
  const uniqueFundName = resolveUniqueOpportunityName(database, fundName, 'Fund')
  const statusValue = resolveRecordStatus(payload, 'Draft')

  const tx = database.transaction(() => {
    database
      .prepare(
        `
        INSERT INTO Funds (id, Fund_Name, Status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
      )
      .run(fundId, uniqueFundName, statusValue, actor.user_id)

    database
      .prepare(
        `
        INSERT INTO Fund_Overview (
          fund_id, Fund_Raising_Status, Fund_Target_Size, Fund_Commited_Amounts,
          Fund_Close_Date, Fund_Summary, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
      )
      .run(
        fundId,
        normalizeEntityRaisingStatus(payload?.Raising_Status),
        normalizeNullableNumber(payload?.Investment_Ask) ?? normalizeNullableNumber(payload?.Round_Amount),
        normalizeNullableNumber(payload?.Hard_Commits),
        normalizeNullableString(payload?.Final_Close_Date),
        normalizeNullableString(payload?.company?.One_Liner),
      )

    if (primaryContactId) {
      database
        .prepare(
          `
          INSERT OR IGNORE INTO Fund_Overview_Managers (fund_id, contact_id)
          VALUES (?, ?)
        `,
        )
        .run(fundId, primaryContactId)
    }
  })

  tx()
  const snapshotId = createRecordHistoryEntryForFund(fundId, { source: 'fund_create' })
  return { id: fundId, snapshot_id: snapshotId }
}

function createRound(payload = {}) {
  const database = initDb()
  const actor = getAuditActor(database, { requireUser: true })

  let companyId = ensureExistingCompanyId(database, payload.company_id)
  if (!companyId && payload?.company) {
    companyId = createCompany(payload.company)?.id || null
  }
  if (!companyId) {
    companyId = null
  }

  maybeCreatePrimaryContact(payload.primary_contact)
  const roundId = normalizeNullableString(payload?.id) || `round:${crypto.randomUUID()}`
  const roundName =
    normalizeNullableString(payload?.Round_Name) ||
    normalizeNullableString(payload?.Venture_Oppty_Name) ||
    normalizeNullableString(payload?.company?.Company_Name) ||
    roundId
  const uniqueRoundName = resolveUniqueOpportunityName(database, roundName, 'Round')
  const statusValue = resolveRecordStatus(payload, 'Draft')

  const tx = database.transaction(() => {
    database
      .prepare(
        `
        INSERT INTO Rounds (id, Round_Name, Status, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
      )
      .run(roundId, uniqueRoundName, statusValue, actor.user_id)

    database
      .prepare(
        `
        INSERT INTO Round_Overview (
          round_id, sponsor_company_id, Round_Raising_Status, Security_Type,
          Round_Target_Size, Round_Commited_Amounts, Round_Close_Date, Round_Summary,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
      )
      .run(
        roundId,
        companyId,
        normalizeEntityRaisingStatus(payload?.Raising_Status),
        normalizeRoundSecurityType(payload?.Type_of_Security),
        normalizeNullableNumber(payload?.Round_Amount) ?? normalizeNullableNumber(payload?.Investment_Ask),
        normalizeNullableNumber(payload?.Hard_Commits),
        normalizeNullableString(payload?.Final_Close_Date),
        normalizeNullableString(payload?.company?.One_Liner),
      )

    if (
      hasMeaningfulValue(payload?.Pre_Valuation) ||
      hasMeaningfulValue(payload?.Post_Valuation) ||
      hasMeaningfulValue(payload?.Previous_Post)
    ) {
      database
        .prepare(
          `
          INSERT INTO Round_Economics (
            round_id, Round_Pre_Valuation, Round_Post_Valuation, Round_Previous_Post_Valuation,
            created_at, updated_at
          )
          VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        `,
        )
        .run(
          roundId,
          normalizeNullableNumber(payload?.Pre_Valuation),
          normalizeNullableNumber(payload?.Post_Valuation),
          normalizeNullableNumber(payload?.Previous_Post),
        )
    }
  })

  tx()
  const snapshotId = createRecordHistoryEntryForRound(roundId, { source: 'round_create' })
  return { id: roundId, snapshot_id: snapshotId }
}

function ensureExistingCompanyId(database, maybeCompanyId) {
  const companyId = normalizeNullableIntegerId(maybeCompanyId)
  if (!companyId) return null
  const exists = database.prepare('SELECT 1 FROM Companies WHERE id = ? LIMIT 1').get(companyId)
  return exists ? companyId : null
}

function buildOpportunityForeignKeyDebug(database, { companyId = null, kind = null } = {}) {
  const cid = normalizeNullableString(companyId)
  const companyExists = cid
    ? Boolean(database.prepare('SELECT 1 FROM Companies WHERE id = ? LIMIT 1').get(cid))
    : null
  return {
    kind: normalizeNullableString(kind),
    company_id: cid,
    company_exists: companyExists,
  }
}

function runCreateStep(label, fn) {
  try {
    return fn()
  } catch (e) {
    throw new Error(`[${label}] ${e?.message || String(e)}`)
  }
}

function createOpportunity(payload = {}) {
  const database = initDb()

  let companyId = ensureExistingCompanyId(database, payload.company_id)
  const primaryContactName = normalizeNullableString(payload?.primary_contact?.Name)
  if (!companyId && payload?.company) {
    companyId = upsertCompanyFromAutofill(database, payload.company, companyId)
  } else if (companyId && payload?.company) {
    upsertCompanyFromAutofill(database, payload.company, companyId)
  }
  const explicitKind = normalizeOpportunityKind(payload.kind)
  const isAssetManager = companyIsAssetManager(database, companyId)
  const kind = isAssetManager ? 'fund' : explicitKind || 'round'
  if (!companyId && !primaryContactName) {
    throw new Error('Provide either Company name or Contact name')
  }
  if (!companyId && primaryContactName) {
    const autoCompanyName =
      normalizeNullableString(payload?.company?.Company_Name) || primaryContactName
    companyId = upsertCompanyFromAutofill(
      database,
      {
        ...(payload?.company || {}),
        Company_Name: autoCompanyName,
        Company_Type: normalizeNullableString(payload?.company?.Company_Type) || 'Other',
      },
      companyId,
    )
  }

  const opportunityId = normalizeNullableString(payload.id) || `opportunity:${crypto.randomUUID()}`

  const derivedOpportunityName = deriveOpportunityName(database, {
    companyId,
    companyName: normalizeNullableString(payload?.company?.Company_Name),
    contactName: primaryContactName,
    fundingSeries: normalizeNullableString(payload.Round_Stage),
  })
  const statusValue = resolveRecordStatus(payload, 'Draft')

  const fields = {
    id: opportunityId,
    kind,
    company_id: companyId,
    Venture_Oppty_Name: derivedOpportunityName || opportunityId,
    Status: statusValue,
    Round_Stage: normalizeNullableString(payload.Round_Stage),
    Type_of_Security: normalizeNullableString(payload.Type_of_Security),
    Investment_Ask: normalizeNullableNumber(payload.Investment_Ask),
    Round_Amount: normalizeNullableNumber(payload.Round_Amount),
    Hard_Commits: normalizeNullableNumber(payload.Hard_Commits),
    Soft_Commits: normalizeNullableNumber(payload.Soft_Commits),
    Pre_Valuation: normalizeNullableNumber(payload.Pre_Valuation),
    Post_Valuation: normalizeNullableNumber(payload.Post_Valuation),
    Previous_Post: normalizeNullableNumber(payload.Previous_Post),
    First_Close_Date: normalizeNullableString(payload.First_Close_Date),
    Next_Close_Date: normalizeNullableString(payload.Next_Close_Date),
    Final_Close_Date: normalizeNullableString(payload.Final_Close_Date),
    Raising_Status: normalizeNullableString(payload.Raising_Status),
    Board_Seats: normalizeNullableString(payload.Board_Seats),
    Information_Rights: normalizeNullableString(payload.Information_Rights),
    Voting_Rights: normalizeNullableString(payload.Voting_Rights),
    Liquidation_Preference: normalizeNullableString(payload.Liquidation_Preference),
    Anti_Dilution_Provisions: normalizeNullableString(payload.Anti_Dilution_Provisions),
    Conversion_Features: normalizeNullableString(payload.Conversion_Features),
    Most_Favored_Nation: normalizeNullableString(payload.Most_Favored_Nation),
    ROFO_ROR: normalizeNullableString(payload.ROFO_ROR),
    Co_Sale_Right: normalizeNullableString(payload.Co_Sale_Right),
    Tag_Drag_Along: normalizeNullableString(payload.Tag_Drag_Along),
    Put_Option: normalizeNullableString(payload.Put_Option),
    Over_Allotment_Option: normalizeNullableString(payload.Over_Allotment_Option),
    Stacked_Series: normalizeNullableString(payload.Stacked_Series),
  }

  const insert = database.transaction(() => {
    const columns = Object.keys(fields)
    const placeholders = columns.map(() => '?').join(',')
    const values = columns.map((c) => fields[c])

    runCreateStep('insert opportunity', () => {
      database
        .prepare(`INSERT INTO Opportunities (${columns.join(',')}) VALUES (${placeholders})`)
        .run(values)
    })

    if (kind === 'fund') {
      runCreateStep('upsert fund subtype', () => {
        upsertFundSubtype(database, opportunityId, payload)
      })
    }

    runCreateStep('upsert primary contact link', () => {
      createOrUpdatePrimaryContactForOpportunity(
        database,
        opportunityId,
        kind,
        payload.primary_contact,
      )
    })
    // Temporarily disabled: skip LLM-generated notes/tasks creation during ingestion.
    // runCreateStep('create opportunity notes', () => {
    //   createNotesForOpportunity(database, opportunityId, payload.notes)
    // })
    // runCreateStep('create opportunity tasks', () => {
    //   createTasksForOpportunity(database, opportunityId, kind, payload.tasks)
    // })
    runCreateStep('create assistant prompt', () => {
      createAssistantPromptFromProposal(database, payload.assistant)
    })
  })

  try {
    insert()
  } catch (e) {
    const message = String(e?.message || e || '')
    if (message.includes('FOREIGN KEY constraint failed')) {
      const debug = buildOpportunityForeignKeyDebug(database, { companyId, kind })
      throw new Error(
        `FOREIGN KEY constraint failed while creating opportunity. Debug: ${JSON.stringify(debug)}`,
      )
    }
    throw e
  }

  const snapshotId = createRecordHistoryEntryForOpportunity(opportunityId, {
    source: 'autofill_create',
  })
  return { id: opportunityId, snapshot_id: snapshotId }
}

function updateOpportunity(payload = {}) {
  const database = initDb()
  const opportunityId = normalizeNullableString(payload?.id)
  if (!opportunityId) throw new Error('id is required')
  const existing = database
    .prepare('SELECT id FROM Opportunities WHERE id = ? LIMIT 1')
    .get(opportunityId)
  if (!existing) throw new Error(`Opportunity not found: ${opportunityId}`)

  let companyId = ensureExistingCompanyId(database, payload.company_id)
  const primaryContactName = normalizeNullableString(payload?.primary_contact?.Name)
  if (!companyId && payload?.company) {
    companyId = upsertCompanyFromAutofill(database, payload.company, companyId)
  } else if (companyId && payload?.company) {
    upsertCompanyFromAutofill(database, payload.company, companyId)
  }
  const explicitKind = normalizeOpportunityKind(payload.kind)
  const isAssetManager = companyIsAssetManager(database, companyId)
  const kind = isAssetManager ? 'fund' : explicitKind || 'round'
  if (!companyId && !primaryContactName) {
    throw new Error('Provide either Company name or Contact name')
  }
  if (!companyId && primaryContactName) {
    const autoCompanyName =
      normalizeNullableString(payload?.company?.Company_Name) || primaryContactName
    companyId = upsertCompanyFromAutofill(
      database,
      {
        ...(payload?.company || {}),
        Company_Name: autoCompanyName,
        Company_Type: normalizeNullableString(payload?.company?.Company_Type) || 'Other',
      },
      companyId,
    )
  }

  const derivedOpportunityName = deriveOpportunityName(database, {
    companyId,
    companyName: normalizeNullableString(payload?.company?.Company_Name),
    contactName: primaryContactName,
    fundingSeries: normalizeNullableString(payload.Round_Stage),
  })
  const statusValue = resolveRecordStatus(payload, null)

  const fields = {
    id: opportunityId,
    kind,
    company_id: companyId,
    Venture_Oppty_Name: derivedOpportunityName || opportunityId,
    Status: statusValue,
    Round_Stage: normalizeNullableString(payload.Round_Stage),
    Type_of_Security: normalizeNullableString(payload.Type_of_Security),
    Investment_Ask: normalizeNullableNumber(payload.Investment_Ask),
    Round_Amount: normalizeNullableNumber(payload.Round_Amount),
    Hard_Commits: normalizeNullableNumber(payload.Hard_Commits),
    Soft_Commits: normalizeNullableNumber(payload.Soft_Commits),
    Pre_Valuation: normalizeNullableNumber(payload.Pre_Valuation),
    Post_Valuation: normalizeNullableNumber(payload.Post_Valuation),
    Previous_Post: normalizeNullableNumber(payload.Previous_Post),
    First_Close_Date: normalizeNullableString(payload.First_Close_Date),
    Next_Close_Date: normalizeNullableString(payload.Next_Close_Date),
    Final_Close_Date: normalizeNullableString(payload.Final_Close_Date),
    Raising_Status: normalizeNullableString(payload.Raising_Status),
    Board_Seats: normalizeNullableString(payload.Board_Seats),
    Information_Rights: normalizeNullableString(payload.Information_Rights),
    Voting_Rights: normalizeNullableString(payload.Voting_Rights),
    Liquidation_Preference: normalizeNullableString(payload.Liquidation_Preference),
    Anti_Dilution_Provisions: normalizeNullableString(payload.Anti_Dilution_Provisions),
    Conversion_Features: normalizeNullableString(payload.Conversion_Features),
    Most_Favored_Nation: normalizeNullableString(payload.Most_Favored_Nation),
    ROFO_ROR: normalizeNullableString(payload.ROFO_ROR),
    Co_Sale_Right: normalizeNullableString(payload.Co_Sale_Right),
    Tag_Drag_Along: normalizeNullableString(payload.Tag_Drag_Along),
    Put_Option: normalizeNullableString(payload.Put_Option),
    Over_Allotment_Option: normalizeNullableString(payload.Over_Allotment_Option),
    Stacked_Series: normalizeNullableString(payload.Stacked_Series),
  }

  const tx = database.transaction(() => {
    runCreateStep('update opportunity', () => {
      database
        .prepare(
          `
          UPDATE Opportunities SET
            kind = @kind,
            company_id = @company_id,
            Venture_Oppty_Name = @Venture_Oppty_Name,
            Status = COALESCE(@Status, Status),
            Round_Stage = @Round_Stage,
            Type_of_Security = @Type_of_Security,
            Investment_Ask = @Investment_Ask,
            Round_Amount = @Round_Amount,
            Hard_Commits = @Hard_Commits,
            Soft_Commits = @Soft_Commits,
            Pre_Valuation = @Pre_Valuation,
            Post_Valuation = @Post_Valuation,
            Previous_Post = @Previous_Post,
            First_Close_Date = @First_Close_Date,
            Next_Close_Date = @Next_Close_Date,
            Final_Close_Date = @Final_Close_Date,
            Raising_Status = @Raising_Status,
            Board_Seats = @Board_Seats,
            Information_Rights = @Information_Rights,
            Voting_Rights = @Voting_Rights,
            Liquidation_Preference = @Liquidation_Preference,
            Anti_Dilution_Provisions = @Anti_Dilution_Provisions,
            Conversion_Features = @Conversion_Features,
            Most_Favored_Nation = @Most_Favored_Nation,
            ROFO_ROR = @ROFO_ROR,
            Co_Sale_Right = @Co_Sale_Right,
            Tag_Drag_Along = @Tag_Drag_Along,
            Put_Option = @Put_Option,
            Over_Allotment_Option = @Over_Allotment_Option,
            Stacked_Series = @Stacked_Series,
            updated_at = datetime('now')
          WHERE id = @id
        `,
        )
        .run(fields)
    })

    if (kind === 'fund') {
      runCreateStep('upsert fund subtype', () => {
        upsertFundSubtype(database, opportunityId, payload)
      })
    }

    runCreateStep('upsert primary contact link', () => {
      createOrUpdatePrimaryContactForOpportunity(
        database,
        opportunityId,
        kind,
        payload.primary_contact,
      )
    })
    // Temporarily disabled: skip LLM-generated notes/tasks creation during ingestion.
    // runCreateStep('create opportunity notes', () => {
    //   createNotesForOpportunity(database, opportunityId, payload.notes)
    // })
    // runCreateStep('create opportunity tasks', () => {
    //   createTasksForOpportunity(database, opportunityId, kind, payload.tasks)
    // })
    runCreateStep('create assistant prompt', () => {
      createAssistantPromptFromProposal(database, payload.assistant)
    })
  })
  try {
    tx()
  } catch (e) {
    const message = String(e?.message || e || '')
    if (message.includes('FOREIGN KEY constraint failed')) {
      const debug = buildOpportunityForeignKeyDebug(database, { companyId, kind })
      throw new Error(
        `FOREIGN KEY constraint failed while updating opportunity ${opportunityId}. Debug: ${JSON.stringify(debug)}`,
      )
    }
    throw e
  }

  const snapshotId = createRecordHistoryEntryForOpportunity(opportunityId, {
    source: 'autofill_update',
  })
  return { id: opportunityId, snapshot_id: snapshotId }
}

function upsertOpportunities(rows = []) {
  const database = initDb()
  const input = Array.isArray(rows) ? rows : []

  const tx = database.transaction(() => {
    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const r of input) {
      const companyIdFromRow = normalizeNullableIntegerId(r?.company_id)
      const companyNameFromRow = normalizeNullableString(r?.Company_Name)

      let companyId = companyIdFromRow
      if (!companyId && companyNameFromRow) {
        const existing = database
          .prepare('SELECT id FROM Companies WHERE Company_Name = ? LIMIT 1')
          .get(companyNameFromRow)
        companyId = existing?.id
        if (!companyId) {
          companyId = createCompany({
            Company_Name: companyNameFromRow,
            Company_Type: 'Other',
          }).id
        }
      }

      const opportunityId = normalizeNullableString(r?.id) || `opportunity:${crypto.randomUUID()}`
      const explicitKind = normalizeOpportunityKind(r?.kind || r?.Opportunity_Kind)
      const isAssetManager = companyIsAssetManager(database, companyId)
      const kind = isAssetManager ? 'fund' : explicitKind || 'round'

      if (!companyId && kind === 'round') {
        skipped++
        continue
      }

      const payload = {
        id: opportunityId,
        kind,
        company_id: companyId,
        Venture_Oppty_Name:
          deriveOpportunityName(database, {
            companyId,
            companyName: companyNameFromRow,
            contactName: normalizeNullableString(r?.primary_contact_name),
            fundingSeries: normalizeNullableString(r?.Round_Stage),
          }) || opportunityId,
        Round_Stage: normalizeNullableString(r?.Round_Stage),
        Type_of_Security: normalizeNullableString(r?.Type_of_Security),
        Investment_Ask: normalizeNullableNumber(r?.Investment_Ask),
        Round_Amount: normalizeNullableNumber(r?.Round_Amount),
        Hard_Commits: normalizeNullableNumber(r?.Hard_Commits),
        Soft_Commits: normalizeNullableNumber(r?.Soft_Commits),
        Pre_Valuation: normalizeNullableNumber(r?.Pre_Valuation),
        Post_Valuation: normalizeNullableNumber(r?.Post_Valuation),
        Previous_Post: normalizeNullableNumber(r?.Previous_Post),
        First_Close_Date: normalizeNullableString(r?.First_Close_Date),
        Next_Close_Date: normalizeNullableString(r?.Next_Close_Date),
        Final_Close_Date: normalizeNullableString(r?.Final_Close_Date),
        Raising_Status: normalizeNullableString(r?.Raising_Status),
        Board_Seats: normalizeNullableString(r?.Board_Seats),
        Information_Rights: normalizeNullableString(r?.Information_Rights),
        Voting_Rights: normalizeNullableString(r?.Voting_Rights),
        Liquidation_Preference: normalizeNullableString(r?.Liquidation_Preference),
        Anti_Dilution_Provisions: normalizeNullableString(r?.Anti_Dilution_Provisions),
        Conversion_Features: normalizeNullableString(r?.Conversion_Features),
        Most_Favored_Nation: normalizeNullableString(r?.Most_Favored_Nation),
        ROFO_ROR: normalizeNullableString(r?.ROFO_ROR),
        Co_Sale_Right: normalizeNullableString(r?.Co_Sale_Right),
        Tag_Drag_Along: normalizeNullableString(r?.Tag_Drag_Along),
        Put_Option: normalizeNullableString(r?.Put_Option),
        Over_Allotment_Option: normalizeNullableString(r?.Over_Allotment_Option),
        Stacked_Series: normalizeNullableString(r?.Stacked_Series),
      }

      const exists = database
        .prepare('SELECT 1 FROM Opportunities WHERE id = ? LIMIT 1')
        .get(opportunityId)

      database
        .prepare(
          `
          INSERT INTO Opportunities (
            id, kind, company_id, Venture_Oppty_Name, Round_Stage, Type_of_Security,
            Investment_Ask, Round_Amount, Hard_Commits, Soft_Commits,
            Pre_Valuation, Post_Valuation, Previous_Post,
            First_Close_Date, Next_Close_Date, Final_Close_Date,
            Raising_Status,
            Board_Seats, Information_Rights, Voting_Rights,
            Liquidation_Preference, Anti_Dilution_Provisions, Conversion_Features,
            Most_Favored_Nation, ROFO_ROR, Co_Sale_Right, Tag_Drag_Along,
            Put_Option, Over_Allotment_Option, Stacked_Series
          )
          VALUES (
            @id, @kind, @company_id, @Venture_Oppty_Name, @Round_Stage, @Type_of_Security,
            @Investment_Ask, @Round_Amount, @Hard_Commits, @Soft_Commits,
            @Pre_Valuation, @Post_Valuation, @Previous_Post,
            @First_Close_Date, @Next_Close_Date, @Final_Close_Date,
            @Raising_Status,
            @Board_Seats, @Information_Rights, @Voting_Rights,
            @Liquidation_Preference, @Anti_Dilution_Provisions, @Conversion_Features,
            @Most_Favored_Nation, @ROFO_ROR, @Co_Sale_Right, @Tag_Drag_Along,
            @Put_Option, @Over_Allotment_Option, @Stacked_Series
          )
          ON CONFLICT(id) DO UPDATE SET
            kind = excluded.kind,
            company_id = excluded.company_id,
            Venture_Oppty_Name = COALESCE(excluded.Venture_Oppty_Name, Opportunities.Venture_Oppty_Name),
            Round_Stage = excluded.Round_Stage,
            Type_of_Security = excluded.Type_of_Security,
            Investment_Ask = excluded.Investment_Ask,
            Round_Amount = excluded.Round_Amount,
            Hard_Commits = excluded.Hard_Commits,
            Soft_Commits = excluded.Soft_Commits,
            Pre_Valuation = excluded.Pre_Valuation,
            Post_Valuation = excluded.Post_Valuation,
            Previous_Post = excluded.Previous_Post,
            First_Close_Date = excluded.First_Close_Date,
            Next_Close_Date = excluded.Next_Close_Date,
            Final_Close_Date = excluded.Final_Close_Date,
            Raising_Status = excluded.Raising_Status,
            Board_Seats = excluded.Board_Seats,
            Information_Rights = excluded.Information_Rights,
            Voting_Rights = excluded.Voting_Rights,
            Liquidation_Preference = excluded.Liquidation_Preference,
            Anti_Dilution_Provisions = excluded.Anti_Dilution_Provisions,
            Conversion_Features = excluded.Conversion_Features,
            Most_Favored_Nation = excluded.Most_Favored_Nation,
            ROFO_ROR = excluded.ROFO_ROR,
            Co_Sale_Right = excluded.Co_Sale_Right,
            Tag_Drag_Along = excluded.Tag_Drag_Along,
            Put_Option = excluded.Put_Option,
            Over_Allotment_Option = excluded.Over_Allotment_Option,
            Stacked_Series = excluded.Stacked_Series,
            updated_at = datetime('now')
        `,
        )
        .run(payload)

      if (kind === 'fund') {
        upsertFundSubtype(database, opportunityId, r)
      }

      if (exists) updated++
      else inserted++
    }

    return { inserted, updated, skipped }
  })

  return tx()
}

function registerIpc() {
  ipcMain.handle('fs:homedir', () => os.homedir())

  ipcMain.handle('fs:readdir', async (_event, dirPath) => {
    const resolvedPath = path.resolve(String(dirPath || ''))
    const workspace = await ensureWorkspace()
    const workspaceRootPath = path.resolve(workspace.rootPath)
    const userWorkspacePath = path.resolve(path.join(workspace.rootPath, USER_WORKSPACE_DIR))
    const networkDatabasesPath = path.resolve(getNetworkDatabasesPath(workspace.rootPath))

    const dirents = await fs.readdir(resolvedPath, { withFileTypes: true })
    let sortOrder = null
    if (resolvedPath === workspaceRootPath) {
      sortOrder = new Map([[USER_WORKSPACE_DIR, 0]])
    } else if (resolvedPath === userWorkspacePath) {
      sortOrder = new Map([[NETWORK_DATABASES_DIR, 0]])
    } else if (resolvedPath === networkDatabasesPath) {
      sortOrder = new Map(NETWORK_DATABASE_SECTION_DIRS.map((name, index) => [name, index]))
    }

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
      .sort((a, b) => compareWorkspaceEntries(a, b, sortOrder))

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
    await syncWorkspaceWorkbooksSafe(result.rootPath)
    return { rootPath: result.rootPath }
  })

  ipcMain.handle('workspace:setRoot', async (_event, { rootPath } = {}) => {
    const database = initDb()
    const normalized = normalizeNullableString(rootPath)
    setAppSetting(database, APP_SETTING_KEYS.workspaceRoot, normalized || null)
    const result = await ensureWorkspace()
    await syncWorkspaceWorkbooksSafe(result.rootPath)
    return { rootPath: result.rootPath }
  })

  ipcMain.handle('workspace:openRoot', async () => {
    const result = await ensureWorkspace()
    await shell.openPath(result.rootPath)
    return { rootPath: result.rootPath }
  })

  ipcMain.handle('docs:read', async (_event, { relativePath } = {}) => {
    const resolvedPath = resolveRepoMarkdownPath(relativePath)
    const content = await fs.readFile(resolvedPath, 'utf8')
    return {
      relativePath: path.relative(repoRootPath, resolvedPath).replace(/\\/g, '/'),
      content,
    }
  })

  ipcMain.handle('docs:write', async (_event, { relativePath, content } = {}) => {
    const resolvedPath = resolveRepoMarkdownPath(relativePath)
    await fs.writeFile(resolvedPath, String(content ?? ''), 'utf8')
    return {
      relativePath: path.relative(repoRootPath, resolvedPath).replace(/\\/g, '/'),
      saved: true,
    }
  })

  ipcMain.handle('settings:get', async () => {
    const database = initDb()
    return getSettingsPayload(database)
  })

  ipcMain.handle('settings:set', async (_event, payload = {}) => {
    return setApiSettings(payload)
  })

  ipcMain.handle('user-settings:get', async () => {
    const database = initDb()
    return getUserSettingsPayload(database)
  })

  ipcMain.handle('user-settings:set', async (_event, payload = {}) => {
    const result = setUserSettings(payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('autofill:previewFromFiles', async (_event, payload = {}) => {
    const database = initDb()
    const apiSettings = getApiSettings(database)
    const existingCompanies = listCompanies()
    const existingContacts = listContacts()
    const existingRounds = listRounds()
    const existingFunds = listFunds()
    const emitStatus = (status) => {
      try {
        _event?.sender?.send?.('autofill:preview:status', status)
      } catch {
        // ignore
      }
    }
    return previewAutofillFromFiles({
      filePaths: payload?.filePaths || [],
      apiKeys: { gemini: apiSettings.geminiApiKey },
      existingCompanies,
      existingContacts,
      existingRounds,
      existingFunds,
      emitStatus,
      context: payload?.context || {},
    })
  })

  ipcMain.handle('projects:list', async () => {
    initDb()
    return { projects: listProjects() }
  })

  ipcMain.handle('projects:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    const result = upsertProjects(rows)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('projects:create', async (_event, payload) => {
    initDb()
    const result = createProject(payload)
    auditCreatedRecord('Projects', result, payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('projects:delete', async (_event, { projectId } = {}) => {
    initDb()
    const pid = String(projectId || '')
    if (!pid) throw new Error('projectId is required')
    auditDeletedRecord('Projects', pid)
    const result = deleteRow('Projects', 'id', pid)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('events:list', async (_event, { limit } = {}) => {
    initDb()
    return { events: listEventRows(limit) }
  })

  ipcMain.handle('history:list', async (_event, { limit } = {}) => {
    initDb()
    return { events: listEventRows(limit) }
  })

  ipcMain.handle('file-system:list', async () => {
    initDb()
    return listFiles()
  })

  ipcMain.handle('file-system:create', async (_event, payload = {}) => {
    initDb()
    const result = createFile(payload)
    auditCreatedRecord('Files', result, payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('file-system:delete', async (_event, { fileId } = {}) => {
    initDb()
    auditDeletedRecord('Files', String(fileId || ''))
    const result = deleteRow('Files', 'id', String(fileId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('events:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createEvent(payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'events'))
    }
  })

  ipcMain.handle('history:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createEvent(payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'history'))
    }
  })

  ipcMain.handle('events:delete', async (_event, { eventId } = {}) => {
    initDb()
    const result = deleteRow('events', 'id', String(eventId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('history:delete', async (_event, { historyId } = {}) => {
    initDb()
    const result = deleteRow('events', 'id', String(historyId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('companies:list', async () => {
    initDb()
    return { companies: listCompanies() }
  })

  ipcMain.handle('companies:create', async (_event, payload) => {
    initDb()
    const result = createCompany(payload)
    auditCreatedRecord('Companies', result, payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('companies:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    const result = upsertCompanies(rows)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('companies:delete', async (_event, { companyId } = {}) => {
    initDb()
    auditDeletedRecord('Companies', String(companyId || ''))
    const result = deleteRow('Companies', 'id', String(companyId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('funds:list', async () => {
    initDb()
    return { funds: listFunds() }
  })

  ipcMain.handle('funds:create', async (_event, payload = {}) => {
    initDb()
    const result = createFund(payload)
    auditCreatedRecord('Funds', result, payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('funds:delete', async (_event, { fundId } = {}) => {
    initDb()
    auditDeletedRecord('Funds', String(fundId || ''))
    const result = deleteRow('Funds', 'id', String(fundId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('rounds:list', async () => {
    initDb()
    return { rounds: listRounds() }
  })

  ipcMain.handle('rounds:create', async (_event, payload = {}) => {
    initDb()
    const result = createRound(payload)
    auditCreatedRecord('Rounds', result, payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('rounds:delete', async (_event, { roundId } = {}) => {
    initDb()
    auditDeletedRecord('Rounds', String(roundId || ''))
    const result = deleteRow('Rounds', 'id', String(roundId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('opportunities:list', async () => {
    initDb()
    return { opportunities: listOpportunities() }
  })

  ipcMain.handle('opportunities:create', async (_event, payload) => {
    initDb()
    const result = createOpportunity(payload)
    auditCreatedRecord('Opportunities', result, payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })
  ipcMain.handle('opportunities:update', async (_event, payload) => {
    initDb()
    const result = updateOpportunity(payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('opportunities:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    const result = upsertOpportunities(rows)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('opportunities:delete', async (_event, { opportunityId } = {}) => {
    initDb()
    auditDeletedRecord('Opportunities', String(opportunityId || ''))
    const result = deleteOpportunityRow(opportunityId)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('databooks:view', async (_event, { tableName, recordId } = {}) => {
    initDb()
    return getRecordView(tableName, recordId)
  })

  ipcMain.handle('records:view', async (_event, { tableName, recordId } = {}) => {
    initDb()
    return getRecordView(tableName, recordId)
  })

  ipcMain.handle('databooks:versions', async (_event, { tableName, recordId } = {}) => {
    initDb()
    return { versions: listRecordHistoryEntries(tableName, recordId) }
  })

  ipcMain.handle('records:history', async (_event, { tableName, recordId } = {}) => {
    initDb()
    return { versions: listRecordHistoryEntries(tableName, recordId) }
  })

  ipcMain.handle('databooks:viewSnapshot', async (_event, { snapshotId } = {}) => {
    initDb()
    return getRecordHistoryEntry(snapshotId)
  })

  ipcMain.handle('records:viewHistoryEntry', async (_event, { snapshotId } = {}) => {
    initDb()
    return getRecordHistoryEntry(snapshotId)
  })

  ipcMain.handle(
    'databooks:update',
    async (_event, { tableName, recordId, changes, actionId, actionLabel } = {}) => {
      initDb()
      try {
        const config = getRecordTableConfig(tableName)
        const rid = normalizeNullableString(recordId)
        if (!rid) throw new Error('recordId is required')
        const normalizedActionLabel = normalizeLifecycleActionLabel(actionLabel || 'modified')
        const result = applyAuditedChanges(changes, {
          createRecordHistoryFor: { tableName: config.tableName, recordId: rid },
          actionId: normalizeNullableString(actionId),
          actionLabel: normalizedActionLabel,
        })
        await syncWorkspaceWorkbooksSafe()
        return {
          ...result,
          view: getRecordView(config.tableName, rid),
        }
      } catch (e) {
        console.error('databooks:update failed:', e)
        throw new Error(sanitizeRecordUpdateError(e))
      }
    },
  )

  ipcMain.handle(
    'records:update',
    async (_event, { tableName, recordId, changes, actionId, actionLabel } = {}) => {
      initDb()
      try {
        const config = getRecordTableConfig(tableName)
        const rid = normalizeNullableString(recordId)
        if (!rid) throw new Error('recordId is required')
        const normalizedActionLabel = normalizeLifecycleActionLabel(actionLabel || 'modified')
        const result = applyAuditedChanges(changes, {
          createRecordHistoryFor: { tableName: config.tableName, recordId: rid },
          actionId: normalizeNullableString(actionId),
          actionLabel: normalizedActionLabel,
        })
        await syncWorkspaceWorkbooksSafe()
        return {
          ...result,
          view: getRecordView(config.tableName, rid),
        }
      } catch (e) {
        console.error('records:update failed:', e)
        throw new Error(sanitizeRecordUpdateError(e))
      }
    },
  )

  ipcMain.handle('verification:list', async (_event, { tableName, recordId } = {}) => {
    initDb()
    return {
      fields: listFieldVerificationMetadata({ tableName, recordId }),
    }
  })

  ipcMain.handle(
    'verification:upsert',
    async (_event, { tableName, recordId, fieldName, state, source, confidence, actionId, actionLabel } = {}) => {
      initDb()
      return upsertFieldVerificationMetadata({
        tableName,
        recordId,
        fieldName,
        state,
        source,
        confidence,
        actionId,
        actionLabel,
      })
    },
  )

  ipcMain.handle('audit:me', async () => {
    const database = initDb()
    return getAuditActor(database)
  })

  ipcMain.handle('audit:setUserLabel', async (_event, { userLabel } = {}) => {
    initDb()
    return setAuditUserLabel(userLabel)
  })

  ipcMain.handle('audit:events', async (_event, filters = {}) => {
    initDb()
    return { events: listEvents(filters) }
  })

  ipcMain.handle('audit:history', async (_event, filters = {}) => {
    initDb()
    return { events: listEvents(filters) }
  })

  ipcMain.handle('links:openExternal', async (_event, { url } = {}) => {
    const target = String(url || '').trim()
    if (!target) return false
    await shell.openExternal(target)
    return true
  })

  ipcMain.handle('contacts:list', async () => {
    initDb()
    return { contacts: listContacts() }
  })

  ipcMain.handle('users:list', async () => {
    initDb()
    return { users: listUsers() }
  })

  ipcMain.handle('markets:list', async () => {
    initDb()
    return { markets: listMarkets() }
  })

  ipcMain.handle('markets:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createMarket(payload)
      auditCreatedRecord('Markets', result, payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'markets'))
    }
  })

  ipcMain.handle('markets:delete', async (_event, { marketId } = {}) => {
    initDb()
    auditDeletedRecord('Markets', String(marketId || ''))
    const result = deleteRow('Markets', 'id', String(marketId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('securities:list', async () => {
    initDb()
    return { securities: listSecurities() }
  })

  ipcMain.handle('securities:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createSecurity(payload)
      auditCreatedRecord('Securities', result, payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'securities'))
    }
  })

  ipcMain.handle('securities:delete', async (_event, { securityId } = {}) => {
    initDb()
    auditDeletedRecord('Securities', String(securityId || ''))
    const result = deleteRow('Securities', 'id', String(securityId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('users:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createUser(payload)
      auditCreatedRecord('Users', result, payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'users'))
    }
  })

  ipcMain.handle('users:delete', async (_event, { userId } = {}) => {
    const database = initDb()
    assertUserDeleteAllowed(database, userId)
    auditDeletedRecord('Users', String(userId || ''))
    const result = deleteRow('Users', 'id', String(userId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('contacts:create', async (_event, payload) => {
    initDb()
    const result = createContact(payload)
    auditCreatedRecord('Contacts', result, payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('contacts:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    const result = upsertContacts(rows)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('contacts:delete', async (_event, { contactId } = {}) => {
    const database = initDb()
    assertContactDeleteAllowed(database, contactId)
    auditDeletedRecord('Contacts', String(contactId || ''))
    const result = deleteRow('Contacts', 'id', String(contactId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('notes:list', async () => {
    initDb()
    return { notes: listNotes() }
  })
  ipcMain.handle('notes:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createNote(payload)
      auditCreatedRecord('Notes', result, payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'notes'))
    }
  })
  ipcMain.handle('notes:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    const result = upsertNotes(rows)
    await syncWorkspaceWorkbooksSafe()
    return result
  })
  ipcMain.handle('notes:delete', async (_event, { noteId } = {}) => {
    initDb()
    auditDeletedRecord('Notes', String(noteId || ''))
    const result = deleteRow('Notes', 'id', String(noteId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('tasks:list', async () => {
    initDb()
    return { tasks: listTasksForPage() }
  })
  ipcMain.handle('tasks:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createTask(payload)
      auditCreatedRecord('Tasks', result, payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'tasks'))
    }
  })
  ipcMain.handle('tasks:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    try {
      const result = upsertTasks(rows)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'tasks'))
    }
  })
  ipcMain.handle('tasks:delete', async (_event, { taskId } = {}) => {
    initDb()
    auditDeletedRecord('Tasks', String(taskId || ''))
    const result = deleteRow('Tasks', 'id', String(taskId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('roles:list', async () => {
    initDb()
    return { roles: listRoles() }
  })

  ipcMain.handle('roles:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createRole(payload)
      auditCreatedRecord('Roles', result, payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'roles'))
    }
  })

  ipcMain.handle('roles:delete', async (_event, { roleId } = {}) => {
    initDb()
    auditDeletedRecord('Roles', String(roleId || ''))
    const result = deleteRow('Roles', 'id', String(roleId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('companion-roles:list', async () => {
    initDb()
    return { companionRoles: listCompanionRoles() }
  })

  ipcMain.handle('companion-roles:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createCompanionRole(payload)
      auditCreatedRecord('Companion_Roles', result, payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'companion roles'))
    }
  })

  ipcMain.handle('companion-roles:delete', async (_event, { companionRoleId } = {}) => {
    initDb()
    auditDeletedRecord('Companion_Roles', String(companionRoleId || ''))
    const result = deleteRow('Companion_Roles', 'id', String(companionRoleId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('bb-file:list', async () => {
    initDb()
    return { buildingBlocks: listBuildingBlocks() }
  })

  ipcMain.handle('bb-file:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createBuildingBlock(payload)
      auditCreatedRecord('Building_Blocks', result, payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'bb file'))
    }
  })

  ipcMain.handle('bb-file:delete', async (_event, { blockId } = {}) => {
    initDb()
    auditDeletedRecord('Building_Blocks', String(blockId || ''))
    const result = deleteRow('Building_Blocks', 'id', String(blockId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('artifacts:list', async () => {
    initDb()
    return { artifacts: listArtifacts() }
  })

  ipcMain.handle('artifacts:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createArtifact(payload)
      auditCreatedRecord('Artifacts', result, payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'artifacts'))
    }
  })

  ipcMain.handle('intake:list', async () => {
    initDb()
    return { intake: listIntake() }
  })

  ipcMain.handle('intake:create', async (_event, payload = {}) => {
    initDb()
    try {
      const result = createIntake(payload)
      auditCreatedRecord('Intake', result, payload)
      await syncWorkspaceWorkbooksSafe()
      return result
    } catch (e) {
      throw new Error(toUserFriendlySaveError(e, 'intake'))
    }
  })

  ipcMain.handle('intake:delete', async (_event, { intakeId } = {}) => {
    initDb()
    auditDeletedRecord('Intake', String(intakeId || ''))
    const result = deleteRow('Intake', 'id', String(intakeId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('artifacts:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    const result = upsertArtifacts(rows)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('artifacts:delete', async (_event, { artifactId } = {}) => {
    initDb()
    auditDeletedRecord('Artifacts', String(artifactId || ''))
    const result = await deleteArtifact(artifactId)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('artifacts:download', async (_event, { artifactId } = {}) => {
    const artifact = await resolveArtifactFileForAction(artifactId)
    const targetWindow = BrowserWindow.getFocusedWindow() || mainWindow || null
    const downloadsPath = app.getPath('downloads')
    const saveResult = await dialog.showSaveDialog(targetWindow, {
      defaultPath: path.join(downloadsPath, artifact.fileName),
    })

    if (saveResult.canceled || !saveResult.filePath) {
      return { canceled: true }
    }

    await fs.copyFile(artifact.absolutePath, saveResult.filePath)
    return { canceled: false, filePath: saveResult.filePath }
  })

  ipcMain.handle('artifacts:preview', async (_event, { artifactId } = {}) => {
    const artifact = await resolveArtifactFileForAction(artifactId)
    const extension = path.extname(artifact.absolutePath).slice(1).toLowerCase()
    const fileUrl = pathToFileURL(artifact.absolutePath).href

    if (extension === 'pdf') {
      const pdfBuffer = await fs.readFile(artifact.absolutePath)
      return {
        kind: 'pdf',
        fileName: artifact.fileName,
        fileDataBase64: pdfBuffer.toString('base64'),
      }
    }

    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) {
      return {
        kind: 'image',
        fileName: artifact.fileName,
        fileUrl,
      }
    }

    if (['txt', 'md', 'csv', 'json', 'log'].includes(extension)) {
      const content = await fs.readFile(artifact.absolutePath, 'utf8')
      const maxChars = 200000
      const truncated = content.length > maxChars
      return {
        kind: 'text',
        fileName: artifact.fileName,
        content: truncated ? `${content.slice(0, maxChars)}\n\n[Preview truncated]` : content,
        truncated,
      }
    }

    return {
      kind: 'unsupported',
      fileName: artifact.fileName,
      extension,
    }
  })

  ipcMain.handle('artifacts:share', async (_event, { artifactId } = {}) => {
    const artifact = await resolveArtifactFileForAction(artifactId)
    clipboard.writeText(artifact.absolutePath)
    shell.showItemInFolder(artifact.absolutePath)
    return { absolutePath: artifact.absolutePath, copied: true }
  })

  ipcMain.handle('artifacts:openRawFolder', async () => {
    const workspace = await ensureWorkspace()
    const rawDir = getArtifactRawPath(workspace.rootPath)
    await fse.ensureDir(rawDir)
    await shell.openPath(rawDir)
    return { path: rawDir }
  })

  ipcMain.handle(
    'artifacts:linkToOpportunity',
    async (_event, { artifactIds, opportunityId } = {}) => {
      initDb()
      const result = linkArtifactsToOpportunity({ artifactIds, opportunityId })
      await syncWorkspaceWorkbooksSafe()
      return result
    },
  )

  ipcMain.handle('artifacts:ingest', async (event, payload = {}) => {
    const database = initDb()
    const workspace = await ensureWorkspace()
    const apiSettings = getApiSettings(database)

    const emitStatus = (status) => {
      try {
        event?.sender?.send?.('artifacts:ingest:status', status)
      } catch {
        // ignore
      }
    }

    const result = await ingestArtifactsFromPaths({
      workspaceRoot: workspace.rootPath,
      filePaths: payload?.filePaths || payload?.files || [],
      opportunityId: payload?.opportunityId,
      createdBy: payload?.createdBy,
      duplicateStrategy: payload?.duplicateStrategy,
      skipProcessing: payload?.skipProcessing,
      pathsAreWorkspaceRelative: payload?.pathsAreWorkspaceRelative,
      rawArtifactMap: payload?.rawArtifactMap,
      emitStatus,
      apiKeys: {
        openai: apiSettings.openaiApiKey,
        gemini: apiSettings.geminiApiKey,
      },
    })
    const count = Array.isArray(result?.results) ? result.results.length : 0
      if (count > 0) {
        emitStatus?.({
          type: 'success',
          message: `Artifacts saved in ${workspace.rootPath}/${USER_WORKSPACE_DIR}/${NETWORK_DATABASES_DIR}/Artifacts`,
        })
      }
    await syncWorkspaceWorkbooksSafe(workspace.rootPath)
    return result
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
  const database = initDb()
  ensureAuditActor(database)
  registerIpc()
  ensureWorkspace().then((workspace) => syncWorkspaceWorkbooksSafe(workspace.rootPath))
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
function resolveTargetEntityFromSharedToken(tokenName = '') {
  const raw = String(tokenName || '').trim()
  if (!raw.startsWith('__shared_ldb__:')) return ''
  const sourceKey = raw.slice('__shared_ldb__:'.length).trim().toLowerCase()
  if (!sourceKey) return ''
  const entry = FILE_PAGE_REGISTRY.find((candidate) => String(candidate?.key || '').trim().toLowerCase() === sourceKey)
  return String(entry?.entityName || '').trim()
}
