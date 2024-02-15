<script setup>
import Dashboard from './components/Dashboard.vue'
import Map from './components/Map.vue'
import DiseaseInfo from './components/DiseaseInfo.vue'
</script>
<template>
  <div id="app">
  <Dashboard/>
    <Map/>
    <DiseaseInfo/>
  </div>
</template>

<script>

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import * as store from './stores/plague';

export default {
  data() {
    name:"app";
    return {
      usePlagueStore:store.usePlagueStore,
      map: null,
      numberOfInfected: 1, // Start with 1 infected (adjust as needed)
      newInfectedCount: 0,
      countryGeoJSON: null, // Store country GeoJSON data
      countryPolygons: {}, // Store country polygons
      infectedMarkers: [], // Array to store infected markers
    };
  },
  mounted() {
    // Initialize the map
    this.map = L.map(this.$refs.map).setView([0, 0], 2); // Set initial view and zoom level

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'open street map ',
    }).addTo(this.map);

    // Fetch country polygons data
    this.fetchCountryPolygons();

    // Start the timer for updating infected count
    this.startInfectionTimer();
  },
  beforeUnmount() {
    // Clean up resources when the component is destroyed
    if (this.map) {
      this.map.remove();
    }
  },
  methods: {
    async fetchCountryPolygons() {
      try {
        const filePath = '/api/countries.geojson';
        const response = await fetch(filePath);
        this.countryGeoJSON = await response.json();

        // Add country polygons to the map
        L.geoJSON(this.countryGeoJSON, {
          style: {
            color: 'black',
            fillColor: '#B0DE5C',
            fillOpacity: 0.5,
            weight: 1,
          },
        }).addTo(this.map);

        // Store country polygons
        this.countryGeoJSON.features.forEach(feature => {
          this.countryPolygons[feature.properties.name] = feature.geometry;
        });

        // Start infection from the selected first infected country
        this.startInfectionFromSelectedCountry();
      } catch (error) {
        console.error('Error fetching country polygons:', error);
      }
    },
    startInfectionFromSelectedCountry() {
      const selectedFirstInfected = store.usePlagueStore().firstInfected;
      if (selectedFirstInfected) {
        // Set initial infection for the selected country
        this.setInitialInfection(selectedFirstInfected);
      }
    },
    setInitialInfection(country) {
      // Simulate initial infection
      this.numberOfInfected = { [country]: 1 };

      // Update infected markers on the map
      this.updateInfectedMarkers();
    },
    updateInfectedMarkers() {
      // Remove previous markers
      this.infectedMarkers.forEach(marker => marker.remove());
      this.infectedMarkers = [];

      // Add new infected markers
      for (const country in this.numberOfInfected) {
        if (Object.prototype.hasOwnProperty.call(this.numberOfInfected, country)) {
          const countryPolygon = this.countryPolygons[country];

          // Check if the country is infected
          if (this.numberOfInfected[country] > 0) {
            // Create random infected markers inside the country
            for (let i = 0; i < this.numberOfInfected[country]; i++) {
              const randomPosition = this.getRandomPositionInsideCountry(countryPolygon);
              const infectedMarker = L.marker(randomPosition)
                .bindPopup(`${country}: Infected`)
                .addTo(this.map);
              this.infectedMarkers.push(infectedMarker);
            }
          }
        }
      }
    },
    getRandomPositionInsideCountry(countryPolygon) {
      let randomPoint;
      let isInsideCountry = false;

      // Generate a random point inside the country polygon
      while (!isInsideCountry) {
        randomPoint = turf.randomPoint(1, { bbox: turf.bbox(countryPolygon) }).features[0];
        isInsideCountry = turf.booleanPointInPolygon(randomPoint, countryPolygon);
      }

      // Extract coordinates of the random point
      const [lng, lat] = randomPoint.geometry.coordinates;
      return [lat, lng];
    },
    startInfectionTimer() {
      // Set an interval to update the infected count every 5 seconds (adjust as needed)
      setInterval(this.updateInfectedCount, 5000);
    },
    updateInfectedCount() {
      // Simulate fetching real data about infected count per country
      // Replace this with your actual data fetching logic
      this.updateInfectedMarkers();

      // Update the infected count per country
    },
  },
};
</script>
