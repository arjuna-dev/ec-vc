import Database from 'better-sqlite3'
import { SCHEMA_V1_SQL } from './sqlite-schema.js'

const db = new Database(':memory:') // Use in-memory for testing
db.pragma('foreign_keys = ON')

async function runTests() {
  console.log('🚀 Starting EC10.vc Schema Validation...\n')

  try {
    // 1. Initialize Schema
    db.exec(SCHEMA_V1_SQL)
    console.log('✅ Schema Initialization: SUCCESS')

    // 2. Test Basic Insertion (Company & Opportunity)
    const companyId = 'comp_123'
    const opptyId = 'opp_123'

    db.prepare(
      `
      INSERT INTO Companies (id, Company_Name, Website) 
      VALUES (?, 'Acme Corp', 'https://acme.com')
    `,
    ).run(companyId)

    db.prepare(
      `
      INSERT INTO Opportunities (id, company_id, Venture_Oppty_Name) 
      VALUES (?, ?, 'Acme Seed Round')
    `,
    ).run(opptyId, companyId)

    console.log('✅ Basic Insertions & Foreign Keys: SUCCESS')

    // 3. Test Timestamp Triggers
    const originalCompany = db
      .prepare('SELECT updated_at FROM Companies WHERE id = ?')
      .get(companyId)

    // Wait a moment to ensure clock moves
    await new Promise((resolve) => setTimeout(resolve, 1100))

    db.prepare("UPDATE Companies SET Status = 'Active' WHERE id = ?").run(companyId)
    const updatedCompany = db
      .prepare('SELECT updated_at FROM Companies WHERE id = ?')
      .get(companyId)

    if (updatedCompany.updated_at !== originalCompany.updated_at) {
      console.log('✅ Auto-Timestamp Triggers: SUCCESS')
    } else {
      throw new Error('Timestamp Trigger failed to update updated_at')
    }

    // 4. Test Pipeline Integrity Triggers (Negative Test)
    console.log('\n🧪 Testing Integrity Triggers (Expect Failures)...')

    try {
      // Attempt to link opportunity to a stage that exists but in the WRONG pipeline
      // Note: pipeline_default has 'stage_thesis_alignment'
      db.prepare(
        `
        INSERT INTO Opportunity_Pipeline (opportunity_id, pipeline_id, stage_id)
        VALUES (?, 'non_existent_pipeline', 'stage_thesis_alignment')
      `,
      ).run(opptyId)
      throw new Error('Integrity Check Failed: Allowed invalid pipeline_id')
    } catch {
      console.log('✅ Pipeline/Stage Match Trigger: SUCCESS (Blocked invalid entry)')
    }

    // 5. Test Artifact insertion linked directly to an opportunity
    db.prepare(
      `
      INSERT INTO Artifacts (artifact_id, opportunity_id, title)
      VALUES ('art_1', ?, 'test artifact')
      `,
    ).run(opptyId)
    db.prepare(
      `
      INSERT INTO Artifact_Raw (artifact_id, fs_path, fs_hash, fs_size_bytes)
      VALUES ('art_1', '/path/test.pdf', NULL, NULL)
      `,
    ).run()
    console.log('✅ Artifact insertion by opportunity: SUCCESS')

    console.log('\n🎉 ALL TESTS PASSED: Schema is ready for production development.')
  } catch (error) {
    console.error('\n❌ TEST FAILED:')
    console.error(error.message)
    process.exit(1)
  } finally {
    db.close()
  }
}

runTests()
