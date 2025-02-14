export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    console.log('--- Prediction request:', {
      version: body.version,
      input: body.input
    })

    const result = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${body.replicate_api_token}`,
        'User-Agent': 'ReFlux/1.0'
      },
      body: JSON.stringify({
        version: body.version,
        input: body.input
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