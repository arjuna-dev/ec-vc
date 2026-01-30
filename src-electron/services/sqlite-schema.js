const BASE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS Companies (
  id TEXT PRIMARY KEY,
  Company_Name TEXT,
  Company_Type TEXT,
  One_Liner TEXT,
  Status TEXT,
  Date_of_Incorporation TEXT,
  Amount_Raised_AUMs REAL,
  Rounds_Funds_Count INTEGER,
  Pax INTEGER,
  Updates TEXT,
  Website TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_Companies_company_name
  ON Companies(Company_Name);

CREATE TABLE IF NOT EXISTS Opportunities (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
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
  Pipeline_Stage TEXT,
  Pipeline_Status TEXT,
  Raising_Status TEXT,
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
  FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_Opportunities_company_id ON Opportunities(company_id);

CREATE TABLE IF NOT EXISTS Funds (
  id TEXT PRIMARY KEY,
  Fund_Oppty_Name TEXT,
  Fund_Type TEXT,
  Fund_Size_Target REAL,
  Investment_Ask REAL,
  Hard_Commits REAL,
  Soft_Commits REAL,
  Initial_Ticket_Size REAL,
  Target_Positions INTEGER,
  Follow_on_Reserve REAL,
  Investment_Stages TEXT,
  Company_Stages TEXT,
  First_Close_Date TEXT,
  Next_Close_Date TEXT,
  Final_Close_Date TEXT,
  Pipeline_Stage TEXT,
  Pipeline_Status TEXT,
  Raising_Status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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

CREATE TABLE IF NOT EXISTS Contacts (
  id TEXT PRIMARY KEY,
  Name TEXT,
  Email TEXT,
  Phone TEXT,
  LinkedIn TEXT,
  Role TEXT,
  Stakeholder_type TEXT,
  Closeness_Level TEXT,
  Comment TEXT,
  Expertise TEXT,
  Degrees_Program TEXT,
  University TEXT,
  Credentials TEXT,
  Tenure_at_Firm_yrs REAL,
  Country_based TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
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
  Project_Name TEXT,
  Type TEXT,
  Status TEXT,
  Priority_Level TEXT,
  Timeline TEXT,
  Due_Date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Tasks (
  id TEXT PRIMARY KEY,
  Task_Name TEXT,
  Task_Description TEXT,
  Type TEXT,
  Status TEXT,
  Priority TEXT,
  Timeline TEXT,
  Due_Date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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

CREATE TABLE IF NOT EXISTS Locations (
  id TEXT PRIMARY KEY,
  Name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Countries (
  id TEXT PRIMARY KEY,
  Country_Name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Cities (
  id TEXT PRIMARY KEY,
  City_Name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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
`

const RELATION_JOIN_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS Countries_Locations_has_locations (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Countries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Locations(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Locations_has_locations_to ON Countries_Locations_has_locations(to_id);

CREATE TABLE IF NOT EXISTS Countries_Cities_has_cities (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Countries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Cities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Cities_has_cities_to ON Countries_Cities_has_cities(to_id);

CREATE TABLE IF NOT EXISTS Cities_Locations_appears_in_locations (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Cities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Locations(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Cities_Locations_appears_in_locations_to ON Cities_Locations_appears_in_locations(to_id);

CREATE TABLE IF NOT EXISTS Countries_Companies_governing_law (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Countries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Companies_governing_law_to ON Countries_Companies_governing_law(to_id);

CREATE TABLE IF NOT EXISTS Countries_Companies_ops_countries (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Countries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Companies_ops_countries_to ON Countries_Companies_ops_countries(to_id);

CREATE TABLE IF NOT EXISTS Locations_Companies_hq_location (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Locations(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Locations_Companies_hq_location_to ON Locations_Companies_hq_location(to_id);

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

CREATE TABLE IF NOT EXISTS Contacts_Opportunities_captable_individual (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Opportunities_captable_individual_to ON Contacts_Opportunities_captable_individual(to_id);

CREATE TABLE IF NOT EXISTS Projects_Opportunities_parent_project (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Opportunities_parent_project_to ON Projects_Opportunities_parent_project(to_id);

CREATE TABLE IF NOT EXISTS Tasks_Opportunities_tasks (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Opportunities_tasks_to ON Tasks_Opportunities_tasks(to_id);

CREATE TABLE IF NOT EXISTS IC_Scorecard_Opportunities_qa_score (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES IC_Scorecard(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_IC_Scorecard_Opportunities_qa_score_to ON IC_Scorecard_Opportunities_qa_score(to_id);

CREATE TABLE IF NOT EXISTS Intros_Opportunities_source_intro (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Intros(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Intros_Opportunities_source_intro_to ON Intros_Opportunities_source_intro(to_id);

CREATE TABLE IF NOT EXISTS Opportunities_LVPortfolio_portfolio_tickets (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES LVPortfolio(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Opportunities_LVPortfolio_portfolio_tickets_to ON Opportunities_LVPortfolio_portfolio_tickets(to_id);

CREATE TABLE IF NOT EXISTS Countries_Funds_governing_law (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Countries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Funds_governing_law_to ON Countries_Funds_governing_law(to_id);

CREATE TABLE IF NOT EXISTS Countries_Funds_target_countries (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Countries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Funds_target_countries_to ON Countries_Funds_target_countries(to_id);

CREATE TABLE IF NOT EXISTS Industries_Funds_target_industries (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Industries(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Industries_Funds_target_industries_to ON Industries_Funds_target_industries(to_id);

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

CREATE TABLE IF NOT EXISTS Opportunities_InvestmentSchedule_related_round (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES InvestmentSchedule(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Opportunities_InvestmentSchedule_related_round_to ON Opportunities_InvestmentSchedule_related_round(to_id);

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

CREATE TABLE IF NOT EXISTS Contacts_Companies_companies_founded (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_companies_founded_to ON Contacts_Companies_companies_founded(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Companies_companies_invested (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Companies(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_companies_invested_to ON Contacts_Companies_companies_invested(to_id);

CREATE TABLE IF NOT EXISTS Contacts_Opportunities_rounds_invested (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Opportunities_rounds_invested_to ON Contacts_Opportunities_rounds_invested(to_id);

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

CREATE TABLE IF NOT EXISTS Contacts_Tasks_task_roles (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Contacts(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Tasks_task_roles_to ON Contacts_Tasks_task_roles(to_id);

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

CREATE TABLE IF NOT EXISTS Projects_Opportunities_related_round (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Projects(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Opportunities_related_round_to ON Projects_Opportunities_related_round(to_id);

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

CREATE TABLE IF NOT EXISTS Tasks_Opportunities_related_round (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Tasks(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Opportunities_related_round_to ON Tasks_Opportunities_related_round(to_id);

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

CREATE TABLE IF NOT EXISTS Intros_Opportunities_related_rounds (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES Intros(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Intros_Opportunities_related_rounds_to ON Intros_Opportunities_related_rounds(to_id);

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

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_Opportunities_venture_opportunities (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES PipelineInvestmentProcess(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Opportunities(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_Opportunities_venture_opportunities_to ON PipelineInvestmentProcess_Opportunities_venture_opportunities(to_id);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_Funds_fund_opportunities (
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  PRIMARY KEY (from_id, to_id),
  FOREIGN KEY (from_id) REFERENCES PipelineInvestmentProcess(id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_id) REFERENCES Funds(id) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_Funds_fund_opportunities_to ON PipelineInvestmentProcess_Funds_fund_opportunities(to_id);

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

CREATE TABLE IF NOT EXISTS Pipelines (
  pipeline_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dir_name TEXT,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  install_status TEXT NOT NULL DEFAULT 'not_installed' CHECK (install_status IN ('not_installed', 'installing', 'installed', 'uninstalling', 'error')),
  install_error TEXT,
  installed_at TEXT,
  uninstalled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_Pipelines_single_default
  ON Pipelines(is_default)
  WHERE is_default = 1;


CREATE UNIQUE INDEX IF NOT EXISTS idx_Pipelines_dir_name
  ON Pipelines(dir_name);

CREATE TABLE IF NOT EXISTS Pipeline_Stages (
  stage_id TEXT PRIMARY KEY,
  pipeline_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  is_terminal INTEGER NOT NULL DEFAULT 0 CHECK (is_terminal IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pipeline_id) REFERENCES Pipelines(pipeline_id) ON DELETE CASCADE,
  UNIQUE (pipeline_id, name),
  UNIQUE (pipeline_id, position)
);

CREATE TABLE IF NOT EXISTS Opportunity_Pipeline (
  opportunity_id TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (opportunity_id, pipeline_id),
  FOREIGN KEY (opportunity_id) REFERENCES Opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (pipeline_id) REFERENCES Pipelines(pipeline_id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES Pipeline_Stages(stage_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_Opportunity_Pipeline_pipeline
  ON Opportunity_Pipeline(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_Opportunity_Pipeline_stage
  ON Opportunity_Pipeline(stage_id);

CREATE TABLE IF NOT EXISTS Fund_Pipeline (
  fund_id TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  status TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (fund_id, pipeline_id),
  FOREIGN KEY (fund_id) REFERENCES Funds(id) ON DELETE CASCADE,
  FOREIGN KEY (pipeline_id) REFERENCES Pipelines(pipeline_id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES Pipeline_Stages(stage_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_Fund_Pipeline_pipeline
  ON Fund_Pipeline(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_Fund_Pipeline_stage
  ON Fund_Pipeline(stage_id);

INSERT OR IGNORE INTO Pipelines (pipeline_id, name, dir_name, is_default)
VALUES ('pipeline_default', 'Default Investment Pipeline', 'pipeline_default', 1);

INSERT OR IGNORE INTO Pipeline_Stages (stage_id, pipeline_id, name, position)
VALUES
  ('stage_thesis_alignment', 'pipeline_default', '1_thesis_alignment', 1),
  ('stage_team_analysis', 'pipeline_default', '2_team_analysis', 2),
  ('stage_investment_committee', 'pipeline_default', '3_investment_committee', 3),
  ('stage_due_diligence', 'pipeline_default', '4_due_diligence', 4),
  ('stage_closing_documents', 'pipeline_default', '5_closing_documents', 5);

CREATE TABLE IF NOT EXISTS Artifacts (
  artifact_id TEXT PRIMARY KEY,
  pipeline_run_id TEXT,
  opportunity_id TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  artifact_type   TEXT NOT NULL CHECK (artifact_type IN ('raw_input','derived','final','note','event')),
  artifact_role   TEXT,
  artifact_format TEXT,
  fs_path TEXT NOT NULL,
  fs_hash TEXT,
  fs_size_bytes INTEGER,
  source_artifact_id TEXT,
  generated_by TEXT NOT NULL CHECK (generated_by IN ('user','llm','system')),
  llm_provider TEXT,
  llm_model TEXT,
  assistant_system_prompt_id TEXT,
  title TEXT,
  summary TEXT,
  confidence_score REAL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','final','superseded','archived')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (opportunity_id) REFERENCES Opportunities(id) ON DELETE CASCADE,
  FOREIGN KEY (pipeline_id) REFERENCES Pipelines(pipeline_id) ON DELETE RESTRICT,
  FOREIGN KEY (stage_id) REFERENCES Pipeline_Stages(stage_id) ON DELETE RESTRICT,
  FOREIGN KEY (source_artifact_id) REFERENCES Artifacts(artifact_id) ON DELETE SET NULL,
  FOREIGN KEY (assistant_system_prompt_id) REFERENCES Assistant_System_Prompts(assistant_system_prompt_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_Artifacts_unique_path
  ON Artifacts(fs_path);

CREATE INDEX IF NOT EXISTS idx_Artifacts_pipeline_stage
  ON Artifacts(pipeline_id, stage_id);

CREATE INDEX IF NOT EXISTS idx_Artifacts_source
  ON Artifacts(source_artifact_id);

CREATE INDEX IF NOT EXISTS idx_Artifacts_oppty_pipeline_stage_created
  ON Artifacts(opportunity_id, pipeline_id, stage_id, created_at);

-- Join Tables referencing Artifacts (Moved to end)
CREATE TABLE IF NOT EXISTS Artifacts_Industries (
  artifact_id TEXT NOT NULL,
  industry_id TEXT NOT NULL,
  PRIMARY KEY (artifact_id, industry_id),
  FOREIGN KEY (artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (industry_id) REFERENCES Industries(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Artifacts_Locations (
  artifact_id TEXT NOT NULL,
  location_id TEXT NOT NULL,
  PRIMARY KEY (artifact_id, location_id),
  FOREIGN KEY (artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (location_id) REFERENCES Locations(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Artifact_Links (
  from_artifact_id TEXT NOT NULL,
  to_artifact_id   TEXT NOT NULL,
  link_type TEXT NOT NULL,
  PRIMARY KEY (from_artifact_id, to_artifact_id, link_type),
  FOREIGN KEY (from_artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_artifact_id) REFERENCES Artifacts(artifact_id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Triggers (Omitted for brevity, but logically follow the same FK enforcement)
`
const TRIGGERS_SQL = `
-- 1. PIPELINE INTEGRITY TRIGGERS

-- Enforce that stage_id belongs to pipeline_id in Opportunity_Pipeline
CREATE TRIGGER IF NOT EXISTS trg_Opportunity_Pipeline_stage_matches_ins
BEFORE INSERT ON Opportunity_Pipeline
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN NOT EXISTS (
        SELECT 1
        FROM Pipeline_Stages s
        WHERE s.stage_id = NEW.stage_id
          AND s.pipeline_id = NEW.pipeline_id
      )
      THEN RAISE(ABORT, 'stage_id does not belong to pipeline_id')
    END;
END;

-- Enforce artifact stage belongs to artifact pipeline
CREATE TRIGGER IF NOT EXISTS trg_Artifacts_stage_matches_pipeline_ins
BEFORE INSERT ON Artifacts
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN NOT EXISTS (
        SELECT 1
        FROM Pipeline_Stages s
        WHERE s.stage_id = NEW.stage_id
          AND s.pipeline_id = NEW.pipeline_id
      )
      THEN RAISE(ABORT, 'artifact stage_id does not belong to artifact pipeline_id')
    END;
END;

-- 2. AUTO-UPDATE TIMESTAMP TRIGGERS (Core Tables)

CREATE TRIGGER IF NOT EXISTS trg_Companies_updated_at
AFTER UPDATE ON Companies
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Companies SET updated_at = datetime('now') WHERE id = OLD.id;
END;


CREATE TRIGGER IF NOT EXISTS trg_Opportunities_updated_at
AFTER UPDATE ON Opportunities
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Opportunities SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Funds_updated_at
AFTER UPDATE ON Funds
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Funds SET updated_at = datetime('now') WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_Contacts_updated_at
AFTER UPDATE ON Contacts
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE Contacts SET updated_at = datetime('now') WHERE id = OLD.id;
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

-- Stage must belong to pipeline (Opportunity_Pipeline) on UPDATE too
CREATE TRIGGER IF NOT EXISTS trg_Opportunity_Pipeline_stage_matches_upd
BEFORE UPDATE OF stage_id, pipeline_id ON Opportunity_Pipeline
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM Pipeline_Stages s
      WHERE s.stage_id = NEW.stage_id AND s.pipeline_id = NEW.pipeline_id
    )
    THEN RAISE(ABORT, 'stage_id does not belong to pipeline_id')
  END;
END;

-- Artifact must correspond to an existing Opportunity_Pipeline mapping
CREATE TRIGGER IF NOT EXISTS trg_Artifacts_oppty_pipeline_exists_ins
BEFORE INSERT ON Artifacts
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM Opportunity_Pipeline op
      WHERE op.opportunity_id = NEW.opportunity_id
        AND op.pipeline_id = NEW.pipeline_id
    )
    THEN RAISE(ABORT, 'artifact opportunity_id is not linked to pipeline_id in Opportunity_Pipeline')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_Artifacts_oppty_pipeline_exists_upd
BEFORE UPDATE OF opportunity_id, pipeline_id ON Artifacts
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM Opportunity_Pipeline op
      WHERE op.opportunity_id = NEW.opportunity_id
        AND op.pipeline_id = NEW.pipeline_id
    )
    THEN RAISE(ABORT, 'artifact opportunity_id is not linked to pipeline_id in Opportunity_Pipeline')
  END;
END;

-- Artifact stage must belong to artifact pipeline on UPDATE too
CREATE TRIGGER IF NOT EXISTS trg_Artifacts_stage_matches_pipeline_upd
BEFORE UPDATE OF stage_id, pipeline_id ON Artifacts
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM Pipeline_Stages s
      WHERE s.stage_id = NEW.stage_id AND s.pipeline_id = NEW.pipeline_id
    )
    THEN RAISE(ABORT, 'artifact stage_id does not belong to artifact pipeline_id')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_Fund_Pipeline_stage_matches_ins
BEFORE INSERT ON Fund_Pipeline
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM Pipeline_Stages s
      WHERE s.stage_id = NEW.stage_id AND s.pipeline_id = NEW.pipeline_id
    )
    THEN RAISE(ABORT, 'fund stage_id does not belong to pipeline_id')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_Fund_Pipeline_stage_matches_upd
BEFORE UPDATE OF stage_id, pipeline_id ON Fund_Pipeline
FOR EACH ROW
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1 FROM Pipeline_Stages s
      WHERE s.stage_id = NEW.stage_id AND s.pipeline_id = NEW.pipeline_id
    )
    THEN RAISE(ABORT, 'fund stage_id does not belong to pipeline_id')
  END;
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
