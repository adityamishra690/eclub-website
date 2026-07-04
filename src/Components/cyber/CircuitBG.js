import React, { useEffect, useRef } from "react";
import "./CircuitBG.css";

/* ------------------------------------------------------------------ */
/*  CircuitBG — animated circuit / network background layer            */
/*                                                                     */
/*  One <canvas> pinned fixed:inset-0, z-index:0, pointer-events:none. */
/*  Lime/cyan nodes drift and connect into a constellation. The cursor */
/*  is a live node: nearby points link to it, brighten, and are gently */
/*  pushed away — so the field reacts to mouse movement. Paused when    */
/*  the tab is hidden; skipped on reduced-motion / low-end touch.      */
/* ------------------------------------------------------------------ */

const LIME = [187, 223, 77]; // --lime  #bbdf4d
const CYAN = [61, 242, 255]; // --cyan  #3df2ff

const TARGET_FPS = 45;
const FRAME_MS = 1000 / TARGET_FPS;
const LINK_DIST = 168; // node↔node connect distance (CSS px)
const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
const MOUSE_DIST = 240; // node↔cursor connect / influence distance
const MOUSE_DIST_SQ = MOUSE_DIST * MOUSE_DIST;

function shouldSkip() {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (
    window.matchMedia("(pointer: coarse)").matches &&
    window.innerWidth < 768
  ) {
    return true;
  }
  return false;
}

/* node count scales with viewport (a bit denser now for prominence) */
function nodeCountFor(w) {
  if (w < 640) return 44;
  if (w < 1024) return 68;
  return 92;
}

export default function CircuitBG() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (shouldSkip()) return undefined;

    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let nodes = [];
    let rafId = 0;
    let lastFrame = 0;
    let running = true;

    // live pointer (CSS px) + a smoothed version so influence feels springy
    let px = -9999;
    let py = -9999;
    let sx = -9999;
    let sy = -9999;
    let pointerActive = false;

    const rand = (min, max) => min + Math.random() * (max - min);

    function seedNodes() {
      const count = nodeCountFor(width);
      nodes = new Array(count).fill(0).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: rand(-9, 9),
        vy: rand(-9, 9),
        r: rand(0.9, 2.2),
        color: Math.random() < 0.34 ? CYAN : LIME,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedNodes();
    }

    function step(now) {
      if (!running) return;
      rafId = window.requestAnimationFrame(step);

      const elapsed = now - lastFrame;
      if (elapsed < FRAME_MS) return;
      const dt = Math.min(elapsed, 100) / 1000;
      lastFrame = now - (elapsed % FRAME_MS);

      // ease the smoothed pointer toward the real one
      if (pointerActive) {
        sx += (px - sx) * 0.12;
        sy += (py - sy) * 0.12;
      }

      ctx.clearRect(0, 0, width, height);

      // advance nodes; nudge them away from the cursor for reactivity
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (pointerActive) {
          const dx = n.x - sx;
          const dy = n.y - sy;
          const dSq = dx * dx + dy * dy;
          if (dSq < MOUSE_DIST_SQ && dSq > 1) {
            const d = Math.sqrt(dSq);
            const push = (1 - d / MOUSE_DIST) * 26; // px/sec, strongest up close
            n.x += (dx / d) * push * dt;
            n.y += (dy / d) * push * dt;
          }
        }
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < -20) n.x = width + 20;
        else if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        else if (n.y > height + 20) n.y = -20;
      }

      // node ↔ node links (brighter than before for prominence)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dSq = dx * dx + dy * dy;
          if (dSq > LINK_DIST_SQ) continue;
          const closeness = 1 - Math.sqrt(dSq) / LINK_DIST;
          const alpha = closeness * 0.22;
          if (alpha < 0.006) continue;
          const c = a.color === CYAN || b.color === CYAN ? CYAN : LIME;
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // node ↔ cursor links + node highlight near the pointer
      if (pointerActive) {
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const dx = n.x - sx;
          const dy = n.y - sy;
          const dSq = dx * dx + dy * dy;
          if (dSq > MOUSE_DIST_SQ) continue;
          const closeness = 1 - Math.sqrt(dSq) / MOUSE_DIST;
          ctx.strokeStyle = `rgba(${CYAN[0]},${CYAN[1]},${CYAN[2]},${closeness * 0.4})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(sx, sy);
          ctx.stroke();
          // brighter dot for influenced nodes
          ctx.fillStyle = `rgba(${LIME[0]},${LIME[1]},${LIME[2]},${0.25 + closeness * 0.5})`;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + closeness * 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        // soft glow at the cursor
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 90);
        g.addColorStop(0, "rgba(61,242,255,0.16)");
        g.addColorStop(1, "rgba(61,242,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, 90, 0, Math.PI * 2);
        ctx.fill();
      }

      // base nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.fillStyle = `rgba(${n.color[0]},${n.color[1]},${n.color[2]},0.22)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    resize();
    lastFrame = performance.now();
    rafId = window.requestAnimationFrame(step);

    // pointer tracking (window-level; canvas itself is pointer-events:none)
    function onMove(e) {
      px = e.clientX;
      py = e.clientY;
      if (!pointerActive) {
        sx = px;
        sy = py;
      }
      pointerActive = true;
    }
    function onLeave() {
      pointerActive = false;
      px = py = sx = sy = -9999;
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    let resizeTimer = 0;
    function onResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 150);
    }
    window.addEventListener("resize", onResize);

    function onVisibility() {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(rafId);
      } else if (!running) {
        running = true;
        lastFrame = performance.now();
        rafId = window.requestAnimationFrame(step);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="circuit-bg" aria-hidden="true" />;
}
