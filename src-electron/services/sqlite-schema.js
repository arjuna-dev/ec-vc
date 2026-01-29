const BASE_TABLES_SQL = `

CREATE TABLE IF NOT EXISTS Companies (
  url TEXT PRIMARY KEY,
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
  createdTime TEXT,
  Fecha_de_creacion TEXT
);

CREATE TABLE IF NOT EXISTS Opportunities (
  url TEXT PRIMARY KEY,
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
  Created_Date TEXT,
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
  Stacked_Series TEXT
);

CREATE TABLE IF NOT EXISTS Funds (
  url TEXT PRIMARY KEY,
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
  Created_Date TEXT
);

CREATE TABLE IF NOT EXISTS LVPortfolio (
  url TEXT PRIMARY KEY,
  Ticket_Name TEXT,
  Commitment REAL
);

CREATE TABLE IF NOT EXISTS InvestmentSchedule (
  url TEXT PRIMARY KEY,
  Short_Name TEXT,
  Amount REAL,
  Currency TEXT,
  Fx_Rate REAL,
  Investment_Date TEXT
);

CREATE TABLE IF NOT EXISTS Contacts (
  url TEXT PRIMARY KEY,
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
  Country_based TEXT
);

CREATE TABLE IF NOT EXISTS EPL_Business_Units (
  url TEXT PRIMARY KEY,
  Business_Unit_Name TEXT,
  BU_Type TEXT,
  Parent_BU TEXT
);

CREATE TABLE IF NOT EXISTS Projects (
  url TEXT PRIMARY KEY,
  Project_Name TEXT,
  Type TEXT,
  Status TEXT,
  Priority_Level TEXT,
  Timeline TEXT,
  Due_Date TEXT
);

CREATE TABLE IF NOT EXISTS Tasks (
  url TEXT PRIMARY KEY,
  Task_Name TEXT,
  Task_Description TEXT,
  Type TEXT,
  Status TEXT,
  Priority TEXT,
  Timeline TEXT,
  Due_Date TEXT,
  Fecha_de_creacion TEXT
);

CREATE TABLE IF NOT EXISTS Notes (
  url TEXT PRIMARY KEY,
  Note_Name TEXT,
  Created TEXT,
  Created_By TEXT,
  Last_Edited_Time TEXT
);

CREATE TABLE IF NOT EXISTS Documents (
  url TEXT PRIMARY KEY,
  Doc_Name TEXT,
  Type TEXT,
  Files_media TEXT
);

CREATE TABLE IF NOT EXISTS Events (
  url TEXT PRIMARY KEY,
  Event_Name TEXT,
  Date TEXT,
  Type TEXT,
  Priority_Level TEXT
);

CREATE TABLE IF NOT EXISTS IC_Scorecard (
  url TEXT PRIMARY KEY,
  Member_Name TEXT,
  Opportunity_Alignment TEXT,
  Founder_Team TEXT,
  Advisors_Support TEXT,
  Business_Model TEXT,
  Industry_Outlook TEXT,
  Vote TEXT,
  Degree_of_Confidence TEXT
);

CREATE TABLE IF NOT EXISTS Intros (
  url TEXT PRIMARY KEY,
  Intro TEXT,
  Date TEXT
);

CREATE TABLE IF NOT EXISTS Industries (
  url TEXT PRIMARY KEY,
  Industry_Name TEXT
);

CREATE TABLE IF NOT EXISTS SectorGroups (
  url TEXT PRIMARY KEY,
  Sector_Name TEXT
);

CREATE TABLE IF NOT EXISTS VerticalIndustries (
  url TEXT PRIMARY KEY,
  Vertical_Industry_Name TEXT,
  Full_Description TEXT,
  Example_related_company TEXT,
  Company_Website TEXT
);

CREATE TABLE IF NOT EXISTS BusinessModels (
  url TEXT PRIMARY KEY,
  Business_Models TEXT,
  Description TEXT,
  Examples TEXT,
  Category TEXT
);

CREATE TABLE IF NOT EXISTS Locations (
  url TEXT PRIMARY KEY,
  Name TEXT
);

CREATE TABLE IF NOT EXISTS Countries (
  url TEXT PRIMARY KEY,
  Country_Name TEXT
);

CREATE TABLE IF NOT EXISTS Cities (
  url TEXT PRIMARY KEY,
  City_Name TEXT
);

CREATE TABLE IF NOT EXISTS VC_Terms_Glossary (
  url TEXT PRIMARY KEY,
  Key_Term TEXT,
  Definition TEXT,
  Insights TEXT,
  Related_Formula TEXT,
  Abbreviation TEXT
);

CREATE TABLE IF NOT EXISTS Control_Terms_Description (
  url TEXT PRIMARY KEY,
  Term TEXT,
  What_is TEXT,
  Where_to_find_it TEXT,
  Text TEXT
);

CREATE TABLE IF NOT EXISTS Resources (
  url TEXT PRIMARY KEY,
  Nombre TEXT,
  Summary TEXT,
  Archivos_y_multimedia TEXT,
  Author TEXT
);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess (
  url TEXT PRIMARY KEY,
  Task_Name TEXT,
  Task_Description TEXT,
  Pipeline_Stage TEXT,
  Pipeline_Status TEXT,
  Assigned_Position TEXT,
  Assigned_Person TEXT,
  Due TEXT,
  Last_Edited TEXT,
  File_Reference TEXT
);

`

