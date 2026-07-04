import React, { useEffect, useRef } from "react";
import "./CircuitTraceBG.css";

/* ------------------------------------------------------------------ */
/*  CircuitTraceBG — animated PCB trace layer for the Database hero.  */
/*                                                                     */
/*  Procedurally generates Manhattan-routed "copper traces" (faint    */
/*  base lines + square pads at turns/ends), then sends a glowing     */
/*  signal pulse travelling along each one on a loop — like data      */
/*  moving through the board. Sized to its parent (the hero section), */
/*  not the viewport. Paused when tab hidden; skipped on               */
/*  reduced-motion / low-end touch, same guards as CircuitBG.         */
/* ------------------------------------------------------------------ */

const LIME = [187, 223, 77]; // --lime
const CYAN = [61, 242, 255]; // --cyan

const TARGET_FPS = 45;
const FRAME_MS = 1000 / TARGET_FPS;
const PAD = 1.6; // half-size of the little square pads, in px

function shouldSkip() {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 768) {
    return true;
  }
  return false;
}

function traceCountFor(w) {
  if (w < 640) return 9;
  if (w < 1024) return 14;
  return 20;
}

const rand = (min, max) => min + Math.random() * (max - min);

/* Build one Manhattan-routed polyline: alternating horizontal/vertical
   segments so it reads as a PCB trace, clamped inside the canvas. */
function buildTrace(width, height) {
  const points = [];
  let x = rand(0, width);
  let y = rand(0, height);
  points.push({ x, y });

  const segs = Math.floor(rand(3, 6));
  let axis = Math.random() < 0.5 ? "x" : "y"; // which axis the next move travels along
  for (let i = 0; i < segs; i++) {
    const len = rand(60, 150);
    const dir = Math.random() < 0.5 ? -1 : 1;
    if (axis === "x") {
      x = Math.min(width - 4, Math.max(4, x + dir * len));
    } else {
      y = Math.min(height - 4, Math.max(4, y + dir * len));
    }
    points.push({ x, y });
    axis = axis === "x" ? "y" : "x"; // alternate so it actually looks routed
  }

  // cumulative length lookup table, so a pulse can move at constant speed
  let total = 0;
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    total += Math.hypot(dx, dy);
    cum.push(total);
  }

  return {
    points,
    cum,
    total: Math.max(total, 1),
    color: Math.random() < 0.32 ? CYAN : LIME,
    speed: rand(70, 150), // px / sec
    t: Math.random(), // 0..1 progress, randomized so pulses don't sync up
  };
}

/* Given progress t (0..1) along a trace, return the {x,y} on its polyline. */
function pointAt(trace, t) {
  const target = t * trace.total;
  const { points, cum } = trace;
  let i = 1;
  while (i < cum.length && cum[i] < target) i++;
  if (i >= points.length) i = points.length - 1;
  const segStart = cum[i - 1];
  const segLen = cum[i] - segStart || 1;
  const local = (target - segStart) / segLen;
  const a = points[i - 1];
  const b = points[i];
  return { x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local };
}

export default function CircuitTraceBG() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (shouldSkip()) return undefined;

    const canvas = canvasRef.current;
    const parent = canvas && canvas.parentElement;
    if (!canvas || !parent) return undefined;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let traces = [];
    let rafId = 0;
    let lastFrame = 0;
    let running = true;

    function seed() {
      const count = traceCountFor(width);
      traces = new Array(count).fill(0).map(() => buildTrace(width, height));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = parent.getBoundingClientRect();
      width = Math.max(1, Math.round(r.width));
      height = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function drawBaseTraces() {
      for (const tr of traces) {
        ctx.strokeStyle = `rgba(${tr.color[0]},${tr.color[1]},${tr.color[2]},0.14)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tr.points[0].x, tr.points[0].y);
        for (let i = 1; i < tr.points.length; i++) {
          ctx.lineTo(tr.points[i].x, tr.points[i].y);
        }
        ctx.stroke();

        // square pads at every joint (PCB via/pad look)
        ctx.fillStyle = `rgba(${tr.color[0]},${tr.color[1]},${tr.color[2]},0.22)`;
        for (const p of tr.points) {
          ctx.fillRect(p.x - PAD, p.y - PAD, PAD * 2, PAD * 2);
        }
      }
    }

    function drawPulses() {
      const TAIL = 8; // comet-tail sample count
      for (const tr of traces) {
        for (let k = 0; k < TAIL; k++) {
          const tt = tr.t - k * 0.014;
          const wrapped = ((tt % 1) + 1) % 1;
          const { x, y } = pointAt(tr, wrapped);
          const fade = 1 - k / TAIL;
          const alpha = fade * 0.85;
          const r = 2.6 * fade + 0.4;
          ctx.fillStyle = `rgba(${tr.color[0]},${tr.color[1]},${tr.color[2]},${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        // soft glow at the pulse head
        const head = pointAt(tr, tr.t);
        const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 16);
        g.addColorStop(0, `rgba(${tr.color[0]},${tr.color[1]},${tr.color[2]},0.35)`);
        g.addColorStop(1, `rgba(${tr.color[0]},${tr.color[1]},${tr.color[2]},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(head.x, head.y, 16, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step(now) {
      if (!running) return;
      rafId = window.requestAnimationFrame(step);

      const elapsed = now - lastFrame;
      if (elapsed < FRAME_MS) return;
      const dt = Math.min(elapsed, 100) / 1000;
      lastFrame = now - (elapsed % FRAME_MS);

      ctx.clearRect(0, 0, width, height);

      for (const tr of traces) {
        tr.t = (tr.t + (tr.speed / tr.total) * dt) % 1;
      }

      drawBaseTraces();
      drawPulses();
    }

    resize();
    lastFrame = performance.now();
    rafId = window.requestAnimationFrame(step);

    const ro = "ResizeObserver" in window ? new ResizeObserver(() => resize()) : null;
    if (ro) ro.observe(parent);

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
      if (ro) ro.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="circuit-trace-bg" aria-hidden="true" />;
}
