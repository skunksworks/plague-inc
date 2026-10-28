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
            :style="{ width: Math.min(100, (plagueStore.infectivity / 5) * 100) + '%' }"
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
            :style="{ width: Math.min(100, (plagueStore.severity / 4) * 100) + '%' }"
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
            :style="{ width: Math.min(100, (plagueStore.lethality / 3.5) * 100) + '%' }"
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
            :style="{ width: Math.min(100, (plagueStore.cureResistance / 4.5) * 100) + '%' }"
          ></div>
        </div>
        <span class="gauge-desc">Ralentissement du remède</span>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="search-toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Rechercher une mutation (ex: Air, Froid, Poumons...)"
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">✕</button>
      </div>

      <div class="sort-box">
        <select v-model="sortBy" class="sort-select">
          <option value="tree">🌳 Ordre naturel</option>
          <option value="cost-asc">🧬 Coût ADN (croissant)</option>
          <option value="cost-desc">🧬 Coût ADN (décroissant)</option>
          <option value="inf">💨 Infectiosité</option>
          <option value="let">💀 Létalité</option>
          <option value="res">🛡️ Anti-remède</option>
        </select>
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
        🛡️ Capacités
      </button>
    </div>

    <!-- Status Filters (Disponibles, Acquises, Bloquées) -->
    <div class="status-filters">
      <button
        class="chip-btn"
        :class="{ active: statusFilter === 'all' }"
        @click="statusFilter = 'all'"
      >
        Tous les statuts
      </button>
      <button
        class="chip-btn"
        :class="{ active: statusFilter === 'available' }"
        @click="statusFilter = 'available'"
      >
        🟢 Prêtes à évoluer ({{ availableCount }})
      </button>
      <button
        class="chip-btn"
        :class="{ active: statusFilter === 'purchased' }"
        @click="statusFilter = 'purchased'"
      >
        ✅ Acquises ({{ plagueStore.purchasedModifications.length }})
      </button>
      <button
        class="chip-btn"
        :class="{ active: statusFilter === 'locked' }"
        @click="statusFilter = 'locked'"
      >
        🔒 Verrouillées ({{ lockedCount }})
      </button>
    </div>

    <!-- Modifications List -->
    <div class="modifications-list">
      <div v-if="filteredModifications.length === 0" class="no-results">
        <span>🧬 Aucune mutation ne correspond à votre recherche.</span>
      </div>

      <div
        v-for="mod in filteredModifications"
        :key="mod.id"
        class="mod-card"
        :class="{
          purchased: isPurchased(mod.id),
          affordable: canPurchase(mod.id),
          locked: isLocked(mod.id)
        }"
      >
        <div class="mod-icon-wrapper">
          <span class="mod-icon">{{ mod.icon || '🧬' }}</span>
        </div>

        <div class="mod-info">
          <div class="mod-header">
            <span class="mod-cat-badge" :class="mod.category">
              {{ getCategoryLabel(mod.category) }}
            </span>
            <h4 class="mod-name">{{ mod.name }}</h4>

            <!-- Prerequisites indicator -->
            <span v-if="isLocked(mod.id)" class="prereq-badge">
              🔒 Requis : {{ getMissingPrereqsNames(mod) }}
            </span>
          </div>

          <p class="mod-desc">{{ mod.description }}</p>

          <div class="mod-effects">
            <span v-if="mod.effects.infectivity" class="effect-tag inf">
              Infectiosité x{{ mod.effects.infectivity }}
            </span>
            <span v-if="mod.effects.severity" class="effect-tag sev">
              Gravité x{{ mod.effects.severity }}
            </span>
            <span v-if="mod.effects.lethality && mod.effects.lethality > 1.0" class="effect-tag let">
              Létalité x{{ mod.effects.lethality }}
            </span>
            <span v-if="mod.effects.cureResistance" class="effect-tag res">
              Anti-remède x{{ mod.effects.cureResistance }}
            </span>
          </div>
        </div>

        <!-- Action Buttons (Evolve / Devolve) -->
        <div class="mod-actions">
          <template v-if="isPurchased(mod.id)">
            <div class="purchased-box">
              <span class="tag-bought">✓ Acquis</span>
              <button
                class="btn-devolve"
                :title="
                  canDevolve(mod.id)
                    ? 'Dévouer cette mutation pour récupérer des points ADN'
                    : 'Impossible : une autre mutation acquise dépend de celle-ci'
                "
                :disabled="!canDevolve(mod.id)"
                @click="devolveMod(mod.id)"
              >
                ↩ Dévouer (+{{ Math.max(1, Math.floor(mod.cost * 0.5)) }} ADN)
              </button>
            </div>
          </template>

          <template v-else-if="isLocked(mod.id)">
            <button class="btn-mod-locked" disabled>
              <span>🔒 Verrouillé</span>
              <small>{{ mod.cost }} ADN</small>
            </button>
          </template>

          <template v-else>
            <button
              class="btn-mod-buy"
              :disabled="plagueStore.dnaPoints < mod.cost"
              @click="buyMod(mod.id)"
            >
              <span>🧬 {{ mod.cost }} ADN</span>
              <small>{{ plagueStore.dnaPoints >= mod.cost ? 'Évoluer' : 'Points insuffisants' }}</small>
            </button>
          </template>
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
const statusFilter = ref('all')
const searchQuery = ref('')
const sortBy = ref('tree')

function isPurchased(id) {
  return plagueStore.purchasedModifications.includes(id)
}

