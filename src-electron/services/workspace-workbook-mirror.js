import fs from 'node:fs/promises'
import path from 'node:path'

import { dbAll } from './sqlite-db.js'
import {
  getNetworkDatabaseSectionPath,
} from './workspace-structure.js'

const CHANGE_LOG_TOKENS = [
  'Event_ID',
  'Source_Table',
  'Record_ID',
  'Field_Name',
  'Old_Value',
  'New_Value',
  'Edited_By',
  'Edited_At',
]

const CHANGE_LOG_LEVEL2 = ['1', '1', '1', '1', '1', '1', '1', '1']
const CHANGE_LOG_LEVEL3 = ['1', '2', '3', '4', '5', '6', '7', '8']

const TOKEN_GROUPS = {
  Artifact: [
    'Artifact_ID',
    'Artifact_Creator',
    'Artifact_Time_Stamp',
    'Artifact_Date_Stamp',
    'Artifact_File',
    'Artifact_User',
    'Artifact_Contact',
    'Artifact_Company',
    'Artifact_Fund',
    'Artifact_Round',
    'Artifact_Project',
    'Artifact_Task',
    'Artifact_Note',
  ],
  User: [
    'User_ID',
    'User_Name',
    'User_Email',
    'User_Artifact',
    'User_Contact',
    'User_Company',
    'User_Fund',
    'User_Round',
    'User_Project',
    'User_Task',
    'User_Note',
  ],
  Contact: [
    'Contact_ID',
    'Contact_Name',
    'Contact_PEmail',
    'Contact_BEmail',
    'Contact_Phone',
    'Contact_HQ',
    'Contact_LinkedIn',
    'Contact_Artifact',
    'Contact_User',
    'Contact_Company',
    'Contact_Fund',
    'Contact_Round',
    'Contact_Project',
    'Contact_Task',
    'Contact_Note',
    'Contact_Employment',
    'Contact_Studies',
  ],
  Company: [
    'Company_ID',
    'Company_Creator',
    'Company_Time_Stamp',
    'Company_Date_Stamp',
    'Company_Status',
    'Company_Short_Name',
    'Company_Website',
    'Company_Tagline',
    'Company_Artifact',
    'Company_User',
    'Company_Contact',
    'Company_Company',
    'Company_Fund',
    'Company_Round',
    'Company_Project',
    'Company_Task',
    'Company_Note',
    'Company_Legal_Name',
    'Company_Inc_Date',
    'Company_Inc_Country',
    'Company_Entity_Type',
    'Company_Founders',
    'Company_Inc_Certificate',
    'Company_Inc_Articles',
    'Company_Agreements',
    'Company_Bylaws',
    'Company_IP',
    'Company_FS_Yearly',
    'Company_FS_Quarterly',
    'Company_FS_Monthly',
    'Company_Descriptives',
    'Company_Stage',
    'Company_HQ_Locations',
    'Company_Ops_Locations',
    'Company_Pax_Count',
    'Company_Pax_Known',
    'Company_Business_Structure',
    'Company_Corporate_Structure',
    'Company_Organizational_Structure',
    'Company_Leadership_Team',
    'Company_Advisors',
    'Company_Other',
    'Company_Description',
    'Company_News',
    'Company_Updates',
    'Company_Objectives',
    'Company_Products',
    'Company_Key_Features',
    'Company_Backlog_Features',
    'Company_ICP',
    'Company_Business_Model',
    'Company_Pricing',
    'Company_Placement',
    'Company_Promotion',
    'Company_Market',
    'Company_Demand_Analysis',
    'Company_Supply_Analysis',
    'Company_Traction',
    'Company_Sales',
    'Company_Revenue',
    'Company_Clients_Analysis',
    'Company_Cohorts_Analysis',
    'Company_Costs_Direct',
    'Company_Costs_Indirect',
    'Company_Costs_Marketing',
    'Company_Unit_Economics',
    'Company_CAC',
    'Company_LTV',
    'Company_Costs_Admin',
    'Company_Costs_Tech_RD',
    'Company_IS',
    'Company_BS',
    'Company_CF',
    'Company_Tax_Filings',
    'Company_Bank_Statements',
    'Company_BP_Fcst',
    'Company_BP_ST_Obj',
    'Company_BP_LT_Obj',
    'Company_BP_Resources_Uses',
    'Company_BP_Runway',
    'Company_BP_Capital_Need',
    'Company_BP_Funding_Strategy',
    'Company_Shareholder_Structure',
    'Company_Shareholders',
    'Company_Round_Raised',
    'Company_Amount_Raised',
  ],
  Fund: [
    'Fund_ID',
    'Fund_Creator',
    'Fund_Time_Stamp',
    'Fund_Date_Stamp',
    'Fund_Name',
    'Fund_Artifact',
    'Fund_User',
    'Fund_Contact',
    'Fund_Company',
    'Fund_Fund',
    'Fund_Round',
    'Fund_Project',
    'Fund_Task',
    'Fund_Note',
    'Fund_Manager',
    'Fund_Raising_Status',
    'Fund_Period',
    'Fund_Target_Size',
    'Fund_Commited_Amounts',
    'Fund_Min_Ticket_Size',
    'Fund_Close_Date',
    'Fund_Summary',
    'Fund_Reserve',
    'Fund_Initial_Ticket_Size',
    'Fund_Target_Positions',
    'Fund_Target_Regions',
    'Fund_Target_Asset_Types',
    'Fund_Target_Industries',
    'Fund_Target_Stages',
    'Fund_Other',
    'Fund_Economic_Provisions',
    'Fund_Fees',
    'Fund_Promote',
    'Fund_Target_Hurdles',
    'Fund_Target_MOIC',
    'Fund_Control_Provisions',
    'Fund_Information_Rights',
    'Fund_Board_Representation',
    'Fund_Item_Voting',
    'Fund_Strategy',
    'Fund_Economics',
    'Fund_Controls',
  ],
  Round: [
    'Round_ID',
    'Round_Creator',
    'Round_Time_Stamp',
    'Round_Date_Stamp',
    'Round_Name',
    'Round_Artifact',
    'Round_User',
    'Round_Contact',
    'Round_Company',
    'Round_Fund',
    'Round_Project',
    'Round_Task',
    'Round_Note',
    'Round_Sponsor',
    'Round_Raising_Status',
    'Round_Security_Type',
    'Round_Target_Size',
    'Round_Commited_Amounts',
    'Round_Min_Ticket_Size',
    'Round_Close_Date',
    'Round_Summary',
    'Round_Pre$_Valuation',
    'Round_Post$_Valuation',
    'Round_Previous_Post$_Valuation',
    'Round_Economic_Provisions',
    'Round_Liquidation_Preference',
    'Round_Drag_Tag',
    'Round_Put_Call',
    'Round_Conversion',
    'Round_Control_Provisions',
    'Round_Information_Rights',
    'Round_Board_Representation',
    'Round_Item_Voting',
    'Round_Economics',
    'Round_Controls',
  ],
  Project: [
    'Project_ID',
    'Project_Creator',
    'Project_Time_Stamp',
    'Project_Date_Stamp',
    'Project_Name',
    'Project_Artifact',
    'Project_User',
    'Project_Contact',
    'Project_Company',
    'Project_Fund',
    'Project_Round',
    'Project_Project',
    'Project_Task',
    'Project_Note',
    'Project_Status',
    'Project_Stages',
    'Project_Current_Stage',
    'Project_Priority_Rank',
    'Project_Start_Date',
    'Project_Due_Date',
    'Project_End_Date',
    'Project_Target_Amount',
    'Project_Summary',
    'Project_Team_Owner',
    'Project_Team_Lead',
    'Project_Team_Senior',
    'Project_Team_Mid',
    'Project_Team_Junior',
    'Project_Team_Agents',
    'Project_Team_Other',
    'Project_Team',
  ],
  Task: [
    'Task_ID',
    'Task_Creator',
    'Task_Time_Stamp',
    'Task_Date_Stamp',
    'Task_Name',
    'Task_Artifact',
    'Task_User',
    'Task_Contact',
    'Task_Company',
    'Task_Fund',
    'Task_Round',
    'Task_Project',
    'Task_Task',
    'Task_Note',
    'Task_Summary',
    'Task_Status',
    'Task_Priority_Rank',
    'Task_Start_Date',
    'Task_Due_Date',
    'Task_End_Date',
    'Task_Team_Owner',
    'Task_Team_Assigned',
    'Task_Team_Support',
    'Task_Team',
  ],
  Note: [
    'Note_ID',
    'Note_Creator',
    'Note_Time_Stamp',
    'Note_Date_Stamp',
    'Note_Name',
    'Note_Artifact',
    'Note_User',
    'Note_Contact',
    'Note_Company',
    'Note_Fund',
    'Note_Round',
    'Note_Project',
    'Note_Task',
    'Note_Note',
  ],
  Agent: [
    'Agent_ID',
    'Agent_Name',
    'Agent_Version',
    'Agent_Description',
    'Agent_System_Prompt',
    'Agent_Input_Contract',
    'Agent_Output_Contract',
    'Agent_Schema_Name',
    'Agent_Created_At',
  ],
}

