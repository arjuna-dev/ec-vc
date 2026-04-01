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
import { mirrorPipelineToFs, removePipelineFromFs } from './services/pipeline-mirror.js'
import { ingestArtifactsFromPaths } from './services/artifact-ingestion.js'
import { previewAutofillFromFiles } from './services/autofill-extraction.js'
import { syncWorkspaceWorkbookMirror } from './services/workspace-workbook-mirror.js'
import {
  getNetworkDatabasesPath,
  NETWORK_DATABASES_DIR,
  NETWORK_DATABASE_SECTION_DIRS,
  USER_WORKSPACE_DIR,
} from './services/workspace-structure.js'

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

const currentDir = fileURLToPath(new URL('.', import.meta.url))

let mainWindow

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

function toDirName(value, fallback = 'project') {
  return (
    String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || fallback
  )
}

async function ensureWorkspace() {
  const baseDirPath = app.getPath('userData')
  return createProjectStructure(baseDirPath, DEFAULT_PROJECT_ROOT_NAME, undefined)
}

async function syncWorkspaceWorkbooksSafe(workspaceRootPath = null) {
  try {
    const workspace = workspaceRootPath ? { rootPath: workspaceRootPath } : await ensureWorkspace()
    await syncWorkspaceWorkbookMirror(workspace.rootPath)
  } catch (error) {
    console.error('workspace workbook mirror failed:', error)
  }
}

function listPipelines() {
  return dbAll(
    `
    SELECT 
      p.id AS pipeline_id, 
      p.Project_Name AS name, 
      CASE WHEN p.id = 'pipeline_default' THEN 1 ELSE 0 END AS is_default, 
      po.install_status, 
      po.install_error,
      json_group_array(
        json_object(
          'stage_id', s.stage_id,
          'name', s.name,
          'position', s.position,
          'is_terminal', s.is_terminal
        )
      ) AS stages
    FROM Projects p
    LEFT JOIN Project_Overview po ON po.project_id = p.id
    LEFT JOIN Project_Stages s ON p.id = s.project_id
    GROUP BY p.id
    ORDER BY CASE WHEN p.id = 'pipeline_default' THEN 1 ELSE 0 END DESC, p.Project_Name ASC
    `,
  ).map((row) => ({
    ...row,
    dir_name: toDirName(row.name, 'pipeline'),
  }))
}

function upsertPipelines(rows = []) {
  const database = initDb()
  const input = Array.isArray(rows) ? rows : []

  const tx = database.transaction(() => {
    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const r of input) {
      const pipelineId =
        normalizeNullableString(r?.pipeline_id) || `pipeline:${crypto.randomUUID()}`
      const name = normalizeNullableString(r?.name)
      if (!name) {
        skipped++
        continue
      }

      const exists = database
        .prepare('SELECT 1 FROM Projects WHERE id = ? LIMIT 1')
        .get(pipelineId)

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
          project_id: pipelineId,
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
        .run(pipelineId)

      if (exists) updated++
      else inserted++
    }

    return { inserted, updated, skipped }
  })

  return tx()
}

function createPipeline(payload = {}) {
  const database = initDb()
  const name = normalizeNullableString(payload.name)
  if (!name) throw new Error('Pipeline name is required')

  const pipelineId =
    normalizeNullableString(payload.pipeline_id) || `pipeline:${crypto.randomUUID()}`

  const tx = database.transaction(() => {
    database
      .prepare(
        `
        INSERT INTO Projects (id, Project_Name, created_at, updated_at)
        VALUES (?, ?, datetime('now'), datetime('now'))
      `,
      )
      .run(pipelineId, name)

    database
      .prepare(
        `
        INSERT INTO Project_Overview (project_id, created_at, updated_at)
        VALUES (?, datetime('now'), datetime('now'))
      `,
      )
      .run(pipelineId)

    const providedStages = Array.isArray(payload.stages) ? payload.stages : []
    const stageLabels =
      providedStages.length > 0
        ? providedStages
            .map((s) => String(s || '').trim())
            .filter(Boolean)
            .slice(0, 50)
        : [
            'Thesis alignment',
            'Team analysis',
            'Investment committee',
            'Due diligence',
            'Closing documents',
          ]

    const insertStage = database.prepare(
      `
      INSERT INTO Project_Stages (stage_id, project_id, name, position, is_terminal)
      VALUES (?, ?, ?, ?, ?)
    `,
    )

    function stageDirName(index, label) {
      const t = String(label || '').trim()
      if (/^\d+_/.test(t)) return t
      const slug = t
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 80)
      return `${index + 1}_${slug || 'stage'}`
    }

    for (let i = 0; i < stageLabels.length; i += 1) {
      const stageId = `${pipelineId}:stage_${i + 1}`
      insertStage.run(
        stageId,
        pipelineId,
        stageDirName(i, stageLabels[i]),
        i + 1,
        i === stageLabels.length - 1 ? 1 : 0,
      )
    }
  })

  tx()

  return { pipeline_id: pipelineId }
}

