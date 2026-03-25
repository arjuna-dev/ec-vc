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
    'Funds',
    'Fund_Overview',
    'Fund_Strategy',
    'Fund_Economics',
    'Fund_Controls',
    'Rounds',
    'Round_Overview',
    'Round_Economics',
    'Round_Controls',
    'LVPortfolio',
    'InvestmentSchedule',
    'Users',
    'Contacts',
    'EPL_Business_Units',
    'Projects',
    'Project_Overview',
    'Project_Team',
    'Project_Team_Lead',
    'Project_Team_Senior',
    'Project_Team_Mid',
    'Project_Team_Junior',
    'Project_Team_Agents',
    'Project_Stages',
    'Tasks',
    'Task_Overview',
    'Task_Team',
    'Task_Team_Assigned',
    'Task_Team_Support',
    'IC_Scorecard',
    'Intros',
    'Industries',
    'SectorGroups',
    'VerticalIndustries',
    'BusinessModels',
    'Regions',
    'VC_Terms_Glossary',
    'Control_Terms_Description',
    'Resources',
    'PipelineInvestmentProcess',
    // pipeline subsystem
    'Assistant_System_Prompts',
    'Round_Pipeline',
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
  assert.equal(indexExists(db, 'idx_Round_Overview_sponsor_company_id'), true)
  assert.equal(indexExists(db, 'idx_Project_Team_owner'), true)
  assert.equal(indexExists(db, 'idx_Round_Pipeline_pipeline'), true)
  assert.equal(indexExists(db, 'idx_Artifact_Raw_unique_path'), true)
})

await runTest('Seeded default pipeline exists + stages inserted', async () => {
  const p = querySingle(db, `SELECT * FROM Projects WHERE id='pipeline_default'`)
  assert.ok(p, 'Expected pipeline_default row to exist')

  const overview = querySingle(db, `SELECT * FROM Project_Overview WHERE project_id='pipeline_default'`)
  assert.ok(overview, 'Expected overview row for pipeline_default')

  const stages = queryAll(
    db,
    `SELECT * FROM Project_Stages WHERE project_id='pipeline_default' ORDER BY position ASC`,
  )
  assert.equal(stages.length, 5, 'Expected 5 seeded stages for pipeline_default')
})

await runTest('Companies unique index enforced', async () => {
  const ins = db.prepare(`INSERT INTO Companies (id, Company_Name) VALUES (?, ?)`)
  ins.run(1, 'Acme')
  mustThrow(() => ins.run(2, 'Acme'), 'UNIQUE')
})

await runTest('Users email is unique and Contacts can link to Users', async () => {
  db.prepare(`INSERT INTO Users (id, User_Name, User_PEmail) VALUES (?,?,?)`).run(
    'user_1',
    'Alice',
    'alice@example.com',
  )
  mustThrow(
    () =>
      db.prepare(`INSERT INTO Users (id, User_Name, User_PEmail) VALUES (?,?,?)`).run(
        'user_2',
        'Alice Dup',
        'alice@example.com',
      ),
    'UNIQUE',
  )
  db.prepare(
    `INSERT INTO Contacts (id, Name, Personal_Email, linked_user_id) VALUES (?,?,?,?)`,
  ).run('contact_1', 'Alice', 'alice@example.com', 'user_1')
  mustThrow(
    () =>
      db.prepare(
        `INSERT INTO Contacts (id, Name, Personal_Email, linked_user_id) VALUES (?,?,?,?)`,
      ).run('contact_2', 'Alice Again', 'alice2@example.com', 'user_1'),
    'UNIQUE',
  )
})

