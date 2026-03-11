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
  ensureTasksPipelineColumn(database)
  ensureArtifactsCompatibilityColumns(database)
  database.exec(SCHEMA_V1_SQL)
  ensureGenericDatabookSnapshots(database)
  cleanupLegacyOpportunityTriggers(database)
  ensureUserContactForeignKey(database)
  ensureArtifactLinkTriggersAllowUnlinkedArtifacts(database)
  database.pragma('user_version = 1')
}

function ensureGenericDatabookSnapshots(database) {
  if (!hasTable(database, 'databook_snapshots')) return

  const hasTableName = hasColumn(database, 'databook_snapshots', 'table_name')
  const hasRecordId = hasColumn(database, 'databook_snapshots', 'record_id')
  if (hasTableName && hasRecordId) {
    database.exec(`
      CREATE INDEX IF NOT EXISTS idx_databook_snapshots_record
      ON databook_snapshots(table_name, record_id, created_at)
    `)
    return
  }

  database.exec(`
    ALTER TABLE databook_snapshots RENAME TO databook_snapshots_legacy;

    CREATE TABLE databook_snapshots (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_by_uuid TEXT NOT NULL,
      created_by_label TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_databook_snapshots_record
      ON databook_snapshots(table_name, record_id, created_at);

    INSERT INTO databook_snapshots (
      id, table_name, record_id, payload_json, created_by_uuid, created_by_label, created_at
    )
    SELECT
      id,
      'Opportunities',
      opportunity_id,
      payload_json,
      created_by_uuid,
      created_by_label,
      created_at
    FROM databook_snapshots_legacy;

    DROP TABLE databook_snapshots_legacy;
  `)
}

function cleanupLegacyOpportunityTriggers(database) {
  const legacyTriggers = database
    .prepare(
      `
      SELECT name
      FROM sqlite_master
      WHERE type = 'trigger'
        AND sql LIKE '%fund opportunities must not have company_id%'
    `,
    )
    .all()

  for (const row of legacyTriggers) {
    const triggerName = String(row?.name || '').trim()
    if (!triggerName) continue
    database.exec(`DROP TRIGGER IF EXISTS "${triggerName.replaceAll('"', '""')}"`)
  }
}

