<template>
  <section class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Audit</h1>
        <p class="page-desc">Tracciabilità e confronto decisionale.</p>
      </div>
      <span class="chip">Pay equity</span>
    </div>

    <div class="audit-card">
      <div class="audit-header">
        <div>
          <h2>Confronto Retributivo per Dipartimento</h2>
          <p class="meta">Stipendi medi uomini vs donne. Barre rosse indicano gap ≥5% (non conforme).</p>
        </div>
      </div>

      <div class="audit-table">
        <div class="audit-row audit-head">
          <div>Dipartimento</div>
          <div>Stipendio medio uomini</div>
          <div>Stipendio medio donne</div>
          <div>Gap</div>
        </div>

        <div v-for="row in auditRows" :key="row.department" class="audit-row">
          <div class="dept">{{ row.department }}</div>
          <div class="bar-cell">
            <div class="bar-track">
              <div class="bar male" :style="{ width: `${row.malePct}%` }">
                <span>{{ formatCurrency(row.maleAvg) }}</span>
              </div>
            </div>
          </div>
          <div class="bar-cell">
            <div class="bar-track">
              <div class="bar female" :style="{ width: `${row.femalePct}%` }">
                <span>{{ formatCurrency(row.femaleAvg) }}</span>
              </div>
            </div>
          </div>
          <div :class="['gap', row.nonCompliant ? 'gap-bad' : 'gap-ok']">
            {{ row.gapPct }}%
          </div>
        </div>
      </div>

      <div class="legend">
        <span class="legend-dot male"></span> Uomini
        <span class="legend-dot female"></span> Donne
        <span class="legend-dot bad"></span> Gap ≥5% (non conforme)
      </div>
    </div>
  </section>
</template>

<script setup>
const auditRows = [
  { department: 'Engineering', maleAvg: 52000, femaleAvg: 53500 },
  { department: 'Product', maleAvg: 48000, femaleAvg: 46800 },
  { department: 'Sales', maleAvg: 45000, femaleAvg: 46000 },
  { department: 'HR', maleAvg: 42000, femaleAvg: 43500 },
  { department: 'Finance', maleAvg: 50000, femaleAvg: 47250 }
].map((row) => {
  const max = Math.max(row.maleAvg, row.femaleAvg)
  const gapPct = Math.round(((row.maleAvg - row.femaleAvg) / row.maleAvg) * 100)
  return {
    ...row,
    gapPct,
    nonCompliant: gapPct >= 5,
    malePct: Math.round((row.maleAvg / max) * 100),
    femalePct: Math.round((row.femaleAvg / max) * 100)
  }
})

const formatCurrency = (value) => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value)
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
.page-desc { margin: 0; color: var(--bs-gray-700); }
.meta { color: var(--bs-gray-700); margin: 4px 0 0; }
.chip {
  background: var(--bs-gray-100);
  color: var(--bs-gray-700);
  border: 1px solid var(--bs-gray-200);
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
}
.audit-card {
  display: grid;
  gap: 16px;
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 16px;
}
.audit-header h2 {
  margin: 0 0 4px;
  font-size: 1rem;
  color: var(--bs-dark);
}
.audit-table {
  display: grid;
  gap: 12px;
}
.audit-row {
  display: grid;
  grid-template-columns: 1.2fr 1.6fr 1.6fr 0.6fr;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--bs-gray-200);
}
.audit-row:last-child {
  border-bottom: none;
}
.audit-head {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--bs-gray-700);
  border-bottom: 1px solid var(--bs-gray-200);
  padding-bottom: 12px;
}
.dept {
  font-weight: 600;
  color: var(--bs-dark);
}
.bar-cell {
  display: flex;
  align-items: center;
}
.bar-track {
  width: 100%;
  background: var(--bs-gray-100);
  border-radius: 999px;
  height: 28px;
  overflow: hidden;
  border: 1px solid var(--bs-gray-200);
}
.bar {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #fff;
}
.bar.male {
  background: #0a6cd2;
}
.bar.female {
  background: #5b8def;
}
.gap {
  font-weight: 700;
  text-align: right;
}
.gap-ok {
  color: #16a34a;
}
.gap-bad {
  color: #D62755;
}
.legend {
  display: flex;
  align-items: center;
  gap: 16px;
  color: var(--bs-gray-700);
  font-size: 0.85rem;
}
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 6px;
}
.legend-dot.male {
  background: #0a6cd2;
}
.legend-dot.female {
  background: #5b8def;
}
.legend-dot.bad {
  background: #D62755;
}
</style>

