const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'user-settings', name: 'user-settings', component: () => import('pages/UserSettingsPage.vue') },
      { path: 'settings', name: 'settings', component: () => import('pages/SettingsPage.vue') },
      { path: 'dealz-world-home', name: 'dealz-world-home', component: () => import('pages/DealzWorldHomePage.vue') },
      { path: 'workspaces', name: 'workspaces', component: () => import('pages/TeamSpacesPage.vue') },
      { path: 'world-pipelines', name: 'world-pipelines', component: () => import('pages/WorldPipelinesPage.vue') },
      { path: 'radars', name: 'radars', component: () => import('pages/DealzRadarPage.vue') },
      { path: 'regions', name: 'regions', component: () => import('pages/RegionsPage.vue') },
      { path: 'asset-classes', name: 'asset-classes', component: () => import('pages/AssetClassesPage.vue') },
      { path: 'industries', name: 'industries', component: () => import('pages/IndustriesPage.vue') },
      { path: 'stages', name: 'stages', component: () => import('pages/StagesPage.vue') },
      { path: 'shared-knowledge', name: 'shared-knowledge', component: () => import('pages/SharedKnowledgePage.vue') },
      { path: 'merch-events', name: 'merch-events', component: () => import('pages/MerchEventsPage.vue') },
      { path: '', name: 'home', component: () => import('pages/HomePage.vue') },
      { path: 'file-system', name: 'file-system', component: () => import('pages/IndexPage.vue') },
      { path: 'pipelines', name: 'pipelines', component: () => import('pages/PipelinesPage.vue') },
      { path: 'projects', name: 'projects', component: () => import('pages/PipelinesPage.vue') },
      { path: 'opportunities', name: 'opportunities', component: () => import('pages/OpportunitiesPage.vue') },
      { path: 'funds', name: 'funds', component: () => import('pages/OpportunitiesPage.vue') },
      { path: 'rounds', name: 'rounds', component: () => import('pages/OpportunitiesPage.vue') },
      { path: 'artifacts', name: 'artifacts', component: () => import('pages/ArtifactsPage.vue') },
      { path: 'companies', name: 'companies', component: () => import('pages/CompaniesPage.vue') },
      { path: 'contacts', name: 'contacts', component: () => import('pages/ContactsPage.vue') },
      { path: 'users', name: 'users', component: () => import('pages/UsersPage.vue') },
      { path: 'notes', name: 'notes', component: () => import('pages/NotesPage.vue') },
      { path: 'tasks', name: 'tasks', component: () => import('pages/TasksPage.vue') },
      { path: 'assistants', name: 'assistants', component: () => import('pages/AssistantsPage.vue') },
      { path: 'databooks/:tableName/:recordId', name: 'databook-view', component: () => import('pages/DatabookPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
