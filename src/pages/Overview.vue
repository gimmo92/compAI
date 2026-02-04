<template>
  <section class="page">
    <h1 class="page-title">Overview</h1>
    <p class="page-desc">Stato generale del modulo Salary Review AI.</p>
    <div class="card-grid">
      <div class="card">
        <h2>Prossimo ciclo</h2>
        <p>Imposta date, criteri e platea.</p>
      </div>
      <div class="card">
        <h2>Copertura budget</h2>
        <p>Distribuzione proposte vs budget assegnato.</p>
      </div>
      <div class="card">
        <h2>Qualità suggerimenti AI</h2>
        <p>Accuratezza e adozione dei suggerimenti.</p>
      </div>
    </div>

    <div class="grid-2">
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

      <div class="card compliance">
        <h2>Compliance Direttiva UE</h2>
        <div class="compliance-row">
          <div>
            <div class="compliance-label">Countdown al 7 Giugno 2026</div>
            <div class="compliance-value">{{ daysToCompliance }} giorni</div>
          </div>
          <div class="progress">
            <div class="progress-bar" :style="{ width: readyPercent + '%' }"></div>
          </div>
          <div class="compliance-label">
            Ruoli pronti per trasparenza salariale: <strong>{{ readyPercent }}%</strong>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { employees } from '../data/employees'

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

const complianceDate = new Date('2026-06-07T00:00:00')
const daysToCompliance = computed(() => {
  const today = new Date()
  const diff = complianceDate.getTime() - today.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
})

const readyPercent = computed(() => {
  const ready = employees.filter(
    (e) => e.ral_attuale >= e.benchmark.min && e.ral_attuale <= e.benchmark.max
  ).length
  return Math.round((ready / employees.length) * 100)
})
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.page-title { margin: 0; color: var(--bs-dark); }
.page-desc { margin: 0; color: var(--bs-gray-700); }
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
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
.card p {
  margin: 0;
  color: var(--bs-body-color);
}
.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
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
.compliance {
  display: grid;
  gap: 12px;
}
.compliance-row {
  display: grid;
  gap: 12px;
}
.compliance-label {
  color: var(--bs-gray-700);
  font-size: 0.9rem;
}
.compliance-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--bs-dark);
}
.progress {
  width: 100%;
  height: 10px;
  background: var(--bs-gray-200);
  border-radius: 999px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: var(--bs-primary);
}
</style>

