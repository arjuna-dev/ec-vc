import { reactive } from 'vue'

const intakeReviewQueueState = reactive({
  items: [],
  activeItemId: null,
})

function nowMs() {
  return Date.now()
}

function normalizedId(value) {
  return String(value || '').trim()
}

function sameItem(a = {}, b = {}) {
  return normalizedId(a.id) && normalizedId(a.id) === normalizedId(b.id)
}

function nextPendingItem() {
  return intakeReviewQueueState.items.find((item) => item.status === 'pending') || null
}

function ensureActiveItem() {
  const activeId = normalizedId(intakeReviewQueueState.activeItemId)
  const active = intakeReviewQueueState.items.find((item) => normalizedId(item.id) === activeId)
  if (active && active.status === 'active') return active

  const next = nextPendingItem()
  if (!next) {
    intakeReviewQueueState.activeItemId = null
    return null
  }

  next.status = 'active'
  next.updatedAt = nowMs()
  intakeReviewQueueState.activeItemId = next.id
  return next
}

export function useIntakeReviewQueueState() {
  return intakeReviewQueueState
}

export function enqueueIntakeReviewItem(item = {}) {
  const normalized = {
    id: normalizedId(item.id) || `queue:${nowMs()}:${Math.random().toString(36).slice(2, 8)}`,
    kind: normalizedId(item.kind) || 'field-review',
    draftId: normalizedId(item.draftId) || null,
    status: 'pending',
    payload: item.payload || {},
    createdAt: nowMs(),
    updatedAt: nowMs(),
  }

  const existing = intakeReviewQueueState.items.find((entry) => sameItem(entry, normalized))
  if (existing) {
    existing.payload = normalized.payload
    existing.draftId = normalized.draftId
    existing.updatedAt = nowMs()
    return ensureActiveItem()
  }

  intakeReviewQueueState.items.push(normalized)
  return ensureActiveItem()
}

export function resolveIntakeReviewItem(itemId) {
  const normalized = normalizedId(itemId)
  const target = intakeReviewQueueState.items.find((item) => normalizedId(item.id) === normalized)
  if (!target) return
  target.status = 'resolved'
  target.updatedAt = nowMs()
  if (normalizedId(intakeReviewQueueState.activeItemId) === normalized) {
    intakeReviewQueueState.activeItemId = null
  }
}

export function dismissIntakeReviewItem(itemId) {
  const normalized = normalizedId(itemId)
  const target = intakeReviewQueueState.items.find((item) => normalizedId(item.id) === normalized)
  if (!target) return
  target.status = 'dismissed'
  target.updatedAt = nowMs()
  if (normalizedId(intakeReviewQueueState.activeItemId) === normalized) {
    intakeReviewQueueState.activeItemId = null
  }
}

export function activateNextIntakeReviewItem() {
  return ensureActiveItem()
}
