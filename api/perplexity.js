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

  const jobPostPrompt =
    "Trova 5 annunci di lavoro ATTIVI su LinkedIn o Indeed per [role] a [location] che riportino esplicitamente la RAL o un range salariale nel testo. Non fornire siti di medie salariali o calcolatori. Voglio il link diretto all'annuncio e la cifra indicata. Se non ne trovi, cerca tra gli annunci pubblicati negli ultimi 30 giorni. Rispondi SOLO con JSON: {\"items\":[{\"ral_min\":number,\"ral_max\":number,\"azienda\":string,\"link_fonte\":string,\"data_pubblicazione\":string,\"location_scope\":string}]}. Se non trovi annunci con RAL verificabile, rispondi con JSON: {\"error\":\"no_verified_salary\"}."
      .replace('[role]', role)
      .replace('[location]', location)

  const reportPrompt =
    "Sei un analista Compensation & Benefits. Cerca report salariali o pagine benchmark REALI in Italia per [role] a [location] (es. Glassdoor, LinkedIn Salary, Indeed, Payscale o report aziendali). Se non trovi per [location], espandi a Lombardia e poi a Italia, indicando il campo location_scope (Milano/Lombardia/Italia). Estrai i dati in formato JSON con un array 'items', ogni elemento deve includere: ral_min, ral_max, azienda (o fonte), link_fonte, data_pubblicazione, location_scope. Usa SOLO numeri esplicitamente presenti nella fonte, NON stimare o inventare. Fornisci solo link_fonte reali (URL completi). Non citare link non legati a salari, JSON o documentazione. Se non trovi RAL verificabili, rispondi con JSON: {\"error\":\"no_verified_salary\"}."
      .replace('[role]', role)
      .replace('[location]', location)

  const queryHints = `Usa query mirate solo a job post:
1) site:linkedin.com/jobs/view "${role}" "${location}" "RAL" "€"
2) site:indeed.com/viewjob "${role}" "${location}" "RAL" "€"
3) site:indeed.com/job "${role}" "${location}" "RAL" "€"
Escludi report salariali e calcolatori.`

  const isRelevantCitation = (value) => {
    if (!value) return false
    const url = String(value).toLowerCase()
    const isLinkedInJob = url.includes('linkedin.com/jobs/view')
    const isIndeedJob = url.includes('indeed.com/viewjob') || url.includes('indeed.com/job')
    return isLinkedInJob || isIndeedJob
  }

  const callPerplexity = async (model, timeoutMs, systemPrompt) => {
    return axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `${queryHints}\n\nRispondi solo con JSON valido.`
          }
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

  const deepTimeoutMs = 12000
  const fastTimeoutMs = 8000

  try {
    let response
    try {
      response = await callPerplexity('sonar-deep-research', deepTimeoutMs, jobPostPrompt)
    } catch (error) {
      const isTimeout = error?.code === 'ECONNABORTED'
      if (!isTimeout) {
        throw error
      }
      response = await callPerplexity('sonar', fastTimeoutMs, jobPostPrompt)
    }

    const text = response?.data?.choices?.[0]?.message?.content
    if (!text) {
      res.status(502).json({ error: 'Invalid response from Perplexity' })
      return
    }

    const needsReportFallback = /"error"\s*:\s*"no_verified_salary"/i.test(text)
    if (needsReportFallback) {
      let reportResponse
      try {
        reportResponse = await callPerplexity('sonar', fastTimeoutMs, reportPrompt)
      } catch {
        reportResponse = null
      }
      if (reportResponse?.data?.choices?.[0]?.message?.content) {
        response = reportResponse
      }
    }

    const finalText = response?.data?.choices?.[0]?.message?.content
    const citations =
      response?.data?.citations ||
      response?.data?.choices?.[0]?.message?.citations ||
      response?.data?.choices?.[0]?.citations ||
      []
    const filteredCitations = citations.filter(isRelevantCitation)
    const hasVerifiedSalary = !/"error"\s*:\s*"no_verified_salary"/i.test(finalText || '')

    if (!hasVerifiedSalary && !filteredCitations.length) {
      res.status(200).json({ text: '{"error":"no_verified_salary"}', citations: [] })
      return
    }

    res.status(200).json({ text: finalText, citations: filteredCitations })
  } catch (error) {
    const status = error?.response?.status || (error.code === 'ECONNABORTED' ? 504 : 500)
    res.status(status).json({
      error: 'Perplexity request failed',
      details: error?.response?.data || String(error)
    })
  }
}
