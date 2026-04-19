import { RECORD_VIEW_ROUTE_NAME } from 'src/utils/recordViewNavigation'
import { resolveApprovedFileSectionKey } from 'src/utils/structureRegistry'

function buildDraftWindowRecordLocation(to = {}) {
  const tableName = String(to?.params?.tableName || to?.query?.entity || '').trim()
  const recordId = String(to?.params?.recordId || to?.query?.recordId || '').trim()
  const section = resolveApprovedFileSectionKey('', tableName)

  return {
    name: 'draft-window',
    query: {
      ...to.query,
      ...(section ? { section } : {}),
      ...(tableName ? { entity: tableName } : {}),
      ...(recordId ? { recordId } : {}),
    },
    hash: to.hash,
  }
}

function buildDraftWindowFileLocation(to = {}) {
  const routeName = String(to?.name || '').trim()
  const section = resolveApprovedFileSectionKey(routeName)

  return {
    name: 'draft-window',
    query: {
      ...to.query,
      ...(section ? { section } : {}),
    },
    hash: to.hash,
  }
}

const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'user-settings', name: 'user-settings', component: () => import('pages/UserSettingsPage.vue') },
      { path: 'avatar', name: 'avatar', component: () => import('pages/SettingsPage.vue') },
      { path: 'settings', redirect: { name: 'avatar' } },
      { path: '', name: 'home', component: () => import('pages/HomePage.vue') },
      { path: 'utils', name: 'utils', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'file-system', name: 'file-system', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'history', name: 'history', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'projects', name: 'projects', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'opportunities', name: 'opportunities', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'funds', name: 'funds', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'rounds', name: 'rounds', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'artifacts', name: 'artifacts', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'companies', name: 'companies', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'contacts', name: 'contacts', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'users', name: 'users', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'companion', name: 'companion', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'markets', name: 'markets', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'securities', name: 'securities', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'intake', name: 'intake', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'notes', name: 'notes', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'tasks', name: 'tasks', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'draft-window', name: 'draft-window', component: () => import('pages/DraftWindowPage.vue') },
      { path: 'intake-shell', name: 'intake-shell', component: () => import('pages/IntakeShellPage.vue') },
      { path: 'user-roles', name: 'user-roles', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'companion-roles', name: 'companion-roles', redirect: (to) => buildDraftWindowFileLocation(to) },
      { path: 'records/:tableName/:recordId', name: RECORD_VIEW_ROUTE_NAME, redirect: (to) => buildDraftWindowRecordLocation(to) },
      { path: 'records/:tableName/:recordId/history/:eventId', name: 'record-history-entry', component: () => import('pages/RecordEventPage.vue') },
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
