// store/index.js
import { defineStore } from 'pinia';

export const usePlagueStore = defineStore({
  id: 'plague', // Identifiant unique du store
  state: () => ({
    countryData: {}, // Informations sur les pays (par exemple, nombre d'infections par pays)
    firstInfected: null, // Stocke le nom de la première nation infectée
  }),
  getters: {
    numberOfInfected: (state) => {
      // Logique pour calculer le nombre total d'infections à partir des données du pays
      // Remplacez cela par votre propre logique en fonction de vos données spécifiques
      return Object.values(state.countryData).reduce((acc, curr) => acc + curr, 0);
    },
  },
  actions: {
    // Méthodes pour mettre à jour les données du pays, par exemple ajouter un nouveau pays infecté
    updateCountryData(newCountryData) {
      this.countryData = { ...this.countryData, ...newCountryData };
    },

    // Méthode pour définir la première nation infectée
    setFirstInfected(countryName) {
      this.firstInfected = countryName;
    },
  },
});
