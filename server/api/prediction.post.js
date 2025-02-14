export default defineEventHandler(async (event) => {
  try {
    const { replicate_api_token, model, input } = await readBody(event)
    console.log('--- Prediction request:', { model, input })

    const result = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${replicate_api_token}`,
        'User-Agent': 'ReFlux/1.0'
      },
      body: JSON.stringify({
        // Utiliser le modèle au lieu de la version
        version: model, // Replicate s'attend toujours à un champ "version"
        input
      })
    })

    const prediction = await result.json()
    console.log('--- Replicate API response:', prediction)

    return prediction
  } catch (e) {
    console.error('--- error (api/prediction):', e.message, e)
    return {
      error: e.message
    }
  }
})