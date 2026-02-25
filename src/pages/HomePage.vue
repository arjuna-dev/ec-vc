<template>
  <q-page class="q-pa-md">
    <div class="page-title-section">
      <div class="text-h6">Home</div>
      <div class="text-caption text-grey-7">Overview and shortcuts.</div>
    </div>

    <q-card bordered flat>
      <q-list separator>
        <q-item clickable :to="{ name: 'file-system' }">
          <q-item-section avatar>
            <q-icon name="folder" />
          </q-item-section>
          <q-item-section>
            <q-item-label>File System</q-item-label>
            <q-item-label caption>Open the workspace file browser.</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup>
//
</script>