const CHANGE_LOG_LABELS = [
  'Event ID',
  'Source Table',
  'Record ID',
  'Field Name',
  'Old Value',
  'New Value',
  'Edited By',
  'Edited At',
]

const LABEL_OVERRIDES = {
  PEmail: 'Personal Email',
  BEmail: 'Business Email',
  HQ: 'HQ',
  FS: 'Financial Statements',
  BP: 'Business Plan',
  Fcst: 'Forecast',
  ST: 'Short Term',
  LT: 'Long Term',
  Obj: 'Objectives',
  IP: 'IP',
  ICP: 'ICP',
  PAX: 'PAX',
  CAC: 'CAC',
  LTV: 'LTV',
  IS: 'Income Statement',
  BS: 'Balance Sheet',
  CF: 'Cash Flow',
  RD: 'R&D',
  MOIC: 'MOIC',
}

const TOKEN_LABEL_OVERRIDES = {
  Company_Pax_Count: 'PAX Count',
  Company_Pax_Known: 'PAX Known',
  Company_BP_Fcst: 'Business Plan Forecast',
  Company_BP_ST_Obj: 'Business Plan Short Term Objectives',
  Company_BP_LT_Obj: 'Business Plan Long Term Objectives',
  Company_BP_Resources_Uses: 'Business Plan Resources Uses',
  Company_BP_Runway: 'Business Plan Runway',
  Company_BP_Capital_Need: 'Business Plan Capital Need',
  Company_BP_Funding_Strategy: 'Business Plan Funding Strategy',
  Company_Costs_Tech_RD: 'Tech R&D Costs',
  Company_IS: 'Income Statement',
  Company_BS: 'Balance Sheet',
  Company_CF: 'Cash Flow',
  Fund_Commited_Amounts: 'Committed Amounts',
  Round_Commited_Amounts: 'Committed Amounts',
  Round_Pre$_Valuation: 'Pre-Money Valuation',
  Round_Post$_Valuation: 'Post-Money Valuation',
  Round_Previous_Post$_Valuation: 'Previous Post-Money Valuation',
  Project_Current_Stage: 'Current Stage',
}

