import { readFile, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const root = process.cwd()
const outputFile = resolve(root, 'src/generated-feed.ts')
const userAgent = 'Design-Radar/0.1 (+https://github.com/your-name/design-radar; public-feed-refresh)'
const execFileAsync = promisify(execFile)

const sources = [
  {
    name: 'The FWA',
    method: '公开首页',
    tone: 'blue',
    url: 'https://thefwa.com/',
    fetchItems: fetchFwaItems,
  },
  {
    name: 'CSS Nectar',
    method: '公开 RSS',
    tone: 'ink',
    url: 'https://cssnectar.com/',
    fetchItems: fetchCssNectarItems,
  },
  {
    name: 'CSS Design Awards',
    method: '公开获奖与提名页',
    tone: 'lime',
    url: 'https://www.cssdesignawards.com/',
    fetchItems: fetchCssDesignAwardsItems,
  },
  {
    name: 'CSS Winner',
    method: '公开获奖页',
    tone: 'coral',
    url: 'https://www.csswinner.com/winners',
    fetchItems: fetchCssWinnerItems,
  },
]

function decode(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '-')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

function stripTags(value = '') {
  return decode(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '))
}

function attribute(html, name) {
  const match = html.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))
  return decode(match?.[2] ?? '')
}

function absoluteUrl(url, base) {
  if (!url) return ''
  try {
    return new URL(url, base).href
  } catch {
    return ''
  }
}

function dateFromMonthDay(monthToken, dayToken, yearToken) {
  const month = new Date(`${monthToken} 1, 2000`).getUTCMonth()
  const day = Number(dayToken)
  const year = Number(yearToken)
  if (Number.isNaN(month) || !Number.isInteger(day) || !Number.isInteger(year)) return ''
  const parsed = new Date(Date.UTC(year, month, day))
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month || parsed.getUTCDate() !== day) return ''
  return parsed.toISOString().slice(0, 10)
}

function xmlTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return decode(match?.[1])
}

function dateLabel(date) {
  const parsed = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(parsed.valueOf())) return '最近收录'
  return `${parsed.getUTCMonth() + 1} 月 ${parsed.getUTCDate()} 日`
}

