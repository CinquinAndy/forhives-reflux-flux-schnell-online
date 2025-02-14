<template lang="pug">
  .relative.border.rounded-lg.overflow-hidden.bg-white.shadow-md
    //- Canvas container avec maintien du ratio
    .relative(:style="containerStyle")
      #canvas(
        :ref="'canvas-' + output.id"
        class="absolute inset-0 w-full h-full"
      )

    //- Download button
    .absolute.top-2.right-2.gap-2.flex
      //- Delete button
      //  with hover in pug langage
      u-button(
        class="opacity-50 hover:opacity-100"
        @click="deleteImage"
        color="red"
        variant="solid"
        icon="i-heroicons-trash"
        size="xs"
      )
      u-button(
        @click="downloadImage"
        color="white"
        variant="solid"
        icon="i-heroicons-arrow-down-tray"
        size="xs"
        :disabled="!output.output || output.status !== 'succeeded'"
      )

    //- Status
    .absolute.bottom-2.left-2(v-if="output.status !== 'succeeded'")
      u-badge(:color="statusColor") {{ output.status }}

    //- Info section
    .p-3.border-t
      .text-xs.text-gray-500.truncate(title="output.input.prompt") {{ output.input.prompt }}
      .text-xs.text-gray-400.mt-1 Ratio: {{ output.input.aspect_ratio }}
</template>

<script>
import {mapActions} from 'pinia'
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
    containerStyle() {
      const [width, height] = this.output.input.aspect_ratio.split(':').map(Number)
      const paddingPercentage = (height / width) * 100
      return {
        paddingBottom: `${paddingPercentage}%`,
        position: 'relative'
      }
    },
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
  data: () => ({
    stage: null,
    layer: null
  }),
  methods: {
    ...mapActions(usePredictionStore, ['removeOutput']),
    deleteImage() {
      this.removeOutput(this.output.id)
    },
    initCanvas() {
      const container = this.$refs[`canvas-${this.output.id}`]
      if (!container) return

      // Utiliser les dimensions réelles du conteneur
      const rect = container.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

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
        // Placeholder
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
        // Charger l'image en respectant le ratio
        const img = new Image()
        img.onload = () => {
          const containerSize = this.stage.size()
          const imageSize = {
            width: img.width,
            height: img.height
          }

          // Calculer les dimensions pour maintenir le ratio
          const scale = Math.min(
              containerSize.width / imageSize.width,
              containerSize.height / imageSize.height
          )

          const width = imageSize.width * scale
          const height = imageSize.height * scale

          // Centrer l'image
          const x = (containerSize.width - width) / 2
          const y = (containerSize.height - height) / 2

          const image = new Konva.Image({
            image: img,
            x,
            y,
            width,
            height
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
      if (!this.output.output || !this.output.output[0]) return

      const imageData = this.output.output[0]
      // Vérifier si c'est une donnée base64
      if (imageData.startsWith('data:')) {
        // C'est déjà en base64
        const extension = this.output.input.output_format || 'webp'
        const link = document.createElement('a')
        link.href = imageData
        link.download = `image-${this.output.id}.${extension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // C'est une URL, on doit d'abord la convertir en blob
        fetch(imageData)
            .then(response => response.blob())
            .then(blob => {
              const url = window.URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              const extension = this.output.input.output_format || 'webp'
              link.download = `image-${this.output.id}.${extension}`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              window.URL.revokeObjectURL(url)
            })
            .catch(error => {
              console.error('Error downloading image:', error)
            })
      }
    },
    handleResize() {
      if (!this.stage) return

      const container = this.$refs[`canvas-${this.output.id}`]
      if (!container) return

      // Mettre à jour les dimensions du stage
      this.stage.width(container.offsetWidth)
      this.stage.height(container.offsetHeight)

      // Forcer la mise à jour du canvas
      this.updateCanvas()
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
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>