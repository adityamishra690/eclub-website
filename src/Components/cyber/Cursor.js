import React, { useEffect, useRef, useState } from "react";
import "./Cursor.css";

/* ------------------------------------------------------------------ */
/*  Shared pointer-capability helpers                                 */
/* ------------------------------------------------------------------ */

/* We only ever run the heavy cursor / magnetism on a genuine fine, hovering
   pointer (mouse / trackpad). Touch + stylus stay untouched. */
const FINE_QUERY = "(pointer: fine)";
const HOVER_QUERY = "(hover: hover)";

function supportsFinePointer() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return (
    window.matchMedia(FINE_QUERY).matches &&
    window.matchMedia(HOVER_QUERY).matches
  );
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Elements that should make the ring bloom + invert to lime. */
const INTERACTIVE_SELECTOR =
  "a, button, .ch-btn, .nvx__link, .nvx__burger, [data-cursor]";

/* ================================================================== */
/*  <Cursor /> — neon dot + lagging ring                              */
/* ================================================================== */

export default function Cursor() {
  // Re-checked on mount so SSR / first paint never assumes a fine pointer.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(supportsFinePointer());
  }, []);

  if (!enabled) return null;
  return <CursorLayer />;
}

/* The actual DOM + rAF loop, mounted only once we KNOW it's a fine pointer. */
function CursorLayer() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const reduce = prefersReducedMotion();
    const root = document.documentElement;
    root.classList.add("has-cursor");

    // Live pointer target + eased ring position.
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let rx = tx;
    let ry = ty;
    let visible = false;
    let hovering = false;
    let rafId = 0;
    let running = false;
    let paused = false;

    const setActive = (on) => {
      if (on === hovering) return;
      hovering = on;
      ring.classList.toggle("cur-ring--active", on);
    };

    const onMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        // Snap the ring to the pointer the first time so it doesn't fly in.
        rx = tx;
        ry = ty;
        dot.classList.add("cur--on");
        ring.classList.add("cur--on");
      }
      // Dot tracks the pointer exactly, every move — no lerp.
      dot.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;

      // Hover state via the element actually under the pointer. Using the
      // event target (rather than a separate elementFromPoint call) keeps this
      // cheap and correct for nested children of interactive elements.
      const el = e.target;
      setActive(!!(el && el.closest && el.closest(INTERACTIVE_SELECTOR)));

      if (reduce) {
        // No easing when reduced motion is requested — ring pins to the dot.
        rx = tx;
        ry = ty;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      } else {
        // Wake the easing loop so the ring catches up to the new target.
        start();
      }
    };

    const onDown = () => ring.classList.add("cur-ring--down");
    const onUp = () => ring.classList.remove("cur-ring--down");

    const onLeave = () => {
      visible = false;
      dot.classList.remove("cur--on");
      ring.classList.remove("cur--on");
    };
    const onEnter = () => {
      // Re-show on re-entry; onMove will flip `visible` back on.
    };

    // Ring easing loop — compositor-only transform, rAF-throttled. Settles and
    // stops once the ring has caught up so it doesn't burn a frame forever.
    const tick = () => {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      if (Math.abs(tx - rx) < 0.1 && Math.abs(ty - ry) < 0.1) {
        rx = tx;
        ry = ty;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
        running = false;
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    // No-op if the loop is already running or motion is suppressed/paused.
    const start = () => {
      if (running || reduce || paused) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    // Pause the loop when the tab is hidden or the window loses focus; resume
    // (and snap the ring to the pointer target) when it comes back.
    const onVisibility = () => {
      if (document.hidden) {
        paused = true;
        stop();
      } else {
        paused = false;
        start();
      }
    };
    const onWindowBlur = () => {
      paused = true;
      stop();
      onLeave();
    };
    const onWindowFocus = () => {
      paused = false;
      start();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);

    return () => {
      stop();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      root.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cur-ring" aria-hidden="true" />
      <div ref={dotRef} className="cur-dot" aria-hidden="true" />
    </>
  );
}

/* ================================================================== */
/*  <Magnetic /> — wraps a target so it drifts toward the pointer     */
/* ================================================================== */

export function Magnetic({
  children,
  className = "",
  strength = 0.35,
  radius = 90,
}) {
  const ref = useRef(null);
  const frame = useRef(0);
  const pos = useRef({ x: 0, y: 0 }); // current (eased) offset
  const target = useRef({ x: 0, y: 0 }); // desired offset
  const [enabled, setEnabled] = useState(false);

  // Decide capability on mount (client only). Coarse / no-hover => inert span.
  useEffect(() => {
    setEnabled(supportsFinePointer());
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const reduce = prefersReducedMotion();
    let running = false;

    const apply = () => {
      el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
    };

    const loop = () => {
      // Ease current toward target; stop the loop once effectively settled.
      const ease = reduce ? 1 : 0.2;
      pos.current.x += (target.current.x - pos.current.x) * ease;
      pos.current.y += (target.current.y - pos.current.y) * ease;
      apply();
      const dx = Math.abs(target.current.x - pos.current.x);
      const dy = Math.abs(target.current.y - pos.current.y);
      if (dx < 0.1 && dy < 0.1) {
        pos.current.x = target.current.x;
        pos.current.y = target.current.y;
        apply();
        running = false;
        frame.current = 0;
        return;
      }
      frame.current = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      frame.current = requestAnimationFrame(loop);
    };

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        target.current.x = 0;
        target.current.y = 0;
      } else {
        // Falloff so the pull is gentlest at the rim, strongest near center.
        const falloff = 1 - dist / radius;
        target.current.x = dx * strength * falloff;
        target.current.y = dy * strength * falloff;
      }
      start();
    };

    const onLeave = () => {
      target.current.x = 0;
      target.current.y = 0;
      start();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (frame.current) cancelAnimationFrame(frame.current);
      // Reset any lingering transform so unmount/remount is clean.
      el.style.transform = "";
    };
  }, [enabled, strength, radius]);

  // Coarse / no-hover pointers: plain inert span, zero handlers.
  if (!enabled) {
    return <span className={`mag ${className}`.trim()}>{children}</span>;
  }

  return (
    <span ref={ref} className={`mag mag--live ${className}`.trim()}>
      {children}
    </span>
  );
}
