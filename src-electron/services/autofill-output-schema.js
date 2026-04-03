import { z } from 'zod'

const nullableString = z.string().nullable().optional()
const nullableNumber = z.number().nullable().optional()
const stringList = z.array(z.string()).optional().default([])

const sourceRefSchema = z.object({
  file_name: nullableString,
  page_number: nullableNumber,
  section_hint: nullableString,
  quote: nullableString,
})

const fieldSourceSchema = z.object({
  field_path: z.string(),
  file_name: nullableString,
  page_number: nullableNumber,
  section_hint: nullableString,
  quote: nullableString,
})

const contactSchema = z.object({
  ref: z.string(),
  Name: nullableString,
  Personal_Email: nullableString,
  Professional_Email: nullableString,
  Phone: nullableString,
  Country_based: nullableString,
  LinkedIn: nullableString,
  source_refs: z.array(sourceRefSchema).default([]),
  field_sources: z.array(fieldSourceSchema).default([]),
})

const companySchema = z.object({
  ref: z.string(),
  Company_Name: nullableString,
  Short_Name: nullableString,
  Website: nullableString,
  One_Liner: nullableString,
  Description: nullableString,
  Notable_News: nullableString,
  Updates: nullableString,
  Company_Type: nullableString,
  Legal_Entity: nullableString,
  Date_of_Incorporation: nullableString,
  incorporation_country: nullableString,
  Incorporation_Type: nullableString,
  Company_Stage: nullableString,
  Status: nullableString,
  headquarters_city: nullableString,
  PAX_Count: nullableNumber,
  PAX_Known: nullableNumber,
  Mission_Vision: nullableString,
  Products_Services: nullableString,
  Key_Features: nullableString,
  Development_Stage: nullableString,
  ICP: nullableString,
  Business_Model: nullableString,
  Pricing: nullableString,
  Placement_Distribution: nullableString,
  Rounds_Funds_Count: nullableNumber,
  Amount_Raised: nullableNumber,
  founder_contact_refs: stringList,
  related_contact_refs: stringList,
  leadership_contact_refs: stringList,
  advisor_contact_refs: stringList,
  shareholder_contact_refs: stringList,
  hq_region_names: stringList,
  industry_names: stringList,
  invested_company_refs: stringList,
  institutional_investor_company_refs: stringList,
  round_refs: stringList,
  fund_refs: stringList,
  source_refs: z.array(sourceRefSchema).default([]),
  field_sources: z.array(fieldSourceSchema).default([]),
})

const roundSchema = z.object({
  ref: z.string(),
  Round_Name: nullableString,
  sponsor_company_ref: nullableString,
  company_refs: stringList,
  Round_Raising_Status: nullableString,
  Round_Security_Type: nullableString,
  Round_Target_Size: nullableNumber,
  Round_Commited_Amounts: nullableNumber,
  Round_Min_Ticket_Size: nullableNumber,
  Round_Close_Date: nullableString,
  Round_Summary: nullableString,
  Round_Pre_Valuation: nullableNumber,
  Round_Post_Valuation: nullableNumber,
  Round_Previous_Post_Valuation: nullableNumber,
  target_region_names: stringList,
  target_industry_names: stringList,
  captable_individual_contact_refs: stringList,
  source_refs: z.array(sourceRefSchema).default([]),
  field_sources: z.array(fieldSourceSchema).default([]),
})

const fundSchema = z.object({
  ref: z.string(),
  Fund_Name: nullableString,
  managing_company_ref: nullableString,
  company_refs: stringList,
  Fund_Raising_Status: nullableString,
  Fund_Period: nullableString,
  Fund_Target_Size: nullableNumber,
  Fund_Commited_Amounts: nullableNumber,
  Fund_Min_Ticket_Size: nullableNumber,
  Fund_Close_Date: nullableString,
  Fund_Summary: nullableString,
  Fund_Reserve: nullableNumber,
  Fund_Initial_Ticket_Size: nullableNumber,
  Fund_Target_Positions: nullableNumber,
  manager_contact_refs: stringList,
  target_region_names: stringList,
  target_industry_names: stringList,
  target_stage_names: stringList,
  target_asset_types: stringList,
  captable_individual_contact_refs: stringList,
  source_refs: z.array(sourceRefSchema).default([]),
  field_sources: z.array(fieldSourceSchema).default([]),
})

export function buildAutofillExtractionOutputSchema({ kind } = {}) {
  const normalizedKind = String(kind || '').trim().toLowerCase()
  const base = {
    primary_company_ref: nullableString,
    primary_contact_ref: nullableString,
    companies: z.array(companySchema).default([]),
    contacts: z.array(contactSchema).default([]),
  }

  if (normalizedKind === 'fund') {
    return z.object({
      ...base,
      primary_fund_ref: nullableString,
      funds: z.array(fundSchema).default([]),
    })
  }

  return z.object({
    ...base,
    primary_round_ref: nullableString,
    rounds: z.array(roundSchema).default([]),
  })
}

