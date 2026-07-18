import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { ArrowUpRight, Check, ChevronDown, Command, Menu, Search, Sparkles, X } from 'lucide-react'
import { channels, feedMeta, items, sourceStatus, type Channel, type DesignItem } from './data'

function ItemCard({ item, index }: { item: DesignItem; index: number }) {
  return (
    <a
      className={`work-item work-item--${item.aspect}`}
      href={item.url}
      target="_blank"
      rel="noreferrer"
      style={{ '--accent': item.accent, '--item-index': index } as CSSProperties}
      aria-label={`在 ${item.source} 打开 ${item.title}`}
    >
      <div className="work-media">
        <img src={item.image} alt="" loading={index > 3 ? 'lazy' : 'eager'} />
        <span className="item-index">{String(index + 1).padStart(2, '0')}</span>
        <span className="open-icon"><ArrowUpRight size={18} strokeWidth={1.6} /></span>
      </div>
      <div className="work-meta">
        <div>
          <p className="source-name">{item.source}</p>
          <h3>{item.title}</h3>
        </div>
        <time dateTime={item.date}>{item.dateLabel}</time>
      </div>
    </a>
  )
}

export default function App() {
  const [channel, setChannel] = useState<Channel>('全部')
  const [isSourceOpen, setIsSourceOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [hasSeen, setHasSeen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [query, setQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)

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
      const normalizedQuery = query.trim().toLowerCase()
      const matchesQuery = !normalizedQuery
        || item.title.toLowerCase().includes(normalizedQuery)
        || item.source.toLowerCase().includes(normalizedQuery)
      return matchesChannel && matchesQuery
    }),
    [channel, query],
  )
  const freshCount = items.filter((item) => item.fresh).length

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
            <span>{feedMeta.activeSourceCount} 个已接入来源</span>
            <ChevronDown size={15} />
          </button>
          {isSourceOpen && (
            <div className="source-popover" id="source-status">
              <div className="popover-heading">来源状态 <span>{feedMeta.fetchedAtLabel}</span></div>
              {sourceStatus.map((source) => (
                <div className="source-row" key={source.name}>
                  <span className={`status-dot status-dot--${source.tone}`} />
                  <span>{source.name}</span>
                  <small>{source.state} / {source.method}</small>
                </div>
              ))}
              <div className="source-foot">{feedMeta.note} 只使用公开、尊重权限的数据来源。</div>
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
            <span className="result-count">{visibleItems.length} 个作品</span>
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
          <p className="section-kicker">灵感信号</p>
          <h2>好设计的来源，<br />清晰可见。</h2>
        </div>
        <div className="sources-list">
          {sourceStatus.map((source, index) => (
            <a className="source-line" key={source.name} href={source.url} target="_blank" rel="noreferrer" aria-label={`打开 ${source.name} 来源主页`}>
              <span className="line-number">0{index + 1}</span>
              <span className={`status-dot status-dot--${source.tone}`} />
              <strong>{source.name}</strong>
              <span>{source.state} / {source.method}</span>
              <ArrowUpRight size={17} />
            </a>
          ))}
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
