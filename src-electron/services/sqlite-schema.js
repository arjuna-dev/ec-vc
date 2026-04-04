const BASE_TABLES_SQL = `

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
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

CREATE TABLE IF NOT EXISTS Companies (
  id INTEGER PRIMARY KEY,
  Company_Name TEXT NOT NULL,
  Short_Name TEXT,
  Website TEXT,
  One_Liner TEXT,
  Description TEXT,
  Notable_News TEXT,
  Updates TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_Companies_company_name
  ON Companies(Company_Name);

CREATE INDEX IF NOT EXISTS idx_Companies_created_by
  ON Companies(created_by);

CREATE TABLE IF NOT EXISTS Company_Incorporation_Info (
  company_id INTEGER PRIMARY KEY,
  Company_Type TEXT CHECK (
    Company_Type IS NULL OR Company_Type IN (
      'Venture',
      'Corporation',
      'Asset Manager',
      'Academia',
      'Government',
      'Other'
    )
  ),
  Legal_Entity TEXT,
  Date_of_Incorporation TEXT,
  incorporation_country TEXT,
  Incorporation_Type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_Company_Incorporation_Info_company_type
  ON Company_Incorporation_Info(Company_Type);

CREATE INDEX IF NOT EXISTS idx_Company_Incorporation_Info_country
  ON Company_Incorporation_Info(incorporation_country);

CREATE TABLE IF NOT EXISTS Company_Incorporation_Legal_Founders (
  company_id INTEGER NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (company_id, contact_id),
  FOREIGN KEY (company_id) REFERENCES Company_Incorporation_Info(company_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Asset_Manager_Companies (
  company_id TEXT PRIMARY KEY,
  AUM REAL,
  Funds_Managed_Count INTEGER,
  Investment_Count INTEGER,
  Exit_Count INTEGER,
  Asset_Classes TEXT,
  Investment_Stages TEXT,
  Investment_Focus_Regions TEXT,
  Investment_Focus_Industries TEXT,
  LP_Investor_Relationships TEXT,
  Strategy_Defaults TEXT,
  Portfolio_Construction_Defaults TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Funds (
  id TEXT PRIMARY KEY,
  Fund_Name TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Funds_created_by
  ON Funds(created_by);

CREATE TABLE IF NOT EXISTS Fund_Overview (
  fund_id TEXT PRIMARY KEY,
  Fund_Raising_Status TEXT CHECK (
    Fund_Raising_Status IS NULL OR Fund_Raising_Status IN ('Raising', 'Raised', 'Abandoned')
  ),
  Fund_Period TEXT CHECK (
    Fund_Period IS NULL OR Fund_Period IN ('Raising', 'Deployment', 'Holding', 'Exit', 'Wind-down', 'Closed')
  ),
  Fund_Target_Size REAL,
  Fund_Commited_Amounts REAL,
  Fund_Min_Ticket_Size REAL,
  Fund_Close_Date TEXT,
  Fund_Summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (fund_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Fund_Overview_Managers (
  fund_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (fund_id, contact_id),
  FOREIGN KEY (fund_id) REFERENCES Fund_Overview(fund_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Fund_Strategy (
  fund_id TEXT PRIMARY KEY,
  Fund_Reserve REAL,
  Fund_Initial_Ticket_Size REAL,
  Fund_Target_Positions INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (fund_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Fund_Strategy_Target_Regions (
  fund_id TEXT NOT NULL,
  region_id TEXT NOT NULL,
  PRIMARY KEY (fund_id, region_id),
  FOREIGN KEY (fund_id) REFERENCES Fund_Strategy(fund_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (region_id) REFERENCES Regions(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Fund_Strategy_Target_Asset_Types (
  fund_id TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (
    asset_type IN (
      'Debt_Secured',
      'Debt_Unsecured',
      'Debt_Structured',
      'Equity_Common',
      'Equity_Preferred',
      'Equity_SAFE'
    )
  ),
  PRIMARY KEY (fund_id, asset_type),
  FOREIGN KEY (fund_id) REFERENCES Fund_Strategy(fund_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Fund_Strategy_Target_Industries (
  fund_id TEXT NOT NULL,
  industry_id TEXT NOT NULL,
  PRIMARY KEY (fund_id, industry_id),
  FOREIGN KEY (fund_id) REFERENCES Fund_Strategy(fund_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (industry_id) REFERENCES Industries(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Fund_Strategy_Target_Stages (
  fund_id TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Formation', 'Early', 'Mid', 'Late')),
  PRIMARY KEY (fund_id, stage),
  FOREIGN KEY (fund_id) REFERENCES Fund_Strategy(fund_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_Fund_Strategy_Target_Regions_region
  ON Fund_Strategy_Target_Regions(region_id);

CREATE INDEX IF NOT EXISTS idx_Fund_Strategy_Target_Industries_industry
  ON Fund_Strategy_Target_Industries(industry_id);

CREATE INDEX IF NOT EXISTS idx_Fund_Strategy_Target_Stages_stage
  ON Fund_Strategy_Target_Stages(stage);

CREATE TABLE IF NOT EXISTS Fund_Economics (
  fund_id TEXT PRIMARY KEY,
  Fund_Economic_Provisions_Artifact_Id TEXT,
  Fund_Fees_Artifact_Id TEXT,
  Fund_Promote_Artifact_Id TEXT,
  Fund_Target_Hurdles_Artifact_Id TEXT,
  Fund_Target_MOIC_Artifact_Id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (fund_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (Fund_Economic_Provisions_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Fund_Fees_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Fund_Promote_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Fund_Target_Hurdles_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Fund_Target_MOIC_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Fund_Controls (
  fund_id TEXT PRIMARY KEY,
  Fund_Control_Provisions_Artifact_Id TEXT,
  Fund_Information_Rights_Artifact_Id TEXT,
  Fund_Board_Representation_Artifact_Id TEXT,
  Fund_Item_Voting_Artifact_Id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (fund_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (Fund_Control_Provisions_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Fund_Information_Rights_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Fund_Board_Representation_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Fund_Item_Voting_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Rounds (
  id TEXT PRIMARY KEY,
  Round_Name TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Rounds_created_by
  ON Rounds(created_by);

CREATE TABLE IF NOT EXISTS Round_Overview (
  round_id TEXT PRIMARY KEY,
  sponsor_company_id INTEGER,
  Round_Raising_Status TEXT CHECK (
    Round_Raising_Status IS NULL OR Round_Raising_Status IN ('Raising', 'Raised', 'Abandoned')
  ),
  Round_Security_Type TEXT CHECK (
    Round_Security_Type IS NULL OR Round_Security_Type IN (
      'Debt_Secured',
      'Debt_Unsecured',
      'Debt_Structured',
      'Equity_Common',
      'Equity_Preferred',
      'Equity_SAFE'
    )
  ),
  Round_Target_Size REAL,
  Round_Commited_Amounts REAL,
  Round_Min_Ticket_Size REAL,
  Round_Close_Date TEXT,
  Round_Summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (round_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (sponsor_company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_Round_Overview_sponsor_company_id
  ON Round_Overview(sponsor_company_id);

CREATE TABLE IF NOT EXISTS Round_Economics (
  round_id TEXT PRIMARY KEY,
  Round_Pre_Valuation REAL,
  Round_Post_Valuation REAL,
  Round_Previous_Post_Valuation REAL,
  Round_Economic_Provisions_Artifact_Id TEXT,
  Round_Liquidation_Preference_Artifact_Id TEXT,
  Round_Drag_Tag_Artifact_Id TEXT,
  Round_Put_Call_Artifact_Id TEXT,
  Round_Conversion_Artifact_Id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (round_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (Round_Economic_Provisions_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Round_Liquidation_Preference_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Round_Drag_Tag_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Round_Put_Call_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Round_Conversion_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Round_Controls (
  round_id TEXT PRIMARY KEY,
  Round_Control_Provisions_Artifact_Id TEXT,
  Round_Information_Rights_Artifact_Id TEXT,
  Round_Board_Representation_Artifact_Id TEXT,
  Round_Item_Voting_Artifact_Id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (round_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (Round_Control_Provisions_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Round_Information_Rights_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Round_Board_Representation_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Round_Item_Voting_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL
);

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
  User_PEmail TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_Users_email
  ON Users(User_PEmail);

CREATE TABLE IF NOT EXISTS Contacts (
  id TEXT PRIMARY KEY,
  Name TEXT,
  Personal_Email TEXT,
  Professional_Email TEXT,
  Phone TEXT,
  Country_based TEXT,
  LinkedIn TEXT,
  linked_user_id TEXT UNIQUE,
  FOREIGN KEY (linked_user_id) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Universities (
  id TEXT PRIMARY KEY,
  Name TEXT
);

CREATE TABLE IF NOT EXISTS EPL_Business_Units (
  id TEXT PRIMARY KEY,
  Business_Unit_Name TEXT,
  BU_Type TEXT,
  Parent_BU TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Projects (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  Project_Name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Project_Overview (
  project_id TEXT PRIMARY KEY,
  Project_Status TEXT CHECK (
    Project_Status IS NULL OR Project_Status IN (
      'Pre-Launch', 'On-Going', 'Paused', 'Finished', 'Dropped', 'Back-burner'
    )
  ),
  Project_Priority_Rank TEXT CHECK (
    Project_Priority_Rank IS NULL OR Project_Priority_Rank IN ('Low', 'Mid-Low', 'Mid', 'Mid-High', 'High')
  ),
  Project_Start_Date TEXT,
  Project_Due_Date TEXT,
  Project_End_Date TEXT,
  Project_Target_Amount REAL,
  Project_Summary TEXT,
  install_status TEXT NOT NULL DEFAULT 'not_installed' CHECK (
    install_status IN ('not_installed', 'installing', 'installed', 'uninstalling', 'error')
  ),
  install_error TEXT,
  installed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Project_Team (
  project_id TEXT PRIMARY KEY,
  Project_Team_Owner TEXT,
  Project_Team_Other_Artifact_Id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (Project_Team_Owner) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Project_Team_Other_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Project_Team_owner
  ON Project_Team(Project_Team_Owner);

CREATE TABLE IF NOT EXISTS Project_Team_Lead (
  project_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (project_id, contact_id),
  FOREIGN KEY (project_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Project_Team_Senior (
  project_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (project_id, contact_id),
  FOREIGN KEY (project_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Project_Team_Mid (
  project_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (project_id, contact_id),
  FOREIGN KEY (project_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Project_Team_Junior (
  project_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (project_id, contact_id),
  FOREIGN KEY (project_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Project_Team_Agents (
  project_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  PRIMARY KEY (project_id, agent_name),
  FOREIGN KEY (project_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Tasks (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  Task_Name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Task_Overview (
  task_id TEXT PRIMARY KEY,
  Task_Summary TEXT,
  Task_Status TEXT CHECK (
    Task_Status IS NULL OR Task_Status IN ('Backlog', 'In Progress', 'Completed', 'Closed')
  ),
  Task_Priority_Rank TEXT CHECK (
    Task_Priority_Rank IS NULL OR Task_Priority_Rank IN ('Low', 'Mid-Low', 'Mid', 'Mid-High', 'High')
  ),
  Task_Start_Date TEXT,
  Task_Due_Date TEXT,
  Task_End_Date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Task_Team (
  task_id TEXT PRIMARY KEY,
  Task_Team_Owner TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (task_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (Task_Team_Owner) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Task_Team_owner
  ON Task_Team(Task_Team_Owner);

CREATE TABLE IF NOT EXISTS Task_Team_Assigned (
  task_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (task_id, contact_id),
  FOREIGN KEY (task_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_Task_Team_Assigned_contact
  ON Task_Team_Assigned(contact_id);

CREATE TABLE IF NOT EXISTS Task_Team_Support (
  task_id TEXT NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (task_id, contact_id),
  FOREIGN KEY (task_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_Task_Team_Support_contact
  ON Task_Team_Support(contact_id);

CREATE TABLE IF NOT EXISTS IC_Scorecard (
  id TEXT PRIMARY KEY,
  Member_Name TEXT,
  Opportunity_Alignment TEXT,
  Founder_Team TEXT,
  Advisors_Support TEXT,
  Business_Model TEXT,
  Industry_Outlook TEXT,
  Vote TEXT,
  Degree_of_Confidence TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Intros (
  id TEXT PRIMARY KEY,
  Intro TEXT,
  Date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Industries (
  id TEXT PRIMARY KEY,
  Industry_Name TEXT,
  Industry_Summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Round_Securities (
  id TEXT PRIMARY KEY,
  Round_Security_Name TEXT,
  Round_Security_Summary TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS SectorGroups (
  id TEXT PRIMARY KEY,
  Sector_Name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS VerticalIndustries (
  id TEXT PRIMARY KEY,
  Vertical_Industry_Name TEXT,
  Full_Description TEXT,
  Example_related_company TEXT,
  Company_Website TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS BusinessModels (
  id TEXT PRIMARY KEY,
  Business_Models TEXT,
  Description TEXT,
  Examples TEXT,
  Category TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Regions (
  id TEXT PRIMARY KEY,
  Name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO Regions (id, Name) VALUES
  ('region_africa', 'Africa'),
  ('region_asia', 'Asia'),
  ('region_europe', 'Europe'),
  ('region_latin_america', 'Latin America'),
  ('region_middle_east', 'Middle East'),
  ('region_north_america', 'North America'),
  ('region_oceania', 'Oceania');

CREATE TABLE IF NOT EXISTS VC_Terms_Glossary (
  id TEXT PRIMARY KEY,
  Key_Term TEXT,
  Definition TEXT,
  Insights TEXT,
  Related_Formula TEXT,
  Abbreviation TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Control_Terms_Description (
  id TEXT PRIMARY KEY,
  Term TEXT,
  What_is TEXT,
  Where_to_find_it TEXT,
  Text TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Resources (
  id TEXT PRIMARY KEY,
  Nombre TEXT,
  Summary TEXT,
  Archivos_y_multimedia TEXT,
  Author TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess (
  id TEXT PRIMARY KEY,
  Task_Name TEXT,
  Task_Description TEXT,
  Pipeline_Stage TEXT,
  Pipeline_Status TEXT,
  Assigned_Position TEXT,
  Assigned_Person TEXT,
  Due TEXT,
  Last_Edited TEXT,
  File_Reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Notes (
  id TEXT PRIMARY KEY,
  created_by TEXT,
  Note_Name TEXT,
  Note_Content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notes_created_by ON Notes(created_by);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON Notes(created_at);
`

