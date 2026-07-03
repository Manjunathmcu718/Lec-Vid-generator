import { motion } from "framer-motion";
import { useMemo } from "react";

/**
 * Cinematic background: full-bleed AI video as the hero layer, with
 * After Effects–style motion-graphics overlays — kinetic geometry,
 * data scan lines, orbital rings, and light sweeps layered on top.
 */
export default function CinematicBackground({ videoUrl, imageUrl, color, playing, theme }) {
  const isPlayableVideo = typeof videoUrl === 'string' && videoUrl && !videoUrl.startsWith('data:image/');
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 6 + 5,
        delay: Math.random() * 4,
      })),
    []
  );

  const rings = useMemo(
    () =>
      Array.from({ length: 3 }, (_, i) => ({
        size: 120 + i * 90,
        duration: 8 + i * 4,
        delay: i * 1.2,
      })),
    []
  );

  const lines = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        y: 15 + i * 14,
        duration: 3 + i * 0.4,
        delay: i * 0.3,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* ── HERO VIDEO LAYER — full bleed, prominent ── */}
      {isPlayableVideo ? (
        <motion.video
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      ) : (videoUrl || imageUrl) ? (
        <motion.img
          src={videoUrl || imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.25 }}
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 20, ease: "easeInOut" }}
        />
      ) : (
        <div className="absolute inset-0" style={{ background: theme?.fallbackBg || "radial-gradient(ellipse at 30% 20%, #0e0e16, #050507 70%)" }} />
      )}

      {/* ── LEGIBILITY GRADIENT — subtle, only darkens edges for text ── */}
      <div
        className="absolute inset-0"
        style={{
          background: videoUrl
            ? "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.15) 70%, rgba(0,0,0,0.75) 100%)"
            : `linear-gradient(155deg, ${theme?.base}e0 0%, ${theme?.base}eb 50%, ${theme?.base}f0 100%)`,
        }}
      />

      {/* ── AE-STYLE: ORBITAL RINGS (rotating geometric overlays) ── */}
      <div className="absolute inset-0 pointer-events-none">
        {rings.map((r, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute rounded-full border"
            style={{
              width: r.size,
              height: r.size,
              left: "85%",
              top: "15%",
              marginLeft: -r.size / 2,
              marginTop: -r.size / 2,
              borderColor: `${color}30`,
              borderTopColor: `${color}90`,
              borderRightColor: `${color}55`,
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: r.duration, ease: "linear", delay: r.delay }}
          />
        ))}
      </div>

      {/* ── AE-STYLE: HORIZONTAL DATA SCAN LINES ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {lines.map((l, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute h-px"
            style={{
              top: `${l.y}%`,
              left: 0,
              right: 0,
              background: `linear-gradient(to right, transparent, ${color}50, transparent)`,
            }}
            animate={{ x: ["-100%", "100%"], opacity: [0, 0.6, 0] }}
            transition={{ repeat: Infinity, duration: l.duration, delay: l.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* ── AE-STYLE: FLOATING GEOMETRIC SHAPES ── */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { x: 8, y: 65, size: 60, shape: "square", dur: 12 },
          { x: 78, y: 70, size: 40, shape: "triangle", dur: 10 },
          { x: 15, y: 25, size: 35, shape: "circle", dur: 14 },
        ].map((s, i) => (
          <motion.div
            key={`shape-${i}`}
            className="absolute"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size }}
            animate={{ y: [0, -25, 0], rotate: [0, 180, 360], opacity: [0.12, 0.28, 0.12] }}
            transition={{ repeat: Infinity, duration: s.dur, ease: "easeInOut", delay: i }}
          >
            {s.shape === "circle" && (
              <div className="w-full h-full rounded-full border-2" style={{ borderColor: `${color}60` }} />
            )}
            {s.shape === "square" && (
              <div className="w-full h-full border-2" style={{ borderColor: `${color}60`, transform: "rotate(15deg)" }} />
            )}
            {s.shape === "triangle" && (
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: `${s.size / 2}px solid transparent`,
                  borderRight: `${s.size / 2}px solid transparent`,
                  borderBottom: `${s.size}px solid ${color}40`,
                }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* ── AE-STYLE: FLOATING PARTICLES (depth bokeh) ── */}
      {particles.map((p, i) => (
        <motion.div
          key={`p-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: theme?.particleColor || color,
            boxShadow: `0 0 ${p.size * 5}px ${theme?.particleColor || color}`,
          }}
          animate={{ y: [0, -50, 0], opacity: [0, 0.7, 0], scale: [0.5, 1.2, 0.5] }}
          transition={{ repeat: Infinity, duration: p.duration, delay: p.delay, ease: "easeInOut" }}
        />
      ))}

      {/* ── AE-STYLE: DIAGONAL LIGHT SWEEP (lens flare) ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(105deg, transparent 35%, ${color}25 48%, #ffffff15 50%, ${color}25 52%, transparent 65%)`,
        }}
        animate={{ x: ["-120%", "220%"] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
      />

      {/* ── AE-STYLE: KINETIC GRID PULSE ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
          backgroundSize: "50px 50px",
        }}
        animate={{ opacity: [0.02, 0.06, 0.02] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      />

      {/* ── VIGNETTE — subtle when video is present ── */}
      <div
        className="absolute inset-0"
        style={{
          background: videoUrl
            ? "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)"
            : "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </div>
  );
}