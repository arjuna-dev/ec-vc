<template>
  <q-page class="events-page q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Events requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else class="events-page__shell">
      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <section class="events-page__hero">
        <div class="events-page__hero-copy">
          <div class="events-page__hero-eyebrow">L0</div>
          <h1 class="events-page__hero-title">Events</h1>
          <div class="events-page__hero-text">
            Provenance and operational history live here as their own shell source.
          </div>
        </div>
        <div class="events-page__hero-stats">
          <div class="events-page__hero-stat">
            <div class="events-page__hero-stat-label">Rows</div>
            <div class="events-page__hero-stat-value">{{ rows.length }}</div>
          </div>
          <div class="events-page__hero-stat">
            <div class="events-page__hero-stat-label">Section</div>
            <div class="events-page__hero-stat-value">{{ activeSection?.label || 'General' }}</div>
          </div>
        </div>
      </section>

      <section v-if="navItems.length" class="contact-databook__nav" aria-label="Event sections">
        <button
          v-for="section in navItems"
          :key="section.value"
          type="button"
          class="contact-databook__nav-item"
          :class="{
            'contact-databook__nav-item--active': activeSectionKey === section.value,
            'contact-databook__nav-item--kdb': section.isKdb,
            'contact-databook__nav-item--system': section.isSystem,
            'contact-databook__nav-item--push-right': section.pushRight,
          }"
          @click="activeSectionKey = section.value"
        >
          <span class="contact-databook__nav-item-label">{{ section.title }}</span>
          <q-icon v-if="section.isKdb" name="share" size="14px" class="contact-databook__nav-item-icon" />
        </button>
        <q-btn-toggle
          v-model="viewMode"
          dense
          unelevated
          toggle-color="primary"
          color="grey-3"
          text-color="grey-8"
          class="contact-databook__nav-view-toggle"
          :options="viewOptions"
        />
      </section>

      <section class="events-page__panel">
        <div class="events-page__panel-head">
          <div class="events-page__panel-title">{{ activeSection?.label || 'General' }}</div>
          <div class="events-page__panel-meta">{{ activeSectionTokens.length }} fields</div>
        </div>

        <div v-if="!rows.length" class="events-page__empty">
          No events yet.
        </div>

        <div v-else-if="viewMode === 'grid'" class="events-page__grid">
          <article v-for="row in rows" :key="row.id" class="events-page__card">
            <div class="events-page__card-top">
              <div class="events-page__card-title">{{ row.Event_Name || 'Event' }}</div>
              <button type="button" class="events-page__card-open" aria-label="Open event" @click="openEvent(row)">
                <q-icon name="open_in_new" size="13px" />
              </button>
            </div>
            <div class="events-page__card-meta">{{ row.edited_at || 'Recent' }}</div>
            <div class="events-page__card-fields">
              <div v-for="token in activeSectionTokens" :key="`${row.id}:${token.key}`" class="events-page__field">
                <div class="events-page__field-label">{{ token.label }}</div>
                <div v-if="Array.isArray(getTokenRawValue(row, token)) && getTokenRawValue(row, token).length" class="events-page__chip-list">
                  <span v-for="item in getTokenRawValue(row, token)" :key="`${row.id}:${token.key}:${item}`" class="events-page__chip">
                    {{ item }}
                  </span>
                </div>
                <div v-else class="events-page__field-value" :class="{ 'events-page__field-value--empty': !getTokenDisplayValue(row, token) }">
                  {{ getTokenDisplayValue(row, token) || 'No value yet' }}
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="events-page__list">
          <article v-for="row in rows" :key="row.id" class="events-page__list-row">
            <div class="events-page__list-row-head">
              <div class="events-page__card-title">{{ row.Event_Name || 'Event' }}</div>
              <div class="events-page__list-row-actions">
                <div class="events-page__card-meta">{{ row.edited_at || 'Recent' }}</div>
                <button type="button" class="events-page__card-open" aria-label="Open event" @click="openEvent(row)">
                  <q-icon name="open_in_new" size="13px" />
                </button>
              </div>
            </div>
            <div class="events-page__list-row-grid">
              <div v-for="token in activeSectionTokens" :key="`${row.id}:${token.key}`" class="events-page__field">
                <div class="events-page__field-label">{{ token.label }}</div>
                <div v-if="Array.isArray(getTokenRawValue(row, token)) && getTokenRawValue(row, token).length" class="events-page__chip-list">
                  <span v-for="item in getTokenRawValue(row, token)" :key="`${row.id}:${token.key}:${item}`" class="events-page__chip">
                    {{ item }}
                  </span>
                </div>
                <div v-else class="events-page__field-value" :class="{ 'events-page__field-value--empty': !getTokenDisplayValue(row, token) }">
                  {{ getTokenDisplayValue(row, token) || 'No value yet' }}
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCanonicalTokenValue, LEVEL_2_FILE_REGISTRY_BY_KEY, LEVEL_3_FILE_REGISTRY_BY_KEY } from 'src/utils/structureRegistry'

const router = useRouter()
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')

const rows = ref([])
const error = ref('')
const activeSectionKey = ref('')
const viewMode = ref('grid')

const level2Sections = computed(() => LEVEL_2_FILE_REGISTRY_BY_KEY.events || [])
const level3Tokens = computed(() => LEVEL_3_FILE_REGISTRY_BY_KEY.events || [])

const navItems = computed(() =>
  level2Sections.value.map((section) => {
    const normalized = String(section.label || '').trim().toLowerCase()
    const isKdb = normalized === 'kdb'
    const isSystem = normalized === 'system'
    return {
      value: section.key,
      title: section.label,
      isKdb,
      isSystem,
      pushRight: isKdb || isSystem,
    }
  }),
)

