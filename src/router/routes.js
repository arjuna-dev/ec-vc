const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'user-settings', name: 'user-settings', component: () => import('pages/UserSettingsPage.vue') },
      { path: 'settings', name: 'settings', component: () => import('pages/SettingsPage.vue') },
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
