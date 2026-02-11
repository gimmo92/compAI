<template>
  <section class="page">
    <div class="header">
      <div>
        <h1 class="page-title">{{ employee?.nome || 'Profilo retributivo' }}</h1>
        <p class="page-desc">
          {{ employee?.nome }} · {{ employee?.ruolo }} · {{ employee?.dipartimento }}
        </p>
      </div>
      <button class="secondary-btn" type="button" @click="goBack">Torna a Profili</button>
    </div>

    <div v-if="!employee" class="empty-state">
      Profilo non trovato.
    </div>

    <div v-else class="profile-section">
      <div class="profile-header">
        <div>
          <h2>Analisi retributiva</h2>
          <p class="meta">Confronto RAL vs benchmark di mercato.</p>
        </div>
        <div class="profile-actions">
          <button class="primary-btn" type="button" @click="openSalaryReview">
            Salary review
          </button>
          <button
            class="secondary-btn"
            type="button"
            :disabled="benchmarkLoading"
            @click="updateBenchmark"
          >
            {{ benchmarkLoading ? 'Aggiornamento...' : 'Aggiorna benchmark retributivi' }}
          </button>
        </div>
      </div>

      <div v-if="benchmarkError" class="insight-error">{{ benchmarkError }}</div>

      <div class="performance-card">
        <div class="performance-title">Dati di performance</div>
        <div class="performance-metrics">
          <div class="metric">
            <span class="label">Competenze</span>
            <span class="value">{{ formatPerformance(employee.performance_competenze) }}</span>
          </div>
          <div class="metric">
            <span class="label">Obiettivi</span>
            <span class="value">{{ formatPerformance(employee.performance_obiettivi) }}</span>
          </div>
          <div class="metric">
            <span class="label">Punteggio aggregato</span>
            <span class="value">{{ formatPerformance(employee.performance_score) }}</span>
          </div>
        </div>
      </div>

      <div class="profile-grid">
        <div class="boxplot-card">
          <VueApexCharts
            v-if="employee && activeBenchmark"
            type="boxPlot"
            height="260"
            :key="chartKey"
            :options="chartOptions"
            :series="chartSeries"
          />
        </div>

        <div class="sources">
          <div class="sources-title">Fonti benchmark</div>
          <div v-for="source in sourceDetails" :key="source.url" class="source-row">
            <div class="source-icon">{{ source.icon }}</div>
            <div class="source-body">
              <a :href="source.url" target="_blank" rel="noreferrer">
                {{ source.title || source.label }}
              </a>
              <div class="source-range">
                Range: {{ formatCurrency(source.min) }} - {{ formatCurrency(source.max) }}
                <span v-if="source.converted" class="source-note">
                  (mensile → annuo x{{ source.multiplier || 13 }})
                </span>
              </div>
            </div>
            <div class="source-actions">
              <div :class="['trend', source.trend]">
                <span class="trend-arrow">{{ source.trend === 'up' ? '^' : 'v' }}</span>
              </div>
              <button class="remove-source" type="button" @click="removeSource(source.url)">x</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showSalaryReview" class="sheet-backdrop" @click.self="closeSalaryReview">
        <aside class="sheet">
          <header class="sheet-header">
            <div>
              <div class="sheet-title">Salary review</div>
              <div class="sheet-subtitle">
                {{ employee.nome }} · {{ employee.ruolo }}
              </div>
            </div>
            <button class="ghost-btn" type="button" @click="closeSalaryReview">Chiudi</button>
          </header>

          <section class="sheet-section">
            <div class="current-values">
              <div class="current-item">
                <span class="label">RAL corrente</span>
                <span class="value">{{ formatCurrency(employee.ral_attuale) }}</span>
              </div>
              <div class="current-item">
                <span class="label">Importo variabile corrente</span>
                <span class="value">{{ formatCurrency(employee.variabile_attuale) }}</span>
              </div>
            </div>
          </section>

          <section class="sheet-section">
            <div class="input-grid">
              <label class="input-field">
                <span class="label">Nuova RAL</span>
                <div class="input-row">
                  <input
                    v-model.number="newRal"
                    type="number"
                    min="0"
                    class="input"
                    placeholder="Es. 52000"
                  />
                  <span class="delta">{{ formatDelta(newRal, employee.ral_attuale) }}</span>
                </div>
              </label>
              <label class="input-field">
                <span class="label">Nuovo importo variabile</span>
                <div class="input-row">
                  <input
                    v-model.number="newVariable"
                    type="number"
                    min="0"
                    class="input"
                    placeholder="Es. 6000"
                  />
                  <span class="delta">
                    {{ formatDelta(newVariable, employee.variabile_attuale) }}
                  </span>
                </div>
              </label>
            </div>
          </section>

          <div class="sheet-actions">
            <button class="primary-btn" type="button">Richiedi approvazione</button>
          </div>
        </aside>
      </div>

    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { employees, formatCurrency } from '../data/employees'