async function installPipeline(pipelineId) {
  const workspace = await ensureWorkspace()

  const pipeline = dbAll(
    `
    SELECT
      p.id AS pipeline_id,
      p.Project_Name AS name,
      po.install_status
    FROM Projects p
    LEFT JOIN Project_Overview po ON po.project_id = p.id
    WHERE p.id = ?
    LIMIT 1
  `,
    [pipelineId],
  )?.[0]
  if (!pipeline) throw new Error(`Unknown pipeline: ${pipelineId}`)
  if (pipeline.install_status === 'installed') return { ok: true }

  const dirName = toDirName(pipeline.name, 'pipeline')

  dbRun(
    "UPDATE Project_Overview SET install_status = 'installing', install_error = NULL, updated_at = datetime('now') WHERE project_id = ?",
    [pipelineId],
  )

  const stages = dbAll(
    'SELECT name FROM Project_Stages WHERE project_id = ? ORDER BY position ASC',
    [pipelineId],
  ).map((r) => r.name)

  try {
    await mirrorPipelineToFs(workspace.rootPath, dirName, stages)
    dbRun(
      "UPDATE Project_Overview SET install_status = 'installed', installed_at = datetime('now'), updated_at = datetime('now') WHERE project_id = ?",
      [pipelineId],
    )
    return { ok: true }
  } catch (e) {
    dbRun(
      "UPDATE Project_Overview SET install_status = 'error', install_error = ?, updated_at = datetime('now') WHERE project_id = ?",
      [e?.message || String(e), pipelineId],
    )
    throw e
  }
}

