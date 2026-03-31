import { z } from 'zod'

const nullableString = z.string().nullable().optional()
const nullableNumber = z.number().nullable().optional()
const nullableBoolean = z.boolean().nullable().optional()

const stringList = z.array(z.string()).optional().default([])

const noteSchema = z.object({
  title: nullableString,
  content: nullableString,
})

const taskSchema = z.object({
  Task_Name: nullableString,
  Task_Description: nullableString,
  Status: nullableString,
  Priority: nullableString,
  Due_Date: nullableString,
})

const assistantSchema = z.object({
  name: nullableString,
  version: nullableString,
  description: nullableString,
  system_prompt: nullableString,
  tools: stringList,
  functions: stringList,
  context_sources: stringList,
})

const verificationEntrySchema = z.object({
  field_path: z.string(),
  confidence: nullableNumber,
  verification_flag: nullableBoolean,
  evidence: nullableString,
})

const contactSchema = z.object({
  ref: z.string(),
  Name: nullableString,
  Personal_Email: nullableString,
  Professional_Email: nullableString,
  Phone: nullableString,
  Country_based: nullableString,
  LinkedIn: nullableString,
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
})

export const autofillExtractionOutputSchema = z.object({
  primary_company_ref: nullableString,
  primary_contact_ref: nullableString,
  primary_round_ref: nullableString,
  primary_fund_ref: nullableString,
  companies: z.array(companySchema).default([]),
  contacts: z.array(contactSchema).default([]),
  rounds: z.array(roundSchema).default([]),
  funds: z.array(fundSchema).default([]),
  notes: z.array(noteSchema).default([]),
  tasks: z.array(taskSchema).default([]),
  assistant: assistantSchema,
  verification: z.array(verificationEntrySchema).default([]),
})

export const companyMatchOutputSchema = z.object({
  match: z.boolean(),
  confidence: nullableNumber,
  reason: nullableString,
})

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() || null : value == null ? null : String(value).trim() || null
}

function normalizeStringArray(values = []) {
  return (Array.isArray(values) ? values : []).map((value) => normalizeString(value)).filter(Boolean)
}

function normalizeEntityList(list = [], normalizer) {
  return (Array.isArray(list) ? list : []).map((item) => normalizer(item || {})).filter(Boolean)
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
    PAX_Count: Number.isFinite(Number(company.PAX_Count)) ? Number(company.PAX_Count) : null,
    PAX_Known: Number.isFinite(Number(company.PAX_Known)) ? Number(company.PAX_Known) : null,
    Rounds_Funds_Count: Number.isFinite(Number(company.Rounds_Funds_Count))
      ? Number(company.Rounds_Funds_Count)
      : null,
    Amount_Raised: Number.isFinite(Number(company.Amount_Raised)) ? Number(company.Amount_Raised) : null,
    founder_contact_refs: normalizeStringArray(company.founder_contact_refs),
    related_contact_refs: normalizeStringArray(company.related_contact_refs),
    leadership_contact_refs: normalizeStringArray(company.leadership_contact_refs),
    advisor_contact_refs: normalizeStringArray(company.advisor_contact_refs),
    shareholder_contact_refs: normalizeStringArray(company.shareholder_contact_refs),
    hq_region_names: normalizeStringArray(company.hq_region_names),
    industry_names: normalizeStringArray(company.industry_names),
    invested_company_refs: normalizeStringArray(company.invested_company_refs),
    institutional_investor_company_refs: normalizeStringArray(
      company.institutional_investor_company_refs,
    ),
    round_refs: normalizeStringArray(company.round_refs),
    fund_refs: normalizeStringArray(company.fund_refs),
  }

  return normalized.ref || normalized.Company_Name ? normalized : null
}

function normalizeContact(contact = {}) {
  const normalized = {
    ref: normalizeString(contact.ref),
    Name: normalizeString(contact.Name),
    Personal_Email: normalizeString(contact.Personal_Email),
    Professional_Email: normalizeString(contact.Professional_Email),
    Phone: normalizeString(contact.Phone),
    Country_based: normalizeString(contact.Country_based),
    LinkedIn: normalizeString(contact.LinkedIn),
  }

  return normalized.ref || normalized.Name ? normalized : null
}

