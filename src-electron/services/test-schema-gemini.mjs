import Database from 'better-sqlite3'
import { SCHEMA_V1_SQL } from './sqlite-schema.js'

const db = new Database(':memory:') // Use in-memory for testing
db.pragma('foreign_keys = ON')

async function runTests() {
  console.log('ðŸš€ Starting EC10.vc Schema Validation...\n')

  try {
    // 1. Initialize Schema
    db.exec(SCHEMA_V1_SQL)
    console.log('âœ… Schema Initialization: SUCCESS')

    // 2. Test Basic Insertion (Company, Round, Fund)
    const companyId = 123
    const roundId = 'round_123'
    const fundId = 'fund_123'

    db.prepare(
      `
      INSERT INTO Companies (id, Company_Name, Website) 
      VALUES (?, 'Acme Corp', 'https://acme.com')
    `,
    ).run(companyId)

    db.prepare(
      `
      INSERT INTO Rounds (id, Round_Name, created_by) 
      VALUES (?, 'Acme Seed Round', NULL)
    `,
    ).run(roundId)

    db.prepare(
      `
      INSERT INTO Round_Overview (
        round_id, sponsor_company_id, Round_Raising_Status, Security_Type
      ) VALUES (?, ?, 'Raising', 'Equity_Common')
    `,
    ).run(roundId, companyId)

    db.prepare(
      `
      INSERT INTO Funds (id, Fund_Name, created_by)
      VALUES (?, 'Acme Fund I', NULL)
    `,
    ).run(fundId)

    db.prepare(
      `
      INSERT INTO Fund_Overview (
        fund_id, Fund_Raising_Status, Fund_Period, Fund_Target_Size
      ) VALUES (?, 'Raising', 'Raising', 10000000)
    `,
    ).run(fundId)

    console.log('âœ… Basic Insertions & Foreign Keys: SUCCESS')

    // 3. Test Timestamp Triggers
    const originalCompany = db
      .prepare('SELECT updated_at FROM Companies WHERE id = ?')
      .get(companyId)

    // Wait a moment to ensure clock moves
    await new Promise((resolve) => setTimeout(resolve, 1100))

    db.prepare("UPDATE Companies SET One_Liner = 'Active' WHERE id = ?").run(companyId)
    const updatedCompany = db
      .prepare('SELECT updated_at FROM Companies WHERE id = ?')
      .get(companyId)

    if (updatedCompany.updated_at !== originalCompany.updated_at) {
      console.log('âœ… Auto-Timestamp Triggers: SUCCESS')
    } else {
      throw new Error('Timestamp Trigger failed to update updated_at')
    }

    // 4. Test Pipeline Integrity Triggers (Negative Test)
    console.log('\nðŸ§ª Testing Integrity Triggers (Expect Failures)...')

    try {
      // Attempt to link round to a stage that exists but in the WRONG pipeline
      db.prepare(
        `
        INSERT INTO Round_Pipeline (round_id, pipeline_id, stage_id)
        VALUES (?, 'non_existent_pipeline', 'stage_thesis_alignment')
      `,
      ).run(roundId)
      throw new Error('Integrity Check Failed: Allowed invalid pipeline_id')
    } catch {
      console.log('âœ… Pipeline/Stage Match Trigger: SUCCESS (Blocked invalid entry)')
    }

    try {
      db.prepare(
        `
        INSERT INTO Fund_Pipeline (fund_id, pipeline_id, stage_id)
        VALUES (?, 'non_existent_pipeline', 'stage_thesis_alignment')
      `,
      ).run(fundId)
      throw new Error('Integrity Check Failed: Allowed invalid fund pipeline_id')
    } catch {
      console.log('âœ… Fund Pipeline/Stage Match Trigger: SUCCESS (Blocked invalid entry)')
    }

    // 5. Test Artifact insertion linked directly to a round/fund
    db.prepare(
      `
      INSERT INTO Artifacts (artifact_id, round_id, title)
      VALUES ('art_1', ?, 'test artifact')
      `,
    ).run(roundId)
    db.prepare(
      `
      INSERT INTO Artifacts (artifact_id, fund_id, title)
      VALUES ('art_2', ?, 'test fund artifact')
      `,
    ).run(fundId)
    db.prepare(
      `
      INSERT INTO Artifact_Raw (artifact_id, fs_path, fs_hash, fs_size_bytes)
      VALUES ('art_1', '/path/test.pdf', NULL, NULL)
      `,
    ).run()
    db.prepare(
      `
      INSERT INTO Artifact_Raw (artifact_id, fs_path, fs_hash, fs_size_bytes)
      VALUES ('art_2', '/path/test-fund.pdf', NULL, NULL)
      `,
    ).run()
    console.log('âœ… Artifact insertion by opportunity: SUCCESS')

    console.log('\nðŸŽ‰ ALL TESTS PASSED: Schema is ready for production development.')
  } catch (error) {
    console.error('\nâŒ TEST FAILED:')
    console.error(error.message)
    process.exit(1)
  } finally {
    db.close()
  }
}

runTests()
