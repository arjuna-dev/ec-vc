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