const WORKBOOK_DEFINITIONS = [
  {
    key: 'User',
    fileName: '1. Users.xlsx',
    sheetName: 'Users',
    targetDir: (workspaceRootPath) => getNetworkDatabaseSectionPath(workspaceRootPath, 'Users'),
    eventTables: ['Users'],
    getRows: listUserRows,
  },
  {
    key: 'Artifact',
    fileName: '2. Artifacts.xlsx',
    sheetName: 'Artifacts',
    targetDir: (workspaceRootPath) => getNetworkDatabaseSectionPath(workspaceRootPath, 'Artifacts'),
    eventTables: ['Artifacts', 'Artifact_Raw', 'Artifact_Llm_Ready', 'Artifact_Llm_Generated'],
    getRows: listArtifactRows,
  },
  {
    key: 'Contact',
    fileName: '3. Contacts.xlsx',
    sheetName: 'Contacts',
    targetDir: (workspaceRootPath) => getNetworkDatabaseSectionPath(workspaceRootPath, 'Contacts'),
    eventTables: ['Contacts'],
    getRows: listContactRows,
  },
  {
    key: 'Company',
    fileName: '4. Companies.xlsx',
    sheetName: 'Companies',
    targetDir: (workspaceRootPath) => getNetworkDatabaseSectionPath(workspaceRootPath, 'Company'),
    eventTables: [
      'Companies',
      'Company_Incorporation_Info',
      'Company_Operations_Overview',
      'Company_Business_Overview',
      'Company_Market_Overview',
      'Company_Results_Overview',
      'Company_Business_Plan',
      'Company_Fund_Raising',
    ],
    getRows: listCompanyRows,
  },
  {
    key: 'Fund',
    fileName: '5.1 Funds.xlsx',
    sheetName: 'Funds',
    targetDir: (workspaceRootPath) =>
      getNetworkDatabaseSectionPath(workspaceRootPath, 'Opportunities'),
    eventTables: ['Funds', 'Fund_Overview'],
    getRows: listFundRows,
  },
  {
    key: 'Round',
    fileName: '5.2 Rounds.xlsx',
    sheetName: 'Rounds',
    targetDir: (workspaceRootPath) =>
      getNetworkDatabaseSectionPath(workspaceRootPath, 'Opportunities'),
    eventTables: ['Rounds', 'Round_Overview', 'Round_Economics'],
    getRows: listRoundRows,
  },
  {
    key: 'Project',
    fileName: '6. Pipelines.xlsx',
    aliasFileNames: ['6. User_Default_Pipeline.xlsx'],
    sheetName: 'Pipelines',
    targetDir: (workspaceRootPath) => getNetworkDatabaseSectionPath(workspaceRootPath, 'Pipelines'),
    eventTables: ['Projects', 'Project_Overview', 'Project_Stages', 'Project_Team'],
    getRows: listProjectRows,
  },
  {
    key: 'Task',
    fileName: '8. Tasks.xlsx',
    sheetName: 'Tasks',
    targetDir: (workspaceRootPath) => getNetworkDatabaseSectionPath(workspaceRootPath, 'Tasks'),
    eventTables: ['Tasks', 'Task_Overview', 'Task_Team'],
    getRows: listTaskRows,
  },
  {
    key: 'Note',
    fileName: '7. Notes.xlsx',
    sheetName: 'Notes',
    targetDir: (workspaceRootPath) => getNetworkDatabaseSectionPath(workspaceRootPath, 'Notes'),
    eventTables: ['Notes'],
    getRows: listNoteRows,
  },
  {
    key: 'Agent',
    fileName: '9. Agents.xlsx',
    sheetName: 'Agents',
    targetDir: (workspaceRootPath) => getNetworkDatabaseSectionPath(workspaceRootPath, 'Agents'),
    eventTables: ['Assistant_System_Prompts'],
    getRows: listAgentRows,
  },
]

const ENTITY_SECTION_LENGTHS = {
  Artifact: [5, 8],
  User: [3, 8],
  Contact: [7, 8, 1, 1],
  Company: [8, 9, 5, 8, 11, 13, 3, 18, 7, 4],
  Fund: [5, 9, 16, 7, 5],
  Round: [5, 8, 8, 9, 5],
  Project: [5, 9, 9, 8],
  Task: [5, 9, 6, 4],
  Note: [5, 9],
  Agent: [5, 4],
}

function listArtifactRows() {
  return dbAll(
    `
    SELECT
      a.artifact_id AS Artifact_ID,
      a.created_by AS Artifact_Creator,
      time(a.created_at) AS Artifact_Time_Stamp,
      date(a.created_at) AS Artifact_Date_Stamp,
      COALESCE(a.fs_path, a.title) AS Artifact_File,
      a.created_by AS Artifact_User,
      NULL AS Artifact_Contact,
      ro.sponsor_company_id AS Artifact_Company,
      a.fund_id AS Artifact_Fund,
      a.round_id AS Artifact_Round,
      NULL AS Artifact_Project,
      NULL AS Artifact_Task,
      NULL AS Artifact_Note
    FROM Artifact_Details a
    LEFT JOIN Round_Overview ro ON ro.round_id = a.round_id
    ORDER BY COALESCE(a.created_at, '') DESC, a.artifact_id DESC
  `,
  )
}

function listUserRows() {
  return dbAll(
    `
    SELECT
      u.id AS User_ID,
      u.User_Name,
      u.User_PEmail AS User_Email,
      NULL AS User_Artifact,
      NULL AS User_Contact,
      NULL AS User_Company,
      NULL AS User_Fund,
      NULL AS User_Round,
      NULL AS User_Project,
      NULL AS User_Task,
      NULL AS User_Note
    FROM Users u
    ORDER BY COALESCE(u.User_Name, '') ASC, u.id ASC
  `,
  )
}

