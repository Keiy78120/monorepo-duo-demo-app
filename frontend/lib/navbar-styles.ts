export interface NavbarStyleDefinition {
  id: string;
  name: string;
  description: string;
}

export const navbarStyles: Record<string, NavbarStyleDefinition> = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "Barre standard",
  },
  glass: {
    id: "glass",
    name: "Glass",
    description: "Glassmorphism transparent",
  },
  "dark-glass": {
    id: "dark-glass",
    name: "Dark Glass",
    description: "Verre sombre",
  },
  "ios-dock": {
    id: "ios-dock",
    name: "Dock",
    description: "Style macOS",
  },
  bubble: {
    id: "bubble",
    name: "Bubble",
    description: "Bulles flottantes",
  },
  material: {
    id: "material",
    name: "Material",
    description: "Material Design 3",
  },
  "neon-glow": {
    id: "neon-glow",
    name: "Neon",
    description: "Lueur néon",
  },
  "liquid-pill": {
    id: "liquid-pill",
    name: "Liquid",
    description: "Pilule liquide",
  },
  "telegram-native": {
    id: "telegram-native",
    name: "Telegram",
    description: "iOS Liquid Glass",
  },
};

export const navbarStyleIds = Object.keys(navbarStyles) as string[];
export const defaultNavbarStyleId = "ios-dock";