await runTest('Creator and audit fields reference Users', async () => {
  db.prepare(`INSERT INTO Users (id, User_Name, User_PEmail) VALUES (?,?,?)`).run(
    'user_owner',
    'Owner User',
    'owner.user@example.com',
  )

  db.prepare(`INSERT INTO Companies (id, Company_Name, created_by) VALUES (?,?,?)`).run(
    20,
    'CreatorCo',
    'user_owner',
  )
  db.prepare(`INSERT INTO Funds (id, Fund_Name, created_by) VALUES (?,?,?)`).run(
    'fund_owner',
    'Creator Fund',
    'user_owner',
  )
  db.prepare(`INSERT INTO Rounds (id, Round_Name, created_by) VALUES (?,?,?)`).run(
    'round_owner',
    'Creator Round',
    'user_owner',
  )
  db.prepare(`INSERT INTO Tasks (id, Task_Name, created_by) VALUES (?,?,?)`).run(
    'task_owner',
    'Creator Task',
    'user_owner',
  )
  db.prepare(`INSERT INTO Artifacts (artifact_id, title, created_by) VALUES (?,?,?)`).run(
    'artifact_owner',
    'Creator Artifact',
    'user_owner',
  )
  db.prepare(`INSERT INTO Notes (id, Note_Name, Note_Content, created_by) VALUES (?,?,?,?)`).run(
    'note_owner',
    'Creator Note',
    'Body',
    'user_owner',
  )
  db.prepare(
    `INSERT INTO events (id, table_name, record_id, field_name, new_value, edited_by) VALUES (?,?,?,?,?,?)`,
  ).run('event_owner', 'Notes', 'note_owner', 'Note_Name', 'Creator Note', 'user_owner')
  db.prepare(
    `INSERT INTO databook_snapshots (id, table_name, record_id, payload_json, created_by) VALUES (?,?,?,?,?)`,
  ).run('snapshot_owner', 'Notes', 'note_owner', '{"ok":true}', 'user_owner')

  mustThrow(
    () =>
      db.prepare(`INSERT INTO Notes (id, Note_Name, Note_Content, created_by) VALUES (?,?,?,?)`).run(
        'note_bad_owner',
        'Bad Note',
        'Body',
        'missing_user',
      ),
    'FOREIGN KEY',
  )
  mustThrow(
    () =>
      db.prepare(
        `INSERT INTO events (id, table_name, record_id, field_name, new_value, edited_by) VALUES (?,?,?,?,?,?)`,
      ).run('event_bad_owner', 'Notes', 'note_owner', 'Note_Name', 'Bad', 'missing_user'),
    'FOREIGN KEY',
  )
})

