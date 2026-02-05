<template>
  <section class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Suggerimenti AI</h1>
        <p class="page-desc">Ranking & decisioni di salary review basati su benchmark.</p>
      </div>
      <span class="chip">Priority Raises</span>
    </div>

    <div class="insight-card">
      <div>
        <h2>GenAI Insight</h2>
        <p class="meta">Sintesi automatica sulle priorità di incremento.</p>
      </div>
      <div class="insight-actions">
        <button class="primary-btn" type="button" :disabled="insightLoading" @click="generateInsight">
          {{ insightLoading ? 'Generazione...' : 'Genera insight' }}
        </button>
      </div>
      <div v-if="insightError" class="insight-error">{{ insightError }}</div>
      <div v-else class="insight-text">{{ insightText }}</div>
    </div>

    <div class="table-card">
      <table class="table">
        <thead>
          <tr>
            <th>Dipendente</th>
            <th>Performance</th>
            <th>Gap vs Mercato</th>
            <th>Suggerimento AI</th>
            <th>ROI di Retention</th>
            <th>Rischio</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in priorityRaises" :key="row.id" class="clickable" @click="openDetail(row)">
            <td>
              <div class="name">{{ row.nome }}</div>
              <div class="meta">{{ row.ruolo }} · {{ row.dipartimento }}</div>
            </td>
            <td>
              <span class="score">{{ row.performance_score }}</span>
            </td>
            <td>
              <span :class="row.gapClass">{{ formatCurrency(row.gap) }}</span>
            </td>
            <td>
              +{{ formatCurrency(row.suggestedRaise) }} per raggiungere il mediano
            </td>
            <td>
              <div class="roi">{{ formatCurrency(row.roi) }}</div>
              <div class="meta">Costo sostituzione: {{ formatCurrency(row.retentionCost) }}</div>
            </td>
            <td>
              <span :class="['badge', row.riskClass]">{{ row.rischio_turnover }}</span>
            </td>
            <td>
              <button class="primary-btn" type="button" @click.stop="createOffer(row)">
                Crea offerta
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <UserDetailSheet
      v-if="selectedEmployee"
      :open="sheetOpen"
      :employee="selectedEmployee"
      @close="sheetOpen = false"
    />
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  employees,
  calcSuggestedRaise,
  calcRetentionCost,
  calcRetentionROI,
  formatCurrency,
  getPriorityScore
} from '../data/employees'
import UserDetailSheet from '../components/UserDetailSheet.vue'
import { generateGeminiInsight } from '../lib/geminiClient'

const sheetOpen = ref(false)
const selectedEmployee = ref(null)
const insightText = ref('Clicca su "Genera insight" per ottenere una sintesi AI.')
const insightLoading = ref(false)
const insightError = ref('')

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

const openDetail = (employee) => {
  selectedEmployee.value = employee
  sheetOpen.value = true
}

const createOffer = (employee) => {
  selectedEmployee.value = employee
  sheetOpen.value = true
}

const generateInsight = async () => {
  insightLoading.value = true
  insightError.value = ''
  try {
    const top = priorityRaises.value.slice(0, 3).map((e) => ({
      nome: e.nome,
      ruolo: e.ruolo,
      gap: e.gap,
      performance: e.performance_score
    }))

    const prompt = `Sei un HR strategist. Dai una sintesi in 4-5 frasi
    sulle priorita di salary review per questi profili: ${JSON.stringify(top)}.
    Evidenzia urgenze e azioni consigliate.`

    insightText.value = await generateGeminiInsight(prompt)
  } catch (error) {
    insightError.value = 'Errore nella generazione dell\'insight AI.'
  } finally {
    insightLoading.value = false
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
  background: #e3f2fd;
  color: var(--bs-primary);
  border-radius: 999px;
  padding: 6px 12px;
  font-weight: 600;
}
.insight-card {
  display: grid;
  gap: 12px;
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 16px;
}
.insight-card h2 {
  margin: 0 0 4px;
  color: var(--bs-dark);
  font-size: 1rem;
}
.insight-actions {
  display: flex;
  justify-content: flex-end;
}
.insight-text {
  color: var(--bs-gray-700);
  background: var(--bs-gray-100);
  border-radius: 10px;
  padding: 12px;
}
.insight-error {
  color: #D62755;
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

