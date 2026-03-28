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

function nowMs() {
  return Date.now()
}

function normalizeChunk(input = {}) {
  const chunkId = String(input?.chunk_id || input?.chunkId || '').trim()
  return {
    chunk_id: chunkId || `chunk:${nowMs()}:${Math.random().toString(36).slice(2, 8)}`,
    artifact_id: input?.artifact_id ?? input?.artifactId ?? null,
    source_page_range: String(input?.source_page_range || input?.sourcePageRange || '').trim(),
    section_hint: String(input?.section_hint || input?.sectionHint || '').trim(),
    markdown_text: String(input?.markdown_text || input?.markdownText || ''),
    stage_status: String(input?.stage_status || input?.stageStatus || 'raw').trim() || 'raw',
    released_at: input?.released_at || input?.releasedAt || null,
    used_by: Array.isArray(input?.used_by || input?.usedBy)
      ? [...new Set((input.used_by || input.usedBy).map((value) => String(value || '').trim()).filter(Boolean))]
      : [],
    owned_fields: Array.isArray(input?.owned_fields || input?.ownedFields)
      ? [...new Set((input.owned_fields || input.ownedFields).map((value) => String(value || '').trim()).filter(Boolean))]
      : [],
    confidence: Number.isFinite(Number(input?.confidence)) ? Number(input.confidence) : null,
    created_at: input?.created_at || input?.createdAt || nowIso(),
    updated_at: nowIso(),
  }
}

function normalizeMetadataClaim(input = {}) {
  return {
    claim_id: String(input?.claim_id || input?.claimId || '').trim() || `claim:${nowMs()}:${Math.random().toString(36).slice(2, 8)}`,
    field_key: String(input?.field_key || input?.fieldKey || '').trim(),
    field_value: String(input?.field_value || input?.fieldValue || '').trim(),
    owner_table: String(input?.owner_table || input?.ownerTable || '').trim(),
    consumer_lane: String(input?.consumer_lane || input?.consumerLane || '').trim(),
    source_chunk_id: String(input?.source_chunk_id || input?.sourceChunkId || '').trim(),
    source_type: String(input?.source_type || input?.sourceType || '').trim(),
    confidence: Number.isFinite(Number(input?.confidence)) ? Number(input.confidence) : null,
    verification_state: String(input?.verification_state || input?.verificationState || 'proposed').trim(),
    selected_source: String(input?.selected_source || input?.selectedSource || '').trim(),
    created_at: input?.created_at || input?.createdAt || nowIso(),
    updated_at: nowIso(),
  }
}

function normalizeChunkMap(chunks = {}) {
  if (Array.isArray(chunks)) {
    return Object.fromEntries(chunks.map((chunk) => {
      const normalizedChunk = normalizeChunk(chunk)
      return [normalizedChunk.chunk_id, normalizedChunk]
    }))
  }
  return Object.fromEntries(
    Object.entries(chunks || {}).map(([chunkId, chunk]) => {
      const normalizedChunk = normalizeChunk({
        ...chunk,
        chunk_id: chunk?.chunk_id || chunkId,
      })
      return [normalizedChunk.chunk_id, normalizedChunk]
    }),
  )
}

function normalizeMetadataClaims(claims = []) {
  return (Array.isArray(claims) ? claims : [])
    .map((claim) => normalizeMetadataClaim(claim))
    .filter((claim) => claim.field_key)
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
    releasedMarkdownChunks:
      input && Object.prototype.hasOwnProperty.call(input, 'releasedMarkdownChunks')
        ? normalizeChunkMap(input.releasedMarkdownChunks)
        : normalizeChunkMap(existing.releasedMarkdownChunks),
    usedMetadataClaims:
      input && Object.prototype.hasOwnProperty.call(input, 'usedMetadataClaims')
        ? normalizeMetadataClaims(input.usedMetadataClaims)
        : normalizeMetadataClaims(existing.usedMetadataClaims),
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
    releasedMarkdownChunks:
      updates && Object.prototype.hasOwnProperty.call(updates, 'releasedMarkdownChunks')
        ? normalizeChunkMap(updates.releasedMarkdownChunks)
        : existing.releasedMarkdownChunks,
    usedMetadataClaims:
      updates && Object.prototype.hasOwnProperty.call(updates, 'usedMetadataClaims')
        ? normalizeMetadataClaims(updates.usedMetadataClaims)
        : existing.usedMetadataClaims,
  })

  intakeDraftState.drafts[normalizedDraftId] = nextDraft
  return nextDraft
}

export function upsertDraftMarkdownChunk(draftId, chunkInput = {}) {
  const normalizedDraftId = String(draftId || '').trim()
  const existing = intakeDraftState.drafts[normalizedDraftId]
  if (!normalizedDraftId || !existing) return null

  const previousChunkMap = normalizeChunkMap(existing.releasedMarkdownChunks)
  const previousChunk =
    previousChunkMap[String(chunkInput?.chunk_id || chunkInput?.chunkId || '').trim()] || {}
  const nextChunk = normalizeChunk({
    ...previousChunk,
    ...chunkInput,
    released_at:
      chunkInput?.released_at ||
      chunkInput?.releasedAt ||
      previousChunk?.released_at ||
      (String(chunkInput?.stage_status || chunkInput?.stageStatus || '').includes('ready')
        ? nowIso()
        : null),
  })

  return updateIntakeDraft(normalizedDraftId, {
    releasedMarkdownChunks: {
      ...previousChunkMap,
      [nextChunk.chunk_id]: nextChunk,
    },
  })
}

export function recordDraftMetadataClaim(draftId, claimInput = {}) {
  const normalizedDraftId = String(draftId || '').trim()
  const existing = intakeDraftState.drafts[normalizedDraftId]
  if (!normalizedDraftId || !existing) return null

  const nextClaim = normalizeMetadataClaim(claimInput)
  if (!nextClaim.field_key) return existing

  const claims = normalizeMetadataClaims(existing.usedMetadataClaims).filter((claim) => {
    const sameField = claim.field_key === nextClaim.field_key
    const sameLane = claim.consumer_lane === nextClaim.consumer_lane
    const sameChunk = claim.source_chunk_id === nextClaim.source_chunk_id
    return !(sameField && sameLane && sameChunk)
  })

  claims.unshift(nextClaim)
  return updateIntakeDraft(normalizedDraftId, {
    usedMetadataClaims: claims,
  })
}

export function clearDraftExtractionOwnership(draftId) {
  const normalizedDraftId = String(draftId || '').trim()
  const existing = intakeDraftState.drafts[normalizedDraftId]
  if (!normalizedDraftId || !existing) return null

  const nextChunks = Object.fromEntries(
    Object.entries(normalizeChunkMap(existing.releasedMarkdownChunks)).map(([chunkId, chunk]) => [
      chunkId,
      {
        ...chunk,
        used_by: [],
        owned_fields: [],
        updated_at: nowIso(),
      },
    ]),
  )

  return updateIntakeDraft(normalizedDraftId, {
    releasedMarkdownChunks: nextChunks,
    usedMetadataClaims: [],
  })
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