function listContactRows() {
  return dbAll(
    `
    SELECT
      c.id AS Contact_ID,
      c.Name AS Contact_Name,
      c.Personal_Email AS Contact_PEmail,
      c.Professional_Email AS Contact_BEmail,
      c.Phone AS Contact_Phone,
      c.Country_based AS Contact_HQ,
      c.LinkedIn AS Contact_LinkedIn,
      NULL AS Contact_Artifact,
      c.linked_user_id AS Contact_User,
      NULL AS Contact_Company,
      NULL AS Contact_Fund,
      NULL AS Contact_Round,
      NULL AS Contact_Project,
      NULL AS Contact_Task,
      NULL AS Contact_Note,
      NULL AS Contact_Employment,
      NULL AS Contact_Studies
    FROM Contacts c
    ORDER BY COALESCE(c.Name, '') ASC, c.id ASC
  `,
  )
}

function listCompanyRows() {
  return dbAll(
    `
    SELECT
      c.id AS Company_ID,
      c.created_by AS Company_Creator,
      time(c.created_at) AS Company_Time_Stamp,
      date(c.created_at) AS Company_Date_Stamp,
      coo.Status AS Company_Status,
      c.Short_Name AS Company_Short_Name,
      c.Website AS Company_Website,
      c.One_Liner AS Company_Tagline,
      NULL AS Company_Artifact,
      c.created_by AS Company_User,
      NULL AS Company_Contact,
      NULL AS Company_Company,
      NULL AS Company_Fund,
      company_rounds.round_ids AS Company_Round,
      NULL AS Company_Project,
      company_tasks.task_ids AS Company_Task,
      NULL AS Company_Note,
      cii.Legal_Entity AS Company_Legal_Name,
      cii.Date_of_Incorporation AS Company_Inc_Date,
      cii.incorporation_country AS Company_Inc_Country,
      cii.Company_Type AS Company_Entity_Type,
      founders.contact_ids AS Company_Founders,
      NULL AS Company_Inc_Certificate,
      NULL AS Company_Inc_Articles,
      NULL AS Company_Agreements,
      NULL AS Company_Bylaws,
      NULL AS Company_IP,
      NULL AS Company_FS_Yearly,
      NULL AS Company_FS_Quarterly,
      NULL AS Company_FS_Monthly,
      c.Description AS Company_Descriptives,
      coo.Company_Stage AS Company_Stage,
      coo.headquarters_city AS Company_HQ_Locations,
      NULL AS Company_Ops_Locations,
      coo.PAX_Count AS Company_Pax_Count,
      coo.PAX_Known AS Company_Pax_Known,
      coo.business_structure_artifact_id AS Company_Business_Structure,
      coo.corporate_structure_artifact_id AS Company_Corporate_Structure,
      coo.organizational_structure_artifact_id AS Company_Organizational_Structure,
      leaders.contact_ids AS Company_Leadership_Team,
      advisors.contact_ids AS Company_Advisors,
      NULL AS Company_Other,
      c.Description AS Company_Description,
      c.Notable_News AS Company_News,
      c.Updates AS Company_Updates,
      cbp.Overview AS Company_Objectives,
      cbo.Products_Services AS Company_Products,
      cbo.Key_Features AS Company_Key_Features,
      cbo.Development_Stage AS Company_Backlog_Features,
      cbo.ICP AS Company_ICP,
      cbo.Business_Model AS Company_Business_Model,
      cbo.Pricing AS Company_Pricing,
      cbo.Placement_Distribution AS Company_Placement,
      NULL AS Company_Promotion,
      cmo.Industry AS Company_Market,
      cmo.Niche AS Company_Market_Niche,
      cmo.Demand_Analysis AS Company_Demand_Analysis,
      cmo.Supply_Analysis AS Company_Supply_Analysis,
      cro.Traction_Overview AS Company_Traction,
      NULL AS Company_Sales,
      NULL AS Company_Revenue,
      cro.Revenue_Breakdown_Top_10_Artifact_Id AS Company_Clients_Analysis,
      NULL AS Company_Cohorts_Analysis,
      cro.Direct_Costs_By_Product_Service_Artifact_Id AS Company_Costs_Direct,
      NULL AS Company_Costs_Indirect,
      cro.Sales_Marketing_Costs_By_Product_Service_Artifact_Id AS Company_Costs_Marketing,
      NULL AS Company_Unit_Economics,
      cro.Customer_Acquisition_Cost AS Company_CAC,
      cro.Customer_Lifetime_Value AS Company_LTV,
      cro.General_Admin_Expenses AS Company_Costs_Admin,
      cro.Tech_Expenditure AS Company_Costs_Tech_RD,
      cro.Income_Statement_Artifact_Id AS Company_IS,
      cro.Balance_Sheet_Artifact_Id AS Company_BS,
      cro.Cash_Flow_Artifact_Id AS Company_CF,
      cro.Tax_Filings_Artifact_Id AS Company_Tax_Filings,
      cro.Bank_Statements_Artifact_Id AS Company_Bank_Statements,
      cbp.Forecast AS Company_BP_Fcst,
      cbp.Short_Term_Objectives AS Company_BP_ST_Obj,
      cbp.Long_Term_Objectives AS Company_BP_LT_Obj,
      cbp.Use_of_Resources AS Company_BP_Resources_Uses,
      cbp.Runway_Analysis AS Company_BP_Runway,
      cbp.Capital_Needs AS Company_BP_Capital_Need,
      cbp.Funding_Strategy AS Company_BP_Funding_Strategy,
      cfr.Shareholder_Structure_Artifact_Id AS Company_Shareholder_Structure,
      shareholders.contact_ids AS Company_Shareholders,
      cfr.Rounds_Funds_Count AS Company_Round_Raised,
      cfr.Amount_Raised AS Company_Amount_Raised
    FROM Companies c
    LEFT JOIN Company_Incorporation_Info cii ON cii.company_id = c.id
    LEFT JOIN Company_Operations_Overview coo ON coo.company_id = c.id
    LEFT JOIN Company_Business_Overview cbo ON cbo.company_id = c.id
    LEFT JOIN Company_Market_Overview cmo ON cmo.company_id = c.id
    LEFT JOIN Company_Results_Overview cro ON cro.company_id = c.id
    LEFT JOIN Company_Business_Plan cbp ON cbp.company_id = c.id
    LEFT JOIN Company_Fund_Raising cfr ON cfr.company_id = c.id
    LEFT JOIN (SELECT company_id, group_concat(contact_id, '|') AS contact_ids FROM Company_Incorporation_Legal_Founders GROUP BY company_id) founders ON founders.company_id = c.id
    LEFT JOIN (SELECT company_id, group_concat(contact_id, '|') AS contact_ids FROM Company_Operations_Leadership_Team GROUP BY company_id) leaders ON leaders.company_id = c.id
    LEFT JOIN (SELECT company_id, group_concat(contact_id, '|') AS contact_ids FROM Company_Operations_Advisors GROUP BY company_id) advisors ON advisors.company_id = c.id
    LEFT JOIN (SELECT company_id, group_concat(contact_id, '|') AS contact_ids FROM Company_Fund_Raising_Shareholders GROUP BY company_id) shareholders ON shareholders.company_id = c.id
    LEFT JOIN (SELECT sponsor_company_id AS company_id, group_concat(round_id, '|') AS round_ids FROM Round_Overview GROUP BY sponsor_company_id) company_rounds ON company_rounds.company_id = c.id
    LEFT JOIN (SELECT to_id AS company_id, group_concat(from_id, '|') AS task_ids FROM Tasks_Companies_related_companies GROUP BY to_id) company_tasks ON company_tasks.company_id = c.id
    ORDER BY COALESCE(c.Company_Name, '') ASC, c.id ASC
  `,
  ).map((row) => ({
    ...row,
    Company_Artifact: joinPipeValue(
      row.Company_Business_Structure,
      row.Company_Corporate_Structure,
      row.Company_Organizational_Structure,
      row.Company_Clients_Analysis,
      row.Company_Cohorts_Analysis,
      row.Company_Costs_Direct,
      row.Company_Costs_Marketing,
      row.Company_IS,
      row.Company_BS,
      row.Company_CF,
      row.Company_Tax_Filings,
      row.Company_Bank_Statements,
      row.Company_Shareholder_Structure,
    ),
    Company_Contact: joinPipeValue(
      row.Company_Founders,
      row.Company_Leadership_Team,
      row.Company_Advisors,
      row.Company_Shareholders,
    ),
    Company_Market: joinPipeValue(row.Company_Market, row.Company_Market_Niche),
  }))
}

