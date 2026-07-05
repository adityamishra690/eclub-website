import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal from './cyber/Reveal';
import './FolderCard.css';
import Database from './../database/database.json';
import Roadmaps from './../database/roadmaps.json'; // ✅ Added
import RoadmapSteps from './../database/roadmapSteps.json';

/* ------------------------------------------------------------------ */
/*  Roadmap progress — persisted client-side per visitor.              */
/*  Edit src/database/roadmapSteps.json to change the milestones;      */
/*  nothing here needs to change when that content changes.            */
/* ------------------------------------------------------------------ */
const PROGRESS_STORAGE_KEY = 'eclub-roadmap-progress-v1';

function loadAllProgress() {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllProgress(next) {
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable (private mode, etc.) — progress just won't persist
  }
}

/* ------------------------------------------------------------------ */
/*  Auto-categorization — no manual tagging of 40 JSON entries needed. */
/*  Folder name is checked first (stronger signal), description second.*/
/* ------------------------------------------------------------------ */
const CATEGORY_RULES = [
  { key: 'LECTURES', pattern: /lecture/i, color: 'var(--cyan)' },
  { key: 'AI / VISION', pattern: /opencv|image processing|computer vision|machine learning|\bai\b/i, color: 'var(--dot-yellow)' },
  { key: 'ROBOTICS', pattern: /robot/i, color: 'var(--lime)' },
  { key: 'SOFTWARE', pattern: /android|app dev|ethernet|bluetooth|usb keyboard|chat client/i, color: 'var(--magenta)' },
  {
    key: 'HARDWARE',
    pattern: /embe+d|fpga|microcontroller|verilog|\bic\b|keypad|sensor|bootloader|lcd|keyboard interface|mouse interface|gsm|amplifier|touch sensor|k map|handbook|circuit|pcb/i,
    color: 'var(--lime)',
  },
];
const DEFAULT_CATEGORY = { key: 'MISC', color: 'var(--text-muted)' };

function categorize(folder) {
  const name = folder.FolderName || '';
  const desc = folder.Description || '';
  for (const rule of CATEGORY_RULES) if (rule.pattern.test(name)) return rule;
  for (const rule of CATEGORY_RULES) if (rule.pattern.test(desc)) return rule;
  return DEFAULT_CATEGORY;
}

function fileType(link = '') {
  const l = link.toLowerCase();
  if (l.endsWith('.pdf')) return 'PDF';
  if (l.includes('drive.google') || l.includes('docs.google')) return 'DRIVE';
  if (l.includes('colab.research.google')) return 'COLAB';
  if (l.endsWith('.ppt') || l.endsWith('.pptx')) return 'SLIDES';
  return 'LINK';
}

const hex = (n) => `0x${n.toString(16).padStart(2, '0').toUpperCase()}`;

/* ------------------------------------------------------------------ */
/*  Cursor-follow tilt — inert on touch/coarse pointers                */
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
      transform: `perspective(800px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg) translateZ(2px)`,
      '--mx': `${(px + 0.5) * 100}%`,
      '--my': `${(py + 0.5) * 100}%`,
    });
  };
  const reset = () => setStyle({ transform: 'perspective(800px) rotateY(0) rotateX(0)' });
  return (
    <div ref={ref} className={className} style={style} onMouseMove={onMove} onMouseLeave={reset}>
      {children}
    </div>
  );
}

