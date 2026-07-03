import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Spring presets for cinematic motion ───────────────────────
const SPRING = { type: "spring", stiffness: 180, damping: 18, mass: 0.8 };
const SPRING_SNAP = { type: "spring", stiffness: 320, damping: 14 };
const EASE_CINE = [0.22, 1, 0.36, 1]; // easeOutExpo

// ─── Count-up animated number ──────────────────────────────────
function CountUp({ value, color, fontSize }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) return;
    const steps = 24;
    let i = 0;
    const id = setInterval(() => {
      i++;
      const t = i / steps;
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (i >= steps) { setDisplay(to); clearInterval(id); }
    }, 18);
    return () => clearInterval(id);
  }, [value]);

  const isInt = Number.isInteger(value);
  return (
    <span style={{ color, fontFamily: "monospace", fontWeight: 900, fontSize, textShadow: `0 0 24px ${color}` }}>
      {isInt ? Math.round(display) : display.toFixed(2)}
    </span>
  );
}

// ─── Chalk-writing text reveal (letter by letter) ──────────────
function ChalkReveal({ text, color, delay = 0, fontSize, fontWeight = 700 }) {
  const chars = text.split("");
  return (
    <span style={{ display: "inline-flex", fontFamily: "monospace", fontWeight, fontSize }}>
      {chars.map((ch, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.18, delay: delay + i * 0.025, ease: EASE_CINE }}
          style={{ color, whiteSpace: "pre" }}
        >
          {ch}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Parse derivation steps to extract hash table operations ────
function parseHashOps(steps = [], formula = "") {
  const allText = [...steps, formula].join(" ");
  const modMatch = allText.match(/mod\s*(\d+)/i);
  const size = modMatch ? parseInt(modMatch[1]) : 0;
  if (!size || size < 3 || size > 20) return null;

  const ops = [];
  steps.forEach((step, stepIdx) => {
    const hashMatch = step.match(/(\d+)\s*mod\s*(\d+)\s*=\s*(\d+)/);
    if (hashMatch) {
      const key = parseInt(hashMatch[1]);
      const slot = parseInt(hashMatch[3]);
      const isCollision = /collision|occupied|taken|filled/i.test(step);
      ops.push({ type: isCollision ? "collision" : "hash", key, slot, stepIdx });
    }
    const probeMatch = step.match(/(?:try|probe)\s*(?:slot\s*)?(\d+)/i);
    if (probeMatch) {
      ops.push({ type: "probe", slot: parseInt(probeMatch[1]), stepIdx });
    }
    const insertMatch = step.match(/(?:insert(?:ed)?\s*(?:at\s*)?(?:slot\s*)?|→\s*slot\s*)(\d+)/i);
    if (insertMatch && !hashMatch) {
      ops.push({ type: "insert", slot: parseInt(insertMatch[1]), stepIdx });
    }
    if (/COLLISION/i.test(step) && !hashMatch) {
      const slotM = step.match(/slot\s*(\d+)/i);
      if (slotM) ops.push({ type: "collision", slot: parseInt(slotM[1]), stepIdx });
    }
  });

  return { size, ops };
}

// ─── Parse load factor steps ─────────────────────────────────────
function parseLoadFactor(steps = [], formula = "") {
  const allText = [...steps, formula].join(" ");
  const lfMatch = allText.match(/(?:λ|load\s*factor)\s*=\s*(\d+)\s*[/÷]\s*(\d+)/i)
    || allText.match(/(\d+)\s*[/÷]\s*(\d+)\s*=\s*0\.\d+/);
  if (!lfMatch) return null;
  return { n: parseInt(lfMatch[1]), m: parseInt(lfMatch[2]) };
}

// ─── Hash Table Slot Cell — cinematic ────────────────────────────
function SlotCell({ index, state, keyVal, color, isActive }) {
  const bg = state === "empty" ? "rgba(255,255,255,0.05)"
    : state === "collision" ? "rgba(239,68,68,0.22)"
    : state === "probe" ? `${color}1a`
    : state === "filled" ? `${color}2e`
    : "rgba(255,255,255,0.05)";
  const border = state === "collision" ? "2px solid #ef4444"
    : state === "filled" ? `2px solid ${color}`
    : state === "probe" ? `1.5px dashed ${color}88`
    : isActive ? `1.5px solid ${color}55`
    : "1.5px solid rgba(255,255,255,0.08)";

  return (
    <div className="flex flex-col items-center gap-0.5">
      <motion.div
        className="rounded-lg flex items-center justify-center font-black relative overflow-hidden"
        style={{ width: 38, height: 38, background: bg, border, fontSize: 12 }}
        animate={isActive
          ? { scale: [1, 1.18, 1], boxShadow: [`0 0 0px ${color}`, `0 0 24px ${color}aa`, `0 0 10px ${color}44`] }
          : { scale: 1, boxShadow: "0 0 0px transparent" }}
        transition={{ duration: 0.6, ease: EASE_CINE }}
      >
        {/* Ripple on collision */}
        {state === "collision" && (
          <>
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={SPRING_SNAP} style={{ color: "#ef4444", fontSize: 16 }}>✕</motion.span>
            <motion.div className="absolute inset-0 rounded-lg"
              style={{ border: "2px solid #ef4444" }}
              initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.8, ease: EASE_CINE }} />
          </>
        )}
        {state === "probe" && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 0.8 }} style={{ color, fontSize: 10 }}>?</motion.span>
        )}
        {state === "filled" && keyVal !== undefined && (
          <motion.span
            initial={{ scale: 0, rotate: -120, y: -30 }} animate={{ scale: 1, rotate: 0, y: 0 }}
            transition={SPRING} style={{ color, fontSize: 11 }}>{keyVal}</motion.span>
        )}
        {isActive && state === "empty" && (
          <motion.div className="absolute inset-0 rounded-lg" style={{ background: `${color}18` }}
            animate={{ opacity: [0, 0.6, 0] }} transition={{ repeat: Infinity, duration: 0.7 }} />
        )}
      </motion.div>
      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>{index}</span>
    </div>
  );
}

