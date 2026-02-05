<template>
  <section class="page">
    <div class="card">
      <h2>Aggregated Salary Benchmark</h2>
      <p class="card-subtitle">
        Confronto tra salario medio aziendale e media di mercato.
      </p>
      <div class="chart-wrap">
        <canvas ref="salaryChartRef" height="140"></canvas>
      </div>
    </div>

    <div class="card">
      <h2>Competitor Benchmark Box Plot</h2>
      <p class="card-subtitle">
        Range salariale azienda vs competitor diretti (Senior Dev).
      </p>
      <div class="box-plot">
        <div class="plot-scale">
          <span>45k</span>
          <span>50k</span>
          <span>55k</span>
          <span>60k</span>
        </div>
        <div class="plot-track">
          <div class="company-range">
            <div class="range-label">La tua Azienda</div>
            <div class="range-bar"></div>
          </div>
          <div class="competitor-point" style="left: 30%;">
            <span class="dot"></span>
            <span class="label">Competitor X</span>
          </div>
          <div class="competitor-point" style="left: 55%;">
            <span class="dot"></span>
            <span class="label">Competitor Y</span>
          </div>
          <div class="competitor-point" style="left: 70%;">
            <span class="dot"></span>
            <span class="label">Competitor Z</span>
          </div>
        </div>
      </div>
      <div class="impact-message">
        ⚠️ Il tuo competitor diretto ha alzato il minimo per i Senior Dev a 55k,
        tu sei ancora a 48k.
      </div>
    </div>

    <div class="card">
      <h2>Market Intelligence Feed</h2>
      <div class="feed">
        <div v-for="item in marketFeed" :key="item.id" class="feed-item">
          <span class="feed-icon">⚠️</span>
          <div>
            <div class="feed-title">{{ item.title }}</div>
            <div class="feed-subtitle">{{ item.detail }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Chart from 'chart.js/auto'
import { employees } from '../data/employees'

const salaryChartRef = ref(null)
let salaryChartInstance = null

const companyAvg =
  employees.reduce((sum, employee) => sum + employee.ral_attuale, 0) / employees.length
const marketAvg =
  employees.reduce((sum, employee) => sum + employee.benchmark.med, 0) / employees.length

const formatShort = (value) => `${Math.round(value / 1000)}k`

onMounted(() => {
  if (!salaryChartRef.value) return
  salaryChartInstance = new Chart(salaryChartRef.value, {
    type: 'bar',
    data: {
      labels: ['La tua Azienda', 'Media di mercato'],
      datasets: [
        {
          label: 'Salario medio',
          data: [companyAvg, marketAvg],
          backgroundColor: ['#0A6CD2', '#F56565'],
          borderRadius: 8,
          barThickness: 40
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${formatShort(context.parsed.y)} EUR`
          }
        }
      },
      scales: {
        y: {
          ticks: {
            callback: (value) => formatShort(value)
          },
          grid: {
            color: 'rgba(0,0,0,0.06)'
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  })
})

onBeforeUnmount(() => {
  if (salaryChartInstance) {
    salaryChartInstance.destroy()
    salaryChartInstance = null
  }
})

const marketFeed = [
  {
    id: 'feed-1',
    title: 'ALERT: I salari per HR Business Partner a Milano sono aumentati del 10% nell’ultimo mese.',
    detail: '3 dei tuoi dipendenti sono ora fuori mercato.'
  },
  {
    id: 'feed-2',
    title: 'TREND: Il ruolo Data Analyst a Torino mostra un +6% su base trimestrale.',
    detail: 'Valuta adeguamenti per profili ad alte performance.'
  }
]
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.card {
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  padding: 16px;
}
.card h2 {
  margin: 0 0 6px;
  font-size: 1rem;
  color: var(--bs-dark);
}
.card-subtitle {
  margin: 0 0 12px;
  color: var(--bs-gray-700);
  font-size: 0.9rem;
}
.chart-wrap {
  height: 220px;
  padding: 10px 0;
}
.box-plot {
  display: grid;
  gap: 8px;
}
.plot-scale {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--bs-gray-700);
}
.plot-track {
  position: relative;
  height: 70px;
  background: var(--bs-gray-100);
  border-radius: 10px;
  border: 1px solid var(--bs-gray-200);
  padding: 16px 12px;
}
.company-range {
  position: absolute;
  left: 15%;
  right: 35%;
  top: 18px;
}
.range-label {
  font-size: 0.75rem;
  color: var(--bs-dark);
  margin-bottom: 6px;
}
.range-bar {
  height: 10px;
  border-radius: 999px;
  background: var(--bs-primary);
  box-shadow: 0 0 0 4px rgba(10, 108, 210, 0.15);
}
.competitor-point {
  position: absolute;
  top: 38px;
  transform: translateX(-50%);
  display: grid;
  justify-items: center;
  gap: 4px;
}
.competitor-point .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #D62755;
}
.competitor-point .label {
  font-size: 0.7rem;
  color: var(--bs-gray-700);
  white-space: nowrap;
}
.impact-message {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(214, 39, 85, 0.08);
  color: #8b1d3a;
  font-weight: 600;
}
.feed {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}
.feed-item {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  background: var(--bs-gray-100);
}
.feed-title {
  font-weight: 600;
  color: var(--bs-dark);
}
.feed-subtitle {
  color: var(--bs-gray-700);
  font-size: 0.9rem;
}
</style>

