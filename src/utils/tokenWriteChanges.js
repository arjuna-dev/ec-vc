import { getCanonicalTokenWriteTarget, getRuntimeTableNameForEntityName } from 'src/utils/structureRegistry'
import { getLdbRelationshipContractForToken } from 'src/shared/ldbRelationshipContracts'

export function normalizeTokenWriteValue(token, value) {
  const tokenType = String(token?.tokenType || '').trim()
  if (tokenType === 'select_multi') {
    const normalized = Array.isArray(value)
      ? value.map((item) => String(item || '').trim()).filter(Boolean)
      : String(value || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
    return normalized.length ? normalized : null
  }

  const normalized = String(value || '').trim()
  return normalized ? normalized : null
}

export function tokenHasDirectWriteTarget(token) {
  return Boolean(String(token?.dbWriteField || '').trim())
}

export function tokenHasRelationshipWriteContract(token, entityName = '') {
  return Boolean(getLdbRelationshipContractForToken(entityName, token))
}

export function tokenSupportsRecordUpdate(token, entityName = '') {
  return tokenHasRelationshipWriteContract(token, entityName) || tokenHasDirectWriteTarget(token)
}

export function haveNormalizedTokenValuesChanged(token, nextValue, initialValue) {
  const normalizedNext = normalizeTokenWriteValue(token, nextValue)
  const normalizedInitial = normalizeTokenWriteValue(token, initialValue)

  if (Array.isArray(normalizedNext) || Array.isArray(normalizedInitial)) {
    const nextList = Array.isArray(normalizedNext) ? normalizedNext : []
    const initialList = Array.isArray(normalizedInitial) ? normalizedInitial : []
    if (nextList.length !== initialList.length) return true
    return nextList.some((value, index) => value !== initialList[index])
  }

  return (normalizedNext || null) !== (normalizedInitial || null)
}

export function buildTokenUpdateChanges(token, {
  nextValue,
  initialValue,
  recordId = '',
  entityName = '',
  tableName = '',
  idColumn = 'id',
} = {}) {
  if (!recordId || !entityName || !haveNormalizedTokenValuesChanged(token, nextValue, initialValue)) return []

  const normalizedValue = normalizeTokenWriteValue(token, nextValue)
  const resolvedTableName = String(tableName || getRuntimeTableNameForEntityName(entityName) || entityName || '').trim()

  const relationshipContract = getLdbRelationshipContractForToken(entityName, token)
  if (relationshipContract) {
    const relationshipIds = Array.isArray(normalizedValue)
      ? normalizedValue.map((value) => String(value || '').trim()).filter(Boolean)
      : normalizedValue == null
        ? []
        : [String(normalizedValue || '').trim()].filter(Boolean)
    const contractTokenName = String(relationshipContract?.sourceToken || '').trim()
    const fallbackTokenName = String(token?.tokenName || '').trim()
    const relationshipTokenName = contractTokenName || fallbackTokenName
    const targetEntity = String(relationshipContract?.targetEntity || token?.targetEntity || token?.optionEntity || token?.option_entity || '').trim()
    return [
      {
        change_kind: 'relationship',
        table_name: resolvedTableName,
        record_id: recordId,
        field_name: relationshipTokenName,
        relationship_token: relationshipTokenName,
        target_entity: targetEntity,
        new_value: JSON.stringify(relationshipIds),
      },
    ]
  }

  const writeTarget = getCanonicalTokenWriteTarget(token, resolvedTableName, idColumn)
  if (!writeTarget?.tableName || !writeTarget?.fieldName) return []

  return [
    {
      table_name: writeTarget.tableName,
      record_id: recordId,
      field_name: writeTarget.fieldName,
      id_column: writeTarget.idColumn,
      new_value:
        normalizedValue == null
          ? null
          : Array.isArray(normalizedValue)
            ? JSON.stringify(normalizedValue)
            : String(normalizedValue ?? ''),
    },
  ]
}