const RELATION_JOIN_TABLES_SQL = `

CREATE TABLE IF NOT EXISTS Regions_Companies_hq_region (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Regions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Regions_Companies_hq_region_to ON Regions_Companies_hq_region(to_id);

CREATE TABLE IF NOT EXISTS Industries_Companies_industries (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Industries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Industries_Companies_industries_to ON Industries_Companies_industries(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Companies_founders (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_founders_to ON Contacts_Companies_founders(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Companies_related_contacts (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_related_contacts_to ON Contacts_Companies_related_contacts(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Companies_captable_individuals (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_captable_individuals_to ON Contacts_Companies_captable_individuals(to_id);

CREATE TABLE IF NOT EXISTS Companies_Companies_captable_institutional_investors (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Companies_captable_institutional_investors_to ON Companies_Companies_captable_institutional_investors(to_id);

CREATE TABLE IF NOT EXISTS Companies_Companies_companies_invested (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Companies_companies_invested_to ON Companies_Companies_companies_invested(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Companies_referred_by (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_referred_by_to ON Contacts_Companies_referred_by(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Companies_referred_to (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_referred_to_to ON Contacts_Companies_referred_to(to_id);

CREATE TABLE IF NOT EXISTS Companies_Rounds_has_rounds (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Rounds_has_rounds_to ON Companies_Rounds_has_rounds(to_id);

CREATE TABLE IF NOT EXISTS Companies_Funds_has_funds (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Funds_has_funds_to ON Companies_Funds_has_funds(to_id);

CREATE TABLE IF NOT EXISTS Companies_Projects_projects (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Projects_projects_to ON Companies_Projects_projects(to_id);

CREATE TABLE IF NOT EXISTS Companies_Tasks_tasks (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Tasks_tasks_to ON Companies_Tasks_tasks(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Rounds_captable_individual (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Rounds_captable_individual_to ON Contacts_Rounds_captable_individual(to_id);

CREATE TABLE IF NOT EXISTS Projects_Rounds_parent_project (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Rounds_parent_project_to ON Projects_Rounds_parent_project(to_id);

CREATE TABLE IF NOT EXISTS Tasks_Rounds_tasks (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Rounds_tasks_to ON Tasks_Rounds_tasks(to_id);

CREATE TABLE IF NOT EXISTS IC_Scorecard_Rounds_qa_score (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES IC_Scorecard(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_IC_Scorecard_Rounds_qa_score_to ON IC_Scorecard_Rounds_qa_score(to_id);

CREATE TABLE IF NOT EXISTS Intros_Rounds_source_intro (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Intros(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Intros_Rounds_source_intro_to ON Intros_Rounds_source_intro(to_id);

CREATE TABLE IF NOT EXISTS Rounds_LVPortfolio_portfolio_tickets (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES LVPortfolio(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Rounds_LVPortfolio_portfolio_tickets_to ON Rounds_LVPortfolio_portfolio_tickets(to_id);

CREATE TABLE IF NOT EXISTS Funds_LVPortfolio_portfolio_tickets (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES LVPortfolio(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Funds_LVPortfolio_portfolio_tickets_to ON Funds_LVPortfolio_portfolio_tickets(to_id);

CREATE TABLE IF NOT EXISTS Regions_Rounds_target_regions (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Regions(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Regions_Rounds_target_regions_to ON Regions_Rounds_target_regions(to_id);

CREATE TABLE IF NOT EXISTS Industries_Rounds_target_industries (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Industries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Industries_Rounds_target_industries_to ON Industries_Rounds_target_industries(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Funds_captable_individuals (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Funds_captable_individuals_to ON Contacts_Funds_captable_individuals(to_id);

CREATE TABLE IF NOT EXISTS Projects_Funds_parent_project (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Funds_parent_project_to ON Projects_Funds_parent_project(to_id);

CREATE TABLE IF NOT EXISTS Tasks_Funds_tasks (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Funds_tasks_to ON Tasks_Funds_tasks(to_id);

CREATE TABLE IF NOT EXISTS IC_Scorecard_Funds_qa_score (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES IC_Scorecard(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_IC_Scorecard_Funds_qa_score_to ON IC_Scorecard_Funds_qa_score(to_id);

CREATE TABLE IF NOT EXISTS Intros_Funds_source_intro (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Intros(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Intros_Funds_source_intro_to ON Intros_Funds_source_intro(to_id);

CREATE TABLE IF NOT EXISTS Companies_LVPortfolio_portfolio_by_company (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES LVPortfolio(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_LVPortfolio_portfolio_by_company_to ON Companies_LVPortfolio_portfolio_by_company(to_id);

CREATE TABLE IF NOT EXISTS LVPortfolio_InvestmentSchedule_investment_schedule_items (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES LVPortfolio(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES InvestmentSchedule(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_LVPortfolio_InvestmentSchedule_investment_schedule_items_to ON LVPortfolio_InvestmentSchedule_investment_schedule_items(to_id);

CREATE TABLE IF NOT EXISTS Companies_InvestmentSchedule_scheduled_investments (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES InvestmentSchedule(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_InvestmentSchedule_scheduled_investments_to ON Companies_InvestmentSchedule_scheduled_investments(to_id);

CREATE TABLE IF NOT EXISTS Rounds_InvestmentSchedule_related_round (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES InvestmentSchedule(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Rounds_InvestmentSchedule_related_round_to ON Rounds_InvestmentSchedule_related_round(to_id);

CREATE TABLE IF NOT EXISTS Funds_InvestmentSchedule_related_fund (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES InvestmentSchedule(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Funds_InvestmentSchedule_related_fund_to ON Funds_InvestmentSchedule_related_fund(to_id);

CREATE TABLE IF NOT EXISTS LVPortfolio_Projects_portfolio_projects (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES LVPortfolio(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_LVPortfolio_Projects_portfolio_projects_to ON LVPortfolio_Projects_portfolio_projects(to_id);

CREATE TABLE IF NOT EXISTS LVPortfolio_Tasks_portfolio_tasks (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES LVPortfolio(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_LVPortfolio_Tasks_portfolio_tasks_to ON LVPortfolio_Tasks_portfolio_tasks(to_id);

CREATE TABLE IF NOT EXISTS Companies_Contacts_current_company (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Contacts_current_company_to ON Companies_Contacts_current_company(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Companies_tenure (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  current_company INTEGER NOT NULL DEFAULT 0 CHECK (current_company IN (0, 1)),
  started_at_date TEXT,
  ended_at_date TEXT,
  role TEXT,
  expertise TEXT,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_tenure_to ON Contacts_Companies_tenure(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Universities_degrees (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  degree TEXT NOT NULL,
  credentials TEXT,
  comments TEXT,
  PRIMARY KEY (from_id, to_id, degree),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Universities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Universities_degrees_to ON Contacts_Universities_degrees(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Companies_companies_invested (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_companies_invested_to ON Contacts_Companies_companies_invested(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Rounds_rounds_invested (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Rounds_rounds_invested_to ON Contacts_Rounds_rounds_invested(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Funds_funds_invested (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Funds_funds_invested_to ON Contacts_Funds_funds_invested(to_id);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_Contacts_lead_pax (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES EPL_Business_Units(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_Contacts_lead_pax_to ON EPL_Business_Units_Contacts_lead_pax(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Projects_project_roles (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Projects_project_roles_to ON Contacts_Projects_project_roles(to_id);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_EPL_Business_Units_bu_oa_relationships (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES EPL_Business_Units(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES EPL_Business_Units(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_EPL_Business_Units_bu_oa_relationships_to ON EPL_Business_Units_EPL_Business_Units_bu_oa_relationships(to_id);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_Projects_projects (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES EPL_Business_Units(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_Projects_projects_to ON EPL_Business_Units_Projects_projects(to_id);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_Tasks_tasks (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES EPL_Business_Units(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_Tasks_tasks_to ON EPL_Business_Units_Tasks_tasks(to_id);

CREATE TABLE IF NOT EXISTS Projects_Rounds_related_round (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Rounds_related_round_to ON Projects_Rounds_related_round(to_id);

CREATE TABLE IF NOT EXISTS Projects_Funds_related_fund (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Funds_related_fund_to ON Projects_Funds_related_fund(to_id);

CREATE TABLE IF NOT EXISTS Projects_Companies_related_companies (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Companies_related_companies_to ON Projects_Companies_related_companies(to_id);

CREATE TABLE IF NOT EXISTS Projects_EPL_Business_Units_epl_bus (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES EPL_Business_Units(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_EPL_Business_Units_epl_bus_to ON Projects_EPL_Business_Units_epl_bus(to_id);

CREATE TABLE IF NOT EXISTS Projects_Projects_related_projects (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Projects_related_projects_to ON Projects_Projects_related_projects(to_id);

CREATE TABLE IF NOT EXISTS Projects_Tasks_has_tasks (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Tasks_has_tasks_to ON Projects_Tasks_has_tasks(to_id);

CREATE TABLE IF NOT EXISTS Tasks_Companies_related_companies (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Companies_related_companies_to ON Tasks_Companies_related_companies(to_id);

CREATE TABLE IF NOT EXISTS Tasks_Rounds_related_round (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Rounds_related_round_to ON Tasks_Rounds_related_round(to_id);

CREATE TABLE IF NOT EXISTS Tasks_Funds_related_fund (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Funds_related_fund_to ON Tasks_Funds_related_fund(to_id);

CREATE TABLE IF NOT EXISTS Tasks_EPL_Business_Units_epl_bus (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES EPL_Business_Units(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_EPL_Business_Units_epl_bus_to ON Tasks_EPL_Business_Units_epl_bus(to_id);

CREATE TABLE IF NOT EXISTS Tasks_Projects_projects (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Projects_projects_to ON Tasks_Projects_projects(to_id);

CREATE TABLE IF NOT EXISTS Tasks_Tasks_parent_subtasks (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Tasks_parent_subtasks_to ON Tasks_Tasks_parent_subtasks(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Intros_source_contact (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Intros(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Intros_source_contact_to ON Contacts_Intros_source_contact(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Intros_external_party_A (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Intros(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Intros_external_party_A_to ON Contacts_Intros_external_party_A(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Intros_internal_party (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Intros(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Intros_internal_party_to ON Contacts_Intros_internal_party(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Intros_cced_parties (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Intros(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Intros_cced_parties_to ON Contacts_Intros_cced_parties(to_id);

CREATE TABLE IF NOT EXISTS Intros_Funds_related_funds (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Intros(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Intros_Funds_related_funds_to ON Intros_Funds_related_funds(to_id);

CREATE TABLE IF NOT EXISTS Intros_Rounds_related_rounds (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Intros(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Intros_Rounds_related_rounds_to ON Intros_Rounds_related_rounds(to_id);

CREATE TABLE IF NOT EXISTS SectorGroups_Industries_industries (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES SectorGroups(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Industries(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_SectorGroups_Industries_industries_to ON SectorGroups_Industries_industries(to_id);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_Industries_bu_industries (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES EPL_Business_Units(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Industries(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_Industries_bu_industries_to ON EPL_Business_Units_Industries_bu_industries(to_id);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_SectorGroups_bu_sectors (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES EPL_Business_Units(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES SectorGroups(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_SectorGroups_bu_sectors_to ON EPL_Business_Units_SectorGroups_bu_sectors(to_id);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_VerticalIndustries_verticals (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES EPL_Business_Units(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES VerticalIndustries(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_VerticalIndustries_verticals_to ON EPL_Business_Units_VerticalIndustries_verticals(to_id);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_BusinessModels_business_models (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES EPL_Business_Units(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES BusinessModels(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_BusinessModels_business_models_to ON EPL_Business_Units_BusinessModels_business_models(to_id);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_Companies_companies (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES PipelineInvestmentProcess(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_Companies_companies_to ON PipelineInvestmentProcess_Companies_companies(to_id);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_Rounds_rounds (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES PipelineInvestmentProcess(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Rounds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_Rounds_rounds_to ON PipelineInvestmentProcess_Rounds_rounds(to_id);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_Funds_funds (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES PipelineInvestmentProcess(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_Funds_funds_to ON PipelineInvestmentProcess_Funds_funds(to_id);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_Contacts_contacts (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES PipelineInvestmentProcess(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_Contacts_contacts_to ON PipelineInvestmentProcess_Contacts_contacts(to_id);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_PipelineInvestmentProcess_parent_child (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES PipelineInvestmentProcess(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES PipelineInvestmentProcess(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_PipelineInvestmentProcess_parent_child_to ON PipelineInvestmentProcess_PipelineInvestmentProcess_parent_child(to_id);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_PipelineInvestmentProcess_blocked_by_blocking (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES PipelineInvestmentProcess(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES PipelineInvestmentProcess(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_PipelineInvestmentProcess_blocked_by_blocking_to ON PipelineInvestmentProcess_PipelineInvestmentProcess_blocked_by_blocking(to_id);
`

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