const FolderCard = () => {
  const [showMore, setShowMore] = useState({});
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [progress, setProgress] = useState(() => loadAllProgress());
  const [openSteps, setOpenSteps] = useState({});

  const toggleStepsOpen = (folderName) => {
    setOpenSteps((prev) => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const toggleStep = (folderName, stepIndex, totalSteps) => {
    setProgress((prev) => {
      const current = prev[folderName] || new Array(totalSteps).fill(false);
      const nextSteps = [...current];
      nextSteps[stepIndex] = !nextSteps[stepIndex];
      const next = { ...prev, [folderName]: nextSteps };
      saveAllProgress(next);
      return next;
    });
  };

  // tag + index every entry once
  const entries = useMemo(
    () => Database.Database.map((folder, index) => ({ ...folder, _cat: categorize(folder), _idx: index })),
    []
  );

  const categories = useMemo(() => {
    const seen = new Map();
    entries.forEach((f) => {
      if (!seen.has(f._cat.key)) seen.set(f._cat.key, f._cat);
    });
    return Array.from(seen.values());
  }, [entries]);

  const toggleShowMore = (folderIndex) => {
    setShowMore((prev) => ({ ...prev, [folderIndex]: !prev[folderIndex] }));
  };

  const query = searchText.trim().toLowerCase();

  const foldersToDisplay = entries.filter((folder) => {
    if (activeCategory !== 'ALL' && folder._cat.key !== activeCategory) return false;
    if (!query) return true;
    const folderNameMatch = folder.FolderName.toLowerCase().includes(query);
    const authorMatch = folder.Author.toLowerCase().includes(query);
    const descriptionMatch = folder.Description.toLowerCase().includes(query);
    const fileDisplayNamesMatch = folder.Files.some((file) =>
      file.DisplayName.toLowerCase().includes(query)
    );
    return folderNameMatch || authorMatch || descriptionMatch || fileDisplayNamesMatch;
  });

  return (
      <div className='Center'>
        {/* ROADMAP CARDS (no toggle, horizontal layout) */}
        <div className='roadmap-section'>
          <Reveal cut className='db-section-head'>
            <span className='db-kicker'>01_ROADMAPS · start here</span>
            <h2 className='db-h2'>Featured Roadmaps</h2>
          </Reveal>

          <div className='roadmap-row'>
            {Roadmaps.Roadmaps.map((folder, index) => {
              const steps = RoadmapSteps[folder.FolderName] || [];
              const done = (progress[folder.FolderName] || []).filter(Boolean).length;
              const total = steps.length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              const stepsOpen = !!openSteps[folder.FolderName];

              return (
                <motion.div
                    key={`roadmap-reveal-${index}`}
                    className='roadmap-cell'
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TiltPanel className='roadmap-tilt'>
                    <div className='foldercard roadmap-card'>
                      <span className='db-corner db-corner-tl' />
                      <span className='db-corner db-corner-br' />
                      <span className='db-scan' aria-hidden='true' />
                      <span className='db-roadmap-index'>{hex(index + 1)}</span>

                      <div className='Top'>
                        <h4 className='folder-name'>{folder.FolderName}</h4>
                      </div>
                      <p className='description'>{folder.Description}</p>

                      {total > 0 && (
                        <div className='db-progress'>
                          <div className='db-progress-track'>
                            <div className='db-progress-fill' style={{ width: `${pct}%` }} />
                          </div>
                          <span className='db-progress-label'>
                            {done}/{total} STEPS · {pct}%
                          </span>
                        </div>
                      )}

                      <div className='db-roadmap-footer'>
                        {total > 0 && (
                          <button
                              type='button'
                              className='db-steps-toggle'
                              onClick={() => toggleStepsOpen(folder.FolderName)}
                          >
                            {stepsOpen ? 'HIDE STEPS ▲' : 'STEPS ▾'}
                          </button>
                        )}
                        <a
                            href={folder.Files[0].Link}
                            className='db-cardlink'
                            target='_blank'
                            rel='noopener noreferrer'
                        >
                          VIEW ROADMAP →
                        </a>
                      </div>

                      <AnimatePresence initial={false}>
                        {stepsOpen && total > 0 && (
                          <motion.div
                              className='db-steps-wrap'
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          >
                            <ul className='db-steps-list'>
                              {steps.map((step, stepIndex) => {
                                const isDone = !!(progress[folder.FolderName] || [])[stepIndex];
                                return (
                                  <li key={stepIndex}>
                                    <button
                                        type='button'
                                        className={`db-step ${isDone ? 'is-done' : ''}`}
                                        onClick={() => toggleStep(folder.FolderName, stepIndex, total)}
                                    >
                                      <span className='db-step-box'>{isDone ? '×' : ''}</span>
                                      <span className='db-step-text'>{step}</span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </TiltPanel>
                </motion.div>
              );
            })}
          </div>
        </div>
        {/* END ROADMAP SECTION */}

        <Reveal cut className='db-section-head'>
          <span className='db-kicker'>02_ARCHIVE · full index</span>
          <h2 className='db-h2'>Browse Resources</h2>
        </Reveal>

        <Reveal delay={0.05} className='Searchbar'>
          <div className='db-search'>
            <span className='db-search-prompt'>&gt;</span>
            <input
                type='text'
                placeholder='grep -i "arduino, image processing, fpga..."'
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className='search-bar'
            />
          </div>

          <div className='db-filter-row'>
            <button
                type='button'
                className={`db-filter-chip ${activeCategory === 'ALL' ? 'is-active' : ''}`}
                style={{ '--chip-color': 'var(--lime)' }}
                onClick={() => setActiveCategory('ALL')}
            >
              ALL · {entries.length}
            </button>
            {categories.map((cat) => {
              const count = entries.filter((f) => f._cat.key === cat.key).length;
              return (
                  <button
                      type='button'
                      key={cat.key}
                      className={`db-filter-chip ${activeCategory === cat.key ? 'is-active' : ''}`}
                      style={{ '--chip-color': cat.color }}
                      onClick={() => setActiveCategory(cat.key)}
                  >
                    {cat.key} · {count}
                  </button>
              );
            })}
          </div>

          <span className='db-result-count'>
            {foldersToDisplay.length} {foldersToDisplay.length === 1 ? 'ENTRY' : 'ENTRIES'} MATCHED
          </span>
        </Reveal>

        <div className='db-grid'>
          {foldersToDisplay.map((folder, gridPos) => {
            const idx = folder._idx;
            const open = !!showMore[idx];
            return (
                <motion.div
                    key={idx}
                    className='db-reveal'
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: (gridPos % 9) * 0.04, ease: [0.22, 1, 0.36, 1] }}
                >
                  <TiltPanel className='db-tilt'>
                    <div className='foldercard db-file-card'>
                      <span className='db-corner db-corner-tl' />
                      <span className='db-corner db-corner-br' />
                      <span className='db-scan' aria-hidden='true' />

                      <div className='db-file-meta'>
                        <span className='db-file-index'>FILE_{hex(idx)}</span>
                        <span className='db-chip' style={{ '--chip-color': folder._cat.color }}>
                          {folder._cat.key}
                        </span>
                      </div>

                      <div className='Top'>
                        <h4 className='folder-name' data-text={folder.FolderName}>
                          {folder.FolderName}
                        </h4>
                      </div>
                      <h2 className='author'>Author: {folder.Author}</h2>
                      <p className='description'>{folder.Description}</p>

                      <div className='db-file-footer'>
                        <span className='db-file-count'>
                          {folder.Files.length} {folder.Files.length === 1 ? 'FILE' : 'FILES'}
                        </span>
                        <button onClick={() => toggleShowMore(idx)} className='acc'>
                          {open ? 'COLLAPSE ▲' : 'ACCESS ▾'}
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {open && (
                            <motion.div
                                className='files-wrap'
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <div className='files'>
                                {folder.Files.map((file, fileIndex) => (
                                    <a
                                        key={fileIndex}
                                        href={file.Link}
                                        className='file-link'
                                        target='_blank'
                                        rel='noopener noreferrer'
                                    >
                                      <div className='file'>
                                        <span className='file-tag'>{fileType(file.Link)}</span>
                                        <h6 className='file-name'>{file.DisplayName}</h6>
                                      </div>
                                    </a>
                                ))}
                              </div>
                            </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </TiltPanel>
                </motion.div>
            );
          })}
        </div>

        {foldersToDisplay.length === 0 && (
            <div className='db-empty'>
              <p>&gt; NO_MATCHES_FOUND</p>
              <span>Try a different query, or clear the category filter.</span>
            </div>
        )}
      </div>
  );
};

export default FolderCard;