function ensureUserContactForeignKey(database) {
  database.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_app_settings_user_contact_fk_insert
    BEFORE INSERT ON app_settings
    WHEN NEW.key = 'user_contact_id' AND NEW.value IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM Contacts WHERE id = NEW.value)
    BEGIN
      SELECT RAISE(ABORT, 'Invalid user contact reference');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_app_settings_user_contact_fk_update
    BEFORE UPDATE OF value ON app_settings
    WHEN NEW.key = 'user_contact_id' AND NEW.value IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM Contacts WHERE id = NEW.value)
    BEGIN
      SELECT RAISE(ABORT, 'Invalid user contact reference');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_contacts_user_contact_delete_restrict
    BEFORE DELETE ON Contacts
    WHEN EXISTS (
      SELECT 1
      FROM app_settings
      WHERE key = 'user_contact_id' AND value = OLD.id
    )
    BEGIN
      SELECT RAISE(ABORT, 'Cannot delete the contact linked as the current user');
    END;
  `)
}

function ensureTasksPipelineColumn(database) {
  if (!hasTable(database, 'Tasks')) return
  if (hasColumn(database, 'Tasks', 'pipeline_id')) return
  database.exec('ALTER TABLE Tasks ADD COLUMN pipeline_id TEXT')
}

function ensureArtifactsCompatibilityColumns(database) {
  if (!hasTable(database, 'Artifacts')) return

  const requiredColumns = [
    ['pipeline_run_id', 'TEXT'],
    ['pipeline_id', 'TEXT'],
    ['stage_id', 'TEXT'],
    ['source_artifact_id', 'TEXT'],
    ['original_artifact_id', 'TEXT'],
    ['assistant_system_prompt_id', 'TEXT'],
    ['created_by', 'TEXT'],
    ["artifact_type", "TEXT NOT NULL DEFAULT 'raw'"],
    ['artifact_role', 'TEXT'],
    ['artifact_format', 'TEXT'],
    ['generated_by', "TEXT NOT NULL DEFAULT 'user'"],
    ['llm_provider', 'TEXT'],
    ['llm_model', 'TEXT'],
    ['title', 'TEXT'],
    ['summary', 'TEXT'],
    ['confidence_score', 'REAL'],
    ['status', 'TEXT'],
  ]

  for (const [columnName, columnType] of requiredColumns) {
    if (hasColumn(database, 'Artifacts', columnName)) continue
    database.exec(`ALTER TABLE Artifacts ADD COLUMN ${columnName} ${columnType}`)
  }
}

function ensureArtifactLinkTriggersAllowUnlinkedArtifacts(database) {
  database.exec(`
    DROP TRIGGER IF EXISTS trg_Artifacts_stage_matches_pipeline_ins;
    DROP TRIGGER IF EXISTS trg_Artifacts_oppty_pipeline_exists_ins;
    DROP TRIGGER IF EXISTS trg_Artifacts_oppty_pipeline_exists_upd;
    DROP TRIGGER IF EXISTS trg_Artifacts_stage_matches_pipeline_upd;

    CREATE TRIGGER IF NOT EXISTS trg_Artifacts_stage_matches_pipeline_ins
    BEFORE INSERT ON Artifacts
    FOR EACH ROW
    WHEN NEW.stage_id IS NOT NULL AND NEW.pipeline_id IS NOT NULL
    BEGIN
      SELECT
        CASE
          WHEN NOT EXISTS (
            SELECT 1
            FROM Pipeline_Stages s
            WHERE s.stage_id = NEW.stage_id
              AND s.pipeline_id = NEW.pipeline_id
          )
          THEN RAISE(ABORT, 'artifact stage_id does not belong to artifact pipeline_id')
        END;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_Artifacts_oppty_pipeline_exists_ins
    BEFORE INSERT ON Artifacts
    FOR EACH ROW
    WHEN NEW.opportunity_id IS NOT NULL AND NEW.pipeline_id IS NOT NULL
    BEGIN
      SELECT CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM Opportunity_Pipeline op
          WHERE op.opportunity_id = NEW.opportunity_id
            AND op.pipeline_id = NEW.pipeline_id
        )
        THEN RAISE(ABORT, 'artifact opportunity_id is not linked to pipeline_id in Opportunity_Pipeline')
      END;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_Artifacts_oppty_pipeline_exists_upd
    BEFORE UPDATE OF opportunity_id, pipeline_id ON Artifacts
    FOR EACH ROW
    WHEN NEW.opportunity_id IS NOT NULL AND NEW.pipeline_id IS NOT NULL
    BEGIN
      SELECT CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM Opportunity_Pipeline op
          WHERE op.opportunity_id = NEW.opportunity_id
            AND op.pipeline_id = NEW.pipeline_id
        )
        THEN RAISE(ABORT, 'artifact opportunity_id is not linked to pipeline_id in Opportunity_Pipeline')
      END;
    END;

    CREATE TRIGGER IF NOT EXISTS trg_Artifacts_stage_matches_pipeline_upd
    BEFORE UPDATE OF stage_id, pipeline_id ON Artifacts
    FOR EACH ROW
    WHEN NEW.stage_id IS NOT NULL AND NEW.pipeline_id IS NOT NULL
    BEGIN
      SELECT CASE
        WHEN NOT EXISTS (
          SELECT 1 FROM Pipeline_Stages s
          WHERE s.stage_id = NEW.stage_id AND s.pipeline_id = NEW.pipeline_id
        )
        THEN RAISE(ABORT, 'artifact stage_id does not belong to artifact pipeline_id')
      END;
    END;
  `)
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
  const hasRoundOpportunities = hasTable(probe, 'Round_Opportunities')
  const hasFundOpportunities = hasTable(probe, 'Fund_Opportunities')
  const pipelinesHasDirName = hasColumn(probe, 'Pipelines', 'dir_name')
  const opportunitiesHasCompanyId = hasColumn(probe, 'Opportunities', 'company_id')
  const opportunitiesHasKind = hasColumn(probe, 'Opportunities', 'kind')
  probe.close()

  const looksLikeSupportedSchema =
    userVersion === 1 &&
    hasPipelines &&
    hasOpportunityPipeline &&
    hasRoundOpportunities &&
    hasFundOpportunities &&
    pipelinesHasDirName &&
    opportunitiesHasCompanyId &&
    opportunitiesHasKind
  const looksLikeOldSchema =
    Number(tablesCount || 0) > 0 && !looksLikeSupportedSchema

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