await runTest('Check-in pattern constraints enforce allowed values', async () => {
  db.prepare(`INSERT INTO Companies (id, Company_Name) VALUES (?,?)`).run(10, 'CheckCo')
  mustThrow(
    () =>
      db.prepare(
        `INSERT INTO Company_Incorporation_Info (company_id, Company_Type) VALUES (?,?)`,
      ).run(10, 'NotACompanyType'),
    'CHECK constraint failed',
  )
  db.prepare(
    `INSERT INTO Company_Incorporation_Info (company_id, Company_Type) VALUES (?,?)`,
  ).run(10, 'Venture')
  mustThrow(
    () =>
      db.prepare(
        `INSERT INTO Company_Operations_Overview (company_id, Company_Stage) VALUES (?,?)`,
      ).run(10, 'NotACompanyStage'),
    'CHECK constraint failed',
  )

  db.prepare(`INSERT INTO Funds (id, Fund_Name) VALUES (?,?)`).run('f_check', 'Check Fund')
  db.prepare(`INSERT INTO Rounds (id, Round_Name) VALUES (?,?)`).run('r_check', 'Check Round')

  mustThrow(
    () =>
      db.prepare(
        `INSERT INTO Fund_Overview (fund_id, Fund_Raising_Status, Fund_Period) VALUES (?,?,?)`,
      ).run('f_check', 'NotAStatus', 'Raising'),
    'CHECK constraint failed',
  )

  mustThrow(
    () =>
      db.prepare(
        `INSERT INTO Fund_Overview (fund_id, Fund_Raising_Status, Fund_Period) VALUES (?,?,?)`,
      ).run('f_check', 'Raising', 'NotAPeriod'),
    'CHECK constraint failed',
  )

  db.prepare(
    `INSERT INTO Fund_Overview (fund_id, Fund_Raising_Status, Fund_Period) VALUES (?,?,?)`,
  ).run('f_check', 'Raising', 'Deployment')

  db.prepare(`INSERT INTO Fund_Strategy (fund_id) VALUES (?)`).run('f_check')

  mustThrow(
    () =>
      db.prepare(
        `INSERT INTO Fund_Strategy_Target_Asset_Types (fund_id, asset_type) VALUES (?,?)`,
      ).run('f_check', 'NotAnAssetType'),
    'CHECK constraint failed',
  )

  mustThrow(
    () =>
      db.prepare(`INSERT INTO Fund_Strategy_Target_Stages (fund_id, stage) VALUES (?,?)`).run(
        'f_check',
        'NotAStage',
      ),
    'CHECK constraint failed',
  )

  mustThrow(
    () =>
      db.prepare(
        `INSERT INTO Round_Overview (round_id, Round_Raising_Status, Round_Security_Type) VALUES (?,?,?)`,
      ).run('r_check', 'NotAStatus', 'Equity_Common'),
    'CHECK constraint failed',
  )

  mustThrow(
    () =>
      db.prepare(
        `INSERT INTO Round_Overview (round_id, Round_Raising_Status, Round_Security_Type) VALUES (?,?,?)`,
      ).run('r_check', 'Raised', 'NotASecurityType'),
    'CHECK constraint failed',
  )

  db.prepare(`INSERT INTO Artifacts (artifact_id, title) VALUES (?,?)`).run('a_doc', 'Doc')
  mustThrow(
    () =>
      db.prepare(`INSERT INTO Company_Artifacts (artifact_id, document_type) VALUES (?,?)`).run(
        'a_doc',
        'not_a_doc_type',
      ),
    'CHECK constraint failed',
  )

  db.prepare(`INSERT INTO Tasks (id, Task_Name) VALUES (?,?)`).run('t_check', 'Check Task')
  mustThrow(
    () =>
      db.prepare(
        `INSERT INTO Task_Overview (task_id, Task_Status, Task_Priority_Rank) VALUES (?,?,?)`,
      ).run('t_check', 'NotAStatus', 'Mid'),
    'CHECK constraint failed',
  )
  mustThrow(
    () =>
      db.prepare(
        `INSERT INTO Task_Overview (task_id, Task_Status, Task_Priority_Rank) VALUES (?,?,?)`,
      ).run('t_check', 'Backlog', 'NotAPriority'),
    'CHECK constraint failed',
  )
  db.prepare(
    `INSERT INTO Task_Overview (task_id, Task_Status, Task_Priority_Rank) VALUES (?,?,?)`,
  ).run('t_check', 'In Progress', 'Mid-High')
})

await runTest('Task team relations enforce contact foreign keys', async () => {
  db.prepare(`INSERT INTO Tasks (id, Task_Name) VALUES (?,?)`).run('t_team', 'Team Task')
  db.prepare(`INSERT INTO Contacts (id, Name, Personal_Email) VALUES (?,?,?)`).run(
    'contact_owner',
    'Owner',
    'owner@example.com',
  )
  db.prepare(`INSERT INTO Contacts (id, Name, Personal_Email) VALUES (?,?,?)`).run(
    'contact_assigned',
    'Assigned',
    'assigned@example.com',
  )
  db.prepare(`INSERT INTO Contacts (id, Name, Personal_Email) VALUES (?,?,?)`).run(
    'contact_support',
    'Support',
    'support@example.com',
  )

  db.prepare(`INSERT INTO Task_Team (task_id, Task_Team_Owner) VALUES (?,?)`).run(
    't_team',
    'contact_owner',
  )
  db.prepare(`INSERT INTO Task_Team_Assigned (task_id, contact_id) VALUES (?,?)`).run(
    't_team',
    'contact_assigned',
  )
  db.prepare(`INSERT INTO Task_Team_Support (task_id, contact_id) VALUES (?,?)`).run(
    't_team',
    'contact_support',
  )

  mustThrow(
    () =>
      db.prepare(`INSERT INTO Task_Team (task_id, Task_Team_Owner) VALUES (?,?)`).run(
        't_missing_owner',
        'missing_contact',
      ),
    'FOREIGN KEY',
  )
  mustThrow(
    () =>
      db.prepare(`INSERT INTO Task_Team_Assigned (task_id, contact_id) VALUES (?,?)`).run(
        't_team',
        'missing_contact',
      ),
    'FOREIGN KEY',
  )
})