const RELATION_JOIN_TABLES_SQL = `

CREATE TABLE IF NOT EXISTS Countries_Locations_has_locations (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Countries(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Locations(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Locations_has_locations_to ON Countries_Locations_has_locations(to_url);

CREATE TABLE IF NOT EXISTS Countries_Cities_has_cities (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Countries(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Cities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Cities_has_cities_to ON Countries_Cities_has_cities(to_url);

CREATE TABLE IF NOT EXISTS Cities_Locations_appears_in_locations (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Cities(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Locations(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Cities_Locations_appears_in_locations_to ON Cities_Locations_appears_in_locations(to_url);

CREATE TABLE IF NOT EXISTS Countries_Companies_governing_law (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Countries(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Companies_governing_law_to ON Countries_Companies_governing_law(to_url);

CREATE TABLE IF NOT EXISTS Countries_Companies_ops_countries (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Countries(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Companies_ops_countries_to ON Countries_Companies_ops_countries(to_url);

CREATE TABLE IF NOT EXISTS Locations_Companies_hq_location (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Locations(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Locations_Companies_hq_location_to ON Locations_Companies_hq_location(to_url);

CREATE TABLE IF NOT EXISTS Industries_Companies_industries (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Industries(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Industries_Companies_industries_to ON Industries_Companies_industries(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Companies_founders (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_founders_to ON Contacts_Companies_founders(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Companies_related_contacts (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_related_contacts_to ON Contacts_Companies_related_contacts(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Companies_captable_individuals (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_captable_individuals_to ON Contacts_Companies_captable_individuals(to_url);

CREATE TABLE IF NOT EXISTS Companies_Companies_captable_institutional_investors (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Companies_captable_institutional_investors_to ON Companies_Companies_captable_institutional_investors(to_url);

CREATE TABLE IF NOT EXISTS Companies_Companies_companies_invested (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Companies_companies_invested_to ON Companies_Companies_companies_invested(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Companies_referred_by (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_referred_by_to ON Contacts_Companies_referred_by(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Companies_referred_to (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_referred_to_to ON Contacts_Companies_referred_to(to_url);

CREATE TABLE IF NOT EXISTS Companies_Opportunities_has_rounds (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Opportunities_has_rounds_to ON Companies_Opportunities_has_rounds(to_url);

CREATE TABLE IF NOT EXISTS Companies_Funds_has_funds (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Funds_has_funds_to ON Companies_Funds_has_funds(to_url);

CREATE TABLE IF NOT EXISTS Companies_Projects_projects (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Projects_projects_to ON Companies_Projects_projects(to_url);

CREATE TABLE IF NOT EXISTS Companies_Tasks_tasks (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Tasks_tasks_to ON Companies_Tasks_tasks(to_url);

CREATE TABLE IF NOT EXISTS Companies_Notes_notes (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Notes(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Notes_notes_to ON Companies_Notes_notes(to_url);

CREATE TABLE IF NOT EXISTS Companies_Documents_documents (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Documents(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Documents_documents_to ON Companies_Documents_documents(to_url);

CREATE TABLE IF NOT EXISTS Companies_Events_events (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Events(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Events_events_to ON Companies_Events_events(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Opportunities_captable_individual (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Opportunities_captable_individual_to ON Contacts_Opportunities_captable_individual(to_url);

CREATE TABLE IF NOT EXISTS Projects_Opportunities_parent_project (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Opportunities_parent_project_to ON Projects_Opportunities_parent_project(to_url);

CREATE TABLE IF NOT EXISTS Documents_Opportunities_descriptive_materials (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Documents(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Documents_Opportunities_descriptive_materials_to ON Documents_Opportunities_descriptive_materials(to_url);

CREATE TABLE IF NOT EXISTS Notes_Opportunities_notes (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Notes(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Notes_Opportunities_notes_to ON Notes_Opportunities_notes(to_url);

CREATE TABLE IF NOT EXISTS Tasks_Opportunities_tasks (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Opportunities_tasks_to ON Tasks_Opportunities_tasks(to_url);

CREATE TABLE IF NOT EXISTS IC_Scorecard_Opportunities_qa_score (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES IC_Scorecard(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_IC_Scorecard_Opportunities_qa_score_to ON IC_Scorecard_Opportunities_qa_score(to_url);

CREATE TABLE IF NOT EXISTS Intros_Opportunities_source_intro (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Intros(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Intros_Opportunities_source_intro_to ON Intros_Opportunities_source_intro(to_url);

CREATE TABLE IF NOT EXISTS Opportunities_LVPortfolio_portfolio_tickets (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES LVPortfolio(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Opportunities_LVPortfolio_portfolio_tickets_to ON Opportunities_LVPortfolio_portfolio_tickets(to_url);

CREATE TABLE IF NOT EXISTS Countries_Funds_governing_law (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Countries(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Funds_governing_law_to ON Countries_Funds_governing_law(to_url);

CREATE TABLE IF NOT EXISTS Countries_Funds_target_countries (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Countries(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Countries_Funds_target_countries_to ON Countries_Funds_target_countries(to_url);

CREATE TABLE IF NOT EXISTS Industries_Funds_target_industries (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Industries(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Industries_Funds_target_industries_to ON Industries_Funds_target_industries(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Funds_captable_individuals (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Funds_captable_individuals_to ON Contacts_Funds_captable_individuals(to_url);

CREATE TABLE IF NOT EXISTS Projects_Funds_parent_project (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Funds_parent_project_to ON Projects_Funds_parent_project(to_url);

CREATE TABLE IF NOT EXISTS Documents_Funds_descriptive_materials (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Documents(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Documents_Funds_descriptive_materials_to ON Documents_Funds_descriptive_materials(to_url);

CREATE TABLE IF NOT EXISTS Notes_Funds_notes (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Notes(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Notes_Funds_notes_to ON Notes_Funds_notes(to_url);

CREATE TABLE IF NOT EXISTS Tasks_Funds_tasks (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Funds_tasks_to ON Tasks_Funds_tasks(to_url);

CREATE TABLE IF NOT EXISTS IC_Scorecard_Funds_qa_score (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES IC_Scorecard(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_IC_Scorecard_Funds_qa_score_to ON IC_Scorecard_Funds_qa_score(to_url);

CREATE TABLE IF NOT EXISTS Intros_Funds_source_intro (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Intros(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Intros_Funds_source_intro_to ON Intros_Funds_source_intro(to_url);

CREATE TABLE IF NOT EXISTS Companies_LVPortfolio_portfolio_by_company (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES LVPortfolio(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_LVPortfolio_portfolio_by_company_to ON Companies_LVPortfolio_portfolio_by_company(to_url);

CREATE TABLE IF NOT EXISTS Opportunities_LVPortfolio_portfolio_by_round (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES LVPortfolio(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Opportunities_LVPortfolio_portfolio_by_round_to ON Opportunities_LVPortfolio_portfolio_by_round(to_url);

CREATE TABLE IF NOT EXISTS LVPortfolio_InvestmentSchedule_investment_schedule_items (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES LVPortfolio(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES InvestmentSchedule(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_LVPortfolio_InvestmentSchedule_investment_schedule_items_to ON LVPortfolio_InvestmentSchedule_investment_schedule_items(to_url);

CREATE TABLE IF NOT EXISTS Companies_InvestmentSchedule_scheduled_investments (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES InvestmentSchedule(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_InvestmentSchedule_scheduled_investments_to ON Companies_InvestmentSchedule_scheduled_investments(to_url);

CREATE TABLE IF NOT EXISTS Opportunities_InvestmentSchedule_related_round (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES InvestmentSchedule(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Opportunities_InvestmentSchedule_related_round_to ON Opportunities_InvestmentSchedule_related_round(to_url);

CREATE TABLE IF NOT EXISTS Funds_InvestmentSchedule_related_fund (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES InvestmentSchedule(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Funds_InvestmentSchedule_related_fund_to ON Funds_InvestmentSchedule_related_fund(to_url);

CREATE TABLE IF NOT EXISTS LVPortfolio_Projects_portfolio_projects (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES LVPortfolio(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_LVPortfolio_Projects_portfolio_projects_to ON LVPortfolio_Projects_portfolio_projects(to_url);

CREATE TABLE IF NOT EXISTS LVPortfolio_Tasks_portfolio_tasks (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES LVPortfolio(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_LVPortfolio_Tasks_portfolio_tasks_to ON LVPortfolio_Tasks_portfolio_tasks(to_url);

CREATE TABLE IF NOT EXISTS LVPortfolio_Notes_portfolio_notes (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES LVPortfolio(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Notes(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_LVPortfolio_Notes_portfolio_notes_to ON LVPortfolio_Notes_portfolio_notes(to_url);

CREATE TABLE IF NOT EXISTS LVPortfolio_Documents_portfolio_documents (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES LVPortfolio(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Documents(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_LVPortfolio_Documents_portfolio_documents_to ON LVPortfolio_Documents_portfolio_documents(to_url);

CREATE TABLE IF NOT EXISTS Companies_Contacts_current_company (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Companies_Contacts_current_company_to ON Companies_Contacts_current_company(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Companies_companies_founded (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_companies_founded_to ON Contacts_Companies_companies_founded(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Companies_companies_invested (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Companies_companies_invested_to ON Contacts_Companies_companies_invested(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Opportunities_rounds_invested (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Opportunities_rounds_invested_to ON Contacts_Opportunities_rounds_invested(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Funds_funds_invested (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Funds_funds_invested_to ON Contacts_Funds_funds_invested(to_url);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_Contacts_lead_pax (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_Contacts_lead_pax_to ON EPL_Business_Units_Contacts_lead_pax(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Projects_project_roles (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Projects_project_roles_to ON Contacts_Projects_project_roles(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Tasks_task_roles (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Tasks_task_roles_to ON Contacts_Tasks_task_roles(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Notes_notes (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Notes(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Notes_notes_to ON Contacts_Notes_notes(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Documents_documents (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Documents(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Documents_documents_to ON Contacts_Documents_documents(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Events_events (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Events(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Events_events_to ON Contacts_Events_events(to_url);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_EPL_Business_Units_bu_oa_relationships (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_EPL_Business_Units_bu_oa_relationships_to ON EPL_Business_Units_EPL_Business_Units_bu_oa_relationships(to_url);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_Projects_projects (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_Projects_projects_to ON EPL_Business_Units_Projects_projects(to_url);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_Tasks_tasks (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_Tasks_tasks_to ON EPL_Business_Units_Tasks_tasks(to_url);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_Notes_notes (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Notes(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_Notes_notes_to ON EPL_Business_Units_Notes_notes(to_url);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_Documents_documents (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Documents(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_Documents_documents_to ON EPL_Business_Units_Documents_documents(to_url);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_Events_events (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Events(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_Events_events_to ON EPL_Business_Units_Events_events(to_url);

CREATE TABLE IF NOT EXISTS Projects_Opportunities_related_round (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Opportunities_related_round_to ON Projects_Opportunities_related_round(to_url);

CREATE TABLE IF NOT EXISTS Projects_Funds_related_fund (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Funds_related_fund_to ON Projects_Funds_related_fund(to_url);

CREATE TABLE IF NOT EXISTS Projects_Companies_related_companies (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Companies_related_companies_to ON Projects_Companies_related_companies(to_url);

CREATE TABLE IF NOT EXISTS Projects_EPL_Business_Units_epl_bus (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_EPL_Business_Units_epl_bus_to ON Projects_EPL_Business_Units_epl_bus(to_url);

CREATE TABLE IF NOT EXISTS Projects_Projects_related_projects (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Projects_related_projects_to ON Projects_Projects_related_projects(to_url);

CREATE TABLE IF NOT EXISTS Projects_Tasks_has_tasks (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Tasks_has_tasks_to ON Projects_Tasks_has_tasks(to_url);

CREATE TABLE IF NOT EXISTS Projects_Notes_notes (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Notes(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Notes_notes_to ON Projects_Notes_notes(to_url);

CREATE TABLE IF NOT EXISTS Projects_Documents_documents (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Documents(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Documents_documents_to ON Projects_Documents_documents(to_url);

CREATE TABLE IF NOT EXISTS Projects_Events_events (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Events(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Projects_Events_events_to ON Projects_Events_events(to_url);

CREATE TABLE IF NOT EXISTS Tasks_Companies_related_companies (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Companies_related_companies_to ON Tasks_Companies_related_companies(to_url);

CREATE TABLE IF NOT EXISTS Tasks_Opportunities_related_round (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Opportunities_related_round_to ON Tasks_Opportunities_related_round(to_url);

CREATE TABLE IF NOT EXISTS Tasks_Funds_related_fund (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Funds_related_fund_to ON Tasks_Funds_related_fund(to_url);

CREATE TABLE IF NOT EXISTS Tasks_EPL_Business_Units_epl_bus (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_EPL_Business_Units_epl_bus_to ON Tasks_EPL_Business_Units_epl_bus(to_url);

CREATE TABLE IF NOT EXISTS Tasks_Projects_projects (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Projects(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Projects_projects_to ON Tasks_Projects_projects(to_url);

CREATE TABLE IF NOT EXISTS Tasks_Tasks_parent_subtasks (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Tasks_parent_subtasks_to ON Tasks_Tasks_parent_subtasks(to_url);

CREATE TABLE IF NOT EXISTS Tasks_Notes_notes (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Notes(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Notes_notes_to ON Tasks_Notes_notes(to_url);

CREATE TABLE IF NOT EXISTS Tasks_Documents_documents (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Documents(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Documents_documents_to ON Tasks_Documents_documents(to_url);

CREATE TABLE IF NOT EXISTS Tasks_Events_events (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Tasks(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Events(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Tasks_Events_events_to ON Tasks_Events_events(to_url);

CREATE TABLE IF NOT EXISTS Notes_Documents_linked_documents (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Notes(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Documents(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Notes_Documents_linked_documents_to ON Notes_Documents_linked_documents(to_url);

CREATE TABLE IF NOT EXISTS Notes_Events_linked_events (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Notes(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Events(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Notes_Events_linked_events_to ON Notes_Events_linked_events(to_url);

CREATE TABLE IF NOT EXISTS Documents_Events_linked_events (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Documents(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Events(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Documents_Events_linked_events_to ON Documents_Events_linked_events(to_url);

CREATE TABLE IF NOT EXISTS Industries_Notes_industries (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Industries(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Notes(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Industries_Notes_industries_to ON Industries_Notes_industries(to_url);

CREATE TABLE IF NOT EXISTS Industries_Documents_industries (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Industries(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Documents(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Industries_Documents_industries_to ON Industries_Documents_industries(to_url);

CREATE TABLE IF NOT EXISTS Industries_Events_industries (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Industries(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Events(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Industries_Events_industries_to ON Industries_Events_industries(to_url);

CREATE TABLE IF NOT EXISTS Locations_Events_event_locations (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Locations(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Events(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Locations_Events_event_locations_to ON Locations_Events_event_locations(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Intros_source_contact (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Intros(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Intros_source_contact_to ON Contacts_Intros_source_contact(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Intros_external_party_A (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Intros(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Intros_external_party_A_to ON Contacts_Intros_external_party_A(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Intros_internal_party (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Intros(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Intros_internal_party_to ON Contacts_Intros_internal_party(to_url);

CREATE TABLE IF NOT EXISTS Contacts_Intros_cced_parties (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Intros(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Contacts_Intros_cced_parties_to ON Contacts_Intros_cced_parties(to_url);

CREATE TABLE IF NOT EXISTS Intros_Funds_related_funds (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Intros(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Intros_Funds_related_funds_to ON Intros_Funds_related_funds(to_url);

CREATE TABLE IF NOT EXISTS Intros_Opportunities_related_rounds (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES Intros(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_Intros_Opportunities_related_rounds_to ON Intros_Opportunities_related_rounds(to_url);

CREATE TABLE IF NOT EXISTS SectorGroups_Industries_industries (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES SectorGroups(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Industries(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_SectorGroups_Industries_industries_to ON SectorGroups_Industries_industries(to_url);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_Industries_bu_industries (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Industries(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_Industries_bu_industries_to ON EPL_Business_Units_Industries_bu_industries(to_url);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_SectorGroups_bu_sectors (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES SectorGroups(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_SectorGroups_bu_sectors_to ON EPL_Business_Units_SectorGroups_bu_sectors(to_url);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_VerticalIndustries_verticals (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES VerticalIndustries(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_VerticalIndustries_verticals_to ON EPL_Business_Units_VerticalIndustries_verticals(to_url);

CREATE TABLE IF NOT EXISTS EPL_Business_Units_BusinessModels_business_models (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES EPL_Business_Units(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES BusinessModels(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_EPL_Business_Units_BusinessModels_business_models_to ON EPL_Business_Units_BusinessModels_business_models(to_url);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_Companies_companies (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES PipelineInvestmentProcess(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Companies(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_Companies_companies_to ON PipelineInvestmentProcess_Companies_companies(to_url);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_Opportunities_venture_opportunities (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES PipelineInvestmentProcess(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Opportunities(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_Opportunities_venture_opportunities_to ON PipelineInvestmentProcess_Opportunities_venture_opportunities(to_url);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_Funds_fund_opportunities (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES PipelineInvestmentProcess(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Funds(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_Funds_fund_opportunities_to ON PipelineInvestmentProcess_Funds_fund_opportunities(to_url);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_Contacts_contacts (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES PipelineInvestmentProcess(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES Contacts(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_Contacts_contacts_to ON PipelineInvestmentProcess_Contacts_contacts(to_url);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_PipelineInvestmentProcess_parent_child (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES PipelineInvestmentProcess(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES PipelineInvestmentProcess(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_PipelineInvestmentProcess_parent_child_to ON PipelineInvestmentProcess_PipelineInvestmentProcess_parent_child(to_url);

CREATE TABLE IF NOT EXISTS PipelineInvestmentProcess_PipelineInvestmentProcess_blocked_by_blocking (
  from_url TEXT NOT NULL,
  to_url TEXT NOT NULL,
  PRIMARY KEY (from_url, to_url),
  FOREIGN KEY (from_url) REFERENCES PipelineInvestmentProcess(url) ON UPDATE CASCADE ON DELETE CASCADE,
  FOREIGN KEY (to_url) REFERENCES PipelineInvestmentProcess(url) ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_PipelineInvestmentProcess_PipelineInvestmentProcess_blocked_by_blocking_to ON PipelineInvestmentProcess_PipelineInvestmentProcess_blocked_by_blocking(to_url);

`

