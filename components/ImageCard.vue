<template lang="pug">
.relative.border.rounded-lg.overflow-hidden.bg-white.shadow-md.m-2
  //- Canvas container
  .relative(class="w-72 h-72")
    #canvas(
      :ref="'canvas-' + output.id"
      :style="{ width: '100%', height: '100%' }"
    )

  //- Download button en overlay
  .absolute.top-2.right-2
    u-button(
      @click="downloadImage"
      color="white"
      variant="solid"
      icon="i-heroicons-arrow-down-tray"
      size="xs"
      :disabled="!output.output || output.status !== 'succeeded'"
    )

  //- Status indicator
  .absolute.bottom-2.left-2(v-if="output.status !== 'succeeded'")
    u-badge(:color="statusColor") {{ output.status }}
</template>

<script>
import Konva from 'konva'

export default {
  name: 'ImageCard',
  props: {
    output: {
      type: Object,
      required: true
    }
  },
  computed: {
    statusColor() {
      switch(this.output.status) {
        case 'starting': return 'yellow'
        case 'processing': return 'blue'
        case 'failed': return 'red'
        default: return 'gray'
      }
    }
  },
  data: () => ({
    stage: null,
    layer: null
  }),
  methods: {
    initCanvas() {
      const container = this.$refs[`canvas-${this.output.id}`]
      if (!container) return

      this.stage = new Konva.Stage({
        container,
        width: 300,
        height: 300
      })

      this.layer = new Konva.Layer()
      this.stage.add(this.layer)
      this.updateCanvas()
    },
    updateCanvas() {
      if (!this.output.output) {
        // Afficher un placeholder
        const rect = new Konva.Rect({
          width: 300,
          height: 300,
          fill: '#f0f0f0'
        })

        const text = new Konva.Text({
          text: this.output.status,
          fontSize: 14,
          fill: '#333',
          width: 300,
          align: 'center',
          verticalAlign: 'middle'
        })
        text.position({
          x: 0,
          y: 300/2 - text.height()/2
        })

        this.layer.add(rect, text)
      } else {
        // Charger l'image
        const img = new Image()
        img.onload = () => {
          const image = new Konva.Image({
            image: img,
            width: 300,
            height: 300
          })
          this.layer.removeChildren()
          this.layer.add(image)
          this.layer.batchDraw()
        }
        img.src = this.output.output
      }
      this.layer.batchDraw()
    },
    downloadImage() {
      if (!this.output.output) return

      const link = document.createElement('a')
      link.href = this.output.output
      link.download = `image-${this.output.id}.${this.output.output.split('.').pop()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  },
  watch: {
    'output.output'() {
      this.updateCanvas()
    },
    'output.status'() {
      this.updateCanvas()
    }
  },
  mounted() {
    this.initCanvas()
  }
}
</script>