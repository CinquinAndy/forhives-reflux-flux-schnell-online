<template lang="pug"></template>

<script>
import {mapState, mapActions} from 'pinia'
import {usePredictionStore} from '~/stores/prediction'

const POLL_INTERVAL = 3000

export default {
  name: 'PredictionPoller',
  data: () => ({
    interval: null
  }),
  computed: {
    ...mapState(usePredictionStore, ['incompletePredictions'])
  },
  methods: {
    ...mapActions(usePredictionStore, ['pollIncompletePredictions']),
    clearInterval() {
      if (this.interval) {
        window.clearInterval(this.interval)
        this.interval = null
      }
    }
  },
  watch: {
    incompletePredictions: {
      immediate: true,
      handler(predictions) {
        // Nettoyer l'intervalle existant
        this.clearInterval()

        // Si on a des prédictions incomplètes, démarrer le polling
        if (predictions && predictions.length > 0) {
          this.interval = window.setInterval(
              this.pollIncompletePredictions,
              POLL_INTERVAL
          )
        }
      }
    }
  },
  beforeDestroy() {
    this.clearInterval()
  }
}
</script>
