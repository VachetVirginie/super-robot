import { createRouter, createWebHistory } from 'vue-router'
import TodayPage from './TodayPage.vue'
import ProfilePageRoute from './ProfilePageRoute.vue'
import ProgressPage from './ProgressPage.vue'
import AlertPage from './AlertPage.vue'
import RootApp from './RootApp.vue'

const routes = [
  {
    path: '/',
    redirect: '/today',
  },
  {
    path: '/',
    component: RootApp,
    children: [
      {
        path: 'today',
        name: 'today',
        component: TodayPage,
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfilePageRoute,
      },
      {
        path: 'progress',
        name: 'progress',
        component: ProgressPage,
      },
      {
        path: 'alert',
        name: 'alert',
        component: AlertPage,
      },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
