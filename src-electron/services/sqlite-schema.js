const BASE_TABLES_SQL = `

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Owner (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (owner_user_id) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  action_id TEXT,
  action_label TEXT,
  old_value TEXT,
  new_value TEXT,
  payload_json TEXT,
  Status TEXT,
  edited_by TEXT NOT NULL,
  edited_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (edited_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_events_table_record
  ON events(table_name, record_id, edited_at);

CREATE INDEX IF NOT EXISTS idx_events_editor
  ON events(edited_by, edited_at);

CREATE INDEX IF NOT EXISTS idx_events_edited_at
  ON events(edited_at);

CREATE INDEX IF NOT EXISTS idx_events_action
  ON events(action_id, edited_at);

CREATE TABLE IF NOT EXISTS databook_snapshots (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_databook_snapshots_record
  ON databook_snapshots(table_name, record_id, created_at);

CREATE TABLE IF NOT EXISTS Field_Verification_Metadata (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  state TEXT NOT NULL,
  source TEXT,
  confidence TEXT,
  verified_by TEXT,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (table_name, record_id, field_name),
  FOREIGN KEY (verified_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Field_Verification_Metadata_record
  ON Field_Verification_Metadata(table_name, record_id);

CREATE INDEX IF NOT EXISTS idx_Field_Verification_Metadata_state
  ON Field_Verification_Metadata(state, verified_at);

CREATE TABLE IF NOT EXISTS Companies (
  id INTEGER PRIMARY KEY,
  Company_Name TEXT NOT NULL,
  Short_Name TEXT,
  Website TEXT,
  One_Liner TEXT,
  Description TEXT,
  Notable_News TEXT,
  Updates TEXT,
  Status TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_Companies_company_name
  ON Companies(Company_Name);

CREATE INDEX IF NOT EXISTS idx_Companies_created_by
  ON Companies(created_by);

CREATE TABLE IF NOT EXISTS Funds (
  id TEXT PRIMARY KEY,
  Fund_Name TEXT,
  Raising_Status TEXT,
  Target_Size REAL,
  Committed_Amounts REAL,
  Close_Date TEXT,
  Summary TEXT,
  Status TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Funds_created_by
  ON Funds(created_by);

CREATE TABLE IF NOT EXISTS Opportunities (
  id TEXT PRIMARY KEY,
  kind TEXT CHECK (kind IS NULL OR kind IN ('round', 'fund')),
  company_id INTEGER,
  Venture_Oppty_Name TEXT,
  Round_Stage TEXT,
  Type_of_Security TEXT,
  Investment_Ask REAL,
  Round_Amount REAL,
  Hard_Commits REAL,
  Soft_Commits REAL,
  Pre_Valuation REAL,
  Post_Valuation REAL,
  Previous_Post REAL,
  First_Close_Date TEXT,
  Next_Close_Date TEXT,
  Final_Close_Date TEXT,
  Raising_Status TEXT,
  Status TEXT,
  Board_Seats TEXT,
  Information_Rights TEXT,
  Voting_Rights TEXT,
  Liquidation_Preference TEXT,
  Anti_Dilution_Provisions TEXT,
  Conversion_Features TEXT,
  Most_Favored_Nation TEXT,
  ROFO_ROR TEXT,
  Co_Sale_Right TEXT,
  Tag_Drag_Along TEXT,
  Put_Option TEXT,
  Over_Allotment_Option TEXT,
  Stacked_Series TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Opportunities_company
  ON Opportunities(company_id);

CREATE INDEX IF NOT EXISTS idx_Opportunities_name
  ON Opportunities(Venture_Oppty_Name);

CREATE TABLE IF NOT EXISTS Rounds (
  id TEXT PRIMARY KEY,
  Round_Name TEXT,
  company_id INTEGER,
  Raising_Status TEXT,
  Type_of_Security TEXT,
  Target_Size REAL,
  Committed_Amounts REAL,
  Close_Date TEXT,
  Summary TEXT,
  Pre_Valuation REAL,
  Post_Valuation REAL,
  Previous_Post_Valuation REAL,
  Status TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Rounds_created_by
  ON Rounds(created_by);

CREATE TABLE IF NOT EXISTS LVPortfolio (
  id TEXT PRIMARY KEY,
  Ticket_Name TEXT,
  Commitment REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS InvestmentSchedule (
  id TEXT PRIMARY KEY,
  Short_Name TEXT,
  Amount REAL,
  Currency TEXT,
  Fx_Rate REAL,
  Investment_Date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Users (
  id TEXT PRIMARY KEY,
  User_Name TEXT NOT NULL,
  User_PEmail TEXT UNIQUE,
  Status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_Users_email
  ON Users(User_PEmail);

CREATE TABLE IF NOT EXISTS Companion (
  id TEXT PRIMARY KEY,
  Companion_Name TEXT NOT NULL,
  Companion_Summary TEXT,
  Status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Contacts (
  id TEXT PRIMARY KEY,
  Name TEXT,
  Personal_Email TEXT,
  Professional_Email TEXT,
  Phone TEXT,
  Country_based TEXT,
  LinkedIn TEXT,
  Status TEXT,
  linked_user_id TEXT UNIQUE,
  FOREIGN KEY (linked_user_id) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Projects (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  Project_Name TEXT,
  Project_Status TEXT,
  Project_Priority_Rank TEXT,
  Project_Start_Date TEXT,
  Project_Due_Date TEXT,
  Project_End_Date TEXT,
  Project_Target_Amount REAL,
  Project_Summary TEXT,
  Status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Tasks (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  Task_Name TEXT,
  Task_Summary TEXT,
  Task_Status TEXT,
  Task_Priority_Rank TEXT,
  Task_Start_Date TEXT,
  Task_Due_Date TEXT,
  Task_End_Date TEXT,
  Status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Markets (
  id TEXT PRIMARY KEY,
  Market_Name TEXT,
  Market_Summary TEXT,
  Status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Securities (
  id TEXT PRIMARY KEY,
  Security_Name TEXT,
  Security_Summary TEXT,
  Status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Notes (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  Note_Name TEXT,
  Note_Content TEXT NOT NULL,
  Status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_created_by ON Notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON Notes(created_at);
`

