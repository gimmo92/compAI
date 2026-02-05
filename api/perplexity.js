import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'Missing PERPLEXITY_API_KEY' })
    return
  }

  const { role, location } = req.body || {}
  if (!role || !location) {
    res.status(400).json({ error: 'Missing role or location' })
    return
  }

  const systemPrompt =
    "Sei un analista Compensation & Benefits. Cerca annunci di lavoro REALI in Italia per [role] a [location]. Estrai i dati in formato JSON con un array 'items', ogni elemento deve includere: ral_min, ral_max, azienda, link_fonte, data_pubblicazione. Fornisci solo link_fonte reali (URL completi) alle fonti. Se non trovi RAL verificabili, rispondi con JSON: {\"error\":\"no_verified_salary\"} e non stimare."
      .replace('[role]', role)
      .replace('[location]', location)

  const callPerplexity = async (model, timeoutMs) => {
    return axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Rispondi solo con JSON valido.' }
        ],
        temperature: 0.2
      },
      {
        timeout: timeoutMs,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )
  }

  try {
    let response
    try {
      response = await callPerplexity('sonar-deep-research', 6000)
    } catch (error) {
      const isTimeout = error?.code === 'ECONNABORTED'
      if (!isTimeout) {
        throw error
      }
      response = await callPerplexity('sonar', 3000)
    }

    const text = response?.data?.choices?.[0]?.message?.content
    if (!text) {
      res.status(502).json({ error: 'Invalid response from Perplexity' })
      return
    }

    const citations =
      response?.data?.citations ||
      response?.data?.choices?.[0]?.message?.citations ||
      response?.data?.choices?.[0]?.citations ||
      []

    res.status(200).json({ text, citations })
  } catch (error) {
    const status = error?.response?.status || (error.code === 'ECONNABORTED' ? 504 : 500)
    res.status(status).json({
      error: 'Perplexity request failed',
      details: error?.response?.data || String(error)
    })
  }
}
