import React, { useMemo, useRef, useState } from 'react';
import './Projects.css';
import data from '../database/projects.json';
import CircuitBG from './cyber/CircuitBG';
import HoloGridBG from './cyber/HoloGridBG';
import Reveal from './cyber/Reveal';
import Cursor from './cyber/Cursor';
import { motion } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Cursor-follow tilt — same recipe used on the Database page.        */
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
      transform: `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateZ(2px)`,
    });
  };
  const reset = () => setStyle({ transform: 'perspective(900px) rotateY(0) rotateX(0)' });
  return (
    <div ref={ref} className={className} style={style} onMouseMove={onMove} onMouseLeave={reset}>
      {children}
    </div>
  );
}

const hex = (n) => `0x${n.toString(16).padStart(2, '0').toUpperCase()}`;

const ProjectCard = ({ title, description, imagePath, pdfPath, year, index }) => {
  let imageSrc = null;
  try {
    imageSrc = require(`../database/${imagePath}`);
  } catch {
    imageSrc = null;
  }

  return (
    <motion.div
      className="pr-reveal"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 9) * 0.05, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltPanel className="pr-tilt">
        <div className="pr-card">
          <span className="pr-corner pr-corner-tl" />
          <span className="pr-corner pr-corner-br" />
          <span className="pr-scan" aria-hidden="true" />

          <div className="pr-image">
            {imageSrc ? <img src={imageSrc} alt={title} loading="lazy" /> : <div className="pr-image-fallback">NO_IMAGE</div>}
            <div className="pr-image-glaze" aria-hidden="true" />
            <span className="pr-year-badge">SUMMER '{year}</span>
          </div>

          <div className="pr-body">
            <span className="pr-index">FILE_{hex(index)}</span>
            <h3 className="pr-title" data-text={title}>{title}</h3>
            <p className="pr-desc">{description}</p>

            {pdfPath ? (
              <a
                href={require(`../database/${pdfPath}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="pr-link"
              >
                READ MORE →
              </a>
            ) : (
              <span className="pr-link pr-link-disabled">DOCS UNAVAILABLE</span>
            )}
          </div>
        </div>
      </TiltPanel>
    </motion.div>
  );
};

function Projects() {
  const projectsByYear = useMemo(() => {
    const grouped = {};
    data.Projects.forEach((project) => {
      const year = project.year;
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(project);
    });
    return grouped;
  }, []);

  const sortedYears = useMemo(
    () => Object.keys(projectsByYear).sort((a, b) => b.localeCompare(a)),
    [projectsByYear]
  );

  const [selectedYear, setSelectedYear] = useState(sortedYears[0] || '25');

  const activeProjects = projectsByYear[selectedYear] || [];
  const totalProjects = data.Projects.length;

  return (
    <div className="pr-root">
      <Cursor />
      {/* same drifting lime/cyan node constellation used on the homepage */}
      <CircuitBG />

      <section className="pr-hero">
        <HoloGridBG />
        <div className="pr-grid-overlay" aria-hidden="true" />
        <div className="pr-scanlines" aria-hidden="true" />
        <div className="pr-vignette" aria-hidden="true" />
        <div className="pr-nav-shade" aria-hidden="true" />

        <span className="pr-hud pr-hud-tl">{totalProjects} BUILDS ARCHIVED</span>
        <span className="pr-hud pr-hud-tr">{sortedYears.length} GENERATIONS · IIT KANPUR</span>

        <div className="pr-hero-content">
          <Reveal delay={0} y={16}>
            <p className="pr-eyebrow">&gt; ACCESSING_ARCHIVE_OF_BUILDS</p>
          </Reveal>

          <Reveal delay={0.1} y={24}>
            <h1 className="pr-title-hero" data-text="PROJECTS">
              PROJECTS
            </h1>
          </Reveal>

          <Reveal delay={0.25} y={16}>
            <p className="pr-tagline">
              <span>HARDWARE</span>
              <span className="pr-dot">·</span>
              <span>SOFTWARE</span>
              <span className="pr-dot">·</span>
              <span>SUMMER PROJECTS</span>
            </p>
          </Reveal>

          <Reveal delay={0.4} y={16}>
            <p className="pr-sub">
              Every summer project the club has built, generation after generation —
              pick a year to open its archive.
            </p>
          </Reveal>
        </div>

        <div className="pr-scroll-cue" aria-hidden="true">
          <span>SCROLL</span>
          <div className="pr-scroll-track">
            <div className="pr-scroll-dot" />
          </div>
        </div>
      </section>

      <div className="pr-body-wrap">
        <Reveal className="pr-year-dial">
          <div className="pr-year-track">
            {sortedYears.map((year) => (
              <button
                key={year}
                className={`pr-year-node ${selectedYear === year ? 'is-active' : ''}`}
                onClick={() => setSelectedYear(year)}
              >
                <span className="pr-year-num">'{year}</span>
                <span className="pr-year-count">{projectsByYear[year].length}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <div className="pr-grid">
          {activeProjects.length > 0 ? (
            activeProjects.map((project, index) => (
              <ProjectCard
                key={`${project.title}-${project.year}`}
                title={project.title}
                description={project.description}
                imagePath={project.imagePath}
                pdfPath={project.pdfPath}
                year={project.year}
                index={index}
              />
            ))
          ) : (
            <div className="pr-empty">
              <p>&gt; NO_RECORDS_FOR_SUMMER_'{selectedYear}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Projects;
export { ProjectCard };
