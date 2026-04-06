import { ref } from 'vue'

const pendingAddEditShellRequest = ref(null)

export function setPendingAddEditShellRequest(request = null) {
  pendingAddEditShellRequest.value = request && typeof request === 'object'
    ? {
        sourceKey: String(request.sourceKey || '').trim().toLowerCase(),
        mode: String(request.mode || 'create').trim().toLowerCase() === 'edit' ? 'edit' : 'create',
        entityName: String(request.entityName || '').trim(),
        recordId: String(request.recordId || '').trim(),
        initialSectionKey: String(request.initialSectionKey || '').trim(),
        initialValues: request.initialValues && typeof request.initialValues === 'object'
          ? { ...request.initialValues }
          : {},
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
