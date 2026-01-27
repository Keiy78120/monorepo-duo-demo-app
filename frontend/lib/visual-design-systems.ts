/**
 * Visual Design Systems (VDS)
 *
 * Revolutionary design systems that go beyond color changes.
 * Each VDS defines a complete visual identity with:
 * - Color palette
 * - Layout philosophy
 * - Typography scale
 * - Component density
 * - Animation language
 *
 * NOTE: These are NEW themes that extend the existing theme system.
 * Old themes remain available for backward compatibility.
 */

export interface VisualDesignSystem {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    accent: string;
    secondary?: string;
    tertiary?: string;
    muted: string;
    mutedForeground: string;
    border: string;
    success?: string;
    warning?: string;
    error?: string;
  };
  layout: {
    grid: "strict-grid" | "loose-masonry" | "data-table" | "swiss-grid" | "asymmetric-collage" | "card-grid";
    spacing: "dense" | "compact" | "balanced" | "comfortable" | "generous" | "chaotic";
    alignment: "left" | "center" | "mixed";
  };
  typography: {
    headingClass: string;
    bodyClass: string;
    fontFamily: string;
    effects?: "text-shadow-neon" | "text-outline" | "none";
  };
  borders: {
    width: string;
    radius: string;
    style?: "solid" | "dashed" | "squiggle";
    glow?: string;
  };
  shadows: "none" | "soft-ambient" | "neon-glow" | "hard-offset" | "neumorphic";
  animations: "instant" | "subtle" | "slow-ease" | "glitch" | "bouncy" | "spring";
}

