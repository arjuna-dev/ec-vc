import { ref } from 'vue'

const pendingAddEditShellRequest = ref(null)

export function setPendingAddEditShellRequest(request = null) {
  pendingAddEditShellRequest.value = request && typeof request === 'object'
    ? {
        sourceKey: String(request.sourceKey || '').trim().toLowerCase(),
        initialValues: request.initialValues && typeof request.initialValues === 'object'
          ? { ...request.initialValues }
          : {},
        initialFieldMeta: request.initialFieldMeta && typeof request.initialFieldMeta === 'object'
          ? { ...request.initialFieldMeta }
          : {},
        snapshot: request.snapshot && typeof request.snapshot === 'object'
          ? { ...request.snapshot }
          : null,
      }
    : null
}

export function consumePendingAddEditShellRequest(sourceKey = '') {
  const pending = pendingAddEditShellRequest.value
  const normalizedSourceKey = String(sourceKey || '').trim().toLowerCase()
  if (!pending || pending.sourceKey !== normalizedSourceKey) return null
  pendingAddEditShellRequest.value = null
  return pending
}
