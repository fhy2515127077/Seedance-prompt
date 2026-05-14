import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import LandingPage from './pages/LandingPage.vue'
import StudioPage from './pages/StudioPage.vue'
import DiscoverPage from './pages/DiscoverPage.vue'
import HistoryPage from './pages/HistoryPage.vue'
import AdminPage from './pages/AdminPage.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'landing', component: LandingPage },
    { path: '/studio', name: 'studio', component: StudioPage, props: { mode: 'prompt' } },
    { path: '/image', name: 'image', component: StudioPage, props: { mode: 'image' } },
    { path: '/discover', name: 'discover', component: DiscoverPage },
    { path: '/history', name: 'history', component: HistoryPage },
    { path: '/admin', name: 'admin', component: AdminPage },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

createApp(App).use(router).mount('#app')
