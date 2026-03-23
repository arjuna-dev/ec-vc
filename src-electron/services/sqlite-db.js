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
    hasTable(probe, 'Pipelines') &&
    hasTable(probe, 'Opportunity_Pipeline') &&
    hasTable(probe, 'Round_Opportunities') &&
    hasTable(probe, 'Fund_Opportunities') &&
    hasTable(probe, 'databook_snapshots') &&
    hasColumn(probe, 'Pipelines', 'dir_name') &&
    hasColumn(probe, 'Companies', 'created_by') &&
    hasColumn(probe, 'Opportunities', 'company_id') &&
    hasColumn(probe, 'Opportunities', 'kind') &&
    hasColumn(probe, 'Contacts', 'Personal_Email') &&
    hasColumn(probe, 'Contacts', 'Professional_Email') &&
    hasColumn(probe, 'Tasks', 'pipeline_id') &&
    hasColumn(probe, 'Artifacts', 'created_by') &&
    hasColumn(probe, 'Artifacts', 'type') &&
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
