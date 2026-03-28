import { reactive } from 'vue'

const breadcrumbActionsState = reactive({
  owner: '',
  actions: [],
})

export function useBreadcrumbActionsState() {
  return breadcrumbActionsState
}

export function setBreadcrumbActions(owner, actions = []) {
  breadcrumbActionsState.owner = String(owner || '').trim()
  breadcrumbActionsState.actions = Array.isArray(actions) ? [...actions] : []
}

export function clearBreadcrumbActions(owner) {
  const normalizedOwner = String(owner || '').trim()
  if (!normalizedOwner || breadcrumbActionsState.owner !== normalizedOwner) return
  breadcrumbActionsState.owner = ''
  breadcrumbActionsState.actions = []
}
