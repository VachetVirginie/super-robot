import { createRouter, createWebHistory } from 'vue-router'
import RootApp from './RootApp.vue'

const routes = [
  {
    path: '/',
    redirect: '/today',
  },
  {
    path: '/today',
    name: 'today',
    component: RootApp,
  },
  {
    path: '/profile',
    name: 'profile',
    component: RootApp,
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
