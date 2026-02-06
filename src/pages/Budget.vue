<template>
  <section class="page">
    <h1 class="page-title">Budget</h1>
    <p class="page-desc">Inserisci un budget e genera gli adeguamenti proposti.</p>

    <div class="input-card">
      <label class="input-label" for="budget-input">Inserisci budget (€)</label>
      <div class="input-row">
        <input
          id="budget-input"
          v-model.number="budgetInput"
          type="number"
          min="0"
          step="500"
          placeholder="Es. 50000"
          class="budget-input"
        />
        <button class="primary-btn" type="button" :disabled="loading" @click="confirmBudget">
          Conferma
        </button>
      </div>
    </div>

    <div v-if="loading" class="loader-card">
      <div class="loader-dot" />
      <div>Analisi in corso...</div>
    </div>

    <div v-else-if="showResults">
      <h2 class="section-title">Adeguamenti proposti</h2>
      <div class="cards-grid">
        <div v-for="row in proposedAdjustments" :key="row.id" class="proposal-card">
          <div class="card-header">
            <div>
              <div class="name">{{ row.nome }}</div>
              <div class="meta">{{ row.ruolo }}</div>
            </div>
            <div class="performance">
              <span class="performance-label">Punteggio performance</span>
              <span class="performance-value">{{ formatPerformance(row.performance_score) }}</span>
            </div>
          </div>
          <div class="card-row">
            <span class="label">RAL vs media mercato</span>
            <span class="value">
              {{ formatCurrency(row.ral_attuale) }} / {{ formatCurrency(row.benchmark.med) }}
            </span>
          </div>
          <div class="card-row highlight">
            <span class="label">Adeguamento proposto</span>
            <span class="value">+{{ formatCurrency(row.allocated) }}</span>
          </div>
        </div>
      </div>
      <div v-if="!proposedAdjustments.length" class="empty-state">
        Nessun adeguamento disponibile con questo budget.
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { employees, calcSuggestedRaise, formatCurrency } from '../data/employees'

const budgetInput = ref(50000)
const confirmedBudget = ref(null)
const loading = ref(false)
const showResults = ref(false)

const allocationPlan = computed(() => {
  const budgetValue = Number.isFinite(confirmedBudget.value) ? confirmedBudget.value : 0
  let remaining = budgetValue
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
      return { ...employee, allocated }
    })
})

const proposedAdjustments = computed(() =>
  allocationPlan.value.filter((row) => row.allocated > 0)
)

const confirmBudget = () => {
  const value = Number(budgetInput.value)
  confirmedBudget.value = Number.isFinite(value) && value > 0 ? value : 0
  loading.value = true
  showResults.value = false
  window.setTimeout(() => {
    loading.value = false
    showResults.value = true
  }, 700)
}

const formatPerformance = (score) => {
  const raw = (score / 5) * 100
  const adjusted = Math.min(99.4, Math.max(0, raw - 1.3 + score * 0.7))
  return `${adjusted.toFixed(1)}%`
}
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.page-title { margin: 0; color: var(--bs-dark); }
.page-desc { margin: 0; color: var(--bs-gray-700); }
.input-card {
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 10px;
}
.input-label {
  font-weight: 600;
  color: var(--bs-dark);
}
.input-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.budget-input {
  flex: 1;
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 1rem;
}
.primary-btn {
  background: var(--bs-primary);
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}
.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.loader-card {
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--bs-gray-700);
}
.loader-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--bs-primary);
  box-shadow: 0 0 0 6px rgba(10, 108, 210, 0.12);
  animation: pulse 1.2s infinite;
}
.section-title {
  margin: 0;
  color: var(--bs-dark);
}
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.cards-grid > * {
  min-width: 0;
}
.proposal-card {
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 14px;
  display: grid;
  gap: 10px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.name {
  font-weight: 700;
  color: var(--bs-dark);
}
.meta {
  font-size: 0.85rem;
  color: var(--bs-gray-700);
}
.performance {
  font-weight: 700;
  color: var(--bs-dark);
  background: #eef4ff;
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 0.85rem;
  display: grid;
  gap: 2px;
  text-align: right;
}
.performance-label {
  font-weight: 600;
  color: var(--bs-gray-700);
}
.performance-value {
  font-weight: 700;
  color: var(--bs-dark);
}

@media (max-width: 980px) {
  .cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .cards-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .performance {
    text-align: left;
  }
}
.card-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.9rem;
}
.card-row .label {
  color: var(--bs-gray-700);
}
.card-row .value {
  font-weight: 600;
  color: var(--bs-dark);
}
.card-row.highlight .value {
  color: #16a34a;
}
.empty-state {
  background: var(--bs-gray-100);
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  padding: 16px;
  color: var(--bs-gray-700);
}
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 0.6; }
}
</style>

