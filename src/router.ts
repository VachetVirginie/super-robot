import { createRouter, createWebHistory } from 'vue-router'
import TodayPage from './TodayPage.vue'
import ProfilePageRoute from './ProfilePageRoute.vue'
import RootApp from './RootApp.vue'

const routes = [
  {
    path: '/',
    redirect: '/today',
  },
  {
    path: '/today',
    name: 'today',
    component: TodayPage,
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePageRoute,
  },
  {
    path: '/progress',
    name: 'progress',
    component: RootApp,
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
