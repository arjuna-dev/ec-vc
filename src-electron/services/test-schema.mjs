import fs from 'fs'
import { SCHEMA_V1_SQL } from './sqlite-schema.js'

if (!process?.versions?.electron) {
  console.error('This script must be run with Electron (better-sqlite3 is built for the Electron runtime).')
  console.error('Try: `./node_modules/.bin/electron src-electron/services/test-schema.mjs`')
  process.exit(0)
}

const dbPath = '/tmp/ec10_test.db'

// delete old test DB if it exists
try {
  fs.unlinkSync(dbPath)
} catch (e) {
  void e
}

const { default: Database } = await import('better-sqlite3')

// open DB (this "starts" SQLite)
const db = new Database(dbPath)

// apply schema
db.exec(SCHEMA_V1_SQL)

// Seed a default pipeline and default stages (EC10-style)
db.prepare(
  `INSERT OR IGNORE INTO Pipelines (pipeline_id, name, dir_name, is_default)
   VALUES ('pipeline_default', 'Default Investment Pipeline', 'Default Investment Pipeline', 1);`,
).run()

db.prepare(
  `INSERT OR IGNORE INTO Pipeline_Stages (stage_id, pipeline_id, name, position)
   VALUES
     ('stage_thesis_alignment', 'pipeline_default', '1_thesis_alignment', 1),
     ('stage_team_analysis', 'pipeline_default', '2_team_analysis', 2),
     ('stage_investment_committee', 'pipeline_default', '3_investment_committee', 3),
     ('stage_due_diligence', 'pipeline_default', '4_due_diligence', 4),
     ('stage_closing_documents', 'pipeline_default', '5_closing_documents', 5);`,
).run()

function hasTable(name) {
  return !!db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
    .get(String(name))
}

console.log('Pipelines table exists:', hasTable('Pipelines'))
console.log('Pipeline_Stages table exists:', hasTable('Pipeline_Stages'))
console.log('Opportunity_Pipeline table exists:', hasTable('Opportunity_Pipeline'))
console.log('Fund_Pipeline table exists:', hasTable('Fund_Pipeline'))

const pipeline = db.prepare('SELECT pipeline_id FROM Pipelines WHERE is_default = 1 LIMIT 1').get()

if (!pipeline) throw new Error('Expected a default pipeline to be seeded')

const firstStage = db
  .prepare(
    'SELECT stage_id FROM Pipeline_Stages WHERE pipeline_id = ? ORDER BY position ASC LIMIT 1',
  )
  .get(pipeline.pipeline_id)

if (!firstStage) throw new Error('Expected default pipeline stages to be seeded')

// insert an Opportunities "opportunity"
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

// link to pipeline + stage
db.prepare(
  `
  INSERT INTO Opportunity_Pipeline (
    opportunity_url,
    pipeline_id,
    stage_id,
    status
  ) VALUES (?, ?, ?, ?)
`,
).run('https://example.com/oppty/1', pipeline.pipeline_id, firstStage.stage_id, 'active')

// verify trigger blocks mismatched stage/pipeline
db.prepare(
  "INSERT OR IGNORE INTO Pipelines (pipeline_id, name, dir_name, is_default) VALUES ('pipeline_other', 'Other', 'Other', 0)",
).run()
db.prepare(
  "INSERT OR IGNORE INTO Pipeline_Stages (stage_id, pipeline_id, name, position) VALUES ('stage_other_1', 'pipeline_other', 'Other stage', 1)",
).run()

try {
  db.prepare(
    `
    INSERT INTO Opportunity_Pipeline (
      opportunity_url,
      pipeline_id,
      stage_id
    ) VALUES (?, ?, ?)
  `,
  ).run('https://example.com/oppty/1', pipeline.pipeline_id, 'stage_other_1')
  throw new Error('Expected stage/pipeline mismatch trigger to abort insert')
} catch (e) {
  if (!String(e?.message || e).includes('stage_id does not belong to pipeline_id')) {
    throw e
  }
}

const rows = db
  .prepare(
    `
    SELECT opportunity_url, pipeline_id, stage_id, status
    FROM Opportunity_Pipeline
  `,
  )
  .all()

console.log('Rows:', rows)

// Verify that the default pipeline and stages were seeded correctly
const defaultPipeline = db
  .prepare("SELECT * FROM Pipelines WHERE pipeline_id = 'pipeline_default' AND is_default = 1")
  .get()
if (!defaultPipeline) throw new Error('Default pipeline was not seeded correctly')

const defaultStages = db
  .prepare(
    "SELECT * FROM Pipeline_Stages WHERE pipeline_id = 'pipeline_default' ORDER BY position ASC",
  )
  .all()
if (defaultStages.length !== 5) throw new Error('Default pipeline stages were not seeded correctly')

console.log('Default pipeline:', defaultPipeline)
console.log('Default pipeline stages:', defaultStages)

db.close()
console.log('✅ Schema test passed. DB at', dbPath)
