<script setup>
import Dashboard from '../components/Dashboard.vue'
import Map from '../components/Map.vue'
import DiseaseInfo from '../components/DiseaseInfo.vue'
</script>

<template>
  <main class="game-container">
    <!-- Top HUD and Global Controls -->
    <Dashboard />

    <!-- Center Section: World Map + Disease Lab -->
    <div class="game-content-grid">
      <section class="map-section">
        <Map />
      </section>

      <section class="lab-section">
        <DiseaseInfo />
      </section>
    </div>
  </main>
</template>

<style scoped>
.game-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.game-content-grid {
  display: grid;
  grid-template-columns: 1.55fr 1fr;
  gap: 16px;
  align-items: stretch;
}

.map-section {
  display: flex;
  flex-direction: column;
}

.lab-section {
  display: flex;
  flex-direction: column;
}

@media (max-width: 1100px) {
  .game-content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
