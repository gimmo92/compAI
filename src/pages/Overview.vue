<template>
  <section class="page">
    <h1 class="page-title">Overview</h1>
    <p class="page-desc">Stato generale del modulo Salary Review AI.</p>
    <div class="card-grid">
      <div class="card">
        <h2>Prossimo ciclo</h2>
        <p>Imposta date, criteri e platea.</p>
      </div>
      <div class="card">
        <h2>Copertura budget</h2>
        <p>Distribuzione proposte vs budget assegnato.</p>
      </div>
      <div class="card">
        <h2>Qualità suggerimenti AI</h2>
        <p>Accuratezza e adozione dei suggerimenti.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.page-title { margin: 0; color: var(--bs-dark); }
.page-desc { margin: 0; color: var(--bs-gray-700); }
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}
.card {
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  padding: 16px;
}
.card h2 {
  margin: 0 0 6px;
  font-size: 1rem;
  color: var(--bs-dark);
}
.card p {
  margin: 0;
  color: var(--bs-body-color);
}
</style>

