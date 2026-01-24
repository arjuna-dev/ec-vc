<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        File browser requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available). Check that <code>src-electron/electron-preload.js</code> is configured as
        a preload script.
      </q-banner>
    </div>

    <div v-else>
      <div class="row items-center q-col-gutter-sm q-mb-md">
        <div class="col-auto">
          <q-btn
            dense
            flat
            icon="arrow_upward"
            :disable="!canGoUp || loading"
            @click="goUp"
          />
        </div>
        <div class="col">
          <q-input
            v-model="pathInput"
            dense
            outlined
            :disable="loading"
            label="Path"
            @keyup.enter="goToPath"
          />
        </div>
        <div class="col-auto">
          <q-btn dense flat icon="refresh" :loading="loading" @click="refresh" />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <q-card bordered>
        <q-list separator>
          <q-item v-for="entry in entries" :key="entry.path" clickable @click="openEntry(entry)">
            <q-item-section avatar>
              <q-icon :name="entry.type === 'directory' ? 'folder' : 'description'" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ entry.name }}</q-item-label>
              <q-item-label caption>{{ entry.type }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="!loading && entries.length === 0">
            <q-item-section>
              <q-item-label caption>No entries</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(() => !!bridge.value?.fs?.readdir)

const currentPath = ref('')
const pathInput = ref('')
const entries = ref([])
const loading = ref(false)
const error = ref('')

const canGoUp = computed(() => {
  if (!hasBridge.value || !currentPath.value) return false
  const parent = bridge.value.path.dirname(currentPath.value)
  return parent && parent !== currentPath.value
})

async function loadDirectory (dirPath) {
  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.fs.readdir(dirPath)
    currentPath.value = result.path
    pathInput.value = result.path
    entries.value = result.entries || []
  } catch (e) {
    error.value = e?.message || String(e)
    entries.value = []
  } finally {
    loading.value = false
  }
}

function openEntry (entry) {
  if (loading.value) return
  if (entry.type === 'directory') loadDirectory(entry.path)
}

function goUp () {
  if (!canGoUp.value || loading.value) return
  loadDirectory(bridge.value.path.dirname(currentPath.value))
}

function refresh () {
  if (!currentPath.value || loading.value) return
  loadDirectory(currentPath.value)
}

function goToPath () {
  if (!pathInput.value || loading.value) return
  loadDirectory(pathInput.value)
}

onMounted(async () => {
  if (!hasBridge.value) return
  const home = await bridge.value.fs.homedir()
  await loadDirectory(home)
})
</script>