function normalizeRound(round = {}) {
  const normalized = {
    ref: normalizeString(round.ref),
    Round_Name: normalizeString(round.Round_Name),
    sponsor_company_ref: normalizeString(round.sponsor_company_ref),
    company_refs: normalizeStringArray(round.company_refs),
    Round_Raising_Status: normalizeString(round.Round_Raising_Status),
    Round_Security_Type: normalizeString(round.Round_Security_Type),
    Round_Target_Size: Number.isFinite(Number(round.Round_Target_Size))
      ? Number(round.Round_Target_Size)
      : null,
    Round_Commited_Amounts: Number.isFinite(Number(round.Round_Commited_Amounts))
      ? Number(round.Round_Commited_Amounts)
      : null,
    Round_Min_Ticket_Size: Number.isFinite(Number(round.Round_Min_Ticket_Size))
      ? Number(round.Round_Min_Ticket_Size)
      : null,
    Round_Close_Date: normalizeString(round.Round_Close_Date),
    Round_Summary: normalizeString(round.Round_Summary),
    Round_Pre_Valuation: Number.isFinite(Number(round.Round_Pre_Valuation))
      ? Number(round.Round_Pre_Valuation)
      : null,
    Round_Post_Valuation: Number.isFinite(Number(round.Round_Post_Valuation))
      ? Number(round.Round_Post_Valuation)
      : null,
    Round_Previous_Post_Valuation: Number.isFinite(Number(round.Round_Previous_Post_Valuation))
      ? Number(round.Round_Previous_Post_Valuation)
      : null,
    target_region_names: normalizeStringArray(round.target_region_names),
    target_industry_names: normalizeStringArray(round.target_industry_names),
    captable_individual_contact_refs: normalizeStringArray(round.captable_individual_contact_refs),
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
    Fund_Target_Size: Number.isFinite(Number(fund.Fund_Target_Size))
      ? Number(fund.Fund_Target_Size)
      : null,
    Fund_Commited_Amounts: Number.isFinite(Number(fund.Fund_Commited_Amounts))
      ? Number(fund.Fund_Commited_Amounts)
      : null,
    Fund_Min_Ticket_Size: Number.isFinite(Number(fund.Fund_Min_Ticket_Size))
      ? Number(fund.Fund_Min_Ticket_Size)
      : null,
    Fund_Close_Date: normalizeString(fund.Fund_Close_Date),
    Fund_Summary: normalizeString(fund.Fund_Summary),
    Fund_Reserve: Number.isFinite(Number(fund.Fund_Reserve)) ? Number(fund.Fund_Reserve) : null,
    Fund_Initial_Ticket_Size: Number.isFinite(Number(fund.Fund_Initial_Ticket_Size))
      ? Number(fund.Fund_Initial_Ticket_Size)
      : null,
    Fund_Target_Positions: Number.isFinite(Number(fund.Fund_Target_Positions))
      ? Number(fund.Fund_Target_Positions)
      : null,
    manager_contact_refs: normalizeStringArray(fund.manager_contact_refs),
    target_region_names: normalizeStringArray(fund.target_region_names),
    target_industry_names: normalizeStringArray(fund.target_industry_names),
    target_stage_names: normalizeStringArray(fund.target_stage_names),
    target_asset_types: normalizeStringArray(fund.target_asset_types),
    captable_individual_contact_refs: normalizeStringArray(fund.captable_individual_contact_refs),
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
    notes: normalizeEntityList(input.notes, (row) => {
      const content = normalizeString(row.content)
      if (!content) return null
      return { title: normalizeString(row.title), content }
    }),
    tasks: normalizeEntityList(input.tasks, (row) => {
      const Task_Name = normalizeString(row.Task_Name)
      if (!Task_Name) return null
      return {
        Task_Name,
        Task_Description: normalizeString(row.Task_Description),
        Status: normalizeString(row.Status),
        Priority: normalizeString(row.Priority),
        Due_Date: normalizeString(row.Due_Date),
      }
    }),
    assistant: {
      name: normalizeString(input.assistant?.name),
      version: normalizeString(input.assistant?.version) || 'v1',
      description: normalizeString(input.assistant?.description),
      system_prompt: normalizeString(input.assistant?.system_prompt),
      tools: normalizeStringArray(input.assistant?.tools),
      functions: normalizeStringArray(input.assistant?.functions),
      context_sources: normalizeStringArray(input.assistant?.context_sources),
    },
    verification: normalizeEntityList(input.verification, (row) => {
      const field_path = normalizeString(row.field_path)
      if (!field_path) return null
      const confidence = Number.isFinite(Number(row.confidence)) ? Number(row.confidence) : null
      return {
        field_path,
        confidence,
        verification_flag: Boolean(row.verification_flag),
        evidence: normalizeString(row.evidence),
      }
    }),
  }
}

