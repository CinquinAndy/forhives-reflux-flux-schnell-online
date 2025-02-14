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

        async createPrediction({input}) {  // Retiré model du destructuring
            try {
                const prediction = await $fetch('/api/prediction', {
                    method: 'POST',
                    body: {
                        replicate_api_token: this.replicate_api_token,
                        input
                    }
                })

                console.log('--- Prediction response:', prediction)

                // Si erreur dans la réponse
                if (prediction.error) {
                    console.error('--- API Error:', prediction.error)
                    return
                }

                // Calculer les dimensions pour l'affichage
                const baseSize = 300
                const [width, height] = input.aspect_ratio.split(':').map(Number)
                const scaledWidth = baseSize
                const scaledHeight = (height / width) * baseSize

                console.log('--- Dimensions calculées:', {scaledWidth, scaledHeight})

                // Ajouter aux outputs pour l'affichage
                const newOutput = {
                    id: `output-${prediction.id}`,  // Ajout du préfixe
                    status: prediction.status,
                    input: prediction.input,
                    output: null,
                    metadata: {
                        prediction_id: prediction.id,
                        x: 0,
                        y: 0,
                        rotation: 0,
                        width: scaledWidth,
                        height: scaledHeight
                    }
                }
                console.log('--- Adding new output:', newOutput)

                this.outputs.push(newOutput)

                return prediction

            } catch (e) {
                console.error('--- (stores/prediction) error:', e.message, e)
            }
        },

        // Pour le polling des résultats
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

                console.log('--- Valid prediction IDs for polling:', prediction_ids)

                // Changement ici : stockons la réponse dans une constante avant de l'utiliser
                const response = await $fetch(
                    `/api/prediction?ids=${prediction_ids.join(',')}&token=${this.replicate_api_token}`
                )

                if (!response || response.error) {
                    console.error('--- Polling error:', response?.error || 'No response')
                    return
                }

                // Vérifions que response est un tableau
                const predictions = Array.isArray(response) ? response : [response]
                console.log('--- Poll response:', predictions)

                for (const prediction of predictions) {
                    // Vérifions que la prédiction est valide
                    if (!prediction || !prediction.id) continue

                    const targets = this.outputs.filter(
                        (i) => i?.metadata?.prediction_id === prediction.id
                    )
                    console.log('--- Updating targets:', targets)

                    for (const target of targets) {
                        const index = this.outputs.findIndex((i) => i.id === target.id)
                        if (index !== -1) {
                            // Création d'une copie de l'output existant
                            const baseOutput = {...this.outputs[index]}

                            // Création du nouvel output avec les données mises à jour
                            const updatedOutput = {
                                ...baseOutput,
                                input: prediction.input || baseOutput.input,
                                status: prediction.status || baseOutput.status,
                            }

                            // Si la prédiction a un output, convertissons-le en base64
                            if (prediction.output) {
                                try {
                                    updatedOutput.output = await urlToBase64(prediction.output)
                                } catch (e) {
                                    console.error('Error converting output to base64:', e)
                                }
                            }

                            console.log('--- Updating output:', {
                                id: target.id,
                                oldStatus: baseOutput.status,
                                newStatus: prediction.status,
                                hasOutput: !!prediction.output
                            })

                            this.outputs[index] = updatedOutput
                        }
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