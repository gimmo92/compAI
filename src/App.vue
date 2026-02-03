<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand">
        <span class="brand-dot" />
        <span class="brand-name">Salary Review AI</span>
      </div>
      <TopTabs />
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import TopTabs from './components/TopTabs.vue'
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background-color: var(--bs-gray-100);
  color: var(--bs-body-color);
}
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bs-white);
  border-bottom: 1px solid var(--bs-gray-200);
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
}
.brand-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bs-primary);
  display: inline-block;
}
.brand-name {
  font-weight: 700;
  color: var(--bs-dark);
}
.app-main {
  padding: 20px;
}
</style>

