import type { SourceCategory } from './feed-types'

export const sourceCategoryFilters = ['全部来源', '作品库', '设计媒体', 'UX 研究', '品牌视觉'] as const

export type SourceCategoryFilter = typeof sourceCategoryFilters[number]

export type SourceCatalogEntry = {
  category: SourceCategory
  focus: string
  policy: string
}

export const sourceCatalog: Record<string, SourceCatalogEntry> = {
  'The FWA': { category: '作品库', focus: '数字体验与互动作品', policy: '公开页面，低频读取，原站回跳' },
  'CSS Nectar': { category: '作品库', focus: '网站设计精选', policy: '公开 RSS，原站回跳' },
  'CSS Design Awards': { category: '作品库', focus: '获奖与提名网站', policy: '公开页面，低频读取，原站回跳' },
  'CSS Winner': { category: '作品库', focus: '每日获奖网站', policy: '公开页面，低频读取，原站回跳' },
  'One Page Love': { category: '作品库', focus: '单页与落地页灵感', policy: '公开 RSS，原站回跳' },
  SiteInspire: { category: '作品库', focus: '网页设计案例库', policy: '公开 RSS，原站回跳' },
  Codrops: { category: '设计媒体', focus: '前端实验与网页灵感', policy: '公开 RSS，原站回跳' },
  'Smashing Magazine': { category: '设计媒体', focus: '设计与前端实践', policy: '公开 RSS，原站回跳' },
  'Webdesigner Depot': { category: '设计媒体', focus: '网页设计趋势', policy: '公开 RSS，原站回跳' },
  Designmodo: { category: '设计媒体', focus: '产品与网页设计', policy: '公开 RSS，原站回跳' },
  'CSS-Tricks': { category: '设计媒体', focus: '网页制作与界面细节', policy: '公开 RSS，原站回跳' },
  'A List Apart': { category: '设计媒体', focus: '网页设计与内容策略', policy: '公开 RSS，原站回跳' },
  'Creative Boom': { category: '设计媒体', focus: '创意行业与视觉文化', policy: '公开 RSS，原站回跳' },
  Abduzeedo: { category: '设计媒体', focus: '视觉、产品与创意趋势', policy: '公开 RSS，原站回跳' },
  'Awwwards Blog': { category: '设计媒体', focus: '数字设计案例与观点', policy: '公开 RSS，原站回跳' },
  Designboom: { category: '设计媒体', focus: '建筑、工业与视觉设计', policy: '公开 RSS，原站回跳' },
  "It's Nice That": { category: '设计媒体', focus: '全球创意与艺术文化', policy: '公开 RSS，原站回跳' },
  'Creative Bloq': { category: '设计媒体', focus: '创意工具与设计趋势', policy: '公开 RSS，原站回跳' },
  'UX Collective': { category: 'UX 研究', focus: '产品体验与设计方法', policy: '公开 RSS，原站回跳' },
  'UX Planet': { category: 'UX 研究', focus: '用户体验与产品思考', policy: '公开 RSS，原站回跳' },
  'UX Booth': { category: 'UX 研究', focus: '用户研究与体验实践', policy: '公开 RSS，原站回跳' },
  'Nielsen Norman Group': { category: 'UX 研究', focus: '可用性与用户体验研究', policy: '公开 RSS，原站回跳' },
  'Webflow Blog': { category: 'UX 研究', focus: '网页产品与无代码实践', policy: '公开 RSS，原站回跳' },
  'Figma Blog': { category: 'UX 研究', focus: '协作设计与产品工作流', policy: '公开 RSS，原站回跳' },
  'Brand New': { category: '品牌视觉', focus: '品牌识别与标志评析', policy: '公开 RSS，原站回跳' },
  'Design Milk': { category: '品牌视觉', focus: '产品、空间与生活方式设计', policy: '公开 RSS，原站回跳' },
  Colossal: { category: '品牌视觉', focus: '艺术、插画与视觉文化', policy: '公开 RSS，原站回跳' },
}

export function getSourceProfile(name: string): SourceCatalogEntry {
  return sourceCatalog[name] ?? {
    category: '设计媒体',
    focus: '设计内容与案例',
    policy: '公开入口，原站回跳',
  }
}
