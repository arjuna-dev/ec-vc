import { buildTokenUpdateChanges } from 'src/utils/tokenWriteChanges'
import { getRuntimeTableNameForEntityName } from 'src/utils/structureRegistry'

export function buildSharedRecordEditChanges(tokens = [], values = {}, initialValues = {}, { recordId = '', entityName = '' } = {}) {
  if (!recordId || !entityName) return []
  const tableName = getRuntimeTableNameForEntityName(entityName)
  return (Array.isArray(tokens) ? tokens : []).flatMap((token) =>
    buildTokenUpdateChanges(token, {
      nextValue: values?.[token.key],
      initialValue: initialValues?.[token.key],
      recordId,
      entityName,
      tableName,
    }),
  )
}

export async function submitSharedRecordEditSession({
  bridge = null,
  tokens = [],
  values = {},
  initialValues = {},
  recordId = '',
  entityName = '',
  actionLabel = 'shared_dialog_shell_edit',
} = {}) {
  if (!recordId || !entityName) {
    throw new Error('This record cannot be edited from the shared shell yet.')
  }

  const tableName = getRuntimeTableNameForEntityName(entityName)
  const changes = buildSharedRecordEditChanges(tokens, values, initialValues, { recordId, entityName })
  if (!changes.length) return { changes: [] }

  await bridge?.records?.update?.({
    tableName,
    recordId,
    changes,
    actionLabel,
  })

  return { changes }
}