function isLocked(mod) {
  const m = typeof mod === 'object' ? mod : plagueStore.modifications.find((x) => x.id === mod)
  if (!m || isPurchased(m.id)) return false
  if (!m.prerequisites || m.prerequisites.length === 0) return false
  return !m.prerequisites.every((reqId) => plagueStore.purchasedModifications.includes(reqId))
}

function canPurchase(id) {
  return plagueStore.canPurchaseModification(id)
}

function canDevolve(id) {
  return plagueStore.canDevolveModification(id)
}

function buyMod(id) {
  plagueStore.purchaseModification(id)
}

function devolveMod(id) {
  plagueStore.devolveModification(id)
}

function getMissingPrereqsNames(mod) {
  if (!mod.prerequisites) return ''
  const missingIds = mod.prerequisites.filter(
    (id) => !plagueStore.purchasedModifications.includes(id)
  )
  return missingIds
    .map((id) => {
      const found = plagueStore.modifications.find((x) => x.id === id)
      return found ? found.name : 'Prérequis'
    })
    .join(', ')
}

const availableCount = computed(() => {
  return plagueStore.modifications.filter((m) => canPurchase(m.id)).length
})

const lockedCount = computed(() => {
  return plagueStore.modifications.filter((m) => isLocked(m)).length
})

const filteredModifications = computed(() => {
  let list = plagueStore.modifications

  // Filtre catégorie
  if (activeCategory.value !== 'all') {
    list = list.filter((m) => m.category === activeCategory.value)
  }

  // Filtre statut
  if (statusFilter.value === 'available') {
    list = list.filter((m) => canPurchase(m.id))
  } else if (statusFilter.value === 'purchased') {
    list = list.filter((m) => isPurchased(m.id))
  } else if (statusFilter.value === 'locked') {
    list = list.filter((m) => isLocked(m))
  }

  // Recherche textuelle
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter((m) => {
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      )
    })
  }

  // Tri
  return [...list].sort((a, b) => {
    if (sortBy.value === 'cost-asc') return a.cost - b.cost
    if (sortBy.value === 'cost-desc') return b.cost - a.cost
    if (sortBy.value === 'inf') {
      const aInf = a.effects?.infectivity || 1
      const bInf = b.effects?.infectivity || 1
      return bInf - aInf
    }
    if (sortBy.value === 'let') {
      const aLet = a.effects?.lethality || 1
      const bLet = b.effects?.lethality || 1
      return bLet - aLet
    }
    if (sortBy.value === 'res') {
      const aRes = a.effects?.cureResistance || 1
      const bRes = b.effects?.cureResistance || 1
      return bRes - aRes
    }
    return a.id - b.id
  })
})

function getCategoryLabel(cat) {
  switch (cat) {
    case 'transmission':
      return 'Transmission'
    case 'symptom':
      return 'Symptôme'
    case 'resistance':
      return 'Capacité'
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
  margin-bottom: 14px;
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
  margin-bottom: 14px;
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

/* Search & Sort Toolbar */
.search-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.search-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 0.85rem;
  color: #94a3b8;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 8px 30px 8px 32px;
  color: #f8fafc;
  font-size: 0.8rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
}

.search-clear {
  position: absolute;
  right: 8px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 0.8rem;
}

.search-clear:hover {
  color: #fff;
}

.sort-select {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  padding: 8px 10px;
  color: #cbd5e1;
  font-size: 0.75rem;
  outline: none;
  cursor: pointer;
}

/* Category Tabs */
.tabs-row {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 8px;
}

.tab-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
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
  font-weight: 700;
}

/* Status Chips */
.status-filters {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.chip-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.chip-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

.chip-btn.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #7dd3fc;
  font-weight: 600;
}

/* Modifications List */
.modifications-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.no-results {
  text-align: center;
  padding: 32px 16px;
  color: #64748b;
  font-size: 0.85rem;
}

.mod-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 10px 12px;
  transition: all 0.2s ease;
}

.mod-card.affordable {
  border-color: rgba(56, 189, 248, 0.35);
  background: rgba(15, 23, 42, 0.9);
}

.mod-card.purchased {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(20, 83, 45, 0.15);
}

.mod-card.locked {
  opacity: 0.65;
  border-color: rgba(255, 255, 255, 0.04);
}

.mod-icon-wrapper {
  font-size: 1.6rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  flex-shrink: 0;
}

.mod-info {
  flex: 1;
}

.mod-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.mod-name {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #f8fafc;
}

.mod-cat-badge {
  font-size: 0.62rem;
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

.prereq-badge {
  font-size: 0.65rem;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.mod-desc {
  margin: 0 0 6px 0;
  font-size: 0.72rem;
  color: #94a3b8;
  line-height: 1.3;
}

.mod-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.effect-tag {
  font-size: 0.62rem;
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

.mod-actions {
  flex-shrink: 0;
}

.btn-mod-buy {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  min-width: 95px;
  transition: all 0.2s ease;
}

.btn-mod-buy span {
  font-weight: 700;
  font-size: 0.8rem;
}

.btn-mod-buy small {
  font-size: 0.62rem;
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

.btn-mod-locked {
  background: rgba(255, 255, 255, 0.04);
  color: #64748b;
  border: 1px dashed rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 8px;
  min-width: 95px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 0.75rem;
  cursor: not-allowed;
}

.btn-mod-locked small {
  font-size: 0.62rem;
}

.purchased-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: stretch;
}

.tag-bought {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.4);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-align: center;
}

.btn-devolve {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  padding: 3px 6px;
  border-radius: 5px;
  font-size: 0.65rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-devolve:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
}

.btn-devolve:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: rgba(255, 255, 255, 0.1);
  color: #64748b;
}

@media (max-width: 768px) {
  .gauges-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
