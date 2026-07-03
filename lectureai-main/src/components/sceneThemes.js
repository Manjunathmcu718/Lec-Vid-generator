// Cinematic theme presets for the ScenePlayer.
// Each theme drives the accent palette, base background, and overlay styling.

export const THEMES = [
  {
    id: "deep-space",
    name: "Deep Space Math",
    icon: "🪐",
    base: "#05060f",
    border: "#1a1d33",
    accentPalette: ["#60a5fa", "#a78bfa", "#22d3ee", "#818cf8", "#c084fc", "#38bdf8", "#7dd3fc", "#67e8f9"],
    fallbackBg: "radial-gradient(ellipse at 30% 20%, #0e1030, #05060f 70%)",
    particleColor: "#a5b4fc",
  },
  {
    id: "chalkboard",
    name: "Classic Chalkboard",
    icon: "🟩",
    base: "#1a2a1f",
    border: "#2d4a36",
    accentPalette: ["#fefce8", "#fde047", "#a3e635", "#86efac", "#facc15", "#d9f99d", "#fef08a", "#bbf7d0"],
    fallbackBg: "radial-gradient(ellipse at 30% 20%, #23392b, #14201a 70%)",
    particleColor: "#fef9c3",
  },
  {
    id: "solar-flare",
    name: "Solar Flare",
    icon: "🔥",
    base: "#060608",
    border: "#1a1a1a",
    accentPalette: ["#f0c040", "#4ade80", "#60a5fa", "#f87171", "#c084fc", "#fb923c", "#34d399", "#facc15"],
    fallbackBg: "radial-gradient(ellipse at 30% 20%, #0e0e16, #050507 70%)",
    particleColor: "#f0c040",
  },
  {
    id: "neon-grid",
    name: "Neon Grid",
    icon: "🌃",
    base: "#0a0014",
    border: "#2a0a3a",
    accentPalette: ["#f0abfc", "#22d3ee", "#a855f7", "#ec4899", "#8b5cf6", "#d946ef", "#06b6d4", "#e879f9"],
    fallbackBg: "radial-gradient(ellipse at 30% 20%, #1a0a2e, #0a0014 70%)",
    particleColor: "#e879f9",
  },
  {
    id: "parchment",
    name: "Parchment",
    icon: "📜",
    base: "#2b2317",
    border: "#4a3d28",
    accentPalette: ["#fbbf24", "#fde68a", "#d4a373", "#e9c46a", "#f5cb5c", "#e76f51", "#b08968", "#dda15e"],
    fallbackBg: "radial-gradient(ellipse at 30% 20%, #3a3020, #2b2317 70%)",
    particleColor: "#fde68a",
  },
];

export const DEFAULT_THEME_ID = "solar-flare";

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME_ID);
}