<template>
  <q-page class="users-page">
    <section class="users-hero">
      <div class="users-hero__copy">
        <div class="users-hero__eyebrow">Main</div>
        <h2 class="users-hero__title">Users track your internal team and node permissions.</h2>
        <p class="users-hero__text">
          These are the internal people on your side of the workspace, separate from external
          contacts.
        </p>
      </div>

      <div class="users-hero__stats">
        <div class="users-hero__stat">
          <div class="users-hero__stat-label">Users</div>
          <div class="users-hero__stat-value">{{ rows.length }}</div>
        </div>
        <div class="users-hero__stat">
          <div class="users-hero__stat-label">Golden User</div>
          <div class="users-hero__stat-value">{{ goldenUserLabel }}</div>
        </div>
      </div>
    </section>

    <section class="users-surface">
      <q-banner v-if="!hasBridge" class="bg-orange-1 text-orange-10">
        Users requires Electron. Run <code>quasar dev -m electron</code> or open the Electron build.
      </q-banner>

      <q-table
        v-else
        flat
        :rows="rows"
        :columns="columns"
        row-key="id"
        :loading="loading"
        hide-pagination
        class="users-table"
      >
        <template #body-cell-created_at="slotProps">
          <q-td :props="slotProps">{{ formatDate(slotProps.value) }}</q-td>
        </template>
        <template #body-cell-updated_at="slotProps">
          <q-td :props="slotProps">{{ formatDate(slotProps.value) }}</q-td>
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const rows = ref([])
const loading = ref(false)
const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.users?.list)

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

function formatDate(value) {
  const text = String(value || '').trim()
  if (!text) return '—'
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
  padding: 24px;
}

.users-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(260px, 0.9fr);
  gap: 18px;
  margin-bottom: 20px;
  padding: 22px 24px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(255, 85, 33, 0.16), transparent 34%),
    linear-gradient(140deg, rgba(255, 248, 241, 0.98), rgba(255, 255, 255, 0.96));
}

.users-hero__eyebrow,
.users-hero__stat-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8c6239;
}

.users-hero__title {
  margin: 8px 0 10px;
  font-size: clamp(2rem, 4vw, 2.8rem);
  line-height: 0.98;
}

.users-hero__text {
  margin: 0;
  max-width: 58ch;
  color: #5b4636;
}

.users-hero__stats {
  display: grid;
  gap: 12px;
}

.users-hero__stat {
  padding: 16px 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(140, 98, 57, 0.12);
}

.users-hero__stat-value {
  margin-top: 6px;
  font-size: 1.4rem;
  font-weight: 800;
  color: #24160f;
}

.users-surface {
  padding: 10px 0 0;
}

.users-table {
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
}

.users-table :deep(thead tr) {
  background: rgba(255, 248, 241, 0.96);
}

.users-table :deep(th) {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@media (max-width: 900px) {
  .users-page {
    padding: 18px;
  }

  .users-hero {
    grid-template-columns: 1fr;
  }
}
</style>
