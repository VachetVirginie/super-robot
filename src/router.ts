import { createRouter, createWebHistory } from 'vue-router'
import TodayPage from './TodayPage.vue'
import ProfilePageRoute from './ProfilePageRoute.vue'
import ProgressPage from './ProgressPage.vue'
import RootApp from './RootApp.vue'
import AlertPage from './AlertPage.vue'
import StressReasonsPage from './StressReasonsPage.vue'
import SessionsPage from './SessionsPage.vue'
import RituelsPage from './RituelsPage.vue'
import WeekConfigPage from './WeekConfigPage.vue'

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
        path: 'semaine',
        name: 'semaine',
        component: WeekConfigPage,
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfilePageRoute,
      },
      {
        path: 'bilan',
        name: 'bilan',
        component: ProgressPage,
      },
      {
        path: 'seances',
        name: 'seances',
        component: SessionsPage,
      },
      {
        path: 'rituels',
        name: 'rituels',
        component: RituelsPage,
      },
      {
        path: 'stress-reasons',
        name: 'stress',
        component: StressReasonsPage,
      },
      {
        path: 'pause',
        name: 'pause',
        component: AlertPage,
      },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
