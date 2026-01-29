import path from 'node:path'
import fse from 'fs-extra'
import { app } from 'electron'
import Database from 'better-sqlite3'

import { SCHEMA_V1_SQL, SCHEMA_V2_SQL } from './sqlite-schema.js'

let db = null

export function initDb () {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'ecvc.sqlite3')
  fse.ensureDirSync(path.dirname(dbPath))

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  migrate(db)

  return db
}

export function getDbInfo () {
  const database = initDb()
  return {
    path: database.name,
    userVersion: database.pragma('user_version', { simple: true }),
  }
}

export function closeDb () {
  if (!db) return
  db.close()
  db = null
}

function migrate (database) {
  let userVersion = database.pragma('user_version', { simple: true })

  if (userVersion < 1) {
    database.exec(SCHEMA_V1_SQL)
    database.pragma('user_version = 1')
    userVersion = 1
  }

  if (userVersion < 2) {
    database.exec(SCHEMA_V2_SQL)
    database.pragma('user_version = 2')
    userVersion = 2
  }
}

export function dbAll (sql, params = []) {
  const database = initDb()
  return database.prepare(String(sql)).all(params)
}

export function dbRun (sql, params = []) {
  const database = initDb()
  const result = database.prepare(String(sql)).run(params)
  return {
    changes: result.changes,
    lastInsertRowid: result.lastInsertRowid?.toString?.() ?? result.lastInsertRowid,
  }
}