function listFundRows() {
  return dbAll(
    `
    SELECT
      f.id AS Fund_ID,
      f.created_by AS Fund_Creator,
      time(f.created_at) AS Fund_Time_Stamp,
      date(f.created_at) AS Fund_Date_Stamp,
      f.Fund_Name,
      NULL AS Fund_Artifact,
      f.created_by AS Fund_User,
      managers.contact_ids AS Fund_Contact,
      NULL AS Fund_Company,
      NULL AS Fund_Fund,
      NULL AS Fund_Round,
      NULL AS Fund_Project,
      NULL AS Fund_Task,
      NULL AS Fund_Note,
      managers.contact_ids AS Fund_Manager,
      fo.Fund_Raising_Status,
      NULL AS Fund_Period,
      fo.Fund_Target_Size,
      fo.Fund_Commited_Amounts,
      NULL AS Fund_Min_Ticket_Size,
      fo.Fund_Close_Date,
      fo.Fund_Summary,
      NULL AS Fund_Reserve,
      NULL AS Fund_Initial_Ticket_Size,
      NULL AS Fund_Target_Positions,
      NULL AS Fund_Target_Regions,
      NULL AS Fund_Target_Asset_Types,
      NULL AS Fund_Target_Industries,
      NULL AS Fund_Target_Stages,
      NULL AS Fund_Other,
      NULL AS Fund_Economic_Provisions,
      NULL AS Fund_Fees,
      NULL AS Fund_Promote,
      NULL AS Fund_Target_Hurdles,
      NULL AS Fund_Target_MOIC,
      NULL AS Fund_Control_Provisions,
      NULL AS Fund_Information_Rights,
      NULL AS Fund_Board_Representation,
      NULL AS Fund_Item_Voting,
      NULL AS Fund_Strategy,
      NULL AS Fund_Economics,
      NULL AS Fund_Controls
    FROM Funds f
    LEFT JOIN Fund_Overview fo ON fo.fund_id = f.id
    LEFT JOIN (SELECT fund_id, group_concat(contact_id, '|') AS contact_ids FROM Fund_Overview_Managers GROUP BY fund_id) managers ON managers.fund_id = f.id
    ORDER BY COALESCE(f.created_at, '') DESC, f.id DESC
  `,
  )
}

function listRoundRows() {
  return dbAll(
    `
    SELECT
      r.id AS Round_ID,
      r.created_by AS Round_Creator,
      time(r.created_at) AS Round_Time_Stamp,
      date(r.created_at) AS Round_Date_Stamp,
      r.Round_Name,
      NULL AS Round_Artifact,
      r.created_by AS Round_User,
      NULL AS Round_Contact,
      ro.sponsor_company_id AS Round_Company,
      NULL AS Round_Fund,
      NULL AS Round_Project,
      NULL AS Round_Task,
      NULL AS Round_Note,
      ro.sponsor_company_id AS Round_Sponsor,
      ro.Round_Raising_Status,
      ro.Round_Security_Type,
      ro.Round_Target_Size,
      ro.Round_Commited_Amounts,
      NULL AS Round_Min_Ticket_Size,
      ro.Round_Close_Date,
      ro.Round_Summary,
      re.Round_Pre_Valuation AS "Round_Pre$_Valuation",
      re.Round_Post_Valuation AS "Round_Post$_Valuation",
      re.Round_Previous_Post_Valuation AS "Round_Previous_Post$_Valuation",
      NULL AS Round_Economic_Provisions,
      NULL AS Round_Liquidation_Preference,
      NULL AS Round_Drag_Tag,
      NULL AS Round_Put_Call,
      NULL AS Round_Conversion,
      NULL AS Round_Control_Provisions,
      NULL AS Round_Information_Rights,
      NULL AS Round_Board_Representation,
      NULL AS Round_Item_Voting,
      NULL AS Round_Economics,
      NULL AS Round_Controls
    FROM Rounds r
    LEFT JOIN Round_Overview ro ON ro.round_id = r.id
    LEFT JOIN Round_Economics re ON re.round_id = r.id
    ORDER BY COALESCE(r.created_at, '') DESC, r.id DESC
  `,
  )
}

