import { createRouter, createWebHistory } from 'vue-router'

import AISuggestions from '../pages/AISuggestions.vue'
import Budget from '../pages/Budget.vue'
import Audit from '../pages/Audit.vue'
import ProfileDetail from '../pages/ProfileDetail.vue'
import CompetitorAnalysis from '../pages/CompetitorAnalysis.vue'
import RoleCreator from '../pages/RoleCreator.vue'
import CompetitorManager from '../pages/CompetitorManager.vue'

const routes = [
  { path: '/', redirect: '/ai-suggestions' },
  { path: '/ai-suggestions', name: 'ai-suggestions', component: AISuggestions },
  { path: '/profiles/:id', name: 'profile-detail', component: ProfileDetail },
  { path: '/budget', name: 'budget', component: Budget },
  { path: '/competitor', name: 'competitor', component: CompetitorAnalysis },
  { path: '/competition/add', name: 'competitor-add', component: CompetitorManager },
  { path: '/new-role', name: 'new-role', component: RoleCreator },
  { path: '/audit', name: 'audit', component: Audit }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

