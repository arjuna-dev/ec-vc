const CONTACT_COMPLETENESS_IGNORED_FIELDS = new Set(['id', 'created_at', 'updated_at'])

const CONTACT_COMPLETENESS_THEMES = {
  sparse: {
    tone: 'sparse',
    blobStrong: 'rgba(255, 85, 33, 0.24)',
    blobSoft: 'rgba(255, 85, 33, 0.12)',
    blobFade: 'rgba(255, 85, 33, 0.06)',
    surfaceStart: '#fff8f4',
    surfaceEnd: '#f6e5dc',
  },
  medium: {
    tone: 'medium',
    blobStrong: 'rgba(235, 255, 90, 0.32)',
    blobSoft: 'rgba(235, 255, 90, 0.15)',
    blobFade: 'rgba(235, 255, 90, 0.08)',
    surfaceStart: '#fffff2',
    surfaceEnd: '#f4f0cf',
  },
  rich: {
    tone: 'rich',
    blobStrong: 'rgba(38, 71, 255, 0.2)',
    blobSoft: 'rgba(38, 71, 255, 0.1)',
    blobFade: 'rgba(38, 71, 255, 0.05)',
    surfaceStart: '#ffffff',
    surfaceEnd: '#eef1ff',
  },
}

export function countFilledContactFields(source, ignoredFields = CONTACT_COMPLETENESS_IGNORED_FIELDS) {
  if (!source) return 0

  if (Array.isArray(source)) {
    return source.reduce((count, item) => {
      const fieldName = String(item?.field_name ?? item?.key ?? item?.name ?? '').trim()
      if (!fieldName || ignoredFields.has(fieldName)) return count
      return hasMeaningfulValue(item?.value) ? count + 1 : count
    }, 0)
  }

  return Object.entries(source).reduce((count, [fieldName, value]) => {
    if (ignoredFields.has(fieldName)) return count
    return hasMeaningfulValue(value) ? count + 1 : count
  }, 0)
}

export function getContactCompletenessTheme(filledCount) {
  if (filledCount < 3) return CONTACT_COMPLETENESS_THEMES.sparse
  if (filledCount <= 8) return CONTACT_COMPLETENESS_THEMES.medium
  return CONTACT_COMPLETENESS_THEMES.rich
}

function hasMeaningfulValue(value) {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulValue(item))
  if (typeof value === 'number') return !Number.isNaN(value)
  if (typeof value === 'boolean') return value
  if (typeof value === 'object') return Object.values(value).some((item) => hasMeaningfulValue(item))
  return Boolean(value)
}
