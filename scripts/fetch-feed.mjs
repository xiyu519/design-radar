import { readFile, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'

const root = process.cwd()
const outputFile = resolve(root, 'src/generated-feed.ts')
const userAgent = 'Design-Radar/0.1 (+https://github.com/xiyu519/design-radar; public-feed-refresh)'
const execFileAsync = promisify(execFile)
const previewQueue = []
let activePreviewRequests = 0
const maxConcurrentPreviewRequests = 4

const sourceCategories = {
  'The FWA': '作品库',
  'CSS Nectar': '作品库',
  'CSS Design Awards': '作品库',
  'CSS Winner': '作品库',
  'One Page Love': '作品库',
  SiteInspire: '作品库',
  Codrops: '设计媒体',
  'Smashing Magazine': '设计媒体',
  'Webdesigner Depot': '设计媒体',
  Designmodo: '设计媒体',
  'CSS-Tricks': '设计媒体',
  'A List Apart': '设计媒体',
  'Creative Boom': '设计媒体',
  Abduzeedo: '设计媒体',
  'Awwwards Blog': '设计媒体',
  Designboom: '设计媒体',
  "It's Nice That": '设计媒体',
  'Creative Bloq': '设计媒体',
  'UX Collective': 'UX 研究',
  'UX Planet': 'UX 研究',
  'UX Booth': 'UX 研究',
  'Nielsen Norman Group': 'UX 研究',
  'Webflow Blog': 'UX 研究',
  'Figma Blog': 'UX 研究',
  'Brand New': '品牌视觉',
  'Design Milk': '品牌视觉',
  Colossal: '品牌视觉',
}

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
  {
    name: 'One Page Love',
    method: '公开 RSS',
    tone: 'coral',
    url: 'https://onepagelove.com/',
    fetchItems: () => fetchRssItems({
      name: 'One Page Love',
      feedUrl: 'https://onepagelove.com/feed',
      sourceUrl: 'https://onepagelove.com/',
      channel: '精选网站',
      accent: '#d96b51',
    }),
  },
  {
    name: 'Codrops',
    method: '公开 RSS',
    tone: 'blue',
    url: 'https://tympanus.net/codrops/',
    fetchItems: () => fetchRssItems({
      name: 'Codrops',
      feedUrl: 'https://tympanus.net/codrops/feed/',
      sourceUrl: 'https://tympanus.net/codrops/',
      channel: '灵感文章',
      accent: '#306f70',
    }),
  },
  {
    name: 'Smashing Magazine',
    method: '公开 RSS',
    tone: 'ink',
    url: 'https://www.smashingmagazine.com/',
    fetchItems: () => fetchRssItems({
      name: 'Smashing Magazine',
      feedUrl: 'https://www.smashingmagazine.com/feed/',
      sourceUrl: 'https://www.smashingmagazine.com/',
      channel: '灵感文章',
      accent: '#171716',
    }),
  },
  {
    name: 'Webdesigner Depot',
    method: '公开 RSS',
    tone: 'lime',
    url: 'https://www.webdesignerdepot.com/',
    fetchItems: () => fetchRssItems({
      name: 'Webdesigner Depot',
      feedUrl: 'https://www.webdesignerdepot.com/feed/',
      sourceUrl: 'https://www.webdesignerdepot.com/',
      channel: '灵感文章',
      accent: '#809546',
    }),
  },
  {
    name: 'Designmodo',
    method: '公开 RSS',
    tone: 'coral',
    url: 'https://designmodo.com/',
    fetchItems: () => fetchRssItems({
      name: 'Designmodo',
      feedUrl: 'https://designmodo.com/feed/',
      sourceUrl: 'https://designmodo.com/',
      channel: '灵感文章',
      accent: '#d96b51',
    }),
  },
  {
    name: 'CSS-Tricks',
    method: '公开 RSS',
    tone: 'blue',
    url: 'https://css-tricks.com/',
    fetchItems: () => fetchRssItems({
      name: 'CSS-Tricks',
      feedUrl: 'https://css-tricks.com/feed/',
      sourceUrl: 'https://css-tricks.com/',
      channel: '灵感文章',
      accent: '#306f70',
    }),
  },
  {
    name: 'A List Apart',
    method: '公开 RSS',
    tone: 'ink',
    url: 'https://alistapart.com/',
    fetchItems: () => fetchRssItems({
      name: 'A List Apart',
      feedUrl: 'https://alistapart.com/main/feed/',
      sourceUrl: 'https://alistapart.com/',
      channel: '灵感文章',
      accent: '#171716',
    }),
  },
  {
    name: 'Creative Boom',
    method: '公开 RSS',
    tone: 'coral',
    url: 'https://www.creativeboom.com/',
    fetchItems: () => fetchRssItems({
      name: 'Creative Boom',
      feedUrl: 'https://www.creativeboom.com/feed/',
      sourceUrl: 'https://www.creativeboom.com/',
      channel: '灵感文章',
      accent: '#d96b51',
    }),
  },
  {
    name: 'UX Collective',
    method: '公开 RSS',
    tone: 'lime',
    url: 'https://uxdesign.cc/',
    fetchItems: () => fetchRssItems({
      name: 'UX Collective',
      feedUrl: 'https://uxdesign.cc/feed',
      sourceUrl: 'https://uxdesign.cc/',
      channel: '灵感文章',
      accent: '#809546',
    }),
  },
  {
    name: 'UX Planet',
    method: '公开 RSS',
    tone: 'blue',
    url: 'https://uxplanet.org/',
    fetchItems: () => fetchRssItems({
      name: 'UX Planet',
      feedUrl: 'https://uxplanet.org/feed',
      sourceUrl: 'https://uxplanet.org/',
      channel: '灵感文章',
      accent: '#306f70',
    }),
  },
  {
    name: 'Abduzeedo',
    method: '公开 RSS',
    tone: 'ink',
    url: 'https://abduzeedo.com/',
    fetchItems: () => fetchRssItems({
      name: 'Abduzeedo',
      feedUrl: 'https://abduzeedo.com/rss.xml',
      sourceUrl: 'https://abduzeedo.com/',
      channel: '灵感文章',
      accent: '#171716',
    }),
  },
  {
    name: 'SiteInspire',
    method: '公开 RSS',
    tone: 'blue',
    url: 'https://www.siteinspire.com/',
    fetchItems: () => fetchRssItems({
      name: 'SiteInspire',
      feedUrl: 'https://www.siteinspire.com/feed',
      sourceUrl: 'https://www.siteinspire.com/',
      channel: '精选网站',
      accent: '#306f70',
    }),
  },
  {
    name: 'Awwwards Blog',
    method: '公开 RSS',
    tone: 'lime',
    url: 'https://www.awwwards.com/blog/',
    fetchItems: () => fetchRssItems({
      name: 'Awwwards Blog',
      feedUrl: 'https://www.awwwards.com/blog/feed/',
      sourceUrl: 'https://www.awwwards.com/blog/',
      channel: '灵感文章',
      accent: '#809546',
    }),
  },
  {
    name: 'Designboom',
    method: '公开 RSS',
    tone: 'coral',
    url: 'https://www.designboom.com/',
    fetchItems: () => fetchRssItems({
      name: 'Designboom',
      feedUrl: 'https://www.designboom.com/feed/',
      sourceUrl: 'https://www.designboom.com/',
      channel: '灵感文章',
      accent: '#d96b51',
    }),
  },
  {
    name: "It's Nice That",
    method: '公开 RSS',
    tone: 'ink',
    url: 'https://www.itsnicethat.com/',
    fetchItems: () => fetchRssItems({
      name: "It's Nice That",
      feedUrl: 'https://www.itsnicethat.com/rss',
      sourceUrl: 'https://www.itsnicethat.com/',
      channel: '灵感文章',
      accent: '#171716',
    }),
  },
  {
    name: 'Creative Bloq',
    method: '公开 RSS',
    tone: 'blue',
    url: 'https://www.creativebloq.com/',
    fetchItems: () => fetchRssItems({
      name: 'Creative Bloq',
      feedUrl: 'https://www.creativebloq.com/rss',
      sourceUrl: 'https://www.creativebloq.com/',
      channel: '灵感文章',
      accent: '#306f70',
    }),
  },
  {
    name: 'Brand New',
    method: '公开 RSS',
    tone: 'coral',
    url: 'https://www.underconsideration.com/brandnew/',
    fetchItems: () => fetchRssItems({
      name: 'Brand New',
      feedUrl: 'https://www.underconsideration.com/brandnew/rss.php',
      sourceUrl: 'https://www.underconsideration.com/brandnew/',
      channel: '灵感文章',
      accent: '#d96b51',
    }),
  },
  {
    name: 'Design Milk',
    method: '公开 RSS',
    tone: 'lime',
    url: 'https://design-milk.com/',
    fetchItems: () => fetchRssItems({
      name: 'Design Milk',
      feedUrl: 'https://design-milk.com/feed/',
      sourceUrl: 'https://design-milk.com/',
      channel: '灵感文章',
      accent: '#809546',
    }),
  },
  {
    name: 'Colossal',
    method: '公开 RSS',
    tone: 'ink',
    url: 'https://www.thisiscolossal.com/',
    fetchItems: () => fetchRssItems({
      name: 'Colossal',
      feedUrl: 'https://www.thisiscolossal.com/feed/',
      sourceUrl: 'https://www.thisiscolossal.com/',
      channel: '灵感文章',
      accent: '#171716',
    }),
  },
  {
    name: 'UX Booth',
    method: '公开 RSS',
    tone: 'blue',
    url: 'https://www.uxbooth.com/',
    fetchItems: () => fetchRssItems({
      name: 'UX Booth',
      feedUrl: 'https://www.uxbooth.com/feed/',
      sourceUrl: 'https://www.uxbooth.com/',
      channel: '灵感文章',
      accent: '#306f70',
    }),
  },
  {
    name: 'Nielsen Norman Group',
    method: '公开 RSS',
    tone: 'coral',
    url: 'https://www.nngroup.com/',
    fetchItems: () => fetchRssItems({
      name: 'Nielsen Norman Group',
      feedUrl: 'https://www.nngroup.com/feed/rss/',
      sourceUrl: 'https://www.nngroup.com/',
      channel: '灵感文章',
      accent: '#d96b51',
    }),
  },
  {
    name: 'Webflow Blog',
    method: '公开 RSS',
    tone: 'lime',
    url: 'https://webflow.com/blog',
    fetchItems: () => fetchRssItems({
      name: 'Webflow Blog',
      feedUrl: 'https://webflow.com/blog/rss.xml',
      sourceUrl: 'https://webflow.com/blog',
      channel: '灵感文章',
      accent: '#809546',
    }),
  },
  {
    name: 'Figma Blog',
    method: '公开 RSS',
    tone: 'ink',
    url: 'https://www.figma.com/blog/',
    fetchItems: () => fetchRssItems({
      name: 'Figma Blog',
      feedUrl: 'https://www.figma.com/blog/rss.xml',
      sourceUrl: 'https://www.figma.com/blog/',
      channel: '灵感文章',
      accent: '#171716',
    }),
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
  return fetchRssItems({
    name: 'CSS Nectar',
    feedUrl: 'https://cssnectar.com/feed/',
    sourceUrl: 'https://cssnectar.com/',
    channel: '精选网站',
    accent: '#d96b51',
  })
}

function imageCandidate(url, descriptor = '') {
  const decodedUrl = decode(url.trim())
  const descriptorWidth = Number(descriptor.match(/(\d+)w/)?.[1] ?? 0)
  const pathWidth = Math.max(
    ...[...decodedUrl.matchAll(/(?:max|width|w)[=\/-](\d{3,5})\b/gi)].map((match) => Number(match[1])),
    ...[...decodedUrl.matchAll(/-(\d{3,5})x\d{3,5}(?:[.-]|$)/g)].map((match) => Number(match[1])),
    0,
  )
  return { url: decodedUrl, width: Math.max(descriptorWidth, pathWidth) }
}

function srcsetCandidates(value) {
  return value.split(',').flatMap((part) => {
    const [url, descriptor = ''] = part.trim().split(/\s+/, 2)
    return url ? [imageCandidate(url, descriptor)] : []
  })
}

function rssImageCandidates(entry) {
  const candidates = []
  for (const match of entry.matchAll(/<(?:media:content|media:thumbnail|enclosure|image)\b[^>]+\b(?:url|href)=["']([^"']+)["']/gi)) {
    candidates.push(imageCandidate(match[1]))
  }
  for (const tag of entry.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    const srcset = attribute(tag[0], 'srcset')
    if (srcset) candidates.push(...srcsetCandidates(srcset))
    const src = attribute(tag[0], 'src')
    if (src) candidates.push(imageCandidate(src))
  }
  return [...new Map(
    candidates
      .filter((candidate) => usableImage(candidate.url))
      .sort((a, b) => b.width - a.width)
      .map((candidate) => [candidate.url, candidate.url]),
  ).values()]
}

function usableImage(url) {
  return url && !/\.(?:mp4|webm|mov)(?:[?#]|$)/i.test(url)
}

function openGraphImage(html, pageUrl) {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? []
  for (const tag of metaTags) {
    const key = attribute(tag, 'property').toLowerCase() || attribute(tag, 'name').toLowerCase()
    if (key !== 'og:image' && key !== 'twitter:image') continue
    const image = absoluteUrl(attribute(tag, 'content'), pageUrl)
    if (usableImage(image)) return image
  }
  return ''
}

async function rssEntryImage(entry, url) {
  const embeddedImage = rssImageCandidates(entry).find(usableImage) ?? ''
  if (embeddedImage) return embeddedImage

  return queuePreviewRequest(async () => {
    try {
      return openGraphImage(await getPublic(url), url)
    } catch {
      return ''
    }
  })
}

function queuePreviewRequest(request) {
  return new Promise((resolve) => {
    previewQueue.push({ request, resolve })
    drainPreviewQueue()
  })
}

function drainPreviewQueue() {
  while (activePreviewRequests < maxConcurrentPreviewRequests && previewQueue.length) {
    const { request, resolve } = previewQueue.shift()
    activePreviewRequests += 1
    request()
      .then(resolve)
      .catch(() => resolve(''))
      .finally(() => {
        activePreviewRequests -= 1
        drainPreviewQueue()
      })
  }
}

async function fetchRssItems({ name, feedUrl, sourceUrl, channel, accent }) {
  const rss = await getPublic(feedUrl)
  const entries = rss.match(/<(?:item|entry)(?:\s[^>]*)?>[\s\S]*?<\/(?:item|entry)>/gi) ?? []
  const parsedEntries = entries.slice(0, 6).flatMap((entry, index) => {
    const title = xmlTag(entry, 'title')
    const linkTag = entry.match(/<link\b[^>]*>/i)?.[0] ?? ''
    const url = xmlTag(entry, 'link') || attribute(linkTag, 'href')
    const published = Date.parse(xmlTag(entry, 'pubDate') || xmlTag(entry, 'published') || xmlTag(entry, 'updated'))
    if (!title || !url || Number.isNaN(published)) return []
    const date = new Date(published).toISOString().slice(0, 10)
    return [{ entry, index, title, url, date }]
  })

  const withImages = await Promise.all(parsedEntries.map(async ({ entry, ...item }) => ({
    ...item,
    image: await rssEntryImage(entry, item.url),
  })))

  return withImages.flatMap(({ index, title, url, date, image }) => {
    if (!image) return []
    return [{
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${encodeURIComponent(url)}`,
      title,
      date,
      url,
      image,
      sourceUrl,
      source: name,
      channel,
      accent,
      aspect: index % 3 === 0 ? 'portrait' : 'square',
    }]
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
  const previousStatus = previousSourceStatusFrom(previous)
  const knownIds = new Set(previousItems.map((item) => item.id))
  const results = await Promise.allSettled(sources.map((source) => source.fetchItems()))
  const fetchedAt = new Date()
  const statuses = sources.map((source, index) => ({
    name: source.name,
    state: sourceState({ source, result: results[index], previousItems, previousStatus }),
    method: source.method,
    tone: source.tone,
    url: source.url,
    category: sourceCategories[source.name] ?? '设计媒体',
    lastCheckedAt: fetchedAt.toISOString(),
    lastSuccessAt: results[index].status === 'fulfilled' && results[index].value.length
      ? fetchedAt.toISOString()
      : previousStatus.get(source.name)?.lastSuccessAt ?? null,
    active: (results[index].status === 'fulfilled' && results[index].value.length > 0)
      || hasUsablePreviousSnapshot(source.name, previousItems),
  }))
  results.forEach((result, index) => {
    if (result.status === 'rejected') console.warn(`${sources[index].name}: ${result.reason.message}`)
    if (result.status === 'fulfilled' && !result.value.length) console.warn(`${sources[index].name}: no usable public entries found`)
  })
  const freshItems = results.flatMap((result, index) => {
    if (result.status === 'fulfilled') return result.value
    // Keep the last verified records for an individual source if its public page is temporarily unavailable.
    return previousItems.filter((item) => item.source === sources[index].name && usableImage(item.image))
  })
  if (!freshItems.length) throw new Error('No approved source returned usable items; the existing snapshot was kept.')

  const items = freshItems
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 24)
    .map((item) => ({ ...item, dateLabel: dateLabel(item.date), fresh: !knownIds.has(item.id) }))
  const newItemCount = items.filter((item) => item.fresh).length
  await writeFile(outputFile, renderModule({ items, statuses, fetchedAt, newItemCount }))
  console.log(`Updated ${items.length} items from ${statuses.filter((source) => source.active).length} public source(s).`)
}

function previousSourceStatusFrom(moduleSource) {
  const marker = 'export const sourceStatus: SourceStatus[] = '
  const start = moduleSource.indexOf(marker)
  if (start < 0) return new Map()
  const json = balancedJson(moduleSource, start + marker.length)
  if (!json) return new Map()
  try {
    const parsed = JSON.parse(json)
    return new Map(Array.isArray(parsed) ? parsed.map((source) => [source.name, source]) : [])
  } catch {
    return new Map()
  }
}

function sourceState({ source, result, previousItems, previousStatus }) {
  if (result.status === 'fulfilled' && result.value.length) return '已接入'
  if (hasUsablePreviousSnapshot(source.name, previousItems)) return '同步失败，保留快照'
  if (previousStatus.get(source.name)?.active) return '同步失败，无可用预览'
  return '待首次抓取验证'
}

function hasUsablePreviousSnapshot(sourceName, previousItems) {
  return previousItems.some((item) => item.source === sourceName && usableImage(item.image))
}

main().catch((error) => {
  console.error(`Feed refresh skipped: ${error.message}`)
  process.exitCode = 1
})
