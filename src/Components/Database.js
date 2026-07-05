import React from 'react';
import FolderCard from './FolderCard';
import CircuitBG from './cyber/CircuitBG';
import CircuitTraceBG from './cyber/CircuitTraceBG';
import Reveal from './cyber/Reveal';
import Cursor from './cyber/Cursor';
import "./Database.css";

const Database = () => {
  return (
    <div className="db-root">
      {/* same neon dot + lagging ring cursor used on the homepage */}
      <Cursor />
      {/* same drifting lime/cyan node constellation used on the homepage */}
      <CircuitBG />

      <section className="db-hero">
        <CircuitTraceBG />
        <div className="db-grid-overlay" aria-hidden="true" />
        <div className="db-scanlines" aria-hidden="true" />
        <div className="db-vignette" aria-hidden="true" />

        <span className="db-hud db-hud-tl">SYS // ARCHIVE_MOUNTED</span>
        <span className="db-hud db-hud-tr">IIT KANPUR · DATASTORE</span>

        <div className="db-hero-content">
          <Reveal delay={0} y={16}>
            <p className="db-eyebrow">&gt; ACCESSING_RESOURCE_ARCHIVE</p>
          </Reveal>

          <Reveal delay={0.1} y={24}>
            <h1 className="db-title" data-text="DATABASE">
              DATABASE
            </h1>
          </Reveal>

          <Reveal delay={0.25} y={16}>
            <p className="db-tagline">
              <span>NOTES</span>
              <span className="db-dot">·</span>
              <span>ROADMAPS</span>
              <span className="db-dot">·</span>
              <span>LECTURES</span>
            </p>
          </Reveal>

          <Reveal delay={0.4} y={16}>
            <p className="db-sub">
              Every resource we could gather from the club — indexed and searchable.
              Missing something? Mail us at{" "}
              <a href="mailto:eclub.iitk@gmail.com" className="db-link">
                eclub.iitk@gmail.com
              </a>
              .
            </p>
          </Reveal>
        </div>

        <div className="db-scroll-cue" aria-hidden="true">
          <span>SCROLL</span>
          <div className="db-scroll-track">
            <div className="db-scroll-dot" />
          </div>
        </div>
      </section>

      <div className="db-body">
        <FolderCard />
      </div>
    </div>
  );
};

export default Database;
