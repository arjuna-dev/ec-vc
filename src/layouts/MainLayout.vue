<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> EC VC </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> Menu </q-item-label>

        <q-item clickable to="/" exact>
          <q-item-section avatar>
            <q-icon name="folder" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Files</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/pipelines">
          <q-item-section avatar>
            <q-icon name="schema" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Pipelines</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/opportunities">
          <q-item-section avatar>
            <q-icon name="work" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Opportunities</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/artifacts">
          <q-item-section avatar>
            <q-icon name="attach_file" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Artifacts</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/companies">
          <q-item-section avatar>
            <q-icon name="apartment" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Companies</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable to="/contacts">
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Contacts</q-item-label>
          </q-item-section>
        </q-item>

      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <div class="fixed-bottom-right q-pa-md column q-gutter-sm" style="z-index: 2000">
      <q-btn color="primary" label="Create new opportunity" @click="opportunityDialogOpen = true" />
      <q-btn color="secondary" label="Add new artifact" @click="artifactDialogOpen = true" />
    </div>

    <OpportunityCreateDialog v-model="opportunityDialogOpen" />
    <ArtifactAddDialog v-model="artifactDialogOpen" />
  </q-layout>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

import ArtifactAddDialog from 'components/ArtifactAddDialog.vue'
import OpportunityCreateDialog from 'components/OpportunityCreateDialog.vue'

const leftDrawerOpen = ref(false)
const opportunityDialogOpen = ref(false)
const artifactDialogOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function openOpportunityDialog() {
  opportunityDialogOpen.value = true
}

function openArtifactDialog() {
  artifactDialogOpen.value = true
}

onMounted(() => {
  window.addEventListener('ecvc:open-opportunity-dialog', openOpportunityDialog)
  window.addEventListener('ecvc:open-artifact-dialog', openArtifactDialog)
})

onBeforeUnmount(() => {
  window.removeEventListener('ecvc:open-opportunity-dialog', openOpportunityDialog)
  window.removeEventListener('ecvc:open-artifact-dialog', openArtifactDialog)
})
</script>
