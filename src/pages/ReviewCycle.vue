<template>
  <section class="page">
    <h1 class="page-title">Cicli di Review</h1>
    <p class="page-desc">Crea e gestisci i cicli di salary review.</p>
    <div class="placeholder">
      <div class="empty-icon">📅</div>
      <div class="empty-title">Nessun ciclo attivo</div>
      <div class="empty-subtitle">Crea un nuovo ciclo per iniziare.</div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.page { display: grid; gap: 16px; }
.page-title { margin: 0; color: var(--bs-dark); }
.page-desc { margin: 0; color: var(--bs-gray-700); }
.placeholder {
  display: grid;
  gap: 8px;
  place-items: center;
  background: var(--bs-white);
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  padding: 40px 16px;
}
.empty-icon { font-size: 44px; color: var(--bs-gray-300); }
.empty-title { font-weight: 700; color: var(--bs-dark); }
.empty-subtitle { color: var(--bs-gray-700); }
</style>