function listProjectRows() {
  return dbAll(
    `
    SELECT
      p.id AS Project_ID,
      NULL AS Project_Creator,
      time(p.created_at) AS Project_Time_Stamp,
      date(p.created_at) AS Project_Date_Stamp,
      p.Project_Name,
      pt.Project_Team_Other_Artifact_Id AS Project_Artifact,
      NULL AS Project_User,
      pt.Project_Team_Owner AS Project_Contact,
      NULL AS Project_Company,
      NULL AS Project_Fund,
      NULL AS Project_Round,
      NULL AS Project_Project,
      NULL AS Project_Task,
      NULL AS Project_Note,
      po.Project_Status,
      stage_info.stage_names AS Project_Stages,
      stage_info.current_stage AS Project_Current_Stage,
      po.Project_Priority_Rank,
      po.Project_Start_Date,
      po.Project_Due_Date,
      po.Project_End_Date,
      po.Project_Target_Amount,
      po.Project_Summary,
      pt.Project_Team_Owner,
      NULL AS Project_Team_Lead,
      NULL AS Project_Team_Senior,
      NULL AS Project_Team_Mid,
      NULL AS Project_Team_Junior,
      NULL AS Project_Team_Agents,
      pt.Project_Team_Other_Artifact_Id AS Project_Team_Other,
      NULL AS Project_Team
    FROM Projects p
    LEFT JOIN Project_Overview po ON po.project_id = p.id
    LEFT JOIN Project_Team pt ON pt.project_id = p.id
    LEFT JOIN (
      SELECT project_id, group_concat(name, '|') AS stage_names, MAX(CASE WHEN is_terminal = 0 THEN name END) AS current_stage
      FROM Project_Stages
      GROUP BY project_id
    ) stage_info ON stage_info.project_id = p.id
    ORDER BY COALESCE(p.Project_Name, '') ASC, p.id ASC
  `,
  ).map((row) => ({
    ...row,
    Project_Team: joinPipeValue(
      row.Project_Team_Owner,
      row.Project_Team_Lead,
      row.Project_Team_Senior,
      row.Project_Team_Mid,
      row.Project_Team_Junior,
      row.Project_Team_Agents,
    ),
  }))
}

function listTaskRows() {
  return dbAll(
    `
    SELECT
      t.id AS Task_ID,
      t.created_by AS Task_Creator,
      time(t.created_at) AS Task_Time_Stamp,
      date(t.created_at) AS Task_Date_Stamp,
      t.Task_Name,
      NULL AS Task_Artifact,
      t.created_by AS Task_User,
      tt.Task_Team_Owner AS Task_Contact,
      companies.company_ids AS Task_Company,
      funds.fund_ids AS Task_Fund,
      rounds.round_ids AS Task_Round,
      projects.project_ids AS Task_Project,
      NULL AS Task_Task,
      NULL AS Task_Note,
      tov.Task_Summary,
      tov.Task_Status,
      tov.Task_Priority_Rank,
      tov.Task_Start_Date,
      tov.Task_Due_Date,
      tov.Task_End_Date,
      tt.Task_Team_Owner,
      tt.Task_Team_Owner AS Task_Team_Assigned,
      NULL AS Task_Team_Support,
      tt.Task_Team_Owner AS Task_Team
    FROM Tasks t
    LEFT JOIN Task_Overview tov ON tov.task_id = t.id
    LEFT JOIN Task_Team tt ON tt.task_id = t.id
    LEFT JOIN (SELECT from_id AS task_id, group_concat(to_id, '|') AS company_ids FROM Tasks_Companies_related_companies GROUP BY from_id) companies ON companies.task_id = t.id
    LEFT JOIN (SELECT from_id AS task_id, group_concat(to_id, '|') AS fund_ids FROM Tasks_Funds_related_fund GROUP BY from_id) funds ON funds.task_id = t.id
    LEFT JOIN (SELECT from_id AS task_id, group_concat(to_id, '|') AS round_ids FROM Tasks_Rounds_related_round GROUP BY from_id) rounds ON rounds.task_id = t.id
    LEFT JOIN (SELECT from_id AS task_id, group_concat(to_id, '|') AS project_ids FROM Tasks_Projects_projects GROUP BY from_id) projects ON projects.task_id = t.id
    ORDER BY COALESCE(t.created_at, '') DESC, t.id DESC
  `,
  )
}

function listNoteRows() {
  return dbAll(
    `
    SELECT
      n.id AS Note_ID,
      n.created_by AS Note_Creator,
      time(n.created_at) AS Note_Time_Stamp,
      date(n.created_at) AS Note_Date_Stamp,
      n.Note_Name,
      NULL AS Note_Artifact,
      n.created_by AS Note_User,
      NULL AS Note_Contact,
      NULL AS Note_Company,
      NULL AS Note_Fund,
      NULL AS Note_Round,
      NULL AS Note_Project,
      NULL AS Note_Task,
      NULL AS Note_Note
    FROM Notes n
    ORDER BY COALESCE(n.created_at, '') DESC, n.id DESC
  `,
  )
}