function formatTimestamp(date) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const value = (type) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}.${value('month')}.${value('day')} ${value('hour')}:${value('minute')} CST`
}

async function getPublic(url) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': userAgent, accept: 'text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.1' },
        signal: AbortSignal.timeout(20_000),
      })
      if (!response.ok) throw new Error(`${url} returned ${response.status}`)
      return response.text()
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000))
    }
  }
  if (lastError?.cause?.code !== 'ENOTFOUND') {
    throw new Error(`${url} failed after 3 attempts: ${lastError?.cause?.code ?? lastError?.message ?? 'unknown error'}`)
  }

  let curlError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      // Node's fetch does not inherit every macOS system proxy. curl does, so use
      // it only as a narrow fallback for a DNS failure in the local environment.
      const { stdout } = await execFileAsync('curl', [
        '--fail', '--silent', '--show-error', '--location', '--max-time', '20',
        '--user-agent', userAgent,
        '--header', 'Accept: text/html,application/rss+xml,application/xml;q=0.9,*/*;q=0.1',
        url,
      ], { maxBuffer: 10 * 1024 * 1024 })
      return stdout
    } catch (error) {
      curlError = error
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000))
    }
  }
  throw new Error(`${url} failed after Node DNS retries and curl fallback: ${curlError.message}`)
}

function balancedJson(text, start) {
  const opening = text[start]
  if (opening !== '{' && opening !== '[') return null
  const closing = opening === '{' ? '}' : ']'
  let depth = 0
  let quote = ''
  let escaped = false
  for (let index = start; index < text.length; index += 1) {
    const char = text[index]
    if (quote) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === opening) depth += 1
    if (char === closing) depth -= 1
    if (depth === 0) return text.slice(start, index + 1)
  }
  return null
}

function findFwaConfig(html) {
  const markers = [/\bkonfig\s*=\s*/, /window\.konfig\s*=\s*/]
  for (const marker of markers) {
    const match = marker.exec(html)
    if (!match) continue
    const start = html.indexOf('{', match.index + match[0].length)
    const json = balancedJson(html, start)
    if (!json) continue
    try {
      return JSON.parse(json)
    } catch {
      // Some FWA deployments may expose a different script format.
    }
  }
  return null
}

function walk(value, visit) {
  if (Array.isArray(value)) value.forEach((entry) => walk(entry, visit))
  else if (value && typeof value === 'object') {
    visit(value)
    Object.values(value).forEach((entry) => walk(entry, visit))
  }
}

function toAbsolute(url) {
  if (!url) return ''
  return url.startsWith('http') ? url : new URL(url, 'https://thefwa.com').href
}

async function fetchFwaItems() {
  const config = findFwaConfig(await getPublic('https://thefwa.com/'))
  if (!config) throw new Error('The FWA public configuration was not found')

  const candidates = []
  walk(config, (value) => {
    const item = value
    const title = typeof item.title === 'string' ? item.title : typeof item.name === 'string' ? item.name : ''
    const thumbnail = typeof item.thumbnail === 'string' ? item.thumbnail : typeof item.image === 'string' ? item.image : ''
    const award = Array.isArray(item.awards) ? item.awards[0] : undefined
    const rawDate = award?.awardedDate ?? item.sortDate ?? item.date
    const date = typeof rawDate === 'string' ? rawDate.slice(0, 10) : ''
    const projectUrl = typeof item.url === 'string' ? item.url : ''
    const slug = typeof item.slug === 'string' ? item.slug : ''
    const id = item.id ?? item.caseId ?? slug
    if (title && thumbnail && projectUrl && date && id) {
      candidates.push({ id: `fwa-${id}`, title, date, url: projectUrl, image: toAbsolute(thumbnail), sourceUrl: 'https://thefwa.com/', source: 'The FWA', channel: '设计奖项', accent: '#306f70', aspect: 'wide' })
    }
  })

  return [...new Map(candidates.map((item) => [item.id, item])).values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 8)
}

async function fetchCssNectarItems() {
  const rss = await getPublic('https://cssnectar.com/feed/')
  const entries = rss.match(/<item>[\s\S]*?<\/item>/gi) ?? []
  return entries.slice(0, 8).flatMap((entry, index) => {
    const title = xmlTag(entry, 'title')
    const url = xmlTag(entry, 'link')
    const published = Date.parse(xmlTag(entry, 'pubDate'))
    const image = entry.match(/<(?:media:content|enclosure)[^>]+url=["']([^"']+)["']/i)?.[1]
      ?? entry.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1]
      ?? ''
    if (!title || !url || !image || Number.isNaN(published)) return []
    const date = new Date(published).toISOString().slice(0, 10)
    return [{ id: `css-nectar-${encodeURIComponent(url)}`, title, date, url, image: decode(image), sourceUrl: url, source: 'CSS Nectar', channel: '精选网站', accent: '#d96b51', aspect: index % 3 === 0 ? 'portrait' : 'square' }]
  })
}

async function fetchCssDesignAwardsItems() {
  const html = await getPublic('https://www.cssdesignawards.com/')
  const articles = html.match(/<article\b[\s\S]*?<\/article>/gi) ?? []
  const entries = articles.flatMap((article, index) => {
    if (!/sp__meta__category/.test(article)) return []
    const imageTag = article.match(/<img\b[^>]+alt=["'][^"']+ website["'][^>]*>/i)?.[0] ?? ''
    const image = absoluteUrl(attribute(imageTag, 'src'), 'https://www.cssdesignawards.com/')
    const title = stripTags(article.match(/<h3\b[^>]*>[\s\S]*?<\/h3>/i)?.[0] ?? '')
    const detailPath = article.match(/href=["'](\/sites\/[^"']+)["']/i)?.[1] ?? ''
    const dateText = stripTags(article.match(/sp__meta__date[^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? '')
    const imageYear = image.match(/\/cdasites\/(20\d{2})\//)?.[1] ?? ''
    const [, month, day] = dateText.match(/^([A-Z]{3})\s+(\d{1,2})$/i) ?? []
    const date = dateFromMonthDay(month, day, imageYear)
    const detailUrl = absoluteUrl(detailPath, 'https://www.cssdesignawards.com/')
    if (!title || !image || !detailUrl || !date) return []
    const id = detailUrl.match(/\/(\d+)\/?$/)?.[1] ?? encodeURIComponent(detailUrl)
    return [{
      id: `cssda-${id}`,
      title,
      date,
      url: detailUrl,
      image,
      sourceUrl: detailUrl,
      source: 'CSS Design Awards',
      channel: '设计奖项',
      accent: '#809546',
      aspect: index % 3 === 1 ? 'portrait' : 'wide',
    }]
  })
  return [...new Map(entries.map((item) => [item.id, item])).values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
}

async function fetchCssWinnerItems() {
  const html = await getPublic('https://www.csswinner.com/winners')
  const figures = html.match(/<figure\b[\s\S]*?<\/figure>/gi) ?? []
  const entries = figures.flatMap((figure, index) => {
    const detailUrl = figure.match(/href=["'](https:\/\/www\.csswinner\.com\/details\/[^"']+)["']/i)?.[1] ?? ''
    const dateText = stripTags(figure.match(/<span>(SOTD\s+\d{1,2}\s+[A-Za-z]{3}\s+20\d{2})<\/span>/i)?.[1] ?? '')
    const imageTag = figure.match(/<img\b[^>]+>/i)?.[0] ?? ''
    const image = attribute(imageTag, 'src')
    const title = attribute(imageTag, 'alt')
    const [, day, month, year] = dateText.match(/^SOTD\s+(\d{1,2})\s+([A-Za-z]{3})\s+(20\d{2})$/i) ?? []
    const date = dateFromMonthDay(month, day, year)
    if (!title || !image || !detailUrl || !date) return []
    const id = detailUrl.match(/\/(\d+)\/?$/)?.[1] ?? encodeURIComponent(detailUrl)
    return [{
      id: `css-winner-${id}`,
      title,
      date,
      url: detailUrl,
      image,
      sourceUrl: detailUrl,
      source: 'CSS Winner',
      channel: '设计奖项',
      accent: '#d96b51',
      aspect: index % 3 === 2 ? 'square' : 'wide',
    }]
  })
  return [...new Map(entries.map((item) => [item.id, item])).values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6)
}

function previousItemsFrom(moduleSource) {
  const marker = 'export const items: DesignItem[] = '
  const start = moduleSource.indexOf(marker)
  if (start < 0) return []
  const json = balancedJson(moduleSource, start + marker.length)
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function renderModule({ items, statuses, fetchedAt, newItemCount }) {
  const meta = {
    fetchedAt: fetchedAt.toISOString(),
    fetchedAtLabel: formatTimestamp(fetchedAt),
    activeSourceCount: statuses.filter((source) => source.active).length,
    newItemCount,
    note: '页面展示最近一次成功同步的公开数据快照。',
  }
  return `import type { DesignItem, FeedMeta, SourceStatus } from './feed-types'\n\n// Generated by scripts/fetch-feed.mjs. Do not edit by hand.\nexport const feedMeta: FeedMeta = ${JSON.stringify(meta, null, 2)}\n\nexport const sourceStatus: SourceStatus[] = ${JSON.stringify(statuses, null, 2)}\n\nexport const items: DesignItem[] = ${JSON.stringify(items, null, 2)}\n`
}

