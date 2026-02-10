import axios from 'axios'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { role } = req.body || {}
  if (!role) {
    res.status(400).json({ error: 'Missing role' })
    return
  }

  const serperApiKey = process.env.SERPER_API_KEY
  const roleTerm = String(role).trim()
  console.log('[serper] request:', { role: roleTerm })
  const normalizeRole = (value) =>
    String(value || '')
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const buildRoleAliases = (value) => {
    const normalized = normalizeRole(value)
    const aliases = new Set()
    const aliasMap = {
      'data analyst': ['Data Analytics Analyst', 'Analytics Analyst'],
      'compensation and benefits specialist': [
        'C&B Specialist',
        'Compensation & Benefits Specialist',
        'Comp & Ben Specialist'
      ],
      'software engineer': ['Software Developer', 'SWE'],
      'product manager': ['PM'],
      'ux designer': ['UX/UI Designer', 'User Experience Designer'],
      'payroll specialist': ['Payroll Analyst'],
      'talent acquisition lead': ['TA Lead', 'Talent Acquisition Manager']
    }

    if (normalized === 'hr') {
      aliases.add('HR')
      aliases.add('Human Resources')
      aliases.add('HR Manager')
      aliases.add('HR Specialist')
      return Array.from(aliases)
    }

    const hasBusinessPartner = normalized.includes('business partner')
    const isHrRole = /\bhr\b/.test(normalized) || normalized.includes('human resources')
    if (hasBusinessPartner && isHrRole) {
      aliases.add('HRBP')
      aliases.add('HR BP')
    }

    if (normalized === 'hrbp') {
      aliases.add('HR Business Partner')
      aliases.add('Human Resources Business Partner')
    }

    if (aliasMap[normalized]) {
      aliasMap[normalized].forEach((alias) => aliases.add(alias))
    }

    return Array.from(aliases)
  }

  const extraRoleTerms = buildRoleAliases(roleTerm)
  const allRoleTerms = [roleTerm, ...extraRoleTerms]

  const isRoleMatch = (text, terms) => {
    if (!text) return false
    const normalizedText = normalizeRole(text)
    const candidates = Array.isArray(terms) ? terms : []
    return candidates.some((term) => {
      const normalizedTerm = normalizeRole(term)
      if (!normalizedTerm) return false
      const tokens = normalizedTerm.split(' ').filter((token) => token.length >= 2)
      if (!tokens.length) return false
      return tokens.every((token) => normalizedText.includes(token))
    })
  }

  const buildSalaryQueries = () => {
    const keywordGroup =
      '("RAL" OR "retribuzione" OR "stipendio" OR "annua" OR "lordo" OR "€" OR "EUR")'
    const roleGroup = Array.from(new Set([roleTerm, ...extraRoleTerms]))
      .map((term) => `"${term}"`)
      .join(' OR ')
    const roleQuery = roleGroup ? `(${roleGroup})` : `"${roleTerm}"`
    return [
      `site:it.linkedin.com/jobs/view ${roleQuery} ${keywordGroup}`,
      `site:it.indeed.com/viewjob ${roleQuery} ${keywordGroup}`,
      `site:it.indeed.com/job ${roleQuery} ${keywordGroup}`
    ]
  }

  const buildFallbackQueries = () => {
    const roleGroup = Array.from(new Set([roleTerm, ...extraRoleTerms]))
      .map((term) => `"${term}"`)
      .join(' OR ')
    const roleQuery = roleGroup ? `(${roleGroup})` : `"${roleTerm}"`
    return [
      `site:it.linkedin.com/jobs/view ${roleQuery}`,
      `site:it.indeed.com/viewjob ${roleQuery}`,
      `site:it.indeed.com/job ${roleQuery}`
    ]
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
    if (!text) return 13
    const raw = String(text).toLowerCase()
    if (/14\s*mensil/.test(raw)) return 14
    if (/13\s*mensil/.test(raw)) return 13
    if (/mensil/.test(raw)) return 13
    return 13
  }

  const isMonthlySalaryText = (text) => {
    if (!text) return false
    const raw = String(text).toLowerCase()
    return (
      /€\s*\d[\d.,]*\s*\/?\s*mo\b/.test(raw) ||
      /\b(al mese|mensile|mensilità)\b/.test(raw)
    )
  }

  const parseSalaryRange = (value) => {
    if (!value) return null
    const text = String(value)

    const patterns = [
      /(\d[\d.,]*\s*[kKmM]?)\s*(?:-|–|to|a)\s*(\d[\d.,]*\s*[kKmM]?)\s*(?:€|eur|euro)/i,
      /(?:€|eur|euro)\s*(\d[\d.,]*\s*[kKmM]?)(?:\s*(?:-|–|to|a)\s*(\d[\d.,]*\s*[kKmM]?))?/i,
      /(?:ral|retribuzion|stipendio|salary)\s*[:=]?\s*(\d[\d.,]*\s*[kKmM]?)(?:\s*(?:-|–|to|a)\s*(\d[\d.,]*\s*[kKmM]?))?/i,
      /(?:tra|fra|compresa?\s+tra|da)\s*(\d[\d.,]*\s*[kKmM]?)\s*(?:e|a)\s*(\d[\d.,]*\s*[kKmM]?)(?:\s*(?:€|eur|euro))?/i,
      /(\d[\d.,]*\s*[kKmM]?)\s*(?:-|–)\s*(\d[\d.,]*\s*[kKmM]?)(?:\s*(?:annui|annua|annuo|lordo|lordi))?/i
    ]

    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (!match) continue
      const min = toNumber(match[1])
      const max = toNumber(match[2] ?? match[1])
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return { min, max }
      }
    }

    return null
  }

  const llmExtractRanges = async (entries) => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      if (!apiKey) {
        console.log('[gemini] GEMINI_API_KEY missing, skip LLM fallback')
      }
      return []
    }
    const safeEntries = Array.isArray(entries) ? entries : []
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    console.log('[gemini] calling model:', model, 'entries:', safeEntries.length)
    const prompt =
      'Extract salary ranges from the snippets below. Return only explicit ranges found in the text. Never infer or estimate.' +
      ' If the salary is monthly (e.g. €/mo, al mese, mensile), return period as "monthly" and keep min/max as the monthly numbers.' +
      ' If annual, return period as "annual". Output a JSON array of objects: ' +
      '{ "url": "...", "min": number, "max": number, "period": "annual" | "monthly" }. If none, return [] only.'

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { text: JSON.stringify(safeEntries) }
          ]
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
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      )
    } catch (error) {
      console.log('[gemini] fetch error:', String(error))
      return []
    }

    if (!response.ok) {
      console.log('[gemini] response not ok:', response.status)
      return []
    }
    const data = await response.json().catch(() => null)
    console.log('[gemini] response ok')
    const content = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('\n')
    const jsonText = extractJson(content)
    if (!jsonText) return []
    const parsed = JSON.parse(jsonText)
    return Array.isArray(parsed) ? parsed : []
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

  const isRelevantCitation = (value) => {
    if (!value) return false
    const url = String(value).toLowerCase()
    const isLinkedInJob = url.includes('linkedin.com/jobs/view')
    const isIndeedJob = url.includes('indeed.com/viewjob') || url.includes('indeed.com/job')
    return isLinkedInJob || isIndeedJob
  }

  const fetchSerperResults = async (queries, num = 10) => {
    if (!serperApiKey) return []
    const results = await Promise.allSettled(
      queries.map((query) =>
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
            console.log('[serper] query:', query)
            console.log('[serper] raw response:', response?.data)
            return response
          })
      )
    )

    const fulfilled = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value)

    const rejected = results.filter((result) => result.status === 'rejected')
    if (rejected.length) {
      console.log('[serper] failed queries:', rejected.length)
      rejected.slice(0, 3).forEach((result) => {
        console.log('[serper] query error:', String(result.reason))
      })
    }

    return fulfilled.flatMap((response) => response?.data?.organic || [])
  }

  try {
    if (!serperApiKey) {
      res.status(500).json({ error: 'Missing SERPER_API_KEY' })
      return
    }

    let serperResults = await fetchSerperResults(buildSalaryQueries(), 10).catch(() => [])
    if (!serperResults.length) {
      serperResults = await fetchSerperResults(buildFallbackQueries(), 10).catch(() => [])
    }
    console.log('[serper] results:', serperResults.length)

    const llmEntries = Array.from(
      new Map(
        serperResults
          .filter((item) => isRelevantCitation(item?.link))
          .filter((item) =>
            isRoleMatch(`${item?.title || ''} ${item?.snippet || ''}`.trim(), allRoleTerms)
          )
          .map((item) => [
            item.link,
            {
              url: item.link,
              title: item?.title || '',
              text: `${item?.title || ''} ${item?.snippet || ''}`.trim()
            }
          ])
      ).values()
    ).slice(0, 30)

    const llmResults = await llmExtractRanges(llmEntries).catch(() => [])
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
          ral_min: normalized.min,
          ral_max: normalized.max,
          azienda: '',
          title: source?.title || '',
          link_fonte: item?.url || '',
          data_pubblicazione: '',
          location_scope: ''
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