function listAgentRows() {
  return dbAll(
    `
    SELECT
      assistant_system_prompt_id AS Agent_ID,
      name AS Agent_Name,
      version AS Agent_Version,
      description AS Agent_Description,
      system_prompt AS Agent_System_Prompt,
      input_contract AS Agent_Input_Contract,
      output_contract AS Agent_Output_Contract,
      schema_name AS Agent_Schema_Name,
      created_at AS Agent_Created_At
    FROM Assistant_System_Prompts
    ORDER BY COALESCE(created_at, '') DESC, assistant_system_prompt_id DESC
  `,
  )
}

function listEventRows(tableNames = []) {
  const names = [...new Set((Array.isArray(tableNames) ? tableNames : []).filter(Boolean))]
  if (!names.length) return []
  const placeholders = names.map(() => '?').join(', ')
  return dbAll(
    `
    SELECT
      id AS Event_ID,
      table_name AS Source_Table,
      record_id AS Record_ID,
      field_name AS Field_Name,
      old_value AS Old_Value,
      new_value AS New_Value,
      edited_by AS Edited_By,
      edited_at AS Edited_At
    FROM events
    WHERE table_name IN (${placeholders})
    ORDER BY edited_at DESC, id DESC
    LIMIT 1000
  `,
    names,
  )
}

function normalizeCellValue(value) {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(normalizeCellValue).filter(Boolean).join('|')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function labelForToken(token) {
  if (TOKEN_LABEL_OVERRIDES[token]) return TOKEN_LABEL_OVERRIDES[token]
  const body = String(token || '')
    .replace(/^[A-Za-z]+_/, '')
    .replace(/\$/g, '')
  return body
    .split('_')
    .filter(Boolean)
    .map((part) => {
      if (LABEL_OVERRIDES[part]) return LABEL_OVERRIDES[part]
      if (/^[A-Z]{2,}$/.test(part)) return part
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join(' ')
}

function buildStructureRows(entityKey, tokens) {
  const sectionLengths = ENTITY_SECTION_LENGTHS[entityKey] || []
  if (!sectionLengths.length) {
    return {
      level2: tokens.map(() => '1'),
      level3: tokens.map((_token, index) => String(index + 1)),
    }
  }

  const level2 = []
  const level3 = []
  let tokenIndex = 0
  for (let sectionIndex = 0; sectionIndex < sectionLengths.length; sectionIndex += 1) {
    const length = sectionLengths[sectionIndex]
    for (let itemIndex = 0; itemIndex < length && tokenIndex < tokens.length; itemIndex += 1) {
      level2.push(String(sectionIndex + 1))
      level3.push(String(itemIndex + 1))
      tokenIndex += 1
    }
  }
  let overflowIndex = 1
  while (level2.length < tokens.length) {
    level2.push(String(sectionLengths.length || 1))
    level3.push(String(overflowIndex))
    overflowIndex += 1
  }
  return { level2, level3 }
}

function toWorksheetRows(tokens, records, labels = null, structureRows = null) {
  const headerLabels = Array.isArray(labels) ? labels : tokens.map((token) => labelForToken(token))
  const level2 = Array.isArray(structureRows?.level2) ? structureRows.level2 : tokens.map(() => '')
  const level3 = Array.isArray(structureRows?.level3) ? structureRows.level3 : tokens.map(() => '')
  const bodyRows = (Array.isArray(records) ? records : []).map((record) =>
    tokens.map((token) => normalizeCellValue(record?.[token])),
  )
  return [level2, level3, tokens, headerLabels, ...bodyRows]
}

function joinPipeValue(...values) {
  const flattened = values.flatMap((value) => {
    if (value == null) return []
    return String(value)
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)
  })
  return [...new Set(flattened)].join('|')
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function columnName(index) {
  let current = index
  let name = ''
  while (current > 0) {
    const remainder = (current - 1) % 26
    name = String.fromCharCode(65 + remainder) + name
    current = Math.floor((current - 1) / 26)
  }
  return name
}

function buildWorksheetXml(rows, { freezeHeaderRows = false } = {}) {
  const safeRows = Array.isArray(rows) ? rows : []
  const maxColumns = safeRows.reduce((max, row) => Math.max(max, row.length), 0)
  const lastCellRef =
    safeRows.length > 0 && maxColumns > 0 ? `${columnName(maxColumns)}${safeRows.length}` : 'A1'
  const sheetView = freezeHeaderRows
    ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    : '<sheetViews><sheetView workbookViewId="0"/></sheetViews>'
  const sheetRows = safeRows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const normalized = normalizeCellValue(value)
          if (!normalized) return ''
          const ref = `${columnName(columnIndex + 1)}${rowIndex + 1}`
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(normalized)}</t></is></c>`
        })
        .filter(Boolean)
        .join('')
      return `<row r="${rowIndex + 1}">${cells}</row>`
    })
    .join('')
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    `<dimension ref="A1:${lastCellRef}"/>`,
    sheetView,
    '<sheetFormatPr defaultRowHeight="15"/>',
    `<sheetData>${sheetRows}</sheetData>`,
    '</worksheet>',
  ].join('')
}

function buildWorkbookXml(sheetNames) {
  const sheetsXml = sheetNames
    .map(
      (sheetName, index) =>
        `<sheet name="${escapeXml(sheetName)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`,
    )
    .join('')
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    '<bookViews><workbookView/></bookViews>',
    `<sheets>${sheetsXml}</sheets>`,
    '</workbook>',
  ].join('')
}

function buildWorkbookRels(sheetCount) {
  const relations = Array.from({ length: sheetCount }, (_, index) => {
    const target = `worksheets/sheet${index + 1}.xml`
    return `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="${target}"/>`
  }).join('')
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    relations,
    '</Relationships>',
  ].join('')
}

