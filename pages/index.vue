<template lang="pug">
.flex.flex-col.h-screen
  //- Top panel
  ui-top-panel
  //- Content area with sidebar and images
  .flex.flex-1.overflow-hidden
    //- Sidebar
    ui-left-panel
    //- Image grid with scroll
    .flex-1.p-4.overflow-y-auto
      .flex.flex-wrap.justify-start.gap-4
        image-card(
          v-for="output in outputs"
          :key="output.id"
          :output="output"
        )
    //- Keep the poller
    prediction-poller
</template>

<script>
import { mapState } from 'pinia'
import { usePredictionStore } from '~/stores/prediction'
import ImageCard from '~/components/ImageCard.vue'

export default {
  name: 'index',
  components: {
    ImageCard
  },
  computed: {
    ...mapState(usePredictionStore, ['outputs'])
  }
}
</script>