CREATE TABLE IF NOT EXISTS Project_Stages (
  stage_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_terminal INTEGER NOT NULL DEFAULT 0 CHECK (is_terminal IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (project_id) REFERENCES Projects(id) ON DELETE CASCADE,
  UNIQUE (project_id, name),
  UNIQUE (project_id, position)
);

CREATE TABLE IF NOT EXISTS Round_Pipeline (
  round_id TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (round_id, pipeline_id),
  FOREIGN KEY (round_id) REFERENCES Rounds(id) ON DELETE CASCADE,
  FOREIGN KEY (pipeline_id) REFERENCES Projects(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES Project_Stages(stage_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_Round_Pipeline_pipeline
  ON Round_Pipeline(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_Round_Pipeline_stage
  ON Round_Pipeline(stage_id);

CREATE TABLE IF NOT EXISTS Fund_Pipeline (
  fund_id TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (fund_id, pipeline_id),
  FOREIGN KEY (fund_id) REFERENCES Funds(id) ON DELETE CASCADE,
  FOREIGN KEY (pipeline_id) REFERENCES Projects(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES Project_Stages(stage_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_Fund_Pipeline_pipeline
  ON Fund_Pipeline(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_Fund_Pipeline_stage
  ON Fund_Pipeline(stage_id);

INSERT OR IGNORE INTO Projects (id, Project_Name)
VALUES ('pipeline_default', 'Default Investment Pipeline');

INSERT OR IGNORE INTO Project_Overview (project_id, Project_Status, Project_Priority_Rank)
VALUES ('pipeline_default', 'On-Going', 'Mid');

INSERT OR IGNORE INTO Project_Stages (stage_id, project_id, name, position, is_terminal)
VALUES
  ('stage_thesis_alignment', 'pipeline_default', '1_thesis_alignment', 1, 0),
  ('stage_team_analysis', 'pipeline_default', '2_team_analysis', 2, 0),
  ('stage_investment_committee', 'pipeline_default', '3_investment_committee', 3, 0),
  ('stage_due_diligence', 'pipeline_default', '4_due_diligence', 4, 0),
  ('stage_closing_documents', 'pipeline_default', '5_closing_documents', 5, 1);

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

CREATE TABLE IF NOT EXISTS Company_Operations_Overview (
  company_id INTEGER PRIMARY KEY,
  Company_Stage TEXT CHECK (Company_Stage IS NULL OR Company_Stage IN ('early', 'mid', 'late')),
  Status TEXT CHECK (Status IS NULL OR Status IN ('ongoing', 'closed')),
  headquarters_city TEXT,
  PAX_Count INTEGER,
  PAX_Known INTEGER,
  business_structure_artifact_id TEXT,
  corporate_structure_artifact_id TEXT,
  organizational_structure_artifact_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (business_structure_artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (corporate_structure_artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (organizational_structure_artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Company_Operations_Overview_stage
  ON Company_Operations_Overview(Company_Stage);

CREATE INDEX IF NOT EXISTS idx_Company_Operations_Overview_hq_city
  ON Company_Operations_Overview(headquarters_city);

CREATE TABLE IF NOT EXISTS Company_Operations_Leadership_Team (
  company_id INTEGER NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (company_id, contact_id),
  FOREIGN KEY (company_id) REFERENCES Company_Operations_Overview(company_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Company_Operations_Advisors (
  company_id INTEGER NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (company_id, contact_id),
  FOREIGN KEY (company_id) REFERENCES Company_Operations_Overview(company_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Company_Business_Overview (
  company_id INTEGER PRIMARY KEY,
  Mission_Vision TEXT,
  Products_Services TEXT,
  Key_Features TEXT,
  Development_Stage TEXT,
  ICP TEXT,
  Business_Model TEXT,
  Pricing TEXT,
  Placement_Distribution TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Company_Market_Overview (
  company_id INTEGER PRIMARY KEY,
  Industry TEXT,
  Niche TEXT,
  Demand_Analysis TEXT,
  Supply_Analysis TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Company_Results_Overview (
  company_id INTEGER PRIMARY KEY,
  Traction_Overview TEXT,
  Unit_Sales_By_Type_Artifact_Id TEXT,
  Unit_Sales_By_Region_Artifact_Id TEXT,
  Unit_Sales_By_Customer_Mix_Artifact_Id TEXT,
  Revenue_Breakdown_By_Type_Artifact_Id TEXT,
  Revenue_Breakdown_By_Region_Artifact_Id TEXT,
  Revenue_Breakdown_By_Customer_Mix_Artifact_Id TEXT,
  Revenue_Breakdown_Top_10_Artifact_Id TEXT,
  Cohorts_Analysis_By_Date_Artifact_Id TEXT,
  Cohorts_Analysis_By_Product_Service_Artifact_Id TEXT,
  Direct_Costs_By_Product_Service_Artifact_Id TEXT,
  Sales_Marketing_Costs_By_Product_Service_Artifact_Id TEXT,
  Customer_Acquisition_Cost REAL,
  Customer_Lifetime_Value REAL,
  General_Admin_Expenses REAL,
  Tech_Expenditure REAL,
  Income_Statement_Artifact_Id TEXT,
  Balance_Sheet_Artifact_Id TEXT,
  Cash_Flow_Artifact_Id TEXT,
  Tax_Filings_Artifact_Id TEXT,
  Bank_Statements_Artifact_Id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (Unit_Sales_By_Type_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Unit_Sales_By_Region_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Unit_Sales_By_Customer_Mix_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Revenue_Breakdown_By_Type_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Revenue_Breakdown_By_Region_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Revenue_Breakdown_By_Customer_Mix_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Revenue_Breakdown_Top_10_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Cohorts_Analysis_By_Date_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Cohorts_Analysis_By_Product_Service_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Direct_Costs_By_Product_Service_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Sales_Marketing_Costs_By_Product_Service_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Income_Statement_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Balance_Sheet_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Cash_Flow_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Tax_Filings_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (Bank_Statements_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Company_Business_Plan (
  company_id INTEGER PRIMARY KEY,
  Overview TEXT,
  Forecast TEXT,
  Short_Term_Objectives TEXT,
  Long_Term_Objectives TEXT,
  Use_of_Resources TEXT,
  Runway_Analysis TEXT,
  Capital_Needs TEXT,
  Funding_Strategy TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Company_Fund_Raising (
  company_id INTEGER PRIMARY KEY,
  Shareholder_Structure_Artifact_Id TEXT,
  Rounds_Funds_Count INTEGER,
  Amount_Raised REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (Shareholder_Structure_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Company_Fund_Raising_Shareholders (
  company_id INTEGER NOT NULL,
  contact_id TEXT NOT NULL,
  PRIMARY KEY (company_id, contact_id),
  FOREIGN KEY (company_id) REFERENCES Company_Fund_Raising(company_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (contact_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Company_Artifacts (
  artifact_id TEXT PRIMARY KEY,
  document_type TEXT NOT NULL CHECK (
    document_type IN (
      'incorporation_certificate',
      'incorporation_articles',
      'company_bylaws',
      'intellectual_property',
      'yearly_statements',
      'quarterly_statements',
      'monthly_statements',
      'descriptive_materials'
    )
  ),
  FOREIGN KEY (artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE,
  UNIQUE (artifact_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_Company_Artifacts_document_type
  ON Company_Artifacts(document_type);

CREATE TABLE IF NOT EXISTS Companies_Artifacts_documents (
  company_id INTEGER NOT NULL,
  artifact_id TEXT NOT NULL,
  PRIMARY KEY (company_id, artifact_id),
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (artifact_id) REFERENCES Company_Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Join Tables referencing Artifacts (Moved to end)
CREATE TABLE IF NOT EXISTS Artifacts_Industries (
  artifact_id TEXT NOT NULL,
  industry_id TEXT NOT NULL,
  PRIMARY KEY (artifact_id, industry_id),
  FOREIGN KEY (artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (industry_id) REFERENCES Industries(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Artifacts_Regions (
  artifact_id TEXT NOT NULL,
  region_id TEXT NOT NULL,
  PRIMARY KEY (artifact_id, region_id),
  FOREIGN KEY (artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (region_id) REFERENCES Regions(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Artifact_Links (
  from_artifact_id TEXT NOT NULL,
  to_artifact_id TEXT NOT NULL,
  link_type TEXT NOT NULL,
  PRIMARY KEY (from_artifact_id, to_artifact_id, link_type),
  FOREIGN KEY (from_artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Artifacts_Processed (
  id TEXT PRIMARY KEY,
  Processed_Artifact_Name TEXT NOT NULL,
  Processed_Artifact_Summary TEXT,
  Original_Artifact_Id TEXT,
  Created_Files_JSON TEXT,
  Working INTEGER NOT NULL DEFAULT 0 CHECK (Working IN (0, 1)),
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (Original_Artifact_Id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES Users(id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_Artifacts_Processed_original_artifact
  ON Artifacts_Processed(Original_Artifact_Id);

CREATE INDEX IF NOT EXISTS idx_Artifacts_Processed_created_by
  ON Artifacts_Processed(created_by);

-- Triggers (Omitted for brevity, but logically follow the same FK enforcement)
`
const TRIGGERS_SQL = `
-- 0. PIPELINE INTEGRITY TRIGGERS

CREATE TRIGGER IF NOT EXISTS trg_Round_Pipeline_stage_matches_ins
BEFORE INSERT ON Round_Pipeline
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN NOT EXISTS (
        SELECT 1
        FROM Project_Stages s
        WHERE s.stage_id = NEW.stage_id
          AND s.project_id = NEW.pipeline_id
      )
      THEN RAISE(ABORT, 'stage_id does not belong to pipeline_id')
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_Fund_Pipeline_stage_matches_ins
BEFORE INSERT ON Fund_Pipeline
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN NOT EXISTS (
        SELECT 1
        FROM Project_Stages s
        WHERE s.stage_id = NEW.stage_id
          AND s.project_id = NEW.pipeline_id
      )
      THEN RAISE(ABORT, 'fund stage_id does not belong to pipeline_id')
    END;
END;

-- 1. AUTO-UPDATE TIMESTAMP TRIGGERS (Core Tables)

CREATE TRIGGER IF NOT EXISTS trg_Companies_updated_at
AFTER UPDATE ON Companies
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Companies SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Company_Incorporation_Info_updated_at
AFTER UPDATE ON Company_Incorporation_Info
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Company_Incorporation_Info
  SET updated_at = datetime('now')
  WHERE company_id = OLD.company_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Company_Operations_Overview_updated_at
AFTER UPDATE ON Company_Operations_Overview
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Company_Operations_Overview
  SET updated_at = datetime('now')
  WHERE company_id = OLD.company_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Company_Business_Overview_updated_at
AFTER UPDATE ON Company_Business_Overview
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Company_Business_Overview
  SET updated_at = datetime('now')
  WHERE company_id = OLD.company_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Company_Market_Overview_updated_at
AFTER UPDATE ON Company_Market_Overview
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Company_Market_Overview
  SET updated_at = datetime('now')
  WHERE company_id = OLD.company_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Company_Results_Overview_updated_at
AFTER UPDATE ON Company_Results_Overview
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Company_Results_Overview
  SET updated_at = datetime('now')
  WHERE company_id = OLD.company_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Company_Business_Plan_updated_at
AFTER UPDATE ON Company_Business_Plan
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Company_Business_Plan
  SET updated_at = datetime('now')
  WHERE company_id = OLD.company_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Company_Fund_Raising_updated_at
AFTER UPDATE ON Company_Fund_Raising
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Company_Fund_Raising
  SET updated_at = datetime('now')
  WHERE company_id = OLD.company_id;
END;


CREATE TRIGGER IF NOT EXISTS trg_Funds_updated_at
AFTER UPDATE ON Funds
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Funds SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Fund_Overview_updated_at
AFTER UPDATE ON Fund_Overview
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Fund_Overview SET updated_at = datetime('now') WHERE fund_id = OLD.fund_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Fund_Strategy_updated_at
AFTER UPDATE ON Fund_Strategy
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Fund_Strategy SET updated_at = datetime('now') WHERE fund_id = OLD.fund_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Fund_Economics_updated_at
AFTER UPDATE ON Fund_Economics
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Fund_Economics SET updated_at = datetime('now') WHERE fund_id = OLD.fund_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Fund_Controls_updated_at
AFTER UPDATE ON Fund_Controls
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Fund_Controls SET updated_at = datetime('now') WHERE fund_id = OLD.fund_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Rounds_updated_at
AFTER UPDATE ON Rounds
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Rounds SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Round_Overview_updated_at
AFTER UPDATE ON Round_Overview
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Round_Overview SET updated_at = datetime('now') WHERE round_id = OLD.round_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Round_Economics_updated_at
AFTER UPDATE ON Round_Economics
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Round_Economics SET updated_at = datetime('now') WHERE round_id = OLD.round_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Round_Controls_updated_at
AFTER UPDATE ON Round_Controls
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Round_Controls SET updated_at = datetime('now') WHERE round_id = OLD.round_id;
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

CREATE TRIGGER IF NOT EXISTS trg_Task_Overview_updated_at
AFTER UPDATE ON Task_Overview
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Task_Overview SET updated_at = datetime('now') WHERE task_id = OLD.task_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Task_Team_updated_at
AFTER UPDATE ON Task_Team
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Task_Team SET updated_at = datetime('now') WHERE task_id = OLD.task_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Projects_updated_at
AFTER UPDATE ON Projects
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Projects SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Project_Overview_updated_at
AFTER UPDATE ON Project_Overview
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Project_Overview SET updated_at = datetime('now') WHERE project_id = OLD.project_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Project_Team_updated_at
AFTER UPDATE ON Project_Team
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Project_Team SET updated_at = datetime('now') WHERE project_id = OLD.project_id;
END;

-- Stage must belong to pipeline on UPDATE too
CREATE TRIGGER IF NOT EXISTS trg_Round_Pipeline_stage_matches_upd
BEFORE UPDATE OF stage_id, pipeline_id ON Round_Pipeline
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM Project_Stages s
      WHERE s.stage_id = NEW.stage_id AND s.project_id = NEW.pipeline_id
    )
    THEN RAISE(ABORT, 'stage_id does not belong to pipeline_id')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_Fund_Pipeline_stage_matches_upd
BEFORE UPDATE OF stage_id, pipeline_id ON Fund_Pipeline
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM Project_Stages s
      WHERE s.stage_id = NEW.stage_id AND s.project_id = NEW.pipeline_id
    )
    THEN RAISE(ABORT, 'fund stage_id does not belong to pipeline_id')
  END;
END;

-- Asset manager subtype rows are only valid for Companies whose incorporation info type is Asset Manager
CREATE TRIGGER IF NOT EXISTS trg_Asset_Manager_Companies_type_ins
BEFORE INSERT ON Asset_Manager_Companies
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM Company_Incorporation_Info cii
      WHERE cii.company_id = NEW.company_id
        AND cii.Company_Type = 'Asset Manager'
    )
    THEN RAISE(ABORT, 'asset manager subtype requires parent company type Asset Manager')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_Asset_Manager_Companies_type_upd
BEFORE UPDATE OF company_id ON Asset_Manager_Companies
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM Company_Incorporation_Info cii
      WHERE cii.company_id = NEW.company_id
        AND cii.Company_Type = 'Asset Manager'
    )
    THEN RAISE(ABORT, 'asset manager subtype requires parent company type Asset Manager')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_Company_Incorporation_Info_asset_manager_type_guard
BEFORE UPDATE OF Company_Type ON Company_Incorporation_Info
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NEW.Company_Type <> 'Asset Manager'
      AND EXISTS (
        SELECT 1
        FROM Asset_Manager_Companies am
        WHERE am.company_id = NEW.company_id
      )
    THEN RAISE(ABORT, 'cannot change company type while asset manager subtype exists')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_Asset_Manager_Companies_updated_at
AFTER UPDATE ON Asset_Manager_Companies
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Asset_Manager_Companies
  SET updated_at = datetime('now')
  WHERE company_id = OLD.company_id;
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
