import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ArrowUpRight, Check, ChevronDown, Clock3, Command, Layers3, Menu, Radio, Search, ShieldCheck, Sparkles, X } from 'lucide-react'
import { channels, feedMeta, items, sourceStatus, type Channel, type DesignItem } from './data'
import { getSourceProfile, sourceCategoryFilters, type SourceCategoryFilter } from './source-catalog'

function ItemCard({ item, index }: { item: DesignItem; index: number }) {
  return (
    <article
      className={`work-item work-item--${item.aspect}`}
      style={{ '--accent': item.accent, '--item-index': index } as CSSProperties}
    >
      <div className="work-media">
        <img src={item.image} alt="" loading={index > 3 ? 'lazy' : 'eager'} />
        <span className="item-index">{String(index + 1).padStart(2, '0')}</span>
        <a
          className="work-link"
          href={item.url}
          target="_blank"
          rel="noreferrer"
          aria-label={`在 ${item.source} 打开 ${item.title}`}
        >
          <span className="open-icon"><ArrowUpRight size={18} strokeWidth={1.6} /></span>
        </a>
      </div>
      <div className="work-meta">
        <div>
          <p className="source-name">{item.source}</p>
          <h3>{item.title}</h3>
        </div>
        <time dateTime={item.date}>{item.dateLabel}</time>
      </div>
    </article>
  )
}

function formatSourceTime(value?: string | null, hasSnapshot = false) {
  if (!value) return hasSnapshot ? '历史快照' : '尚未成功同步'
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) return '等待下一轮验证'
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  }).format(date)
}

