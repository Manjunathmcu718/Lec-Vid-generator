import { motion, AnimatePresence } from "framer-motion";
import { useMemo } from "react";

/**
 * Cinematic documentary overlay — high-contrast technical labels, a scrolling
 * marquee band of key terms extracted from the scene, and a lower-third
 * "chapter" strap. Sits above the video, below the interactive content.
 */
export default function CinematicOverlay({ scene, accent, current, total, playing }) {
  // Extract key terms from narration + title + key_points
  const keyTerms = useMemo(() => {
    const stop = new Set(["the","a","an","is","are","was","were","to","of","in","on","for","and","or","but","with","by","from","at","it","this","that","we","can","use","used","our","into","its","be","as","if","so","do","does","not","no","yes","you","your","they","their","them","then","than","also","more","most","such","each","when","where","how","what","which","who","whom","will","would","could","should","may","might","must","shall","can","about","above","below","up","down","out","over","under","again","further","once","here","there","all","any","both","few","other","some","only","own","same","very","just","now"]);
    const text = `${scene?.title || ""} ${scene?.narration || ""} ${(scene?.key_points || []).join(" ")}`.toLowerCase();
    const words = text.match(/[a-z]+/g) || [];
    const freq = {};
    words.forEach(w => { if (w.length > 3 && !stop.has(w)) freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(e => e[0].toUpperCase());
  }, [scene]);

  // Timecode display
  const tc = useMemo(() => {
    const totalSec = (current + 1) * 37;
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    const f = String(Math.floor((totalSec % 1) * 24)).padStart(2, "0");
    return `${m}:${s}:${f}`;
  }, [current]);

  return (
    <>
      {/* ─── TOP TECHNICAL LABEL BAR ─── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)" }}>
        <div className="flex items-center gap-2">
          <motion.span className="px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.15em]"
            style={{ background: accent, color: "#000" }}>
            REC ●
          </motion.span>
          <span className="text-[8px] font-mono uppercase tracking-widest text-white/60">
            TC {tc}
          </span>
          <span className="text-[8px] font-mono uppercase tracking-widest text-white/40 hidden sm:inline">
            F23.976 · 2.39:1
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono uppercase tracking-widest text-white/40 hidden sm:inline">
            CH {String(current + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
          {playing && (
            <motion.span className="flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest text-white/60"
              animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> LIVE
            </motion.span>
          )}
        </div>
      </div>

      {/* ─── KEY TERM MARQUEE BAND (top, below tech bar) ─── */}
      <div className="absolute top-8 left-0 right-0 z-20 overflow-hidden pointer-events-none"
        style={{ background: "linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.3), rgba(0,0,0,0.6))" }}>
        <motion.div className="flex gap-6 py-1 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 30, ease: "linear" }}>
          {[...keyTerms, ...keyTerms, ...keyTerms, ...keyTerms].map((term, i) => (
            <span key={i} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-white/45">
              {term}
              <span style={{ color: accent }}>◆</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ─── BOTTOM LOWER-THIRD (documentary chapter strap) ─── */}
      <AnimatePresence mode="wait">
        <motion.div key={`lt-${current}`}
          initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="absolute bottom-16 left-3 z-20 pointer-events-none max-w-[60%]">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2.5 w-2.5" style={{ background: accent }} />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/80"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
              Chapter {String(current + 1).padStart(2, "0")}
            </span>
            <div className="h-px w-8" style={{ background: `linear-gradient(to right, ${accent}, transparent)` }} />
          </div>
          <p className="text-sm sm:text-base font-black uppercase tracking-tight text-white leading-tight"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.6)" }}>
            {scene?.title}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* ─── RIGHT-SIDE ACADEMY BUG ─── */}
      <div className="absolute top-14 right-3 z-20 pointer-events-none flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 px-2 py-0.5"
          style={{ background: "rgba(0,0,0,0.6)", border: `1px solid ${accent}44` }}>
          <span className="text-[8px] font-black uppercase tracking-widest text-white/70">LECTURE</span>
          <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: accent }}>AI</span>
        </div>
      </div>

      {/* ─── BOTTOM FILM STRIP TICKER ─── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center gap-1 px-3 py-1 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-sm"
            style={{
              background: i === current ? accent : "rgba(255,255,255,0.1)",
              boxShadow: i === current ? `0 0 6px ${accent}` : "none",
            }} />
        ))}
      </div>
    </>
  );
}