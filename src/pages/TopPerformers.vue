<template>
  <section class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Top performer</h1>
        <p class="page-desc">Performance elevata con RAL sotto la media di mercato.</p>
      </div>
      <span class="chip">Salary review</span>
    </div>

    <div class="table-card">
      <table class="table">
        <thead>
          <tr>
            <th>Dipendente</th>
            <th>Punteggio performance</th>
            <th>RAL attuale</th>
            <th>Media mercato</th>
            <th>Gap</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in topPerformers"
            :key="row.id"
            class="clickable"
            @click="openProfile(row)"
          >
            <td>
              <div class="name">{{ row.nome }}</div>
              <div class="meta">{{ row.ruolo }} · {{ row.dipartimento }}</div>
            </td>
            <td>
              <span class="score">{{ formatPerformance(row.performance_score) }}</span>
            </td>
            <td>{{ formatCurrency(row.ral_attuale) }}</td>
            <td>{{ formatCurrency(row.benchmark.med) }}</td>
            <td>
              <span class="danger">{{ formatCurrency(row.gap) }}</span>
            </td>
            <td>
              <button class="primary-btn" type="button" @click.stop="openProfile(row)">
                Salary review
              </button>
            </td>
          </tr>
          <tr v-if="!topPerformers.length">
            <td colspan="6" class="empty-state">Nessun profilo trovato.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { employees, formatCurrency } from '../data/employees'

const router = useRouter()

const topPerformers = computed(() => {
  return employees
    .filter(
      (employee) =>
        employee.performance_score >= 4 && employee.ral_attuale < employee.benchmark.med
    )
    .map((employee) => ({
      ...employee,
      gap: employee.benchmark.med - employee.ral_attuale
    }))
    .sort((a, b) => b.performance_score - a.performance_score || b.gap - a.gap)
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
.empty-state {
  text-align: center;
  color: var(--bs-gray-700);
  padding: 16px;
}
</style>
