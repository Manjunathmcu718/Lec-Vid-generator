import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronRight, Gauge } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import VisualBoard from "./VisualBoard";
import CinematicBackground from "./CinematicBackground";
import CinematicOverlay from "./CinematicOverlay";
import ThemeSwitcher from "./ThemeSwitcher";
import { THEMES, getTheme, DEFAULT_THEME_ID } from "./sceneThemes";

// ─── Voice engine ────────────────────────────────────────────────
function createVoice() {
  let keepalive = null;
  const stop = () => {
    if (keepalive) { clearInterval(keepalive); keepalive = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };
  const speak = (text, { onWord, rate = 0.88 } = {}) => {
    if (!window.speechSynthesis) return;
    stop();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate; u.pitch = 1.05; u.volume = 1;
    const voices = window.speechSynthesis.getVoices();
    const pick = voices.find(v => /en[-_]US/i.test(v.lang) && /google|samantha|daniel/i.test(v.name))
      || voices.find(v => /en/i.test(v.lang) && !v.localService)
      || voices.find(v => /en/i.test(v.lang));
    if (pick) u.voice = pick;
    if (onWord) u.onboundary = e => { if (e.name === "word") onWord(e.charIndex); };
    u.onerror = stop;
    window.speechSynthesis.speak(u);
    keepalive = setInterval(() => {
      if (window.speechSynthesis.speaking) { window.speechSynthesis.pause(); window.speechSynthesis.resume(); }
      else { clearInterval(keepalive); }
    }, 12000);
  };
  return { speak, stop };
}

// ─── Colorize math tokens ─────────────────────────────────────────
function ColorizedStep({ text, color, isCurrent }) {
  const parts = text.split(/(\d+(?:\.\d+)?|[→⇒=λ+\-*/^()%]|mod|slot|COLLISION|probe|✓)/g);
  return (
    <span>
      {parts.map((p, i) => {
        const isNum = /^\d/.test(p);
        const isOp = /^[→⇒=+\-*/^%]$|^mod$/.test(p);
        const isKey = /COLLISION|✓/.test(p);
        return (
          <span key={i} style={{
            color: isKey ? "#f87171" : isNum ? (isCurrent ? "#fff" : color) : isOp ? "#94a3b8" : isCurrent ? "#fff" : "rgba(255,255,255,0.75)",
            fontWeight: (isNum || isKey) ? 800 : 600,
          }}>{p}</span>
        );
      })}
    </span>
  );
}

// ─── Derivation text steps ────────────────────────────────────────
function DerivationSteps({ steps, color, shownCount }) {
  if (!steps?.length) return null;
  return (
    <div className="space-y-1.5">
      {steps.slice(0, shownCount).map((step, i) => {
        const isCurrent = i === shownCount - 1;
        const isPast = i < shownCount - 1;
        return (
          <motion.div key={i}
            initial={{ x: -50, opacity: 0, scale: 0.88 }}
            animate={{ x: 0, opacity: isPast ? 0.5 : 1, scale: isCurrent ? 1 : isPast ? 0.94 : 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="flex items-start gap-3 px-3 py-2 rounded-xl"
            style={{
              background: isCurrent ? `${color}18` : "rgba(255,255,255,0.03)",
              border: isCurrent ? `1.5px solid ${color}55` : "1px solid rgba(255,255,255,0.06)",
              boxShadow: isCurrent ? `0 0 18px ${color}22` : "none",
            }}>
            <motion.div
              className="shrink-0 rounded-lg flex items-center justify-center font-black"
              style={{ width: isCurrent ? 28 : 22, height: isCurrent ? 28 : 22, background: isCurrent ? color : `${color}55`, color: "#000", fontSize: isCurrent ? 13 : 10, transition: "all 0.3s" }}
              initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 300 }}>
              {i + 1}
            </motion.div>
            <span style={{ fontFamily: "monospace", fontSize: isCurrent ? "clamp(12px,2vw,17px)" : "clamp(10px,1.4vw,13px)", fontWeight: isCurrent ? 700 : 500, lineHeight: 1.45, transition: "font-size 0.3s" }}>
              <ColorizedStep text={step} color={color} isCurrent={isCurrent} />
            </span>
            {isCurrent && (
              <motion.div className="ml-auto shrink-0 w-1 self-stretch rounded-full" style={{ background: color }}
                animate={{ opacity: [1, 0.2, 1] }} transition={{ repeat: Infinity, duration: 0.7 }} />
            )}
          </motion.div>
        );
      })}

      {shownCount < steps.length && shownCount > 0 && (
        <motion.div className="flex items-center gap-2 px-3"
          animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 0.9 }}>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: color }}
                animate={{ y: [0,-5,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} />
            ))}
          </div>
          <span style={{ color, fontSize: 11, fontFamily: "monospace", fontWeight: 700 }}>solving next step...</span>
        </motion.div>
      )}

      {shownCount >= steps.length && shownCount > 0 && (
        <motion.div className="flex items-center gap-2 px-3"
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black"
            style={{ background: color, color: "#000" }}>✓</div>
          <span style={{ color, fontSize: 12, fontFamily: "monospace", fontWeight: 800 }}>SOLVED ■</span>
        </motion.div>
      )}
    </div>
  );
}