import { parseSalaryBenchmark, requestPerplexitySalary } from '../lib/perplexityClient'
import VueApexCharts from 'vue3-apexcharts'

const route = useRoute()
const router = useRouter()

const benchmarkLoading = ref(false)
const benchmarkError = ref('')
const benchmarkData = ref(null)
const hiddenSources = ref(new Set())
const showSalaryReview = ref(false)
const newRal = ref(null)
const newVariable = ref(null)

const employee = computed(() => {
  const id = route.params.id
  return employees.find((item) => item.id === id)
})

const activeBenchmark = computed(() => {
  if (!employee.value) return null
  if (benchmarkData.value?.id === employee.value.id) return benchmarkData.value
  return { ...employee.value.benchmark, sources: [employee.value.source_link] }
})

const chartBenchmark = computed(() => {
  if (!employee.value || !activeBenchmark.value) return null
  const filtered = activeSources.value.filter((source) => {
    const url = normalizeUrl(source.url)
    return url && !hiddenSources.value.has(url)
  })
  const numericSources = filtered.filter(
    (source) => Number.isFinite(source.min) && Number.isFinite(source.max)
  )
  if (!numericSources.length) return activeBenchmark.value
  const min = Math.min(...numericSources.map((source) => source.min))
  const max = Math.max(...numericSources.map((source) => source.max))
  const med = Math.round(
    numericSources.reduce((sum, source) => sum + (source.min + source.max) / 2, 0) /
      numericSources.length
  )
  return { ...activeBenchmark.value, min, med, max }
})

const scaleMin = computed(() => {
  if (!employee.value || !chartBenchmark.value) return 0
  return Math.min(chartBenchmark.value.min, employee.value.ral_attuale)
})
const scaleMax = computed(() => {
  if (!employee.value || !chartBenchmark.value) return 1
  return Math.max(chartBenchmark.value.max, employee.value.ral_attuale)
})
const scaleMed = computed(() => Math.round((scaleMin.value + scaleMax.value) / 2))
const q1Value = computed(() => Math.round(scaleMin.value + (scaleMax.value - scaleMin.value) * 0.25))
const q3Value = computed(() => Math.round(scaleMin.value + (scaleMax.value - scaleMin.value) * 0.75))

const chartSeries = computed(() => {
  if (!employee.value || !chartBenchmark.value) return []
  return [
    {
      name: 'Benchmark',
      type: 'boxPlot',
      data: [
        {
          x: employee.value.ruolo,
          y: [
            chartBenchmark.value.min,
            q1Value.value,
            chartBenchmark.value.med,
            q3Value.value,
            chartBenchmark.value.max
          ]
        }
      ]
    },
    {
      name: 'RAL',
      type: 'scatter',
      data: [{ x: employee.value.ruolo, y: employee.value.ral_attuale }]
    }
  ]
})

