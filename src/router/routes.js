import { RECORD_VIEW_ROUTE_NAME } from 'src/utils/recordViewNavigation'

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'user-settings', name: 'user-settings', component: () => import('pages/UserSettingsPage.vue') },
      { path: 'avatar', name: 'avatar', component: () => import('pages/SettingsPage.vue') },
      { path: 'settings', redirect: { name: 'avatar' } },
      { path: '', name: 'home', component: () => import('pages/HomePage.vue') },
      { path: 'file-system', name: 'file-system', component: () => import('pages/IndexPage.vue') },
      { path: 'pipelines', redirect: { name: 'projects' } },
      { path: 'projects', name: 'projects', component: () => import('pages/ProjectsPage.vue') },
      { path: 'opportunities', name: 'opportunities', component: () => import('pages/OpportunitiesPage.vue') },
      { path: 'funds', name: 'funds', component: () => import('pages/OpportunitiesPage.vue') },
      { path: 'rounds', name: 'rounds', component: () => import('pages/OpportunitiesPage.vue') },
      { path: 'artifacts', name: 'artifacts', component: () => import('pages/ArtifactsPage.vue') },
      { path: 'companies', name: 'companies', component: () => import('pages/CompaniesPage.vue') },
      { path: 'contacts', name: 'contacts', component: () => import('pages/ContactsPage.vue') },
      { path: 'users', name: 'users', component: () => import('pages/UsersPage.vue') },
      { path: 'industries', name: 'industries', component: () => import('pages/TestShellPage.vue') },
      { path: 'securities', name: 'securities', component: () => import('pages/TestShellPage.vue') },
      { path: 'artifacts-processed', name: 'artifacts-processed', component: () => import('pages/TestShellPage.vue') },
      { path: 'notes', name: 'notes', component: () => import('pages/NotesPage.vue') },
      { path: 'tasks', name: 'tasks', component: () => import('pages/TasksPage.vue') },
      { path: 'test-shell', name: 'test-shell', component: () => import('pages/TestShellPage.vue') },
      { path: 'assistants', name: 'assistants', component: () => import('pages/AssistantsPage.vue') },
      { path: 'records/:tableName/:recordId', name: RECORD_VIEW_ROUTE_NAME, component: () => import('pages/RecordPage.vue') },
      {
        path: 'databooks/:tableName/:recordId',
        redirect: (to) => ({
          name: RECORD_VIEW_ROUTE_NAME,
          params: to.params,
          query: to.query,
          hash: to.hash,
        }),
      },
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
