<template>
S  <section class="page">
    <div class="card">
      <h2>Market Intelligence Feed</h2>
      <div class="feed">
        <div v-for="item in marketFeed" :key="item.id" class="feed-item">
          <span class="feed-icon">⚠️</span>
          <div>
            <div class="feed-title">{{ item.title }}</div>
            <div class="feed-subtitle">{{ item.detail }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const marketFeed = [
  {
    id: 'feed-1',
    title: 'ALERT: I salari per HR Business Partner a Milano sono aumentati del 10% nell’ultimo mese.',
    detail: '3 dei tuoi dipendenti sono ora fuori mercato.'
  },
  {
    id: 'feed-2',
    title: 'TREND: Il ruolo Data Analyst a Torino mostra un +6% su base trimestrale.',
    detail: 'Valuta adeguamenti per profili ad alte performance.'
  }
]
</script>

<style scoped>
.page { display: grid; gap: 16px; }
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
.feed {
  display: grid;
  gap: 12px;
  margin-top: 12px;
}
.feed-item {
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--bs-gray-200);
  border-radius: 10px;
  background: var(--bs-gray-100);
}
.feed-title {
  font-weight: 600;
  color: var(--bs-dark);
}
.feed-subtitle {
  color: var(--bs-gray-700);
  font-size: 0.9rem;
}
</style>

