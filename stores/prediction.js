import {useLocalStorage} from '@vueuse/core'

export const usePredictionStore = defineStore('predictionStore', {
    state: () => ({
        replicate_api_token: useLocalStorage('reflux-replicate-api-token', null),
        outputs: useLocalStorage('reflux-outputs', []),
    }),
    actions: {
        // Méthode pour réinitialiser complètement les outputs
        resetStore() {
            this.outputs = []
        },

        // Ajouter une méthode pour nettoyer les outputs invalides
        cleanupOutputs() {
            // Filtrer les outputs qui ont des IDs valides
            this.outputs = this.outputs.filter(output =>
                output &&
                output.metadata &&
                output.metadata.prediction_id &&
                output.metadata.prediction_id.length > 0
            )
        },

        async createPrediction({input}) {
            try {
                const prediction = await $fetch('/api/prediction', {
                    method: 'POST',
                    body: {
                        replicate_api_token: this.replicate_api_token,
                        input
                    }
                })

                if (prediction.error) {
                    console.error('API Error:', prediction.error)
                    return
                }

                // Calculer les dimensions
                const baseSize = 300
                const [width, height] = input.aspect_ratio.split(':').map(Number)
                const scaledWidth = baseSize
                const scaledHeight = (height / width) * baseSize

                // Générer autant d'outputs que demandé
                for (let i = 0; i < input.num_outputs; i++) {
                    const newOutput = {
                        id: `output-${prediction.id}-${i}`,
                        status: prediction.status,
                        input: prediction.input,
                        output: null,
                        output_index: i,
                        metadata: {
                            prediction_id: prediction.id,
                            x: 0,
                            y: 0,
                            rotation: 0,
                            width: scaledWidth,
                            height: scaledHeight
                        }
                    }
                    this.outputs.push(newOutput)
                }

                return prediction

            } catch (e) {
                console.error('(stores/prediction) error:', e.message, e)
            }
        },
        async pollIncompletePredictions() {
            try {
                this.cleanupOutputs()

                const prediction_ids = [
                    ...new Set(
                        this.incompletePredictions
                            .map((output) => output?.metadata?.prediction_id || null)
                            .filter((id) => id && id.length > 0)
                    )
                ]

                if (prediction_ids.length === 0) {
                    return
                }

                const pollUrl = `/api/prediction?ids=${prediction_ids.join(',')}&token=${this.replicate_api_token}`
                const pollResponse = await $fetch(pollUrl)

                if (!pollResponse) {
                    console.error('--- No response from polling')
                    return
                }

                if (pollResponse.error) {
                    console.error('--- Polling error:', pollResponse.error)
                    return
                }

                const predictions = Array.isArray(pollResponse) ? pollResponse : [pollResponse]

                for (const prediction of predictions) {
                    if (!prediction || !prediction.id) continue

                    const outputsToUpdate = this.outputs.filter(
                        output => output?.metadata?.prediction_id === prediction.id
                    )

                    for (const output of outputsToUpdate) {
                        const outputIndex = this.outputs.findIndex(o => o.id === output.id)
                        if (outputIndex === -1) continue

                        const base = this.outputs[outputIndex]
                        const updatedOutput = {
                            ...base,
                            status: prediction.status,
                            input: prediction.input
                        }

                        if (prediction.output && Array.isArray(prediction.output)) {
                            const imageUrl = prediction.output[output.output_index]
                            if (imageUrl) {
                                try {
                                    updatedOutput.output = await urlToBase64(imageUrl)
                                } catch (err) {
                                    console.error('Error converting output to base64:', err)
                                }
                            }
                        }
                        this.outputs[outputIndex] = updatedOutput
                    }
                }
            } catch (e) {
                console.error('--- Error polling predictions:', e.message, e)
            }
        },

        // Pour la manipulation du canvas
        updateOutputPosition({id, x, y, rotation, width, height}) {
            const index = this.outputs.findIndex((output) => output.id === id)
            if (index !== -1) {
                this.outputs[index].metadata.x = x
                this.outputs[index].metadata.y = y
                this.outputs[index].metadata.rotation = rotation
                if (width !== undefined) this.outputs[index].metadata.width = width
                if (height !== undefined) this.outputs[index].metadata.height = height
            }
        },

        removeOutput(id) {
            if (Array.isArray(id)) {
                this.outputs = this.outputs.filter((output) => !id.includes(output.id))
            } else {
                this.outputs = this.outputs.filter((output) => output.id !== id)
            }
        }
    },

    getters: {
        incompletePredictions: (state) =>
            state.outputs.filter(output =>
                output &&
                output.metadata &&
                output.metadata.prediction_id &&
                output.status !== 'succeeded' &&
                output.status !== 'failed'
            )
    }
})

// Utilitaire pour convertir les URLs en base64 pour l'affichage
const urlToBase64 = async (urlOrArray) => {
    const convertSingle = async (url) => {
        if (typeof url !== 'string' || !url.startsWith('https')) {
            return url
        }

        try {
            const urlParts = url.split('/')
            const fileName = urlParts[urlParts.length - 1]
            const fileExtension = fileName.split('.').pop().toLowerCase()

            const response = await fetch(url)
            const blob = await response.blob()

            let fileType
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)) {
                fileType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`
            } else {
                fileType = blob.type || 'application/octet-stream'
            }

            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onloadend = () => {
                    const base64data = reader.result
                    const dataUri = `data:${fileType};base64,${base64data.split(',')[1]}`
                    resolve(dataUri)
                }
                reader.onerror = reject
                reader.readAsDataURL(blob)
            })
        } catch (error) {
            console.error('Error converting URL to base64:', error)
            return url
        }
    }

    if (Array.isArray(urlOrArray)) {
        return Promise.all(urlOrArray.map(convertSingle))
    } else {
        return convertSingle(urlOrArray)
    }
}