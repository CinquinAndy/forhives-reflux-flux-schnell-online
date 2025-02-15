export default defineEventHandler(async (event) => {
    try {
        const {token, ids} = getQuery(event)
        if (!token || !ids) {
            return {error: 'Missing token or ids'}
        }

        const id_array = ids.split(',').filter(id => id && id.length > 0)
        if (id_array.length === 0) {
            return {error: 'No valid IDs provided'}
        }

        console.log('--- Polling IDs:', id_array)

        const results = await Promise.all(
            id_array.map((id) =>
                fetch(`https://api.replicate.com/v1/predictions/${id}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'User-Agent': 'ReFlux/1.0'
                    }
                }).then(res => res.json())
            )
        )

        const validPredictions = results.filter(prediction =>
            prediction && !prediction.error && prediction.id
        )

        console.log('--- Valid predictions:', validPredictions)

        return validPredictions
    } catch (e) {
        console.error('--- error (api/prediction):', e.message, e)
        return {
            error: e.message
        }
    }
})