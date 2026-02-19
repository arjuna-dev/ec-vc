import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import fse from 'fs-extra'

import { app, BrowserWindow, ipcMain } from 'electron'
import { createProjectStructure, DEFAULT_PROJECT_ROOT_NAME } from './services/project-structure.js'
import { closeDb, dbAll, dbRun, getDbInfo, initDb } from './services/sqlite-db.js'
import { mirrorPipelineToFs, removePipelineFromFs } from './services/pipeline-mirror.js'
import { ingestArtifactsFromPaths } from './services/artifact-ingestion.js'
import { previewAutofillFromFiles } from './services/autofill-extraction.js'

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

const currentDir = fileURLToPath(new URL('.', import.meta.url))

let mainWindow

async function ensureWorkspace() {
  const baseDirPath = app.getPath('userData')
  return createProjectStructure(baseDirPath, DEFAULT_PROJECT_ROOT_NAME, undefined)
}

function listPipelines() {
  return dbAll(
    `
    SELECT 
      p.pipeline_id, 
      p.name, 
      p.dir_name, 
      p.is_default, 
      p.install_status, 
      p.install_error,
      json_group_array(
        json_object(
          'stage_id', s.stage_id,
          'name', s.name,
          'position', s.position,
          'is_terminal', s.is_terminal
        )
      ) AS stages
    FROM Pipelines p
    LEFT JOIN Pipeline_Stages s ON p.pipeline_id = s.pipeline_id
    GROUP BY p.pipeline_id
    ORDER BY p.is_default DESC, p.name ASC
    `,
  )
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
      const dirName =
        normalizeNullableString(r?.dir_name) ||
        String(name || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 80) ||
        'pipeline'
      const isDefaultRaw = normalizeNullableString(r?.is_default)
      const isDefault = isDefaultRaw === '1' || isDefaultRaw?.toLowerCase?.() === 'true' ? 1 : 0

      if (!name) {
        skipped++
        continue
      }

      // Don't allow importing a second "default" accidentally.
      const safeIsDefault = pipelineId === 'pipeline_default' ? isDefault : 0

      const exists = database
        .prepare('SELECT 1 FROM Pipelines WHERE pipeline_id = ? LIMIT 1')
        .get(pipelineId)

      database
        .prepare(
          `
          INSERT INTO Pipelines (pipeline_id, name, dir_name, is_default)
          VALUES (@pipeline_id, @name, @dir_name, @is_default)
          ON CONFLICT(pipeline_id) DO UPDATE SET
            name = excluded.name,
            dir_name = excluded.dir_name,
            is_default = excluded.is_default,
            updated_at = datetime('now')
        `,
        )
        .run({
          pipeline_id: pipelineId,
          name,
          dir_name: dirName,
          is_default: safeIsDefault,
        })

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
  const dirName =
    normalizeNullableString(payload.dir_name) ||
    String(name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) ||
    'pipeline'

  const pipelineId = normalizeNullableString(payload.pipeline_id) || `pipeline:${crypto.randomUUID()}`
  const isDefault = pipelineId === 'pipeline_default' ? 1 : payload.is_default ? 1 : 0

  const tx = database.transaction(() => {
    database
      .prepare(
        `
        INSERT INTO Pipelines (pipeline_id, name, dir_name, is_default)
        VALUES (?, ?, ?, ?)
      `,
      )
      .run(pipelineId, name, dirName, isDefault)

    const providedStages = Array.isArray(payload.stages) ? payload.stages : []
    const stageLabels =
      providedStages.length > 0
        ? providedStages.map((s) => String(s || '').trim()).filter(Boolean).slice(0, 50)
        : ['Thesis alignment', 'Team analysis', 'Investment committee', 'Due diligence', 'Closing documents']

    const insertStage = database.prepare(
      `
      INSERT INTO Pipeline_Stages (stage_id, pipeline_id, name, position)
      VALUES (?, ?, ?, ?)
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
      insertStage.run(stageId, pipelineId, stageDirName(i, stageLabels[i]), i + 1)
    }
  })

  tx()

  return { pipeline_id: pipelineId }
}

async function installPipeline(pipelineId) {
  const workspace = await ensureWorkspace()

  const pipeline = dbAll(
    'SELECT pipeline_id, name, dir_name, install_status FROM Pipelines WHERE pipeline_id = ? LIMIT 1',
    [pipelineId],
  )?.[0]
  if (!pipeline) throw new Error(`Unknown pipeline: ${pipelineId}`)
  if (pipeline.install_status === 'installed') return { ok: true }

  const dirName =
    pipeline.dir_name ||
    String(pipeline.name || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) ||
    'pipeline'

  if (!pipeline.dir_name && dirName) {
    dbRun("UPDATE Pipelines SET dir_name = ?, updated_at = datetime('now') WHERE pipeline_id = ?", [
      dirName,
      pipelineId,
    ])
  }

  dbRun(
    "UPDATE Pipelines SET install_status = 'installing', install_error = NULL, updated_at = datetime('now') WHERE pipeline_id = ?",
    [pipelineId],
  )

  const stages = dbAll(
    'SELECT name FROM Pipeline_Stages WHERE pipeline_id = ? ORDER BY position ASC',
    [pipelineId],
  ).map((r) => r.name)

  try {
    await mirrorPipelineToFs(workspace.rootPath, dirName, stages)
    dbRun(
      "UPDATE Pipelines SET install_status = 'installed', installed_at = datetime('now'), uninstalled_at = NULL, updated_at = datetime('now') WHERE pipeline_id = ?",
      [pipelineId],
    )
    return { ok: true }
  } catch (e) {
    dbRun(
      "UPDATE Pipelines SET install_status = 'error', install_error = ?, updated_at = datetime('now') WHERE pipeline_id = ?",
      [e?.message || String(e), pipelineId],
    )
    throw e
  }
}

async function uninstallPipeline(pipelineId) {
  const workspace = await ensureWorkspace()

  const pipeline = dbAll(
    'SELECT pipeline_id, name, dir_name, install_status FROM Pipelines WHERE pipeline_id = ? LIMIT 1',
    [pipelineId],
  )?.[0]
  if (!pipeline) throw new Error(`Unknown pipeline: ${pipelineId}`)
  if (pipeline.install_status === 'not_installed') return { ok: true }

  const dirName =
    pipeline.dir_name ||
    String(pipeline.name || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) ||
    'pipeline'

  if (!pipeline.dir_name && dirName) {
    dbRun("UPDATE Pipelines SET dir_name = ?, updated_at = datetime('now') WHERE pipeline_id = ?", [
      dirName,
      pipelineId,
    ])
  }

  dbRun(
    "UPDATE Pipelines SET install_status = 'uninstalling', install_error = NULL, updated_at = datetime('now') WHERE pipeline_id = ?",
    [pipelineId],
  )

  try {
    await removePipelineFromFs(workspace.rootPath, dirName)
    dbRun(
      "UPDATE Pipelines SET install_status = 'not_installed', uninstalled_at = datetime('now'), updated_at = datetime('now') WHERE pipeline_id = ?",
      [pipelineId],
    )
    return { ok: true }
  } catch (e) {
    dbRun(
      "UPDATE Pipelines SET install_status = 'error', install_error = ?, updated_at = datetime('now') WHERE pipeline_id = ?",
      [e?.message || String(e), pipelineId],
    )
    throw e
  }
}

function listCompanies() {
  return dbAll(
    `
    SELECT
      id,
      Company_Name,
      Website,
      Status,
      Company_Type,
      Amount_Raised_AUMs,
      created_at
    FROM Companies
    WHERE Company_Name IS NOT NULL AND Company_Name <> ''
    ORDER BY Company_Name ASC
  `,
  )
}

function createCompany(payload = {}) {
  const name = normalizeNullableString(payload.Company_Name)
  if (!name) throw new Error('Company name is required')
  const companyType = normalizeNullableString(payload.Company_Type)
  if (!companyType) throw new Error('Company type is required')

  const database = initDb()
  const roundsCountColumn = getCompaniesRoundsCountColumn(database)

  const existing = database
    .prepare('SELECT id, Company_Name FROM Companies WHERE Company_Name = ? LIMIT 1')
    .get(name)

  const id = normalizeNullableString(payload.id) || existing?.id || `company:${crypto.randomUUID()}`
  const roundsCount =
    normalizeNullableNumber(payload.Rounds_Opportunities_Count) ??
    normalizeNullableNumber(payload.Rounds_Funds_Count)

  const fields = {
    id,
    Company_Name: name,
    Company_Type: companyType,
    One_Liner: normalizeNullableString(payload.One_Liner),
    Status: normalizeNullableString(payload.Status),
    Date_of_Incorporation: normalizeNullableString(payload.Date_of_Incorporation),
    Amount_Raised_AUMs: normalizeNullableNumber(payload.Amount_Raised_AUMs),
    Rounds_Count: roundsCount,
    Pax: normalizeNullableNumber(payload.Pax),
    Updates: normalizeNullableString(payload.Updates),
    Website: normalizeNullableString(payload.Website),
  }

  const tx = database.transaction(() => {
    if (!existing) {
      database
        .prepare(
          `
          INSERT INTO Companies (
            id, Company_Name, Company_Type, One_Liner, Status, Date_of_Incorporation,
            Amount_Raised_AUMs${roundsCountColumn ? `, ${roundsCountColumn}` : ''}, Pax, Updates, Website
          ) VALUES (
            @id, @Company_Name, @Company_Type, @One_Liner, @Status, @Date_of_Incorporation,
            @Amount_Raised_AUMs${roundsCountColumn ? ', @Rounds_Count' : ''}, @Pax, @Updates, @Website
          )
        `,
        )
        .run(fields)
      return
    }

    // If the company already existed, only patch in non-null fields.
    database
      .prepare(
        `
        UPDATE Companies SET
          Company_Type = COALESCE(@Company_Type, Company_Type),
          One_Liner = COALESCE(@One_Liner, One_Liner),
          Status = COALESCE(@Status, Status),
          Date_of_Incorporation = COALESCE(@Date_of_Incorporation, Date_of_Incorporation),
          Amount_Raised_AUMs = COALESCE(@Amount_Raised_AUMs, Amount_Raised_AUMs),
          ${roundsCountColumn ? `${roundsCountColumn} = COALESCE(@Rounds_Count, ${roundsCountColumn}),` : ''}
          Pax = COALESCE(@Pax, Pax),
          Updates = COALESCE(@Updates, Updates),
          Website = COALESCE(@Website, Website),
          updated_at = datetime('now')
        WHERE id = @id
      `,
      )
      .run(fields)
  })

  tx()

  return { id, Company_Name: name }
}

function listOpportunities() {
  return dbAll(
    `
    SELECT
      o.id,
      o.kind,
      o.company_id,
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
      COALESCE(
        o.Venture_Oppty_Name,
        CASE
          WHEN c.Company_Name IS NOT NULL AND c.Company_Name <> '' THEN
            replace(trim(c.Company_Name), ' ', '_') || '_' || substr(COALESCE(o.created_at, datetime('now')), 1, 10)
          ELSE o.id
        END
      ) AS opportunity_name,
      o.Venture_Oppty_Name,
      o.Round_Stage,
      o.Round_Amount,
      f.Fund_Type,
      f.Fund_Size_Target,
      o.Investment_Ask,
      o.Raising_Status,
      o.created_at,
      c.Company_Name
    FROM Opportunities o
    LEFT JOIN Companies c ON c.id = o.company_id
    LEFT JOIN Fund_Opportunities f ON f.opportunity_id = o.id
    ORDER BY o.created_at DESC
  `,
  )
}

function listContacts() {
  return dbAll(
    `
    SELECT
      id,
      Name,
      Email,
      Phone,
      Role,
      Stakeholder_type,
      created_at
    FROM Contacts
    ORDER BY COALESCE(Name, '') ASC, created_at DESC
  `,
  )
}

function listDatabooks() {
  return dbAll(
    `
    SELECT
      o.id AS opportunity_id,
      COALESCE(
        o.Venture_Oppty_Name,
        CASE
          WHEN c.Company_Name IS NOT NULL AND c.Company_Name <> '' THEN
            replace(trim(c.Company_Name), ' ', '_') || '_' || substr(COALESCE(o.created_at, datetime('now')), 1, 10)
          ELSE o.id
        END
      ) AS opportunity_name,
      o.kind,
      o.Raising_Status,
      o.created_at
    FROM Opportunities o
    LEFT JOIN Companies c ON c.id = o.company_id
    ORDER BY o.created_at DESC
  `,
  )
}

function listDatabookVersions(opportunityId) {
  const oid = String(opportunityId || '').trim()
  if (!oid) throw new Error('opportunityId is required')
  return dbAll(
    `
    SELECT
      id,
      opportunity_id,
      created_at,
      created_by_uuid,
      created_by_label
    FROM databook_snapshots
    WHERE opportunity_id = ?
    ORDER BY datetime(created_at) DESC, id DESC
  `,
    [oid],
  )
}

function getDatabookSnapshot(snapshotId) {
  const sid = String(snapshotId || '').trim()
  if (!sid) throw new Error('snapshotId is required')
  const row = dbAll(
    `
    SELECT
      id,
      opportunity_id,
      payload_json,
      created_at,
      created_by_uuid,
      created_by_label
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

function getDatabookView(opportunityId) {
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
              id, Name, Email, Phone, LinkedIn, Role, Stakeholder_type, Closeness_Level,
              Comment, Expertise, Degrees_Program, University, Credentials, Tenure_at_Firm_yrs, Country_based
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
        id AS project_id,
        Project_Name,
        Status AS project_status,
        Priority_Level AS project_priority,
        Due_Date AS project_due_date
      FROM Projects
      WHERE id IN (${placeholders})
      ORDER BY COALESCE(Project_Name, ''), id
    `,
  )

  const directTaskIds = readEdgeIds(
    [
      'Tasks_Opportunities_tasks',
      'Tasks_Opportunities_tasks_fund',
      'Tasks_Opportunities_related_round',
      'Tasks_Opportunities_related_fund',
      'Tasks_Funds_tasks',
      'Tasks_Funds_related_round',
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
        id AS task_id,
        Task_Name,
        Status AS task_status,
        Priority AS task_priority,
        Due_Date AS task_due_date
      FROM Tasks
      WHERE id IN (${placeholders})
      ORDER BY COALESCE(Due_Date, ''), COALESCE(Task_Name, ''), id
    `,
  )

  const artifacts = hasTable('Artifacts')
    ? dbAll(
        `
        SELECT
          a.artifact_id,
          a.title AS artifact_title,
          a.artifact_type,
          a.status AS artifact_status,
          a.pipeline_id,
          a.stage_id,
          a.fs_path,
          a.created_at AS artifact_created_at
        FROM Artifacts a
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
    const companyRow = database
      .prepare(
        `
        SELECT
          id, Company_Name, Company_Type, Website, One_Liner, Status,
          Date_of_Incorporation, Amount_Raised_AUMs, Pax, Updates
        FROM Companies
        WHERE id = ?
        LIMIT 1
      `,
      )
      .get(opportunity.company_id)
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
        tableName: 'Companies',
        recordId: companyRow.id,
        fieldName: 'Company_Type',
        idColumn: 'id',
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
        tableName: 'Companies',
        recordId: companyRow.id,
        fieldName: 'Status',
        idColumn: 'id',
      })
      addField({
        section: 'Company',
        label: 'Date of Incorporation',
        value: companyRow.Date_of_Incorporation,
        tableName: 'Companies',
        recordId: companyRow.id,
        fieldName: 'Date_of_Incorporation',
        idColumn: 'id',
      })
      addField({
        section: 'Company',
        label: 'Amount Raised / AUMs',
        value: companyRow.Amount_Raised_AUMs,
        tableName: 'Companies',
        recordId: companyRow.id,
        fieldName: 'Amount_Raised_AUMs',
        idColumn: 'id',
      })
      addField({
        section: 'Company',
        label: 'Pax',
        value: companyRow.Pax,
        tableName: 'Companies',
        recordId: companyRow.id,
        fieldName: 'Pax',
        idColumn: 'id',
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
      label: 'Email',
      value: primaryContact.Email,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Email',
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
      label: 'Role',
      value: primaryContact.Role,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Role',
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
      label: 'Stakeholder Type',
      value: primaryContact.Stakeholder_type,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Stakeholder_type',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'Closeness Level',
      value: primaryContact.Closeness_Level,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Closeness_Level',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'Comment',
      value: primaryContact.Comment,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Comment',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'Expertise',
      value: primaryContact.Expertise,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Expertise',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'Degrees Program',
      value: primaryContact.Degrees_Program,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Degrees_Program',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'University',
      value: primaryContact.University,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'University',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'Credentials',
      value: primaryContact.Credentials,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Credentials',
      idColumn: 'id',
    })
    addField({
      section: 'Primary Contact',
      label: 'Tenure at Firm (yrs)',
      value: primaryContact.Tenure_at_Firm_yrs,
      tableName: 'Contacts',
      recordId: primaryContact.id,
      fieldName: 'Tenure_at_Firm_yrs',
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
      tableName: 'Projects',
      recordId: project.project_id,
      fieldName: 'Status',
      idColumn: 'id',
    })
    addField({
      section: prefix,
      label: 'Priority',
      value: project.project_priority,
      tableName: 'Projects',
      recordId: project.project_id,
      fieldName: 'Priority_Level',
      idColumn: 'id',
    })
    addField({
      section: prefix,
      label: 'Due Date',
      value: project.project_due_date,
      tableName: 'Projects',
      recordId: project.project_id,
      fieldName: 'Due_Date',
      idColumn: 'id',
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
      tableName: 'Tasks',
      recordId: task.task_id,
      fieldName: 'Status',
      idColumn: 'id',
    })
    addField({
      section: prefix,
      label: 'Priority',
      value: task.task_priority,
      tableName: 'Tasks',
      recordId: task.task_id,
      fieldName: 'Priority',
      idColumn: 'id',
    })
    addField({
      section: prefix,
      label: 'Due Date',
      value: task.task_due_date,
      tableName: 'Tasks',
      recordId: task.task_id,
      fieldName: 'Due_Date',
      idColumn: 'id',
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
    addField({
      section: prefix,
      label: 'Status',
      value: artifact.artifact_status,
      tableName: 'Artifacts',
      recordId: artifact.artifact_id,
      fieldName: 'status',
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
      opportunity_name: opportunity.opportunity_name || opportunity.Venture_Oppty_Name || opportunity.id,
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
      primary_contact_email: primaryContact?.Email || null,
      primary_contact_phone: primaryContact?.Phone || null,
      primary_contact_role: primaryContact?.Role || null,
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

function createContact(payload = {}) {
  const database = initDb()
  const id = normalizeNullableString(payload.id) || `contact:${crypto.randomUUID()}`
  const name = normalizeNullableString(payload.Name)
  if (!name) throw new Error('Contact name is required')

  database
    .prepare(
      `
      INSERT INTO Contacts (
        id, Name, Email, Phone, LinkedIn, Role, Stakeholder_type, Closeness_Level,
        Comment, Expertise, Degrees_Program, University, Credentials, Tenure_at_Firm_yrs, Country_based
      ) VALUES (
        @id, @Name, @Email, @Phone, @LinkedIn, @Role, @Stakeholder_type, @Closeness_Level,
        @Comment, @Expertise, @Degrees_Program, @University, @Credentials, @Tenure_at_Firm_yrs, @Country_based
      )
    `,
    )
    .run({
      id,
      Name: name,
      Email: normalizeNullableString(payload.Email),
      Phone: normalizeNullableString(payload.Phone),
      LinkedIn: normalizeNullableString(payload.LinkedIn),
      Role: normalizeNullableString(payload.Role),
      Stakeholder_type: normalizeNullableString(payload.Stakeholder_type),
      Closeness_Level: normalizeNullableString(payload.Closeness_Level),
      Comment: normalizeNullableString(payload.Comment),
      Expertise: normalizeNullableString(payload.Expertise),
      Degrees_Program: normalizeNullableString(payload.Degrees_Program),
      University: normalizeNullableString(payload.University),
      Credentials: normalizeNullableString(payload.Credentials),
      Tenure_at_Firm_yrs: normalizeNullableNumber(payload.Tenure_at_Firm_yrs),
      Country_based: normalizeNullableString(payload.Country_based),
    })

  return { id }
}

function listArtifacts() {
  return dbAll(
    `
    SELECT
      a.artifact_id,
      a.title,
      a.artifact_type,
      a.status,
      a.fs_path,
      a.opportunity_id,
      a.pipeline_id,
      a.stage_id,
      a.created_at
    FROM Artifacts a
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

async function deleteArtifact(artifactId) {
  const database = initDb()
  const id = String(artifactId || '').trim()
  if (!id) throw new Error('artifactId is required')

  const artifact = database
    .prepare('SELECT artifact_id, fs_path FROM Artifacts WHERE artifact_id = ? LIMIT 1')
    .get(id)
  if (!artifact) return { changes: 0, file_deleted: false, cleanup_warning: null }

  const fsPath = normalizeNullableString(artifact.fs_path)
  const result = database.prepare('DELETE FROM Artifacts WHERE artifact_id = ?').run(id)

  let fileDeleted = false
  let cleanupWarning = null

  if (result.changes > 0 && fsPath) {
    const refs = Number(
      database.prepare('SELECT COUNT(*) AS c FROM Artifacts WHERE fs_path = ?').get(fsPath)?.c || 0,
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
      const id = normalizeNullableString(r?.id) || existing?.id || `company:${crypto.randomUUID()}`

      const payload = {
        id,
        Company_Name: companyName,
        Website: normalizeNullableString(r?.Website),
        Status: normalizeNullableString(r?.Status),
        Company_Type: normalizeNullableString(r?.Company_Type),
        Amount_Raised_AUMs: normalizeNullableNumber(r?.Amount_Raised_AUMs),
      }

      const result = database
        .prepare(
          `
          INSERT INTO Companies (id, Company_Name, Website, Status, Company_Type, Amount_Raised_AUMs)
          VALUES (@id, @Company_Name, @Website, @Status, @Company_Type, @Amount_Raised_AUMs)
          ON CONFLICT(id) DO UPDATE SET
            Company_Name = excluded.Company_Name,
            Website = excluded.Website,
            Status = excluded.Status,
            Company_Type = excluded.Company_Type,
            Amount_Raised_AUMs = excluded.Amount_Raised_AUMs,
            updated_at = datetime('now')
        `,
        )
        .run(payload)

      if (result.changes > 0) {
        if (existing?.id || normalizeNullableString(r?.id)) updated++
        else inserted++
      }
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

      if (!name && !normalizeNullableString(r?.Email) && !normalizeNullableString(r?.Phone)) {
        skipped++
        continue
      }

      const payload = {
        id,
        Name: name,
        Email: normalizeNullableString(r?.Email),
        Phone: normalizeNullableString(r?.Phone),
        LinkedIn: normalizeNullableString(r?.LinkedIn),
        Role: normalizeNullableString(r?.Role),
        Stakeholder_type: normalizeNullableString(r?.Stakeholder_type),
        Closeness_Level: normalizeNullableString(r?.Closeness_Level),
        Comment: normalizeNullableString(r?.Comment),
        Expertise: normalizeNullableString(r?.Expertise),
        Degrees_Program: normalizeNullableString(r?.Degrees_Program),
        University: normalizeNullableString(r?.University),
        Credentials: normalizeNullableString(r?.Credentials),
        Tenure_at_Firm_yrs: normalizeNullableNumber(r?.Tenure_at_Firm_yrs),
        Country_based: normalizeNullableString(r?.Country_based),
      }

      const exists = database.prepare('SELECT 1 FROM Contacts WHERE id = ? LIMIT 1').get(id)

      database
        .prepare(
          `
          INSERT INTO Contacts (
            id, Name, Email, Phone, LinkedIn, Role, Stakeholder_type, Closeness_Level,
            Comment, Expertise, Degrees_Program, University, Credentials, Tenure_at_Firm_yrs, Country_based
          )
          VALUES (
            @id, @Name, @Email, @Phone, @LinkedIn, @Role, @Stakeholder_type, @Closeness_Level,
            @Comment, @Expertise, @Degrees_Program, @University, @Credentials, @Tenure_at_Firm_yrs, @Country_based
          )
          ON CONFLICT(id) DO UPDATE SET
            Name = excluded.Name,
            Email = excluded.Email,
            Phone = excluded.Phone,
            LinkedIn = excluded.LinkedIn,
            Role = excluded.Role,
            Stakeholder_type = excluded.Stakeholder_type,
            Closeness_Level = excluded.Closeness_Level,
            Comment = excluded.Comment,
            Expertise = excluded.Expertise,
            Degrees_Program = excluded.Degrees_Program,
            University = excluded.University,
            Credentials = excluded.Credentials,
            Tenure_at_Firm_yrs = excluded.Tenure_at_Firm_yrs,
            Country_based = excluded.Country_based,
            updated_at = datetime('now')
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
      const pipelineId = normalizeNullableString(r?.pipeline_id)
      const stageId = normalizeNullableString(r?.stage_id)
      const artifactType = normalizeNullableString(r?.artifact_type)
      const fsPath = normalizeNullableString(r?.fs_path)
      const generatedBy = normalizeNullableString(r?.generated_by) || 'user'

      if (!opportunityId || !pipelineId || !stageId || !artifactType || !fsPath) {
        skipped++
        continue
      }

      const exists = database
        .prepare('SELECT 1 FROM Artifacts WHERE artifact_id = ? LIMIT 1')
        .get(artifactId)

      const payload = {
        artifact_id: artifactId,
        pipeline_run_id: normalizeNullableString(r?.pipeline_run_id),
        opportunity_id: opportunityId,
        pipeline_id: pipelineId,
        stage_id: stageId,
        artifact_type: artifactType,
        artifact_role: normalizeNullableString(r?.artifact_role),
        artifact_format: normalizeNullableString(r?.artifact_format),
        fs_path: fsPath,
        fs_hash: normalizeNullableString(r?.fs_hash),
        fs_size_bytes: normalizeNullableNumber(r?.fs_size_bytes),
        source_artifact_id: normalizeNullableString(r?.source_artifact_id),
        generated_by: generatedBy,
        llm_provider: normalizeNullableString(r?.llm_provider),
        llm_model: normalizeNullableString(r?.llm_model),
        assistant_system_prompt_id: normalizeNullableString(r?.assistant_system_prompt_id),
        title: normalizeNullableString(r?.title),
        summary: normalizeNullableString(r?.summary),
        confidence_score: normalizeNullableNumber(r?.confidence_score),
        status: normalizeNullableString(r?.status) || 'draft',
        is_active: normalizeNullableNumber(r?.is_active) ?? 1,
      }

      try {
        database
          .prepare(
            `
            INSERT INTO Artifacts (
              artifact_id, pipeline_run_id, opportunity_id, pipeline_id, stage_id,
              artifact_type, artifact_role, artifact_format, fs_path, fs_hash, fs_size_bytes,
              source_artifact_id, generated_by, llm_provider, llm_model, assistant_system_prompt_id,
              title, summary, confidence_score, status, is_active
            )
            VALUES (
              @artifact_id, @pipeline_run_id, @opportunity_id, @pipeline_id, @stage_id,
              @artifact_type, @artifact_role, @artifact_format, @fs_path, @fs_hash, @fs_size_bytes,
              @source_artifact_id, @generated_by, @llm_provider, @llm_model, @assistant_system_prompt_id,
              @title, @summary, @confidence_score, @status, @is_active
            )
            ON CONFLICT(artifact_id) DO UPDATE SET
              pipeline_run_id = excluded.pipeline_run_id,
              opportunity_id = excluded.opportunity_id,
              pipeline_id = excluded.pipeline_id,
              stage_id = excluded.stage_id,
              artifact_type = excluded.artifact_type,
              artifact_role = excluded.artifact_role,
              artifact_format = excluded.artifact_format,
              fs_path = excluded.fs_path,
              fs_hash = excluded.fs_hash,
              fs_size_bytes = excluded.fs_size_bytes,
              source_artifact_id = excluded.source_artifact_id,
              generated_by = excluded.generated_by,
              llm_provider = excluded.llm_provider,
              llm_model = excluded.llm_model,
              assistant_system_prompt_id = excluded.assistant_system_prompt_id,
              title = excluded.title,
              summary = excluded.summary,
              confidence_score = excluded.confidence_score,
              status = excluded.status,
              is_active = excluded.is_active,
              updated_at = datetime('now')
          `,
          )
          .run(payload)

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

let companiesRoundsCountColumnCache = null

function getCompaniesRoundsCountColumn(database) {
  if (companiesRoundsCountColumnCache) return companiesRoundsCountColumnCache
  const cols = database.prepare('PRAGMA table_info(Companies)').all().map((c) => c?.name)
  if (cols.includes('Rounds_Opportunities_Count')) {
    companiesRoundsCountColumnCache = 'Rounds_Opportunities_Count'
    return companiesRoundsCountColumnCache
  }
  if (cols.includes('Rounds_Funds_Count')) {
    companiesRoundsCountColumnCache = 'Rounds_Funds_Count'
    return companiesRoundsCountColumnCache
  }
  companiesRoundsCountColumnCache = null
  return null
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
    .prepare('SELECT Company_Type FROM Companies WHERE id = ? LIMIT 1')
    .get(companyId)
  return String(row?.Company_Type || '')
    .trim()
    .toLowerCase() === 'asset manager'
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
  const date = dateSource || new Date().toISOString().slice(0, 10)
  return `${base}_${date}`
}

function deriveOpportunityName(database, companyId, fallbackCompanyName = null) {
  const byFallback = makeOpportunityNameFromCompany(fallbackCompanyName)
  if (byFallback) return byFallback
  if (!companyId) return null
  const row = database
    .prepare('SELECT Company_Name FROM Companies WHERE id = ? LIMIT 1')
    .get(companyId)
  return makeOpportunityNameFromCompany(row?.Company_Name)
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
      throw new Error(
        `Invalid number "${text}". Use formats like 1000000, 1,000,000, 1M, 2.5K.`,
      )
    }
    const normalized = text.replaceAll(',', '').replace(/\s+/g, '')
    const parts = normalized.match(/^([+-]?(?:\d+|\d*\.\d+))([kKmMbB])?$/)
    if (!parts) {
      throw new Error(
        `Invalid number "${text}". Use formats like 1000000, 1,000,000, 1M, 2.5K.`,
      )
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
  if (message.includes('Saving is blocked: set your user label before editing.')) return message
  return message
}

function stringifyEventValue(value) {
  if (value === undefined || value === null) return null
  return String(value)
}

const APP_SETTING_KEYS = {
  openaiApiKey: 'openai_api_key',
  geminiApiKey: 'gemini_api_key',
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
  const actor = getAuditActor(database)
  return {
    ...apiSettings,
    auditUserUuid: actor.user_uuid,
    auditUserLabel: actor.user_label || '',
  }
}

function setApiSettings(payload = {}) {
  const database = initDb()
  const openaiApiKey = normalizeNullableString(payload?.openaiApiKey)
  const geminiApiKey = normalizeNullableString(payload?.geminiApiKey)
  const hasAuditUserLabel = Object.prototype.hasOwnProperty.call(payload || {}, 'auditUserLabel')
  const auditUserLabel = normalizeNullableString(payload?.auditUserLabel)

  setAppSetting(database, APP_SETTING_KEYS.openaiApiKey, openaiApiKey)
  setAppSetting(database, APP_SETTING_KEYS.geminiApiKey, geminiApiKey)
  if (hasAuditUserLabel) {
    if (!auditUserLabel) throw new Error('user_label is required')
    getAuditActor(database)
    setAppSetting(database, 'user_label', auditUserLabel)
  }
  return getSettingsPayload(database)
}

function ensureAuditActor(database) {
  const existingUuid = normalizeNullableString(getAppSetting(database, 'user_uuid'))
  const userUuid = existingUuid || `user:${crypto.randomUUID()}`
  if (!existingUuid) setAppSetting(database, 'user_uuid', userUuid)
  const userLabel = normalizeNullableString(getAppSetting(database, 'user_label'))
  return { user_uuid: userUuid, user_label: userLabel }
}

function getAuditActor(database, { requireLabel = false } = {}) {
  const actor = ensureAuditActor(database)
  if (requireLabel && !actor.user_label) {
    throw new Error('Saving is blocked: set your user label before editing.')
  }
  return actor
}

function setAuditUserLabel(label) {
  const database = initDb()
  const trimmed = normalizeNullableString(label)
  if (!trimmed) throw new Error('user_label is required')
  getAuditActor(database)
  setAppSetting(database, 'user_label', trimmed)
  return getAuditActor(database)
}

function listEvents(filters = {}) {
  const database = initDb()
  const where = []
  const params = []
  const tableName = normalizeNullableString(filters.table_name)
  const recordId = normalizeNullableString(filters.record_id)
  const editedByUuid = normalizeNullableString(filters.edited_by_uuid)
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
  if (editedByUuid) {
    where.push('edited_by_uuid = ?')
    params.push(editedByUuid)
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
        edited_by_uuid,
        edited_by_label,
        edited_at
      FROM events
      ${whereSql}
      ORDER BY edited_at DESC, id DESC
      LIMIT ?
    `,
    )
    .all(...params, limit)
}

function applyAuditedChanges(changes = [], { createDatabookSnapshotForOpportunityId = null } = {}) {
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

  const actor = getAuditActor(database, { requireLabel: true })

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
        throw new Error(
          `Record not found in ${change.table_name}: ${idColumn}=${change.record_id}`,
        )
      }

      const oldValue = currentRow.value
      const newValue = coerceValueForColumn(change.new_value, tableMeta.types[change.field_name])
      if (oldValue === newValue) continue

      const hasUpdatedAt = tableMeta.columnsSet.has('updated_at') && change.field_name !== 'updated_at'
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
            edited_by_uuid, edited_by_label, edited_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `,
        )
        .run(
          `event:${crypto.randomUUID()}`,
          change.table_name,
          change.record_id,
          change.field_name,
          stringifyEventValue(oldValue),
          stringifyEventValue(newValue),
          actor.user_uuid,
          actor.user_label,
        )
      eventsCreated += 1
    }

    let snapshotId = null
    if (createDatabookSnapshotForOpportunityId) {
      const snapshotPayload = getDatabookView(createDatabookSnapshotForOpportunityId)
      snapshotId = `snapshot:${crypto.randomUUID()}`
      database
        .prepare(
          `
          INSERT INTO databook_snapshots (
            id, opportunity_id, payload_json, created_by_uuid, created_by_label, created_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        `,
        )
        .run(
          snapshotId,
          createDatabookSnapshotForOpportunityId,
          JSON.stringify(snapshotPayload),
          actor.user_uuid,
          actor.user_label,
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
    'Company_Type',
    'One_Liner',
    'Status',
    'Date_of_Incorporation',
    'Amount_Raised_AUMs',
    'Rounds_Opportunities_Count',
    'Rounds_Funds_Count',
    'Pax',
    'Updates',
    'Website',
  ])
  if (!hasMeaningfulValue(companyFields.Company_Name)) return fallbackCompanyId

  const existing = database
    .prepare('SELECT id FROM Companies WHERE Company_Name = ? LIMIT 1')
    .get(normalizeNullableString(companyFields.Company_Name))
  const id =
    normalizeNullableString(companyFields.id) || normalizeNullableString(fallbackCompanyId) || existing?.id
  const result = createCompany({
    ...companyFields,
    id,
    Company_Type: normalizeNullableString(companyFields.Company_Type) || 'Other',
  })
  return normalizeNullableString(result?.id) || normalizeNullableString(id)
}

function createOrUpdatePrimaryContactForOpportunity(database, opportunityId, kind, contactPayload = {}) {
  const payload = pickMeaningfulFields(contactPayload, [
    'id',
    'Name',
    'Email',
    'Phone',
    'LinkedIn',
    'Role',
    'Stakeholder_type',
    'Closeness_Level',
    'Comment',
    'Expertise',
    'Degrees_Program',
    'University',
    'Credentials',
    'Tenure_at_Firm_yrs',
    'Country_based',
  ])
  if (!hasMeaningfulValue(payload.Name) && !hasMeaningfulValue(payload.Email) && !hasMeaningfulValue(payload.Phone)) {
    return null
  }

  const email = normalizeNullableString(payload.Email)
  const existing =
    email &&
    database.prepare('SELECT id FROM Contacts WHERE Email = ? ORDER BY updated_at DESC LIMIT 1').get(email)

  let contactId = normalizeNullableString(payload.id) || existing?.id
  if (!contactId) {
    contactId = `contact:${crypto.randomUUID()}`
    database
      .prepare(
        `
        INSERT INTO Contacts (
          id, Name, Email, Phone, LinkedIn, Role, Stakeholder_type, Closeness_Level,
          Comment, Expertise, Degrees_Program, University, Credentials, Tenure_at_Firm_yrs, Country_based
        ) VALUES (
          @id, @Name, @Email, @Phone, @LinkedIn, @Role, @Stakeholder_type, @Closeness_Level,
          @Comment, @Expertise, @Degrees_Program, @University, @Credentials, @Tenure_at_Firm_yrs, @Country_based
        )
      `,
      )
      .run({
        id: contactId,
        Name: normalizeNullableString(payload.Name),
        Email: normalizeNullableString(payload.Email),
        Phone: normalizeNullableString(payload.Phone),
        LinkedIn: normalizeNullableString(payload.LinkedIn),
        Role: normalizeNullableString(payload.Role),
        Stakeholder_type: normalizeNullableString(payload.Stakeholder_type),
        Closeness_Level: normalizeNullableString(payload.Closeness_Level),
        Comment: normalizeNullableString(payload.Comment),
        Expertise: normalizeNullableString(payload.Expertise),
        Degrees_Program: normalizeNullableString(payload.Degrees_Program),
        University: normalizeNullableString(payload.University),
        Credentials: normalizeNullableString(payload.Credentials),
        Tenure_at_Firm_yrs: normalizeNullableNumber(payload.Tenure_at_Firm_yrs),
        Country_based: normalizeNullableString(payload.Country_based),
      })
  } else {
    database
      .prepare(
        `
        UPDATE Contacts SET
          Name = COALESCE(@Name, Name),
          Email = COALESCE(@Email, Email),
          Phone = COALESCE(@Phone, Phone),
          LinkedIn = COALESCE(@LinkedIn, LinkedIn),
          Role = COALESCE(@Role, Role),
          Stakeholder_type = COALESCE(@Stakeholder_type, Stakeholder_type),
          Closeness_Level = COALESCE(@Closeness_Level, Closeness_Level),
          Comment = COALESCE(@Comment, Comment),
          Expertise = COALESCE(@Expertise, Expertise),
          Degrees_Program = COALESCE(@Degrees_Program, Degrees_Program),
          University = COALESCE(@University, University),
          Credentials = COALESCE(@Credentials, Credentials),
          Tenure_at_Firm_yrs = COALESCE(@Tenure_at_Firm_yrs, Tenure_at_Firm_yrs),
          Country_based = COALESCE(@Country_based, Country_based),
          updated_at = datetime('now')
        WHERE id = @id
      `,
      )
      .run({
        id: contactId,
        Name: normalizeNullableString(payload.Name),
        Email: normalizeNullableString(payload.Email),
        Phone: normalizeNullableString(payload.Phone),
        LinkedIn: normalizeNullableString(payload.LinkedIn),
        Role: normalizeNullableString(payload.Role),
        Stakeholder_type: normalizeNullableString(payload.Stakeholder_type),
        Closeness_Level: normalizeNullableString(payload.Closeness_Level),
        Comment: normalizeNullableString(payload.Comment),
        Expertise: normalizeNullableString(payload.Expertise),
        Degrees_Program: normalizeNullableString(payload.Degrees_Program),
        University: normalizeNullableString(payload.University),
        Credentials: normalizeNullableString(payload.Credentials),
        Tenure_at_Firm_yrs: normalizeNullableNumber(payload.Tenure_at_Firm_yrs),
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

function createDatabookSnapshotForOpportunity(opportunityId, { source = 'create' } = {}) {
  const database = initDb()
  const actor = getAuditActor(database)
  const snapshotPayload = getDatabookView(opportunityId)
  snapshotPayload.__meta = {
    source,
    created_at: new Date().toISOString(),
  }
  const snapshotId = `snapshot:${crypto.randomUUID()}`
  database
    .prepare(
      `
      INSERT INTO databook_snapshots (
        id, opportunity_id, payload_json, created_by_uuid, created_by_label, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `,
    )
    .run(
      snapshotId,
      opportunityId,
      JSON.stringify(snapshotPayload),
      actor.user_uuid,
      actor.user_label || 'Unknown editor',
    )
  return snapshotId
}

function createOpportunity(payload = {}) {
  const database = initDb()

  let companyId = normalizeNullableString(payload.company_id)
  if (!companyId && payload?.company) {
    companyId = upsertCompanyFromAutofill(database, payload.company, companyId)
  } else if (companyId && payload?.company) {
    upsertCompanyFromAutofill(database, payload.company, companyId)
  }
  const explicitKind = normalizeOpportunityKind(payload.kind)
  const isAssetManager = companyIsAssetManager(database, companyId)
  const kind = isAssetManager ? 'fund' : explicitKind || 'round'
  if (!companyId && kind === 'round') {
    throw new Error('company_id is required for round opportunities')
  }

  const opportunityId = normalizeNullableString(payload.id) || `opportunity:${crypto.randomUUID()}`

  const providedOpportunityName = normalizeNullableString(payload.Venture_Oppty_Name)
  const derivedOpportunityName = deriveOpportunityName(database, companyId)

  const fields = {
    id: opportunityId,
    kind,
    company_id: companyId,
    Venture_Oppty_Name: providedOpportunityName || derivedOpportunityName || opportunityId,
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
    const columns = Object.keys(fields)
    const placeholders = columns.map(() => '?').join(',')
    const values = columns.map((c) => fields[c])

    database
      .prepare(`INSERT INTO Opportunities (${columns.join(',')}) VALUES (${placeholders})`)
      .run(values)

    if (kind === 'fund') {
      upsertFundSubtype(database, opportunityId, payload)
    }

    // Ensure the opportunity has a default pipeline stage (DB-level requirement via app logic)
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

    createOrUpdatePrimaryContactForOpportunity(database, opportunityId, kind, payload.primary_contact)
  })

  insert()

  const snapshotId = createDatabookSnapshotForOpportunity(opportunityId, { source: 'autofill_create' })
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
      const companyIdFromRow = normalizeNullableString(r?.company_id)
      const companyNameFromRow = normalizeNullableString(r?.Company_Name)

      let companyId = companyIdFromRow
      if (!companyId && companyNameFromRow) {
        const existing = database
          .prepare('SELECT id FROM Companies WHERE Company_Name = ? LIMIT 1')
          .get(companyNameFromRow)
        companyId = existing?.id
        if (!companyId) {
          companyId = `company:${crypto.randomUUID()}`
          database
            .prepare("INSERT INTO Companies (id, Company_Name, Company_Type) VALUES (?, ?, 'Other')")
            .run(companyId, companyNameFromRow)
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
          normalizeNullableString(r?.Venture_Oppty_Name) ||
          deriveOpportunityName(database, companyId, companyNameFromRow) ||
          opportunityId,
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

    const dirents = await fs.readdir(resolvedPath, { withFileTypes: true })
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
      .sort((a, b) => {
        if (a.type !== b.type) {
          if (a.type === 'directory') return -1
          if (b.type === 'directory') return 1
        }
        return a.name.localeCompare(b.name)
      })

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
    return { rootPath: result.rootPath }
  })

  ipcMain.handle('settings:get', async () => {
    const database = initDb()
    return getSettingsPayload(database)
  })

  ipcMain.handle('settings:set', async (_event, payload = {}) => {
    return setApiSettings(payload)
  })

  ipcMain.handle('autofill:previewFromFiles', async (_event, payload = {}) => {
    const database = initDb()
    const apiSettings = getApiSettings(database)
    return previewAutofillFromFiles({
      filePaths: payload?.filePaths || [],
      apiKeys: { gemini: apiSettings.geminiApiKey },
    })
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
    return upsertPipelines(rows)
  })

  ipcMain.handle('pipelines:create', async (_event, payload) => {
    initDb()
    return createPipeline(payload)
  })

  ipcMain.handle('pipelines:delete', async (_event, { pipelineId } = {}) => {
    initDb()
    const pid = String(pipelineId || '')
    if (!pid) throw new Error('pipelineId is required')
    if (pid === 'pipeline_default') throw new Error('Cannot delete the default pipeline')
    return deleteRow('Pipelines', 'pipeline_id', pid)
  })

  ipcMain.handle('companies:list', async () => {
    initDb()
    return { companies: listCompanies() }
  })

  ipcMain.handle('companies:create', async (_event, payload) => {
    initDb()
    return createCompany(payload)
  })

  ipcMain.handle('companies:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    return upsertCompanies(rows)
  })

  ipcMain.handle('companies:delete', async (_event, { companyId } = {}) => {
    initDb()
    return deleteRow('Companies', 'id', String(companyId || ''))
  })

  ipcMain.handle('opportunities:list', async () => {
    initDb()
    return { opportunities: listOpportunities() }
  })

  ipcMain.handle('opportunities:create', async (_event, payload) => {
    initDb()
    return createOpportunity(payload)
  })

  ipcMain.handle('opportunities:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    return upsertOpportunities(rows)
  })

  ipcMain.handle('opportunities:delete', async (_event, { opportunityId } = {}) => {
    initDb()
    return deleteRow('Opportunities', 'id', String(opportunityId || ''))
  })

  ipcMain.handle('databooks:list', async () => {
    initDb()
    return { databooks: listDatabooks() }
  })

  ipcMain.handle('databooks:view', async (_event, { opportunityId } = {}) => {
    initDb()
    return getDatabookView(opportunityId)
  })

  ipcMain.handle('databooks:versions', async (_event, { opportunityId } = {}) => {
    initDb()
    return { versions: listDatabookVersions(opportunityId) }
  })

  ipcMain.handle('databooks:viewSnapshot', async (_event, { snapshotId } = {}) => {
    initDb()
    return getDatabookSnapshot(snapshotId)
  })

  ipcMain.handle('databooks:update', async (_event, { opportunityId, changes } = {}) => {
    initDb()
    try {
      const oid = normalizeNullableString(opportunityId)
      if (!oid) throw new Error('opportunityId is required')
      const result = applyAuditedChanges(changes, {
        createDatabookSnapshotForOpportunityId: oid,
      })
      return {
        ...result,
        view: getDatabookView(oid),
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

  ipcMain.handle('contacts:list', async () => {
    initDb()
    return { contacts: listContacts() }
  })

  ipcMain.handle('contacts:create', async (_event, payload) => {
    initDb()
    return createContact(payload)
  })

  ipcMain.handle('contacts:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    return upsertContacts(rows)
  })

  ipcMain.handle('contacts:delete', async (_event, { contactId } = {}) => {
    initDb()
    return deleteRow('Contacts', 'id', String(contactId || ''))
  })

  ipcMain.handle('artifacts:list', async () => {
    initDb()
    return { artifacts: listArtifacts() }
  })

  ipcMain.handle('artifacts:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    return upsertArtifacts(rows)
  })

  ipcMain.handle('artifacts:delete', async (_event, { artifactId } = {}) => {
    initDb()
    return deleteArtifact(artifactId)
  })

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
        message: `Artifacts saved in ${workspace.rootPath}/0_company_docs/Artifacts`,
      })
    }
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
  ensureWorkspace()
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