const PIPELINES_SQL = `
CREATE TABLE IF NOT EXISTS Pipelines (
  pipeline_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dir_name TEXT NOT NULL,
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

  FOREIGN KEY (pipeline_id) REFERENCES Pipelines(pipeline_id) ON DELETE CASCADE,
  UNIQUE (pipeline_id, name),
  UNIQUE (pipeline_id, position)
);

-- Canonical pipeline-to-opportunity mapping (M2M + current stage)
CREATE TABLE IF NOT EXISTS Opportunity_Pipeline (
  opportunity_url TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  status TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  PRIMARY KEY (opportunity_url, pipeline_id),

  FOREIGN KEY (opportunity_url) REFERENCES Opportunities(url) ON DELETE CASCADE,
  FOREIGN KEY (pipeline_id) REFERENCES Pipelines(pipeline_id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES Pipeline_Stages(stage_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_Opportunity_Pipeline_pipeline
  ON Opportunity_Pipeline(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_Opportunity_Pipeline_stage
  ON Opportunity_Pipeline(stage_id);

-- Optional: same model for fund opportunities
CREATE TABLE IF NOT EXISTS Fund_Pipeline (
  fund_url TEXT NOT NULL,
  pipeline_id TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  status TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),

  PRIMARY KEY (fund_url, pipeline_id),

  FOREIGN KEY (fund_url) REFERENCES Funds(url) ON DELETE CASCADE,
  FOREIGN KEY (pipeline_id) REFERENCES Pipelines(pipeline_id) ON DELETE CASCADE,
  FOREIGN KEY (stage_id) REFERENCES Pipeline_Stages(stage_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_Fund_Pipeline_pipeline
  ON Fund_Pipeline(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_Fund_Pipeline_stage
  ON Fund_Pipeline(stage_id);

-- Enforce that stage_id belongs to pipeline_id (SQLite can't do this with pure FKs)
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

CREATE TRIGGER IF NOT EXISTS trg_Opportunity_Pipeline_stage_matches_upd
BEFORE UPDATE OF stage_id, pipeline_id ON Opportunity_Pipeline
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

CREATE TRIGGER IF NOT EXISTS trg_Fund_Pipeline_stage_matches_ins
BEFORE INSERT ON Fund_Pipeline
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

CREATE TRIGGER IF NOT EXISTS trg_Fund_Pipeline_stage_matches_upd
BEFORE UPDATE OF stage_id, pipeline_id ON Fund_Pipeline
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

-- Seed a default pipeline and default stages (EC10-style)
INSERT OR IGNORE INTO Pipelines (pipeline_id, name, dir_name, is_default)
VALUES ('pipeline_default', 'Default Investment Pipeline', 'Default Investment Pipeline', 1);

INSERT OR IGNORE INTO Pipeline_Stages (stage_id, pipeline_id, name, position)
VALUES
  ('stage_thesis_alignment', 'pipeline_default', '1_thesis_alignment', 1),
  ('stage_team_analysis', 'pipeline_default', '2_team_analysis', 2),
  ('stage_investment_committee', 'pipeline_default', '3_investment_committee', 3),
  ('stage_due_diligence', 'pipeline_default', '4_due_diligence', 4),
  ('stage_closing_documents', 'pipeline_default', '5_closing_documents', 5);
`

export const SCHEMA_V1_SQL = `
BEGIN;
${BASE_TABLES_SQL}
${RELATION_JOIN_TABLES_SQL}
${PIPELINES_SQL}
COMMIT;
`
