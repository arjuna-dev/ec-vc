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
  database.exec(SCHEMA_V1_SQL)
  migrateArtifactsToSubtypeSchema(database)
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

function migrateArtifactsToSubtypeSchema(database) {
  if (!hasTable(database, 'Artifacts')) return
  if (!hasColumn(database, 'Artifacts', 'artifact_type')) return

  database.exec(`
    PRAGMA foreign_keys = OFF;

    DROP TRIGGER IF EXISTS trg_Artifacts_stage_matches_pipeline_ins;
    DROP TRIGGER IF EXISTS trg_Artifacts_oppty_pipeline_exists_ins;
    DROP TRIGGER IF EXISTS trg_Artifacts_oppty_pipeline_exists_upd;
    DROP TRIGGER IF EXISTS trg_Artifacts_stage_matches_pipeline_upd;
    DROP TRIGGER IF EXISTS trg_Artifacts_updated_at;
    DROP INDEX IF EXISTS idx_Artifacts_unique_path;
    DROP INDEX IF EXISTS idx_Artifacts_source;
    DROP INDEX IF EXISTS idx_Artifacts_pipeline_stage;
    DROP INDEX IF EXISTS idx_Artifacts_oppty_pipeline_stage_created;

    ALTER TABLE Artifacts RENAME TO Artifacts_legacy;
    DROP VIEW IF EXISTS Artifact_Details;

    CREATE TABLE Artifacts (
      artifact_id TEXT PRIMARY KEY,
      pipeline_run_id TEXT,
      opportunity_id TEXT,
      pipeline_id TEXT,
      stage_id TEXT,
      created_by TEXT,
      artifact_format TEXT CHECK (
        artifact_format IS NULL OR artifact_format IN (
          'pdf','doc','docx','ppt','pptx','xls','xlsx','csv','txt','md','json','html',
          'png','jpg','jpeg','webp','gif','tif','tiff','other'
        )
      ),
      type TEXT CHECK (type IN ('raising_pitch_deck','commercial_pitch_deck','messages','emails','historical_data','forecast','other')),
      title TEXT,
      description TEXT,
      status TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (opportunity_id) REFERENCES Opportunities(id) ON DELETE SET NULL,
      FOREIGN KEY (pipeline_id) REFERENCES Pipelines(pipeline_id) ON DELETE SET NULL,
      FOREIGN KEY (stage_id) REFERENCES Pipeline_Stages(stage_id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES Contacts(id) ON DELETE SET NULL
    );

    CREATE INDEX idx_Artifacts_pipeline_stage
      ON Artifacts(pipeline_id, stage_id);

    CREATE INDEX idx_Artifacts_oppty_pipeline_stage_created
      ON Artifacts(opportunity_id, pipeline_id, stage_id, created_at);

    INSERT INTO Artifacts (
      artifact_id, pipeline_run_id, opportunity_id, pipeline_id, stage_id, created_by,
      artifact_format, type, title, description, status, created_at, updated_at
    )
    SELECT
      artifact_id,
      pipeline_run_id,
      opportunity_id,
      pipeline_id,
      stage_id,
      created_by,
      artifact_format,
      type,
      title,
      description,
      status,
      created_at,
      updated_at
    FROM Artifacts_legacy;

    INSERT INTO Artifact_Raw (artifact_id, fs_path, fs_hash, fs_size_bytes)
    SELECT artifact_id, fs_path, fs_hash, fs_size_bytes
    FROM Artifacts_legacy
    WHERE artifact_type = 'raw';

    INSERT INTO Artifact_Llm_Ready (
      artifact_id, source_artifact_id, original_artifact_id, assistant_system_prompt_id,
      generated_by, llm_provider, llm_model, fs_path, fs_hash, fs_size_bytes
    )
    SELECT
      artifact_id,
      source_artifact_id,
      original_artifact_id,
      assistant_system_prompt_id,
      CASE
        WHEN generated_by IN ('llm', 'system') THEN generated_by
        ELSE 'system'
      END,
      llm_provider,
      llm_model,
      fs_path,
      fs_hash,
      fs_size_bytes
    FROM Artifacts_legacy
    WHERE artifact_type = 'llm-ready';

    INSERT INTO Artifact_Llm_Generated (
      artifact_id, source_artifact_id, original_artifact_id, assistant_system_prompt_id,
      llm_provider, llm_model, fs_path, fs_hash, fs_size_bytes
    )
    SELECT
      artifact_id,
      source_artifact_id,
      original_artifact_id,
      assistant_system_prompt_id,
      llm_provider,
      llm_model,
      fs_path,
      fs_hash,
      fs_size_bytes
    FROM Artifacts_legacy
    WHERE artifact_type = 'llm-generated';

    ALTER TABLE Artifacts_Industries RENAME TO Artifacts_Industries_legacy;
    CREATE TABLE Artifacts_Industries (
      artifact_id TEXT NOT NULL,
      industry_id TEXT NOT NULL,
      PRIMARY KEY (artifact_id, industry_id),
      FOREIGN KEY (artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (industry_id) REFERENCES Industries(id) ON UPDATE CASCADE ON DELETE CASCADE
    );
    INSERT INTO Artifacts_Industries (artifact_id, industry_id)
    SELECT artifact_id, industry_id FROM Artifacts_Industries_legacy;

    ALTER TABLE Artifacts_Regions RENAME TO Artifacts_Regions_legacy;
    CREATE TABLE Artifacts_Regions (
      artifact_id TEXT NOT NULL,
      region_id TEXT NOT NULL,
      PRIMARY KEY (artifact_id, region_id),
      FOREIGN KEY (artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (region_id) REFERENCES Regions(id) ON UPDATE CASCADE ON DELETE CASCADE
    );
    INSERT INTO Artifacts_Regions (artifact_id, region_id)
    SELECT artifact_id, region_id FROM Artifacts_Regions_legacy;

    ALTER TABLE Artifact_Links RENAME TO Artifact_Links_legacy;
    CREATE TABLE Artifact_Links (
      from_artifact_id TEXT NOT NULL,
      to_artifact_id TEXT NOT NULL,
      link_type TEXT NOT NULL,
      PRIMARY KEY (from_artifact_id, to_artifact_id, link_type),
      FOREIGN KEY (from_artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE,
      FOREIGN KEY (to_artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE
    );
    INSERT INTO Artifact_Links (from_artifact_id, to_artifact_id, link_type)
    SELECT from_artifact_id, to_artifact_id, link_type FROM Artifact_Links_legacy;

    DROP TABLE Artifacts_legacy;
    DROP TABLE Artifacts_Industries_legacy;
    DROP TABLE Artifacts_Regions_legacy;
    DROP TABLE Artifact_Links_legacy;

    CREATE VIEW Artifact_Details AS
    SELECT
      a.artifact_id,
      a.pipeline_run_id,
      a.opportunity_id,
      a.pipeline_id,
      a.stage_id,
      a.created_by,
      a.artifact_format,
      a.type,
      a.title,
      a.description,
      a.status,
      a.created_at,
      a.updated_at,
      COALESCE(ar.fs_path, alr.fs_path, alg.fs_path) AS fs_path,
      COALESCE(ar.fs_hash, alr.fs_hash, alg.fs_hash) AS fs_hash,
      COALESCE(ar.fs_size_bytes, alr.fs_size_bytes, alg.fs_size_bytes) AS fs_size_bytes,
      COALESCE(alr.source_artifact_id, alg.source_artifact_id) AS source_artifact_id,
      COALESCE(alr.original_artifact_id, alg.original_artifact_id) AS original_artifact_id,
      COALESCE(alr.assistant_system_prompt_id, alg.assistant_system_prompt_id) AS assistant_system_prompt_id,
      CASE
        WHEN ar.artifact_id IS NOT NULL THEN 'user'
        WHEN alr.artifact_id IS NOT NULL THEN alr.generated_by
        WHEN alg.artifact_id IS NOT NULL THEN 'llm'
        ELSE NULL
      END AS generated_by,
      COALESCE(alr.llm_provider, alg.llm_provider) AS llm_provider,
      COALESCE(alr.llm_model, alg.llm_model) AS llm_model,
      CASE
        WHEN ar.artifact_id IS NOT NULL THEN 'raw'
        WHEN alr.artifact_id IS NOT NULL THEN 'llm-ready'
        WHEN alg.artifact_id IS NOT NULL THEN 'llm-generated'
        ELSE NULL
      END AS artifact_type
    FROM Artifacts a
    LEFT JOIN Artifact_Raw ar ON ar.artifact_id = a.artifact_id
    LEFT JOIN Artifact_Llm_Ready alr ON alr.artifact_id = a.artifact_id
    LEFT JOIN Artifact_Llm_Generated alg ON alg.artifact_id = a.artifact_id;

    PRAGMA foreign_keys = ON;
  `)
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
  const looksLikeOldSchema = Number(tablesCount || 0) > 0 && !looksLikeSupportedSchema

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
