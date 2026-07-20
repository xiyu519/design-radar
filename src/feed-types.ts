export type SourceName = string

export type Channel = '全部' | '设计奖项' | '精选网站' | '灵感文章'

export type SourceCategory = '作品库' | '设计媒体' | 'UX 研究' | '品牌视觉'

export type DesignItem = {
  id: string
  title: string
  source: SourceName
  channel: Exclude<Channel, '全部'>
  date: string
  dateLabel: string
  url: string
  image: string
  accent: string
  aspect: 'wide' | 'portrait' | 'square'
  fresh?: boolean
  sourceUrl: string
}

export type SourceStatus = {
  name: SourceName
  state: string
  method: string
  tone: 'lime' | 'blue' | 'coral' | 'ink'
  url: string
  active: boolean
  category?: SourceCategory
  lastCheckedAt?: string
  lastSuccessAt?: string | null
}

export type FeedMeta = {
  fetchedAt: string
  fetchedAtLabel: string
  activeSourceCount: number
  newItemCount: number
  note: string
}
