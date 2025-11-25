import { createRouter, createWebHistory } from 'vue-router'
import RootApp from './RootApp.vue'

const routes = [
  {
    path: '/',
    name: 'today',
    component: RootApp,
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
