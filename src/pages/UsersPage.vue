<template>
  <q-page class="q-pa-md">
    <div v-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Users requires Electron. Run <code>quasar dev -m electron</code> or open the Electron
        build.
      </q-banner>
    </div>

    <div v-else class="users-page">
      <section class="users-shell">
        <div
          class="users-shell__hero"
          @pointerenter="onHeroDashboardPointerEnter"
          @pointermove="onHeroDashboardPointerMove"
          @pointerleave="onHeroDashboardPointerLeave"
        >
          <div class="users-shell__copy">
            <div class="users-shell__eyebrow">Dashboard</div>
            <h2 class="users-shell__hero-title">Your internal team, permissions, and node owners.</h2>
            <p class="users-shell__hero-text">{{ usersHeroText }}</p>
          </div>

          <div class="users-dashboard">
            <div class="users-dashboard__stats">
              <article
                v-for="stat in usersDashboardStats"
                :key="stat.label"
                class="users-dashboard__stat"
                :class="`users-dashboard__stat--${stat.tone}`"
              >
                <div class="users-dashboard__stat-label">{{ stat.label }}</div>
                <div class="users-dashboard__stat-value">{{ stat.value }}</div>
                <div class="users-dashboard__stat-caption">{{ stat.caption }}</div>
              </article>
            </div>

            <div class="users-dashboard__health">
              <div class="users-dashboard__health-copy">
                <div class="users-dashboard__health-label">Profile health</div>
                <div class="users-dashboard__health-text">
                  {{ usersDashboard.completeCount }} complete, {{ usersDashboard.emailReadyCount }}
                  email ready, {{ usersDashboard.missingCoreCount }} missing core info
                </div>
              </div>

              <div class="users-dashboard__health-bar" aria-hidden="true">
                <span
                  class="users-dashboard__health-segment users-dashboard__health-segment--missing"
                  :style="{ width: `${usersDashboard.missingShare}%` }"
                />
                <span
                  class="users-dashboard__health-segment users-dashboard__health-segment--partial"
                  :style="{ width: `${usersDashboard.partialShare}%` }"
                />
                <span
                  class="users-dashboard__health-segment users-dashboard__health-segment--complete"
                  :style="{ width: `${usersDashboard.completeShare}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="users-toolbar">
          <div class="users-toolbar__block users-toolbar__block--select">
            <q-checkbox
              :model-value="allVisibleUsersSelected"
              :indeterminate="someVisibleUsersSelected && !allVisibleUsersSelected"
              :disable="loading || displayRows.length === 0"
              color="dark"
              class="users-toolbar__select-all"
              @update:model-value="toggleSelectAllVisibleUsers"
            />
            <q-btn
              no-caps
              unelevated
              class="users-toolbar__add-button"
              :disable="loading"
              @click="openCreateUser"
            >
              <span class="users-toolbar__add-button-inner">
                <span class="users-toolbar__add-button-plus">
                  <q-icon name="add" />
                </span>
                <span class="users-toolbar__add-button-label">Add Record</span>
              </span>
            </q-btn>
            <q-btn
              dense
              flat
              round
              icon="download"
              color="grey-6"
              class="users-toolbar__icon-button"
              :disable="loading"
              @click="csvActionsRef?.pickFile?.()"
            >
              <q-tooltip>Import CSV</q-tooltip>
            </q-btn>
          </div>

          <div class="users-toolbar__block users-toolbar__block--search">
            <q-icon name="tune" size="18px" class="users-toolbar__filters-icon" />
            <q-input
              v-model="searchQuery"
              dense
              outlined
              borderless
              class="users-toolbar__search"
              placeholder="Search users..."
              :disable="loading"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-btn-toggle
              v-model="viewMode"
              dense
              unelevated
              toggle-color="primary"
              color="grey-3"
              text-color="grey-8"
              class="users-toolbar__toggle users-toolbar__view-toggle"
              :disable="loading"
              :options="viewOptions"
            />
          </div>
        </div>

        <div class="users-surface">
          <q-banner
            v-if="!loading && displayRows.length === 0"
            class="users-empty-state bg-grey-1 text-black"
            rounded
          >
            No users match this view yet. Add your first node owner or team member to start shaping
            permissions.
          </q-banner>

          <q-table
            v-else-if="viewMode === 'table'"
            flat
            bordered
            v-model:selected="selectedUsers"
            :rows="displayRows"
            :columns="columns"
            row-key="id"
            :loading="loading"
            selection="multiple"
            class="users-table"
            :pagination="{ rowsPerPage: 15 }"
          >
            <template #body-cell-created_at="slotProps">
              <q-td :props="slotProps">{{ formatDate(slotProps.value) }}</q-td>
            </template>
            <template #body-cell-updated_at="slotProps">
              <q-td :props="slotProps">{{ formatDate(slotProps.value) }}</q-td>
            </template>
          </q-table>

          <div v-else class="row q-col-gutter-md users-cards-grid">
            <div v-for="user in displayRows" :key="user.id" class="col-12 col-md-6 col-lg-4">
              <q-card
                flat
                bordered
                class="user-card full-height"
                :style="getUserCardStyle()"
                @pointerenter="onUserCardPointerEnter"
                @pointermove="onUserCardPointerMove"
                @pointerleave="onUserCardPointerLeave"
              >
                <q-card-section class="user-card__control-row">
                  <q-checkbox
                    :model-value="isUserSelected(user)"
                    :disable="loading"
                    color="dark"
                    class="user-card__select-box"
                    @update:model-value="toggleUserSelection(user, $event)"
                  />

                  <q-btn
                    flat
                    round
                    icon="visibility"
                    class="user-card__control-eye"
                    :disable="loading"
                    @click="openRecordView(user)"
                  />
                </q-card-section>

                <q-card-section class="user-card__hero">
                  <div class="user-card__hero-main">
                    <figure class="user-card__portrait">
                      <div class="user-card__portrait-shell" aria-hidden="true">
                        <div
                          class="user-card__portrait-badge"
                          :style="{ backgroundColor: getUserAvatarColor(user.User_Name || 'User') }"
                        >
                          {{ getUserAvatarInitial(user.User_Name || 'User') }}
                        </div>
                      </div>
                    </figure>

                    <div class="user-card__hero-side">
                      <div class="user-card__hero-copy">
                        <div class="user-card__title">
                          {{ user.User_Name || 'Unnamed user' }}
                        </div>

                        <div class="user-card__bottom-stack">
                          <div v-if="getUserMetadataRows(user).length" class="user-card__detail-stack">
                            <div
                              v-for="detail in getUserMetadataRows(user)"
                              :key="detail.label"
                              class="user-card__detail-row"
                            >
                              <button type="button" class="user-card__inline-chip">
                                <q-icon :name="detail.icon" size="14px" />
                                <span>{{ detail.value }}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>

                <q-card-section class="user-card__summary">
                  <div class="user-card__summary-head">
                    <q-btn-toggle
                      :model-value="getUserCardPanel(user)"
                      dense
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="user-card__summary-toggle"
                      :options="getUserRelationshipOptions(user)"
                      @update:model-value="setUserCardPanel(user, $event)"
                    />

                    <q-btn-toggle
                      :model-value="getUserCardContentView(user)"
                      dense
                      unelevated
                      toggle-color="primary"
                      color="grey-3"
                      text-color="grey-8"
                      class="user-card__summary-view-toggle"
                      :options="userCardContentViewOptions"
                      @update:model-value="setUserCardContentView(user, $event)"
                    />
                  </div>

                  <div class="user-card__summary-panel">
                    <div class="user-card__summary-panel-head">
                      <q-btn flat no-caps class="user-card__summary-add-relation" aria-label="Add Relation">
                        <span class="user-card__summary-add-relation-plus">
                          <q-icon name="add" />
                        </span>
                        <span class="user-card__summary-add-relation-label">Add Relation</span>
                      </q-btn>
                    </div>
                    <div class="user-card__summary-body">
                      <div class="user-card__summary-body-content">
                        <div
                          v-if="getUserActiveRelationshipItems(user).length"
                          :class="[
                            'user-card__notes-list',
                            { 'user-card__notes-list--rows': getUserCardContentView(user) === 'table' },
                          ]"
                        >
                          <div
                            v-for="item in getUserActiveRelationshipItems(user)"
                            :key="item"
                            class="user-card__note-pill"
                          >
                            {{ item }}
                          </div>
                        </div>

                        <div v-else class="user-card__summary-empty">
                          No linked KDB relationships yet.
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>

        <div style="display: none">
          <TableCsvActions
            ref="csvActionsRef"
            filename-base="users"
            :headers="csvHeaders"
            :rows="displayRows"
            :on-import-rows="importRows"
          />
        </div>

        <UserCreateDialog v-model="userDialogOpen" @created="onUserCreated" />
      </section>

      <SelectionActionBar
        :count="selectedCount"
        :loading="loading"
        :can-delete="true"
        @share="shareSelected"
        @edit="editSelected"
        @delete="deleteSelected"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import SelectionActionBar from 'src/components/SelectionActionBar.vue'