async function uninstallPipeline(pipelineId) {
  const workspace = await ensureWorkspace()

  const pipeline = dbAll(
    `
    SELECT
      p.id AS pipeline_id,
      p.Project_Name AS name,
      po.install_status
    FROM Projects p
    LEFT JOIN Project_Overview po ON po.project_id = p.id
    WHERE p.id = ?
    LIMIT 1
  `,
    [pipelineId],
  )?.[0]
  if (!pipeline) throw new Error(`Unknown pipeline: ${pipelineId}`)
  if (pipeline.install_status === 'not_installed') return { ok: true }

  const dirName = toDirName(pipeline.name, 'pipeline')

  dbRun(
    "UPDATE Project_Overview SET install_status = 'uninstalling', install_error = NULL, updated_at = datetime('now') WHERE project_id = ?",
    [pipelineId],
  )

  try {
    await removePipelineFromFs(workspace.rootPath, dirName)
    dbRun(
      "UPDATE Project_Overview SET install_status = 'not_installed', updated_at = datetime('now') WHERE project_id = ?",
      [pipelineId],
    )
    return { ok: true }
  } catch (e) {
    dbRun(
      "UPDATE Project_Overview SET install_status = 'error', install_error = ?, updated_at = datetime('now') WHERE project_id = ?",
      [e?.message || String(e), pipelineId],
    )
    throw e
  }
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

  const mainFields = {
    Company_Name: name,
    Short_Name: normalizeNullableString(payload.Short_Name) || normalizeNullableString(payload.shortening),
    Website: normalizeNullableString(payload.Website),
    One_Liner: normalizeNullableString(payload.One_Liner),
    Description: normalizeNullableString(payload.Description),
    Notable_News: normalizeNullableString(payload.Notable_News),
    Updates: normalizeNullableString(payload.Updates),
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
                Updates, created_by
              ) VALUES (
                @id, @Company_Name, @Short_Name, @Website, @One_Liner, @Description, @Notable_News,
                @Updates, @created_by
              )
            `,
            )
            .run({ id: explicitId, ...mainFields })
        : database
            .prepare(
              `
              INSERT INTO Companies (
                Company_Name, Short_Name, Website, One_Liner, Description, Notable_News,
                Updates, created_by
              ) VALUES (
                @Company_Name, @Short_Name, @Website, @One_Liner, @Description, @Notable_News,
                @Updates, @created_by
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
        ro.Round_Security_Type AS Type_of_Security,
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
  return dbAll(
    `
    SELECT
      id,
      Name,
      Personal_Email,
      Professional_Email,
      Phone,
      Country_based,
      LinkedIn
    FROM Contacts
    ORDER BY COALESCE(Name, '') ASC, id DESC
  `,
  )
}

function listRounds() {
  return dbAll(
    `
    SELECT
      r.id,
      r.Round_Name,
      ro.sponsor_company_id,
      ro.Round_Raising_Status,
      ro.Round_Security_Type,
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
  return dbAll(
    `
    SELECT
      id,
      User_Name,
      User_PEmail,
      created_at,
      updated_at
    FROM Users
    ORDER BY COALESCE(User_Name, '') ASC, id ASC
  `,
  )
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

  const id = normalizeNullableString(payload?.id) || `note:${crypto.randomUUID()}`
  database
    .prepare(
      `
      INSERT INTO Notes (id, created_by, Note_Name, Note_Content, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
    )
    .run(id, actor.user_id, noteName, noteContent)
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
      tov.Task_Summary AS Task_Description,
      tov.Task_Status AS Status,
      tov.Task_Priority_Rank AS Priority,
      tov.Task_Due_Date AS Due_Date,
      NULL AS pipeline_id,
      t.created_at,
      COALESCE(r.Round_Name, f.Fund_Name) AS opportunity_name,
      COALESCE(r.id, f.id) AS opportunity_id,
      owner.Name AS contact_name,
      owner.id AS contact_id,
      co.Company_Name AS company_name,
      co.id AS company_id,
      NULL AS pipeline_name
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

  database
    .prepare(
      `
      INSERT INTO Tasks (id, created_by, Task_Name, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `,
    )
    .run(
      taskId,
      normalizeNullableString(payload?.Task_Creator) ||
        normalizeNullableString(payload?.created_by) ||
        actor.user_id,
      taskName,
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
      database
        .prepare(
          `
          INSERT INTO Tasks (id, created_by, Task_Name, created_at, updated_at)
          VALUES (@id, @created_by, @Task_Name, datetime('now'), datetime('now'))
          ON CONFLICT(id) DO UPDATE SET
            created_by = excluded.created_by,
            Task_Name = excluded.Task_Name,
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

function listAssistantPrompts() {
  return dbAll(
    `
    SELECT
      assistant_system_prompt_id,
      name,
      version,
      description,
      system_prompt,
      input_contract,
      output_contract,
      schema_name,
      created_at
    FROM Assistant_System_Prompts
    ORDER BY created_at DESC, assistant_system_prompt_id DESC
  `,
  )
}

function listDatabookVersions(tableName, recordId) {
  const config = getDatabookTableConfig(tableName)
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

function getDatabookSnapshot(snapshotId) {
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
      'install_status',
      'install_error',
      'installed_at',
      'created_at',
      'updated_at',
    ]),
  },
})

const DATABOOK_TABLE_ALIASES = Object.freeze({
  companies: 'Companies',
  company: 'Companies',
  contacts: 'Contacts',
  contact: 'Contacts',
  opportunities: 'Opportunities',
  opportunity: 'Opportunities',
  funds: 'Funds',
  fund: 'Funds',
  rounds: 'Rounds',
  round: 'Rounds',
  pipelines: 'Projects',
  pipeline: 'Projects',
  projects: 'Projects',
  project: 'Projects',
})

function getDatabookTableConfig(tableName) {
  const raw = normalizeNullableString(tableName)
  if (!raw) throw new Error('tableName is required')
  const canonical = DATABOOK_TABLE_ALIASES[String(raw).toLowerCase()] || raw
  const config = DATABOOK_TABLE_CONFIGS[canonical]
  if (!config) throw new Error(`Unsupported Databook table: ${raw}`)
  return config
}

function formatDatabookFieldLabel(fieldName) {
  const specialWords = {
    id: 'ID',
    api: 'API',
    aum: 'AUM',
    aums: 'AUMs',
    llm: 'LLM',
    rofo: 'ROFO',
    ror: 'ROR',
  }

  return String(fieldName || '')
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => {
      const lower = String(word).toLowerCase()
      if (specialWords[lower]) return specialWords[lower]
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function resolveDatabookEntityName(record, config, recordId) {
  for (const columnName of config.displayColumns || []) {
    const value = normalizeNullableString(record?.[columnName])
    if (value) return value
  }
  return recordId
}

function isDatabookFieldEditable(config, tableMeta, columnName) {
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

function buildCompanyDatabookView(database, recordId) {
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
      label: formatDatabookFieldLabel(columnName),
      value: row?.[columnName] == null ? '' : String(row[columnName]),
      editable: !new Set(['id', 'created_by', 'created_at', 'updated_at']).has(columnName),
      table_name: 'Companies',
      record_id: rid,
      field_name: columnName,
      id_column: 'id',
    })),
    ...incorporationFields.map((columnName) => ({
      key: `Company_Incorporation_Info|${rid}|${columnName}`,
      section: 'Company Incorporation',
      label: formatDatabookFieldLabel(columnName),
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
      label: formatDatabookFieldLabel(columnName),
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
      label: formatDatabookFieldLabel(columnName),
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
      label: formatDatabookFieldLabel(columnName),
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
      label: formatDatabookFieldLabel(columnName),
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
      label: formatDatabookFieldLabel(columnName),
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
      label: formatDatabookFieldLabel(columnName),
      value: row?.[columnName] == null ? '' : String(row[columnName]),
      editable: !new Set(['created_at', 'updated_at']).has(columnName),
      table_name: 'Company_Fund_Raising',
      record_id: rid,
      field_name: columnName,
      id_column: 'company_id',
    })),
  ]

  return {
    table_name: 'Companies',
    record_id: rid,
    entity_label: 'Company',
    entity_name: normalizeNullableString(row.Company_Name) || rid,
    record: row,
    fields,
  }
}

function getDatabookView(tableName, recordId) {
  const database = initDb()
  const config = getDatabookTableConfig(tableName)
  const rid = normalizeNullableString(recordId)
  if (!rid) throw new Error('recordId is required')

  if (config.tableName === 'Companies') {
    return buildCompanyDatabookView(database, rid)
  }

  const tableMeta = getTableMeta(database, config.tableName)
  const idColumn = tableMeta.pkColumn
  if (!idColumn) throw new Error(`Databook table ${config.tableName} must have a primary key`)

  const row = database
    .prepare(
      `SELECT * FROM ${quoteIdentifier(config.tableName)} WHERE ${quoteIdentifier(idColumn)} = ? LIMIT 1`,
    )
    .get(rid)
  if (!row) throw new Error(`${config.entityLabel} not found: ${rid}`)

  const fields = tableMeta.columnNames.map((columnName) => ({
    key: `${config.tableName}|${rid}|${columnName}`,
    section: config.entityLabel,
    label: formatDatabookFieldLabel(columnName),
    value: row?.[columnName] == null ? '' : String(row[columnName]),
    editable: isDatabookFieldEditable(config, tableMeta, columnName),
    table_name: config.tableName,
    record_id: rid,
    field_name: columnName,
    id_column: idColumn,
  }))

  return {
    table_name: config.tableName,
    record_id: rid,
    entity_label: config.entityLabel,
    entity_name: resolveDatabookEntityName(row, config, rid),
    record: row,
    fields,
  }
}

function createContact(payload = {}) {
  const database = initDb()
  const id = normalizeNullableString(payload.id) || `contact:${crypto.randomUUID()}`
  const name = normalizeNullableString(payload.Name)
  if (!name) throw new Error('Contact name is required')
  const personalEmail =
    normalizeNullableString(payload.Personal_Email) || normalizeNullableString(payload.Email)
  const professionalEmail = normalizeNullableString(payload.Professional_Email)

  database
    .prepare(
      `
      INSERT INTO Contacts (
        id, Name, Personal_Email, Professional_Email, Phone, Country_based, LinkedIn, linked_user_id
      ) VALUES (
        @id, @Name, @Personal_Email, @Professional_Email, @Phone, @Country_based, @LinkedIn, @linked_user_id
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
    ORDER BY a.created_at DESC
  `,
  )
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

function sanitizeDatabookUpdateError(error) {
  const message = normalizeNullableString(error?.message) || String(error || '')
  if (!message) return 'Could not save Databook changes. Please try again.'
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

const APP_SETTING_KEYS = {
  openaiApiKey: 'openai_api_key',
  geminiApiKey: 'gemini_api_key',
  userId: 'user_id',
  userContactId: 'user_contact_id',
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
        id,
        User_Name,
        User_PEmail,
        created_at,
        updated_at
      FROM Users
      WHERE id = ?
      LIMIT 1
    `,
      )
      .get(id) || null
  )
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

  const storedContactId = normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.userContactId))
  const existingContact =
    (storedContactId &&
      database.prepare('SELECT id FROM Contacts WHERE id = ? LIMIT 1').get(storedContactId)) ||
    database.prepare('SELECT id FROM Contacts WHERE linked_user_id = ? LIMIT 1').get(userId)

  const contactId = existingContact?.id || `contact:${crypto.randomUUID()}`
  const personalEmail = normalizeNullableString(profile?.Personal_Email) || email
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
      Name: name,
      Personal_Email: personalEmail,
      Professional_Email: professionalEmail,
      Phone: normalizeNullableString(profile?.Phone),
      Country_based: normalizeNullableString(profile?.Country_based),
      LinkedIn: normalizeNullableString(profile?.LinkedIn),
      linked_user_id: userId,
    })

  setAppSetting(database, APP_SETTING_KEYS.userId, userId)
  setAppSetting(database, APP_SETTING_KEYS.userContactId, contactId)
  setAppSetting(database, 'user_label', name)

  return { userId, contactId, email, name }
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
  const actor = getAuditActor(database)
  const userId = normalizeNullableString(getAppSetting(database, APP_SETTING_KEYS.userId))
  const user = userId ? getUserById(database, userId) : null
  const userContactId = normalizeNullableString(
    getAppSetting(database, APP_SETTING_KEYS.userContactId),
  )
  const userContact = userContactId ? getContactById(database, userContactId) : null
  return {
    auditUserId: actor.user_id,
    userId: user?.id || null,
    user,
    userContactId: userContact?.id || null,
    userContact,
  }
}