function pickPrimaryByRef(list = [], refKey, explicitRef) {
  const normalizedRef = normalizeString(explicitRef)
  if (normalizedRef) {
    const found = (Array.isArray(list) ? list : []).find((item) => normalizeString(item?.[refKey]) === normalizedRef)
    if (found) return found
  }
  return Array.isArray(list) && list.length ? list[0] : null
}

export function projectStructuredAutofillToLegacy(structured = {}) {
  const primaryCompany = pickPrimaryByRef(structured.companies, 'ref', structured.primary_company_ref)
  const primaryContact = pickPrimaryByRef(structured.contacts, 'ref', structured.primary_contact_ref)
  const primaryRound = pickPrimaryByRef(structured.rounds, 'ref', structured.primary_round_ref)
  const primaryFund = pickPrimaryByRef(structured.funds, 'ref', structured.primary_fund_ref)

  const company = primaryCompany
    ? {
        Company_Name: primaryCompany.Company_Name || '',
        Company_Type: primaryCompany.Company_Type || '',
        One_Liner: primaryCompany.One_Liner || '',
        Status: primaryCompany.Status || '',
        Date_of_Incorporation: primaryCompany.Date_of_Incorporation || '',
        Pax: primaryCompany.PAX_Count ?? '',
        Updates: primaryCompany.Updates || '',
        Website: primaryCompany.Website || '',
      }
    : {}

  const contact = primaryContact
    ? {
        Name: primaryContact.Name || '',
        Personal_Email: primaryContact.Personal_Email || '',
        Professional_Email: primaryContact.Professional_Email || '',
        Phone: primaryContact.Phone || '',
        LinkedIn: primaryContact.LinkedIn || '',
        Country_based: primaryContact.Country_based || '',
      }
    : {}

  let opportunity = {}
  if (primaryRound) {
    opportunity = {
      Venture_Oppty_Name: primaryRound.Round_Name || '',
      kind: 'round',
      Type_of_Security: primaryRound.Round_Security_Type || '',
      Round_Amount: primaryRound.Round_Target_Size ?? null,
      Hard_Commits: primaryRound.Round_Commited_Amounts ?? null,
      Investment_Ask: primaryRound.Round_Target_Size ?? null,
      Final_Close_Date: primaryRound.Round_Close_Date || '',
      Raising_Status: primaryRound.Round_Raising_Status || '',
      Pre_Valuation: primaryRound.Round_Pre_Valuation ?? null,
      Post_Valuation: primaryRound.Round_Post_Valuation ?? null,
      Previous_Post: primaryRound.Round_Previous_Post_Valuation ?? null,
    }
  } else if (primaryFund) {
    opportunity = {
      Venture_Oppty_Name: primaryFund.Fund_Name || '',
      kind: 'fund',
      Round_Amount: primaryFund.Fund_Target_Size ?? null,
      Hard_Commits: primaryFund.Fund_Commited_Amounts ?? null,
      Investment_Ask: primaryFund.Fund_Target_Size ?? null,
      Final_Close_Date: primaryFund.Fund_Close_Date || '',
      Raising_Status: primaryFund.Fund_Raising_Status || '',
      Pipeline_Status: primaryFund.Fund_Period || '',
    }
  }

  return {
    opportunity,
    company,
    contact,
    notes: structured.notes || [],
    tasks: structured.tasks || [],
    assistant: structured.assistant || {
      name: null,
      version: 'v1',
      description: null,
      system_prompt: null,
      tools: [],
      functions: [],
      context_sources: [],
    },
  }
}

export function verificationEntriesToMap(entries = []) {
  return Object.fromEntries(
    (Array.isArray(entries) ? entries : [])
      .map((entry) => {
        const key = normalizeString(entry?.field_path)
        if (!key) return null
        return [
          key,
          {
            confidence: Number.isFinite(Number(entry?.confidence)) ? Number(entry.confidence) : 0.9,
            verificationFlag: Boolean(entry?.verification_flag),
            evidence: normalizeString(entry?.evidence),
          },
        ]
      })
      .filter(Boolean),
  )
}
