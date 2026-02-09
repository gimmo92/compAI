import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { competitors, location } = req.body || {}
  const names = Array.isArray(competitors)
    ? competitors.map((name) => String(name || '').trim()).filter(Boolean)
    : []
  const locationTerm = String(location || 'Milano').trim()

  if (!names.length) {
    res.status(400).json({ error: 'Missing competitors' })
    return
  }

  const serperApiKey = process.env.SERPER_API_KEY
  if (!serperApiKey) {
    res.status(500).json({ error: 'Missing SERPER_API_KEY' })
    return
  }

  const toNumber = (value) => {
    if (value === null || value === undefined) return NaN
    const text = String(value).trim()
    if (!text) return NaN
    const multiplier = /[kK]\b/.test(text) ? 1000 : /[mM]\b/.test(text) ? 1000000 : 1
    const cleaned = text.replace(/[^\d.,-]/g, '')
    if (!cleaned) return NaN
    const hasDot = cleaned.includes('.')
    const hasComma = cleaned.includes(',')
    let normalized = cleaned
    if (hasDot && hasComma) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.')
    } else if (hasComma) {
      const parts = cleaned.split(',')
      if (parts[1]?.length === 3) {
        normalized = parts.join('')
      } else {
        normalized = parts.join('.')
      }
    } else if (hasDot) {
      const parts = cleaned.split('.')
      if (parts[1]?.length === 3) {
        normalized = parts.join('')
      }
    }
    const number = Number(normalized)
    return Number.isFinite(number) ? number * multiplier : NaN
  }

  const extractJson = (value) => {
    if (!value) return null
    const match = String(value).match(/\[[\s\S]*\]|\{[\s\S]*\}/)
    return match ? match[0] : null
  }

  const hasNumberMatch = (text, value) => {
    if (!text || !Number.isFinite(value)) return false
    const raw = String(text)
    const normalizedValue = Math.round(value)
    const thousands = Math.round(normalizedValue / 1000)
    const candidates = [
      String(normalizedValue),
      normalizedValue.toLocaleString('it-IT'),
      normalizedValue.toLocaleString('en-US'),
      `${thousands}k`,
      `${thousands} k`
    ]
    return candidates.some((candidate) => {
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return new RegExp(`\\b${escaped}\\b`, 'i').test(raw)
    })
  }

  const detectMonthlyMultiplier = (text) => {
    if (!text) return 12
    const raw = String(text).toLowerCase()
    if (/14\s*mensil/.test(raw)) return 14
    if (/13\s*mensil/.test(raw)) return 13
    if (/mensil/.test(raw)) return 13
    return 12
  }

  const isMonthlySalaryText = (text) => {
    if (!text) return false
    const raw = String(text).toLowerCase()
    return (
      /€\s*\d[\d.,]*\s*\/?\s*mo\b/.test(raw) ||
      /\b(al mese|mensile|mensilità)\b/.test(raw)
    )
  }

  const normalizeRange = (min, max) => {
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null
    let normalizedMin = min
    let normalizedMax = max
    if (normalizedMin > normalizedMax) {
      ;[normalizedMin, normalizedMax] = [normalizedMax, normalizedMin]
    }
    if (normalizedMax < 1000) {
      normalizedMin *= 1000
      normalizedMax *= 1000
    }
    if (normalizedMax < 15000) return null
    if (normalizedMax > 300000) return null
    return { min: normalizedMin, max: normalizedMax }
  }

  const normalizeText = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const isCompanyMatch = (text, company) => {
    if (!text || !company) return false
    const normalizedText = normalizeText(text)
    const tokens = normalizeText(company)
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length >= 2)
    if (!tokens.length) return false
    return tokens.every((token) => normalizedText.includes(token))
  }

  const isRelevantCitation = (value) => {
    if (!value) return false
    const url = String(value).toLowerCase()
    const isLinkedInJob = url.includes('linkedin.com/jobs/view')
    const isIndeedJob = url.includes('indeed.com/viewjob') || url.includes('indeed.com/job')
    const isGlassdoor = url.includes('glassdoor.')
    const isWellfound = url.includes('wellfound.com') || url.includes('angel.co')
    const isDatapizza = url.includes('datapizza.')
    const isTechCompenso = url.includes('techcompenso')
    const isStipendioGiusto = url.includes('stipendiogiusto')
    const isCrebs = url.includes('crebs')
    const isReteInformaticaLavoro = url.includes('reteinformaticalavoro')
    return (
      isLinkedInJob ||
      isIndeedJob ||
      isGlassdoor ||
      isWellfound ||
      isDatapizza ||
      isTechCompenso ||
      isStipendioGiusto ||
      isCrebs ||
      isReteInformaticaLavoro
    )
  }

  const fetchSerperResults = async (queries, num = 10) => {
    const results = await Promise.allSettled(
      queries.map(({ company, query }) =>
        axios
          .post(
            'https://google.serper.dev/search',
            { q: query, num, gl: 'it', hl: 'it' },
            {
              headers: {
                'X-API-KEY': serperApiKey,
                'Content-Type': 'application/json'
              },
              timeout: 6000
            }
          )
          .then((response) => {
            console.log('[competitor] query:', query)
            console.log('[competitor] raw response:', response?.data)
            return { company, data: response?.data }
          })
      )
    )

    const fulfilled = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value)

    return fulfilled.flatMap((entry) =>
      (entry?.data?.organic || []).map((item) => ({
        ...item,
        __company: entry?.company || ''
      }))
    )
  }

  const llmExtractRanges = async (entries) => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.log('[competitor][gemini] GEMINI_API_KEY missing, skip LLM')
      return []
    }
    const safeEntries = Array.isArray(entries) ? entries : []
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    console.log('[competitor][gemini] calling model:', model, 'entries:', safeEntries.length)
    const prompt =
      'Extract salary ranges from the snippets below. Return only explicit ranges found in the text. Never infer or estimate.' +
      ' If the salary is monthly (e.g. €/mo, al mese, mensile), return period as "monthly" and keep min/max as the monthly numbers.' +
      ' If annual, return period as "annual". Output a JSON array of objects: ' +
      '{ "url": "...", "company": "...", "min": number, "max": number, "period": "annual" | "monthly" }. If none, return [] only.'

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }, { text: JSON.stringify(safeEntries) }]
        }
      ],
      generationConfig: {
        temperature: 0
      }
    }

    let response
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )
    } catch (error) {
      console.log('[competitor][gemini] fetch error:', String(error))
      return []
    }

    if (!response.ok) {
      console.log('[competitor][gemini] response not ok:', response.status)
      return []
    }
    const data = await response.json().catch(() => null)
    console.log('[competitor][gemini] response ok')
    const content = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('\n')
    const jsonText = extractJson(content)
    if (!jsonText) return []
    const parsed = JSON.parse(jsonText)
    return Array.isArray(parsed) ? parsed : []
  }

  try {
    const keywordGroup =
      '("RAL" OR "retribuzione" OR "stipendio" OR "annua" OR "lordo" OR "€" OR "EUR")'
    const limitedNames = names.slice(0, 6)

    const extraDomains = [
      'site:datapizza.com',
      'site:techcompenso.com',
      'site:stipendiogiusto.it',
      'site:crebs.it',
      'site:reteinformaticalavoro.it',
      'site:wellfound.com',
      'site:glassdoor.it',
      'site:glassdoor.com'
    ]

    const queries = limitedNames.flatMap((company) => [
      {
        company,
        query: `site:linkedin.com/jobs/view "${company}" "${locationTerm}" ${keywordGroup}`
      },
      {
        company,
        query: `site:indeed.com/viewjob "${company}" "${locationTerm}" ${keywordGroup}`
      },
      ...extraDomains.map((domain) => ({
        company,
        query: `${domain} "${company}" "${locationTerm}" ${keywordGroup}`
      }))
    ])

    const serperResults = await fetchSerperResults(queries, 10).catch(() => [])
    console.log('[competitor] results:', serperResults.length)

    const llmEntries = Array.from(
      new Map(
        serperResults
          .filter((item) => isRelevantCitation(item?.link))
          .filter((item) => {
            const company = item?.__company || ''
            const title = item?.title || ''
            const snippet = item?.snippet || ''
            const isIndeed = String(item?.link || '').toLowerCase().includes('indeed.com')
            if (isCompanyMatch(title, company)) return true
            return isIndeed && isCompanyMatch(snippet, company)
          })
          .map((item) => {
            const title = item?.title || ''
            return [
              item.link,
              {
                url: item.link,
                company: item?.__company || '',
                title,
                text: `${title} ${item?.snippet || ''}`.trim()
              }
            ]
          })
      ).values()
    ).slice(0, 40)

    const llmResults = await llmExtractRanges(llmEntries).catch(() => [])
    console.log('[competitor] gemini ranges:', llmResults.length)
    const items = llmResults
      .map((item) => {
        const minRaw = toNumber(item?.min)
        const maxRaw = toNumber(item?.max)
        const source = llmEntries.find((entry) => entry.url === item?.url)
        if (!source) return null
        const period =
          item?.period === 'monthly' || item?.period === 'annual'
            ? item.period
            : isMonthlySalaryText(source.text)
            ? 'monthly'
            : 'annual'

        let min = minRaw
        let max = maxRaw
        if (period === 'monthly') {
          const multiplier = detectMonthlyMultiplier(source.text)
          min = Number.isFinite(minRaw) ? minRaw * multiplier : minRaw
          max = Number.isFinite(maxRaw) ? maxRaw * multiplier : maxRaw
          if (!hasNumberMatch(source.text, minRaw) && !hasNumberMatch(source.text, maxRaw)) {
            return null
          }
        } else {
          if (!hasNumberMatch(source.text, minRaw) && !hasNumberMatch(source.text, maxRaw)) {
            return null
          }
        }

        const normalized = normalizeRange(min, max)
        if (!normalized) return null
        return {
          competitor: item?.company || source.company || '',
          ral_min: normalized.min,
          ral_max: normalized.max,
          title: source?.title || '',
          link: item?.url || '',
          location: locationTerm
        }
      })
      .filter((item) => item && isRelevantCitation(item.link))

    console.log('[competitor] items:', items.length)
    res.status(200).json({ items })
  } catch (error) {
    const status = error?.response?.status || (error.code === 'ECONNABORTED' ? 504 : 500)
    res.status(status).json({
      error: 'Competitor benchmark failed',
      details: error?.response?.data || String(error)
    })
  }
}
