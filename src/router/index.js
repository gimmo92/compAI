import { createRouter, createWebHistory } from 'vue-router'

import Overview from '../pages/Overview.vue'
import AISuggestions from '../pages/AISuggestions.vue'
import Budget from '../pages/Budget.vue'
import Audit from '../pages/Audit.vue'
import ProfileDetail from '../pages/ProfileDetail.vue'

const routes = [
  { path: '/', redirect: '/ai-suggestions' },
  { path: '/overview', name: 'overview', component: Overview },
  { path: '/ai-suggestions', name: 'ai-suggestions', component: AISuggestions },
  { path: '/profiles/:id', name: 'profile-detail', component: ProfileDetail },
  { path: '/budget', name: 'budget', component: Budget },
  { path: '/audit', name: 'audit', component: Audit }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