export const visualDesignSystems: Record<string, VisualDesignSystem> = {
  // 1. BRUTALIST PHARMACY
  "brutalist-pharmacy": {
    id: "brutalist-pharmacy",
    name: "Brutalist Pharmacy",
    description: "Design suisse brut, utilitaire, high-contrast",
    colors: {
      background: "#ffffff",
      foreground: "#000000",
      primary: "#000000",
      accent: "#ff0000", // Medical red
      muted: "#f5f5f5",
      mutedForeground: "#666666",
      border: "#000000",
      error: "#ff0000",
    },
    layout: {
      grid: "strict-grid",
      spacing: "dense", // 0.75rem base
      alignment: "left",
    },
    typography: {
      headingClass: "font-mono uppercase tracking-widest font-medium text-sm",
      bodyClass: "font-mono text-xs leading-relaxed",
      fontFamily: "ui-monospace, 'Courier New', monospace",
      effects: "none",
    },
    borders: {
      width: "3px",
      radius: "0", // Zero rounding
      style: "solid",
    },
    shadows: "none",
    animations: "instant", // No transitions
  },

  // 2. LUXURY SPA
  "luxury-spa": {
    id: "luxury-spa",
    name: "Luxury Spa",
    description: "Sérénité, espace généreux, minimalisme chaud",
    colors: {
      background: "#f8f6f3", // Warm cream
      foreground: "#3d3226", // Rich brown
      primary: "#b8a58e", // Matte gold
      accent: "#e8d4bb",
      muted: "#ebe7e0",
      mutedForeground: "#7a6f5d",
      border: "#d4cec0",
    },
    layout: {
      grid: "loose-masonry",
      spacing: "generous", // 2rem base
      alignment: "center",
    },
    typography: {
      headingClass: "font-serif font-light text-3xl tracking-tight",
      bodyClass: "font-sans text-base leading-relaxed",
      fontFamily: "'Cormorant Garamond', 'Georgia', serif",
      effects: "none",
    },
    borders: {
      width: "0.5px",
      radius: "2rem", // Super rounded
      style: "solid",
    },
    shadows: "soft-ambient",
    animations: "slow-ease", // 600ms transitions
  },

  // 3. CYBERPUNK TERMINAL
  "cyberpunk-terminal": {
    id: "cyberpunk-terminal",
    name: "Cyberpunk Terminal",
    description: "Grilles néon, esthétique hacker",
    colors: {
      background: "#0a0a0f",
      foreground: "#00ff88", // Matrix green
      primary: "#ff007f", // Bright pink
      accent: "#00f0ff", // Cyan
      secondary: "#9d00ff", // Purple
      muted: "#1a1a2e",
      mutedForeground: "#00ff8880",
      border: "#00ff88",
      success: "#00ff88",
      warning: "#ffaa00",
      error: "#ff0055",
    },
    layout: {
      grid: "data-table",
      spacing: "compact", // 0.5rem base
      alignment: "left",
    },
    typography: {
      headingClass: "font-mono uppercase text-sm tracking-wide font-semibold",
      bodyClass: "font-mono text-xs leading-snug",
      fontFamily: "'Fira Code', 'Courier New', monospace",
      effects: "text-shadow-neon",
    },
    borders: {
      width: "1px",
      radius: "0.25rem",
      style: "dashed",
      glow: "0 0 10px currentColor",
    },
    shadows: "neon-glow",
    animations: "glitch", // Scan-line effects
  },

  // 4. SCANDINAVIAN MINIMAL
  "scandinavian-minimal": {
    id: "scandinavian-minimal",
    name: "Scandinavian Minimal",
    description: "Hygge, lumière naturelle, beauté fonctionnelle",
    colors: {
      background: "#fafafa",
      foreground: "#1a1a1a",
      primary: "#4a5568", // Blue-gray matte
      accent: "#d4a574", // Natural wood tone
      muted: "#f0f0f0",
      mutedForeground: "#737373",
      border: "#e5e5e5",
    },
    layout: {
      grid: "swiss-grid",
      spacing: "balanced", // 1.25rem base
      alignment: "left",
    },
    typography: {
      headingClass: "font-sans font-medium text-2xl tracking-tight",
      bodyClass: "font-sans text-base leading-relaxed",
      fontFamily: "'Inter', -apple-system, sans-serif",
      effects: "none",
    },
    borders: {
      width: "1px",
      radius: "0.5rem",
      style: "solid",
    },
    shadows: "none", // Flat design
    animations: "subtle",
  },

  // 5. MEMPHIS RETRO
  "memphis-retro": {
    id: "memphis-retro",
    name: "Memphis Retro",
    description: "Années 80/90, formes audacieuses, chaos ludique",
    colors: {
      background: "#fff5e1",
      foreground: "#2d2d2d",
      primary: "#ff6b9d", // Bright pink
      accent: "#00d9ff", // Cyan
      secondary: "#ffbd00", // Yellow
      tertiary: "#c724b1", // Violet
      muted: "#ffe8d6",
      mutedForeground: "#666666",
      border: "#2d2d2d",
      success: "#00d9a3",
      warning: "#ffbd00",
      error: "#ff3366",
    },
    layout: {
      grid: "asymmetric-collage",
      spacing: "chaotic", // Variable spacing
      alignment: "mixed",
    },
    typography: {
      headingClass: "font-display font-black text-3xl tracking-tight",
      bodyClass: "font-sans font-medium text-base",
      fontFamily: "'Cooper Black', 'Arial Black', sans-serif",
      effects: "text-outline",
    },
    borders: {
      width: "4px",
      radius: "1rem",
      style: "squiggle",
    },
    shadows: "hard-offset", // Drop shadows
    animations: "bouncy", // Spring physics
  },

  // 6. NEOMORPHISM
  "neomorphism": {
    id: "neomorphism",
    name: "Neomorphism",
    description: "Soft UI, surfaces extrudées, profondeur tactile",
    colors: {
      background: "#e0e5ec",
      foreground: "#2d3748",
      primary: "#6366f1",
      accent: "#8b5cf6",
      muted: "#d1d9e6",
      mutedForeground: "#4a5568",
      border: "#c8d0df",
    },
    layout: {
      grid: "card-grid",
      spacing: "comfortable", // 1.5rem
      alignment: "center",
    },
    typography: {
      headingClass: "font-sans font-semibold text-2xl tracking-tight",
      bodyClass: "font-sans text-base leading-relaxed",
      fontFamily: "'Inter', -apple-system, sans-serif",
      effects: "none",
    },
    borders: {
      width: "0",
      radius: "1.5rem",
      style: "solid",
    },
    shadows: "neumorphic", // Double light/dark shadows
    animations: "spring",
  },
};

/**
 * Get VDS by ID with fallback
 */
export function getVisualDesignSystem(id: string): VisualDesignSystem | null {
  return visualDesignSystems[id] || null;
}

/**
 * Get all VDS IDs
 */
export function getAllVDSIds(): string[] {
  return Object.keys(visualDesignSystems);
}

/**
 * Check if ID is a VDS theme
 */
export function isVDSTheme(themeId: string): boolean {
  return themeId in visualDesignSystems;
}
