<template>
  <div class="row items-center q-gutter-sm">
    <q-btn dense outline icon="download" label="Export CSV" class="small-text" @click="exportCsv" />

    <q-btn
      dense
      outline
      icon="upload"
      label="Import CSV"
      :disable="!canImport"
      @click="pickFile"
      class="small-text"
    />

    <input
      ref="fileInput"
      type="file"
      accept=".csv,text/csv"
      style="display: none"
      @change="onFileSelected"
    />
  </div>
</template>

<style scoped>
.small-text {
  font-size: 12px;
}
</style>

<script setup>
import { computed, ref } from 'vue'
import { exportFile, useQuasar } from 'quasar'
import { csvToRows, rowsToCsv } from 'src/utils/csv'

const props = defineProps({
  filenameBase: { type: String, required: true },
  headers: { type: Array, required: true },
  rows: { type: Array, required: true },
  onImportRows: { type: Function, default: null },
})

const $q = useQuasar()
const fileInput = ref(null)

const canImport = computed(() => typeof props.onImportRows === 'function')

function exportCsv() {
  const csv = rowsToCsv(props.headers, props.rows)
  const filename = `${props.filenameBase}.csv`
  const ok = exportFile(filename, csv, 'text/csv')
  if (ok !== true) $q.notify({ type: 'negative', message: 'Browser denied file download.' })
}

function pickFile() {
  fileInput.value?.click?.()
}

async function onFileSelected(e) {
  if (!canImport.value) return
  const file = e?.target?.files?.[0]
  if (!file) return

  try {
    const text = await file.text()
    const parsed = csvToRows(text)
    const result = await props.onImportRows(parsed.rows)
    $q.notify({
      type: 'positive',
      message: `Imported CSV (${result?.inserted ?? 0} inserted, ${result?.updated ?? 0} updated, ${result?.skipped ?? 0} skipped).`,
    })
  } catch (err) {
    $q.notify({ type: 'negative', message: err?.message || String(err) })
  } finally {
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>
