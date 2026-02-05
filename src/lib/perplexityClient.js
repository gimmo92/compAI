const extractJson = (text) => {
  const match = text?.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  return match ? match[0] : null
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

const normalizeItems = (parsed) => {
  if (Array.isArray(parsed)) return parsed
  if (Array.isArray(parsed?.items)) return parsed.items
  if (Array.isArray(parsed?.results)) return parsed.results
  if (parsed && typeof parsed === 'object') return [parsed]
  return []
}

export const requestPerplexitySalary = async ({ role, location }) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  let response
  try {
    response = await fetch('/api/perplexity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, location }),
      signal: controller.signal
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Timeout Perplexity (30s)')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (response.status === 404) {
      throw new Error('Endpoint /api/perplexity non disponibile (usa vercel dev o deploy)')
    }
    const message = error?.error || `Perplexity request failed (${response.status})`
    throw new Error(message)
  }

  const data = await response.json()
  return data.text
}

export const parseSalaryBenchmark = (text) => {
  const jsonText = extractJson(text)
  if (!jsonText) {
    throw new Error('Invalid JSON output')
  }

  const parsed = JSON.parse(jsonText)
  const items = normalizeItems(parsed)
  const salaries = items
    .map((item) => {
      const directMin = toNumber(item?.ral_min ?? item?.min ?? item?.salary_min)
      const directMax = toNumber(item?.ral_max ?? item?.max ?? item?.salary_max)
      let min = directMin
      let max = directMax
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        const rangeValue =
          item?.range ??
          item?.ral ??
          item?.salary ??
          item?.retribuzione ??
          item?.compenso ??
          item?.stipendio
        const parsedRange = parseRange(rangeValue)
        if (parsedRange) {
          min = parsedRange.min
          max = parsedRange.max
        }
      }
      const normalized = normalizeRange(min, max)
      return {
        min: normalized?.min,
        max: normalized?.max,
        link: item?.link_fonte ?? item?.link ?? item?.url
      }
    })
    .filter((item) => Number.isFinite(item.min) && Number.isFinite(item.max))

  if (!salaries.length) {
    let min = toNumber(parsed.ral_min ?? parsed.min)
    let max = toNumber(parsed.ral_max ?? parsed.max)
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      const rangeFromParsed = parseRange(parsed.range ?? parsed.ral ?? parsed.salary ?? parsed.stipendio)
      if (rangeFromParsed) {
        min = rangeFromParsed.min
        max = rangeFromParsed.max
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      const rangeFromText = parseRange(jsonText) || parseRange(text)
      if (rangeFromText) {
        min = rangeFromText.min
        max = rangeFromText.max
      }
    }
    const normalized = normalizeRange(min, max)
    if (!normalized) {
      throw new Error('Invalid salary values')
    }
    return {
      min: normalized.min,
      med: Math.round((normalized.min + normalized.max) / 2),
      max: normalized.max,
      sources: []
    }
  }

  const min = Math.min(...salaries.map((item) => item.min))
  const max = Math.max(...salaries.map((item) => item.max))
  const med = Math.round(
    salaries.reduce((sum, item) => sum + (item.min + item.max) / 2, 0) / salaries.length
  )
  const sources = Array.from(new Set(salaries.map((item) => item.link).filter(Boolean)))

  return { min, med, max, sources }
}