const activeSection = computed(
  () => level2Sections.value.find((section) => section.key === activeSectionKey.value) || level2Sections.value[0] || null,
)

const activeSectionTokens = computed(() =>
  level3Tokens.value.filter((token) => token.parentKey === activeSection.value?.key),
)

const viewOptions = Object.freeze([
  { value: 'grid', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
])

watch(
  level2Sections,
  (sections) => {
    if (!sections.some((section) => section.key === activeSectionKey.value)) {
      activeSectionKey.value = sections[0]?.key || ''
    }
  },
  { immediate: true },
)

onMounted(async () => {
  await loadEvents()
})

async function loadEvents() {
  if (!bridge.value?.events?.list) return
  error.value = ''
  try {
    const result = await bridge.value.events.list({ limit: 200 })
    rows.value = Array.isArray(result?.events) ? result.events : []
  } catch (loadError) {
    error.value = String(loadError?.message || loadError || '').trim() || 'Could not load events.'
    rows.value = []
  }
}

function getTokenRawValue(row, token) {
  const rawValue = getCanonicalTokenValue(row || {}, token || {})
  if (Array.isArray(rawValue)) return rawValue
  return rawValue == null ? '' : rawValue
}

function getTokenDisplayValue(row, token) {
  const rawValue = getTokenRawValue(row, token)
  if (Array.isArray(rawValue)) return rawValue.join(', ')
  if (typeof rawValue === 'object') return ''
  return String(rawValue || '').trim()
}

function openEvent(row) {
  const tableName = String(row?.source_table_name || '').trim()
  const recordId = String(row?.source_record_id || '').trim()
  const eventId = String(row?.id || '').trim()
  if (!tableName || !recordId || !eventId) return
  router.push({
    name: 'record-event',
    params: {
      tableName,
      recordId,
      eventId,
    },
  })
}
</script>

<style scoped>
.events-page__shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.events-page__hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 246, 240, 0.98) 100%);
}

.events-page__hero-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.events-page__hero-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6f6f6f;
}

.events-page__hero-title {
  margin: 0;
  font-family: var(--ds-font-family-title);
  font-size: 2rem;
  line-height: 1;
}

.events-page__hero-text {
  max-width: 620px;
  color: #545454;
  font-size: 0.92rem;
}

.events-page__hero-stats {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.events-page__hero-stat {
  min-width: 98px;
  padding: 10px 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
}

.events-page__hero-stat-label {
  color: #6f6f6f;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.events-page__hero-stat-value {
  margin-top: 4px;
  font-size: 1.05rem;
  font-weight: 700;
  color: #111111;
}

.contact-databook__nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
}

.contact-databook__nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #626262;
  cursor: pointer;
}

.contact-databook__nav-item:hover {
  background: rgba(17, 17, 17, 0.05);
  color: #111111;
}

.contact-databook__nav-item--active {
  background: #111111;
  color: #ffffff;
}

.contact-databook__nav-item--kdb,
.contact-databook__nav-item--system {
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.contact-databook__nav-item--push-right {
  margin-left: auto;
}

.contact-databook__nav-item--push-right + .contact-databook__nav-item--push-right {
  margin-left: 0;
}

.contact-databook__nav-item-icon {
  color: #1d5eff;
}

.contact-databook__nav-view-toggle {
  margin-left: 8px;
}

.contact-databook__nav-view-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
}

.contact-databook__nav-view-toggle :deep(.q-btn) {
  min-width: 28px;
  min-height: 28px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 12px;
  box-shadow: none;
}

.contact-databook__nav-view-toggle :deep(.q-icon) {
  font-size: 15px;
}

.events-page__panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.events-page__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.events-page__panel-title {
  font-family: var(--ds-font-family-title);
  font-size: 1.15rem;
  font-weight: 700;
}

.events-page__panel-meta,
.events-page__card-meta {
  color: #6c6c6c;
  font-size: 0.82rem;
}

.events-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.events-page__card,
.events-page__list-row {
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 18px;
  background: #ffffff;
  padding: 14px;
}

.events-page__card-top,
.events-page__list-row-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.events-page__list-row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.events-page__card-title {
  font-weight: 700;
  color: #111111;
  line-height: 1.2;
}

.events-page__card-open {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #111111;
  cursor: pointer;
}

.events-page__card-open:hover {
  background: rgba(17, 17, 17, 0.06);
}

.events-page__card-fields,
.events-page__list-row-grid {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.events-page__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.events-page__field-label {
  color: #6f6f6f;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.events-page__field-value {
  color: #1c1c1c;
  font-size: 0.92rem;
  line-height: 1.3;
}

.events-page__field-value--empty {
  color: #8a8a8a;
}

.events-page__chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.events-page__chip {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.06);
  color: #1c1c1c;
  font-size: 0.82rem;
}

.events-page__empty {
  padding: 18px;
  border: 1px dashed rgba(17, 17, 17, 0.16);
  border-radius: 18px;
  color: #777777;
  background: rgba(255, 255, 255, 0.72);
}

@media (max-width: 780px) {
  .events-page__hero {
    flex-direction: column;
  }

  .events-page__hero-stats {
    width: 100%;
  }

  .contact-databook__nav {
    flex-wrap: wrap;
  }

  .contact-databook__nav-item--push-right {
    margin-left: 0;
  }

  .contact-databook__nav-view-toggle {
    margin-left: auto;
  }
}
</style>
