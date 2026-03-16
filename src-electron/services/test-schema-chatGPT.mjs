// test-schema.mjs
// Comprehensive schema validation for your SQLite/better-sqlite3 schema.
// Usage:
//   node test-schema.mjs [./path/to/your/schema-module.mjs] [optional-db-path]
//
// The schema module must export: SCHEMA_V1_SQL (string)
// Example: export const SCHEMA_V1_SQL = `BEGIN; ... COMMIT;`

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const Database = require('better-sqlite3')

const schemaModulePath = process.argv[2] ?? './schema.mjs'
const providedDbPath = process.argv[3] ?? null

function logOk(name) {
  console.log(`✅ ${name}`)
}
function logFail(name, err) {
  console.error(`❌ ${name}`)
  console.error(err?.stack ?? err)
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms))
}

async function runTest(name, fn) {
  try {
    await fn()
    logOk(name)
  } catch (err) {
    logFail(name, err)
    process.exitCode = 1
  }
}

function mkTempDbPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-test-'))
  return path.join(dir, 'test.sqlite')
}

function execPragmas(db) {
  // Match your runtime settings (WAL requires a file-backed DB).
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')
  db.pragma('busy_timeout = 5000')
}

function querySingle(db, sql, params = []) {
  return db.prepare(sql).get(...params)
}

function queryAll(db, sql, params = []) {
  return db.prepare(sql).all(...params)
}

function mustThrow(fn, containsMsg) {
  let threw = false
  try {
    fn()
  } catch (e) {
    threw = true
    if (containsMsg) {
      const msg = String(e?.message ?? e)
      assert(
        msg.includes(containsMsg),
        `Expected error message to include "${containsMsg}", got: ${msg}`,
      )
    }
  }
  assert(threw, 'Expected function to throw, but it did not.')
}

