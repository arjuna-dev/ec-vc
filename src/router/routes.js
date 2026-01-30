const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'files', component: () => import('pages/IndexPage.vue') },
      { path: 'pipelines', name: 'pipelines', component: () => import('pages/PipelinesPage.vue') },
      { path: 'opportunities', name: 'opportunities', component: () => import('pages/OpportunitiesPage.vue') },
      { path: 'artifacts', name: 'artifacts', component: () => import('pages/ArtifactsPage.vue') },
      { path: 'companies', name: 'companies', component: () => import('pages/CompaniesPage.vue') },
      { path: 'contacts', name: 'contacts', component: () => import('pages/ContactsPage.vue') },
      { path: 'funds', name: 'funds', component: () => import('pages/FundsPage.vue') },
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
