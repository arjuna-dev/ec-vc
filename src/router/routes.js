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
      { path: 'bb-file', name: 'bb-file', component: () => import('pages/FilesPage.vue') },
      { path: 'file-system', name: 'file-system', component: () => import('pages/FilesPage.vue') },
      { path: 'history', name: 'history', component: () => import('pages/FilesPage.vue') },
      { path: 'events', redirect: { name: 'history' } },
      { path: 'projects', name: 'projects', component: () => import('pages/FilesPage.vue') },
      { path: 'opportunities', name: 'opportunities', component: () => import('pages/FilesPage.vue') },
      { path: 'funds', name: 'funds', component: () => import('pages/FilesPage.vue') },
      { path: 'rounds', name: 'rounds', component: () => import('pages/FilesPage.vue') },
      { path: 'artifacts', name: 'artifacts', component: () => import('pages/FilesPage.vue') },
      { path: 'companies', name: 'companies', component: () => import('pages/FilesPage.vue') },
      { path: 'contacts', name: 'contacts', component: () => import('pages/FilesPage.vue') },
      { path: 'users', name: 'users', component: () => import('pages/FilesPage.vue') },
      { path: 'companion', name: 'companion', component: () => import('pages/FilesPage.vue') },
      { path: 'markets', name: 'markets', component: () => import('pages/FilesPage.vue') },
      { path: 'industries', redirect: { name: 'markets' } },
      { path: 'securities', name: 'securities', component: () => import('pages/FilesPage.vue') },
      { path: 'intake', name: 'intake', component: () => import('pages/FilesPage.vue') },
      { path: 'notes', name: 'notes', component: () => import('pages/FilesPage.vue') },
      { path: 'tasks', name: 'tasks', component: () => import('pages/FilesPage.vue') },
      { path: 'test-shell', name: 'test-shell', component: () => import('pages/TestShellPage.vue') },
      { path: 'record-shell', name: 'record-shell', component: () => import('pages/RecordShellPage.vue') },
      { path: 'fork-shell', name: 'fork-shell', component: () => import('pages/ForkShellPage.vue') },
      { path: 'building-blocks', redirect: { name: 'bb-file' } },
      { path: 'draft-window', name: 'draft-window', component: () => import('pages/DraftWindowPage.vue') },
      { path: 'intake-shell', name: 'intake-shell', component: () => import('pages/IntakeShellPage.vue') },
      { path: 'ingestion-shell', redirect: { name: 'intake-shell' } },
      { path: 'user-roles', name: 'user-roles', component: () => import('pages/FilesPage.vue') },
      { path: 'roles', redirect: { name: 'user-roles' } },
      { path: 'companion-roles', name: 'companion-roles', component: () => import('pages/FilesPage.vue') },
      { path: 'records/:tableName/:recordId', name: RECORD_VIEW_ROUTE_NAME, component: () => import('pages/RecordShellPage.vue') },
      { path: 'records/:tableName/:recordId/history/:eventId', name: 'record-history-entry', component: () => import('pages/RecordEventPage.vue') },
      { path: 'records/:tableName/:recordId/events/:eventId', redirect: (to) => ({ name: 'record-history-entry', params: to.params, query: to.query, hash: to.hash }) },
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