// ─── Animated Hash Table ──────────────────────────────────────────
function HashTableViz({ formula, steps, color, currentStep }) {
  const parsed = parseHashOps(steps, formula);
  if (!parsed) return null;
  const { size, ops } = parsed;

  const slots = Array(size).fill(null).map(() => ({ state: "empty", key: undefined, isActive: false }));
  const activeSlots = new Set();
  let lastKey = null;

  ops.filter(op => op.stepIdx <= currentStep).forEach(op => {
    if (op.slot >= size) return;
    if (op.type === "hash") {
      lastKey = op.key;
      if (op.type === "collision" || slots[op.slot].state === "filled") {
        slots[op.slot] = { state: "collision", key: slots[op.slot].key, isActive: op.stepIdx === currentStep };
      } else {
        slots[op.slot] = { state: op.type === "collision" ? "collision" : "probe", key: op.key, isActive: op.stepIdx === currentStep };
      }
      activeSlots.add(op.slot);
    } else if (op.type === "collision") {
      if (slots[op.slot].state !== "filled") {
        slots[op.slot] = { state: "collision", key: slots[op.slot].key, isActive: op.stepIdx === currentStep };
      }
    } else if (op.type === "probe") {
      if (slots[op.slot].state === "empty") {
        slots[op.slot] = { state: "probe", isActive: op.stepIdx === currentStep };
      }
      activeSlots.add(op.slot);
    } else if (op.type === "insert") {
      slots[op.slot] = { state: "filled", key: lastKey || "K", isActive: op.stepIdx === currentStep };
    }
  });

  const latestHashOp = [...ops].reverse().find(op => op.type === "hash" && op.stepIdx <= currentStep);
  const showArrow = latestHashOp && latestHashOp.stepIdx === currentStep;

  return (
    <div className="flex flex-col items-center gap-3">
      <AnimatePresence mode="wait">
        {showArrow && (
          <motion.div key={`arrow-${currentStep}`} className="flex items-center gap-2"
            initial={{ opacity: 0, y: -25, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={SPRING}>
            <motion.div className="px-3 py-1.5 rounded-xl font-black"
              style={{ background: color, color: "#000", fontSize: 15 }}
              initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }}
              transition={SPRING_SNAP}>
              {latestHashOp.key}
            </motion.div>
            <motion.span style={{ color, fontFamily: "monospace", fontSize: 12 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              mod {parsed.size} = {latestHashOp.slot}
            </motion.span>
            <motion.span animate={{ x: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: EASE_CINE }}
              style={{ color, fontSize: 16 }}>→</motion.span>
            <motion.span className="px-2 py-1 rounded-lg font-black"
              style={{ background: `${color}33`, color, fontFamily: "monospace", fontSize: 12 }}
              initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={SPRING}>
              slot {latestHashOp.slot}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-1.5 justify-center">
        {slots.map((s, i) => (
          <SlotCell key={i} index={i} state={s.state} keyVal={s.key} color={color} isActive={s.isActive} />
        ))}
      </div>
    </div>
  );
}

// ─── Load Factor Bar — cinematic fill ───────────────────────────
function LoadFactorViz({ steps, formula, color, currentStep }) {
  const lf = parseLoadFactor(steps, formula);
  if (!lf) return null;
  const { n, m } = lf;
  const ratio = Math.min(n / m, 1);
  const pct = Math.round(ratio * 100);

  return (
    <div className="flex flex-col items-center gap-3 px-4">
      <motion.div className="text-center"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={SPRING}>
        <div className="flex items-center gap-3 justify-center mb-2 flex-wrap">
          <motion.div className="px-3 py-1.5 rounded-xl"
            style={{ background: "#3b82f633", border: "1px solid #3b82f6" }}
            initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={SPRING}>
            <span style={{ color: "#3b82f6", fontFamily: "monospace", fontWeight: 800, fontSize: 13 }}>Items = {n}</span>
          </motion.div>
          <motion.span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}
            initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ delay: 0.15, ...SPRING }}>÷</motion.span>
          <motion.div className="px-3 py-1.5 rounded-xl"
            style={{ background: "#f59e0b33", border: "1px solid #f59e0b" }}
            initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.1, ...SPRING }}>
            <span style={{ color: "#f59e0b", fontFamily: "monospace", fontWeight: 800, fontSize: 13 }}>Slots = {m}</span>
          </motion.div>
          <motion.span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18 }}
            initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ delay: 0.25, ...SPRING }}>=</motion.span>
          <motion.div className="px-3 py-1.5 rounded-xl"
            style={{ background: `${color}33`, border: `2px solid ${color}` }}
            initial={{ scale: 0.7 }} animate={{ scale: 1 }} transition={{ delay: 0.3, ...SPRING }}>
            <span style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 15 }}>λ = </span>
            <CountUp value={ratio} color={color} fontSize={15} />
          </motion.div>
        </div>
      </motion.div>

      <div className="w-full max-w-xs">
        <div className="flex gap-1 mb-1 flex-wrap">
          {Array(m).fill(0).map((_, i) => (
            <motion.div key={i} className="rounded relative overflow-hidden"
              style={{ width: Math.max(16, Math.floor(200 / m)), height: 20 }}
              initial={{ background: "rgba(255,255,255,0.06)", scaleY: 0.6 }}
              animate={{
                background: i < n ? color : "rgba(255,255,255,0.06)",
                scaleY: 1,
                boxShadow: i < n ? `0 0 12px ${color}66` : "0 0 0px transparent",
              }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: EASE_CINE }}>
              {/* shimmer sweep on filled */}
              {i < n && (
                <motion.div className="absolute inset-0"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.1, ease: "linear" }} />
              )}
            </motion.div>
          ))}
        </div>
        <div className="flex justify-between text-xs" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>
          <span>0</span>
          <motion.span key={pct} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color }}>
            <CountUp value={pct} color={color} fontSize={12} />% full
          </motion.span>
          <span>{m}</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN VisualBoard ─────────────────────────────────────────────
