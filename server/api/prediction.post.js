export default defineEventHandler(async (event) => {
    try {
        const {replicate_api_token, input} = await readBody(event)

        const result = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${replicate_api_token}`,
                'User-Agent': 'ReFlux/1.0'
            },
            body: JSON.stringify({
                // Spécifier directement le modèle comme version
                version: "black-forest-labs/flux-schnell",
                input: input
            })
        })

        const prediction = await result.json()

        return prediction
    } catch (e) {
        console.error('--- error (api/prediction):', e.message, e)
        return {
            error: e.message
        }
    }
})