import path from 'node:path'
import fse from 'fs-extra'
import { app } from 'electron'
import Database from 'better-sqlite3'

import { SCHEMA_V1_SQL } from './sqlite-schema.js'

let db = null

export function initDb() {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'ecvc.sqlite3')
  fse.ensureDirSync(path.dirname(dbPath))

  maybeRecreateDb(dbPath)

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')
  db.pragma('busy_timeout = 5000')

  migrate(db)

  return db
}

export function getDbInfo() {
  const database = initDb()
  return {
    path: database.name,
    userVersion: database.pragma('user_version', { simple: true }),
  }
}

export function closeDb() {
  if (!db) return
  db.close()
  db = null
}

function migrate(database) {
  const userVersion = database.pragma('user_version', { simple: true })

  if (userVersion < 1) {
    database.exec(SCHEMA_V1_SQL)
    database.pragma('user_version = 1')
  }

  const afterV1 = database.pragma('user_version', { simple: true })
  if (afterV1 < 2) {
    migrateToV2(database)
    database.pragma('user_version = 2')
  }
}

export function dbAll(sql, params = []) {
  const database = initDb()
  return database.prepare(String(sql)).all(params)
}

export function dbRun(sql, params = []) {
  const database = initDb()
  const result = database.prepare(String(sql)).run(params)
  return {
    changes: result.changes,
    lastInsertRowid: result.lastInsertRowid?.toString?.() ?? result.lastInsertRowid,
  }
}

