<template>
  <section class="page">
    <h1 class="page-title">Budget</h1>
    <p class="page-desc">Simulatore sandbox per allocare gli incrementi con priorità al rischio turnover.</p>

    <div class="simulator-card">
      <div class="simulator-header">
        <div>
          <h2>Budget Simulator</h2>
          <p>Regola il budget totale incrementi e lascia che l'AI distribuisca.</p>
        </div>
        <div class="budget-pill">{{ formatCurrency(budget) }}</div>
      </div>

      <input
        v-model.number="budget"
        type="range"
        min="0"
        max="80000"
        step="1000"
        class="budget-slider"
      />
      <div class="slider-scale">
        <span>0</span>
        <span>80k</span>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="label">Profili critici messi in sicurezza</div>
          <div class="value safe">{{ securedCount }}</div>
        </div>
        <div class="summary-item">
          <div class="label">Budget residuo</div>
          <div class="value">{{ formatCurrency(remainingBudget) }}</div>
        </div>
      </div>
    </div>

    <div class="table-card">
      <table class="table">
        <thead>
          <tr>
            <th>Dipendente</th>
            <th>Rischio</th>
            <th>Gap Mediano</th>
            <th>Allocazione AI</th>
            <th>Stato</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in allocationPlan" :key="row.id">
            <td>
              <div class="name">{{ row.nome }}</div>
              <div class="meta">{{ row.ruolo }}</div>
            </td>
            <td>
              <span :class="['badge', row.riskClass]">{{ row.rischio_turnover }}</span>
            </td>
            <td>
              <span :class="row.gapClass">{{ formatCurrency(row.gap) }}</span>
            </td>
            <td>{{ formatCurrency(row.allocated) }}</td>
            <td>
              <span :class="['badge', row.secured ? 'safe' : 'warning']">
                {{ row.secured ? 'Safe' : 'Parziale' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { employees, calcSuggestedRaise, formatCurrency } from '../data/employees'

const budget = ref(50000)

const allocationPlan = computed(() => {
  let remaining = budget.value
  return employees
    .map((employee) => {
      const gap = employee.benchmark.med - employee.ral_attuale
      const suggestedRaise = calcSuggestedRaise(employee)
      const riskPriority = employee.rischio_turnover === 'alto' ? 1 : 0
      return { ...employee, gap, suggestedRaise, riskPriority }
    })
    .sort((a, b) => b.riskPriority - a.riskPriority || b.gap - a.gap)
    .map((employee) => {
      const allocated = Math.min(employee.suggestedRaise, remaining)
      remaining -= allocated
      const secured = allocated >= employee.suggestedRaise
      const gapClass = employee.gap > 8000 ? 'danger' : employee.gap > 4000 ? 'warning' : 'safe'
      const riskClass = employee.rischio_turnover === 'alto' ? 'danger' : 'safe'
      return { ...employee, allocated, secured, gapClass, riskClass }
    })
})

const securedCount = computed(() => allocationPlan.value.filter((row) => row.secured).length)
const remainingBudget = computed(() => {
  const used = allocationPlan.value.reduce((sum, row) => sum + row.allocated, 0)
  return budget.value - used
})
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.page-title { margin: 0; color: var(--bs-dark); }
.page-desc { margin: 0; color: var(--bs-gray-700); }
.simulator-card {
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 16px;
}
.simulator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.simulator-header h2 {
  margin: 0 0 4px;
  color: var(--bs-dark);
}
.simulator-header p {
  margin: 0;
  color: var(--bs-gray-700);
}
.budget-pill {
  background: #e8f5e8;
  color: #166534;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 700;
}
.budget-slider {
  width: 100%;
}
.slider-scale {
  display: flex;
  justify-content: space-between;
  color: var(--bs-gray-700);
  font-size: 0.85rem;
}
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.summary-item {
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  padding: 12px;
  background: var(--bs-gray-100);
}
.summary-item .label {
  color: var(--bs-gray-700);
  font-size: 0.85rem;
}
.summary-item .value {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--bs-dark);
}
.summary-item .value.safe {
  color: #16a34a;
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
.name {
  font-weight: 700;
  color: var(--bs-dark);
}
.meta {
  font-size: 0.85rem;
  color: var(--bs-gray-700);
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.8rem;
  text-transform: capitalize;
}
.badge.danger { background: rgba(214, 39, 85, 0.12); color: #D62755; }
.badge.safe { background: rgba(22, 163, 74, 0.12); color: #16a34a; }
.badge.warning { background: rgba(245, 158, 11, 0.12); color: #b45309; }
.danger { color: #D62755; font-weight: 700; }
.warning { color: #f59e0b; font-weight: 700; }
.safe { color: #16a34a; font-weight: 700; }
</style>

