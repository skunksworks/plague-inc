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
    countries: [], // Liste ordonnée de pays uniques
    countryData: {}, // Map: name / name_fr -> country object
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

    // Système de recherche & Capacité médicale (impact des décès)
    medicalCapacity: 100, // 0 à 100% (baisse drastiquement avec les morts de médecins)
    doctorCasualtyPenalty: 1.0, // Multiplicateur de recherche (1.0 -> 0.05)
    dailyCureSpeed: 0, // Vitesse quotidienne nette du remède
    hasTriggeredMedicalCrisisNews: false,
    hasTriggeredMedicalCollapseNews: false,

    // Améliorations
    modifications: modificationsData,
    purchasedModifications: [],

    // Bulles interactives sur la carte (ADN et Fioles de recherche bleues)
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

    medicalStatus: (state) => {
      if (state.medicalCapacity >= 80) return 'Opérationnel (Laboratoires actifs)'
      if (state.medicalCapacity >= 50) return 'Sous tension (Pénurie de soignants)'
      if (state.medicalCapacity >= 20) return 'Crise hospitalière (Décès de médecins & chercheurs)'
      return 'Effondrement total (Laboratoires fermés, hôpitaux anéantis)'
    },

    medicalStatusClass: (state) => {
      if (state.medicalCapacity >= 80) return 'operational'
      if (state.medicalCapacity >= 50) return 'strained'
      if (state.medicalCapacity >= 20) return 'crisis'
      return 'collapsed'
    },

    cureSlowdownPercentage: (state) => {
      return Math.round((1 - state.doctorCasualtyPenalty) * 100)
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
          // Alias par nom français pour recherche facile
          if (nameFr !== name) {
            countryMap[nameFr] = item
          }
          countryList.push(item)
        })

        // Trier alphabétiquement par nom français
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
      if (this.newsFeed.length > 25) {
        this.newsFeed.pop()
      }
    },

    canPurchaseModification(modId) {
      const mod = this.modifications.find((m) => m.id === modId)
      if (!mod || this.purchasedModifications.includes(modId)) return false
      if (this.dnaPoints < mod.cost) return false
      if (mod.prerequisites && mod.prerequisites.length > 0) {
        const hasAllPrereqs = mod.prerequisites.every((reqId) =>
          this.purchasedModifications.includes(reqId)
        )
        if (!hasAllPrereqs) return false
      }
      return true
    },

    canCancelModification(modId) {
      return this.purchasedModifications.includes(modId)
    },

    cancelModification(modId) {
      if (!this.purchasedModifications.includes(modId)) return false

      // Trouver récursivement toutes les modifications qui dépendent de celle-ci
      const toCancel = [modId]
      let added = true
      while (added) {
        added = false
        this.modifications.forEach((m) => {
          if (
            this.purchasedModifications.includes(m.id) &&
            !toCancel.includes(m.id) &&
            m.prerequisites &&
            m.prerequisites.some((req) => toCancel.includes(req))
          ) {
            toCancel.push(m.id)
            added = true
          }
        })
      }

      // Rembourser 100% du coût en points ADN pour chaque modification annulée
      let totalRefund = 0
      toCancel.forEach((id) => {
        const mod = this.modifications.find((m) => m.id === id)
        if (mod) {
          totalRefund += mod.cost
        }
        const idx = this.purchasedModifications.indexOf(id)
        if (idx !== -1) {
          this.purchasedModifications.splice(idx, 1)
        }
      })

      this.dnaPoints += totalRefund
      this.recalculateVirusStats()

      const targetMod = this.modifications.find((m) => m.id === modId)
      const name = targetMod ? targetMod.name : 'Modification'
      const extraCount = toCancel.length - 1
      const extraText = extraCount > 0 ? ` (+${extraCount} dérivée(s))` : ''

      this.addNews(
        `↩ Modification annulée : « ${name} »${extraText} (+${totalRefund} ADN récupéré).`,
        'info'
      )
      return true
    },

    devolveModification(modId) {
      return this.cancelModification(modId)
    },

    recalculateVirusStats() {
      let inf = 1.25
      let sev = 0.4
      let letRate = 0.05
      let res = 1.0

      this.purchasedModifications.forEach((id) => {
        const mod = this.modifications.find((m) => m.id === id)
        if (mod && mod.effects) {
          if (mod.effects.infectivity) inf *= mod.effects.infectivity
          if (mod.effects.severity) sev *= mod.effects.severity
          if (mod.effects.lethality) letRate *= mod.effects.lethality
          if (mod.effects.cureResistance) res *= mod.effects.cureResistance
        }
      })

      this.infectivity = inf
      this.severity = sev
      this.lethality = letRate
      this.cureResistance = res
    },

    purchaseModification(modId) {
      const mod = this.modifications.find((m) => m.id === modId)
      if (!this.canPurchaseModification(modId)) return false

      this.dnaPoints -= mod.cost
      this.purchasedModifications.push(modId)
      this.recalculateVirusStats()

      this.addNews(`🧬 Mutation évoluée : « ${mod.name} » (+Infection / Sévérité).`, 'info')
      return true
    },


    popBubble(bubbleId) {
      const idx = this.activeBubbles.findIndex((b) => b.id === bubbleId)
      if (idx !== -1) {
        const bubble = this.activeBubbles[idx]

        if (bubble.type === 'cure') {
          // Sabotage du remède !
          const setback = 1.0 + Math.random() * 1.8
          this.cureProgress = Math.max(0, this.cureProgress - setback)
          this.dnaPoints += 1
          this.addNews(
            `🧪 Fiole de recherche détruite ! Le remède mondial recule de ${setback.toFixed(1)}% (+1 ADN).`,
            'warning'
          )
        } else {
          // Bulle ADN
          this.dnaPoints += bubble.points || 2
        }

        this.activeBubbles.splice(idx, 1)
      }
    },

    spawnBubble(lat, lng, type = 'dna') {
      if (this.activeBubbles.length > 8) return
      this.activeBubbles.push({
        id: 'bubble_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        lat,
        lng,
        type,
        points: type === 'dna' ? 2 : 1
      })
    },

    spawnCureBubble() {
      // Pôles de recherche majeurs
      const researchHubs = [
        { name: 'France', lat: 46.6, lng: 2.2 },
        { name: 'États-Unis', lat: 37.0, lng: -95.7 },
        { name: 'Royaume-Uni', lat: 55.3, lng: -3.4 },
        { name: 'Allemagne', lat: 51.1, lng: 10.4 },
        { name: 'Chine', lat: 35.8, lng: 104.1 },
        { name: 'Japon', lat: 36.2, lng: 138.2 },
        { name: 'Suisse', lat: 46.8, lng: 8.2 }
      ]

      const chosen = researchHubs[Math.floor(Math.random() * researchHubs.length)]
      // Décalage léger aléatoire
      const jitterLat = chosen.lat + (Math.random() - 0.5) * 4
      const jitterLng = chosen.lng + (Math.random() - 0.5) * 4

      this.spawnBubble(jitterLat, jitterLng, 'cure')
    },

    tick() {
      if (this.status !== 'running') return

      this.gameDay++

      const infectedList = this.countries.filter((c) => c.infected > 0)

      // Simulation épidémique par pays
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

      // Métriques globales
      const totalInf = this.numberOfInfected
      const totalDead = this.totalDead
      const totalPop = this.totalPopulation || 1
      const worldAwareness = totalInf > 10000 || totalDead > 100

      // IMPACT DES MORTS SUR LA RECHERCHE DU REMÈDE :
      // Plus le nombre de morts et d'infectés grimpe, plus le personnel médical et scientifique
      // meurt ou est incapacité, entraînant la saturation et l'effondrement des laboratoires.
      const deathRatio = totalDead / totalPop
      const infectedRatio = totalInf / totalPop
      // À partir de 0.2% de morts mondiaux (~16M) ou forte infection, les labos perdent jusqu'à 95% de productivité
      const casualtyImpact = Math.min(0.95, deathRatio * 50 + infectedRatio * 0.25)
      this.doctorCasualtyPenalty = Math.max(0.05, 1 - casualtyImpact)
      this.medicalCapacity = Math.round(this.doctorCasualtyPenalty * 100)

      // Alertes de crise médicale
      if (this.medicalCapacity <= 50 && !this.hasTriggeredMedicalCrisisNews && totalDead > 25000) {
        this.hasTriggeredMedicalCrisisNews = true
        this.addNews(
          '⚠️ Pénurie critique de médecins : des milliers de soignants et chercheurs sont morts, le vaccin ralentit !',
          'warning'
        )
      }
      if (this.medicalCapacity <= 20 && !this.hasTriggeredMedicalCollapseNews && totalDead > 250000) {
        this.hasTriggeredMedicalCollapseNews = true
        this.addNews(
          '💀 Hécatombe médicale mondiale : hôpitaux submergés et chercheurs décédés, les laboratoires ferment !',
          'danger'
        )
      }

      // Progression du remède mondial
      if (worldAwareness) {
        if (!this.cureActive) {
          this.cureActive = true
          this.addNews(
            "🧪 L'OMS a classé le virus comme menace globale : début des recherches du remède !",
            'warning'
          )
        }

        // Vitesse théorique de base
        const baseCureSpeed = 0.04 * (this.severity / this.cureResistance)
        // Vitesse effective lourdement ralentie par les décès de soignants / scientifiques
        const effectiveCureSpeed = baseCureSpeed * this.doctorCasualtyPenalty
        this.dailyCureSpeed = effectiveCureSpeed

        this.cureProgress = Math.min(100, this.cureProgress + effectiveCureSpeed)

        if (this.cureProgress >= 100) {
          this.status = 'lost'
          this.cureProgress = 100
          this.addNews("❌ DÉFAITE : L'humanité a déployé un remède efficace à 100% !", 'danger')
          return
        }

        // Apparition aléatoire de fioles de recherche bleues à saboter
        if (Math.random() < 0.12 && this.activeBubbles.filter((b) => b.type === 'cure').length < 2) {
          this.spawnCureBubble()
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

      // Mutation spontanée aléatoire (comme dans Plague Inc)
      if (Math.random() < 0.02 && this.status === 'running') {
        const eligibleMutations = this.modifications.filter(
          (m) =>
            m.category === 'symptom' &&
            !this.purchasedModifications.includes(m.id) &&
            (!m.prerequisites ||
              m.prerequisites.length === 0 ||
              m.prerequisites.every((r) => this.purchasedModifications.includes(r)))
        )
        if (eligibleMutations.length > 0) {
          const picked = eligibleMutations[Math.floor(Math.random() * eligibleMutations.length)]
          this.purchasedModifications.push(picked.id)
          this.recalculateVirusStats()
          this.addNews(
            `✨ Mutation spontanée ! Le virus a développé gratuitement : « ${picked.name} » !`,
            'warning'
          )
        }
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
      this.medicalCapacity = 100
      this.doctorCasualtyPenalty = 1.0
      this.dailyCureSpeed = 0
      this.hasTriggeredMedicalCrisisNews = false
      this.hasTriggeredMedicalCollapseNews = false
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