const RELATION_JOIN_TABLES_SQL = ``

const PIPELINES_SQL = `
CREATE TABLE IF NOT EXISTS Assistant_System_Prompts (
  assistant_system_prompt_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL,
  schema_name TEXT,
  input_contract TEXT,
  output_contract TEXT,
  temperature REAL,
  max_tokens INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (name, version)
);

CREATE INDEX IF NOT EXISTS idx_Assistant_System_Prompts_active
  ON Assistant_System_Prompts(is_active);

CREATE TABLE IF NOT EXISTS Roles (
  id TEXT PRIMARY KEY,
  Role_Name TEXT NOT NULL,
  Role_Summary TEXT,
  Status TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Roles_created_by
  ON Roles(created_by);

CREATE TABLE IF NOT EXISTS Companion_Roles (
  id TEXT PRIMARY KEY,
  Companion_Role_Name TEXT NOT NULL,
  Companion_Role_Summary TEXT,
  Companion_Role_Type TEXT,
  Companion_Role_Status TEXT,
  Companion_Role_Contract_Path TEXT,
  Status TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Companion_Roles_created_by
  ON Companion_Roles(created_by);

CREATE TABLE IF NOT EXISTS Files (
  id TEXT PRIMARY KEY,
  File_Order INTEGER,
  File_Name TEXT NOT NULL,
  File_Summary TEXT,
  File_Status TEXT,
  File_Guide_Path TEXT,
  File_Class TEXT,
  File_Bucket TEXT,
  Ownership_Mode TEXT,
  File_Owner TEXT,
  File_Steward TEXT,
  Rulebook_Dependencies TEXT,
  Fork_Mode TEXT,
  Fork_Enabled TEXT,
  Create_Fork_Instructions TEXT,
  View_Fork_Instructions TEXT,
  Structure TEXT,
  Glossary_Terms TEXT,
  sourceKey TEXT NOT NULL UNIQUE,
  File_Canonical_Entity TEXT,
  File_Runtime_Entity TEXT,
  File_Route_Name TEXT,
  File_Path TEXT,
  File_EventLog TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Files_order
  ON Files(File_Order);

CREATE INDEX IF NOT EXISTS idx_Files_created_by
  ON Files(created_by);

CREATE TABLE IF NOT EXISTS Building_Blocks (
  id TEXT PRIMARY KEY,
  Sort_Order INTEGER,
  Name TEXT NOT NULL,
  Summary TEXT,
  Category TEXT,
  Status TEXT,
  Used_In TEXT,
  Used_In_Shells TEXT,
  Use_When TEXT,
  Avoid_When TEXT,
  Built_From_BBs TEXT,
  Anatomy TEXT,
  Required_Parts TEXT,
  Source_Path TEXT,
  Owner TEXT,
  Extraction_Status TEXT,
  Reconstruction_Notes TEXT,
  Convergence_Rule TEXT,
  Prompt TEXT,
  Variants TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Building_Blocks_sort_order
  ON Building_Blocks(Sort_Order);

CREATE INDEX IF NOT EXISTS idx_Building_Blocks_category
  ON Building_Blocks(Category);

CREATE TABLE IF NOT EXISTS Users_Roles (
  user_id TEXT PRIMARY KEY,
  role_id TEXT,
  assigned_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES Roles(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Users_Roles_role_id
  ON Users_Roles(role_id);

CREATE TABLE IF NOT EXISTS Artifacts (
  artifact_id TEXT PRIMARY KEY,
  round_id TEXT,
  fund_id TEXT,
  created_by TEXT,
  artifact_format TEXT CHECK (
    artifact_format IS NULL OR artifact_format IN (
      'pdf','doc','docx','ppt','pptx','xls','xlsx','csv','txt','md','json','html',
      'png','jpg','jpeg','webp','gif','tif','tiff','other'
    )
  ),
  type TEXT CHECK (type IN ('raising_pitch_deck','commercial_pitch_deck','messages','emails','historical_data','forecast','other')),
    title TEXT,
    description TEXT,
    Status TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (round_id IS NULL OR fund_id IS NULL),
  FOREIGN KEY (round_id) REFERENCES Rounds(id) ON DELETE SET NULL,
  FOREIGN KEY (fund_id) REFERENCES Funds(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Artifacts_round_created
  ON Artifacts(round_id, created_at);

CREATE INDEX IF NOT EXISTS idx_Artifacts_fund_created
  ON Artifacts(fund_id, created_at);

CREATE TABLE IF NOT EXISTS Artifact_Raw (
  artifact_id TEXT PRIMARY KEY,
  fs_path TEXT NOT NULL,
  fs_hash TEXT,
  fs_size_bytes INTEGER,
  FOREIGN KEY (artifact_id) REFERENCES Artifacts(artifact_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_Artifact_Raw_unique_path
  ON Artifact_Raw(fs_path);

CREATE TABLE IF NOT EXISTS Artifact_Llm_Ready (
  artifact_id TEXT PRIMARY KEY,
  source_artifact_id TEXT,
  original_artifact_id TEXT,
  assistant_system_prompt_id TEXT,
  generated_by TEXT NOT NULL CHECK (generated_by IN ('llm','system')),
  llm_provider TEXT,
  llm_model TEXT,
  fs_path TEXT NOT NULL,
  fs_hash TEXT,
  fs_size_bytes INTEGER,
  FOREIGN KEY (artifact_id) REFERENCES Artifacts(artifact_id) ON DELETE CASCADE,
  FOREIGN KEY (source_artifact_id) REFERENCES Artifacts(artifact_id) ON DELETE SET NULL,
  FOREIGN KEY (original_artifact_id) REFERENCES Artifacts(artifact_id) ON DELETE SET NULL,
  FOREIGN KEY (assistant_system_prompt_id) REFERENCES Assistant_System_Prompts(assistant_system_prompt_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_Artifact_Llm_Ready_unique_path
  ON Artifact_Llm_Ready(fs_path);

CREATE INDEX IF NOT EXISTS idx_Artifact_Llm_Ready_source
  ON Artifact_Llm_Ready(source_artifact_id);

CREATE TABLE IF NOT EXISTS Artifact_Llm_Generated (
  artifact_id TEXT PRIMARY KEY,
  source_artifact_id TEXT,
  original_artifact_id TEXT,
  assistant_system_prompt_id TEXT,
  llm_provider TEXT,
  llm_model TEXT,
  fs_path TEXT NOT NULL,
  fs_hash TEXT,
  fs_size_bytes INTEGER,
  FOREIGN KEY (artifact_id) REFERENCES Artifacts(artifact_id) ON DELETE CASCADE,
  FOREIGN KEY (source_artifact_id) REFERENCES Artifacts(artifact_id) ON DELETE SET NULL,
  FOREIGN KEY (original_artifact_id) REFERENCES Artifacts(artifact_id) ON DELETE SET NULL,
  FOREIGN KEY (assistant_system_prompt_id) REFERENCES Assistant_System_Prompts(assistant_system_prompt_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_Artifact_Llm_Generated_unique_path
  ON Artifact_Llm_Generated(fs_path);

CREATE INDEX IF NOT EXISTS idx_Artifact_Llm_Generated_source
  ON Artifact_Llm_Generated(source_artifact_id);

CREATE VIEW IF NOT EXISTS Artifact_Details AS
SELECT
  a.artifact_id,
  a.round_id,
  a.fund_id,
  a.created_by,
  a.artifact_format,
  a.type,
  a.title,
  a.description,
  a.created_at,
  a.updated_at,
  COALESCE(ar.fs_path, alr.fs_path, alg.fs_path) AS fs_path,
  COALESCE(ar.fs_hash, alr.fs_hash, alg.fs_hash) AS fs_hash,
  COALESCE(ar.fs_size_bytes, alr.fs_size_bytes, alg.fs_size_bytes) AS fs_size_bytes,
  COALESCE(alr.source_artifact_id, alg.source_artifact_id) AS source_artifact_id,
  COALESCE(alr.original_artifact_id, alg.original_artifact_id) AS original_artifact_id,
  COALESCE(alr.assistant_system_prompt_id, alg.assistant_system_prompt_id) AS assistant_system_prompt_id,
  CASE
    WHEN ar.artifact_id IS NOT NULL THEN 'user'
    WHEN alr.artifact_id IS NOT NULL THEN alr.generated_by
    WHEN alg.artifact_id IS NOT NULL THEN 'llm'
    ELSE NULL
  END AS generated_by,
  COALESCE(alr.llm_provider, alg.llm_provider) AS llm_provider,
  COALESCE(alr.llm_model, alg.llm_model) AS llm_model,
  CASE
    WHEN ar.artifact_id IS NOT NULL THEN 'raw'
    WHEN alr.artifact_id IS NOT NULL THEN 'llm-ready'
    WHEN alg.artifact_id IS NOT NULL THEN 'llm-generated'
    ELSE NULL
  END AS artifact_type
FROM Artifacts a
LEFT JOIN Artifact_Raw ar ON ar.artifact_id = a.artifact_id
LEFT JOIN Artifact_Llm_Ready alr ON alr.artifact_id = a.artifact_id
LEFT JOIN Artifact_Llm_Generated alg ON alg.artifact_id = a.artifact_id;

CREATE TABLE IF NOT EXISTS Intake (
  id TEXT PRIMARY KEY,
  Intake_Name TEXT NOT NULL,
  Intake_Summary TEXT,
  Original_Artifact_Id TEXT,
  Created_Files_JSON TEXT,
  Working INTEGER NOT NULL DEFAULT 0 CHECK (Working IN (0, 1)),
  Status TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (Original_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Intake_original_artifact
  ON Intake(Original_Artifact_Id);

CREATE INDEX IF NOT EXISTS idx_Intake_created_by
  ON Intake(created_by);

CREATE TABLE IF NOT EXISTS LDB_Links (
  id TEXT PRIMARY KEY,
  source_entity TEXT NOT NULL,
  source_record_id TEXT NOT NULL,
  source_token TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  target_record_id TEXT NOT NULL,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (source_entity, source_record_id, source_token, target_entity, target_record_id),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_LDB_Links_source
  ON LDB_Links(source_entity, source_record_id, source_token);

CREATE INDEX IF NOT EXISTS idx_LDB_Links_target
  ON LDB_Links(target_entity, target_record_id);

-- Triggers (Omitted for brevity, but logically follow the same FK enforcement)
`
const TRIGGERS_SQL = `
-- 0. LEGACY TRIGGER SECTION

-- 1. AUTO-UPDATE TIMESTAMP TRIGGERS (Core Tables)

CREATE TRIGGER IF NOT EXISTS trg_Companies_updated_at
AFTER UPDATE ON Companies
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Companies SET updated_at = datetime('now') WHERE id = OLD.id;
END;


CREATE TRIGGER IF NOT EXISTS trg_Funds_updated_at
AFTER UPDATE ON Funds
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Funds SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Rounds_updated_at
AFTER UPDATE ON Rounds
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Rounds SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Artifacts_updated_at
AFTER UPDATE ON Artifacts
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Artifacts
  SET updated_at = datetime('now')
  WHERE artifact_id = OLD.artifact_id;
END;


CREATE TRIGGER IF NOT EXISTS trg_Tasks_updated_at
AFTER UPDATE ON Tasks
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Tasks SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Projects_updated_at
AFTER UPDATE ON Projects
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Projects SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Artifact_Raw_single_subtype_ins
BEFORE INSERT ON Artifact_Raw
FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM Artifact_Llm_Ready WHERE artifact_id = NEW.artifact_id)
  OR EXISTS (SELECT 1 FROM Artifact_Llm_Generated WHERE artifact_id = NEW.artifact_id)
BEGIN
  SELECT RAISE(ABORT, 'artifact already belongs to another subtype table');
END;

CREATE TRIGGER IF NOT EXISTS trg_Artifact_Llm_Ready_single_subtype_ins
BEFORE INSERT ON Artifact_Llm_Ready
FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM Artifact_Raw WHERE artifact_id = NEW.artifact_id)
  OR EXISTS (SELECT 1 FROM Artifact_Llm_Generated WHERE artifact_id = NEW.artifact_id)
BEGIN
  SELECT RAISE(ABORT, 'artifact already belongs to another subtype table');
END;

CREATE TRIGGER IF NOT EXISTS trg_Artifact_Llm_Generated_single_subtype_ins
BEFORE INSERT ON Artifact_Llm_Generated
FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM Artifact_Raw WHERE artifact_id = NEW.artifact_id)
  OR EXISTS (SELECT 1 FROM Artifact_Llm_Ready WHERE artifact_id = NEW.artifact_id)
BEGIN
  SELECT RAISE(ABORT, 'artifact already belongs to another subtype table');
END;

CREATE TRIGGER IF NOT EXISTS trg_events_no_update
BEFORE UPDATE ON events
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'events is append-only');
END;

CREATE TRIGGER IF NOT EXISTS trg_events_no_delete
BEFORE DELETE ON events
FOR EACH ROW
BEGIN
  SELECT RAISE(ABORT, 'events is append-only');
END;

`

export const SCHEMA_V1_SQL = `
BEGIN;
${BASE_TABLES_SQL}
${RELATION_JOIN_TABLES_SQL}
${PIPELINES_SQL}
${TRIGGERS_SQL}
COMMIT;
`