function normalizeString(value) {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized || null
  }
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized || null
}

function stripContactNameNoise(value) {
  const normalized = normalizeString(value)
  if (!normalized) return null
  return normalized
    .replace(/\s+-\s+[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '')
    .replace(/\s+-\s+\+?[0-9()\-.\s]{7,}/g, '')
    .trim() || null
}

function normalizeNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null
}

function normalizeStringArray(values = []) {
  return (Array.isArray(values) ? values : []).map((value) => normalizeString(value)).filter(Boolean)
}

function normalizeSourceRefs(values = []) {
  return (Array.isArray(values) ? values : [])
    .map((value) => {
      const normalized = {
        file_name: normalizeString(value?.file_name),
        page_number: normalizeNumber(value?.page_number),
        section_hint: normalizeString(value?.section_hint),
        quote: normalizeString(value?.quote),
      }
      return normalized.file_name || normalized.page_number != null || normalized.quote ? normalized : null
    })
    .filter(Boolean)
}

function normalizeFieldSources(values = []) {
  return (Array.isArray(values) ? values : [])
    .map((value) => {
      const normalized = {
        field_path: normalizeString(value?.field_path),
        file_name: normalizeString(value?.file_name),
        page_number: normalizeNumber(value?.page_number),
        section_hint: normalizeString(value?.section_hint),
        quote: normalizeString(value?.quote),
      }
      return normalized.field_path ? normalized : null
    })
    .filter(Boolean)
}

function normalizeEntityList(values = [], normalizeEntity) {
  return (Array.isArray(values) ? values : []).map((value) => normalizeEntity(value || {})).filter(Boolean)
}

function normalizeContact(contact = {}) {
  const normalized = {
    ref: normalizeString(contact.ref),
    Name: stripContactNameNoise(contact.Name),
    Personal_Email: normalizeString(contact.Personal_Email),
    Professional_Email: normalizeString(contact.Professional_Email),
    Phone: normalizeString(contact.Phone),
    Country_based: normalizeString(contact.Country_based),
    LinkedIn: normalizeString(contact.LinkedIn),
    source_refs: normalizeSourceRefs(contact.source_refs),
    field_sources: normalizeFieldSources(contact.field_sources),
  }

  return normalized.ref || normalized.Name ? normalized : null
}

function normalizeCompany(company = {}) {
  const normalized = {
    ref: normalizeString(company.ref),
    Company_Name: normalizeString(company.Company_Name),
    Short_Name: normalizeString(company.Short_Name),
    Website: normalizeString(company.Website),
    One_Liner: normalizeString(company.One_Liner),
    Description: normalizeString(company.Description),
    Notable_News: normalizeString(company.Notable_News),
    Updates: normalizeString(company.Updates),
    Company_Type: normalizeString(company.Company_Type),
    Legal_Entity: normalizeString(company.Legal_Entity),
    Date_of_Incorporation: normalizeString(company.Date_of_Incorporation),
    incorporation_country: normalizeString(company.incorporation_country),
    Incorporation_Type: normalizeString(company.Incorporation_Type),
    Company_Stage: normalizeString(company.Company_Stage),
    Status: normalizeString(company.Status),
    headquarters_city: normalizeString(company.headquarters_city),
    PAX_Count: normalizeNumber(company.PAX_Count),
    PAX_Known: normalizeNumber(company.PAX_Known),
    Mission_Vision: normalizeString(company.Mission_Vision),
    Products_Services: normalizeString(company.Products_Services),
    Key_Features: normalizeString(company.Key_Features),
    Development_Stage: normalizeString(company.Development_Stage),
    ICP: normalizeString(company.ICP),
    Business_Model: normalizeString(company.Business_Model),
    Pricing: normalizeString(company.Pricing),
    Placement_Distribution: normalizeString(company.Placement_Distribution),
    Rounds_Funds_Count: normalizeNumber(company.Rounds_Funds_Count),
    Amount_Raised: normalizeNumber(company.Amount_Raised),
    founder_contact_refs: normalizeStringArray(company.founder_contact_refs),
    related_contact_refs: normalizeStringArray(company.related_contact_refs),
    leadership_contact_refs: normalizeStringArray(company.leadership_contact_refs),
    advisor_contact_refs: normalizeStringArray(company.advisor_contact_refs),
    shareholder_contact_refs: normalizeStringArray(company.shareholder_contact_refs),
    hq_region_names: normalizeStringArray(company.hq_region_names),
    industry_names: normalizeStringArray(company.industry_names),
    invested_company_refs: normalizeStringArray(company.invested_company_refs),
    institutional_investor_company_refs: normalizeStringArray(company.institutional_investor_company_refs),
    round_refs: normalizeStringArray(company.round_refs),
    fund_refs: normalizeStringArray(company.fund_refs),
    source_refs: normalizeSourceRefs(company.source_refs),
    field_sources: normalizeFieldSources(company.field_sources),
  }

  return normalized.ref || normalized.Company_Name ? normalized : null
}

