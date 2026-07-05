import React, { useMemo, useRef, useState } from 'react';
import './Articles.css';
import data from '../database/articles.json';
import CircuitBG from './cyber/CircuitBG';
import TransmissionBG from './cyber/TransmissionBG';
import Reveal from './cyber/Reveal';
import Cursor from './cyber/Cursor';
import { motion, AnimatePresence } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Auto-categorization — same recipe as the Database page.            */
/* ------------------------------------------------------------------ */
const CATEGORY_RULES = [
  { key: 'HARDWARE', pattern: /\barm\b|\bamd\b|ssd|raspberry pi|esp8266|\biot\b|circuit/i, color: 'var(--lime)' },
  { key: 'EMERGING TECH', pattern: /quantum|photonic|virtual and augmented|\bvr\b|\bar\b/i, color: 'var(--cyan)' },
  { key: 'AI / ML', pattern: /neural|\bai\b|machine learning|\bml\b|neuromorphic/i, color: 'var(--magenta)' },
];
const DEFAULT_CATEGORY = { key: 'MISC', color: 'var(--text-muted)' };

function categorize(article) {
  const title = article.title || '';
  const desc = article.description || '';
  for (const rule of CATEGORY_RULES) if (rule.pattern.test(title)) return rule;
  for (const rule of CATEGORY_RULES) if (rule.pattern.test(desc)) return rule;
  return DEFAULT_CATEGORY;
}

const hex = (n) => `0x${n.toString(16).padStart(2, '0').toUpperCase()}`;

/* ------------------------------------------------------------------ */
/*  Read/unread tracking — persisted client-side, same pattern as the  */
/*  roadmap progress checklist on the Database page.                   */
/* ------------------------------------------------------------------ */
const READ_STORAGE_KEY = 'eclub-articles-read-v1';

