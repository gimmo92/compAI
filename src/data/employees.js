const baseEmployees = [
  {
    id: 'emp-001',
    nome: 'Giulia Rinaldi',
    ruolo: 'HR Business Partner',
    dipartimento: 'People',
    performance_score: 5,
    ral_attuale: 42000,
    benchmark: { min: 45000, med: 52000, max: 60000 },
    city: 'Milano',
    source_link: 'https://www.linkedin.com/jobs/search/?keywords=HR%20Business%20Partner%20Milano'
  },
  {
    id: 'emp-002',
    nome: 'Marco Ferri',
    ruolo: 'Data Analyst',
    dipartimento: 'People Analytics',
    performance_score: 4,
    ral_attuale: 38000,
    benchmark: { min: 40000, med: 47000, max: 55000 },
    city: 'Torino',
    source_link: 'https://www.indeed.com/jobs?q=Data%20Analyst&l=Torino'
  },
  {
    id: 'emp-003',
    nome: 'Sara Conti',
    ruolo: 'Compensation & Benefits Specialist',
    dipartimento: 'Rewards',
    performance_score: 5,
    ral_attuale: 46000,
    benchmark: { min: 50000, med: 58000, max: 67000 },
    city: 'Roma',
    source_link: 'https://www.linkedin.com/jobs/search/?keywords=Compensation%20Benefits%20Specialist%20Roma'
  },
  {
    id: 'emp-004',
    nome: 'Luca Greco',
    ruolo: 'Software Engineer',
    dipartimento: 'Engineering',
    performance_score: 3,
    ral_attuale: 52000,
    benchmark: { min: 48000, med: 56000, max: 68000 },
    city: 'Bologna',
    source_link: 'https://www.indeed.com/jobs?q=Software%20Engineer&l=Bologna'
  },
  {
    id: 'emp-005',
    nome: 'Alessia Villa',
    ruolo: 'Product Manager',
    dipartimento: 'Product',
    performance_score: 5,
    ral_attuale: 60000,
    benchmark: { min: 62000, med: 70000, max: 82000 },
    city: 'Milano',
    source_link: 'https://www.linkedin.com/jobs/search/?keywords=Product%20Manager%20Milano'
  },
  {
    id: 'emp-006',
    nome: 'Davide Ricci',
    ruolo: 'UX Designer',
    dipartimento: 'Design',
    performance_score: 4,
    ral_attuale: 41000,
    benchmark: { min: 42000, med: 48000, max: 56000 },
    city: 'Firenze',
    source_link: 'https://www.indeed.com/jobs?q=UX%20Designer&l=Firenze'
  },
  {
    id: 'emp-007',
    nome: 'Elisa Bianchi',
    ruolo: 'Payroll Specialist',
    dipartimento: 'Operations',
    performance_score: 2,
    ral_attuale: 32000,
    benchmark: { min: 30000, med: 36000, max: 43000 },
    city: 'Padova',
    source_link: 'https://www.linkedin.com/jobs/search/?keywords=Payroll%20Specialist%20Padova'
  },
  {
    id: 'emp-008',
    nome: 'Paolo Neri',
    ruolo: 'Talent Acquisition Lead',
    dipartimento: 'People',
    performance_score: 4,
    ral_attuale: 47000,
    benchmark: { min: 52000, med: 60000, max: 70000 },
    city: 'Milano',
    source_link: 'https://www.linkedin.com/jobs/search/?keywords=Talent%20Acquisition%20Lead%20Milano'
  }
]

export const employees = baseEmployees.map((employee) => {
  const rischio_turnover =
    employee.ral_attuale < employee.benchmark.med && employee.performance_score > 3
      ? 'alto'
      : 'basso'
  return { ...employee, rischio_turnover }
})

export const formatCurrency = (value) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)

export const calcSuggestedRaise = (employee) =>
  Math.max(0, employee.benchmark.med - employee.ral_attuale)

export const calcRetentionCost = (employee) => employee.ral_attuale * 1.5

export const calcRetentionROI = (employee) => {
  const raise = calcSuggestedRaise(employee)
  return calcRetentionCost(employee) - raise
}

export const getPriorityScore = (employee) => {
  const gap = employee.benchmark.med - employee.ral_attuale
  const perfBoost = employee.performance_score > 4 ? 2 : employee.performance_score > 3 ? 1 : 0
  const gapScore = gap > 8000 ? 3 : gap > 4000 ? 2 : gap > 1000 ? 1 : 0
  return perfBoost + gapScore
}