// ─── Narration bottom bar ─────────────────────────────────────────
function NarrationBar({ text, highlightIdx, color }) {
  const words = text.split(" ");
  return (
    <div className="leading-relaxed">
      {words.map((word, i) => (
        <motion.span key={i}
          animate={i === highlightIdx ? { color, fontWeight: 800 } : i < highlightIdx ? { color: "#fff" } : { color: "rgba(255,255,255,0.45)" }}
          transition={{ duration: 0.1 }}
          style={{ display: "inline-block", marginRight: 4, fontSize: "clamp(11px,1.6vw,14px)" }}>
          {word}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Key point card ───────────────────────────────────────────────
function KeyCard({ text, index, color, show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex items-start gap-2 p-2 rounded-xl"
          style={{ background: "rgba(255,255,255,0.05)", border: `1.5px solid ${color}44` }}>
          <div className="shrink-0 w-5 h-5 rounded flex items-center justify-center font-black text-xs"
            style={{ background: color, color: "#000" }}>{index + 1}</div>
          <span className="text-white font-semibold" style={{ fontSize: "clamp(9px,1.3vw,12px)" }}>{text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── MAIN PLAYER ─────────────────────────────────────────────────
export default function ScenePlayer({ scenes = [] }) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(0.85);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [wordIdx, setWordIdx] = useState(-1);
  const [shownPts, setShownPts] = useState([]);
  const [shownSteps, setShownSteps] = useState(0); // lifted up for VisualBoard
  const [elapsed, setElapsed] = useState(0);
  const voiceRef = useRef(null);
  const timers = useRef([]);
  const intervalRef = useRef(null);

  const scene = scenes[current];
  const theme = getTheme(themeId);
  const accent = theme.accentPalette[current % theme.accentPalette.length];
  const pts = scene?.key_points || [];
  const steps = scene?.derivation_steps || [];
  const hasDerivation = !!(scene?.formula || steps.length);

  if (!voiceRef.current) voiceRef.current = createVoice();
  const voice = voiceRef.current;

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    clearInterval(intervalRef.current);
  }, []);

  const stopScene = useCallback(() => { clearAll(); voice.stop(); }, [clearAll]);

  const startScene = useCallback((sc, mutedNow) => {
    if (!sc) return;
    setWordIdx(-1); setShownPts([]); setShownSteps(0); setElapsed(0);
    clearAll();

    // Reveal derivation steps
    const scSteps = sc.derivation_steps || [];
    scSteps.forEach((_, i) => {
      timers.current.push(setTimeout(() => setShownSteps(i + 1), 800 + i * 1900));
    });

    // Reveal key points after steps
    const kpStart = 800 + scSteps.length * 1900 + 600;
    sc.key_points?.forEach((_, i) => {
      timers.current.push(setTimeout(() => setShownPts(p => [...p, i]), kpStart + i * 1800));
    });

    const TOTAL = kpStart + (sc.key_points?.length || 0) * 1800 + 2000;
    intervalRef.current = setInterval(() => setElapsed(e => Math.min(e + 80, TOTAL)), 80);

    if (!mutedNow) {
      const doSpeak = () => voice.speak(sc.narration, {
        rate: speed,
        onWord: (charIdx) => {
          const wds = sc.narration.split(" ");
          let count = 0;
          for (let i = 0; i < wds.length; i++) {
            if (count >= charIdx) { setWordIdx(i); return; }
            count += wds[i].length + 1;
          }
          setWordIdx(wds.length - 1);
        }
      });
      window.speechSynthesis.getVoices().length > 0 ? doSpeak() : (window.speechSynthesis.onvoiceschanged = doSpeak);
    }
  }, [clearAll, voice, speed]);

  useEffect(() => {
    if (!playing) { stopScene(); setWordIdx(-1); return; }
    startScene(scene, muted);
    return stopScene;
  }, [current, playing]);

  useEffect(() => {
    if (!playing) return;
    if (muted) { voice.stop(); setWordIdx(-1); }
    else startScene(scene, false);
  }, [muted]);

  // Restart narration at new speed if currently playing & unmuted
  useEffect(() => {
    if (!playing || muted) return;
    voice.stop();
    const doSpeak = () => voice.speak(scene.narration, {
      rate: speed,
      onWord: (charIdx) => {
        const wds = scene.narration.split(" ");
        let count = 0;
        for (let i = 0; i < wds.length; i++) {
          if (count >= charIdx) { setWordIdx(i); return; }
          count += wds[i].length + 1;
        }
        setWordIdx(wds.length - 1);
      }
    });
    window.speechSynthesis.getVoices().length > 0 ? doSpeak() : (window.speechSynthesis.onvoiceschanged = doSpeak);
  }, [speed]);

  // Show all steps/points when not playing (preview mode)
  useEffect(() => {
    if (!playing) {
      setShownSteps(steps.length);
      setShownPts(pts.map((_, i) => i));
    }
  }, [current, playing]);

  const goTo = (i) => {
    stopScene(); setPlaying(false); setCurrent(i);
    setWordIdx(-1); setShownPts([]); setShownSteps(0); setElapsed(0);
  };

  if (!scenes.length) return null;
  const TOTAL_MS = 800 + steps.length * 1900 + pts.length * 1800 + 3000;
  const prog = Math.min((elapsed / TOTAL_MS) * 100, 100);

  return (
    <div className="rounded-2xl overflow-hidden select-none"
      style={{ background: theme.base, border: `2px solid ${theme.border}`, boxShadow: "0 30px 80px rgba(0,0,0,0.8)" }}>

      {/* VIEWPORT */}
      <div className="relative flex flex-col" style={{ minHeight: "min(58vw,540px)" }}>

        {/* CINEMATIC BG — video + particles + light sweep + vignette */}
        <CinematicBackground videoUrl={scene.video_url} imageUrl={scene.image_url} color={accent} playing={playing} theme={theme} />

        {/* CINEMATIC OVERLAY — documentary labels, marquee bands, lower-thirds */}
        <CinematicOverlay scene={scene} accent={accent} current={current} total={scenes.length} playing={playing} />

        {/* CONTENT */}
        <div className="relative z-10 flex flex-col px-4 pt-12 pb-10 gap-2" style={{ minHeight: "inherit" }}>

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: "rgba(0,0,0,0.72)", border: `2px solid ${accent}88` }}>
              <motion.div className="w-2 h-2 rounded-full" style={{ background: accent }}
                animate={{ opacity: [1,0.3,1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: accent }}>
                Scene {current + 1} / {scenes.length}
              </span>
            </div>
            <span className="text-xl">{scene.icon || "📐"}</span>
          </div>

          {/* Title */}
          <motion.div key={`t-${current}`} initial={{ opacity: 0, x: -24, filter: "blur(8px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-0.5">
              <div className="h-px w-6 rounded" style={{ background: accent }} />
              <span className="text-xs font-bold uppercase tracking-widest opacity-55" style={{ color: accent }}>
                {scene.visual_description?.slice(0, 28) || "Concept"}
              </span>
            </div>
            <h2 className="font-black leading-none" style={{ fontSize: "clamp(16px,3.2vw,28px)", color: "#fff", textShadow: `0 0 28px ${accent}44` }}>
              {scene.title}
            </h2>
          </motion.div>

          {/* MAIN AREA — derivation is the central whiteboard */}
          <AnimatePresence mode="wait">
            <motion.div key={`s-${current}`} initial={{ opacity: 0, filter: "blur(8px)" }} animate={{ opacity: 1, filter: "blur(0px)" }} exit={{ opacity: 0, filter: "blur(8px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col gap-2 min-h-0">

              {hasDerivation ? (
                <>
                  {/* CENTRAL WHITEBOARD — formula + visual + steps, the teaching focus */}
                  <div className="flex-1 flex flex-col gap-2 min-w-0 overflow-hidden rounded-xl p-3"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
                      border: `2px solid ${accent}33`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 30px ${accent}11`,
                    }}>
                    {/* Whiteboard header — teacher chalk label */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }}
                          animate={{ opacity: [1,0.3,1] }} transition={{ repeat: Infinity, duration: 1.2 }} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>✎ Whiteboard · Derivation</span>
                      </div>
                      {scene.formula && (
                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/40">
                          {steps.length} steps
                        </span>
                      )}
                    </div>

                    {/* Pinned formula — the equation being solved */}
                    {scene.formula && (
                      <motion.div className="text-center py-2 px-3 rounded-lg relative overflow-hidden"
                        style={{ background: `${accent}14`, border: `1.5px solid ${accent}55` }}
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 200, damping: 18 }}>
                        <span style={{ color: accent, fontFamily: "monospace", fontWeight: 900, fontSize: "clamp(13px,2.4vw,19px)", textShadow: `0 0 20px ${accent}66` }}>
                          {scene.formula}
                        </span>
                        <motion.div className="absolute inset-0 pointer-events-none"
                          style={{ background: `linear-gradient(90deg, transparent, ${accent}22, transparent)` }}
                          animate={{ x: ["-100%", "200%"] }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} />
                      </motion.div>
                    )}

                    {/* Visual animation (hash table / load factor / generic blackboard) */}
                    <VisualBoard
                      formula={scene.formula}
                      steps={steps}
                      color={accent}
                      currentStep={shownSteps - 1}
                    />

                    {/* Step-by-step written derivation */}
                    <DerivationSteps steps={steps} color={accent} shownCount={shownSteps} />
                  </div>

                  {/* Key points — compact horizontal strip below the board */}
                  {pts.length > 0 && (
                    <div className="shrink-0">
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1 px-1" style={{ color: accent }}>Key Points</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {pts.map((pt, i) => (
                          <KeyCard key={i} text={pt} index={i} color={accent} show={shownPts.includes(i)} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 grid grid-cols-1 gap-2 content-start">
                  {pts.map((pt, i) => (
                    <KeyCard key={i} text={pt} index={i} color={accent} show={shownPts.includes(i)} />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Narration bar */}
          <div className="mt-1 rounded-xl px-3 py-2"
            style={{ background: "rgba(0,0,0,0.78)", border: `1px solid ${accent}33` }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-0.5 w-5 rounded" style={{ background: `linear-gradient(to right, ${accent}, transparent)` }} />
              <ChevronRight className="w-3 h-3" style={{ color: accent }} />
            </div>
            <NarrationBar text={scene.narration} highlightIdx={wordIdx} color={accent} />
          </div>
        </div>

        {playing && !muted && (
          <motion.div className="absolute top-14 right-4 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ border: `2px solid ${accent}`, background: `${accent}22` }}
            animate={{ scale: [1,1.4,1], opacity: [0.8,0.2,0.8] }} transition={{ repeat: Infinity, duration: 1.3 }}>
            <Volume2 className="w-3 h-3" style={{ color: accent }} />
          </motion.div>
        )}
      </div>

      {/* PROGRESS */}
      <div className="h-1 w-full" style={{ background: "#111" }}>
        <motion.div className="h-full rounded-full" style={{ background: accent, width: `${playing ? prog : 0}%` }} transition={{ duration: 0.08 }} />
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#070707", borderTop: "1px solid #1a1a1a" }}>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => setMuted(m => !m)}
          className="p-2 rounded-lg hover:bg-white/5" style={{ color: muted ? "#333" : accent }}>
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => goTo(Math.max(0, current - 1))}
          className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white">
          <SkipBack className="w-4 h-4" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} whileHover={{ scale: 1.08 }}
          onClick={() => setPlaying(p => !p)}
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: accent, color: "#000", boxShadow: `0 0 24px ${accent}66` }}>
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </motion.button>
        <motion.button whileTap={{ scale: 0.85 }} onClick={() => goTo(Math.min(scenes.length - 1, current + 1))}
          className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white">
          <SkipForward className="w-4 h-4" />
        </motion.button>

        {/* Speed control */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <Gauge className="w-3.5 h-3.5 shrink-0" style={{ color: muted ? "#444" : accent }} />
          <div className="w-20 sm:w-24">
            <Slider
              value={[Math.round(speed * 100)]}
              min={40}
              max={140}
              step={5}
              onValueChange={([v]) => setSpeed(v / 100)}
              disabled={muted}
              className="cursor-pointer"
            />
          </div>
          <span className="text-[10px] font-mono font-bold tabular-nums w-7 text-right" style={{ color: muted ? "#444" : accent }}>
            {speed.toFixed(2)}x
          </span>
        </div>

        {/* Theme switcher */}
        <ThemeSwitcher currentThemeId={themeId} onSelect={setThemeId} />

        <div className="flex-1 flex items-center gap-1.5 mx-2 flex-wrap">
          {scenes.map((_, i) => (
            <motion.button key={i} onClick={() => goTo(i)} whileHover={{ scale: 1.3 }}
              className="rounded-full"
              style={{ width: i === current ? 24 : 7, height: 7, background: i <= current ? accent : "#222", boxShadow: i === current ? `0 0 8px ${accent}` : "none", transition: "width 0.3s, background 0.3s" }} />
          ))}
        </div>
        <span className="text-xs font-black" style={{ color: accent }}>
          {String(current + 1).padStart(2,"0")} / {String(scenes.length).padStart(2,"0")}
        </span>
      </div>
    </div>
  );
}