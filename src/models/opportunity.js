import opportunityTemplate from './templates/opportunity.json'

export const OPPORTUNITY_TEMPLATE = opportunityTemplate

export function createOpportunity () {
  if (typeof structuredClone === 'function') {
    return structuredClone(OPPORTUNITY_TEMPLATE)
  }
  return JSON.parse(JSON.stringify(OPPORTUNITY_TEMPLATE))
}
