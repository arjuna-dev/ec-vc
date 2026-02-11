const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'settings', name: 'settings', component: () => import('pages/SettingsPage.vue') },
      { path: '', name: 'files', component: () => import('pages/IndexPage.vue') },
      { path: 'pipelines', name: 'pipelines', component: () => import('pages/PipelinesPage.vue') },
      { path: 'opportunities', name: 'opportunities', component: () => import('pages/OpportunitiesPage.vue') },
      { path: 'artifacts', name: 'artifacts', component: () => import('pages/ArtifactsPage.vue') },
      { path: 'companies', name: 'companies', component: () => import('pages/CompaniesPage.vue') },
      { path: 'contacts', name: 'contacts', component: () => import('pages/ContactsPage.vue') },
      { path: 'databooks/:opportunityId', name: 'databook-view', component: () => import('pages/DatabookPage.vue') },
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
