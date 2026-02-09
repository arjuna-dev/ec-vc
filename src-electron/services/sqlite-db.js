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
