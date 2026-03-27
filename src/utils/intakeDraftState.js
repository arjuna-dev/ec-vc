import { reactive } from 'vue'

const intakeDraftState = reactive({
  activeDraftId: null,
  draftOrder: [],
  drafts: {},
})

let draftCounter = 0

function nextDraftId() {
  draftCounter += 1
  return `draft:${Date.now()}:${draftCounter}`
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeFiles(files = []) {
  return (Array.isArray(files) ? files : []).map((file) => ({
    name: String(file?.name || '').trim(),
    path: file?.path || null,
    size: Number(file?.size || 0),
  }))
}

function ensureDraftRecord(input = {}) {
  const id = String(input?.id || '').trim() || nextDraftId()
  const existing = intakeDraftState.drafts[id] || {}
  return {
    id,
    stage: 'Dropped',
    droppedFiles: [],
    opportunityId: null,
    createdAt: existing.createdAt || nowIso(),
    updatedAt: nowIso(),
    ...existing,
    ...input,
  }
}

export function useIntakeDraftState() {
  return intakeDraftState
}

export function createIntakeDraft(input = {}) {
  const draft = ensureDraftRecord({
    ...input,
    droppedFiles: normalizeFiles(input?.droppedFiles),
  })
  intakeDraftState.drafts[draft.id] = draft
  if (!intakeDraftState.draftOrder.includes(draft.id)) {
    intakeDraftState.draftOrder.unshift(draft.id)
  }
  intakeDraftState.activeDraftId = draft.id
  return draft
}

export function updateIntakeDraft(draftId, updates = {}) {
  const normalizedDraftId = String(draftId || '').trim()
  if (!normalizedDraftId) return null
  const existing = intakeDraftState.drafts[normalizedDraftId]
  if (!existing) return null

  const nextDraft = ensureDraftRecord({
    ...existing,
    ...updates,
    id: normalizedDraftId,
    droppedFiles:
      updates && Object.prototype.hasOwnProperty.call(updates, 'droppedFiles')
        ? normalizeFiles(updates.droppedFiles)
        : existing.droppedFiles,
  })

  intakeDraftState.drafts[normalizedDraftId] = nextDraft
  return nextDraft
}

export function setActiveIntakeDraft(draftId) {
  const normalizedDraftId = String(draftId || '').trim()
  intakeDraftState.activeDraftId =
    normalizedDraftId && intakeDraftState.drafts[normalizedDraftId] ? normalizedDraftId : null
}

export function getActiveIntakeDraft() {
  const activeDraftId = String(intakeDraftState.activeDraftId || '').trim()
  return activeDraftId ? intakeDraftState.drafts[activeDraftId] || null : null
}

export function removeIntakeDraft(draftId) {
  const normalizedDraftId = String(draftId || '').trim()
  if (!normalizedDraftId || !intakeDraftState.drafts[normalizedDraftId]) return

  delete intakeDraftState.drafts[normalizedDraftId]
  intakeDraftState.draftOrder = intakeDraftState.draftOrder.filter((id) => id !== normalizedDraftId)
  if (intakeDraftState.activeDraftId === normalizedDraftId) {
    intakeDraftState.activeDraftId = intakeDraftState.draftOrder[0] || null
  }
}
