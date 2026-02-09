<template>
  <section class="page">
    <div class="header">
      <div>
        <h1 class="page-title">Competition analysis</h1>
        <p class="page-desc">
          Job post attivi a Milano con retribuzioni sopra i nostri benchmark.
        </p>
      </div>
      <div class="header-actions">
        <RouterLink class="secondary-btn" :to="{ name: 'competitor-add' }">
          Add competitor
        </RouterLink>
        <RouterLink class="secondary-btn" :to="{ name: 'competitor-add' }">
          Vedi competitor
        </RouterLink>
        <span class="chip">Talent intelligence</span>
      </div>
    </div>

    <div class="competitor-section">
      <div class="competitor-header">
        <h3>Ruoli a rischio sorpasso</h3>
        <p class="meta">Suddivisi per azienda con esempi di annunci.</p>
      </div>
      <div class="company-grid">
        <div v-for="company in competitorCompanies" :key="company.name" class="company-card">
          <div class="company-header">
            <div class="company-name">{{ company.name }}</div>
            <div class="company-meta">{{ company.city }} · {{ company.industry }}</div>
          </div>
          <div class="competitor-list">
            <div v-for="job in company.jobs" :key="job.id" class="competitor-row">
              <div class="competitor-main">
                <div class="competitor-title">{{ job.role }}</div>
                <div class="competitor-meta">{{ job.city }}</div>
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
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { employees, formatCurrency } from '../data/employees'

const storageKey = 'competitors:list'
const customCompetitors = ref([])

const loadCustomCompetitors = () => {
  try {
    const raw = localStorage.getItem(storageKey)
    const parsed = JSON.parse(raw || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((name) => typeof name === 'string' && name.trim())
  } catch {
    return []
  }
}

onMounted(() => {
  customCompetitors.value = loadCustomCompetitors()
})

const competitorCompanies = computed(() => {
  const roles = Array.from(new Set(employees.map((item) => item.ruolo)))
  const companies = [
    { name: 'Talentify', industry: 'HR Tech', city: 'Milano' },
    { name: 'BlueWave', industry: 'Fintech', city: 'Milano' },
    { name: 'HR Prime', industry: 'Consulenza', city: 'Roma' },
    { name: 'NextPeople', industry: 'SaaS', city: 'Torino' }
  ]

  const custom = customCompetitors.value.map((name) => ({
    name,
    industry: 'Custom',
    city: 'Milano'
  }))

  const allCompanies = [...custom, ...companies].reduce((acc, company) => {
    if (!acc.some((item) => item.name.toLowerCase() === company.name.toLowerCase())) {
      acc.push(company)
    }
    return acc
  }, [])

  return allCompanies.map((company, companyIndex) => {
    const jobs = roles.slice(0, 3).map((role, roleIndex) => {
      const base = Math.max(
        ...employees
          .filter((item) => item.ruolo === role)
          .map((item) => item.benchmark?.max || item.ral_attuale || 0)
      )
      const salary = base + 2500 + companyIndex * 1200 + roleIndex * 900
      const query = encodeURIComponent(`${role} ${company.city} salary`)
      return {
        id: `${company.name}-${roleIndex}`,
        role,
        city: company.city,
        salary,
        link: `https://www.linkedin.com/jobs/search/?keywords=${query}`
      }
    })
    return { ...company, jobs }
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
.header-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.secondary-btn {
  border: 1px solid var(--bs-gray-200);
  background: var(--bs-white);
  color: var(--bs-dark);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
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
.company-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.company-card {
  border: 1px solid var(--bs-gray-200);
  border-radius: 12px;
  background: var(--bs-gray-100);
  padding: 12px;
  display: grid;
  gap: 10px;
}
.company-header {
  display: grid;
  gap: 4px;
}
.company-name {
  font-weight: 700;
  color: var(--bs-dark);
}
.company-meta {
  font-size: 0.85rem;
  color: var(--bs-gray-700);
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
