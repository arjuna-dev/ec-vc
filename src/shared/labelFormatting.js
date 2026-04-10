const EXACT_LABEL_ALIASES = Object.freeze({
  bemail: 'Business Email',
  pemail: 'Personal Email',
})

const WORD_ALIASES = Object.freeze({
  id: 'ID',
  api: 'API',
  aum: 'AUM',
  aums: 'AUMs',
  llm: 'LLM',
  rofo: 'ROFO',
  ror: 'ROR',
  bemail: 'Business Email',
  pemail: 'Personal Email',
})

export function formatSharedDisplayLabel(value = '') {
  const normalizedValue = String(value || '').trim()
  if (!normalizedValue) return ''

  const exactKey = normalizedValue.toLowerCase().replace(/[_\s]+/g, '_')
  if (EXACT_LABEL_ALIASES[exactKey]) return EXACT_LABEL_ALIASES[exactKey]

  const formatted = normalizedValue
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => {
      const lower = String(word).toLowerCase()
      if (WORD_ALIASES[lower]) return WORD_ALIASES[lower]
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
  return formatted
}