const chartOptions = computed(() => ({
  chart: {
    toolbar: { show: false },
    foreColor: '#67748e'
  },
  annotations: {
    yaxis: employee.value
      ? [
          {
            y: employee.value.ral_attuale,
            borderColor: '#D62755',
            strokeDashArray: 4,
            label: {
              text: `RAL ${formatCurrency(employee.value.ral_attuale)}`,
              style: {
                color: '#fff',
                background: '#D62755'
              }
            }
          }
        ]
      : []
  },
  plotOptions: {
    bar: {
      columnWidth: '10%'
    },
    boxPlot: {
      colors: {
        upper: '#0A6CD2',
        lower: '#0A6CD2'
      },
      columnWidth: '10%'
    }
  },
  stroke: {
    colors: ['#1f2937', '#D62755']
  },
  markers: {
    size: [0, 6],
    colors: ['#D62755']
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
  legend: { position: 'top' }
}))

const activeSources = computed(() => {
  const sources = activeBenchmark.value?.sources || []
  return sources.map((source) =>
    typeof source === 'string'
      ? { url: source, min: null, max: null, title: '' }
      : { ...source, title: source?.title || '' }
  )
})

const normalizeUrl = (value) => {
  if (!value) return ''
  const text = String(value).trim()
  if (/^https?:\/\//i.test(text)) return text
  return text
}

const getHost = (url) => {
  try {
    return new URL(normalizeUrl(url)).hostname.toLowerCase()
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase()
  }
}

const chartKey = computed(() => {
  if (!employee.value || !chartBenchmark.value) return 'empty'
  const { min, med, max } = chartBenchmark.value
  const hiddenCount = hiddenSources.value.size
  return `${employee.value.id}-${min}-${med}-${max}-${hiddenCount}`
})

const ALWAYS_FETCH = true
const storagePrefix = 'profile-benchmark:'

const buildSearchUrl = (label, query) => {
  const encoded = encodeURIComponent(query)
  if (label === 'LinkedIn') {
    return `https://www.linkedin.com/jobs/search/?keywords=${encoded}`
  }
  if (label === 'Indeed') {
    return `https://www.indeed.com/jobs?q=${encoded}`
  }
  if (label === 'Glassdoor') {
    return `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encoded}`
  }
  if (label === 'Payscale') {
    return `https://www.payscale.com/research/IT/Job=${encoded}/Salary`
  }
  return `https://www.google.com/search?q=${encoded}`
}

const sourceDetails = computed(() => {
  const sources = activeSources.value.filter((source) => {
    const url = normalizeUrl(source.url)
    return url && !hiddenSources.value.has(url)
  })
  if (!employee.value || !activeBenchmark.value) return []

  const med = chartBenchmark.value?.med ?? activeBenchmark.value.med
  const labelMap = {
    linkedin: 'LinkedIn',
    indeed: 'Indeed',
    glassdoor: 'Glassdoor',
    payscale: 'Payscale'
  }
  const iconMap = {
    LinkedIn: 'LI',
    Indeed: 'IN',
    Glassdoor: 'GD',
    Payscale: 'PS'
  }

  const expanded = sources.flatMap((item) => {
    const normalized = normalizeUrl(item.url)
    if (/^https?:\/\//i.test(normalized)) {
      const host = getHost(normalized)
      const matchedKey = Object.keys(labelMap).find((key) => host.includes(key))
      const label = matchedKey ? labelMap[matchedKey] : host || 'Fonte'
      const icon = iconMap[label] || 'FX'
      return [
        {
          url: normalized,
          label,
          icon,
          min: item.min,
          max: item.max,
          title: item.title || ''
        }
      ]
    }

    const query = normalized
    return ['LinkedIn', 'Indeed', 'Glassdoor'].map((label) => ({
      url: buildSearchUrl(label, query),
      label,
      icon: iconMap[label] || 'FX',
      min: item.min,
      max: item.max,
      title: item.title || ''
    }))
  })

  return expanded.map((entry, index) => {
    if (Number.isFinite(entry.min) && Number.isFinite(entry.max)) {
      const trend = entry.min >= med ? 'up' : 'down'
      return { ...entry, trend }
    }
    const offset = (index + 1) * 1200
    const min = Math.max(0, med - 4500 + offset)
    const max = med + 4500 + offset
    const trend = min >= med ? 'up' : 'down'
    return { ...entry, min, max, trend }
  })
})

const updateBenchmark = async () => {
  if (!employee.value) return
  benchmarkLoading.value = true
  benchmarkError.value = ''
  try {
    const role = employee.value.ruolo
    const location = employee.value.city || 'Milano'
    const response = await requestPerplexitySalary({ role, location })
    const benchmark = parseSalaryBenchmark(response.text, {
      citations: response.citations,
      requireSources: false
    })
    const nextBenchmark = {
      id: employee.value.id,
      min: benchmark.min,
      med: benchmark.med,
      max: benchmark.max,
      sources: benchmark.sources
    }
    benchmarkData.value = nextBenchmark
    try {
      localStorage.setItem(`${storagePrefix}${employee.value.id}`, JSON.stringify(nextBenchmark))
    } catch {
      // ignore storage failures
    }
  } catch (error) {
    const message = error?.message || 'Errore sconosciuto'
    benchmarkError.value = ALWAYS_FETCH
      ? `Impossibile aggiornare il benchmark da Serper: ${message}.`
      : `Dati live non disponibili: ${message}.`
    benchmarkData.value = {
      id: employee.value.id,
      min: employee.value.benchmark.min,
      med: employee.value.benchmark.med,
      max: employee.value.benchmark.max,
      sources: [employee.value.source_link]
    }
  } finally {
    benchmarkLoading.value = false
  }
}

const removeSource = (url) => {
  const normalized = normalizeUrl(url)
  if (!normalized) return
  hiddenSources.value = new Set(hiddenSources.value).add(normalized)
  if (!employee.value) return
  try {
    localStorage.setItem(
      `${storagePrefix}${employee.value.id}:hidden`,
      JSON.stringify(Array.from(hiddenSources.value))
    )
  } catch {
    // ignore storage failures
  }
}

const goBack = () => {
  router.push({ name: 'ai-suggestions' })
}

const formatPerformance = (score) => {
  const raw = (score / 5) * 100
  const adjusted = Math.min(99.4, Math.max(0, raw - 1.3 + score * 0.7))
  return `${adjusted.toFixed(1)}%`
}

const openSalaryReview = () => {
  if (!employee.value) return
  newRal.value = employee.value.ral_attuale
  newVariable.value = employee.value.variabile_attuale
  showSalaryReview.value = true
}

const closeSalaryReview = () => {
  showSalaryReview.value = false
}

const formatDelta = (nextValue, currentValue) => {
  const next = Number(nextValue)
  const current = Number(currentValue)
  if (!Number.isFinite(next) || !Number.isFinite(current) || current <= 0) return '—'
  const delta = ((next - current) / current) * 100
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}%`
}

watch(
  employee,
  () => {
    benchmarkError.value = ''
    if (!employee.value) {
      benchmarkData.value = null
      hiddenSources.value = new Set()
      return
    }
    try {
      const stored = localStorage.getItem(`${storagePrefix}${employee.value.id}`)
      benchmarkData.value = stored ? JSON.parse(stored) : null
    } catch {
      benchmarkData.value = null
    }
    try {
      const storedHidden = localStorage.getItem(`${storagePrefix}${employee.value.id}:hidden`)
      const parsed = storedHidden ? JSON.parse(storedHidden) : []
      hiddenSources.value = new Set(Array.isArray(parsed) ? parsed : [])
    } catch {
      hiddenSources.value = new Set()
    }
  },
  { immediate: true }
)
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
.meta { color: var(--bs-gray-700); }
.secondary-btn {
  border: 1px solid var(--bs-gray-200);
  background: var(--bs-white);
  color: var(--bs-dark);
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.primary-btn {
  background: var(--bs-primary);
  color: #fff;
  border: 1px solid var(--bs-primary);
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.primary-btn:hover {
  filter: brightness(0.95);
}
.profile-section {
  display: grid;
  gap: 12px;
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 16px;
}
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.profile-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.profile-header h2 {
  margin: 0 0 4px;
  font-size: 1rem;
  color: var(--bs-dark);
}
.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: start;
}
.performance-card {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--bs-gray-200);
  background: var(--bs-gray-100);
}
.performance-title {
  font-weight: 600;
  color: var(--bs-dark);
}
.performance-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.metric {
  display: grid;
  gap: 4px;
}
.metric .label {
  font-size: 0.8rem;
  color: var(--bs-gray-700);
}
.metric .value {
  font-weight: 700;
  color: var(--bs-dark);
}
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: flex-end;
  z-index: 40;
}
.sheet {
  background: var(--bs-white);
  width: min(460px, 92vw);
  height: 100%;
  padding: 20px;
  display: grid;
  gap: 18px;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
}
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.sheet-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--bs-dark);
}
.sheet-subtitle {
  color: var(--bs-gray-700);
  font-size: 0.9rem;
}
.ghost-btn {
  border: 1px solid var(--bs-gray-200);
  background: transparent;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.sheet-section {
  display: grid;
  gap: 10px;
}
.current-values {
  display: grid;
  gap: 8px;
}
.current-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}
.current-item .label {
  color: var(--bs-gray-700);
  font-size: 0.85rem;
}
.current-item .value {
  font-weight: 700;
  color: var(--bs-dark);
}
.input-grid {
  display: grid;
  gap: 12px;
}
.input-field {
  display: grid;
  gap: 6px;
}
.input-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;
}
.input {
  border: 1px solid var(--bs-gray-200);
  border-radius: 8px;
  padding: 8px 10px;
}
.sheet-actions {
  display: flex;
  justify-content: flex-end;
}
.sheet-actions .primary-btn {
  padding: 6px 10px;
  font-size: 0.85rem;
}
.delta {
  font-weight: 700;
  color: var(--bs-dark);
  min-width: 70px;
  text-align: right;
}
.profile-grid > * {
  min-width: 0;
}
.insight-error {
  color: #D62755;
  font-weight: 600;
}
.boxplot-card {
  background: var(--bs-gray-100);
  border-radius: 12px;
  border: 1px solid var(--bs-gray-200);
  padding: 12px;
}
.sources {
  display: grid;
  gap: 6px;
}
.sources-title {
  font-weight: 600;
  color: var(--bs-dark);
}
.source-row {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  align-items: center;
  gap: 12px;
  background: var(--bs-gray-100);
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  padding: 10px 12px;
}
.source-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #0a6cd2;
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
}
.source-body a {
  color: var(--bs-primary);
  text-decoration: none;
  font-size: 0.9rem;
  word-break: break-all;
}
.source-body a:hover {
  text-decoration: underline;
}
.source-range {
  font-size: 0.8rem;
  color: var(--bs-gray-700);
}
.source-note {
  margin-left: 6px;
  color: var(--bs-gray-600);
  font-size: 0.75rem;
}
.source-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.trend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 0.8rem;
}
.trend.up {
  color: #16a34a;
}
.trend.down {
  color: #D62755;
}
.trend-arrow {
  font-size: 1rem;
  line-height: 1;
}
.remove-source {
  border: 1px solid var(--bs-gray-200);
  background: var(--bs-white);
  color: var(--bs-gray-700);
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
}
.remove-source:hover {
  color: #D62755;
  border-color: #D62755;
}
.empty-state {
  background: var(--bs-gray-100);
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  padding: 20px;
  color: var(--bs-gray-700);
}
</style>