function normalizeRound(round = {}) {
  const normalized = {
    ref: normalizeString(round.ref),
    Round_Name: normalizeString(round.Round_Name),
    sponsor_company_ref: normalizeString(round.sponsor_company_ref),
    company_refs: normalizeStringArray(round.company_refs),
    Round_Raising_Status: normalizeString(round.Round_Raising_Status),
    Round_Security_Type: normalizeString(round.Round_Security_Type),
    Round_Target_Size: normalizeNumber(round.Round_Target_Size),
    Round_Commited_Amounts: normalizeNumber(round.Round_Commited_Amounts),
    Round_Min_Ticket_Size: normalizeNumber(round.Round_Min_Ticket_Size),
    Round_Close_Date: normalizeString(round.Round_Close_Date),
    Round_Summary: normalizeString(round.Round_Summary),
    Round_Pre_Valuation: normalizeNumber(round.Round_Pre_Valuation),
    Round_Post_Valuation: normalizeNumber(round.Round_Post_Valuation),
    Round_Previous_Post_Valuation: normalizeNumber(round.Round_Previous_Post_Valuation),
    target_region_names: normalizeStringArray(round.target_region_names),
    target_industry_names: normalizeStringArray(round.target_industry_names),
    captable_individual_contact_refs: normalizeStringArray(round.captable_individual_contact_refs),
    source_refs: normalizeSourceRefs(round.source_refs),
    field_sources: normalizeFieldSources(round.field_sources),
  }

  return normalized.ref || normalized.Round_Name ? normalized : null
}

function normalizeFund(fund = {}) {
  const normalized = {
    ref: normalizeString(fund.ref),
    Fund_Name: normalizeString(fund.Fund_Name),
    managing_company_ref: normalizeString(fund.managing_company_ref),
    company_refs: normalizeStringArray(fund.company_refs),
    Fund_Raising_Status: normalizeString(fund.Fund_Raising_Status),
    Fund_Period: normalizeString(fund.Fund_Period),
    Fund_Target_Size: normalizeNumber(fund.Fund_Target_Size),
    Fund_Commited_Amounts: normalizeNumber(fund.Fund_Commited_Amounts),
    Fund_Min_Ticket_Size: normalizeNumber(fund.Fund_Min_Ticket_Size),
    Fund_Close_Date: normalizeString(fund.Fund_Close_Date),
    Fund_Summary: normalizeString(fund.Fund_Summary),
    Fund_Reserve: normalizeNumber(fund.Fund_Reserve),
    Fund_Initial_Ticket_Size: normalizeNumber(fund.Fund_Initial_Ticket_Size),
    Fund_Target_Positions: normalizeNumber(fund.Fund_Target_Positions),
    manager_contact_refs: normalizeStringArray(fund.manager_contact_refs),
    target_region_names: normalizeStringArray(fund.target_region_names),
    target_industry_names: normalizeStringArray(fund.target_industry_names),
    target_stage_names: normalizeStringArray(fund.target_stage_names),
    target_asset_types: normalizeStringArray(fund.target_asset_types),
    captable_individual_contact_refs: normalizeStringArray(fund.captable_individual_contact_refs),
    source_refs: normalizeSourceRefs(fund.source_refs),
    field_sources: normalizeFieldSources(fund.field_sources),
  }

  return normalized.ref || normalized.Fund_Name ? normalized : null
}

export function normalizeStructuredAutofillOutput(input = {}) {
  return {
    primary_company_ref: normalizeString(input.primary_company_ref),
    primary_contact_ref: normalizeString(input.primary_contact_ref),
    primary_round_ref: normalizeString(input.primary_round_ref),
    primary_fund_ref: normalizeString(input.primary_fund_ref),
    companies: normalizeEntityList(input.companies, normalizeCompany),
    contacts: normalizeEntityList(input.contacts, normalizeContact),
    rounds: normalizeEntityList(input.rounds, normalizeRound),
    funds: normalizeEntityList(input.funds, normalizeFund),
  }
}

function choosePrimaryEntity(list = [], explicitRef = null) {
  const normalizedRef = normalizeString(explicitRef)
  if (normalizedRef) {
    const exact = (Array.isArray(list) ? list : []).find((item) => item?.ref === normalizedRef)
    if (exact) return exact
  }
  return Array.isArray(list) && list.length ? list[0] : null
}

export function getPrimaryEntities(structured = {}) {
  return {
    company: choosePrimaryEntity(structured.companies, structured.primary_company_ref),
    contact: choosePrimaryEntity(structured.contacts, structured.primary_contact_ref),
    round: choosePrimaryEntity(structured.rounds, structured.primary_round_ref),
    fund: choosePrimaryEntity(structured.funds, structured.primary_fund_ref),
  }
}
