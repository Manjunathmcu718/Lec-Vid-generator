import { motion } from "framer-motion";

/**
 * Computes render progress (0-100) from project status + scene video completion.
 * - uploading: 5%
 * - extracting: 15%
 * - generating: 40%
 * - ready: base 60% + 40% scaled by scenes with video_url
 * - error: 100% (error state, not progress)
 */
function computeProgress(project) {
  if (project.status === "error") return { pct: 100, isError: true };
  if (project.status === "uploading") return { pct: 5, label: "Uploading" };
  if (project.status === "extracting") return { pct: 15, label: "Extracting" };
  if (project.status === "generating") return { pct: 40, label: "Generating scenes" };

  if (project.status === "ready") {
    const scenes = project.scenes || [];
    if (!scenes.length) return { pct: 60, label: "Ready" };
    const withVideo = scenes.filter(s => s.video_url).length;
    if (withVideo === 0) return { pct: 60, label: "Awaiting video render" };
    if (withVideo === scenes.length) return { pct: 100, label: "Fully rendered" };
    const pct = 60 + Math.round((withVideo / scenes.length) * 40);
    return { pct, label: `Rendering video · ${withVideo}/${scenes.length}` };
  }

  return { pct: 0, label: project.status };
}

export default function RenderProgress({ project, compact = false }) {
  const { pct, label, isError } = computeProgress(project);
  const color = isError ? "#f87171" : pct >= 100 ? "#4ade80" : pct >= 60 ? "#f0c040" : "#fb923c";
  const isDone = pct >= 100 && !isError;

  if (compact) {
    // Inline version for list rows
    return (
      <div className="flex items-center gap-2 w-28 shrink-0">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <span className="text-[9px] font-mono font-bold tabular-nums w-7 text-right" style={{ color }}>
          {pct}%
        </span>
      </div>
    );
  }

  return (
    <div className="px-4 pb-3 pt-1">
      <div className="flex items-center justify-between mb-1">
        <span className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider" style={{ color }}>
          {!isDone && !isError && (
            <motion.span
              className="w-1 h-1 rounded-full"
              style={{ background: color }}
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          )}
          {label}
        </span>
        <span className="text-[9px] font-mono font-bold tabular-nums" style={{ color }}>
          {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden relative">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        {/* Shimmer when in progress */}
        {!isDone && !isError && pct > 0 && pct < 100 && (
          <motion.div
            className="absolute inset-y-0 w-12 rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }}
            animate={{ x: ["-3rem", "8rem"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        )}
      </div>
    </div>
  );
}