function loadReadState() {
  try {
    const raw = window.localStorage.getItem(READ_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveReadState(next) {
  try {
    window.localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — read state just won't persist
  }
}

/* ------------------------------------------------------------------ */
/*  Cursor-follow tilt — same recipe as Database/Projects.             */
/* ------------------------------------------------------------------ */
const FINE_POINTER =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function TiltPanel({ children, className = '' }) {
  const ref = useRef(null);
  const [style, setStyle] = useState({});
  if (!FINE_POINTER) {
    return <div className={className}>{children}</div>;
  }
  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setStyle({
      transform: `perspective(900px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateZ(2px)`,
    });
  };
  const reset = () => setStyle({ transform: 'perspective(900px) rotateY(0) rotateX(0)' });
  return (
    <div ref={ref} className={className} style={style} onMouseMove={onMove} onMouseLeave={reset}>
      {children}
    </div>
  );
}

function Articles() {
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | READ | UNREAD
  const [readState, setReadState] = useState(() => loadReadState());
  const [spotlightId, setSpotlightId] = useState(null);
  const cardRefs = useRef({});

  const entries = useMemo(
    () =>
      data.Articles
        .map((article, index) => ({ ...article, _cat: categorize(article), _idx: index }))
        .sort((a, b) => b.year.localeCompare(a.year)),
    []
  );

  const categories = useMemo(() => {
    const seen = new Map();
    entries.forEach((a) => {
      if (!seen.has(a._cat.key)) seen.set(a._cat.key, a._cat);
    });
    return Array.from(seen.values());
  }, [entries]);

  const isRead = (idx) => !!readState[idx];

  const markRead = (idx, value) => {
    setReadState((prev) => {
      const next = { ...prev, [idx]: value };
      saveReadState(next);
      return next;
    });
  };

  const readCount = entries.filter((a) => isRead(a._idx)).length;
  const totalCount = entries.length;
  const pct = totalCount ? Math.round((readCount / totalCount) * 100) : 0;

  const query = searchText.trim().toLowerCase();
  const filtered = entries.filter((a) => {
    if (activeCategory !== 'ALL' && a._cat.key !== activeCategory) return false;
    if (statusFilter === 'READ' && !isRead(a._idx)) return false;
    if (statusFilter === 'UNREAD' && isRead(a._idx)) return false;
    if (!query) return true;
    return a.title.toLowerCase().includes(query) || a.description.toLowerCase().includes(query);
  });

  const surpriseMe = () => {
    const pool = entries.filter((a) => !isRead(a._idx));
    const source = pool.length > 0 ? pool : entries;
    if (source.length === 0) return;
    const pick = source[Math.floor(Math.random() * source.length)];
    setActiveCategory('ALL');
    setStatusFilter('ALL');
    setSearchText('');
    setSpotlightId(pick._idx);
    window.setTimeout(() => {
      const el = cardRefs.current[pick._idx];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 60);
    window.setTimeout(() => setSpotlightId(null), 2600);
  };

  return (
    <div className="ar-root">
      <Cursor />
      <CircuitBG />

      <section className="ar-hero">
        <TransmissionBG />
        <div className="ar-grid-overlay" aria-hidden="true" />
        <div className="ar-scanlines" aria-hidden="true" />
        <div className="ar-vignette" aria-hidden="true" />

        <span className="ar-hud ar-hud-tl">SYS // DECODING_ARCHIVE</span>
        <span className="ar-hud ar-hud-tr">{totalCount} ARTICLES · {categories.length} TOPICS</span>

        <div className="ar-hero-content">
          <Reveal delay={0} y={16}>
            <p className="ar-eyebrow">&gt; ACCESSING_KNOWLEDGE_ARCHIVE</p>
          </Reveal>

          <Reveal delay={0.1} y={24}>
            <h1 className="ar-title" data-text="ARTICLES">
              ARTICLES
            </h1>
          </Reveal>

          <Reveal delay={0.25} y={16}>
            <p className="ar-tagline">
              <span>RESEARCH</span>
              <span className="ar-dot">·</span>
              <span>DEEP DIVES</span>
              <span className="ar-dot">·</span>
              <span>GUIDES</span>
            </p>
          </Reveal>

          <Reveal delay={0.4} y={16}>
            <p className="ar-sub">
              Everything the club has written up, decoded from the archive.
              Track what you've read, or let the archive pick for you.
            </p>
          </Reveal>
        </div>

        <div className="ar-scroll-cue" aria-hidden="true">
          <span>SCROLL</span>
          <div className="ar-scroll-track">
            <div className="ar-scroll-dot" />
          </div>
        </div>
      </section>

      <div className="ar-body">
        <Reveal className="ar-progress-block">
          <div className="ar-progress-row">
            <span className="ar-progress-label">
              {readCount}/{totalCount} ARTICLES READ · {pct}%
            </span>
            <button type="button" className="ar-surprise" onClick={surpriseMe}>
              ⟲ SURPRISE ME
            </button>
          </div>
          <div className="ar-progress-track">
            <div className="ar-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </Reveal>

        <Reveal delay={0.05} className="ar-controls">
          <div className="ar-search">
            <span className="ar-search-prompt">&gt;</span>
            <input
              type="text"
              placeholder='grep -i "quantum, neural nets, IoT..."'
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="ar-search-input"
            />
          </div>

          <div className="ar-filter-row">
            <button
              type="button"
              className={`ar-filter-chip ${activeCategory === 'ALL' ? 'is-active' : ''}`}
              style={{ '--chip-color': 'var(--lime)' }}
              onClick={() => setActiveCategory('ALL')}
            >
              ALL · {entries.length}
            </button>
            {categories.map((cat) => {
              const count = entries.filter((a) => a._cat.key === cat.key).length;
              return (
                <button
                  type="button"
                  key={cat.key}
                  className={`ar-filter-chip ${activeCategory === cat.key ? 'is-active' : ''}`}
                  style={{ '--chip-color': cat.color }}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  {cat.key} · {count}
                </button>
              );
            })}
          </div>

          <div className="ar-status-row">
            {['ALL', 'UNREAD', 'READ'].map((s) => (
              <button
                type="button"
                key={s}
                className={`ar-status-chip ${statusFilter === s ? 'is-active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="ar-grid">
          <AnimatePresence>
            {filtered.map((article, gridPos) => {
              const idx = article._idx;
              const read = isRead(idx);
              let imageSrc = null;
              try {
                imageSrc = require(`../database/${article.imagePath}`);
              } catch {
                imageSrc = null;
              }
              return (
                <motion.div
                  key={idx}
                  ref={(el) => { cardRefs.current[idx] = el; }}
                  className={`ar-reveal ${spotlightId === idx ? 'is-spotlit' : ''}`}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, delay: (gridPos % 9) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TiltPanel className="ar-tilt">
                    <div className={`ar-card ${read ? 'is-read' : ''}`}>
                      <span className="ar-corner ar-corner-tl" />
                      <span className="ar-corner ar-corner-br" />
                      <span className="ar-scan" aria-hidden="true" />

                      <div className="ar-image">
                        {imageSrc ? (
                          <img src={imageSrc} alt={article.title} loading="lazy" />
                        ) : (
                          <div className="ar-image-fallback">NO_IMAGE</div>
                        )}
                        <div className="ar-image-glaze" aria-hidden="true" />
                        <span className="ar-year-badge">{article.year}</span>
                        {read && <span className="ar-read-badge">READ ✓</span>}
                      </div>

                      <div className="ar-card-body">
                        <div className="ar-card-meta">
                          <span className="ar-index">FILE_{hex(idx)}</span>
                          <span className="ar-chip" style={{ '--chip-color': article._cat.color }}>
                            {article._cat.key}
                          </span>
                        </div>

                        <h3 className="ar-card-title" data-text={article.title}>
                          {article.title}
                        </h3>
                        <p className="ar-card-desc">{article.description}</p>

                        <div className="ar-card-footer">
                          <button
                            type="button"
                            className="ar-read-toggle"
                            onClick={() => markRead(idx, !read)}
                          >
                            {read ? 'MARK UNREAD' : 'MARK READ'}
                          </button>

                          {article.url ? (
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ar-read-link"
                              onClick={() => markRead(idx, true)}
                            >
                              READ ARTICLE →
                            </a>
                          ) : (
                            <span className="ar-read-link ar-read-link-disabled">COMING SOON</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TiltPanel>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="ar-empty">
            <p>&gt; NO_MATCHES_FOUND</p>
            <span>Try a different query, or clear the filters.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Articles;
