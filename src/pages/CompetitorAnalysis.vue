<template>
  <section class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Competition analysis</h1>
        <p class="page-desc">
          Job post attivi a Milano con retribuzioni sopra i nostri benchmark.
        </p>
      </div>
      <div class="header-actions">
        <RouterLink class="primary-btn" :to="{ name: 'competitor-add' }">
          Add competitor
        </RouterLink>
        <span class="chip">Talent intelligence</span>
      </div>
    </div>

    <div class="overview-grid">
      <div class="overview-card">
        <div>
          <h3 class="card-title">Add competitor</h3>
          <p class="card-desc">
            Inserisci nuovi competitor da monitorare nelle analisi.
          </p>
        </div>
        <RouterLink class="primary-btn" :to="{ name: 'competitor-add' }">
          Add competitor
        </RouterLink>
      </div>

      <div class="overview-card">
        <div>
          <h3 class="card-title">Competitor salvati</h3>
          <p class="card-desc">
            Elenco competitor attivi salvati nel sistema.
          </p>
        </div>
        <div class="saved-list">
          <span v-if="!customCompetitors.length" class="saved-empty">
            Nessun competitor salvato
          </span>
          <span v-for="name in customCompetitors" :key="name" class="saved-chip">
            {{ name }}
          </span>
        </div>
        <RouterLink class="secondary-btn" :to="{ name: 'competitor-add' }">
          Vedi competitor
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const storageKey = 'competitors:list'
const customCompetitors = ref([])

const loadCustomCompetitors = () => {
  try {
    const raw = localStorage.getItem(storageKey)
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((name) => typeof name === 'string' && name.trim())
  } catch {
    return []
  }
}

onMounted(() => {
  customCompetitors.value = loadCustomCompetitors()
})
</script>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
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
  text-decoration: none;
}
.primary-btn {
  border: 1px solid var(--bs-primary);
  background: var(--bs-primary);
  color: var(--bs-white);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
}
.page-title {
  margin: 0;
  color: var(--bs-dark);
}
.page-desc {
  margin: 4px 0 0;
  color: var(--bs-gray-700);
}
.meta {
  color: var(--bs-gray-700);
}
.chip {
  background: var(--bs-gray-100);
  color: var(--bs-gray-700);
  border: 1px solid var(--bs-gray-200);
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
}
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.overview-card {
  display: grid;
  gap: 12px;
  align-content: start;
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 16px;
}
.card-title {
  margin: 0 0 4px;
  font-size: 1rem;
  color: var(--bs-dark);
}
.card-desc {
  margin: 0;
  color: var(--bs-gray-700);
  font-size: 0.9rem;
}
.saved-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.saved-chip {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--bs-gray-100);
  border: 1px solid var(--bs-gray-200);
  color: var(--bs-dark);
  font-weight: 600;
  font-size: 0.85rem;
}
.saved-empty {
  color: var(--bs-gray-600);
  font-size: 0.85rem;
}
</style>
