import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Check } from "lucide-react";
import { THEMES } from "./sceneThemes";

export default function ThemeSwitcher({ currentThemeId, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Palette className="w-3.5 h-3.5 shrink-0 text-white/70" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/70 hidden sm:inline">
          Theme
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-2 right-0 z-40 w-56 rounded-xl overflow-hidden"
              style={{ background: "#0c0c10", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 20px 50px rgba(0,0,0,0.7)" }}
            >
              <div className="px-3 py-2 border-b border-white/5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/40">
                  Cinematic Theme
                </span>
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                {THEMES.map((t) => {
                  const active = t.id === currentThemeId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        onSelect(t.id);
                        setOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                    >
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-xs shrink-0"
                        style={{ background: t.base, border: `1.5px solid ${t.accentPalette[0]}` }}
                      >
                        {t.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold text-white truncate">{t.name}</span>
                        <span className="flex gap-1 mt-0.5">
                          {t.accentPalette.slice(0, 4).map((c, i) => (
                            <span key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
                          ))}
                        </span>
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}