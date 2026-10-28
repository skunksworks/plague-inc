<template>
  <div class="disease-container">
    <!-- Header with Virus Stats & DNA -->
    <div class="disease-header">
      <div class="header-left">
        <div class="virus-badge">☣️</div>
        <div>
          <h2 class="virus-title">{{ plagueStore.virusName }}</h2>
          <span class="virus-subtitle">Laboratoire d'évolution génétique</span>
        </div>
      </div>
      <div class="dna-pill">
        <span class="dna-icon">🧬</span>
        <span class="dna-count">{{ plagueStore.dnaPoints }}</span>
        <span class="dna-label">ADN</span>
      </div>
    </div>

    <!-- Virus Trait Gauges -->
    <div class="gauges-grid">
      <!-- Infectivity Gauge -->
      <div class="gauge-card infectivity">
        <div class="gauge-top">
          <span class="gauge-name">Infectiosité</span>
          <span class="gauge-val">{{ (plagueStore.infectivity * 10).toFixed(1) }}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill infectivity-fill"
            :style="{ width: Math.min(100, (plagueStore.infectivity / 4) * 100) + '%' }"
          ></div>
        </div>
        <span class="gauge-desc">Vitesse de propagation</span>
      </div>

      <!-- Severity Gauge -->
      <div class="gauge-card severity">
        <div class="gauge-top">
          <span class="gauge-name">Gravité</span>
          <span class="gauge-val">{{ (plagueStore.severity * 10).toFixed(1) }}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill severity-fill"
            :style="{ width: Math.min(100, (plagueStore.severity / 3) * 100) + '%' }"
          ></div>
        </div>
        <span class="gauge-desc">Vigilance & recherche</span>
      </div>

      <!-- Lethality Gauge -->
      <div class="gauge-card lethality">
        <div class="gauge-top">
          <span class="gauge-name">Létalité</span>
          <span class="gauge-val">{{ (plagueStore.lethality * 10).toFixed(1) }}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill lethality-fill"
            :style="{ width: Math.min(100, (plagueStore.lethality / 2.5) * 100) + '%' }"
          ></div>
        </div>
        <span class="gauge-desc">Taux de mortalité</span>
      </div>

      <!-- Cure Resistance Gauge -->
      <div class="gauge-card resistance">
        <div class="gauge-top">
          <span class="gauge-name">Résistance</span>
          <span class="gauge-val">{{ (plagueStore.cureResistance * 10).toFixed(1) }}</span>
        </div>
        <div class="progress-bar">
          <div
            class="progress-fill resistance-fill"
            :style="{ width: Math.min(100, (plagueStore.cureResistance / 3.5) * 100) + '%' }"
          ></div>
        </div>
        <span class="gauge-desc">Ralentissement du remède</span>
      </div>
    </div>

    <!-- Category Tabs -->
    <div class="tabs-row">
      <button
        class="tab-btn"
        :class="{ active: activeCategory === 'all' }"
        @click="activeCategory = 'all'"
      >
        Toutes ({{ plagueStore.modifications.length }})
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeCategory === 'transmission' }"
        @click="activeCategory = 'transmission'"
      >
        💨 Transmissions
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeCategory === 'symptom' }"
        @click="activeCategory = 'symptom'"
      >
        🤒 Symptômes
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeCategory === 'resistance' }"
        @click="activeCategory = 'resistance'"
      >
        🛡️ Résistances
      </button>
    </div>

    <!-- Modifications List -->
    <div class="modifications-list">
      <div
        v-for="mod in filteredModifications"
        :key="mod.id"
        class="mod-card"
        :class="{
          purchased: isPurchased(mod.id),
          affordable: !isPurchased(mod.id) && plagueStore.dnaPoints >= mod.cost
        }"
      >
        <div class="mod-info">
          <div class="mod-header">
            <span class="mod-cat-badge" :class="mod.category">
              {{ getCategoryLabel(mod.category) }}
            </span>
            <h4 class="mod-name">{{ mod.name }}</h4>
          </div>
          <p class="mod-desc">{{ mod.description }}</p>
          <div class="mod-effects">
            <span v-if="mod.effects.infectivity" class="effect-tag inf">
              Infectiosité x{{ mod.effects.infectivity }}
            </span>
            <span v-if="mod.effects.severity" class="effect-tag sev">
              Gravité x{{ mod.effects.severity }}
            </span>
            <span v-if="mod.effects.lethality" class="effect-tag let">
              Létalité x{{ mod.effects.lethality }}
            </span>
            <span v-if="mod.effects.cureResistance" class="effect-tag res">
              Anti-remède x{{ mod.effects.cureResistance }}
            </span>
          </div>
        </div>

        <div class="mod-action">
          <button v-if="isPurchased(mod.id)" class="btn-mod-bought" disabled>✓ Acquis</button>
          <button
            v-else
            class="btn-mod-buy"
            :disabled="plagueStore.dnaPoints < mod.cost"
            @click="buyModification(mod.id)"
          >
            <span>🧬 {{ mod.cost }} ADN</span>
            <small>Évoluer</small>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePlagueStore } from '../stores/plague'

