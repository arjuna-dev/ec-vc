// test-schema.mjs
import fs from 'fs'
import Database from 'better-sqlite3'
import { SCHEMA_V1_SQL } from './sqlite-schema.js'

const dbPath = '/tmp/ec10_test.db'

// delete old test DB if it exists
try {
  fs.unlinkSync(dbPath)
} catch {}

// open DB (this "starts" SQLite)
const db = new Database(dbPath)

// apply schema
db.exec(SCHEMA_V1_SQL)

// sanity check: table exists
const table = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Opportunities'")
  .get()

console.log('Opportunities table exists:', !!table)

// insert test row
db.prepare(
  `
  INSERT INTO Opportunities (
    url,
    Venture_Oppty_Name,
    Round_Stage,
    Created_Date
  ) VALUES (?, ?, ?, ?)
`,
).run('https://example.com/oppty/1', 'ExampleCo Seed', 'Seed', '2026-01-29')

// read back
const rows = db
  .prepare(
    `
  SELECT url, Venture_Oppty_Name, Round_Stage, Created_Date
  FROM Opportunities
`,
  )
  .all()

console.log('Rows:', rows)

db.close()
console.log('✅ Schema test passed. DB at', dbPath)
