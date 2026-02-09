<template>
  <section class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Add competitor</h1>
        <p class="page-desc">Salva un competitor per inserirlo nella lista.</p>
      </div>
      <RouterLink class="secondary-btn" :to="{ name: 'competitor' }">
        Torna a Competition
      </RouterLink>
    </div>

    <div class="card">
      <label class="field">
        <span class="label">Nome competitor</span>
        <input
          v-model="newName"
          class="input"
          type="text"
          placeholder="Es. Talentify"
          @keydown.enter.prevent="addCompetitor"
        />
      </label>
      <div class="actions">
        <button class="primary-btn" type="button" @click="addCompetitor">
          Salva
        </button>
        <span v-if="error" class="error">{{ error }}</span>
      </div>
    </div>

    <div class="list-card">
      <h3>Competitor salvati</h3>
      <p v-if="!competitors.length" class="empty">Nessun competitor salvato.</p>
      <ul v-else class="list">
        <li v-for="name in competitors" :key="name" class="list-row">
          <span>{{ name }}</span>
          <button class="remove-btn" type="button" @click="removeCompetitor(name)">×</button>
        </li>
      </ul>
      <div class="list-actions">
        <button
          class="primary-btn"
          type="button"
          :disabled="benchmarkLoading || !competitors.length"
          @click="loadBenchmarks"
        >
          {{ benchmarkLoading ? 'Analisi in corso...' : 'Mostra benchmark' }}
        </button>
        <span v-if="benchmarkError" class="error">{{ benchmarkError }}</span>
      </div>
    </div>

    <div v-if="benchmarks.length" class="results-card">
      <h3>Benchmark competitor</h3>
      <div class="results-grid">
        <div v-for="entry in groupedBenchmarks" :key="entry.name" class="result-card">
          <div class="result-title">{{ entry.name }}</div>
          <div v-if="!entry.items.length" class="empty">Nessun benchmark trovato.</div>
          <div v-else class="result-list">
            <div v-for="item in entry.items" :key="item.link" class="result-row">
              <div class="result-main">
                <a :href="item.link" target="_blank" rel="noreferrer" class="result-link">
                  {{ item.title || 'Apri annuncio' }}
                </a>
                <div class="result-meta">
                  {{ formatCurrency(item.ral_min) }} - {{ formatCurrency(item.ral_max) }}
                </div>
              </div>
              <span class="result-tag">RAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { formatCurrency } from '../data/employees'

const storageKey = 'competitors:list'
const newName = ref('')
const error = ref('')
const stored = ref(loadCompetitors())
const benchmarkLoading = ref(false)
const benchmarkError = ref('')
const benchmarks = ref([])

function loadCompetitors() {
  try {
    const raw = localStorage.getItem(storageKey)
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((name) => typeof name === 'string' && name.trim())
  } catch {
    return []
  }
}

function saveCompetitors(list) {
  localStorage.setItem(storageKey, JSON.stringify(list))
}

const competitors = computed(() => stored.value)

const groupedBenchmarks = computed(() =>
  competitors.value.map((name) => ({
    name,
    items: benchmarks.value.filter(
      (item) => item.competitor?.toLowerCase() === name.toLowerCase()
    )
  }))
)

const addCompetitor = () => {
  error.value = ''
  const value = newName.value.trim()
  if (!value) {
    error.value = 'Inserisci un nome valido.'
    return
  }
  const exists = stored.value.some((name) => name.toLowerCase() === value.toLowerCase())
  if (exists) {
    error.value = 'Competitor già presente.'
    return
  }
  stored.value = [...stored.value, value]
  saveCompetitors(stored.value)
  newName.value = ''
}

const removeCompetitor = (name) => {
  stored.value = stored.value.filter((item) => item.toLowerCase() !== name.toLowerCase())
  saveCompetitors(stored.value)
  benchmarks.value = benchmarks.value.filter(
    (item) => item.competitor?.toLowerCase() !== name.toLowerCase()
  )
}

const loadBenchmarks = async () => {
  benchmarkError.value = ''
  benchmarks.value = []
  benchmarkLoading.value = true
  try {
    const response = await fetch('/api/competitor-benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitors: competitors.value, location: 'Milano' })
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.error || 'Errore durante il recupero dei benchmark')
    }
    benchmarks.value = Array.isArray(data.items) ? data.items : []
    if (!benchmarks.value.length) {
      benchmarkError.value = 'Nessun benchmark trovato per i competitor.'
    }
  } catch (err) {
    benchmarkError.value = err?.message || 'Errore durante il recupero dei benchmark'
  } finally {
    benchmarkLoading.value = false
  }
}
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
.page-title {
  margin: 0;
  color: var(--bs-dark);
}
.page-desc {
  margin: 4px 0 0;
  color: var(--bs-gray-700);
}
.card,
.list-card,
.results-card {
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 16px;
}
.field {
  display: grid;
  gap: 6px;
}
.label {
  font-weight: 600;
  color: var(--bs-dark);
}
.input {
  border: 1px solid var(--bs-gray-200);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 0.95rem;
}
.actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.primary-btn {
  border: none;
  background: var(--bs-primary);
  color: #fff;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
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
.error {
  color: #b91c1c;
  font-weight: 600;
  font-size: 0.9rem;
}
.list {
  margin: 10px 0 0;
  padding-left: 20px;
  color: var(--bs-dark);
}
.list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.remove-btn {
  border: none;
  background: transparent;
  color: #b91c1c;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
}
.list-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.empty {
  color: var(--bs-gray-700);
  margin: 6px 0 0;
}
.results-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 12px;
}
.result-card {
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 12px;
  background: var(--bs-gray-100);
  display: grid;
  gap: 10px;
}
.result-title {
  font-weight: 700;
  color: var(--bs-dark);
}
.result-list {
  display: grid;
  gap: 8px;
}
.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--bs-gray-200);
  background: var(--bs-white);
}
.result-main {
  display: grid;
  gap: 4px;
}
.result-link {
  color: var(--bs-primary);
  text-decoration: none;
  font-weight: 600;
}
.result-link:hover {
  text-decoration: underline;
}
.result-meta {
  font-size: 0.85rem;
  color: var(--bs-gray-700);
}
.result-tag {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0f172a;
  background: #e2e8f0;
  border-radius: 999px;
  padding: 4px 8px;
}
</style>
