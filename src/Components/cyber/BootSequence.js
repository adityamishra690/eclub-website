import React, { useEffect, useRef, useState, useCallback } from "react";
import "./BootSequence.css";

/* ------------------------------------------------------------------ */
/*  BootSequence — first-load "boot into the club OS" overlay.        */
/*                                                                     */
/*  Full-screen fixed overlay above the navbar. Types ~5 mono boot    */
/*  lines with a blinking cyan caret, drives a 0->100% progress bar,  */
/*  then curtains up with a clip-path wipe and calls onFinish() once. */
/*                                                                     */
/*  Any keydown / click / touchstart skips straight to the wipe.      */
/*  prefers-reduced-motion: no typing, final frame, quick fade.       */
/* ------------------------------------------------------------------ */

const LINES = [
  { text: "> initializing electronics core...", tone: "dim" },
  { text: "> loading circuit database...", tone: "dim" },
  { text: "> compiling project modules...", tone: "dim" },
  { text: "> calibrating reactor...", tone: "dim" },
  { text: "NEURAL_BUILD // ONLINE", tone: "hero" },
];

/* Timing budget (auto-run ≈ 1.6s of typing, then a ~0.45s wipe). */
const TYPE_MS = 9; // per-character type speed
const LINE_GAP_MS = 70; // pause between lines
const HOLD_MS = 220; // linger on the final frame before wiping
const WIPE_MS = 450; // curtain-up clip-path duration
const FADE_MS = 380; // reduced-motion fade-out duration

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function BootSequence({ onFinish }) {
  const reduced = useRef(prefersReducedMotion());

  // Typed text, one string per line (built up character by character).
  const [typed, setTyped] = useState(() => LINES.map(() => ""));
  const [activeLine, setActiveLine] = useState(0);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("boot"); // "boot" -> "wipe" | "fade"

  // Guards so onFinish fires exactly once and timers don't double-run.
  const finishedRef = useRef(false);
  const exitingRef = useRef(false);
  const timersRef = useRef([]);
  const rafRef = useRef(0);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish && onFinish();
  }, [onFinish]);

  // Kick off the exit (wipe or fade), then finish once it completes.
  const exit = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    clearTimers();

    // Snap the visual to its finished state so a skip never shows a
    // half-typed frame behind the curtain.
    setTyped(LINES.map((l) => l.text));
    setActiveLine(LINES.length - 1);
    setProgress(100);

    const mode = reduced.current ? "fade" : "wipe";
    setPhase(mode);
    const dur = reduced.current ? FADE_MS : WIPE_MS;
    const id = setTimeout(finish, dur);
    timersRef.current.push(id);
  }, [clearTimers, finish]);

  /* -------- global skip: any key / click / touch -> exit -------- */
  useEffect(() => {
    const skip = () => exit();
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("touchstart", skip, { passive: true });
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("touchstart", skip);
    };
  }, [exit]);

  /* -------- reduced motion: show final frame, fade, done -------- */
  useEffect(() => {
    if (!reduced.current) return;
    setTyped(LINES.map((l) => l.text));
    setActiveLine(LINES.length - 1);
    setProgress(100);
    // Give the final frame a beat to paint, then fade out.
    const id = setTimeout(exit, 180);
    timersRef.current.push(id);
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------- typing driver (skipped when reduced motion) -------- */
  useEffect(() => {
    if (reduced.current) return;

    // Total characters across all lines, for progress mapping.
    const totalChars = LINES.reduce((n, l) => n + l.text.length, 0);
    let li = 0; // line index
    let ci = 0; // char index within current line
    let done = 0; // chars committed so far

    const typeNext = () => {
      if (exitingRef.current) return;
      const line = LINES[li];
      ci += 1;
      done += 1;
      const slice = line.text.slice(0, ci);

      setActiveLine(li);
      setTyped((prev) => {
        const next = prev.slice();
        next[li] = slice;
        return next;
      });
      // Reserve the last slice of the bar for the hold/wipe so it visibly
      // reaches 100% right as the curtain rises.
      setProgress(Math.min(98, Math.round((done / totalChars) * 98)));

      if (ci < line.text.length) {
        push(typeNext, TYPE_MS);
      } else if (li < LINES.length - 1) {
        li += 1;
        ci = 0;
        push(typeNext, LINE_GAP_MS);
      } else {
        // All lines typed — fill to 100%, hold, then wipe.
        setProgress(100);
        push(exit, HOLD_MS);
      }
    };

    const push = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timersRef.current.push(id);
    };

    push(typeNext, 200); // brief beat before the first character
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`boot ${phase === "wipe" ? "boot--wipe" : ""} ${
        phase === "fade" ? "boot--fade" : ""
      }`}
      role="status"
      aria-live="polite"
      aria-label="System booting"
    >
      <div className="boot__grid" aria-hidden="true" />
      <div className="boot__scan" aria-hidden="true" />

      {/* corner-bracket reticle */}
      <span className="boot__bracket boot__bracket--tl" aria-hidden="true" />
      <span className="boot__bracket boot__bracket--tr" aria-hidden="true" />
      <span className="boot__bracket boot__bracket--bl" aria-hidden="true" />
      <span className="boot__bracket boot__bracket--br" aria-hidden="true" />

      <div className="boot__stage">
        <div className="boot__head" aria-hidden="true">
          <span className="boot__dot boot__dot--r" />
          <span className="boot__dot boot__dot--y" />
          <span className="boot__dot boot__dot--g" />
          <span className="boot__headlabel">neural_build // os · boot</span>
        </div>

        <div className="boot__term" aria-hidden="true">
          {LINES.map((line, i) => {
            const isActive = i === activeLine;
            const content = typed[i];
            if (!content) return null;
            return (
              <div
                key={i}
                className={`boot__line boot__line--${line.tone}`}
              >
                <span className="boot__text">{content}</span>
                {isActive && <span className="boot__caret" aria-hidden="true" />}
              </div>
            );
          })}
        </div>

        <div className="boot__progress" aria-hidden="true">
          <div className="boot__track">
            <div
              className="boot__fill"
              style={{ transform: `scaleX(${progress / 100})` }}
            />
          </div>
          <div className="boot__pct">
            {String(Math.round(progress)).padStart(3, "0")}%
          </div>
        </div>
      </div>

      <div className="boot__hint" aria-hidden="true">
        PRESS ANY KEY · TAP TO SKIP
      </div>
    </div>
  );
}