import TableCsvActions from 'src/components/TableCsvActions.vue'
import UserCreateDialog from 'src/components/UserCreateDialog.vue'
import {
  buildCardRelationshipItems,
  buildCardRelationshipOptions,
  resolveCardRelationshipPanel,
} from 'src/utils/card-kdb-relationships'
import { pushRecordView } from 'src/utils/recordViewNavigation'

const rows = ref([])
const loading = ref(false)
const viewMode = ref('card')
const userKindFilter = ref('all')
const searchQuery = ref('')
const selectedUsers = ref([])
const userCardContentViews = ref({})
const userCardPanels = ref({})
const csvActionsRef = ref(null)
const userDialogOpen = ref(false)
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.users?.list)
const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const viewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]

const userCardContentViewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]

const columns = [
  { name: 'User_Name', label: 'Name', field: 'User_Name', align: 'left', sortable: true },
  { name: 'User_PEmail', label: 'Email', field: 'User_PEmail', align: 'left', sortable: true },
  { name: 'id', label: 'User ID', field: 'id', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'updated_at', label: 'Updated', field: 'updated_at', align: 'left', sortable: true },
]

const csvHeaders = ['id', 'User_Name', 'User_PEmail', 'created_at', 'updated_at']

const goldenUserLabel = computed(() => {
  const firstRow = rows.value[0]
  return String(firstRow?.User_Name || '').trim() || 'Not set'
})

