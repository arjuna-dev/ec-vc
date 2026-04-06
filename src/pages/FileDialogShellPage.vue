<template>
  <q-page class="q-pa-md file-dialog-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Add/Edit File Shell requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue'

const isElectronRuntime = computed(() => typeof window !== 'undefined')
</script>

<style scoped>
.file-dialog-shell-page {
  min-height: 100%;
}
</style>
