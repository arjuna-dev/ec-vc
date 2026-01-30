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

  const database = initDb()

  const existing = database
    .prepare('SELECT id, Company_Name FROM Companies WHERE Company_Name = ? LIMIT 1')
    .get(name)

  const id = normalizeNullableString(payload.id) || existing?.id || `company:${crypto.randomUUID()}`

  const fields = {
    id,
    Company_Name: name,
    Company_Type: normalizeNullableString(payload.Company_Type),
    One_Liner: normalizeNullableString(payload.One_Liner),
    Status: normalizeNullableString(payload.Status),
    Date_of_Incorporation: normalizeNullableString(payload.Date_of_Incorporation),
    Amount_Raised_AUMs: normalizeNullableNumber(payload.Amount_Raised_AUMs),
    Rounds_Funds_Count: normalizeNullableNumber(payload.Rounds_Funds_Count),
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
            Amount_Raised_AUMs, Rounds_Funds_Count, Pax, Updates, Website
          ) VALUES (
            @id, @Company_Name, @Company_Type, @One_Liner, @Status, @Date_of_Incorporation,
            @Amount_Raised_AUMs, @Rounds_Funds_Count, @Pax, @Updates, @Website
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
          Rounds_Funds_Count = COALESCE(@Rounds_Funds_Count, Rounds_Funds_Count),
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
      o.company_id,
      o.Venture_Oppty_Name,
      o.Round_Stage,
      o.Round_Amount,
      o.created_at,
      c.Company_Name
    FROM Opportunities o
    JOIN Companies c ON c.id = o.company_id
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

function listFunds() {
  return dbAll(
    `
    SELECT
      id,
      Fund_Oppty_Name,
      Fund_Type,
      Fund_Size_Target,
      Investment_Ask,
      Raising_Status,
      created_at
    FROM Funds
    ORDER BY created_at DESC
  `,
  )
}

function createFund(payload = {}) {
  const database = initDb()
  const id = normalizeNullableString(payload.id) || `fund:${crypto.randomUUID()}`
  const name = normalizeNullableString(payload.Fund_Oppty_Name)
  if (!name) throw new Error('Fund name is required')

  database
    .prepare(
      `
      INSERT INTO Funds (
        id, Fund_Oppty_Name, Fund_Type, Fund_Size_Target, Investment_Ask, Hard_Commits, Soft_Commits,
        Initial_Ticket_Size, Target_Positions, Follow_on_Reserve, Investment_Stages, Company_Stages,
        First_Close_Date, Next_Close_Date, Final_Close_Date, Pipeline_Stage, Pipeline_Status, Raising_Status
      ) VALUES (
        @id, @Fund_Oppty_Name, @Fund_Type, @Fund_Size_Target, @Investment_Ask, @Hard_Commits, @Soft_Commits,
        @Initial_Ticket_Size, @Target_Positions, @Follow_on_Reserve, @Investment_Stages, @Company_Stages,
        @First_Close_Date, @Next_Close_Date, @Final_Close_Date, @Pipeline_Stage, @Pipeline_Status, @Raising_Status
      )
    `,
    )
    .run({
      id,
      Fund_Oppty_Name: name,
      Fund_Type: normalizeNullableString(payload.Fund_Type),
      Fund_Size_Target: normalizeNullableNumber(payload.Fund_Size_Target),
      Investment_Ask: normalizeNullableNumber(payload.Investment_Ask),
      Hard_Commits: normalizeNullableNumber(payload.Hard_Commits),
      Soft_Commits: normalizeNullableNumber(payload.Soft_Commits),
      Initial_Ticket_Size: normalizeNullableNumber(payload.Initial_Ticket_Size),
      Target_Positions: normalizeNullableNumber(payload.Target_Positions),
      Follow_on_Reserve: normalizeNullableNumber(payload.Follow_on_Reserve),
      Investment_Stages: normalizeNullableString(payload.Investment_Stages),
      Company_Stages: normalizeNullableString(payload.Company_Stages),
      First_Close_Date: normalizeNullableString(payload.First_Close_Date),
      Next_Close_Date: normalizeNullableString(payload.Next_Close_Date),
      Final_Close_Date: normalizeNullableString(payload.Final_Close_Date),
      Raising_Status: normalizeNullableString(payload.Raising_Status),
      Pipeline_Status: normalizeNullableString(payload.Pipeline_Status),
      Pipeline_Stage: normalizeNullableString(payload.Pipeline_Stage),
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

function upsertFunds(rows = []) {
  const database = initDb()
  const input = Array.isArray(rows) ? rows : []

  const tx = database.transaction(() => {
    let inserted = 0
    let updated = 0
    let skipped = 0

    for (const r of input) {
      const id = normalizeNullableString(r?.id) || `fund:${crypto.randomUUID()}`
      const name = normalizeNullableString(r?.Fund_Oppty_Name)

      if (!name) {
        skipped++
        continue
      }

      const payload = {
        id,
        Fund_Oppty_Name: name,
        Fund_Type: normalizeNullableString(r?.Fund_Type),
        Fund_Size_Target: normalizeNullableNumber(r?.Fund_Size_Target),
        Investment_Ask: normalizeNullableNumber(r?.Investment_Ask),
        Hard_Commits: normalizeNullableNumber(r?.Hard_Commits),
        Soft_Commits: normalizeNullableNumber(r?.Soft_Commits),
        Initial_Ticket_Size: normalizeNullableNumber(r?.Initial_Ticket_Size),
        Target_Positions: normalizeNullableNumber(r?.Target_Positions),
        Follow_on_Reserve: normalizeNullableNumber(r?.Follow_on_Reserve),
        Investment_Stages: normalizeNullableString(r?.Investment_Stages),
        Company_Stages: normalizeNullableString(r?.Company_Stages),
        First_Close_Date: normalizeNullableString(r?.First_Close_Date),
        Next_Close_Date: normalizeNullableString(r?.Next_Close_Date),
        Final_Close_Date: normalizeNullableString(r?.Final_Close_Date),
        Pipeline_Stage: normalizeNullableString(r?.Pipeline_Stage),
        Pipeline_Status: normalizeNullableString(r?.Pipeline_Status),
        Raising_Status: normalizeNullableString(r?.Raising_Status),
      }

      const exists = database.prepare('SELECT 1 FROM Funds WHERE id = ? LIMIT 1').get(id)

      database
        .prepare(
          `
          INSERT INTO Funds (
            id, Fund_Oppty_Name, Fund_Type, Fund_Size_Target, Investment_Ask, Hard_Commits, Soft_Commits,
            Initial_Ticket_Size, Target_Positions, Follow_on_Reserve, Investment_Stages, Company_Stages,
            First_Close_Date, Next_Close_Date, Final_Close_Date, Pipeline_Stage, Pipeline_Status, Raising_Status
          )
          VALUES (
            @id, @Fund_Oppty_Name, @Fund_Type, @Fund_Size_Target, @Investment_Ask, @Hard_Commits, @Soft_Commits,
            @Initial_Ticket_Size, @Target_Positions, @Follow_on_Reserve, @Investment_Stages, @Company_Stages,
            @First_Close_Date, @Next_Close_Date, @Final_Close_Date, @Pipeline_Stage, @Pipeline_Status, @Raising_Status
          )
          ON CONFLICT(id) DO UPDATE SET
            Fund_Oppty_Name = excluded.Fund_Oppty_Name,
            Fund_Type = excluded.Fund_Type,
            Fund_Size_Target = excluded.Fund_Size_Target,
            Investment_Ask = excluded.Investment_Ask,
            Hard_Commits = excluded.Hard_Commits,
            Soft_Commits = excluded.Soft_Commits,
            Initial_Ticket_Size = excluded.Initial_Ticket_Size,
            Target_Positions = excluded.Target_Positions,
            Follow_on_Reserve = excluded.Follow_on_Reserve,
            Investment_Stages = excluded.Investment_Stages,
            Company_Stages = excluded.Company_Stages,
            First_Close_Date = excluded.First_Close_Date,
            Next_Close_Date = excluded.Next_Close_Date,
            Final_Close_Date = excluded.Final_Close_Date,
            Pipeline_Stage = excluded.Pipeline_Stage,
            Pipeline_Status = excluded.Pipeline_Status,
            Raising_Status = excluded.Raising_Status,
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

function createOpportunity(payload = {}) {
  const database = initDb()

  const companyId = normalizeNullableString(payload.company_id)
  if (!companyId) throw new Error('company_id is required')

  const opportunityId = normalizeNullableString(payload.id) || `opportunity:${crypto.randomUUID()}`

  const fields = {
    id: opportunityId,
    company_id: companyId,
    Venture_Oppty_Name: normalizeNullableString(payload.Venture_Oppty_Name),
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
  })

  insert()

  return { id: opportunityId }
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
            .prepare('INSERT INTO Companies (id, Company_Name) VALUES (?, ?)')
            .run(companyId, companyNameFromRow)
        }
      }

      if (!companyId) {
        skipped++
        continue
      }

      const opportunityId = normalizeNullableString(r?.id) || `opportunity:${crypto.randomUUID()}`

      const payload = {
        id: opportunityId,
        company_id: companyId,
        Venture_Oppty_Name: normalizeNullableString(r?.Venture_Oppty_Name),
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
            id, company_id, Venture_Oppty_Name, Round_Stage, Type_of_Security,
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
            @id, @company_id, @Venture_Oppty_Name, @Round_Stage, @Type_of_Security,
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
            company_id = excluded.company_id,
            Venture_Oppty_Name = excluded.Venture_Oppty_Name,
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

  ipcMain.handle('funds:list', async () => {
    initDb()
    return { funds: listFunds() }
  })

  ipcMain.handle('funds:create', async (_event, payload) => {
    initDb()
    return createFund(payload)
  })

  ipcMain.handle('funds:upsertMany', async (_event, { rows } = {}) => {
    initDb()
    return upsertFunds(rows)
  })

  ipcMain.handle('funds:delete', async (_event, { fundId } = {}) => {
    initDb()
    return deleteRow('Funds', 'id', String(fundId || ''))
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
    return deleteRow('Artifacts', 'artifact_id', String(artifactId || ''))
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
  initDb()
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