const usersDashboard = computed(() => {
  const total = rows.value.length
  const counts = rows.value.reduce(
    (accumulator, row) => {
      const hasName = Boolean(String(row?.User_Name || '').trim())
      const hasEmail = Boolean(String(row?.User_PEmail || '').trim())

      if (hasName) {
        accumulator.namedCount += 1
      }

      if (hasEmail) {
        accumulator.emailReadyCount += 1
      }

      if (hasName && hasEmail) {
        accumulator.completeCount += 1
      } else {
        accumulator.missingCoreCount += 1
      }

      return accumulator
    },
    {
      namedCount: 0,
      emailReadyCount: 0,
      completeCount: 0,
      missingCoreCount: 0,
    },
  )

  const safeTotal = total || 1
  const partialCount = Math.max(counts.emailReadyCount - counts.completeCount, 0)

  return {
    total,
    ...counts,
    partialCount,
    missingShare: total ? (counts.missingCoreCount / safeTotal) * 100 : 0,
    partialShare: total ? (partialCount / safeTotal) * 100 : 0,
    completeShare: total ? (counts.completeCount / safeTotal) * 100 : 0,
  }
})

const usersHeroText = computed(() => {
  const { total, completeCount, missingCoreCount, emailReadyCount } = usersDashboard.value

  if (!total) {
    return 'Start with the node owner, then add your internal team so permissions and collaboration stay grounded in the same operating system.'
  }

  return `${total} internal users tracked, ${completeCount} already complete, ${emailReadyCount} email ready, and ${missingCoreCount} still need core details.`
})

const usersDashboardStats = computed(() => [
  {
    label: 'Total users',
    value: usersDashboard.value.total,
    caption: 'Internal team records',
    tone: 'neutral',
  },
  {
    label: 'Golden user',
    value: goldenUserLabel.value,
    caption: 'Current node owner anchor',
    tone: 'rich',
  },
  {
    label: 'Email ready',
    value: usersDashboard.value.emailReadyCount,
    caption: 'Ready for outreach and login flows',
    tone: 'rich',
  },
  {
    label: 'Need setup',
    value: usersDashboard.value.missingCoreCount,
    caption: 'Still missing name or email',
    tone: 'sparse',
  },
])

const displayRows = computed(() => {
  const normalizedSearch = String(searchQuery.value || '').trim().toLowerCase()

  return rows.value.filter((row, index) => {
    const matchesKind =
      userKindFilter.value === 'golden'
        ? index === 0
        : userKindFilter.value === 'needs-setup'
          ? !hasUserCoreDetails(row)
          : true

    if (!matchesKind) return false
    if (!normalizedSearch) return true

    return [
      row?.User_Name,
      row?.User_PEmail,
      row?.id,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
  })
})

const selectedCount = computed(() => selectedUsers.value.length)
const visibleUserIds = computed(() =>
  displayRows.value
    .map((row) => String(row?.id || '').trim())
    .filter(Boolean),
)
const allVisibleUsersSelected = computed(() => {
  if (visibleUserIds.value.length === 0) return false
  const selectedIdSet = new Set(
    selectedUsers.value.map((row) => String(row?.id || '').trim()).filter(Boolean),
  )
  return visibleUserIds.value.every((id) => selectedIdSet.has(id))
})
const someVisibleUsersSelected = computed(() => {
  if (visibleUserIds.value.length === 0) return false
  const selectedIdSet = new Set(
    selectedUsers.value.map((row) => String(row?.id || '').trim()).filter(Boolean),
  )
  return visibleUserIds.value.some((id) => selectedIdSet.has(id))
})

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function hasUserCoreDetails(user) {
  return Boolean(String(user?.User_Name || '').trim() && String(user?.User_PEmail || '').trim())
}

function isGoldenUser(user) {
  return rows.value[0]?.id === user?.id
}

function onHeroDashboardPointerEnter(event) {
  updateHeroDashboardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--hero-dashboard-blob-opacity', '1')
}

function onHeroDashboardPointerMove(event) {
  updateHeroDashboardGradientPosition(event)
}

function onHeroDashboardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element?.style) return
  element.style.setProperty('--hero-dashboard-blob-opacity', '0')
}

function updateHeroDashboardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element?.style || typeof element.getBoundingClientRect !== 'function') return

  const rect = element.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100

  element.style.setProperty('--hero-dashboard-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--hero-dashboard-blob-y', `${clamp(y, 10, 90)}%`)
}

function formatDate(value) {
  const text = String(value || '').trim()
  if (!text) return '--'
  return text.replace('T', ' ')
}

function getUserAvatarColor() {
  return '#111111'
}

function getUserAvatarInitial(label) {
  const text = String(label || 'User').trim()
  return (
    text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() || '')
      .join('') || 'US'
  )
}

function getUserCardStyle() {
  return {
    '--user-card-blob-x': '50%',
    '--user-card-blob-y': '30%',
    '--user-card-blob-size': '60%',
    '--user-card-blob-opacity': '0',
    '--user-card-blob-strong': 'rgba(38, 71, 255, 0.2)',
    '--user-card-blob-soft': 'rgba(38, 71, 255, 0.1)',
    '--user-card-blob-fade': 'rgba(38, 71, 255, 0.05)',
  }
}

function onUserCardPointerEnter(event) {
  updateUserCardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--user-card-blob-opacity', '1')
}

function onUserCardPointerMove(event) {
  updateUserCardGradientPosition(event)
}

function onUserCardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--user-card-blob-opacity', '0')
}

function updateUserCardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element) return
  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  element.style.setProperty('--user-card-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--user-card-blob-y', `${clamp(y, 10, 90)}%`)
}

function getUserMetadataRows(user) {
  return [
    String(user?.User_PEmail || '').trim()
      ? { label: 'Email', value: String(user.User_PEmail).trim(), icon: 'mail' }
      : null,
    { label: 'Role', value: isGoldenUser(user) ? 'Owner' : 'Team member', icon: 'badge' },
    user?.id ? { label: 'User ID', value: String(user.id), icon: 'fingerprint' } : null,
    user?.updated_at ? { label: 'Updated', value: formatDate(user.updated_at), icon: 'schedule' } : null,
  ].filter(Boolean)
}

function getUserCardContentView(user) {
  const rowId = String(user?.id || '').trim()
  return userCardContentViews.value[rowId] || 'card'
}

function setUserCardContentView(user, value) {
  const rowId = String(user?.id || '').trim()
  if (!rowId) return
  userCardContentViews.value = { ...userCardContentViews.value, [rowId]: value || 'card' }
}

function getUserRelationshipItems(user) {
  return buildCardRelationshipItems(user, ['User'], {
    notes: getUserLinkedNotes,
    artifacts: getUserLinkedArtifacts,
  })
}

function getUserRelationshipOptions(user) {
  return buildCardRelationshipOptions(getUserRelationshipItems(user))
}

function getUserCardPanel(user) {
  const rowId = String(user?.id || '').trim()
  const storedValue = userCardPanels.value[rowId]
  return resolveCardRelationshipPanel(storedValue, getUserRelationshipItems(user))
}

function setUserCardPanel(user, value) {
  const rowId = String(user?.id || '').trim()
  if (!rowId) return
  userCardPanels.value = { ...userCardPanels.value, [rowId]: value || 'notes' }
}

function getUserActiveRelationshipItems(user) {
  return getUserRelationshipItems(user)[getUserCardPanel(user)] || []
}

