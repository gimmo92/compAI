<template>
  <section class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Crea nuovo ruolo</h1>
        <p class="page-desc">Inserisci i dettagli e ottieni un benchmark retributivo.</p>
      </div>
      <span class="chip">Nuovo ruolo</span>
    </div>

    <div class="card">
      <div class="form-grid">
        <label class="field">
          <span>Nome ruolo</span>
          <input v-model="roleName" type="text" placeholder="Es. Senior Frontend Developer" />
        </label>
        <label class="field">
          <span>Città</span>
          <input v-model="city" type="text" placeholder="Es. Milano" />
        </label>
        <label class="field">
          <span>Seniority (anni)</span>
          <input v-model.number="seniority" type="number" min="0" max="40" placeholder="Es. 6" />
        </label>
      </div>

      <div class="actions">
        <button class="primary-btn" type="button" :disabled="loading" @click="confirmRole">
          {{ loading ? 'Elaborazione...' : 'Conferma' }}
        </button>
        <div v-if="error" class="error-text">{{ error }}</div>
      </div>
    </div>

    <div v-if="result" class="result-card">
      <div class="result-header">
        <h2>Dati retributivi</h2>
        <span class="result-chip">{{ roleName || 'Ruolo' }} · {{ city || 'Città' }}</span>
      </div>
      <div class="result-row">
        <div class="chart-card">
          <VueApexCharts
            type="boxPlot"
            height="260"
            :key="chartKey"
            :options="chartOptions"
            :series="chartSeries"
          />
        </div>
        <div v-if="result.sources?.length" class="result-sources">
          <div class="sources-title">Fonti suggerite</div>
          <a
            v-for="source in result.sources"
            :key="source"
            class="source-link"
            :href="source"
            target="_blank"
            rel="noreferrer"
          >
            {{ source }}
          </a>
        </div>
      </div>
      <div class="result-grid">
        <div class="result-item">
          <span class="label">Min</span>
          <span class="value">{{ formatCurrency(result.min) }}</span>
        </div>
        <div class="result-item">
          <span class="label">Mediano</span>
          <span class="value">{{ formatCurrency(result.med) }}</span>
        </div>
        <div class="result-item">
          <span class="label">Max</span>
          <span class="value">{{ formatCurrency(result.max) }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { parseSalaryBenchmark, requestPerplexitySalary } from '../lib/perplexityClient'
import VueApexCharts from 'vue3-apexcharts'

const roleName = ref('')
const city = ref('Milano')
const seniority = ref(5)
const loading = ref(false)
const error = ref('')
const result = ref(null)

const chartKey = computed(() => {
  if (!result.value) return 'empty'
  return `${result.value.min}-${result.value.med}-${result.value.max}`
})

const q1Value = computed(() => {
  if (!result.value) return 0
  return Math.round(result.value.min + (result.value.max - result.value.min) * 0.25)
})

const q3Value = computed(() => {
  if (!result.value) return 0
  return Math.round(result.value.min + (result.value.max - result.value.min) * 0.75)
})

const chartSeries = computed(() => {
  if (!result.value) return []
  const label = roleName.value || 'Ruolo'
  return [
    {
      name: 'Benchmark',
      type: 'boxPlot',
      data: [
        {
          x: label,
          y: [
            result.value.min,
            q1Value.value,
            result.value.med,
            q3Value.value,
            result.value.max
          ]
        }
      ]
    }
  ]
})

const chartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    foreColor: '#67748e'
  },
  plotOptions: {
    bar: { columnWidth: '10%' },
    boxPlot: {
      colors: {
        upper: '#0A6CD2',
        lower: '#0A6CD2'
      },
      columnWidth: '10%'
    }
  },
  dataLabels: { enabled: false },
  xaxis: {
    labels: { style: { fontSize: '12px' } }
  },
  yaxis: {
    labels: {
      formatter: (value) => formatCurrency(value)
    }
  },
  tooltip: {
    y: {
      formatter: (value) => formatCurrency(value)
    }
  },
  legend: { show: false }
}))

const formatCurrency = (value) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value)
}

const cacheKeyFor = (name, location, years) => {
  return `role-benchmark:${name.toLowerCase()}:${location.toLowerCase()}:${years}`
}

const loadCachedResult = (key) => {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Number.isFinite(parsed.min) || !Number.isFinite(parsed.max)) return null
    return parsed
  } catch {
    return null
  }
}

const saveCachedResult = (key, payload) => {
  try {
    localStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // ignore storage failures
  }
}

const confirmRole = async () => {
  error.value = ''
  result.value = null
  const name = roleName.value.trim()
  if (!name || !city.value.trim()) {
    error.value = 'Compila nome ruolo e città.'
    return
  }
  loading.value = true
  try {
    const response = await requestPerplexitySalary({
      role: `${name} (${seniority.value} anni)`,
      location: city.value
    })
    const parsed = parseSalaryBenchmark(response.text, {
      citations: response.citations,
      requireSources: true
    })
    result.value = parsed
    const key = cacheKeyFor(name, city.value.trim(), seniority.value)
    saveCachedResult(key, parsed)
  } catch (err) {
    const message = err?.message || 'Errore sconosciuto'
    const key = cacheKeyFor(name, city.value.trim(), seniority.value)
    const cached = loadCachedResult(key)
    if (cached) {
      result.value = cached
      error.value = `Dati live non disponibili: ${message}. Mostrati gli ultimi dati verificati.`
    } else {
      error.value = `Impossibile ottenere dati verificabili da Serper: ${message}.`
      result.value = null
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.page-title { margin: 0; color: var(--bs-dark); }
.page-desc { margin: 4px 0 0; color: var(--bs-gray-700); }
.chip {
  background: var(--bs-gray-100);
  color: var(--bs-gray-700);
  border: 1px solid var(--bs-gray-200);
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
}
.card {
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 16px;
}
.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.field {
  display: grid;
  gap: 6px;
  font-weight: 600;
  color: var(--bs-dark);
}
.field input {
  border: 1px solid var(--bs-gray-200);
  border-radius: 8px;
  padding: 8px 10px;
  font-weight: 500;
}
.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.primary-btn {
  background: var(--bs-primary);
  color: white;
  border: none;
  padding: 10px 14px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.error-text {
  color: #D62755;
  font-weight: 600;
}
.result-card {
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 12px;
}
.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.result-header h2 {
  margin: 0;
  font-size: 1rem;
  color: var(--bs-dark);
}
.result-chip {
  background: #e3f2fd;
  color: var(--bs-primary);
  border-radius: 999px;
  padding: 6px 12px;
  font-weight: 600;
  font-size: 0.85rem;
}
.result-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.result-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}
.result-row > * {
  min-width: 0;
}
.chart-card {
  background: var(--bs-gray-100);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 12px;
}
.result-item {
  background: var(--bs-gray-100);
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  padding: 12px;
  display: grid;
  gap: 6px;
}
.label {
  color: var(--bs-gray-700);
  font-size: 0.85rem;
}
.value {
  font-weight: 700;
  color: var(--bs-dark);
}
.result-sources {
  display: grid;
  gap: 6px;
  background: var(--bs-gray-100);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 12px;
}
.sources-title {
  font-weight: 600;
  color: var(--bs-dark);
}
.source-link {
  color: var(--bs-primary);
  text-decoration: none;
  font-size: 0.9rem;
  word-break: break-word;
}
.source-link:hover {
  text-decoration: underline;
}
</style>
