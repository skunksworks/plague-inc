<!-- eslint-disable vue -->
<template>
  <div>
    <h1>Plague Inc-like Dashboard</h1>
    <p>Welcome to the dashboard! Manage your plague here.</p>

    <!-- Form to select the first infected nation -->
    <form @submit.prevent="selectFirstInfected">
      <label for="firstInfected">Select First Infected Nation:</label>
      <select id="firstInfected" v-model="selectedFirstInfected">
        <option v-for="country in countries" :value="country">{{ country }}</option>
      </select>
      <button type="submit">Start Infection</button>
    </form>

    <!-- Add more dashboard content as needed -->


  </div>
</template>

<script>
import { usePlagueStore } from '../stores/plague'; // Importez votre store Pinia

export default {
  data() {
    return {
      selectedFirstInfected: null,
      countries: [],
    };
  },
  async mounted() {
    // Fetch country list when the component is mounted
    await this.fetchCountryList();
  },
  methods: {
    async fetchCountryList() {
      try {
        const response = await fetch('/api/countries.geojson');
        const geojson = await response.json();
        console.log(geojson)
        this.countries = geojson.features.map(feature => feature.properties.name_fr);
      } catch (error) {
        const response = await fetch('/api/countries.geojson');
        const geojson = await response.json();
        console.log(geojson)
        console.error('Error fetching country list:', error);
      }
    },
    selectFirstInfected() {
      // Mettez à jour la première nation infectée dans le store Pinia
      usePlagueStore().setFirstInfected(this.selectedFirstInfected);
    },
  },
};
</script>

<style scoped>
/* Add component-specific styles here if needed */
</style>
