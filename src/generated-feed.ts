import type { DesignItem, FeedMeta, SourceStatus } from './feed-types'

// This snapshot came from The FWA's publicly available home-page data.
// Run `npm run fetch:feed` to refresh it from the approved public sources.
export const feedMeta: FeedMeta = {
  fetchedAt: '2026-07-18T09:42:00+08:00',
  fetchedAtLabel: '2026.07.18 09:42 CST',
  activeSourceCount: 1,
  newItemCount: 1,
  note: '页面展示最近一次成功同步的公开数据快照。',
}

export const sourceStatus: SourceStatus[] = [
  {
    name: 'The FWA',
    state: '已接入',
    method: '公开首页',
    tone: 'blue',
    url: 'https://thefwa.com/',
    active: true,
  },
  {
    name: 'CSS Nectar',
    state: '待同步验证',
    method: '公开 RSS',
    tone: 'ink',
    url: 'https://cssnectar.com/',
    active: false,
  },
]

export const items: DesignItem[] = [
  {
    id: 'fwa-19014',
    title: 'Why Zero',
    source: 'The FWA',
    channel: '设计奖项',
    date: '2026-07-17',
    dateLabel: '7 月 17 日',
    url: 'https://why.zero.university/',
    sourceUrl: 'https://thefwa.com/',
    image: 'https://thefwa.com/dyn/resources/Case_Model_Case/thumbnail/4/19014/1784101672/1364_span3/6a573acddf5fafwa.png',
    accent: '#306f70',
    aspect: 'wide',
    fresh: true,
  },
]
