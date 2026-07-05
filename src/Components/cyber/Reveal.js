import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Reveal — the same scroll-in animation used on the homepage.        */
/*  Fade + slide-up by default. `cut` upgrades it to a masked          */
/*  "slide-up from behind a clipped edge", used for section headings.  */
/*  Renders statically under prefers-reduced-motion.                   */
/*                                                                      */
/*  Requires the `.db-cut` CSS rule (defined in Database.css) when      */
/*  used with `cut`.                                                    */
/* ------------------------------------------------------------------ */
export default function Reveal({ children, delay = 0, y = 40, className = "", cut = false }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-60px" });

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  if (cut) {
    return (
      <div ref={ref} className="db-cut">
        <motion.div
          className={className}
          initial={{ y: "115%" }}
          animate={inView ? { y: "0%" } : { y: "115%" }}
          transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
