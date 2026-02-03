import { createRouter, createWebHistory } from 'vue-router'

import Overview from '../pages/Overview.vue'
import ReviewCycle from '../pages/ReviewCycle.vue'
import AISuggestions from '../pages/AISuggestions.vue'
import Budget from '../pages/Budget.vue'
import Audit from '../pages/Audit.vue'

const routes = [
  { path: '/', redirect: '/overview' },
  { path: '/overview', name: 'overview', component: Overview },
  { path: '/review-cycle', name: 'review-cycle', component: ReviewCycle },
  { path: '/ai-suggestions', name: 'ai-suggestions', component: AISuggestions },
  { path: '/budget', name: 'budget', component: Budget },
  { path: '/audit', name: 'audit', component: Audit }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