function getUserLinkedNotes(user) {
  return [
    ...String(user?.User_Note || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(user?.related_note_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
}

function getUserLinkedArtifacts(user) {
  return [
    ...String(user?.User_Artifact || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
    ...String(user?.related_artifact_ids || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean),
  ].slice(0, 4)
}

function isUserSelected(user) {
  return selectedUsers.value.some((selectedUser) => selectedUser?.id === user?.id)
}

function toggleUserSelection(user, shouldSelect) {
  const rowId = String(user?.id || '').trim()
  if (!rowId) return
  if (shouldSelect) {
    if (isUserSelected(user)) return
    selectedUsers.value = [...selectedUsers.value, user]
    return
  }
  selectedUsers.value = selectedUsers.value.filter((selectedUser) => String(selectedUser?.id || '').trim() !== rowId)
}

function toggleSelectAllVisibleUsers(shouldSelect) {
  if (!shouldSelect) {
    const visibleIdSet = new Set(visibleUserIds.value)
    selectedUsers.value = selectedUsers.value.filter(
      (selectedUser) => !visibleIdSet.has(String(selectedUser?.id || '').trim()),
    )
    return
  }

  const selectedIdSet = new Set(
    selectedUsers.value.map((row) => String(row?.id || '').trim()).filter(Boolean),
  )
  const additions = displayRows.value.filter(
    (row) => !selectedIdSet.has(String(row?.id || '').trim()),
  )
  selectedUsers.value = [...selectedUsers.value, ...additions]
}

function openRecordView(user) {
  return pushRecordView(router, {
    tableName: 'Users',
    recordId: user?.id,
    returnTo: route.fullPath,
  })
}

function editSelected() {
  const user = selectedUsers.value[0]
  if (!user) return
  openRecordView(user)
}

async function shareSelected() {
  if (selectedCount.value === 0) return
  const text = selectedUsers.value
    .map((user) =>
      [String(user?.User_Name || '').trim(), String(user?.User_PEmail || '').trim(), String(user?.id || '').trim()]
        .filter(Boolean)
        .join(' | '),
    )
    .filter(Boolean)
    .join('\n')

  if (!text) return

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      $q.notify({
        type: 'positive',
        message: `Copied ${selectedCount.value} selected user${selectedCount.value === 1 ? '' : 's'}.`,
      })
      return
    }
    throw new Error('Clipboard unavailable')
  } catch {
    $q.notify({
      type: 'warning',
      message: 'Unable to copy selected users from this environment.',
    })
  }
}

function deleteSelected() {
  if (selectedCount.value === 0) return
  $q.notify({
    type: 'info',
    message: 'Delete is visible in the Users prototype now, but the actual delete action is not wired yet.',
  })
}

async function importRows(importedRows = []) {
  const normalizedRows = importedRows
    .map((row, index) => ({
      id: String(row?.id || row?.ID || `imported-user-${index + 1}`).trim(),
      User_Name: String(row?.User_Name || row?.user_name || row?.name || '').trim(),
      User_PEmail: String(row?.User_PEmail || row?.user_pemail || row?.email || '').trim(),
      created_at: String(row?.created_at || '').trim(),
      updated_at: String(row?.updated_at || '').trim(),
    }))
    .filter((row) => row.id || row.User_Name || row.User_PEmail)

  rows.value = normalizedRows
  selectedUsers.value = []
  return { inserted: normalizedRows.length, updated: 0, skipped: 0 }
}

function openCreateUser() {
  userDialogOpen.value = true
}

function onOpenUserDialog() {
  globalThis.__ecvcOpenUserDialog = false
  openCreateUser()
}

function openCreateUserFromQuery() {
  if (String(route.query.create || '') !== '1') return
  openCreateUser()
  globalThis.__ecvcOpenUserDialog = false

  const nextQuery = { ...route.query }
  delete nextQuery.create
  router.replace({ query: nextQuery })
}

function consumeQueuedUserDialogOpen() {
  if (globalThis.__ecvcOpenUserDialog !== true) return false
  globalThis.__ecvcOpenUserDialog = false
  openCreateUser()
  return true
}

async function onUserCreated() {
  await loadUsers()
}

async function loadUsers() {
  if (!bridge.value?.users?.list) return
  loading.value = true
  try {
    const result = await bridge.value.users.list()
    rows.value = result?.users || []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  window.addEventListener('ecvc:open-user-dialog', onOpenUserDialog)
  await loadUsers()
  consumeQueuedUserDialogOpen()
  openCreateUserFromQuery()
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-user-dialog', onOpenUserDialog)
})

watch(
  () => route.query.create,
  () => {
    openCreateUserFromQuery()
  },
)
</script>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-top: 16px;
}

.users-shell {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.users-shell__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
  gap: var(--ds-space-24);
  padding: var(--ds-space-32);
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
  overflow: hidden;
  box-shadow: var(--ds-shadow-card-soft);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.users-shell__hero::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--hero-dashboard-blob-x, 50%) var(--hero-dashboard-blob-y, 28%),
    rgba(38, 71, 255, 0.2) 0%,
    rgba(38, 71, 255, 0.1) calc(var(--hero-dashboard-blob-size, 62%) * 0.46),
    rgba(38, 71, 255, 0.05) calc(var(--hero-dashboard-blob-size, 62%) * 0.7),
    transparent var(--hero-dashboard-blob-size, 62%)
  );
  opacity: var(--hero-dashboard-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.users-shell__hero:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 54px rgba(17, 17, 17, 0.08);
}

