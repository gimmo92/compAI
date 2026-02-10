<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="header-top">
        <div class="brand">
          <span class="brand-dot" />
          <span class="brand-name">Compensation Intelligence</span>
        </div>
        <div class="header-actions">
          <button class="secondary-btn new-role-btn" type="button" @click="goToNewRole">
            Nuovo ruolo
          </button>
        </div>
      </div>
      <TopTabs />
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import TopTabs from './components/TopTabs.vue'

const router = useRouter()

const goToNewRole = () => {
  router.push({ name: 'new-role' })
}
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
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
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
.header-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.secondary-btn {
  border: 1px solid var(--bs-gray-200);
  background: var(--bs-white);
  color: var(--bs-dark);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.new-role-btn {
  background: var(--bs-primary);
  border-color: var(--bs-primary);
  color: #fff;
}
.app-main {
  padding: 20px;
}
</style>

