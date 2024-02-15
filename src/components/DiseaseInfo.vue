<!-- DiseaseInfo.vue -->
<template>
  <div>
    <h1>Disease Information</h1>

    <!-- Display current disease information -->
    <div>
      <p>Current Virus Name: {{ virusName }}</p>
      <p>Current Transmission Rate: {{ transmissionRate }}</p>
      <p>Current Severity: {{ severity }}</p>
      <p>Current Lethality: {{ lethality }}</p>
      <p>Available Modification Points: {{ modificationPoints }}</p>
      <!-- Display other disease information as needed -->
    </div>

    <!-- Display available modifications -->
    <div>
      <h2>Available Modifications</h2>
      <ul>
        <li v-for="modification in modifications" :key="modification.id">
          {{ modification.name }} - Cost: {{ modification.cost }} points
        </li>
      </ul>
    </div>

    <!-- Form for purchasing modifications -->
    <form @submit.prevent="purchaseModification">
      <label for="modificationId">Select Modification:</label>
      <select id="modificationId" v-model="selectedModificationId">
        <option v-for="modification in modifications" :key="modification.id" :value="modification.id">
          {{ modification.name }}
        </option>
      </select>

      <button type="submit" :disabled="!canPurchaseModification">Purchase Modification</button>
    </form>


  </div>
</template>

<script>
import modificationsData from '@/assets/modifications.json'; // Adjust the path based on your project structure

export default {
  name: 'DiseaseInfo',
  data() {
    return {
      virusName: 'YourVirus',
      transmissionRate: 1.5,
      severity: 0.8,
      lethality: 0.5,
      modificationPoints: 10, // Initial modification points
      modifications: modificationsData,
      selectedModificationId: null,
    };
  },
  computed: {
    canPurchaseModification() {
      // Check if the user has enough modification points and selected a modification
      return (
        this.modificationPoints > 0 &&
        this.selectedModificationId !== null &&
        this.modifications.find(mod => mod.id === this.selectedModificationId).cost <= this.modificationPoints
      );
    },
  },
  methods: {
    purchaseModification() {
      // Find the selected modification
      const selectedModification = this.modifications.find(mod => mod.id === this.selectedModificationId);

      // Apply the modification effects to the virus
      if (selectedModification) {
        for (const effect in selectedModification.effects) {
          if (Object.prototype.hasOwnProperty.call(selectedModification.effects, effect)) {
            // Apply the effect to the corresponding property of the virus
            this[effect] *= selectedModification.effects[effect];
          }
        }

        // Deduct modification points
        this.modificationPoints -= selectedModification.cost;
      }

      // Clear the form field
      this.selectedModificationId = null;
    },
  },
};
</script>

<style scoped>
/* Add component-specific styles here if needed */
</style>
