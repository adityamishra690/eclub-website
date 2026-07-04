import React, { useEffect, useRef, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";
import "./ScrollHUD.css";

/* ==================================================================
   ScrollHUD — NEURAL_BUILD // OS scroll-progress heads-up display
   ------------------------------------------------------------------
   Desktop (min-width:1025px): a fixed vertical rail pinned to the
   right edge. Each section gets a node + mono code + label (label
   unfurls on hover / when active). A lime progress line fills with
   overall page scroll. Active section (IntersectionObserver) lights
   lime. Clicking a node scrolls its target into view.

   Mobile / tablet (max-width:1024px): the rail is hidden; instead a
   slim horizontal progress bar sits fixed just under the navbar.

   SECTIONS CONTRACT
   -----------------
   sections = [{ id, code, label }, ...]
     id    string  — must match a document.getElementById(id) target.
     code  string  — short mono index shown on the rail, e.g. "00".
     label string  — human label revealed on hover / when active.

   Targets whose id is not currently in the DOM (e.g. a conditionally
   rendered section) are tolerated: their node renders inert and never
   becomes active. Give matching id attributes in CyberHome, e.g.
     <section id="sec-hero"> … </section>
   ================================================================== */

export default function ScrollHUD({ sections = [] }) {
  const reduceMotion = useReducedMotion();

  // overall page scroll progress, 0..1
  const [progress, setProgress] = useState(0);
  // id of the section currently considered "active"
  const [activeId, setActiveId] = useState(sections[0]?.id ?? null);

  const rafRef = useRef(0);
  // per-id intersection ratio, so we can pick the most-visible section
  const ratiosRef = useRef(new Map());
  // the live IntersectionObserver + the set of ids already observed, so the
  // re-scan interval can pick up late-mounting targets (e.g. the conditional
  // RECENT feed) without rebuilding the observer.
  const ioRef = useRef(null);
  const observedIdsRef = useRef(new Set());

  /* -------- overall scroll progress (rAF-throttled) --------
     The site turns both <html> and <body> into scroll containers, so
     window.scrollY can lag behind document.scrollingElement.scrollTop.
     Read every plausible source and take the max to stay correct. */
  const measure = useCallback(() => {
    rafRef.current = 0;
    const doc = document.documentElement;
    const se = document.scrollingElement || doc;
    const top = Math.max(
      window.pageYOffset || 0,
      window.scrollY || 0,
      se.scrollTop || 0,
      doc.scrollTop || 0,
      document.body.scrollTop || 0
    );
    const max = Math.max(
      se.scrollHeight - se.clientHeight,
      doc.scrollHeight - doc.clientHeight,
      0
    );
    const p = max > 0 ? Math.min(1, Math.max(0, top / max)) : 0;
    setProgress(p);
  }, []);

  const requestMeasure = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(measure);
  }, [measure]);

  useEffect(() => {
    // initial read + listeners
    measure();
    window.addEventListener("scroll", requestMeasure, { passive: true });
    window.addEventListener("resize", requestMeasure, { passive: true });
    // body can be the scroller under the overflow quirk
    document.addEventListener("scroll", requestMeasure, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener("scroll", requestMeasure);
      window.removeEventListener("resize", requestMeasure);
      document.removeEventListener("scroll", requestMeasure, { capture: true });
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [measure, requestMeasure]);

  /* -------- active section via IntersectionObserver --------
     Watch every existing target; keep the intersection ratio for each
     and promote the most-visible one to active. Rebuilds if the set of
     present targets changes (e.g. a conditional section mounts). */
  useEffect(() => {
    if (!sections.length) return undefined;

    const ratios = ratiosRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) ratios.set(id, entry.intersectionRatio);
          else ratios.delete(id);
        }
        // choose the most-visible currently-intersecting section, keeping
        // document order as the tie-breaker
        let bestId = null;
        let bestRatio = -1;
        for (const s of sections) {
          const r = ratios.get(s.id);
          if (r != null && r > bestRatio) {
            bestRatio = r;
            bestId = s.id;
          }
        }
        if (bestId) setActiveId(bestId);
      },
      {
        // a band centred on the viewport — a section is "active" while its
        // body occupies the middle of the screen
        rootMargin: "-45% 0px -45% 0px",
        threshold: [0, 0.01, 0.25, 0.5, 0.75, 1],
      }
    );

    ioRef.current = io;
    const observedIds = observedIdsRef.current;
    observedIds.clear();
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) {
        io.observe(el);
        observedIds.add(s.id);
      }
    }

    return () => {
      io.disconnect();
      ioRef.current = null;
      observedIds.clear();
      ratios.clear();
    };
    // Re-run when the section list identity changes. CyberHome passes a
    // stable module-level array, so a conditional section that mounts later
    // is picked up via the fallback scan below.
  }, [sections]);

  /* Late-mounting targets (e.g. the conditional RECENT feed) may not exist
     on first observe. Re-scan a couple of times shortly after mount so they
     get observed without needing the caller to change the sections array. */
  useEffect(() => {
    if (!sections.length) return undefined;
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      // observe any target that has newly appeared in the DOM, guarding so
      // each element is only observed once.
      const io = ioRef.current;
      const observedIds = observedIdsRef.current;
      if (io) {
        for (const s of sections) {
          if (observedIds.has(s.id)) continue;
          const el = document.getElementById(s.id);
          if (el) {
            io.observe(el);
            observedIds.add(s.id);
          }
        }
      }
      const allPresent = sections.every((s) => observedIds.has(s.id));
      if (allPresent || tries >= 6) {
        window.clearInterval(id);
        // nudge a re-measure once targets are settled
        requestMeasure();
      }
    }, 400);
    return () => window.clearInterval(id);
  }, [sections, requestMeasure]);

  const goTo = useCallback(
    (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    },
    [reduceMotion]
  );

  const onKeyDown = useCallback(
    (e, id) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        goTo(id);
      }
    },
    [goTo]
  );

  if (!sections.length) return null;

  const pct = Math.round(progress * 100);

  return (
    <>
      {/* ---------- Desktop vertical rail (>=1025px) ---------- */}
      <nav
        className="shud-rail"
        aria-label="Section navigation"
        style={{ "--shud-progress": progress }}
      >
        <span className="shud-rail-code shud-rail-top" aria-hidden="true">
          {String(pct).padStart(2, "0")}%
        </span>

        <div className="shud-track">
          <span className="shud-track-line" aria-hidden="true" />
          <span className="shud-track-fill" aria-hidden="true" />

          <ul className="shud-list">
            {sections.map((s) => {
              const active = s.id === activeId;
              return (
                <li
                  key={s.id}
                  className={`shud-item${active ? " is-active" : ""}`}
                >
                  <button
                    type="button"
                    className="shud-node-btn"
                    onClick={() => goTo(s.id)}
                    onKeyDown={(e) => onKeyDown(e, s.id)}
                    aria-current={active ? "true" : undefined}
                    aria-label={`Go to ${s.label} section`}
                    title={s.label}
                  >
                    <span className="shud-meta" aria-hidden="true">
                      <span className="shud-code">{s.code}</span>
                      <span className="shud-label">{s.label}</span>
                    </span>
                    <span className="shud-node" aria-hidden="true">
                      <span className="shud-node-dot" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <span className="shud-rail-code shud-rail-bot" aria-hidden="true">
          SCROLL
        </span>
      </nav>

      {/* ---------- Mobile / tablet top bar (<=1024px) ---------- */}
      <div
        className="shud-bar"
        role="presentation"
        aria-hidden="true"
        style={{ "--shud-progress": progress }}
      >
        <span className="shud-bar-fill" />
      </div>
    </>
  );
}
