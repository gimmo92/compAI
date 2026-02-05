const extractJson = (text) => {
  const match = text?.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  return match ? match[0] : null
}

const toNumber = (value) => {
  if (value === null || value === undefined) return NaN
  const cleaned = String(value).replace(/[^\d.,-]/g, '').replace(',', '.')
  return Number(cleaned)
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
    throw new Error(error?.error || 'Perplexity request failed')
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
    .map((item) => ({
      min: toNumber(item.ral_min ?? item.min ?? item.salary_min),
      max: toNumber(item.ral_max ?? item.max ?? item.salary_max),
      link: item.link_fonte ?? item.link ?? item.url
    }))
    .filter((item) => Number.isFinite(item.min) && Number.isFinite(item.max))

  if (!salaries.length) {
    const min = toNumber(parsed.ral_min ?? parsed.min)
    const max = toNumber(parsed.ral_max ?? parsed.max)
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new Error('Invalid salary values')
    }
    return {
      min,
      med: Math.round((min + max) / 2),
      max,
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