await runTest('Round overview FK to Companies enforced + RESTRICT delete works', async () => {
  db.prepare(`INSERT OR IGNORE INTO Companies (id, Company_Name) VALUES (?,?)`).run(3, 'FKCo')
  db.prepare(`INSERT INTO Rounds (id, Round_Name) VALUES (?,?)`).run('r1', 'Round 1')
  db.prepare(
    `INSERT INTO Round_Overview (round_id, sponsor_company_id, Round_Raising_Status, Round_Security_Type) VALUES (?,?,?,?)`,
  ).run('r1', 3, 'Raising', 'Equity_Common')

  mustThrow(
    () =>
      db
        .prepare(
          `INSERT INTO Round_Overview (round_id, sponsor_company_id, Round_Raising_Status, Round_Security_Type) VALUES (?,?,?,?)`,
        )
        .run('r_bad', 9999, 'Raising', 'Equity_Common'),
    'FOREIGN KEY',
  )

  db.prepare(`INSERT INTO Funds (id, Fund_Name) VALUES (?,?)`).run('f_fk', 'Fund FK')
  db.prepare(
    `INSERT INTO Companies_Funds_has_funds (from_id, to_id) VALUES (?,?)`,
  ).run(3, 'f_fk')
  mustThrow(() => db.prepare(`DELETE FROM Companies WHERE id=?`).run(3), 'FOREIGN KEY')
})

await runTest('Join table CASCADE behavior sanity check', async () => {
  db.prepare(`INSERT INTO Regions (id, Name) VALUES (?,?)`).run('rg_test', 'Test Region')
  db.prepare(`INSERT INTO Companies (id, Company_Name) VALUES (?,?)`).run('101', 'Location1 Co')

  db.prepare(`INSERT INTO Regions_Companies_hq_region (from_id, to_id) VALUES (?,?)`).run(
    'rg_test',
    '101',
  )

  const before = queryAll(
    db,
    `SELECT * FROM Regions_Companies_hq_region WHERE from_id=? AND to_id=?`,
    ['rg_test', '101'],
  )
  assert.equal(before.length, 1)

  // deleting the region should cascade delete join row
  db.prepare(`DELETE FROM Regions WHERE id=?`).run('rg_test')

  const after = queryAll(
    db,
    `SELECT * FROM Regions_Companies_hq_region WHERE from_id=? AND to_id=?`,
    ['rg_test', '101'],
  )
  assert.equal(after.length, 0)
})

