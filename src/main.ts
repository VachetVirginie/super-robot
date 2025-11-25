import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'
import './style.css'
import RootApp from './RootApp.vue'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

const app = createApp(RootApp)

app.use(PrimeVue, {
  unstyled: true,
})

app.mount('#app')