function tableExists(db, name) {
  const row = querySingle(db, `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [
    name,
  ])
  return !!row
}

function indexExists(db, indexName) {
  const row = querySingle(db, `SELECT name FROM sqlite_master WHERE type='index' AND name=?`, [
    indexName,
  ])
  return !!row
}

function nowRow(db, table, pkCol, pkVal) {
  return querySingle(db, `SELECT * FROM ${table} WHERE ${pkCol}=?`, [pkVal])
}

function integrityCheck(db) {
  const r = querySingle(db, 'PRAGMA integrity_check;')
  assert.equal(r.integrity_check, 'ok')
}

function fkCheck(db) {
  const rows = queryAll(db, 'PRAGMA foreign_key_check;')
  assert.equal(rows.length, 0, `foreign_key_check failed:\n${JSON.stringify(rows, null, 2)}`)
}

function safeUnlink(filePath) {
  try {
    fs.rmSync(path.dirname(filePath), { recursive: true, force: true })
  } catch {
    // ignore
  }
}

const dbPath = providedDbPath ?? mkTempDbPath()

// --- Main
let db
let SCHEMA_V1_SQL

await runTest('Load schema module (must export SCHEMA_V1_SQL)', async () => {
  const abs = path.isAbsolute(schemaModulePath)
    ? schemaModulePath
    : path.resolve(process.cwd(), schemaModulePath)

  const mod = await import(pathToFileUrl(abs))
  assert.equal(typeof mod.SCHEMA_V1_SQL, 'string', 'SCHEMA_V1_SQL must be a string export')
  SCHEMA_V1_SQL = mod.SCHEMA_V1_SQL
})

await runTest('Open DB + pragmas', async () => {
  db = new Database(dbPath)
  execPragmas(db)
  const fk = querySingle(db, 'PRAGMA foreign_keys;')
  assert.equal(fk.foreign_keys, 1, 'foreign_keys pragma must be ON')
})

await runTest('Execute schema SQL', async () => {
  db.exec(SCHEMA_V1_SQL)
  integrityCheck(db)
  fkCheck(db)
})

await runTest('Core tables exist', async () => {
  const requiredTables = [
    'Companies',
    'Opportunities',
    'Funds',
    'LVPortfolio',
    'InvestmentSchedule',
    'Contacts',
    'EPL_Business_Units',
    'Projects',
    'Tasks',
    'IC_Scorecard',
    'Intros',
    'Industries',
    'SectorGroups',
    'VerticalIndustries',
    'BusinessModels',
    'Locations',
    'Countries',
    'Cities',
    'VC_Terms_Glossary',
    'Control_Terms_Description',
    'Resources',
    'PipelineInvestmentProcess',
    // pipeline subsystem
    'Assistant_System_Prompts',
    'Pipelines',
    'Pipeline_Stages',
    'Opportunity_Pipeline',
    'Fund_Pipeline',
    'Artifacts',
    'Artifact_Raw',
    'Artifact_Llm_Ready',
    'Artifact_Llm_Generated',
    'Artifacts_Industries',
    'Artifacts_Regions',
    'Artifact_Links',
  ]

  for (const t of requiredTables) {
    assert.equal(tableExists(db, t), true, `Missing table: ${t}`)
  }
})

await runTest('Important indexes exist (spot-check)', async () => {
  assert.equal(indexExists(db, 'idx_Companies_company_name'), true)
  assert.equal(indexExists(db, 'idx_Opportunities_company_id'), true)
  assert.equal(indexExists(db, 'idx_Pipelines_single_default'), true)
  assert.equal(indexExists(db, 'idx_Pipelines_dir_name'), true)
  assert.equal(indexExists(db, 'idx_Artifact_Raw_unique_path'), true)
})

await runTest('Seeded default pipeline exists + stages inserted', async () => {
  const p = querySingle(db, `SELECT * FROM Pipelines WHERE pipeline_id='pipeline_default'`)
  assert.ok(p, 'Expected pipeline_default row to exist')

  const stages = queryAll(
    db,
    `SELECT * FROM Pipeline_Stages WHERE pipeline_id='pipeline_default' ORDER BY position ASC`,
  )
  assert.equal(stages.length, 5, 'Expected 5 seeded stages for pipeline_default')
})

await runTest('Companies unique index enforced', async () => {
  const ins = db.prepare(`INSERT INTO Companies (id, Company_Name) VALUES (?, ?)`)
  ins.run('c1', 'Acme')
  mustThrow(() => ins.run('c2', 'Acme'), 'UNIQUE')
})

await runTest('Opportunities FK to Companies enforced + RESTRICT delete works', async () => {
  db.prepare(`INSERT OR IGNORE INTO Companies (id, Company_Name) VALUES (?,?)`).run('c_fk', 'FKCo')
  db.prepare(`INSERT INTO Opportunities (id, company_id, Venture_Oppty_Name) VALUES (?,?,?)`).run(
    'o1',
    'c_fk',
    'Round 1',
  )

  // can't insert opportunity with non-existent company
  mustThrow(
    () =>
      db.prepare(`INSERT INTO Opportunities (id, company_id) VALUES (?,?)`).run('o_bad', 'nope'),
    'FOREIGN KEY',
  )

  // can't delete company while opportunity exists (RESTRICT)
  mustThrow(() => db.prepare(`DELETE FROM Companies WHERE id=?`).run('c_fk'), 'FOREIGN KEY')
})

await runTest('Join table CASCADE behavior sanity check', async () => {
  db.prepare(`INSERT INTO Countries (id, Country_Name) VALUES (?,?)`).run('ct1', 'Country1')
  db.prepare(`INSERT INTO Locations (id, Name) VALUES (?,?)`).run('l1', 'Location1')

  db.prepare(`INSERT INTO Countries_Locations_has_locations (from_id, to_id) VALUES (?,?)`).run(
    'ct1',
    'l1',
  )

  const before = queryAll(
    db,
    `SELECT * FROM Countries_Locations_has_locations WHERE from_id=? AND to_id=?`,
    ['ct1', 'l1'],
  )
  assert.equal(before.length, 1)

  // deleting the country should cascade delete join row
  db.prepare(`DELETE FROM Countries WHERE id=?`).run('ct1')

  const after = queryAll(
    db,
    `SELECT * FROM Countries_Locations_has_locations WHERE from_id=? AND to_id=?`,
    ['ct1', 'l1'],
  )
  assert.equal(after.length, 0)
})

await runTest('Pipeline stage must belong to pipeline (Opportunity_Pipeline trigger)', async () => {
  // make a second pipeline + stage
  db.prepare(`INSERT INTO Pipelines (pipeline_id, name, dir_name) VALUES (?,?,?)`).run(
    'p2',
    'Pipeline2',
    'pipeline_2',
  )
  db.prepare(
    `INSERT INTO Pipeline_Stages (stage_id, pipeline_id, name, position) VALUES (?,?,?,?)`,
  ).run('p2_s1', 'p2', 'stage1', 1)

  // create a company + opportunity
  db.prepare(`INSERT OR IGNORE INTO Companies (id, Company_Name) VALUES (?,?)`).run(
    'c_pipe',
    'PipeCo',
  )
  db.prepare(`INSERT OR IGNORE INTO Opportunities (id, company_id) VALUES (?,?)`).run(
    'o_pipe',
    'c_pipe',
  )

  // This should FAIL: pipeline_id='pipeline_default' but stage_id belongs to p2
  mustThrow(
    () =>
      db
        .prepare(
          `INSERT INTO Opportunity_Pipeline (opportunity_id, pipeline_id, stage_id) VALUES (?,?,?)`,
        )
        .run('o_pipe', 'pipeline_default', 'p2_s1'),
    'stage_id does not belong to pipeline_id',
  )

  // This should PASS
  const defaultStage = querySingle(
    db,
    `SELECT stage_id FROM Pipeline_Stages WHERE pipeline_id='pipeline_default' ORDER BY position LIMIT 1`,
  ).stage_id

  db.prepare(
    `INSERT INTO Opportunity_Pipeline (opportunity_id, pipeline_id, stage_id, status) VALUES (?,?,?,?)`,
  ).run('o_pipe', 'pipeline_default', defaultStage, 'active')
})

await runTest('Fund_Pipeline stage must belong to pipeline (trigger)', async () => {
  db.prepare(`INSERT OR IGNORE INTO Funds (id, Fund_Oppty_Name) VALUES (?,?)`).run('f1', 'Fund1')

  // mismatch stage should fail
  mustThrow(
    () =>
      db
        .prepare(`INSERT INTO Fund_Pipeline (fund_id, pipeline_id, stage_id) VALUES (?,?,?)`)
        .run('f1', 'pipeline_default', 'p2_s1'),
    'fund stage_id does not belong to pipeline_id',
  )

  // match stage should pass
  const defaultStage = querySingle(
    db,
    `SELECT stage_id FROM Pipeline_Stages WHERE pipeline_id='pipeline_default' ORDER BY position LIMIT 1`,
  ).stage_id

  db.prepare(`INSERT INTO Fund_Pipeline (fund_id, pipeline_id, stage_id) VALUES (?,?,?)`).run(
    'f1',
    'pipeline_default',
    defaultStage,
  )
})

await runTest('Artifacts can be inserted by opportunity without pipeline mapping', async () => {
    // Make a new opportunity without Opportunity_Pipeline mapping
    db.prepare(`INSERT OR IGNORE INTO Companies (id, Company_Name) VALUES (?,?)`).run(
      'c_art',
      'ArtCo',
    )
    db.prepare(`INSERT OR IGNORE INTO Opportunities (id, company_id) VALUES (?,?)`).run(
      'o_no_map',
      'c_art',
    )

    db.prepare(
      `INSERT INTO Artifacts (
        artifact_id, opportunity_id, title
      ) VALUES (?,?,?)`,
    ).run('a_ok', 'o_no_map', 'ok artifact')
    db.prepare(
      `INSERT INTO Artifact_Raw (artifact_id, fs_path, fs_hash, fs_size_bytes) VALUES (?,?,?,?)`,
    ).run('a_ok', '/tmp/a_ok.txt', null, null)
})

await runTest('updated_at triggers work (Companies + Artifacts spot-check)', async () => {
  // Companies
  db.prepare(`INSERT OR IGNORE INTO Companies (id, Company_Name) VALUES (?,?)`).run('c_up', 'UpCo')
  const before = nowRow(db, 'Companies', 'id', 'c_up').updated_at

  await sleep(1100) // datetime('now') is 1-second resolution
  db.prepare(`UPDATE Companies SET One_Liner=? WHERE id=?`).run('changed', 'c_up')

  const after = nowRow(db, 'Companies', 'id', 'c_up').updated_at
  assert.notEqual(after, before, 'Companies.updated_at should change after UPDATE')

  // Artifacts
  db.prepare(`INSERT OR IGNORE INTO Opportunities (id, company_id) VALUES (?,?)`).run(
    'o_up',
    'c_up',
  )

  db.prepare(
    `INSERT OR IGNORE INTO Artifacts (
      artifact_id, opportunity_id, title
    ) VALUES (?,?,?)`,
  ).run('a_up', 'o_up', 'up artifact')
  db.prepare(
    `INSERT OR IGNORE INTO Artifact_Raw (artifact_id, fs_path, fs_hash, fs_size_bytes) VALUES (?,?,?,?)`,
  ).run('a_up', '/tmp/a_up.txt', null, null)

  const aBefore = nowRow(db, 'Artifacts', 'artifact_id', 'a_up').updated_at
  await sleep(1100)
  db.prepare(`UPDATE Artifacts SET title=? WHERE artifact_id=?`).run('new title', 'a_up')
  const aAfter = nowRow(db, 'Artifacts', 'artifact_id', 'a_up').updated_at

  assert.notEqual(aAfter, aBefore, 'Artifacts.updated_at should change after UPDATE')
})

await runTest('Final integrity_check + foreign_key_check', async () => {
  integrityCheck(db)
  fkCheck(db)
})

await runTest('Close DB', async () => {
  db.close()
})

// Cleanup temp db if we created it
if (!providedDbPath) {
  safeUnlink(dbPath)
}

// Helpers
function pathToFileUrl(p) {
  // Minimal file URL conversion that works on Windows too
  let resolved = path.resolve(p)
  if (process.platform === 'win32') {
    resolved = resolved.replace(/\\/g, '/')
    return new URL(`file:///${resolved}`)
  }
  return new URL(`file://${resolved}`)
}
