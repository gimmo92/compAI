import { createRouter, createWebHistory } from 'vue-router'

import Overview from '../pages/Overview.vue'
import AISuggestions from '../pages/AISuggestions.vue'
import Budget from '../pages/Budget.vue'
import Audit from '../pages/Audit.vue'
import ProfileDetail from '../pages/ProfileDetail.vue'
import CompetitorAnalysis from '../pages/CompetitorAnalysis.vue'
import RoleCreator from '../pages/RoleCreator.vue'
import TopPerformers from '../pages/TopPerformers.vue'

const routes = [
  { path: '/', redirect: '/ai-suggestions' },
  { path: '/overview', name: 'overview', component: Overview },
  { path: '/ai-suggestions', name: 'ai-suggestions', component: AISuggestions },
  { path: '/profiles/:id', name: 'profile-detail', component: ProfileDetail },
  { path: '/budget', name: 'budget', component: Budget },
  { path: '/top-performers', name: 'top-performers', component: TopPerformers },
  { path: '/competitor', name: 'competitor', component: CompetitorAnalysis },
  { path: '/new-role', name: 'new-role', component: RoleCreator },
  { path: '/audit', name: 'audit', component: Audit }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

