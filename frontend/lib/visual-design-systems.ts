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
    card: string;
    cardForeground: string;
    primary: string;
    primaryForeground: string;
    accent: string;
    accentForeground: string;
    secondary?: string;
    tertiary?: string;
    muted: string;
    mutedForeground: string;
    border: string;
    input?: string;
    ring?: string;
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
      card: "#ffffff",
      cardForeground: "#000000",
      primary: "#000000",
      primaryForeground: "#ffffff",
      accent: "#ff0000", // Medical red
      accentForeground: "#ffffff",
      muted: "#f5f5f5",
      mutedForeground: "#666666",
      border: "#000000",
      input: "#ffffff",
      ring: "#000000",
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
      card: "#fdfcfa",
      cardForeground: "#3d3226",
      primary: "#b8a58e", // Matte gold
      primaryForeground: "#ffffff",
      accent: "#e8d4bb",
      accentForeground: "#3d3226",
      muted: "#ebe7e0",
      mutedForeground: "#7a6f5d",
      border: "#d4cec0",
      input: "#fdfcfa",
      ring: "#b8a58e",
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
      card: "#12121a", // Dark card background
      cardForeground: "#00ff88",
      primary: "#ff007f", // Bright pink
      primaryForeground: "#0a0a0f",
      accent: "#00f0ff", // Cyan
      accentForeground: "#0a0a0f",
      secondary: "#9d00ff", // Purple
      muted: "#1a1a2e",
      mutedForeground: "#00ff8880",
      border: "#00ff88",
      input: "#12121a",
      ring: "#00f0ff",
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
      card: "#ffffff",
      cardForeground: "#1a1a1a",
      primary: "#4a5568", // Blue-gray matte
      primaryForeground: "#ffffff",
      accent: "#d4a574", // Natural wood tone
      accentForeground: "#1a1a1a",
      muted: "#f0f0f0",
      mutedForeground: "#737373",
      border: "#e5e5e5",
      input: "#ffffff",
      ring: "#4a5568",
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
      card: "#ffffff",
      cardForeground: "#2d2d2d",
      primary: "#ff6b9d", // Bright pink
      primaryForeground: "#ffffff",
      accent: "#00d9ff", // Cyan
      accentForeground: "#2d2d2d",
      secondary: "#ffbd00", // Yellow
      tertiary: "#c724b1", // Violet
      muted: "#ffe8d6",
      mutedForeground: "#666666",
      border: "#2d2d2d",
      input: "#ffffff",
      ring: "#ff6b9d",
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
      card: "#e0e5ec",
      cardForeground: "#2d3748",
      primary: "#6366f1",
      primaryForeground: "#ffffff",
      accent: "#8b5cf6",
      accentForeground: "#ffffff",
      muted: "#d1d9e6",
      mutedForeground: "#4a5568",
      border: "#c8d0df",
      input: "#e0e5ec",
      ring: "#6366f1",
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

  // 7. VAPORWAVE AESTHETIC
  "vaporwave-aesthetic": {
    id: "vaporwave-aesthetic",
    name: "Vaporwave",
    description: "Rêve numérique des années 90, gradients néon",
    colors: {
      background: "#1a0033", // Deep purple
      foreground: "#ff71ce", // Hot pink
      card: "#2d1b4e", // Dark purple card
      cardForeground: "#ff71ce",
      primary: "#01cdfe", // Electric cyan
      primaryForeground: "#1a0033",
      accent: "#b967ff", // Neon purple
      accentForeground: "#ffffff",
      secondary: "#05ffa1", // Mint
      muted: "#3d2563",
      mutedForeground: "#b19cd9",
      border: "#b967ff",
      input: "#2d1b4e",
      ring: "#01cdfe",
      success: "#05ffa1",
      warning: "#fffb96",
      error: "#ff6b9d",
    },
    layout: {
      grid: "card-grid",
      spacing: "comfortable",
      alignment: "center",
    },
    typography: {
      headingClass: "font-display font-bold text-2xl tracking-wide",
      bodyClass: "font-sans text-base leading-relaxed",
      fontFamily: "'Courier New', monospace",
      effects: "text-shadow-neon",
    },
    borders: {
      width: "2px",
      radius: "0.75rem",
      style: "solid",
      glow: "0 0 15px currentColor",
    },
    shadows: "neon-glow",
    animations: "slow-ease",
  },

  // 8. INDUSTRIAL CONCRETE
  "industrial-concrete": {
    id: "industrial-concrete",
    name: "Industrial Concrete",
    description: "Brut industriel, béton exposé, minimal",
    colors: {
      background: "#d4d4d4", // Light concrete
      foreground: "#1c1c1c", // Near black
      card: "#e8e8e8",
      cardForeground: "#1c1c1c",
      primary: "#3a3a3a", // Dark gray
      primaryForeground: "#ffffff",
      accent: "#c85a54", // Rust red
      accentForeground: "#ffffff",
      muted: "#bfbfbf",
      mutedForeground: "#5a5a5a",
      border: "#8a8a8a",
      input: "#e8e8e8",
      ring: "#3a3a3a",
      success: "#4a7c59",
      warning: "#c89b3c",
      error: "#c85a54",
    },
    layout: {
      grid: "strict-grid",
      spacing: "balanced",
      alignment: "left",
    },
    typography: {
      headingClass: "font-sans font-black text-xl uppercase tracking-wider",
      bodyClass: "font-mono text-sm leading-relaxed",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      effects: "none",
    },
    borders: {
      width: "4px",
      radius: "0.125rem",
      style: "solid",
    },
    shadows: "hard-offset",
    animations: "subtle",
  },

  // 9. NEON TOKYO
  "neon-tokyo": {
    id: "neon-tokyo",
    name: "Neon Tokyo",
    description: "Enseigne japonaise, rues nocturnes, néons vifs",
    colors: {
      background: "#0d0d0d", // Near black
      foreground: "#ffffff",
      card: "#1a1a1a",
      cardForeground: "#ffffff",
      primary: "#ff2a6d", // Hot pink neon
      primaryForeground: "#0d0d0d",
      accent: "#00fff5", // Cyan neon
      accentForeground: "#0d0d0d",
      secondary: "#d1f300", // Yellow neon
      tertiary: "#9d4edd", // Purple neon
      muted: "#2d2d2d",
      mutedForeground: "#a0a0a0",
      border: "#ff2a6d",
      input: "#1a1a1a",
      ring: "#00fff5",
      success: "#00ff9f",
      warning: "#ffbd00",
      error: "#ff006e",
    },
    layout: {
      grid: "asymmetric-collage",
      spacing: "compact",
      alignment: "left",
    },
    typography: {
      headingClass: "font-display font-extrabold text-2xl tracking-tight",
      bodyClass: "font-sans text-sm leading-snug",
      fontFamily: "'Impact', 'Arial Black', sans-serif",
      effects: "text-shadow-neon",
    },
    borders: {
      width: "3px",
      radius: "0.5rem",
      style: "solid",
      glow: "0 0 20px currentColor",
    },
    shadows: "neon-glow",
    animations: "glitch",
  },

  // 10. ORGANIC NATURE
  "organic-nature": {
    id: "organic-nature",
    name: "Organic Nature",
    description: "Tons terre, botanique, design durable",
    colors: {
      background: "#f5f0e8", // Warm beige
      foreground: "#2d3319", // Deep forest green
      card: "#faf7f2",
      cardForeground: "#2d3319",
      primary: "#5f7a3d", // Sage green
      primaryForeground: "#ffffff",
      accent: "#c17c4a", // Terracotta
      accentForeground: "#ffffff",
      secondary: "#8b7355", // Clay brown
      muted: "#ebe5da",
      mutedForeground: "#6b7558",
      border: "#c8bcaa",
      input: "#faf7f2",
      ring: "#5f7a3d",
      success: "#5f7a3d",
      warning: "#d4a373",
      error: "#a84432",
    },
    layout: {
      grid: "loose-masonry",
      spacing: "generous",
      alignment: "left",
    },
    typography: {
      headingClass: "font-serif font-normal text-2xl tracking-normal",
      bodyClass: "font-sans text-base leading-loose",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      effects: "none",
    },
    borders: {
      width: "1px",
      radius: "1.25rem",
      style: "solid",
    },
    shadows: "soft-ambient",
    animations: "slow-ease",
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
