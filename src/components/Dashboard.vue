<template>
  <div class="dashboard-root">
    <!-- Top HUD Navigation / Bar -->
    <header class="hud-header">
      <!-- Virus Branding & Name -->
      <div class="hud-brand">
        <div class="bio-symbol">☣️</div>
        <div class="brand-text">
          <input
            v-if="plagueStore.status === 'setup'"
            v-model="plagueStore.virusName"
            class="virus-name-input"
            title="Nommer votre pathogène"
            placeholder="Nom du virus"
          />
          <span v-else class="virus-name-display">{{ plagueStore.virusName }}</span>
          <span class="virus-tag">Agent Biologique</span>
        </div>
      </div>

      <!-- Live Date & Day Counter -->
      <div class="hud-calendar">
        <div class="cal-day">Jour {{ plagueStore.gameDay }}</div>
        <div class="cal-date">{{ plagueStore.currentDateString }}</div>
      </div>

      <!-- Game Speed Controls -->
      <div class="hud-controls">
        <button
          class="speed-btn"
          :class="{ active: plagueStore.status === 'paused' }"
          title="Pause"
          @click="setSpeed(0)"
        >
          ⏸️
        </button>
        <button
          class="speed-btn"
          :class="{ active: plagueStore.status === 'running' && plagueStore.gameSpeed === 1 }"
          title="Vitesse Normale"
          @click="setSpeed(1)"
        >
          ▶️ 1x
        </button>
        <button
          class="speed-btn"
          :class="{ active: plagueStore.status === 'running' && plagueStore.gameSpeed === 2 }"
          title="Vitesse Rapide"
          @click="setSpeed(2)"
        >
          ⏩ 2x
        </button>
        <button
          class="speed-btn"
          :class="{ active: plagueStore.status === 'running' && plagueStore.gameSpeed === 3 }"
          title="Vitesse Maximale"
          @click="setSpeed(3)"
        >
          ⏭️ 3x
        </button>
      </div>

      <!-- Reset Game & Actions -->
      <div class="hud-actions">
        <button
          v-if="plagueStore.status === 'running'"
          class="btn btn-outline-warning"
          title="Provoquer une catastrophe naturelle impromptue"
          @click="plagueStore.triggerNaturalDisaster()"
        >
          🌪️ Catastrophe
        </button>
        <button class="btn btn-outline-danger" @click="confirmReset">🔄 Réinitialiser</button>
      </div>
    </header>

    <!-- Global Key Metrics Cards -->
    <div class="metrics-grid">
      <!-- Total Infected -->
      <div class="metric-card infected">
        <div class="metric-header">
          <span class="metric-icon">🦠</span>
          <span class="metric-title">Infectés</span>
        </div>
        <div class="metric-value text-red">
          {{ plagueStore.numberOfInfected.toLocaleString('fr-FR') }}
        </div>
        <div class="metric-bar">
          <div
            class="metric-bar-fill red"
            :style="{ width: plagueStore.infectedPercentage + '%' }"
          ></div>
        </div>
        <div class="metric-sub">
          {{ plagueStore.infectedPercentage.toFixed(2) }}% de la population mondiale
        </div>
      </div>

      <!-- Total Deaths -->
      <div class="metric-card dead">
        <div class="metric-header">
          <span class="metric-icon">💀</span>
          <span class="metric-title">Morts</span>
        </div>
        <div class="metric-value text-dark-red">
          {{ plagueStore.totalDead.toLocaleString('fr-FR') }}
        </div>
        <div class="metric-bar">
          <div
            class="metric-bar-fill dark-red"
            :style="{ width: plagueStore.deadPercentage + '%' }"
          ></div>
        </div>
        <div class="metric-sub">
          Létalité actuelle :
          {{
            (
              (plagueStore.totalDead /
                (plagueStore.numberOfInfected + plagueStore.totalDead || 1)) *
              100
            ).toFixed(2)
          }}%
        </div>
      </div>

      <!-- World Cure Progress -->
      <div class="metric-card cure">
        <div class="metric-header">
          <span class="metric-icon">🧪</span>
          <span class="metric-title">Recherche du Remède</span>
          <span v-if="plagueStore.cureActive" class="cure-speed-badge">
            +{{ (plagueStore.dailyCureSpeed * 10).toFixed(2) }}%/j
          </span>
        </div>
        <div class="metric-value text-blue">{{ plagueStore.cureProgress.toFixed(1) }}%</div>
        <div class="metric-bar">
          <div
            class="metric-bar-fill blue"
            :style="{ width: plagueStore.cureProgress + '%' }"
          ></div>
        </div>
        <div class="metric-sub">
          <div v-if="plagueStore.cureActive" class="medical-capacity-info">
            <span class="cap-label">🩺 Capacité labos :</span>
            <span class="cap-val" :class="plagueStore.medicalStatusClass">
              {{ plagueStore.medicalCapacity }}%
            </span>
          </div>
          <div v-if="plagueStore.cureActive && plagueStore.cureSlowdownPercentage > 0" class="cap-penalty">
            ⚠️ Ralenti de -{{ plagueStore.cureSlowdownPercentage }}% (décès de médecins)
          </div>
          <div v-else class="cap-status">
            {{
              plagueStore.cureActive
                ? plagueStore.medicalStatus
                : "Aucune alerte OMS pour l'instant"
            }}
          </div>
        </div>
      </div>

      <!-- DNA Points Available -->
      <div class="metric-card dna">
        <div class="metric-header">
          <span class="metric-icon">🧬</span>
          <span class="metric-title">Points ADN</span>
        </div>
        <div class="metric-value text-cyan">
          {{ plagueStore.dnaPoints }}
        </div>
        <div class="metric-sub">Collectez de l'ADN en propageant l'infection</div>
      </div>
    </div>

    <!-- Active Natural Disasters Banner -->
    <div
      v-if="plagueStore.activeDisasters && plagueStore.activeDisasters.length > 0"
      class="disaster-banner"
    >
      <div class="disaster-banner-header">
        <span class="disaster-radar-ping"></span>
        <span class="disaster-banner-title">⚠️ ALERTES CATASTROPHES NATURELLES EN COURS ({{ plagueStore.activeDisasters.length }})</span>
      </div>
      <div class="disaster-banner-grid">
        <div
          v-for="disaster in plagueStore.activeDisasters"
          :key="disaster.id"
          class="disaster-card"
        >
          <div class="disaster-icon-box">{{ disaster.icon }}</div>
          <div class="disaster-content">
            <div class="disaster-header-line">
              <span class="disaster-name">{{ disaster.name }}</span>
              <span class="disaster-country">📍 {{ disaster.countryNameFr }}</span>
              <span class="disaster-countdown">⏱️ {{ disaster.daysRemaining }} j restants</span>
            </div>
            <div class="disaster-desc">{{ disaster.description }}</div>
            <div class="disaster-tags">
              <span class="d-tag d-tag-death">💀 {{ disaster.directDeaths.toLocaleString('fr-FR') }} victimes</span>
              <span class="d-tag d-tag-transmission">⚡ Propagation x{{ disaster.infectivityMultiplier }}</span>
              <span v-if="disaster.borderLock" class="d-tag d-tag-border">🚫 Frontières et liaisons coupées</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Patient Zero Selector (During Setup Phase) -->
    <div v-if="plagueStore.status === 'setup'" class="setup-banner">
      <div class="setup-icon">🎯</div>
      <div class="setup-content">
        <h3>Choisir le pays d'origine du Patient Zéro</h3>
        <p>
          Sélectionnez une nation dans la liste ou cliquez directement sur un pays sur la carte
          ci-dessous.
        </p>
        <div class="setup-form">
          <select v-model="selectedStartCountry" class="country-select">
            <option :value="null" disabled>Sélectionner un pays de départ...</option>
            <option v-for="c in plagueStore.countries" :key="c.name" :value="c.name">
              {{ c.name_fr || c.name }} ({{ c.population.toLocaleString('fr-FR') }} hab.)
            </option>
          </select>
          <button class="btn btn-start" :disabled="!selectedStartCountry" @click="startInfection">
            ☣️ Lancer la Pandémie
          </button>
        </div>
      </div>
    </div>

    <!-- Breaking News Live Ticker -->
    <div class="news-ticker">
      <div class="news-badge"><span class="pulse-dot"></span> FLASH INFO</div>
      <div class="news-marquee">
        <span class="news-text">{{ currentHeadline }}</span>
      </div>
      <button class="news-history-toggle" @click="showHistory = !showHistory">
        Historique ({{ plagueStore.newsFeed.length }})
      </button>
    </div>

    <!-- News History Drawer Modal -->
    <div v-if="showHistory" class="news-history-modal" @click.self="showHistory = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>📰 Historique des actualités mondiales</h3>
          <button class="modal-close" @click="showHistory = false">✕</button>
        </div>
        <div class="modal-body">
          <div
            v-for="item in plagueStore.newsFeed"
            :key="item.id"
            class="news-history-item"
            :class="item.type"
          >
            <span class="history-day">Jour {{ item.day }}</span>
            <span class="history-text">{{ item.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- End Game Overlays -->
    <div v-if="plagueStore.status === 'won'" class="endgame-modal won">
      <div class="endgame-content">
        <div class="endgame-icon">🏆</div>
        <h2>VICTOIRE TOTALE</h2>
        <p>
          Votre pathogène <strong>{{ plagueStore.virusName }}</strong> a éradiqué l'humanité entière
          en <strong>{{ plagueStore.gameDay }} jours</strong> !
        </p>
        <button class="btn btn-lg btn-danger" @click="plagueStore.resetGame()">
          Recommencer une partie
        </button>
      </div>
    </div>

    <div v-if="plagueStore.status === 'lost'" class="endgame-modal lost">
      <div class="endgame-content">
        <div class="endgame-icon">💉</div>
        <h2>ÉCHEC : REMÈDE DÉPLOYÉ</h2>
        <p>
          L'humanité a réussi à synthétiser et distribuer un remède à 100% au jour
          <strong>{{ plagueStore.gameDay }}</strong
          >. Le virus a été éradiqué.
        </p>
        <button class="btn btn-lg btn-primary" @click="plagueStore.resetGame()">
          Tenter une nouvelle souche
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { usePlagueStore } from '../stores/plague'

const plagueStore = usePlagueStore()
const selectedStartCountry = ref(null)
const showHistory = ref(false)
let simulationInterval = null

// Synchroniser la sélection si faite sur la carte
watch(
  () => plagueStore.firstInfected,
  (val) => {
    if (val) {
      selectedStartCountry.value = val
    }
  }
)

const currentHeadline = computed(() => {
  return plagueStore.newsFeed.length > 0
    ? plagueStore.newsFeed[0].text
    : "En attente d'événements..."
})

function setSpeed(speed) {
  plagueStore.setGameSpeed(speed)
  restartTimer()
}

function startInfection() {
  if (selectedStartCountry.value) {
    plagueStore.startGame(selectedStartCountry.value)
    restartTimer()
  }
}

function confirmReset() {
  if (confirm('Voulez-vous vraiment recommencer une nouvelle partie ?')) {
    plagueStore.resetGame()
    selectedStartCountry.value = null
    restartTimer()
  }
}

// Gestion de la boucle de simulation
function restartTimer() {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }

  if (plagueStore.status === 'running' && plagueStore.gameSpeed > 0) {
    // 1x = 1000ms, 2x = 450ms, 3x = 180ms
    const intervalMs = plagueStore.gameSpeed === 1 ? 1000 : plagueStore.gameSpeed === 2 ? 450 : 180
    simulationInterval = setInterval(() => {
      plagueStore.tick()
    }, intervalMs)
  }
}

onMounted(() => {
  restartTimer()
})

onBeforeUnmount(() => {
  if (simulationInterval) {
    clearInterval(simulationInterval)
  }
})
</script>

<style scoped>
.dashboard-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hud-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 18px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.hud-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bio-symbol {
  font-size: 2rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.virus-name-input {
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #f87171;
  font-size: 1.15rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
  outline: none;
}

.virus-name-input:focus {
  border-color: #ef4444;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
}

.virus-name-display {
  font-size: 1.25rem;
  font-weight: 800;
  color: #f87171;
}

.virus-tag {
  font-size: 0.7rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.hud-calendar {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 16px;
  border-radius: 8px;
}

.cal-day {
  font-size: 1rem;
  font-weight: 800;
  color: #f1f5f9;
}

.cal-date {
  font-size: 0.75rem;
  color: #94a3b8;
}

.hud-controls {
  display: flex;
  gap: 6px;
  background: rgba(15, 23, 42, 0.8);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.speed-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.speed-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
}

.speed-btn.active {
  background: #3b82f6;
  color: white;
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.hud-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-outline-warning {
  background: transparent;
  border: 1px solid rgba(245, 158, 11, 0.5);
  color: #fbbf24;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-outline-warning:hover {
  background: rgba(245, 158, 11, 0.15);
  border-color: #f59e0b;
}

.btn-outline-danger {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #f87171;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-outline-danger:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.metric-card {
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.metric-icon {
  font-size: 1.1rem;
}

.metric-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 6px;
  font-variant-numeric: tabular-nums;
}

.text-red {
  color: #f87171;
}
.text-dark-red {
  color: #e2e8f0;
}
.text-blue {
  color: #38bdf8;
}
.text-cyan {
  color: #22d3ee;
}

.metric-bar {
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}

.metric-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.metric-bar-fill.red {
  background: linear-gradient(90deg, #f87171, #dc2626);
}
.metric-bar-fill.dark-red {
  background: linear-gradient(90deg, #94a3b8, #475569);
}
.metric-bar-fill.blue {
  background: linear-gradient(90deg, #38bdf8, #0284c7);
}

.metric-sub {
  font-size: 0.7rem;
  color: #64748b;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cure-speed-badge {
  margin-left: auto;
  font-size: 0.65rem;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 700;
}

.medical-capacity-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cap-val {
  font-weight: 700;
}

.cap-val.operational {
  color: #4ade80;
}

.cap-val.strained {
  color: #fbbf24;
}

.cap-val.crisis {
  color: #f87171;
}

.cap-val.collapsed {
  color: #c084fc;
}

.cap-penalty {
  color: #f87171;
  font-size: 0.65rem;
  font-weight: 600;
}

/* Setup Banner */
.setup-banner {
  display: flex;
  align-items: center;
  gap: 16px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 23, 42, 0.9));
  border: 1px solid rgba(239, 68, 68, 0.4);
  padding: 16px 20px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.2);
}

.setup-icon {
  font-size: 2.2rem;
}

.setup-content {
  flex: 1;
}

.setup-content h3 {
  margin: 0 0 4px 0;
  font-size: 1.05rem;
  color: #f8fafc;
}

.setup-content p {
  margin: 0 0 10px 0;
  font-size: 0.8rem;
  color: #cbd5e1;
}

.setup-form {
  display: flex;
  gap: 10px;
}

.country-select {
  flex: 1;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f1f5f9;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  outline: none;
}

.btn-start {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  color: white;
  border: none;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-start:hover:not(:disabled) {
  filter: brightness(1.15);
  box-shadow: 0 0 14px rgba(239, 68, 68, 0.6);
}

.btn-start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Natural Disasters Banner */
.disaster-banner {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(15, 23, 42, 0.95));
  border: 1px solid rgba(249, 115, 22, 0.5);
  border-radius: 10px;
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(249, 115, 22, 0.25);
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: disasterGlow 3s infinite ease-in-out;
}

@keyframes disasterGlow {
  0%, 100% {
    border-color: rgba(249, 115, 22, 0.4);
    box-shadow: 0 4px 18px rgba(249, 115, 22, 0.2);
  }
  50% {
    border-color: rgba(249, 115, 22, 0.8);
    box-shadow: 0 4px 26px rgba(249, 115, 22, 0.4);
  }
}

.disaster-banner-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.disaster-radar-ping {
  width: 8px;
  height: 8px;
  background: #f97316;
  border-radius: 50%;
  box-shadow: 0 0 10px #f97316;
  animation: disasterPing 1.4s infinite ease-out;
}

@keyframes disasterPing {
  0% {
    transform: scale(0.9);
    opacity: 1;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

.disaster-banner-title {
  font-size: 0.75rem;
  font-weight: 800;
  color: #fb923c;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}

.disaster-banner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 10px;
}

.disaster-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px 12px;
}

.disaster-icon-box {
  font-size: 1.8rem;
  line-height: 1;
  padding: 6px;
  background: rgba(249, 115, 22, 0.15);
  border: 1px solid rgba(249, 115, 22, 0.3);
  border-radius: 8px;
}

.disaster-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.disaster-header-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.disaster-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: #f8fafc;
}

.disaster-country {
  font-size: 0.8rem;
  font-weight: 600;
  color: #cbd5e1;
}

.disaster-countdown {
  margin-left: auto;
  font-size: 0.75rem;
  color: #fbbf24;
  font-weight: 700;
  background: rgba(245, 158, 11, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
}

.disaster-desc {
  font-size: 0.75rem;
  color: #94a3b8;
  line-height: 1.35;
}

.disaster-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.d-tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.d-tag-death {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.d-tag-transmission {
  background: rgba(249, 115, 22, 0.15);
  color: #fb923c;
  border: 1px solid rgba(249, 115, 22, 0.3);
}

.d-tag-border {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

/* News Ticker */
.news-ticker {
  display: flex;
  align-items: center;
  background: #090d16;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 6px 12px;
  gap: 12px;
}

.news-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #f87171;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.pulse-dot {
  width: 6px;
  height: 6px;
  background: #ef4444;
  border-radius: 50%;
  animation: pulse 1.2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.4);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0.7;
  }
}

.news-marquee {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  font-size: 0.85rem;
  color: #e2e8f0;
}

.news-history-toggle {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94a3b8;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.news-history-toggle:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #f1f5f9;
}

/* History Modal */
.news-history-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-card {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.15);
  width: 90%;
  max-width: 550px;
  max-height: 70vh;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #f1f5f9;
}

.modal-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 1.1rem;
  cursor: pointer;
}

.modal-body {
  padding: 12px 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.news-history-item {
  display: flex;
  gap: 10px;
  font-size: 0.8rem;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border-left: 3px solid #64748b;
}

.news-history-item.danger {
  border-left-color: #ef4444;
}

.news-history-item.warning {
  border-left-color: #f59e0b;
}

.news-history-item.info {
  border-left-color: #38bdf8;
}

.history-day {
  font-weight: 700;
  color: #94a3b8;
  min-width: 60px;
}

.history-text {
  color: #e2e8f0;
}

/* End Game Overlay */
.endgame-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.endgame-content {
  background: #090d16;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  max-width: 480px;
  box-shadow: 0 10px 50px rgba(0, 0, 0, 0.8);
}

.endgame-modal.won .endgame-content {
  border: 2px solid #ef4444;
  box-shadow: 0 0 40px rgba(239, 68, 68, 0.4);
}

.endgame-modal.lost .endgame-content {
  border: 2px solid #38bdf8;
  box-shadow: 0 0 40px rgba(56, 189, 248, 0.4);
}

.endgame-icon {
  font-size: 3.5rem;
  margin-bottom: 12px;
}

.endgame-content h2 {
  font-size: 1.8rem;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.endgame-modal.won h2 {
  color: #ef4444;
}
.endgame-modal.lost h2 {
  color: #38bdf8;
}

.endgame-content p {
  color: #cbd5e1;
  font-size: 1rem;
  margin-bottom: 24px;
  line-height: 1.5;
}

.btn-lg {
  padding: 12px 28px;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: white;
}

@media (max-width: 900px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
