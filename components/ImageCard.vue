<template lang="pug">
  .relative.border.rounded-lg.overflow-hidden.bg-white.shadow-md.m-2(:class="cardClasses")
    //- Canvas container
    .relative(:class="containerClasses")
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
    aspectRatio() {
      const [width, height] = this.output.input.aspect_ratio.split(':').map(Number)
      return {width, height}
    },
    cardClasses() {
      // Définir la largeur de la carte en fonction du ratio
      const ratioKey = this.output.input.aspect_ratio
      const widthClasses = {
        '1:1': 'w-72', // 288px pour carré
        '16:9': 'w-96', // 384px pour paysage
        '9:16': 'w-64', // 256px pour portrait
        '3:2': 'w-80', // 320px pour paysage modéré
        '2:3': 'w-64', // 256px pour portrait modéré
      }
      return widthClasses[ratioKey] || 'w-72'
    },
    containerClasses() {
      // Calculer la hauteur en fonction du ratio
      const {width, height} = this.aspectRatio
      const ratio = height / width
      const baseHeight = 288 // Hauteur de base pour 1:1
      const calculatedHeight = Math.round(baseHeight * ratio)

      // Convertir en classes Tailwind (arrondir à la plus proche)
      const heightMap = {
        162: 'h-40', // ~160px pour 16:9
        288: 'h-72', // 288px pour 1:1
        432: 'h-108', // ~432px pour 9:16
        192: 'h-48', // ~192px pour 3:2
        384: 'h-96', // ~384px pour 2:3
      }

      return heightMap[calculatedHeight] || 'h-72'
    },
    statusColor() {
      switch (this.output.status) {
        case 'starting':
          return 'yellow'
        case 'processing':
          return 'blue'
        case 'failed':
          return 'red'
        default:
          return 'gray'
      }
    }
  },
  methods: {
    initCanvas() {
      const container = this.$refs[`canvas-${this.output.id}`]
      if (!container) return

      // Utiliser les dimensions réelles du conteneur
      const width = container.offsetWidth
      const height = container.offsetHeight

      this.stage = new Konva.Stage({
        container,
        width,
        height
      })

      this.layer = new Konva.Layer()
      this.stage.add(this.layer)
      this.updateCanvas()
    },
    updateCanvas() {
      if (!this.output.output) {
        // Placeholder avec dimensions adaptées
        const rect = new Konva.Rect({
          width: this.stage.width(),
          height: this.stage.height(),
          fill: '#f0f0f0'
        })

        const text = new Konva.Text({
          text: this.output.status,
          fontSize: 14,
          fill: '#333',
          width: this.stage.width(),
          align: 'center',
          verticalAlign: 'middle'
        })
        text.position({
          x: 0,
          y: this.stage.height() / 2 - text.height() / 2
        })

        this.layer.add(rect, text)
      } else {
        // Charger l'image avec dimensions adaptées
        const img = new Image()
        img.onload = () => {
          const image = new Konva.Image({
            image: img,
            width: this.stage.width(),
            height: this.stage.height()
          })
          this.layer.removeChildren()
          this.layer.add(image)
          this.layer.batchDraw()
        }
        img.src = this.output.output
      }
      this.layer.batchDraw()
    }
  },
  downloadImage() {
    if (!this.output.output) return

    const link = document.createElement('a')
    link.href = this.output.output
    link.download = `image-${this.output.id}.${this.output.output.split('.').pop()}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  },
  watch: {
    'output.output'() {
      this.updateCanvas()
    }
    ,
    'output.status'() {
      this.updateCanvas()
    }
  }
  ,
  mounted() {
    this.initCanvas()
  }
}
</script>