await runTest('Pipeline stage must belong to pipeline (Round_Pipeline trigger)', async () => {
  // make a second pipeline + stage
  db.prepare(`INSERT INTO Projects (id, Project_Name) VALUES (?,?)`).run('p2', 'Pipeline2')
  db.prepare(`INSERT INTO Project_Overview (project_id) VALUES (?)`).run('p2')
  db.prepare(
    `INSERT INTO Project_Stages (stage_id, project_id, name, position, is_terminal) VALUES (?,?,?,?,?)`,
  ).run('p2_s1', 'p2', 'stage1', 1, 0)

  db.prepare(`INSERT OR IGNORE INTO Rounds (id, Round_Name) VALUES (?,?)`).run('r_pipe', 'Pipe Round')

  // This should FAIL: pipeline_id='pipeline_default' but stage_id belongs to p2
  mustThrow(
    () =>
      db
        .prepare(
          `INSERT INTO Round_Pipeline (round_id, pipeline_id, stage_id) VALUES (?,?,?)`,
        )
        .run('r_pipe', 'pipeline_default', 'p2_s1'),
    'stage_id does not belong to pipeline_id',
  )

  // This should PASS
  const defaultStage = querySingle(
    db,
    `SELECT stage_id FROM Project_Stages WHERE project_id='pipeline_default' ORDER BY position LIMIT 1`,
  ).stage_id

  db.prepare(`INSERT INTO Round_Pipeline (round_id, pipeline_id, stage_id, status) VALUES (?,?,?,?)`).run(
    'r_pipe',
    'pipeline_default',
    defaultStage,
    'active',
  )
})

await runTest('Fund_Pipeline stage must belong to pipeline (trigger)', async () => {
  db.prepare(`INSERT OR IGNORE INTO Funds (id, Fund_Name) VALUES (?,?)`).run('f1', 'Fund1')

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
    `SELECT stage_id FROM Project_Stages WHERE project_id='pipeline_default' ORDER BY position LIMIT 1`,
  ).stage_id

  db.prepare(`INSERT INTO Fund_Pipeline (fund_id, pipeline_id, stage_id) VALUES (?,?,?)`).run(
    'f1',
    'pipeline_default',
    defaultStage,
  )
})

await runTest('Artifacts can be inserted by round/fund without pipeline mapping', async () => {
    db.prepare(`INSERT OR IGNORE INTO Rounds (id, Round_Name) VALUES (?,?)`).run('r_no_map', 'No Map Round')
    db.prepare(`INSERT OR IGNORE INTO Funds (id, Fund_Name) VALUES (?,?)`).run('f_no_map', 'No Map Fund')

    db.prepare(
      `INSERT INTO Artifacts (
        artifact_id, round_id, title
      ) VALUES (?,?,?)`,
    ).run('a_ok', 'r_no_map', 'ok artifact')
    db.prepare(
      `INSERT INTO Artifacts (
        artifact_id, fund_id, title
      ) VALUES (?,?,?)`,
    ).run('a_ok_fund', 'f_no_map', 'ok fund artifact')
    db.prepare(
      `INSERT INTO Artifact_Raw (artifact_id, fs_path, fs_hash, fs_size_bytes) VALUES (?,?,?,?)`,
    ).run('a_ok', '/tmp/a_ok.txt', null, null)
    db.prepare(
      `INSERT INTO Artifact_Raw (artifact_id, fs_path, fs_hash, fs_size_bytes) VALUES (?,?,?,?)`,
    ).run('a_ok_fund', '/tmp/a_ok_fund.txt', null, null)
})

await runTest('updated_at triggers work (Companies + Artifacts spot-check)', async () => {
  // Companies
  db.prepare(`INSERT OR IGNORE INTO Companies (id, Company_Name) VALUES (?,?)`).run(4, 'UpCo')
  const before = nowRow(db, 'Companies', 'id', 4).updated_at

  await sleep(1100) // datetime('now') is 1-second resolution
  db.prepare(`UPDATE Companies SET One_Liner=? WHERE id=?`).run('changed', 4)

  const after = nowRow(db, 'Companies', 'id', 4).updated_at
  assert.notEqual(after, before, 'Companies.updated_at should change after UPDATE')

  // Artifacts
  db.prepare(`INSERT OR IGNORE INTO Rounds (id, Round_Name) VALUES (?,?)`).run('r_up', 'Up Round')

  db.prepare(
    `INSERT OR IGNORE INTO Artifacts (
      artifact_id, round_id, title
    ) VALUES (?,?,?)`,
  ).run('a_up', 'r_up', 'up artifact')
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
