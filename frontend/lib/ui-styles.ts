export interface UIStyleDefinition {
  id: string;
  name: string;
  description: string;
  // Border radius
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  radius2xl: string;
  radiusFull: string;
  // Shadows
  shadowCard: string;
  shadowElevated: string;
  shadowSoft: string;
  // Spacing
  spacingCard: string;
  spacingSection: string;
  // Border width
  borderWidth: string;
}

export const uiStyles: Record<string, UIStyleDefinition> = {
  // Rounded - Very soft, modern, Apple-like
  rounded: {
    id: "rounded",
    name: "Rounded",
    description: "Arrondi & doux",
    radiusSm: "0.5rem",      // 8px
    radiusMd: "0.75rem",     // 12px
    radiusLg: "1rem",        // 16px
    radiusXl: "1.25rem",     // 20px
    radius2xl: "1.5rem",     // 24px
    radiusFull: "9999px",
    shadowCard: "0 4px 20px rgba(0, 0, 0, 0.08)",
    shadowElevated: "0 8px 30px rgba(0, 0, 0, 0.12)",
    shadowSoft: "0 2px 12px rgba(0, 0, 0, 0.06)",
    spacingCard: "1.25rem",  // 20px
    spacingSection: "1.5rem", // 24px
    borderWidth: "1px",
  },

  // Sharp - Angular, modern, minimal
  sharp: {
    id: "sharp",
    name: "Sharp",
    description: "Angulaire & net",
    radiusSm: "0.25rem",     // 4px
    radiusMd: "0.375rem",    // 6px
    radiusLg: "0.5rem",      // 8px
    radiusXl: "0.625rem",    // 10px
    radius2xl: "0.75rem",    // 12px
    radiusFull: "9999px",
    shadowCard: "0 1px 3px rgba(0, 0, 0, 0.1)",
    shadowElevated: "0 4px 12px rgba(0, 0, 0, 0.15)",
    shadowSoft: "0 1px 2px rgba(0, 0, 0, 0.05)",
    spacingCard: "1rem",     // 16px
    spacingSection: "1.25rem", // 20px
    borderWidth: "1px",
  },

  // Minimal - Clean, borderless feel
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Épuré & subtil",
    radiusSm: "0.375rem",    // 6px
    radiusMd: "0.5rem",      // 8px
    radiusLg: "0.75rem",     // 12px
    radiusXl: "1rem",        // 16px
    radius2xl: "1.25rem",    // 20px
    radiusFull: "9999px",
    shadowCard: "none",
    shadowElevated: "0 2px 8px rgba(0, 0, 0, 0.08)",
    shadowSoft: "none",
    spacingCard: "1rem",     // 16px
    spacingSection: "1.25rem", // 20px
    borderWidth: "1px",
  },

  // Brutalist - No radius, strong borders
  brutalist: {
    id: "brutalist",
    name: "Brutalist",
    description: "Carré & brut",
    radiusSm: "0",
    radiusMd: "0",
    radiusLg: "0",
    radiusXl: "0",
    radius2xl: "0",
    radiusFull: "0",
    shadowCard: "4px 4px 0 currentColor",
    shadowElevated: "6px 6px 0 currentColor",
    shadowSoft: "2px 2px 0 currentColor",
    spacingCard: "1rem",
    spacingSection: "1.5rem",
    borderWidth: "2px",
  },

  // Pill - Extra rounded, playful
  pill: {
    id: "pill",
    name: "Pill",
    description: "Très arrondi",
    radiusSm: "1rem",        // 16px
    radiusMd: "1.25rem",     // 20px
    radiusLg: "1.5rem",      // 24px
    radiusXl: "2rem",        // 32px
    radius2xl: "2.5rem",     // 40px
    radiusFull: "9999px",
    shadowCard: "0 6px 24px rgba(0, 0, 0, 0.1)",
    shadowElevated: "0 12px 40px rgba(0, 0, 0, 0.15)",
    shadowSoft: "0 4px 16px rgba(0, 0, 0, 0.06)",
    spacingCard: "1.5rem",   // 24px
    spacingSection: "2rem",  // 32px
    borderWidth: "1px",
  },
};

export const uiStyleIds = Object.keys(uiStyles) as string[];
export const defaultUIStyleId = "rounded";