function buildContentTypes(sheetCount) {
  const overrides = Array.from({ length: sheetCount }, (_, index) => {
    const partName = `/xl/worksheets/sheet${index + 1}.xml`
    return `<Override PartName="${partName}" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`
  }).join('')
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    overrides,
    '</Types>',
  ].join('')
}

function buildRootRelsXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
    '</Relationships>',
  ].join('')
}

function buildStylesXml() {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
    '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>',
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>',
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>',
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>',
    '<cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>',
    '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>',
    '</styleSheet>',
  ].join('')
}

function createWorkbookBuffer(sheets) {
  const entries = [
    { name: '[Content_Types].xml', data: buildContentTypes(sheets.length) },
    { name: '_rels/.rels', data: buildRootRelsXml() },
    { name: 'xl/workbook.xml', data: buildWorkbookXml(sheets.map((sheet) => sheet.name)) },
    { name: 'xl/_rels/workbook.xml.rels', data: buildWorkbookRels(sheets.length) },
    { name: 'xl/styles.xml', data: buildStylesXml() },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      data: buildWorksheetXml(sheet.rows, { freezeHeaderRows: sheet.freezeHeaderRows }),
    })),
  ]
  return createZipBuffer(entries)
}

function createZipBuffer(entries) {
  const files = []
  const centralDirectory = []
  let offset = 0
  const { time, date } = toDosDateTime(new Date())

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, 'utf8')
    const dataBuffer = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8')
    const checksum = crc32(dataBuffer)
    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0, 6)
    localHeader.writeUInt16LE(0, 8)
    localHeader.writeUInt16LE(time, 10)
    localHeader.writeUInt16LE(date, 12)
    localHeader.writeUInt32LE(checksum, 14)
    localHeader.writeUInt32LE(dataBuffer.length, 18)
    localHeader.writeUInt32LE(dataBuffer.length, 22)
    localHeader.writeUInt16LE(nameBuffer.length, 26)
    localHeader.writeUInt16LE(0, 28)
    files.push(localHeader, nameBuffer, dataBuffer)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt16LE(time, 12)
    centralHeader.writeUInt16LE(date, 14)
    centralHeader.writeUInt32LE(checksum, 16)
    centralHeader.writeUInt32LE(dataBuffer.length, 20)
    centralHeader.writeUInt32LE(dataBuffer.length, 24)
    centralHeader.writeUInt16LE(nameBuffer.length, 28)
    centralHeader.writeUInt32LE(offset, 42)
    centralDirectory.push(centralHeader, nameBuffer)
    offset += localHeader.length + nameBuffer.length + dataBuffer.length
  }

  const centralSize = centralDirectory.reduce((sum, part) => sum + part.length, 0)
  const endRecord = Buffer.alloc(22)
  endRecord.writeUInt32LE(0x06054b50, 0)
  endRecord.writeUInt16LE(entries.length, 8)
  endRecord.writeUInt16LE(entries.length, 10)
  endRecord.writeUInt32LE(centralSize, 12)
  endRecord.writeUInt32LE(offset, 16)

  return Buffer.concat([...files, ...centralDirectory, endRecord])
}

function toDosDateTime(value) {
  const year = Math.max(1980, value.getFullYear())
  const month = value.getMonth() + 1
  const day = value.getDate()
  const hours = value.getHours()
  const minutes = value.getMinutes()
  const seconds = Math.floor(value.getSeconds() / 2)
  return {
    time: (hours << 11) | (minutes << 5) | seconds,
    date: ((year - 1980) << 9) | (month << 5) | day,
  }
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let current = i
    for (let j = 0; j < 8; j += 1) {
      current = current & 1 ? 0xedb88320 ^ (current >>> 1) : current >>> 1
    }
    table[i] = current >>> 0
  }
  return table
})()

function crc32(buffer) {
  let current = 0xffffffff
  for (const value of buffer) {
    current = CRC_TABLE[(current ^ value) & 0xff] ^ (current >>> 8)
  }
  return (current ^ 0xffffffff) >>> 0
}

export async function syncWorkspaceWorkbookMirror(workspaceRootPath, options = {}) {
  const skipPaths = new Set(Array.isArray(options?.skipPaths) ? options.skipPaths : options?.skipPaths ? [...options.skipPaths] : [])
  const workbookPaths = []
  const writtenPaths = []
  for (const definition of WORKBOOK_DEFINITIONS) {
    const targetDir = definition.targetDir(workspaceRootPath)
    const fileNames = [definition.fileName, ...(definition.aliasFileNames || [])]
    for (const fileName of fileNames) {
      workbookPaths.push(path.join(targetDir, fileName))
    }

    try {
      const recordRows = definition.getRows()
      const changeLogRows = listEventRows(definition.eventTables)
      const workbookBuffer = createWorkbookBuffer([
        {
          name: definition.sheetName,
          rows: toWorksheetRows(
            TOKEN_GROUPS[definition.key],
            recordRows,
            null,
            buildStructureRows(definition.key, TOKEN_GROUPS[definition.key]),
          ),
          freezeHeaderRows: true,
        },
        {
          name: 'Change_Log',
          rows: toWorksheetRows(CHANGE_LOG_TOKENS, changeLogRows, CHANGE_LOG_LABELS, {
            level2: CHANGE_LOG_LEVEL2,
            level3: CHANGE_LOG_LEVEL3,
          }),
          freezeHeaderRows: true,
        },
      ])

      await fs.mkdir(targetDir, { recursive: true })
      for (const fileName of fileNames) {
        const filePath = path.join(targetDir, fileName)
        if (skipPaths.has(filePath)) continue
        await fs.writeFile(filePath, workbookBuffer)
        writtenPaths.push(filePath)
      }
    } catch (error) {
      console.error(`workspace workbook mirror failed for ${definition.fileName}:`, error)
    }
  }
  return { workbookPaths, writtenPaths }
}
