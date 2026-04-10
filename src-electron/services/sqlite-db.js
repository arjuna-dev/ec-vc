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
  db.exec(SCHEMA_V1_SQL)
  ensureColumn(db, 'events', 'payload_json', 'TEXT')
  ensureColumn(db, 'Companion_Roles', 'Companion_Role_Type', 'TEXT')
  ensureColumn(db, 'Companion_Roles', 'Companion_Role_Status', 'TEXT')
  ensureColumn(db, 'Companion_Roles', 'Companion_Role_Contract_Path', 'TEXT')
  db.pragma('user_version = 1')

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

  const probe = new Database(dbPath, { readonly: true })
  const tablesCount = probe
    .prepare(
      "SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    )
    .get()?.c

  const hasCurrentSchema =
    hasTable(probe, 'Projects') &&
    hasTable(probe, 'Project_Overview') &&
    hasTable(probe, 'Project_Stages') &&
    hasTable(probe, 'Round_Pipeline') &&
    hasTable(probe, 'Fund_Pipeline') &&
    hasTable(probe, 'Rounds') &&
    hasTable(probe, 'Funds') &&
    hasTable(probe, 'Round_Overview') &&
    hasTable(probe, 'Fund_Overview') &&
    hasTable(probe, 'Users') &&
    hasTable(probe, 'databook_snapshots') &&
    hasColumn(probe, 'Projects', 'Project_Name') &&
    hasColumn(probe, 'Project_Overview', 'install_status') &&
    hasColumn(probe, 'Project_Stages', 'project_id') &&
    hasColumn(probe, 'Companies', 'created_by') &&
    hasColumn(probe, 'Rounds', 'Round_Name') &&
    hasColumn(probe, 'Funds', 'Fund_Name') &&
    hasColumn(probe, 'Users', 'User_PEmail') &&
    hasColumn(probe, 'Contacts', 'Personal_Email') &&
    hasColumn(probe, 'Contacts', 'Professional_Email') &&
    hasColumn(probe, 'Contacts', 'linked_user_id') &&
    hasTable(probe, 'Owner_DB') &&
    hasColumn(probe, 'Owner_DB', 'owner_user_id') &&
    hasColumn(probe, 'events', 'action_id') &&
    hasColumn(probe, 'events', 'action_label') &&
    hasColumn(probe, 'events', 'payload_json') &&
    hasTable(probe, 'Roles') &&
    hasColumn(probe, 'Roles', 'Role_Name') &&
    hasColumn(probe, 'Roles', 'Role_Summary') &&
    hasTable(probe, 'Companion_Roles') &&
    hasColumn(probe, 'Companion_Roles', 'Companion_Role_Name') &&
    hasColumn(probe, 'Companion_Roles', 'Companion_Role_Summary') &&
    hasTable(probe, 'Users_Roles') &&
    hasColumn(probe, 'Users_Roles', 'user_id') &&
    hasColumn(probe, 'Users_Roles', 'role_id') &&
    hasColumn(probe, 'Markets', 'Market_Summary') &&
    hasTable(probe, 'Securities') &&
    hasColumn(probe, 'Securities', 'Security_Name') &&
    hasColumn(probe, 'Securities', 'Security_Summary') &&
    hasColumn(probe, 'Artifacts', 'created_by') &&
    hasColumn(probe, 'Artifacts', 'type') &&
    hasColumn(probe, 'Artifacts', 'round_id') &&
    hasColumn(probe, 'Artifacts', 'fund_id') &&
    hasTable(probe, 'Artifacts_Processed') &&
    hasColumn(probe, 'Artifacts_Processed', 'Processed_Artifact_Name') &&
    hasColumn(probe, 'Artifacts_Processed', 'Original_Artifact_Id') &&
    hasTable(probe, 'KDB_Relationships') &&
    hasColumn(probe, 'KDB_Relationships', 'source_entity') &&
    hasColumn(probe, 'KDB_Relationships', 'source_token') &&
    hasColumn(probe, 'KDB_Relationships', 'target_entity') &&
    hasColumn(probe, 'KDB_Relationships', 'target_record_id') &&
    hasTable(probe, 'Field_Verification_Metadata') &&
    hasColumn(probe, 'Field_Verification_Metadata', 'table_name') &&
    hasColumn(probe, 'Field_Verification_Metadata', 'record_id') &&
    hasColumn(probe, 'Field_Verification_Metadata', 'field_name') &&
    hasColumn(probe, 'Field_Verification_Metadata', 'state') &&
    hasColumn(probe, 'Field_Verification_Metadata', 'source') &&
    hasColumn(probe, 'databook_snapshots', 'table_name') &&
    hasColumn(probe, 'databook_snapshots', 'record_id')

  probe.close()

  const hasExistingSchema = Number(tablesCount || 0) > 0
  if (!hasExistingSchema || hasCurrentSchema) return

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
  if (!hasTable(database, tableName)) return false
  const cols = database.prepare(`PRAGMA table_info(${String(tableName)})`).all()
  return cols.some((c) => c?.name === String(columnName))
}

function ensureColumn(database, tableName, columnName, columnSql) {
  if (hasColumn(database, tableName, columnName)) return
  database.exec(`ALTER TABLE ${String(tableName)} ADD COLUMN ${String(columnName)} ${String(columnSql)}`)
}