export default function App() {
  const [channel, setChannel] = useState<Channel>('全部')
  const [isSourceOpen, setIsSourceOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hasSeen, setHasSeen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [query, setQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [sourceCategory, setSourceCategory] = useState<SourceCategoryFilter>('全部来源')

  useEffect(() => {
    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setScrollY(window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const visibleItems = useMemo(
    () => items.filter((item) => {
      const matchesChannel = channel === '全部' || item.channel === channel
      const matchesSourceCategory = sourceCategory === '全部来源'
        || getSourceProfile(item.source).category === sourceCategory
      const normalizedQuery = query.trim().toLowerCase()
      const matchesQuery = !normalizedQuery
        || item.title.toLowerCase().includes(normalizedQuery)
        || item.source.toLowerCase().includes(normalizedQuery)
      return matchesChannel && matchesSourceCategory && matchesQuery
    }),
    [channel, query, sourceCategory],
  )
  const freshCount = items.filter((item) => item.fresh).length
  const filteredSources = useMemo(
    () => sourceStatus.filter((source) => sourceCategory === '全部来源' || getSourceProfile(source.name).category === sourceCategory),
    [sourceCategory],
  )
  const sourceCategoryCounts = useMemo(() => sourceStatus.reduce<Record<string, number>>((counts, source) => {
    const category = getSourceProfile(source.name).category
    counts[category] = (counts[category] ?? 0) + 1
    return counts
  }, {}), [])

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="主导航">
        <a className="brand" href="#top" aria-label="Design Radar 首页">
          <span className="brand-mark"><span /></span>
          <span>Design Radar</span>
        </a>

        <div className="nav-center">
          <button className="source-control" onClick={() => setIsSourceOpen(!isSourceOpen)} aria-expanded={isSourceOpen} aria-controls="source-status">
            <span className="pulse-dot" />
            <span>{feedMeta.activeSourceCount} 个已展示来源</span>
            <ChevronDown size={15} />
          </button>
          {isSourceOpen && (
            <div className="source-popover" id="source-status">
              <div className="popover-heading">来源状态 <span>{feedMeta.fetchedAtLabel}</span></div>
              {sourceStatus.map((source) => (
                <div className="source-row" key={source.name}>
                  <span className={`status-dot status-dot--${source.tone}`} />
                  <span>{source.name}<small>{getSourceProfile(source.name).category}</small></span>
                  <small>{source.state}</small>
                </div>
              ))}
              <div className="source-foot">{feedMeta.note} 只使用公开入口，所有卡片均回跳原站。</div>
            </div>
          )}
        </div>

        <div className="nav-actions">
          <button
            className="icon-button search-button"
            aria-label="搜索作品"
            title="搜索"
            aria-expanded={isSearchOpen}
            aria-controls="feed-search"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            {isSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>
          <button className="menu-toggle icon-button" aria-label="打开菜单" title="菜单" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <aside className="mobile-menu">
          <a href="#feed" onClick={() => setIsMenuOpen(false)}>今日上新</a>
          <a href="#sources" onClick={() => setIsMenuOpen(false)}>内容来源</a>
          <span>开源内核，持续更新</span>
        </aside>
      )}

      <section className="intro" id="top">
        <div className="intro-copy">
          <p className="eyebrow"><Sparkles size={14} /> 每日发现，灵感不缺席</p>
          <h1>值得停下来<br /><i>细看</i> 的设计。</h1>
          <div className="intro-bottom">
            <p>把全球刚刚发生的好设计，收进你的灵感索引。<br />只收录已验证的公开数据源。</p>
            <a href="#feed" className="scroll-link">查看今日上新 <span>↓</span></a>
          </div>
        </div>

        <div className="radar-panel" style={{ transform: `translateY(${Math.min(scrollY * 0.11, 38)}px)` }}>
          <div className="radar-rule" />
          <div className="radar-data">
            <span>{feedMeta.fetchedAtLabel.slice(0, 10)}</span>
            <span>{feedMeta.fetchedAtLabel.slice(11)}</span>
          </div>
          <div className="fresh-counter">
            <span className="counter-number">{hasSeen ? '00' : String(freshCount).padStart(2, '0')}</span>
            <span className="counter-label">{hasSeen ? '已全部看完' : '本轮同步\n新发现'}</span>
          </div>
          <button className={`seen-button ${hasSeen ? 'is-seen' : ''}`} onClick={() => setHasSeen(!hasSeen)}>
            {hasSeen ? <Check size={15} /> : <Command size={15} />}
            {hasSeen ? '已标记已读' : '全部标记已读'}
          </button>
        </div>
      </section>

      <section className="feed-section" id="feed">
        <header className="feed-head">
          <div className="feed-title-row">
            <p className="section-kicker">正在发生的设计</p>
            <span className="result-count">{visibleItems.length} 个作品 / {sourceCategory}</span>
          </div>
          <div className="filter-row" aria-label="筛选作品">
            <div className="channel-tabs">
              {channels.map((name) => (
                <button key={name} onClick={() => setChannel(name)} className={channel === name ? 'active' : ''}>{name}</button>
              ))}
            </div>
            <label className={`feed-search ${isSearchOpen ? 'is-open' : ''}`} id="feed-search">
              <Search size={15} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索作品或来源"
                aria-label="搜索作品或来源"
              />
              {query && <button type="button" aria-label="清除搜索" title="清除搜索" onClick={() => setQuery('')}><X size={14} /></button>}
            </label>
          </div>
          <div className="source-filter-row" aria-label="按来源类别筛选">
            <span><Layers3 size={13} /> 灵感类型</span>
            <div className="source-category-tabs">
              {sourceCategoryFilters.map((name) => (
                <button
                  key={name}
                  onClick={() => setSourceCategory(name)}
                  className={sourceCategory === name ? 'active' : ''}
                >
                  {name}
                  <em>{name === '全部来源' ? sourceStatus.length : sourceCategoryCounts[name] ?? 0}</em>
                </button>
              ))}
            </div>
          </div>
        </header>

        {visibleItems.length ? (
          <div className="works-grid">
            {visibleItems.map((item, index) => <ItemCard item={item} index={index} key={item.id} />)}
          </div>
        ) : (
          <p className="empty-state">没有找到匹配作品。换一个关键词试试。</p>
        )}
      </section>

      <section className="sources-section" id="sources">
        <div className="sources-heading">
          <p className="section-kicker"><Radio size={13} /> 灵感信号</p>
          <h2>来源不是黑箱。<br /><i>状态</i> 清晰可见。</h2>
          <p className="sources-copy">已展示来源指本次或历史快照中已有可展示条目的来源；候选来源仅表示已配置公开入口，成功解析出条目后才会进入作品流。</p>
          <div className="source-summary">
            <span><b>{feedMeta.activeSourceCount}</b> 已展示来源</span>
            <span><b>{sourceStatus.length}</b> 已配置候选</span>
            <span><b>{Object.keys(sourceCategoryCounts).length}</b> 内容类别</span>
          </div>
        </div>
        <div className="source-console">
          <div className="source-console-head">
            <span>来源档案</span>
            <span>最后成功同步</span>
            <span>接入状态</span>
          </div>
          <div className="sources-list">
            {filteredSources.map((source, index) => {
              const profile = getSourceProfile(source.name)
              return (
                <a className="source-line" key={source.name} href={source.url} target="_blank" rel="noreferrer" aria-label={`打开 ${source.name} 来源主页`}>
                  <span className="line-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className={`status-dot status-dot--${source.tone}`} />
                  <span className="source-identity"><strong>{source.name}</strong><small>{profile.category} / {profile.focus}</small></span>
                  <span className="source-time"><Clock3 size={13} /> {formatSourceTime(source.lastSuccessAt, source.active)}</span>
                  <span className={`source-state ${source.active ? 'is-active' : ''}`}>{source.state}</span>
                  <ArrowUpRight size={17} />
                  <span className="source-policy"><ShieldCheck size={12} /> {profile.policy}</span>
                </a>
              )
            })}
          </div>
          <p className="source-console-note">“待首次验证 / 待首次抓取验证”均表示公开入口已配置，但尚未成功解析出可展示条目。</p>
        </div>
      </section>

      <footer>
        <span>Design Radar / 2026</span>
        <span>献给始终在寻找灵感的设计师。</span>
        <a href="#top">回到顶部 ↑</a>
      </footer>
    </main>
  )
}
