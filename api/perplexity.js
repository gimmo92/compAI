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
    "Sei un analista Compensation & Benefits. Cerca annunci di lavoro REALI in Italia per [role] a [location]. Se non trovi RAL per [location], espandi a Lombardia e poi a Italia, indicando il campo location_scope (Milano/Lombardia/Italia). Estrai i dati in formato JSON con un array 'items', ogni elemento deve includere: ral_min, ral_max, azienda, link_fonte, data_pubblicazione, location_scope. Usa SOLO numeri esplicitamente presenti nella fonte, NON stimare o inventare. Fornisci solo link_fonte reali (URL completi). Non citare link non legati a salari, JSON o documentazione. Se non trovi RAL verificabili, rispondi con JSON: {\"error\":\"no_verified_salary\"}."
      .replace('[role]', role)
      .replace('[location]', location)

  const reportPrompt =
    "Sei un analista Compensation & Benefits. Cerca report salariali o pagine benchmark REALI in Italia per [role] a [location] (es. Glassdoor, LinkedIn Salary, Indeed, Payscale o report aziendali). Se non trovi per [location], espandi a Lombardia e poi a Italia, indicando il campo location_scope (Milano/Lombardia/Italia). Estrai i dati in formato JSON con un array 'items', ogni elemento deve includere: ral_min, ral_max, azienda (o fonte), link_fonte, data_pubblicazione, location_scope. Usa SOLO numeri esplicitamente presenti nella fonte, NON stimare o inventare. Fornisci solo link_fonte reali (URL completi). Non citare link non legati a salari, JSON o documentazione. Se non trovi RAL verificabili, rispondi con JSON: {\"error\":\"no_verified_salary\"}."
      .replace('[role]', role)
      .replace('[location]', location)

  const queryHints = `Query suggerite: "RAL ${role} ${location}", "stipendio ${role} ${location}", "${role} retribuzione ${location}", "salary ${role} Italy", "HR Generalist salary Milan". Preferisci siti con numeri salariali reali.`

  const isRelevantCitation = (value) => {
    if (!value) return false
    const url = String(value).toLowerCase()
    const allowedHosts = [
      'glassdoor',
      'indeed',
      'linkedin.com/salary',
      'payscale',
      'salaryexpert',
      'talent.com',
      'monster',
      'jooble',
      'job',
      'jobs'
    ]
    const salaryHints = ['salary', 'stipend', 'retribuz', 'ral', 'compensation']
    const hostMatch = allowedHosts.some((host) => url.includes(host))
    const hintMatch = salaryHints.some((hint) => url.includes(hint))
    return hostMatch || hintMatch
  }

  const callPerplexity = async (model, timeoutMs, systemPrompt) => {
    return axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: queryHints },
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
      response = await callPerplexity('sonar-deep-research', 6000, jobPostPrompt)
    } catch (error) {
      const isTimeout = error?.code === 'ECONNABORTED'
      if (!isTimeout) {
        throw error
      }
      response = await callPerplexity('sonar', 3000, jobPostPrompt)
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
        reportResponse = await callPerplexity('sonar', 3000, reportPrompt)
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