async function main() {
  const previous = await readFile(outputFile, 'utf8').catch(() => '')
  const previousItems = previousItemsFrom(previous)
  const knownIds = new Set(previousItems.map((item) => item.id))
  const results = await Promise.allSettled(sources.map((source) => source.fetchItems()))
  const statuses = sources.map((source, index) => ({
    name: source.name,
    state: results[index].status === 'fulfilled' && results[index].value.length ? '已接入' : '同步失败，保留快照',
    method: source.method,
    tone: source.tone,
    url: source.url,
    active: results[index].status === 'fulfilled' && results[index].value.length > 0,
  }))
  results.forEach((result, index) => {
    if (result.status === 'rejected') console.warn(`${sources[index].name}: ${result.reason.message}`)
    if (result.status === 'fulfilled' && !result.value.length) console.warn(`${sources[index].name}: no usable public entries found`)
  })
  const freshItems = results.flatMap((result, index) => {
    if (result.status === 'fulfilled') return result.value
    // Keep the last verified records for an individual source if its public page is temporarily unavailable.
    return previousItems.filter((item) => item.source === sources[index].name)
  })
  if (!freshItems.length) throw new Error('No approved source returned usable items; the existing snapshot was kept.')

  const items = freshItems
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)
    .map((item) => ({ ...item, dateLabel: dateLabel(item.date), fresh: !knownIds.has(item.id) }))
  const newItemCount = items.filter((item) => item.fresh).length
  await writeFile(outputFile, renderModule({ items, statuses, fetchedAt: new Date(), newItemCount }))
  console.log(`Updated ${items.length} items from ${statuses.filter((source) => source.active).length} public source(s).`)
}

main().catch((error) => {
  console.error(`Feed refresh skipped: ${error.message}`)
  process.exitCode = 1
})
