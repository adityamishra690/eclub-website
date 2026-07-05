import React, { useEffect, useRef } from "react";
import "./RadarBG.css";

/* ==================================================================
   RadarBG — animated target-lock / radar sweep, for the Challenge
   hero. A rotating sweep beam circles a set of static rings +
   crosshair; blips flash awake as the sweep passes their angle,
   like a signal being detected. Sized to its parent, not the
   viewport — same conventions as CircuitTraceBG.
   ================================================================== */

const LIME = [187, 223, 77];
const CYAN = [61, 242, 255];

const TARGET_FPS = 45;
const FRAME_MS = 1000 / TARGET_FPS;

function shouldSkip() {
  if (typeof window === "undefined" || !window.matchMedia) return true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return true;
  if (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 768) {
    return true;
  }
  return false;
}

const rand = (min, max) => min + Math.random() * (max - min);
const TWO_PI = Math.PI * 2;

function normalizeAngle(a) {
  const r = a % TWO_PI;
  return r < 0 ? r + TWO_PI : r;
}

/* angular distance travelling forward from `from` to `to`, in 0..2π */
function angleAhead(from, to) {
  return normalizeAngle(to - from);
}

export default function RadarBG() {
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
    let cx = 0;
    let cy = 0;
    let maxR = 0;
    let dpr = 1;
    let sweep = rand(0, TWO_PI);
    let blips = [];
    let rafId = 0;
    let lastFrame = 0;
    let running = true;
    const SWEEP_SPEED = 0.5; // rad/sec

    function seedBlips() {
      const count = width < 640 ? 7 : width < 1100 ? 11 : 15;
      blips = new Array(count).fill(0).map(() => ({
        angle: rand(0, TWO_PI),
        radius: rand(0.18, 0.95),
        color: Math.random() < 0.3 ? CYAN : LIME,
        life: 0, // 0 = dormant, >0 = fading in/out after the sweep passes
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = parent.getBoundingClientRect();
      width = Math.max(1, Math.round(r.width));
      height = Math.max(1, Math.round(r.height));
      cx = width / 2;
      cy = height / 2;
      maxR = Math.min(width, height) * 0.46;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedBlips();
    }

    function drawRings() {
      ctx.strokeStyle = "rgba(187,223,77,0.14)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (maxR * i) / 4, 0, TWO_PI);
        ctx.stroke();
      }
      // crosshair
      ctx.beginPath();
      ctx.moveTo(cx - maxR, cy);
      ctx.lineTo(cx + maxR, cy);
      ctx.moveTo(cx, cy - maxR);
      ctx.lineTo(cx, cy + maxR);
      ctx.stroke();

      // perimeter tick marks every 15deg
      ctx.strokeStyle = "rgba(61,242,255,0.18)";
      for (let d = 0; d < 360; d += 15) {
        const a = (d * Math.PI) / 180;
        const inner = maxR * 1.0;
        const outer = maxR * 1.05;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
        ctx.stroke();
      }
    }

    function drawSweep() {
      const grad = ctx.createConicGradient
        ? ctx.createConicGradient(sweep - 0.9, cx, cy)
        : null;
      // fallback path: draw a faded wedge using multiple thin arcs if
      // createConicGradient isn't supported
      const WEDGE = 0.9; // radians of trailing fade
      if (grad) {
        grad.addColorStop(0, "rgba(187,223,77,0)");
        grad.addColorStop(0.94, "rgba(187,223,77,0)");
        grad.addColorStop(1, "rgba(187,223,77,0.22)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxR, 0, TWO_PI);
        ctx.closePath();
        ctx.fill();
      } else {
        const steps = 24;
        for (let i = 0; i < steps; i++) {
          const t = i / steps;
          const a0 = sweep - WEDGE * (1 - t);
          const a1 = sweep - WEDGE * (1 - (i + 1) / steps);
          ctx.fillStyle = `rgba(187,223,77,${0.22 * t})`;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.arc(cx, cy, maxR, a0, a1);
          ctx.closePath();
          ctx.fill();
        }
      }

      // bright leading line
      ctx.strokeStyle = "rgba(187,223,77,0.85)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * maxR, cy + Math.sin(sweep) * maxR);
      ctx.stroke();
    }

    function drawBlips(dt) {
      for (const b of blips) {
        // wake the blip when the sweep line passes its angle
        if (angleAhead(sweep - SWEEP_SPEED * dt, b.angle) < SWEEP_SPEED * dt + 0.02 &&
            angleAhead(sweep, b.angle) > TWO_PI - 0.3) {
          b.life = 1;
        }
        if (b.life <= 0) continue;
        b.life -= dt * 0.55;
        const x = cx + Math.cos(b.angle) * b.radius * maxR;
        const y = cy + Math.sin(b.angle) * b.radius * maxR;
        const alpha = Math.max(0, Math.min(1, b.life));
        ctx.fillStyle = `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, TWO_PI);
        ctx.fill();
        // faint ripple ring
        ctx.strokeStyle = `rgba(${b.color[0]},${b.color[1]},${b.color[2]},${alpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, 3.2 + (1 - alpha) * 14, 0, TWO_PI);
        ctx.stroke();
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
      sweep = normalizeAngle(sweep + SWEEP_SPEED * dt);

      drawRings();
      drawSweep();
      drawBlips(dt);
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

  return <canvas ref={canvasRef} className="radar-bg" aria-hidden="true" />;
}