export default function VisualBoard({ formula, steps, color, currentStep }) {
  const hasHashTable = !!parseHashOps(steps, formula);
  const hasLoadFactor = !hasHashTable && !!parseLoadFactor(steps, formula);

  if (hasHashTable) {
    return (
      <div className="rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden"
        style={{ background: "rgba(0,0,0,0.7)", border: `2px solid ${color}44`, backdropFilter: "blur(20px)" }}>
        <BoardHeader color={color} label="Hash Table" icon="🗂" />
        {formula && <PinnedFormula formula={formula} color={color} />}
        <HashTableViz formula={formula} steps={steps} color={color} currentStep={currentStep} />
      </div>
    );
  }

  if (hasLoadFactor) {
    return (
      <div className="rounded-xl p-4 relative overflow-hidden"
        style={{ background: "rgba(0,0,0,0.7)", border: `2px solid ${color}44`, backdropFilter: "blur(20px)" }}>
        <BoardHeader color={color} label="Load Factor" icon="📊" />
        {formula && <PinnedFormula formula={formula} color={color} />}
        <LoadFactorViz steps={steps} formula={formula} color={color} currentStep={currentStep} />
      </div>
    );
  }

  return <GenericMathViz formula={formula} steps={steps} color={color} currentStep={currentStep} />;
}

// ─── Shared: Board header with pulse dot ─────────────────────────
function BoardHeader({ color, label, icon }) {
  return (
    <div className="flex items-center gap-2">
      <motion.div className="w-2 h-2 rounded-full" style={{ background: color }}
        animate={{ opacity: [1, 0.3, 1], scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.2, ease: EASE_CINE }} />
      <span className="text-xs font-black uppercase tracking-widest" style={{ color }}>{icon} {label}</span>
    </div>
  );
}

