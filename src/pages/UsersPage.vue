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
          <div class="users-toolbar__block users-toolbar__block--view">
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

          <div class="users-toolbar__block users-toolbar__block--kind">
            <q-btn-toggle
              v-model="userKindFilter"
              dense
              no-caps
              unelevated
              toggle-color="dark"
              color="white"
              text-color="grey-8"
              class="users-toolbar__toggle users-toolbar__kind-toggle"
              :disable="loading"
              :options="userKindOptions"
            />
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
            :rows="displayRows"
            :columns="columns"
            row-key="id"
            :loading="loading"
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
              <q-card flat bordered class="user-card full-height">
                <q-card-section class="user-card__header">
                  <div class="row items-start justify-between q-col-gutter-sm no-wrap">
                    <div class="col">
                      <div class="user-card__title">
                        {{ user.User_Name || 'Unnamed user' }}
                      </div>
                      <div class="user-card__meta">
                        {{ user.User_PEmail || 'No email yet' }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-chip
                        dense
                        square
                        :color="isGoldenUser(user) ? 'blue-1' : 'grey-2'"
                        :text-color="isGoldenUser(user) ? 'blue-10' : 'grey-8'"
                      >
                        {{ isGoldenUser(user) ? 'Owner' : 'Team member' }}
                      </q-chip>
                    </div>
                  </div>
                </q-card-section>

                <q-separator />

                <q-card-section class="user-card__body">
                  <div class="user-card__section">
                    <div class="user-card__section-label">User ID</div>
                    <div class="user-card__block">{{ user.id || '--' }}</div>
                  </div>

                  <div class="user-card__section">
                    <div class="user-card__section-label">Profile status</div>
                    <div class="user-card__block">
                      {{ hasUserCoreDetails(user) ? 'Ready' : 'Needs core setup' }}
                    </div>
                  </div>

                  <div class="user-card__section">
                    <div class="user-card__section-label">Updated</div>
                    <div class="user-card__block">{{ formatDate(user.updated_at) }}</div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const rows = ref([])
const loading = ref(false)
const viewMode = ref('card')
const userKindFilter = ref('all')
const searchQuery = ref('')
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.users?.list)

const viewOptions = [
  { value: 'card', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]

const userKindOptions = [
  { label: 'All', value: 'all' },
  { label: 'Team', value: 'golden' },
  { label: 'Guests', value: 'needs-setup' },
]

const columns = [
  { name: 'User_Name', label: 'Name', field: 'User_Name', align: 'left', sortable: true },
  { name: 'User_PEmail', label: 'Email', field: 'User_PEmail', align: 'left', sortable: true },
  { name: 'id', label: 'User ID', field: 'id', align: 'left', sortable: true },
  { name: 'created_at', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'updated_at', label: 'Updated', field: 'updated_at', align: 'left', sortable: true },
]

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

onMounted(loadUsers)
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
  gap: 24px;
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
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.users-toolbar {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1.15fr) minmax(260px, 0.7fr);
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

.users-toolbar__block--search {
  grid-column: -2 / -1;
  justify-content: flex-end;
  margin-left: auto;
}

.users-toolbar__filters-icon {
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.users-toolbar__toggle {
  flex: 0 0 auto;
  height: var(--ds-control-height-md);
  background: var(--ds-control-surface);
  color: var(--ds-control-text);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-xs);
  overflow: hidden;
}

.users-toolbar__view-toggle :deep(.q-btn) {
  min-width: 48px;
  padding-inline: 12px;
}

.users-toolbar__view-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.users-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 96px;
  padding-inline: 18px;
}

.users-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.users-toolbar__search {
  width: 100%;
  min-width: 0;
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

.user-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow: hidden;
  border-radius: 24px;
  border-color: rgba(148, 163, 184, 0.22);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96)),
    #fff;
  box-shadow:
    0 18px 40px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.user-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 14% 16%, rgba(38, 71, 255, 0.08), transparent 34%),
    radial-gradient(circle at 88% 0%, rgba(235, 255, 90, 0.1), transparent 28%);
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
