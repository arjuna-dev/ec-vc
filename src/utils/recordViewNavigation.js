export const RECORD_VIEW_ROUTE_NAME = 'record-view'

export function buildRecordViewLocation({ tableName, recordId, returnTo } = {}) {
  const normalizedRecordId = String(recordId || '').trim()
  if (!normalizedRecordId) return null

  const location = {
    name: RECORD_VIEW_ROUTE_NAME,
    params: {
      tableName,
      recordId: normalizedRecordId,
    },
  }

  if (returnTo) {
    location.query = { returnTo }
  }

  return location
}

export function pushRecordView(router, options) {
  const location = buildRecordViewLocation(options)
  if (!location) return Promise.resolve()
  return router.push(location)
}

export function buildResolvedPagePath(router, route, query = {}) {
  return router.resolve({
    path: route.path,
    query,
  }).fullPath
}

export function createRecordViewOpener(
  router,
  { tableName, getTableName, recordIdKey = 'id', getRecordId, getReturnTo } = {},
) {
  return (row) => {
    const resolvedTableName =
      typeof getTableName === 'function' ? getTableName(row) : tableName
    const resolvedRecordId =
      typeof getRecordId === 'function' ? getRecordId(row) : row?.[recordIdKey]
    const resolvedReturnTo = typeof getReturnTo === 'function' ? getReturnTo(row) : undefined

    return pushRecordView(router, {
      tableName: resolvedTableName,
      recordId: resolvedRecordId,
      returnTo: resolvedReturnTo,
    })
  }
}