function setUserSettings(payload = {}) {
  const database = initDb()
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
        old_value,
        new_value,
        edited_by,
        edited_at
      FROM events
      ${whereSql}
      ORDER BY edited_at DESC, id DESC
      LIMIT ?
    `,
    )
    .all(...params, limit)
}

function applyAuditedChanges(changes = [], { createDatabookSnapshotFor = null } = {}) {
  const database = initDb()
  const normalizedChanges = (Array.isArray(changes) ? changes : [])
    .map((change) => ({
      table_name: normalizeNullableString(change?.table_name),
      record_id: normalizeNullableString(change?.record_id),
      field_name: normalizeNullableString(change?.field_name),
      id_column: normalizeNullableString(change?.id_column),
      new_value: change?.new_value,
    }))
    .filter((change) => change.table_name && change.record_id && change.field_name)

  if (!normalizedChanges.length) {
    const actor = getAuditActor(database)
    return { updated: 0, events_created: 0, snapshot_id: null, actor }
  }

  const actor = getAuditActor(database, { requireUser: true })

  const tx = database.transaction(() => {
    let updated = 0
    let eventsCreated = 0

    for (const change of normalizedChanges) {
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

      database
        .prepare(
          `
          INSERT INTO events (
            id, table_name, record_id, field_name, old_value, new_value,
            edited_by, edited_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `,
        )
        .run(
          `event:${crypto.randomUUID()}`,
          change.table_name,
          change.record_id,
          change.field_name,
          stringifyEventValue(oldValue),
          stringifyEventValue(newValue),
          actor.user_id,
        )
      eventsCreated += 1
    }

    let snapshotId = null
    if (createDatabookSnapshotFor?.tableName && createDatabookSnapshotFor?.recordId) {
      const config = getDatabookTableConfig(createDatabookSnapshotFor.tableName)
      const recordId = normalizeNullableString(createDatabookSnapshotFor.recordId)
      const snapshotPayload = getDatabookView(config.tableName, recordId)
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
  })

  return tx()
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

function createDatabookSnapshot(tableName, recordId, { source = 'create' } = {}) {
  const database = initDb()
  const config = getDatabookTableConfig(tableName)
  const rid = normalizeNullableString(recordId)
  if (!rid) throw new Error('recordId is required')
  const actor = getAuditActor(database, { requireUser: true })
  const snapshotPayload = getDatabookView(config.tableName, rid)
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

function createDatabookSnapshotForOpportunity(opportunityId, options = {}) {
  return createDatabookSnapshot('Opportunities', opportunityId, options)
}

function createDatabookSnapshotForFund(fundId, options = {}) {
  return createDatabookSnapshot('Funds', fundId, options)
}

function createDatabookSnapshotForRound(roundId, options = {}) {
  return createDatabookSnapshot('Rounds', roundId, options)
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
  assertUniqueOpportunityName(database, fundName, 'Fund')

  const tx = database.transaction(() => {
    database
      .prepare(
        `
        INSERT INTO Funds (id, Fund_Name, created_by, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `,
      )
      .run(fundId, fundName, actor.user_id)

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
  const snapshotId = createDatabookSnapshotForFund(fundId, { source: 'fund_create' })
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
    throw new Error('Company is required to create a round.')
  }

  maybeCreatePrimaryContact(payload.primary_contact)
  const roundId = normalizeNullableString(payload?.id) || `round:${crypto.randomUUID()}`
  const roundName =
    normalizeNullableString(payload?.Round_Name) ||
    normalizeNullableString(payload?.Venture_Oppty_Name) ||
    normalizeNullableString(payload?.company?.Company_Name) ||
    roundId
  assertUniqueOpportunityName(database, roundName, 'Round')

  const tx = database.transaction(() => {
    database
      .prepare(
        `
        INSERT INTO Rounds (id, Round_Name, created_by, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `,
      )
      .run(roundId, roundName, actor.user_id)

    database
      .prepare(
        `
        INSERT INTO Round_Overview (
          round_id, sponsor_company_id, Round_Raising_Status, Round_Security_Type,
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
  const snapshotId = createDatabookSnapshotForRound(roundId, { source: 'round_create' })
  return { id: roundId, snapshot_id: snapshotId }
}

function ensureExistingCompanyId(database, maybeCompanyId) {
  const companyId = normalizeNullableIntegerId(maybeCompanyId)
  if (!companyId) return null
  const exists = database.prepare('SELECT 1 FROM Companies WHERE id = ? LIMIT 1').get(companyId)
  return exists ? companyId : null
}

function ensureDefaultPipelineSeed(database) {
  database
    .prepare(
      `
      INSERT OR IGNORE INTO Projects (id, Project_Name)
      VALUES ('pipeline_default', 'Default Investment Pipeline')
    `,
    )
    .run()

  database
    .prepare(
      `
      INSERT OR IGNORE INTO Project_Overview (project_id, Project_Status, Project_Priority_Rank)
      VALUES ('pipeline_default', 'On-Going', 'Mid')
    `,
    )
    .run()

  database
    .prepare(
      `
      INSERT OR IGNORE INTO Project_Stages (stage_id, project_id, name, position, is_terminal)
      VALUES ('stage_thesis_alignment', 'pipeline_default', '1_thesis_alignment', 1, 0)
    `,
    )
    .run()
}

function buildOpportunityForeignKeyDebug(database, { companyId = null, kind = null } = {}) {
  const cid = normalizeNullableString(companyId)
  const companyExists = cid
    ? Boolean(database.prepare('SELECT 1 FROM Companies WHERE id = ? LIMIT 1').get(cid))
    : null
  const pipelineExists = Boolean(
    database
      .prepare("SELECT 1 FROM Projects WHERE id = 'pipeline_default' LIMIT 1")
      .get(),
  )
  const stageExists = Boolean(
    database
      .prepare(
        "SELECT 1 FROM Project_Stages WHERE stage_id = 'stage_thesis_alignment' AND project_id = 'pipeline_default' LIMIT 1",
      )
      .get(),
  )
  return {
    kind: normalizeNullableString(kind),
    company_id: cid,
    company_exists: companyExists,
    pipeline_default_exists: pipelineExists,
    default_stage_exists: stageExists,
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

  const fields = {
    id: opportunityId,
    kind,
    company_id: companyId,
    Venture_Oppty_Name: derivedOpportunityName || opportunityId,
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
    Pipeline_Stage: normalizeNullableString(payload.Pipeline_Stage),
    Pipeline_Status: normalizeNullableString(payload.Pipeline_Status),
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
    ensureDefaultPipelineSeed(database)

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

    // Ensure the opportunity has a default pipeline stage (DB-level requirement via app logic)
    runCreateStep('link opportunity to default pipeline', () => {
      database
        .prepare(
          `
          INSERT OR REPLACE INTO Opportunity_Pipeline (
            opportunity_id,
            pipeline_id,
            stage_id,
            status
          ) VALUES (?, 'pipeline_default', 'stage_thesis_alignment', 'active')
        `,
        )
        .run(opportunityId)
    })

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

  const snapshotId = createDatabookSnapshotForOpportunity(opportunityId, {
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

  const fields = {
    id: opportunityId,
    kind,
    company_id: companyId,
    Venture_Oppty_Name: derivedOpportunityName || opportunityId,
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
    Pipeline_Stage: normalizeNullableString(payload.Pipeline_Stage),
    Pipeline_Status: normalizeNullableString(payload.Pipeline_Status),
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
    ensureDefaultPipelineSeed(database)

    runCreateStep('update opportunity', () => {
      database
        .prepare(
          `
          UPDATE Opportunities SET
            kind = @kind,
            company_id = @company_id,
            Venture_Oppty_Name = @Venture_Oppty_Name,
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
            Pipeline_Stage = @Pipeline_Stage,
            Pipeline_Status = @Pipeline_Status,
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

    runCreateStep('link opportunity to default pipeline', () => {
      database
        .prepare(
          `
          INSERT OR IGNORE INTO Opportunity_Pipeline (
            opportunity_id,
            pipeline_id,
            stage_id,
            status
          ) VALUES (?, 'pipeline_default', 'stage_thesis_alignment', 'active')
        `,
        )
        .run(opportunityId)
    })

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

  const snapshotId = createDatabookSnapshotForOpportunity(opportunityId, {
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
        Pipeline_Stage: normalizeNullableString(r?.Pipeline_Stage),
        Pipeline_Status: normalizeNullableString(r?.Pipeline_Status),
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
            Pipeline_Stage, Pipeline_Status, Raising_Status,
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
            @Pipeline_Stage, @Pipeline_Status, @Raising_Status,
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
            Pipeline_Stage = excluded.Pipeline_Stage,
            Pipeline_Status = excluded.Pipeline_Status,
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

      database
        .prepare(
          `
          INSERT OR IGNORE INTO Opportunity_Pipeline (
            opportunity_id,
            pipeline_id,
            stage_id,
            status
          ) VALUES (?, 'pipeline_default', 'stage_thesis_alignment', 'active')
        `,
        )
        .run(opportunityId)

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
    return { projects: listPipelines() }
  })

  ipcMain.handle('projects:install', async (_event, { projectId, pipelineId } = {}) => {
    initDb()
    return installPipeline(String(projectId || pipelineId || ''))
  })

  ipcMain.handle('projects:uninstall', async (_event, { projectId, pipelineId } = {}) => {
    initDb()
    return uninstallPipeline(String(projectId || pipelineId || ''))
  })

  ipcMain.handle('projects:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    const result = upsertPipelines(rows)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('projects:create', async (_event, payload) => {
    initDb()
    const result = createPipeline(payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('projects:delete', async (_event, { projectId, pipelineId } = {}) => {
    initDb()
    const pid = String(projectId || pipelineId || '')
    if (!pid) throw new Error('pipelineId is required')
    if (pid === 'pipeline_default') throw new Error('Cannot delete the default pipeline')
    const result = deleteRow('Projects', 'id', pid)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('pipelines:list', async () => {
    initDb()
    return { pipelines: listPipelines() }
  })

  ipcMain.handle('pipelines:install', async (_event, { pipelineId } = {}) => {
    initDb()
    return installPipeline(String(pipelineId || ''))
  })

  ipcMain.handle('pipelines:uninstall', async (_event, { pipelineId } = {}) => {
    initDb()
    return uninstallPipeline(String(pipelineId || ''))
  })

  ipcMain.handle('pipelines:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    const result = upsertPipelines(rows)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('pipelines:create', async (_event, payload) => {
    initDb()
    const result = createPipeline(payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('pipelines:delete', async (_event, { pipelineId } = {}) => {
    initDb()
    const pid = String(pipelineId || '')
    if (!pid) throw new Error('pipelineId is required')
    if (pid === 'pipeline_default') throw new Error('Cannot delete the default pipeline')
    const result = deleteRow('Projects', 'id', pid)
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
    const result = deleteRow('Companies', 'id', String(companyId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('funds:create', async (_event, payload = {}) => {
    initDb()
    const result = createFund(payload)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('rounds:create', async (_event, payload = {}) => {
    initDb()
    const result = createRound(payload)
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
    const result = deleteOpportunityRow(opportunityId)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('databooks:view', async (_event, { tableName, recordId } = {}) => {
    initDb()
    return getDatabookView(tableName, recordId)
  })

  ipcMain.handle('databooks:versions', async (_event, { tableName, recordId } = {}) => {
    initDb()
    return { versions: listDatabookVersions(tableName, recordId) }
  })

  ipcMain.handle('databooks:viewSnapshot', async (_event, { snapshotId } = {}) => {
    initDb()
    return getDatabookSnapshot(snapshotId)
  })

  ipcMain.handle('databooks:update', async (_event, { tableName, recordId, changes } = {}) => {
    initDb()
    try {
      const config = getDatabookTableConfig(tableName)
      const rid = normalizeNullableString(recordId)
      if (!rid) throw new Error('recordId is required')
      const result = applyAuditedChanges(changes, {
        createDatabookSnapshotFor: { tableName: config.tableName, recordId: rid },
      })
      await syncWorkspaceWorkbooksSafe()
      return {
        ...result,
        view: getDatabookView(config.tableName, rid),
      }
    } catch (e) {
      console.error('databooks:update failed:', e)
      throw new Error(sanitizeDatabookUpdateError(e))
    }
  })

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

  ipcMain.handle('contacts:create', async (_event, payload) => {
    initDb()
    const result = createContact(payload)
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
    initDb()
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
    const result = deleteRow('Tasks', 'id', String(taskId || ''))
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('assistants:list', async () => {
    initDb()
    return { assistants: listAssistantPrompts() }
  })

  ipcMain.handle('artifacts:list', async () => {
    initDb()
    return { artifacts: listArtifacts() }
  })

  ipcMain.handle('artifacts:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    const result = upsertArtifacts(rows)
    await syncWorkspaceWorkbooksSafe()
    return result
  })

  ipcMain.handle('artifacts:delete', async (_event, { artifactId } = {}) => {
    initDb()
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

  ipcMain.handle(
    'artifacts:linkToOpportunity',
    async (_event, { artifactIds, opportunityId, pipelineId } = {}) => {
      initDb()
      const result = linkArtifactsToOpportunity({ artifactIds, opportunityId, pipelineId })
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
      pipelineId: payload?.pipelineId,
      createdBy: payload?.createdBy,
      duplicateStrategy: payload?.duplicateStrategy,
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