.users-shell__hero > * {
  position: relative;
  z-index: 1;
}

.users-shell__copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  min-width: 0;
  justify-content: flex-start;
}

.users-shell__eyebrow {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.16em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.users-shell__hero-title {
  margin: 38px 0 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 2.8rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.96;
  max-width: 13ch;
}

.users-shell__hero-text {
  margin: auto 0 0;
  display: flex;
  align-items: flex-end;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-base);
  max-width: 52ch;
}

.users-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-14);
  min-width: 0;
}

.users-dashboard__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
}

.users-dashboard__stat {
  display: flex;
  min-height: 116px;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--ds-space-6);
  padding: var(--ds-space-16);
  background: var(--ds-color-surface-overlay-84);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-card-soft);
}

.users-dashboard__stat--neutral {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(247, 244, 238, 0.94) 100%);
}

.users-dashboard__stat--rich {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(238, 241, 255, 0.96) 100%);
}

.users-dashboard__stat--sparse {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 244, 238, 0.96) 100%);
}

.users-dashboard__stat-label,
.users-dashboard__health-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.users-dashboard__stat-value {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(1.8rem, 2vw, 2.4rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.92;
  word-break: break-word;
}

.users-dashboard__stat-caption,
.users-dashboard__health-text {
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
}

.users-dashboard__health {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  padding: var(--ds-space-16) var(--ds-space-18);
  background: var(--ds-color-surface-overlay-78);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
}

.users-dashboard__health-copy {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
}

.users-dashboard__health-bar {
  display: flex;
  width: 100%;
  height: 12px;
  overflow: hidden;
  background: var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-pill);
}

.users-dashboard__health-segment {
  display: block;
  height: 100%;
}

.users-dashboard__health-segment--missing {
  background: #ff5521;
}

.users-dashboard__health-segment--partial {
  background: #ebff5a;
}

.users-dashboard__health-segment--complete {
  background: #2647ff;
}