// ─── Shared: Pinned formula with glow ────────────────────────────
function PinnedFormula({ formula, color }) {
  return (
    <motion.div className="text-center py-1.5 px-3 rounded-lg relative overflow-hidden"
      style={{ background: `${color}18`, border: `1.5px solid ${color}55` }}
      initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={SPRING}>
      <span style={{ color, fontFamily: "monospace", fontWeight: 900, fontSize: "clamp(12px,2vw,16px)", textShadow: `0 0 16px ${color}` }}>
        {formula}
      </span>
      <motion.div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent, ${color}22, transparent)` }}
        animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} />
    </motion.div>
  );
}

// ─── Generic animated blackboard ──────────────────────────────────
function GenericMathViz({ formula, steps, color, currentStep }) {
  const step = steps[currentStep] || steps[steps.length - 1] || formula || "";
  const eqIdx = step.lastIndexOf("=");
  const hasEq = eqIdx > 0;
  const lhs = hasEq ? step.slice(0, eqIdx) : step;
  const rhs = hasEq ? step.slice(eqIdx + 1).trim() : "";
  const rhsNum = parseFloat(rhs.replace(/[^0-9.\-]/g, ""));
  const isPureNum = rhs !== "" && !isNaN(rhsNum) && rhs.replace(/[^0-9.\-]/g, "").length === rhs.replace(/\s/g, "").length;

  return (
    <div className="rounded-xl p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg,#0a0c10,#070a08)", border: `2px solid ${color}44`, backdropFilter: "blur(20px)" }}>
      <BoardHeader color={color} label="Blackboard" icon="✎" />

      {formula && (
        <div className="text-center py-2 px-3 rounded-lg mb-3"
          style={{ background: `${color}12`, border: `1px solid ${color}33` }}>
          <span style={{ color: `${color}cc`, fontFamily: "monospace", fontWeight: 800, fontSize: "clamp(11px,1.8vw,15px)" }}>
            {formula}
          </span>
        </div>
      )}

      {/* Animated working line with AnimatePresence for smooth step transitions */}
      <div className="min-h-[64px] flex items-center justify-center flex-wrap gap-x-2 gap-y-1 px-2 py-3 rounded-lg relative overflow-hidden"
        style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)" }}>

        {/* Light sweep across working line */}
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${color}0a, transparent)` }}
          animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 3, ease: "linear" }} />

        <AnimatePresence mode="wait">
          <motion.div key={`step-${currentStep}`} className="flex items-center flex-wrap gap-x-2 gap-y-1 justify-center"
            initial={{ opacity: 0, x: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -30, filter: "blur(8px)" }}
            transition={{ duration: 0.4, ease: EASE_CINE }}>

            {/* LHS — chalk writing effect */}
            <ChalkReveal text={lhs.replace(/→|insert|inserted/i, "").trim()} color="rgba(255,255,255,0.85)"
              fontSize="clamp(13px,2.4vw,20px)" fontWeight={700} />

            {hasEq && (
              <motion.span
                initial={{ scale: 0, rotate: -90, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, rotate: 90, opacity: 0 }}
                transition={{ ...SPRING_SNAP, delay: 0.12 }}
                style={{ color, fontFamily: "monospace", fontWeight: 900, fontSize: "clamp(15px,2.6vw,22px)" }}>=</motion.span>
            )}

            {/* RHS — slam in with glow; count-up if pure number */}
            {hasEq && rhs && (
              isPureNum ? (
                <motion.span
                  initial={{ scale: 2.6, opacity: 0, filter: "blur(6px)" }}
                  animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ ...SPRING, delay: 0.25 }}
                  style={{ fontFamily: "monospace", fontWeight: 900, fontSize: "clamp(16px,3vw,26px)" }}>
                  <CountUp value={rhsNum} color={color} fontSize="clamp(16px,3vw,26px)" />
                </motion.span>
              ) : (
                <motion.span
                  initial={{ scale: 2.4, opacity: 0, filter: "blur(6px)" }}
                  animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ ...SPRING, delay: 0.25 }}>
                  <ChalkReveal text={rhs} color={color} delay={0.25} fontSize="clamp(16px,3vw,26px)" fontWeight={900} />
                </motion.span>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots for steps */}
      {steps.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {steps.map((_, i) => (
            <motion.div key={i} className="rounded-full"
              animate={{
                width: i === currentStep ? 24 : 6,
                background: i <= currentStep ? color : "rgba(255,255,255,0.12)",
              }}
              style={{ height: 6, boxShadow: i === currentStep ? `0 0 10px ${color}` : "none" }}
              transition={{ duration: 0.3, ease: EASE_CINE }} />
          ))}
        </div>
      )}
    </div>
  );
}