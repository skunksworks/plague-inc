<template>
  <div class="map-wrapper">
    <div class="map-header">
      <div class="map-title-bar">
        <h2>
          <span class="icon">🌍</span> Carte Mondiale Tactique
          <span v-if="plagueStore.status === 'setup'" class="badge badge-warning">
            Cliquez sur un pays pour choisir le Patient Zéro
          </span>
          <span v-else-if="plagueStore.status === 'running'" class="badge badge-danger">
            Propagation active ({{ plagueStore.infectedCountriesCount }} pays touchés)
          </span>
        </h2>
      </div>

      <!-- Quick country info bar if a country is selected -->
      <div v-if="selectedCountry" class="country-preview">
        <div class="cp-header">
          <strong>{{ selectedCountry.name_fr || selectedCountry.name }}</strong>
          <span class="cp-continent">{{ selectedCountry.continent }}</span>
          <button class="cp-close" @click="selectedCountry = null">✕</button>
        </div>
        <div class="cp-stats">
          <div class="cp-stat">
            <span class="lbl">Pop :</span>
            <span class="val">{{ selectedCountry.population.toLocaleString('fr-FR') }}</span>
          </div>
          <div class="cp-stat text-danger">
            <span class="lbl">Infectés :</span>
            <span class="val"
              >{{ selectedCountry.infected.toLocaleString('fr-FR') }} ({{
                ((selectedCountry.infected / selectedCountry.population) * 100).toFixed(2)
              }}%)</span
            >
          </div>
          <div class="cp-stat text-dead">
            <span class="lbl">Morts :</span>
            <span class="val">{{ selectedCountry.dead.toLocaleString('fr-FR') }}</span>
          </div>
          <div class="cp-stat text-success">
            <span class="lbl">Sains :</span>
            <span class="val">{{ selectedCountry.healthy.toLocaleString('fr-FR') }}</span>
          </div>
        </div>
        <div v-if="plagueStore.status === 'setup'" class="cp-action">
          <button class="btn btn-sm btn-danger" @click="startInfectionHere(selectedCountry.name)">
            ☣️ Lancer l'infection ici
          </button>
        </div>
      </div>
    </div>

    <!-- Leaflet container -->
    <div ref="mapContainer" class="leaflet-map"></div>

    <!-- Map Legend -->
    <div class="map-legend">
      <div class="legend-item"><span class="legend-color healthy"></span> Sain</div>
      <div class="legend-item">
        <span class="legend-color infected-low"></span> Faible (&lt; 20%)
      </div>
      <div class="legend-item"><span class="legend-color infected-mid"></span> Moyen (20-60%)</div>
      <div class="legend-item">
        <span class="legend-color infected-high"></span> Sévère (&gt; 60%)
      </div>
      <div class="legend-item"><span class="legend-color dead"></span> Éradiqué</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { usePlagueStore } from '../stores/plague'

const plagueStore = usePlagueStore()
const mapContainer = ref(null)
let map = null
let geoJsonLayer = null
const selectedCountry = ref(null)
const bubbleMarkers = new Map()

// Style fonctionnel pour chaque pays selon son état d'infection
function getCountryStyle(feature) {
  const name = feature.properties?.name || feature.properties?.NAME
  const nameFr = feature.properties?.name_fr || feature.properties?.NAME_FR
  const data = plagueStore.countryData[name] || plagueStore.countryData[nameFr]

  if (!data || (data.infected === 0 && data.dead === 0)) {
    return {
      fillColor: '#1e293b',
      fillOpacity: 0.65,
      weight: 1,
      color: '#334155',
      dashArray: ''
    }
  }

  // Éradiqué (plus d'infectés ni sains, que des morts)
  if (data.healthy === 0 && data.infected === 0 && data.dead > 0) {
    return {
      fillColor: '#270808',
      fillOpacity: 0.9,
      weight: 1.5,
      color: '#581c1c'
    }
  }

  const ratio = data.infected / (data.population || 1)
  let fillColor = '#ef4444'
  let fillOpacity = 0.65

  if (ratio > 0.6) {
    fillColor = '#991b1b' // Rouge très sombre
    fillOpacity = 0.9
  } else if (ratio > 0.2) {
    fillColor = '#dc2626' // Rouge vif
    fillOpacity = 0.8
  } else if (ratio > 0.05) {
    fillColor = '#ef4444' // Rouge
    fillOpacity = 0.7
  } else {
    fillColor = '#f87171' // Rouge clair
    fillOpacity = 0.65
  }

  return {
    fillColor,
    fillOpacity,
    weight: 1,
    color: '#7f1d1d'
  }
}

// Rafraîchir les couleurs de la carte
function refreshMapStyles() {
  if (geoJsonLayer) {
    geoJsonLayer.setStyle(getCountryStyle)
  }
}

// Démarrer l'infection depuis le popup
function startInfectionHere(countryName) {
  plagueStore.startGame(countryName)
  refreshMapStyles()
}

