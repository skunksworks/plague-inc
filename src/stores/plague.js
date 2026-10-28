import { defineStore } from 'pinia'
import modificationsData from '../assets/modifications.json'

export const usePlagueStore = defineStore('plague', {
  state: () => ({
    virusName: 'Pathogène-X',
    status: 'setup', // 'setup', 'running', 'paused', 'won', 'lost'
    gameSpeed: 1, // 0 = pause, 1 = normal, 2 = rapide, 3 = très rapide
    gameDay: 1,
    startDate: new Date('2026-10-28'),
    firstInfected: null,

    // Pays et données GeoJSON
    countries: [], // Liste ordonnée de pays
    countryData: {}, // Map: name -> { name, name_fr, population, infected, dead, healthy, continent, closedBorders }
    geoJson: null,
    isGeoJsonLoaded: false,

    // Attributs de la maladie
    infectivity: 1.25,
    severity: 0.4,
    lethality: 0.05,
    cureResistance: 1.0,

    // Économie & Remède
    dnaPoints: 12,
    cureProgress: 0, // 0 à 100
    cureActive: false,

    // Améliorations
    modifications: modificationsData,
    purchasedModifications: [],

    // Bulles interactives sur la carte (clic = bonus ADN)
    activeBubbles: [],

    // Fil d'actualité
    newsFeed: [
      {
        id: 1,
        day: 1,
        text: 'Sélectionnez un pays de départ pour déclencher la pandémie.',
        type: 'info'
      }
    ],

    // Jalons d'infection déjà récompensés
    awardedMilestones: []
  }),

  getters: {
    totalPopulation: (state) => {
      return (
        state.countries.reduce((sum, c) => sum + (c.population || 0), 0) ||
        7950000000
      )
    },

    numberOfInfected: (state) => {
      return state.countries.reduce((sum, c) => sum + (c.infected || 0), 0)
    },

    totalDead: (state) => {
      return state.countries.reduce((sum, c) => sum + (c.dead || 0), 0)
    },

    totalHealthy() {
      const remaining = this.totalPopulation - this.numberOfInfected - this.totalDead
      return Math.max(0, remaining)
    },

    infectedPercentage() {
      if (!this.totalPopulation) return 0
      return (this.numberOfInfected / this.totalPopulation) * 100
    },

    deadPercentage() {
      if (!this.totalPopulation) return 0
      return (this.totalDead / this.totalPopulation) * 100
    },

    infectedCountriesCount: (state) => {
      return state.countries.filter((c) => c.infected > 0 || c.dead > 0).length
    },

    currentDateString: (state) => {
      const d = new Date(state.startDate)
      d.setDate(d.getDate() + state.gameDay)
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }
  },

  actions: {
    async loadGeoJson() {
      if (this.isGeoJsonLoaded && this.geoJson) {
        return this.geoJson
      }

      try {
        const response = await fetch('/api/countries.geojson')
        const data = await response.json()
        this.geoJson = data

        const countryMap = {}
        const countryList = []

        data.features.forEach((feature) => {
          const props = feature.properties || {}
          const name = props.name || props.NAME || 'Inconnu'
          const nameFr = props.name_fr || props.NAME_FR || name
          const pop = props.pop_est && props.pop_est > 0 ? props.pop_est : 1000000
          const continent = props.continent || ''

          const item = {
            name,
            name_fr: nameFr,
            population: pop,
            infected: 0,
            dead: 0,
            healthy: pop,
            continent,
            closedBorders: false
          }

          countryMap[name] = item
          // Alias aussi par nom français si différent pour lookup facile
          if (nameFr !== name) {
            countryMap[nameFr] = item
          }
          countryList.push(item)
        })

        // Trier par nom alphabétique
        countryList.sort((a, b) => a.name_fr.localeCompare(b.name_fr))

        this.countries = countryList
        this.countryData = countryMap
        this.isGeoJsonLoaded = true
        return data
      } catch (err) {
        console.error('Erreur chargement GeoJSON:', err)
        throw err
      }
    },

    setFirstInfected(countryName) {
      this.firstInfected = countryName
    },

    startGame(selectedCountryName) {
      const targetCountry = selectedCountryName || this.firstInfected
      if (!targetCountry) return

      const country = this.countryData[targetCountry]
      if (!country) return

      this.firstInfected = country.name
      const initialCases = Math.min(country.population, 10)
      country.infected = initialCases
      country.healthy = country.population - initialCases

      this.status = 'running'
      this.gameSpeed = 1
      this.addNews(
        `🚨 Patient Zéro identifié en ${country.name_fr || country.name} ! L'épidémie a commencé.`,
        'danger'
      )
    },

    setGameSpeed(speed) {
      this.gameSpeed = speed
      if (speed === 0) {
        this.status = 'paused'
      } else if (this.status === 'paused') {
        this.status = 'running'
      }
    },

    togglePause() {
      if (this.status === 'running') {
        this.status = 'paused'
      } else if (this.status === 'paused') {
        this.status = 'running'
      }
    },

    addNews(text, type = 'info') {
      this.newsFeed.unshift({
        id: Date.now() + Math.random(),
        day: this.gameDay,
        text,
        type
      })
      // Garder les 20 plus récentes
      if (this.newsFeed.length > 20) {
        this.newsFeed.pop()
      }
    },

    purchaseModification(modId) {
      const mod = this.modifications.find((m) => m.id === modId)
      if (!mod || this.purchasedModifications.includes(modId)) return false

      if (this.dnaPoints < mod.cost) return false

      this.dnaPoints -= mod.cost
      this.purchasedModifications.push(modId)

      // Appliquer les effets
      if (mod.effects) {
        if (mod.effects.infectivity) this.infectivity *= mod.effects.infectivity
        if (mod.effects.severity) this.severity *= mod.effects.severity
        if (mod.effects.lethality) this.lethality *= mod.effects.lethality
        if (mod.effects.cureResistance) this.cureResistance *= mod.effects.cureResistance
      }

      this.addNews(`🧬 Mutation évoluée : « ${mod.name} » (+Infection / Sévérité).`, 'info')
      return true
    },

    popBubble(bubbleId) {
      const idx = this.activeBubbles.findIndex((b) => b.id === bubbleId)
      if (idx !== -1) {
        const bubble = this.activeBubbles[idx]
        this.dnaPoints += bubble.points || 2
        this.activeBubbles.splice(idx, 1)
      }
    },

    spawnBubble(lat, lng, type = 'dna') {
      if (this.activeBubbles.length > 6) return
      this.activeBubbles.push({
        id: 'bubble_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        lat,
        lng,
        type,
        points: type === 'dna' ? 2 : 1
      })
    },

    tick() {
      if (this.status !== 'running') return

      this.gameDay++

      const infectedList = this.countries.filter((c) => c.infected > 0)

      // Simulation par pays
      for (const country of infectedList) {
        if (country.healthy <= 0 && country.infected <= 0) continue

        // Calcul propagation locale
        const transmissionFactor = Math.max(0.01, this.infectivity * 0.08)
        const densityFactor = country.healthy / (country.population || 1)
        const newCases = Math.min(
          country.healthy,
          Math.max(1, Math.floor(country.infected * transmissionFactor * densityFactor))
        )

        if (newCases > 0) {
          country.infected += newCases
          country.healthy = Math.max(0, country.healthy - newCases)
        }

        // Calcul mortalité
        if (this.lethality > 0.08 && country.infected > 50) {
          const deathFactor = (this.lethality - 0.05) * 0.04
          const newDeaths = Math.min(country.infected, Math.floor(country.infected * deathFactor))
          if (newDeaths > 0) {
            country.infected -= newDeaths
            country.dead += newDeaths
          }
        }

        // Transmission internationale (par avion, bateau ou terre)
        if (country.infected > 500 && Math.random() < 0.15 * this.infectivity) {
          this.spreadToAnotherCountry(country)
        }
      }

      // Progression du remède mondial
      const totalInf = this.numberOfInfected
      const totalDead = this.totalDead
      const worldAwareness = totalInf > 10000 || totalDead > 100

      if (worldAwareness) {
        if (!this.cureActive) {
          this.cureActive = true
          this.addNews(
            "🧪 L'OMS a classé le virus comme menace globale : début des recherches du remède !",
            'warning'
          )
        }

        const baseCureSpeed = 0.04 * (this.severity / this.cureResistance)
        this.cureProgress = Math.min(100, this.cureProgress + baseCureSpeed)

        if (this.cureProgress >= 100) {
          this.status = 'lost'
          this.cureProgress = 100
          this.addNews("❌ DÉFAITE : L'humanité a déployé un remède efficace à 100% !", 'danger')
          return
        }
      }

      // Victoire : toute l'humanité a succombé
      if (this.totalHealthy === 0 && this.numberOfInfected === 0 && totalDead > 1000000) {
        this.status = 'won'
        this.addNews(
          "🏆 VICTOIRE : L'humanité entière a été éradiquée par votre pathogène !",
          'danger'
        )
        return
      }

      // Attribution de points ADN réguliers
      if (Math.random() < 0.25) {
        this.dnaPoints += 1
      }

      // Jalons d'infections pour points bonus
      const milestones = [1000, 50000, 500000, 5000000, 50000000, 500000000, 2000000000]
      for (const m of milestones) {
        if (totalInf >= m && !this.awardedMilestones.includes(m)) {
          this.awardedMilestones.push(m)
          this.dnaPoints += 5
          this.addNews(
            `⭐ Jalon atteint : ${m.toLocaleString()} personnes contaminées ! (+5 ADN)`,
            'info'
          )
        }
      }
    },

    spreadToAnotherCountry(sourceCountry) {
      // Trouver les pays non infectés
      const uninfected = this.countries.filter((c) => c.infected === 0 && c.dead === 0)
      if (uninfected.length === 0) return

      // Préférer un pays du même continent s'il en reste, sinon mondial
      const sameContinent = uninfected.filter((c) => c.continent === sourceCountry.continent)
      const pool = sameContinent.length > 0 && Math.random() < 0.7 ? sameContinent : uninfected
      const target = pool[Math.floor(Math.random() * pool.length)]

      const initialSpread = Math.min(
        target.population,
        Math.max(5, Math.floor(sourceCountry.infected * 0.005))
      )
      target.infected = initialSpread
      target.healthy = Math.max(0, target.population - initialSpread)

      this.dnaPoints += 2
      this.addNews(
        `✈️ Frontière franchie ! Le virus s'est propagé en ${target.name_fr || target.name}. (+2 ADN)`,
        'warning'
      )
    },

    resetGame() {
      this.status = 'setup'
      this.gameSpeed = 1
      this.gameDay = 1
      this.firstInfected = null
      this.infectivity = 1.25
      this.severity = 0.4
      this.lethality = 0.05
      this.cureResistance = 1.0
      this.dnaPoints = 12
      this.cureProgress = 0
      this.cureActive = false
      this.purchasedModifications = []
      this.activeBubbles = []
      this.awardedMilestones = []

      this.countries.forEach((c) => {
        c.infected = 0
        c.dead = 0
        c.healthy = c.population
      })

      this.newsFeed = [
        {
          id: Date.now(),
          day: 1,
          text: 'Nouvelle partie. Choisissez votre pays cible pour débuter.',
          type: 'info'
        }
      ]
    }
  }
})