const plagueStore = usePlagueStore()
const activeCategory = ref('all')

const filteredModifications = computed(() => {
  if (activeCategory.value === 'all') {
    return plagueStore.modifications
  }
  return plagueStore.modifications.filter((m) => m.category === activeCategory.value)
})

function isPurchased(id) {
  return plagueStore.purchasedModifications.includes(id)
}

function buyModification(id) {
  plagueStore.purchaseModification(id)
}

function getCategoryLabel(cat) {
  switch (cat) {
    case 'transmission':
      return 'Transmission'
    case 'symptom':
      return 'Symptôme'
    case 'resistance':
      return 'Résistance'
    default:
      return 'Mutation'
  }
}
</script>

<style scoped>
.disease-container {
  display: flex;
  flex-direction: column;
  background: #090d16;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px;
  color: #f1f5f9;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.disease-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.virus-badge {
  font-size: 1.8rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.virus-title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #f87171;
  letter-spacing: 0.5px;
}

.virus-subtitle {
  font-size: 0.75rem;
  color: #94a3b8;
}

.dna-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.4));
  border: 1px solid #38bdf8;
  padding: 6px 14px;
  border-radius: 20px;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}

.dna-icon {
  font-size: 1.2rem;
}

.dna-count {
  font-size: 1.25rem;
  font-weight: 800;
  color: #38bdf8;
}

.dna-label {
  font-size: 0.75rem;
  color: #bae6fd;
  text-transform: uppercase;
  font-weight: 600;
}

.gauges-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.gauge-card {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px 10px;
}

.gauge-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.gauge-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
}

.gauge-val {
  font-size: 0.85rem;
  font-weight: 700;
}

.progress-bar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.infectivity-fill {
  background: linear-gradient(90deg, #f97316, #ef4444);
}

.severity-fill {
  background: linear-gradient(90deg, #eab308, #f59e0b);
}

.lethality-fill {
  background: linear-gradient(90deg, #dc2626, #7f1d1d);
}

.resistance-fill {
  background: linear-gradient(90deg, #06b6d4, #3b82f6);
}

.gauge-desc {
  font-size: 0.65rem;
  color: #64748b;
  display: block;
}

.tabs-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 8px;
}

.tab-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
}

.tab-btn.active {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #fca5a5;
  font-weight: 600;
}

.modifications-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}

.mod-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px 14px;
  transition: all 0.2s ease;
}

.mod-card.affordable {
  border-color: rgba(56, 189, 248, 0.3);
  background: rgba(15, 23, 42, 0.9);
}

.mod-card.purchased {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(20, 83, 45, 0.15);
}

.mod-info {
  flex: 1;
  margin-right: 14px;
}

.mod-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.mod-name {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: #f8fafc;
}

.mod-cat-badge {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 700;
}

.mod-cat-badge.transmission {
  background: rgba(249, 115, 22, 0.2);
  color: #fb923c;
}

.mod-cat-badge.symptom {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.mod-cat-badge.resistance {
  background: rgba(14, 165, 233, 0.2);
  color: #38bdf8;
}

.mod-desc {
  margin: 0 0 6px 0;
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.3;
}

.mod-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.effect-tag {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
}

.effect-tag.inf {
  color: #fdba74;
}

.effect-tag.sev {
  color: #fde047;
}

.effect-tag.let {
  color: #fca5a5;
}

.effect-tag.res {
  color: #7dd3fc;
}

.btn-mod-buy {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  min-width: 90px;
  transition: all 0.2s ease;
}

.btn-mod-buy span {
  font-weight: 700;
  font-size: 0.85rem;
}

.btn-mod-buy small {
  font-size: 0.65rem;
  opacity: 0.85;
}

.btn-mod-buy:hover:not(:disabled) {
  filter: brightness(1.15);
  transform: translateY(-1px);
}

.btn-mod-buy:disabled {
  background: rgba(255, 255, 255, 0.08);
  color: #64748b;
  cursor: not-allowed;
}

.btn-mod-bought {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.4);
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 90px;
}

@media (max-width: 768px) {
  .gauges-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