.users-surface {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.users-toolbar {
  display: grid;
  grid-template-columns: auto auto auto minmax(0, 1.15fr) minmax(260px, 0.7fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.users-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.users-toolbar__block--select {
  margin-right: 4px;
}

.users-toolbar__block--view {
  padding-top: 2px;
  margin-right: 18px;
}

.users-toolbar__block--search {
  grid-column: -2 / -1;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
}

.users-toolbar__filters-icon {
  align-self: center;
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.users-toolbar__select-all {
  min-height: 26px;
  color: var(--ds-color-text-default, #111111);
}

.users-toolbar__select-all :deep(.q-checkbox__label) {
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-medium);
}

.users-toolbar__toggle {
  display: flex;
  align-items: center;
  align-self: center;
  flex: 0 0 auto;
  height: var(--ds-control-height-md);
  border-radius: var(--ds-control-radius);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-xs);
}

.users-toolbar__toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.users-toolbar__toggle :deep(.q-btn) {
  background: transparent;
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: none;
}

.users-toolbar__view-toggle :deep(.q-btn) {
  min-width: 26px;
  min-height: 26px;
  height: 26px;
  padding-inline: 4px;
}

.users-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.users-toolbar__view-toggle :deep(.q-icon) {
  font-size: 18px;
}

.users-toolbar__icon-button {
  align-self: center;
  width: 26px;
  height: 26px;
  min-width: 26px;
  min-height: 26px;
  padding: 0;
}

.users-toolbar__icon-button :deep(.q-icon) {
  font-size: 18px;
}

.users-toolbar__add-button {
  align-self: center;
  min-height: 36px;
  padding: 0 14px 0 8px;
  color: #111111;
  background: #ffffff;
  border: 0;
  border-radius: 999px;
  box-shadow: none;
  white-space: nowrap;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    transform 140ms ease;
}

.users-toolbar__add-button:hover,
.users-toolbar__add-button:focus-visible {
  transform: translateY(-1px);
}

.users-toolbar__add-button:active,
.users-toolbar__add-button.q-btn--active,
.users-toolbar__add-button.q-btn--standard.q-btn--active {
  color: #ffffff;
  background: #111111;
}

.users-toolbar__add-button :deep(.q-btn__content) {
  padding: 0;
}

.users-toolbar__add-button-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.users-toolbar__add-button-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  border-radius: 999px;
  color: #ffffff;
  background: #2647ff;
  border: 0;
  box-shadow: none;
  transition:
    background-color 140ms ease,
    color 140ms ease,
    border-color 140ms ease;
}

.users-toolbar__add-button-plus :deep(.q-icon) {
  font-size: 12px;
}

.users-toolbar__add-button-label {
  color: inherit;
  font-family: var(--font-title);
  font-size: 0.95rem;
  font-weight: var(--font-weight-black);
  line-height: 0.92;
  letter-spacing: 0.01em;
}

.users-toolbar__add-button:active .users-toolbar__add-button-plus,
.users-toolbar__add-button.q-btn--active .users-toolbar__add-button-plus,
.users-toolbar__add-button.q-btn--standard.q-btn--active .users-toolbar__add-button-plus {
  color: #ffffff;
  background: #2647ff;
}

.users-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.users-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.users-toolbar__search {
  width: min(100%, 300px);
  min-width: min(100%, 300px);
  flex: 0 0 min(100%, 300px);
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.users-toolbar__search :deep(.q-field__control),
.users-toolbar__search :deep(.q-field__native),
.users-toolbar__search :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.users-toolbar__search :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.users-empty-state {
  min-height: 120px;
  display: flex;
  align-items: center;
}

.users-table {
  border: 1px solid var(--ds-table-border);
  border-radius: var(--ds-control-radius);
  overflow: hidden;
}

.users-table :deep(thead tr) {
  background: var(--ds-table-header-bg);
}

.users-table :deep(th) {
  color: var(--ds-table-header-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
}

.users-table :deep(td) {
  color: var(--ds-table-cell-text);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-light);
}

.users-cards-grid {
  align-items: stretch;
}

.user-card__hero {
  padding: 0 0 4px;
}

.user-card__control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  background: transparent;
}

.user-card__control-row :deep(.q-checkbox__inner),
.user-card__control-row :deep(.q-btn__content) {
  filter: drop-shadow(0 6px 12px rgba(17, 17, 17, 0.08));
}

.user-card::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--user-card-blob-x) var(--user-card-blob-y),
    var(--user-card-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--user-card-blob-soft, rgba(38, 71, 255, 0.1)) calc(var(--user-card-blob-size) * 0.46),
    var(--user-card-blob-fade, rgba(38, 71, 255, 0.05)) calc(var(--user-card-blob-size) * 0.7),
    transparent var(--user-card-blob-size)
  );
  opacity: var(--user-card-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.user-card > * {
  position: relative;
  z-index: 1;
}

.user-card:hover {
  transform: translateY(-2px);
  box-shadow: none;
}

.user-card__hero-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 224px;
  height: 248px;
}

.user-card__portrait {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
  border-right: 0;
}

.user-card__portrait::after {
  display: none;
}

.user-card__portrait-shell {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.user-card__portrait-badge {
  display: flex;
  position: relative;
  z-index: 1;
  width: clamp(124px, 48%, 152px);
  height: clamp(124px, 48%, 152px);
  align-items: center;
  justify-content: center;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 18px 40px rgba(17, 17, 17, 0.16);
  font-family: var(--font-title);
  font-size: clamp(2.2rem, 4.2vw, 3rem);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.02em;
  overflow: hidden;
}

.user-card__hero-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 16px 18px 14px 14px;
  background: transparent;
  overflow: hidden;
}

.user-card__hero-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
}

