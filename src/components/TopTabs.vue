<template>
  <nav class="top-tabs" role="tablist" aria-label="Sezioni modulo">
    <RouterLink
      v-for="t in tabs"
      :key="t.to"
      :to="t.to"
      class="tab-link"
      :class="{ active: $route.path === t.to }"
    >
      <span class="tab-label">{{ t.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'
const route = useRoute()
const tabs = [
  { to: '/overview', label: 'Overview' },
  { to: '/review-cycle', label: 'Cicli di Review' },
  { to: '/ai-suggestions', label: 'Suggerimenti AI' },
  { to: '/budget', label: 'Budget' },
  { to: '/audit', label: 'Audit' }
]
</script>

<style scoped>
.top-tabs {
  display: flex;
  gap: 4px;
  padding: 0 12px;
  border-top: 1px solid var(--bs-gray-200);
}
.tab-link {
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-bottom: 2px solid transparent;
  color: var(--bs-gray-700);
  text-decoration: none;
  border-radius: 6px 6px 0 0;
  transition: color 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}
.tab-link:hover {
  background: var(--bs-gray-100);
  color: var(--bs-dark);
}
.tab-link.active {
  color: var(--bs-primary);
  border-color: var(--bs-gray-200);
  border-bottom-color: var(--bs-primary);
  background: var(--bs-white);
}
.tab-label {
  font-weight: 600;
}
</style>

