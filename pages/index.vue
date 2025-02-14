<template lang="pug">
  .flex.flex-col.h-screen
    ui-top-panel
    .flex.flex-1.overflow-hidden
      ui-left-panel
      .flex-1.p-4.overflow-y-auto
        //- Grille adaptative avec espacement plus grand
        .grid.gap-6(class="grid-cols-auto-fit-300")
          image-card(
            v-for="output in sortedOutputs"
            :key="output.id"
            :output="output"
          )
      prediction-poller
</template>

<script>
import {mapState} from 'pinia'
import {usePredictionStore} from '~/stores/prediction'
import ImageCard from '~/components/ImageCard.vue'
import PredictionPoller from '~/components/PredictionPoller.vue'

export default {
  name: 'index',
  components: {
    ImageCard,
    PredictionPoller
  },
  computed: {
    ...mapState(usePredictionStore, ['outputs']),
    // Trier les outputs par aspect ratio
    sortedOutputs() {
      return [...this.outputs].sort((a, b) => {
        const ratioOrder = ['1:1', '16:9', '9:16', '3:2', '2:3']
        return ratioOrder.indexOf(a.input.aspect_ratio) - ratioOrder.indexOf(b.input.aspect_ratio)
      })
    }
  }
}
</script>

<style>
.grid-cols-auto-fit-300 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}
</style>