.user-card__title {
  min-width: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(1.3rem, 2vw, 1.6rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.user-card__bottom-stack,
.user-card__detail-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-card__detail-stack {
  gap: 4px;
}

.user-card__detail-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.user-card__inline-chip {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 100%;
  min-height: 26px;
  padding: 0 10px;
  color: #111;
  background: transparent;
  border: 0;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
}

.user-card__summary {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 208px;
  max-height: 208px;
  margin: 20px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 18px;
  box-shadow: none;
  backdrop-filter: none;
}

.user-card__summary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.user-card__summary-view-toggle,
.user-card__summary-toggle {
  border-radius: var(--ds-control-radius);
}

.user-card__summary-label {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.02em;
}

.user-card__summary-view-toggle {
  margin-left: auto;
  margin-right: 14px;
}

.user-card__summary-view-toggle :deep(.q-btn-group),
.user-card__summary-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.user-card__summary-view-toggle :deep(.q-btn) {
  min-height: 21px;
  min-width: 21px;
  height: 21px;
  width: 21px;
  padding: 0 2px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: var(--ds-control-radius);
}

.user-card__summary-view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.user-card__summary-view-toggle :deep(.q-icon) {
  font-size: 13px;
}

.user-card__summary-toggle :deep(.q-btn) {
  position: relative;
  min-height: 24px;
  min-width: 24px;
  width: 24px;
  padding: 0 3px;
  border: 1px solid transparent;
  border-radius: var(--ds-control-radius);
  background: transparent;
  font-size: 12px;
}

.user-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:hover::after),
.user-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:focus-visible::after) {
  content: attr(data-tooltip);
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  transform: none;
  padding: 4px 7px;
  color: rgba(17, 17, 17, 0.72);
  background: rgba(239, 239, 239, 0.5);
  border-radius: 5px;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: var(--font-weight-light);
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
  pointer-events: none;
  z-index: 3;
}

.user-card__summary-toggle :deep(.q-btn + .q-btn) {
  margin-left: 4px;
}

.user-card__summary-toggle :deep(.q-icon) {
  font-size: 12px;
}

.user-card__summary-toggle {
  margin-left: 14px;
  margin-right: auto;
}

.user-card__summary-add-relation {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 22px;
  min-height: 22px;
  padding: 0 2px 0 0;
  color: inherit;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.user-card__summary-add-relation :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.user-card__summary-add-relation-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  min-width: 18px;
  min-height: 18px;
  border-radius: 999px;
  color: #ffffff;
  background: #2647ff;
}

.user-card__summary-add-relation-plus :deep(.q-icon) {
  font-size: 11px;
}

.user-card__summary-add-relation-label {
  color: rgba(17, 17, 17, 0.86);
  font-family: var(--font-title);
  font-size: 0.68rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  letter-spacing: 0.01em;
}

.user-card__summary-panel-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 8px;
}

.user-card__summary-panel {
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px 14px 12px;
  border-radius: 16px;
  background: var(--ds-color-surface-base);
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.user-card__summary-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.user-card__summary-body-content,
.user-card__notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-card__notes-list--rows {
  gap: 6px;
}

.user-card__note-pill {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 8px 10px;
  color: #111;
  background: #fff;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 12px;
  line-height: 1.4;
}

.user-card__summary-empty {
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-sm---light);
  font-weight: var(--font-weight-light);
  line-height: 20px;
}

.user-card__icon-action {
  color: #111;
  background: transparent;
  border: 0;
  transform: scale(0.75);
  transform-origin: center;
}

.user-card__control-eye {
  width: 22px;
  height: 22px;
  min-width: 22px;
  min-height: 22px;
  padding: 0;
  color: #111;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.user-card__control-eye :deep(.q-icon) {
  font-size: 14px;
}

.user-card__select-box {
  margin-left: -3.5px;
  transform: scale(0.75);
  transform-origin: center;
}


.user-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 246, 240, 0.98) 100%);
  border-radius: 28px;
  border-color: #e5e5e5;
  box-shadow: none;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.user-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    circle at var(--user-card-blob-x) var(--user-card-blob-y),
    var(--user-card-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--user-card-blob-soft, rgba(38, 71, 255, 0.1)) calc(var(--user-card-blob-size) * 0.46),
    var(--user-card-blob-fade, rgba(38, 71, 255, 0.05)) calc(var(--user-card-blob-size) * 0.7),
    transparent var(--user-card-blob-size)
  );
  opacity: var(--user-card-blob-opacity, 0);
  transition: opacity 180ms ease;
}

.user-card > * {
  position: relative;
  z-index: 1;
}

.user-card__header {
  padding: 18px 20px 14px;
}

.user-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px 22px;
}

.user-card__section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-card__title {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: 1.3rem;
  font-weight: var(--ds-font-weight-black);
  line-height: 1;
}

.user-card__meta {
  margin-top: 6px;
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.user-card__section-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.user-card__block {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
  word-break: break-word;
}

@media (max-width: 900px) {
  .users-page {
    gap: 24px;
    padding-top: 0;
  }

  .users-shell__hero {
    grid-template-columns: 1fr;
  }

  .users-dashboard__stats {
    grid-template-columns: 1fr;
  }

  .users-toolbar {
    grid-template-columns: 1fr;
  }

  .users-toolbar__block {
    width: 100%;
  }

  .users-toolbar__block--search {
    grid-column: auto;
    margin-left: 0;
    justify-content: flex-start;
  }

  .users-surface {
    padding: 18px;
  }
}
</style>
