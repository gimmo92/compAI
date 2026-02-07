import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { role, location } = req.body || {}
  if (!role || !location) {
    res.status(400).json({ error: 'Missing role or location' })
    return
  }

  const serperApiKey = process.env.SERPER_API_KEY
  const buildSerperQueries = () => [
    `site:linkedin.com/jobs/view "${role}" "${location}" "RAL" "€"`,
    `site:indeed.com/viewjob "${role}" "${location}" "RAL" "€"`,
    `site:indeed.com/job "${role}" "${location}" "RAL" "€"`
  ]

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

  const parseRange = (value) => {
    if (!value) return null
    const matches = String(value).match(/(\d[\d.,]*\s*[kKmM]?)/g)
    if (!matches || !matches.length) return null
    const numbers = matches.map((entry) => toNumber(entry)).filter(Number.isFinite)
    if (!numbers.length) return null
    const min = Math.min(...numbers)
    const max = Math.max(...numbers)
    return { min, max }
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
    return { min: normalizedMin, max: normalizedMax }
  }

  const isRelevantCitation = (value) => {
    if (!value) return false
    const url = String(value).toLowerCase()
    const isLinkedInJob = url.includes('linkedin.com/jobs/view')
    const isIndeedJob = url.includes('indeed.com/viewjob') || url.includes('indeed.com/job')
    return isLinkedInJob || isIndeedJob
  }

  const fetchSerperResults = async () => {
    if (!serperApiKey) return []
    const queries = buildSerperQueries()
    const results = await Promise.all(
      queries.map((query) =>
        axios.post(
          'https://google.serper.dev/search',
          { q: query, num: 5 },
          {
            headers: {
              'X-API-KEY': serperApiKey,
              'Content-Type': 'application/json'
            },
            timeout: 6000
          }
        )
      )
    )
    return results.flatMap((response) => {
      const organic = response?.data?.organic || []
      return organic
    })
  }

  try {
    if (!serperApiKey) {
      res.status(500).json({ error: 'Missing SERPER_API_KEY' })
      return
    }

    const serperResults = await fetchSerperResults().catch(() => [])
    if (!serperResults.length) {
      res.status(200).json({ text: '{"error":"no_verified_salary"}', citations: [] })
      return
    }

    const items = serperResults
      .map((item) => {
        const text = `${item?.title || ''} ${item?.snippet || ''}`
        const range = parseRange(text)
        const normalized = range ? normalizeRange(range.min, range.max) : null
        if (!normalized) return null
        return {
          ral_min: normalized.min,
          ral_max: normalized.max,
          azienda: item?.title || '',
          link_fonte: item?.link || '',
          data_pubblicazione: '',
          location_scope: location
        }
      })
      .filter((item) => item && isRelevantCitation(item.link_fonte))

    if (!items.length) {
      res.status(200).json({ text: '{"error":"no_verified_salary"}', citations: [] })
      return
    }

    const citations = Array.from(
      new Set(items.map((item) => item.link_fonte).filter(Boolean))
    ).filter(isRelevantCitation)

    res.status(200).json({ text: JSON.stringify({ items }), citations })
  } catch (error) {
    const status = error?.response?.status || (error.code === 'ECONNABORTED' ? 504 : 500)
    res.status(status).json({
      error: 'Serper request failed',
      details: error?.response?.data || String(error)
    })
  }
}
