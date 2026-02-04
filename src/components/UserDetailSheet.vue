<template>
  <div v-if="open" class="sheet-backdrop" @click.self="onClose">
    <aside class="sheet">
      <header class="sheet-header">
        <div>
          <div class="sheet-title">{{ employee.nome }}</div>
          <div class="sheet-subtitle">{{ employee.ruolo }} · {{ employee.dipartimento }}</div>
        </div>
        <button class="ghost-btn" type="button" @click="onClose">Chiudi</button>
      </header>

      <section class="sheet-section">
        <h3>Compensation Benchmark</h3>
        <div class="bar-chart">
          <div class="bar-row">
            <span>Min</span>
            <div class="bar">
              <div class="bar-fill" :style="{ width: minPct + '%' }"></div>
              <span class="bar-value">{{ formatCurrency(employee.benchmark.min) }}</span>
            </div>
          </div>
          <div class="bar-row">
            <span>Med</span>
            <div class="bar">
              <div class="bar-fill med" :style="{ width: medPct + '%' }"></div>
              <span class="bar-value">{{ formatCurrency(employee.benchmark.med) }}</span>
            </div>
          </div>
          <div class="bar-row">
            <span>Max</span>
            <div class="bar">
              <div class="bar-fill max" :style="{ width: maxPct + '%' }"></div>
              <span class="bar-value">{{ formatCurrency(employee.benchmark.max) }}</span>
            </div>
          </div>
          <div class="bar-row current">
            <span>RAL</span>
            <div class="bar">
              <div class="bar-fill current" :style="{ width: ralPct + '%' }"></div>
              <span class="bar-value">{{ formatCurrency(employee.ral_attuale) }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="sheet-section">
        <h3>Trust Builder</h3>
        <p class="sheet-note">
          L'agente AI ha trovato 3 annunci simili a {{ employee.city }}.
        </p>
        <div class="links">
          <a :href="employee.source_link" target="_blank" rel="noreferrer">Fonte 1 · LinkedIn/Indeed</a>
          <a href="https://www.glassdoor.com/Salaries" target="_blank" rel="noreferrer">Fonte 2 · Glassdoor</a>
          <a href="https://www.payscale.com/research/IT/Salary" target="_blank" rel="noreferrer">Fonte 3 · Payscale</a>
        </div>
      </section>
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatCurrency } from '../data/employees'

const props = defineProps({
  open: { type: Boolean, default: false },
  employee: { type: Object, required: true }
})

const emit = defineEmits(['close'])

const maxValue = computed(() => Math.max(props.employee.benchmark.max, props.employee.ral_attuale))
const minPct = computed(() => (props.employee.benchmark.min / maxValue.value) * 100)
const medPct = computed(() => (props.employee.benchmark.med / maxValue.value) * 100)
const maxPct = computed(() => (props.employee.benchmark.max / maxValue.value) * 100)
const ralPct = computed(() => (props.employee.ral_attuale / maxValue.value) * 100)

const onClose = () => {
  emit('close')
}
</script>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: flex-end;
  z-index: 30;
}
.sheet {
  background: var(--bs-white);
  width: min(420px, 92vw);
  height: 100%;
  padding: 20px;
  display: grid;
  gap: 20px;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.12);
}
.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.sheet-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--bs-dark);
}
.sheet-subtitle {
  color: var(--bs-gray-700);
}
.ghost-btn {
  border: 1px solid var(--bs-gray-200);
  background: transparent;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.sheet-section h3 {
  margin: 0 0 10px;
  color: var(--bs-dark);
}
.sheet-note {
  margin: 0 0 10px;
  color: var(--bs-gray-700);
}
.links {
  display: grid;
  gap: 6px;
}
.links a {
  color: var(--bs-primary);
  text-decoration: none;
}
.links a:hover {
  text-decoration: underline;
}
.bar-chart {
  display: grid;
  gap: 10px;
}
.bar-row {
  display: grid;
  grid-template-columns: 50px 1fr;
  align-items: center;
  gap: 12px;
  color: var(--bs-gray-700);
}
.bar-row.current span:first-child {
  font-weight: 700;
  color: var(--bs-dark);
}
.bar {
  position: relative;
  background: var(--bs-gray-100);
  border-radius: 999px;
  height: 12px;
}
.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--bs-gray-400);
}
.bar-fill.med {
  background: var(--bs-primary);
}
.bar-fill.max {
  background: #63B3ED;
}
.bar-fill.current {
  background: #F56565;
}
.bar-value {
  position: absolute;
  right: 8px;
  top: -22px;
  font-size: 0.75rem;
  color: var(--bs-gray-700);
}
</style>

