import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import TodayPage from './TodayPage.vue'
import ProfilePageRoute from './ProfilePageRoute.vue'
import ProgressPage from './ProgressPage.vue'
import RootApp from './RootApp.vue'
import AlertPage from './AlertPage.vue'
import StressReasonsPage from './StressReasonsPage.vue'
import SessionsPage from './SessionsPage.vue'
import RituelsPage from './RituelsPage.vue'
import ResetPasswordPage from './ResetPasswordPage.vue'
import DayDetailsPage from './DayDetailsPage.vue'
import CalendarPage from './CalendarPage.vue'
import ResourcesPage from './ResourcesPage.vue'
import BreathPlayerPage from './BreathPlayerPage.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: RootApp,
    redirect: { name: 'today' },
    children: [
      {
        path: 'today',
        name: 'today',
        component: TodayPage,
      },
      {
        path: 'reset-password',
        name: 'reset-password',
        component: ResetPasswordPage,
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
      {
        path: 'respiration/:id',
        name: 'breath',
        component: BreathPlayerPage,
      },
      {
        path: 'ressources',
        name: 'ressources',
        component: ResourcesPage,
      },
      {
        path: 'calendrier',
        name: 'calendrier',
        component: CalendarPage,
      },
      {
        path: 'jour/:iso',
        name: 'jour',
        component: DayDetailsPage,
      },
    ],
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