function maybeRecreateDb(dbPath) {
  if (!fse.pathExistsSync(dbPath)) return

  const probe = new Database(dbPath)
  const userVersion = probe.pragma('user_version', { simple: true })
  const tablesCount = probe
    .prepare(
      "SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .get()?.c
  const hasPipelines = hasTable(probe, 'Pipelines')
  const hasOpportunityPipeline = hasTable(probe, 'Opportunity_Pipeline')
  const pipelinesHasDirName = hasColumn(probe, 'Pipelines', 'dir_name')
  const opportunitiesHasCompanyId = hasColumn(probe, 'Opportunities', 'company_id')
  probe.close()

  const looksLikeSupportedSchema =
    (userVersion === 1 || userVersion === 2) &&
    hasPipelines &&
    hasOpportunityPipeline &&
    pipelinesHasDirName &&
    opportunitiesHasCompanyId
  const looksLikeOldSchema =
    (userVersion === 0 && Number(tablesCount || 0) > 0) ||
    (userVersion >= 1 && !looksLikeSupportedSchema)

  if (!looksLikeOldSchema) return

  fse.removeSync(dbPath)
  fse.removeSync(`${dbPath}-wal`)
  fse.removeSync(`${dbPath}-shm`)
}

function hasTable(database, tableName) {
  return !!database
    .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=? LIMIT 1")
    .get(String(tableName))
}

function hasColumn(database, tableName, columnName) {
  const cols = database.prepare(`PRAGMA table_info(${String(tableName)})`).all()
  return cols.some((c) => c?.name === String(columnName))
}

function artifactsTableHasNewChecks(database) {
  const row = database
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='Artifacts' LIMIT 1")
    .get()
  const sql = String(row?.sql || '')
  return /artifact_type\s+IN\s*\('raw','llm-ready','llm-generated'\)/.test(sql)
}

function migrateToV2(database) {
  // v2 ensures the Artifacts artifact_type CHECK matches the app values.
  // Some earlier local DBs used ('raw_input','derived','final','note','event'), causing inserts to fail.
  if (!hasTable(database, 'Artifacts')) return
  if (artifactsTableHasNewChecks(database)) return

  const oldCols = database.prepare('PRAGMA table_info(Artifacts)').all().map((c) => c?.name)
  const hasCol = (name) => oldCols.includes(String(name))

  const selectExpr = (col) => (hasCol(col) ? `"${col}"` : 'NULL')
  const createdAtExpr = hasCol('created_at') ? 'created_at' : "datetime('now')"
  const updatedAtExpr = hasCol('updated_at') ? 'updated_at' : "datetime('now')"

  database.exec('PRAGMA foreign_keys = OFF;')
  database.exec('BEGIN;')

  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS Artifacts_new (
        artifact_id TEXT PRIMARY KEY,
        pipeline_run_id TEXT,
        opportunity_id TEXT,
        pipeline_id TEXT,
        stage_id TEXT,
        artifact_type TEXT NOT NULL CHECK (artifact_type IN ('raw','llm-ready','llm-generated')),
        artifact_role TEXT,
        artifact_format TEXT,
        fs_path TEXT NOT NULL,
        fs_hash TEXT,
        fs_size_bytes INTEGER,
        source_artifact_id TEXT,
        original_artifact_id TEXT,
        generated_by TEXT NOT NULL CHECK (generated_by IN ('user','llm','system')),
        llm_provider TEXT,
        llm_model TEXT,
        assistant_system_prompt_id TEXT,
        title TEXT,
        summary TEXT,
        confidence_score REAL,
        status TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (opportunity_id) REFERENCES Opportunities(id) ON DELETE SET NULL,
        FOREIGN KEY (pipeline_id) REFERENCES Pipelines(pipeline_id) ON DELETE SET NULL,
        FOREIGN KEY (stage_id) REFERENCES Pipeline_Stages(stage_id) ON DELETE SET NULL,
        FOREIGN KEY (source_artifact_id) REFERENCES Artifacts_new(artifact_id) ON DELETE SET NULL,
        FOREIGN KEY (original_artifact_id) REFERENCES Artifacts_new(artifact_id) ON DELETE SET NULL,
        FOREIGN KEY (assistant_system_prompt_id) REFERENCES Assistant_System_Prompts(assistant_system_prompt_id) ON DELETE SET NULL
      );
    `)

    database.exec(`
      INSERT INTO Artifacts_new (
        artifact_id,
        pipeline_run_id,
        opportunity_id,
        pipeline_id,
        stage_id,
        artifact_type,
        artifact_role,
        artifact_format,
        fs_path,
        fs_hash,
        fs_size_bytes,
        source_artifact_id,
        original_artifact_id,
        generated_by,
        llm_provider,
        llm_model,
        assistant_system_prompt_id,
        title,
        summary,
        confidence_score,
        status,
        created_at,
        updated_at
      )
      SELECT
        ${selectExpr('artifact_id')},
        ${selectExpr('pipeline_run_id')},
        ${selectExpr('opportunity_id')},
        ${selectExpr('pipeline_id')},
        ${selectExpr('stage_id')},
        CASE ${selectExpr('artifact_type')}
          WHEN 'raw_input' THEN 'raw'
          WHEN 'derived' THEN 'llm-ready'
          WHEN 'final' THEN 'llm-generated'
          WHEN 'note' THEN 'llm-generated'
          WHEN 'event' THEN 'llm-generated'
          ELSE ${selectExpr('artifact_type')}
        END,
        ${selectExpr('artifact_role')},
        ${selectExpr('artifact_format')},
        ${selectExpr('fs_path')},
        ${selectExpr('fs_hash')},
        ${selectExpr('fs_size_bytes')},
        ${selectExpr('source_artifact_id')},
        ${selectExpr('original_artifact_id')},
        ${selectExpr('generated_by')},
        ${selectExpr('llm_provider')},
        ${selectExpr('llm_model')},
        ${selectExpr('assistant_system_prompt_id')},
        ${selectExpr('title')},
        ${selectExpr('summary')},
        ${selectExpr('confidence_score')},
        ${selectExpr('status')},
        ${createdAtExpr},
        ${updatedAtExpr}
      FROM Artifacts;
    `)

    database.exec('DROP TABLE Artifacts;')
    database.exec('ALTER TABLE Artifacts_new RENAME TO Artifacts;')

    database.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_Artifacts_unique_path
        ON Artifacts(fs_path);
      CREATE INDEX IF NOT EXISTS idx_Artifacts_pipeline_stage
        ON Artifacts(pipeline_id, stage_id);
      CREATE INDEX IF NOT EXISTS idx_Artifacts_source
        ON Artifacts(source_artifact_id);
      CREATE INDEX IF NOT EXISTS idx_Artifacts_oppty_pipeline_stage_created
        ON Artifacts(opportunity_id, pipeline_id, stage_id, created_at);
    `)

    database.exec('COMMIT;')
  } catch (e) {
    database.exec('ROLLBACK;')
    throw e
  } finally {
    database.exec('PRAGMA foreign_keys = ON;')
  }
}