onMounted(async () => {
  // Fix icônes Leaflet manquantes dans Vite
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
  })

  // Initialisation carte centrée sur le monde
  map = L.map(mapContainer.value, {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 6,
    worldCopyJump: true,
    attributionControl: false
  })

  // Fond de carte sombre CartoDB Dark Matter
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(map)

  // Charger les pays via le store
  try {
    const geoJson = await plagueStore.loadGeoJson()

    geoJsonLayer = L.geoJSON(geoJson, {
      style: getCountryStyle,
      onEachFeature: (feature, layer) => {
        const name = feature.properties?.name || feature.properties?.NAME
        const nameFr = feature.properties?.name_fr || feature.properties?.NAME_FR || name

        // Tooltip au survol
        layer.bindTooltip(
          () => {
            const data = plagueStore.countryData[name] || plagueStore.countryData[nameFr]
            const infectedStr = data ? data.infected.toLocaleString('fr-FR') : '0'
            const popStr = data ? data.population.toLocaleString('fr-FR') : 'Inconnue'
            return `<strong>${nameFr}</strong><br/>Infectés : ${infectedStr}<br/>Population : ${popStr}`
          },
          { sticky: true, className: 'tactical-tooltip' }
        )

        // Interaction au clic
        layer.on('click', () => {
          const data = plagueStore.countryData[name] || plagueStore.countryData[nameFr]
          if (data) {
            selectedCountry.value = data
            if (plagueStore.status === 'setup') {
              plagueStore.setFirstInfected(data.name)
            }
          }
        })

        // Effet de surbrillance
        layer.on('mouseover', () => {
          layer.setStyle({
            weight: 2,
            color: '#f59e0b',
            dashArray: ''
          })
          layer.bringToFront()
        })

        layer.on('mouseout', () => {
          geoJsonLayer.resetStyle(layer)
        })
      }
    }).addTo(map)
  } catch (e) {
    console.error('Erreur chargement GeoJSON dans Map:', e)
  }
})

// Watcher pour mettre à jour les couleurs quand le jeu avance
watch(
  () => plagueStore.gameDay,
  () => {
    refreshMapStyles()
  }
)

// Watcher pour synchroniser les bulles interactives ADN
watch(
  () => plagueStore.activeBubbles,
  (bubbles) => {
    if (!map) return
    // Supprimer bulles disparues
    const currentIds = new Set(bubbles.map((b) => b.id))
    for (const [id, marker] of bubbleMarkers.entries()) {
      if (!currentIds.has(id)) {
        marker.remove()
        bubbleMarkers.delete(id)
      }
    }

    // Ajouter nouvelles bulles
    bubbles.forEach((b) => {
      if (!bubbleMarkers.has(b.id)) {
        const iconHtml = `<div class="dna-bubble pulse-animation">🧬</div>`
        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'bubble-icon',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })

        const marker = L.marker([b.lat, b.lng], { icon: customIcon }).addTo(map)
        marker.on('click', () => {
          plagueStore.popBubble(b.id)
        })
        bubbleMarkers.set(b.id, marker)
      }
    })
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped>
.map-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 520px;
  background: #090d16;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.map-header {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.map-title-bar h2 {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 700;
  background: rgba(15, 23, 42, 0.9);
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(8px);
  color: #f1f5f9;
  margin: 0;
}

.badge {
  font-size: 0.75rem;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.badge-warning {
  background: #f59e0b;
  color: #000;
}

.badge-danger {
  background: #ef4444;
  color: #fff;
}

.country-preview {
  pointer-events: auto;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(239, 68, 68, 0.4);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  padding: 10px 14px;
  max-width: 420px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  color: #f8fafc;
}

.cp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.cp-continent {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-left: 8px;
}

.cp-close {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
  font-size: 0.9rem;
}

.cp-close:hover {
  color: #fff;
}

.cp-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
  font-size: 0.8rem;
  margin-bottom: 8px;
}

.cp-stat .lbl {
  color: #94a3b8;
  margin-right: 4px;
}

.cp-stat .val {
  font-weight: 600;
}

.text-danger .val {
  color: #f87171;
}

.text-dead .val {
  color: #cbd5e1;
}

.text-success .val {
  color: #4ade80;
}

.cp-action {
  text-align: right;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 0.8rem;
  border-radius: 6px;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444, #b91c1c);
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    filter 0.15s ease;
}

.btn-danger:hover {
  filter: brightness(1.1);
  transform: scale(1.02);
}

.leaflet-map {
  flex: 1;
  width: 100%;
  height: 100%;
  background: #090d16;
}

.map-legend {
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 1000;
  display: flex;
  gap: 10px;
  background: rgba(15, 23, 42, 0.9);
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
  color: #cbd5e1;
  backdrop-filter: blur(6px);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-color.healthy {
  background: #1e293b;
  border: 1px solid #334155;
}

.legend-color.infected-low {
  background: #f87171;
}

.legend-color.infected-mid {
  background: #dc2626;
}

.legend-color.infected-high {
  background: #991b1b;
}

.legend-color.dead {
  background: #270808;
  border: 1px solid #581c1c;
}
</style>
