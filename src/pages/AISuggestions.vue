<template>
  <section class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Profili retributivi</h1>
        <p class="page-desc">Ranking & decisioni di salary review basati su benchmark.</p>
      </div>
      <span class="chip">Priority Raises</span>
    </div>

    <div class="table-card">
      <table class="table">
        <thead>
          <tr>
            <th>Dipendente</th>
            <th>Punteggio performance</th>
            <th>Gap vs Mercato</th>
            <th>ROI di Retention</th>
            <th>Rischio</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in priorityRaises" :key="row.id" class="clickable" @click="openProfile(row)">
            <td>
              <div class="name">{{ row.nome }}</div>
              <div class="meta">{{ row.ruolo }} · {{ row.dipartimento }}</div>
            </td>
            <td>
              <span class="score">{{ formatPerformance(row.performance_score) }}</span>
            </td>
            <td>
              <span :class="row.gapClass">{{ formatCurrency(row.gap) }}</span>
            </td>
            <td>
              <div class="roi">{{ formatCurrency(row.roi) }}</div>
              <div class="meta">Costo sostituzione: {{ formatCurrency(row.retentionCost) }}</div>
            </td>
            <td>
              <span :class="['badge', row.riskClass]">{{ row.rischio_turnover }}</span>
            </td>
            <td>
              <button class="primary-btn" type="button" @click.stop="openProfile(row)">
                Visualizza
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  employees,
  calcSuggestedRaise,
  calcRetentionCost,
  calcRetentionROI,
  formatCurrency,
  getPriorityScore
} from '../data/employees'
const router = useRouter()

const priorityRaises = computed(() => {
  return employees
    .map((employee) => {
      const gap = employee.benchmark.med - employee.ral_attuale
      const suggestedRaise = calcSuggestedRaise(employee)
      const retentionCost = calcRetentionCost(employee)
      const roi = calcRetentionROI(employee)
      const score = getPriorityScore(employee)
      const gapClass = gap > 8000 ? 'danger' : gap > 4000 ? 'warning' : 'safe'
      const riskClass = employee.rischio_turnover === 'alto' ? 'danger' : 'safe'
      return {
        ...employee,
        gap,
        suggestedRaise,
        retentionCost,
        roi,
        score,
        gapClass,
        riskClass
      }
    })
    .sort((a, b) => b.score - a.score || b.gap - a.gap)
})

const openProfile = (employee) => {
  router.push({ name: 'profile-detail', params: { id: employee.id } })
}

const formatPerformance = (score) => {
  const raw = (score / 5) * 100
  const adjusted = Math.min(99.4, Math.max(0, raw - 1.3 + score * 0.7))
  return `${adjusted.toFixed(1)}%`
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
  background: #e3f2fd;
  color: var(--bs-primary);
  border-radius: 999px;
  padding: 6px 12px;
  font-weight: 600;
}
.table-card {
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 8px 8px 4px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}
.table th {
  text-align: left;
  color: var(--bs-gray-700);
  font-weight: 600;
  padding: 12px;
}
.table td {
  padding: 12px;
  border-top: 1px solid var(--bs-gray-200);
  vertical-align: top;
}
.clickable:hover {
  background: rgba(0, 0, 0, 0.02);
  cursor: pointer;
}
.name {
  font-weight: 700;
  color: var(--bs-dark);
}
.meta {
  font-size: 0.85rem;
  color: var(--bs-gray-700);
}
.score {
  font-weight: 700;
  color: var(--bs-dark);
}
.danger { color: #D62755; font-weight: 700; }
.warning { color: #f59e0b; font-weight: 700; }
.safe { color: #16a34a; font-weight: 700; }
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.8rem;
  text-transform: capitalize;
}
.badge.danger {
  background: rgba(214, 39, 85, 0.12);
}
.badge.safe {
  background: rgba(22, 163, 74, 0.12);
}
.primary-btn {
  background: var(--bs-primary);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.primary-btn:hover {
  filter: brightness(0.95);
}
.roi {
  font-weight: 600;
  color: var(--bs-dark);
}
</style>

