export interface FontDefinition {
  id: string;
  name: string;
  description: string;
  variable: string;
}

export const fonts: Record<string, FontDefinition> = {
  inter: {
    id: "inter",
    name: "Inter",
    description: "Clean & moderne",
    variable: "font-inter",
  },
  manrope: {
    id: "manrope",
    name: "Manrope",
    description: "Géométrique",
    variable: "font-manrope",
  },
  "plus-jakarta": {
    id: "plus-jakarta",
    name: "Plus Jakarta",
    description: "Friendly & rond",
    variable: "font-plus-jakarta",
  },
  "dm-sans": {
    id: "dm-sans",
    name: "DM Sans",
    description: "Minimal & léger",
    variable: "font-dm-sans",
  },
  "space-grotesk": {
    id: "space-grotesk",
    name: "Space Grotesk",
    description: "Tech & unique",
    variable: "font-space-grotesk",
  },
};

export const fontIds = Object.keys(fonts) as string[];
export const defaultFontId = "inter";
