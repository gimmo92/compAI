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
        <button
          class="secondary-btn"
          type="button"
          :disabled="benchmarkLoading"
          @click="updateBenchmark"
        >
          {{ benchmarkLoading ? 'Aggiornamento...' : 'Aggiorna benchmark retributivi' }}
        </button>
      </div>

      <div v-if="benchmarkError" class="insight-error">{{ benchmarkError }}</div>

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
              <a :href="source.url" target="_blank" rel="noreferrer">{{ source.label }}</a>
              <div class="source-range">
                Range: {{ formatCurrency(source.min) }} - {{ formatCurrency(source.max) }}
              </div>
            </div>
            <div :class="['trend', source.trend]">
              <span class="trend-arrow">{{ source.trend === 'up' ? '^' : 'v' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { employees, formatCurrency } from '../data/employees'
import { generateGeminiInsight } from '../lib/geminiClient'
import VueApexCharts from 'vue3-apexcharts'

const route = useRoute()
const router = useRouter()

const benchmarkLoading = ref(false)
const benchmarkError = ref('')
const benchmarkData = ref(null)

const employee = computed(() => {
  const id = route.params.id
  return employees.find((item) => item.id === id)
})

const activeBenchmark = computed(() => {
  if (!employee.value) return null
  if (benchmarkData.value?.id === employee.value.id) return benchmarkData.value
  return { ...employee.value.benchmark, sources: [employee.value.source_link] }
})

const scaleMin = computed(() => {
  if (!employee.value || !activeBenchmark.value) return 0
  return Math.min(activeBenchmark.value.min, employee.value.ral_attuale)
})
const scaleMax = computed(() => {
  if (!employee.value || !activeBenchmark.value) return 1
  return Math.max(activeBenchmark.value.max, employee.value.ral_attuale)
})
const scaleMed = computed(() => Math.round((scaleMin.value + scaleMax.value) / 2))
const q1Value = computed(() => Math.round(scaleMin.value + (scaleMax.value - scaleMin.value) * 0.25))
const q3Value = computed(() => Math.round(scaleMin.value + (scaleMax.value - scaleMin.value) * 0.75))

const toPct = (value) => {
  const range = scaleMax.value - scaleMin.value || 1
  return ((value - scaleMin.value) / range) * 100
}

const chartSeries = computed(() => {
  if (!employee.value || !activeBenchmark.value) return []
  return [
    {
      name: 'Benchmark',
      type: 'boxPlot',
      data: [
        {
          x: employee.value.ruolo,
          y: [
            activeBenchmark.value.min,
            q1Value.value,
            activeBenchmark.value.med,
            q3Value.value,
            activeBenchmark.value.max
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

const activeSources = computed(() => activeBenchmark.value?.sources || [])

const normalizeUrl = (url) => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

const getHost = (url) => {
  try {
    return new URL(normalizeUrl(url)).hostname.toLowerCase()
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0].toLowerCase()
  }
}

const chartKey = computed(() => {
  if (!employee.value || !activeBenchmark.value) return 'empty'
  const { min, med, max } = activeBenchmark.value
  return `${employee.value.id}-${min}-${med}-${max}`
})

const sourceDetails = computed(() => {
  const sources = activeSources.value
  if (!employee.value || !activeBenchmark.value) return []

  const med = activeBenchmark.value.med
  return sources.map((url, index) => {
    const normalized = normalizeUrl(url)
    const host = getHost(normalized)
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
    const matchedKey = Object.keys(labelMap).find((key) => host.includes(key))
    const label = matchedKey ? labelMap[matchedKey] : host || 'Fonte'
    const icon = iconMap[label] || 'FX'

    const offset = (index + 1) * 1200
    const min = Math.max(0, med - 4500 + offset)
    const max = med + 4500 + offset
    const trend = min >= med ? 'up' : 'down'

    return { url: normalized, label, icon, min, max, trend }
  })
})

const extractJson = (text) => {
  const match = text.match(/\{[\s\S]*\}/)
  return match ? match[0] : null
}

const updateBenchmark = async () => {
  if (!employee.value) return
  benchmarkLoading.value = true
  benchmarkError.value = ''
  try {
    const prompt = `Cerca su internet dati salariali per ${employee.value.ruolo} a Milano.
Rispondi SOLO in JSON nel formato: {"min": number, "med": number, "max": number, "sources": ["url1","url2"]}.`

    const response = await generateGeminiInsight(prompt)
    const jsonText = extractJson(response)
    if (!jsonText) throw new Error('Invalid JSON')
    const parsed = JSON.parse(jsonText)
    const min = Number(parsed.min)
    const med = Number(parsed.med)
    const max = Number(parsed.max)

    if (!Number.isFinite(min) || !Number.isFinite(med) || !Number.isFinite(max)) {
      throw new Error('Invalid benchmark values')
    }

    benchmarkData.value = {
      id: employee.value.id,
      min,
      med,
      max,
      sources: Array.isArray(parsed.sources)
        ? parsed.sources.map((url) => normalizeUrl(String(url).trim())).filter(Boolean)
        : []
    }
  } catch (error) {
    benchmarkError.value = 'Impossibile aggiornare il benchmark. Riprova.'
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

const goBack = () => {
  router.push({ name: 'ai-suggestions' })
}

watch(employee, () => {
  benchmarkError.value = ''
  benchmarkData.value = null
})
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
.empty-state {
  background: var(--bs-gray-100);
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  padding: 20px;
  color: var(--bs-gray-700);
}
</style>

