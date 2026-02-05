<template>
  <section class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Competition analysis</h1>
        <p class="page-desc">
          Job post attivi a Milano con retribuzioni sopra i nostri benchmark.
        </p>
      </div>
      <span class="chip">Talent intelligence</span>
    </div>

    <div class="competitor-section">
      <div class="competitor-header">
        <h3>Ruoli a rischio sorpasso</h3>
        <p class="meta">Evidenzia i competitor con offerte superiori per ruolo.</p>
      </div>
      <div class="competitor-list">
        <div v-for="job in competitorJobs" :key="job.id" class="competitor-row">
          <div class="competitor-main">
            <div class="competitor-title">{{ job.role }}</div>
            <div class="competitor-meta">{{ job.company }} · {{ job.city }}</div>
          </div>
          <div class="competitor-pay">
            {{ formatCurrency(job.salary) }}
            <span class="competitor-up">↑</span>
          </div>
          <a :href="job.link" target="_blank" rel="noreferrer" class="competitor-link">
            Apri annuncio
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { employees, formatCurrency } from '../data/employees'

const competitorJobs = computed(() => {
  const roles = Array.from(new Set(employees.map((item) => item.ruolo)))
  return roles.slice(0, 8).flatMap((role, roleIndex) => {
    const base = Math.max(
      ...employees
        .filter((item) => item.ruolo === role)
        .map((item) => item.benchmark?.max || item.ral_attuale || 0)
    )
    return [0, 1].map((offset) => {
      const salary = base + 3000 + roleIndex * 800 + offset * 1200
      const query = encodeURIComponent(`${role} Milano salary`)
      return {
        id: `${role}-${offset}`,
        role,
        company: ['Talentify', 'BlueWave', 'HR Prime', 'NextPeople'][offset % 4],
        city: 'Milano',
        salary,
        link: `https://www.linkedin.com/jobs/search/?keywords=${query}`
      }
    })
  })
})
</script>

<style scoped>
.page {
  display: grid;
  gap: 16px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.page-title {
  margin: 0;
  color: var(--bs-dark);
}
.page-desc {
  margin: 4px 0 0;
  color: var(--bs-gray-700);
}
.meta {
  color: var(--bs-gray-700);
}
.chip {
  background: var(--bs-gray-100);
  color: var(--bs-gray-700);
  border: 1px solid var(--bs-gray-200);
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.85rem;
}
.competitor-section {
  display: grid;
  gap: 10px;
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  padding: 16px;
}
.competitor-header h3 {
  margin: 0 0 4px;
  color: var(--bs-dark);
  font-size: 1rem;
}
.competitor-list {
  display: grid;
  gap: 10px;
}
.competitor-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  align-items: center;
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  padding: 10px 12px;
  background: var(--bs-gray-100);
}
.competitor-title {
  font-weight: 700;
  color: var(--bs-dark);
}
.competitor-meta {
  font-size: 0.85rem;
  color: var(--bs-gray-700);
}
.competitor-pay {
  font-weight: 700;
  color: #16a34a;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.competitor-up {
  font-size: 0.9rem;
}
.competitor-link {
  color: var(--bs-primary);
  text-decoration: none;
  font-weight: 600;
}
.competitor-link:hover {
  text-decoration: underline;
}
</style>
