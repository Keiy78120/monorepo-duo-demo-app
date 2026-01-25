export interface DisplayModeDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  gridCols: string;
  gap: string;
  cardSize: "small" | "standard" | "large" | "horizontal" | "mixed";
}

export const displayModes: Record<string, DisplayModeDefinition> = {
  grid: {
    id: "grid",
    name: "Grid",
    icon: "▦",
    description: "Vue classique",
    gridCols: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    gap: "gap-3 sm:gap-4 md:gap-5 lg:gap-6",
    cardSize: "standard",
  },
  compact: {
    id: "compact",
    name: "Compact",
    icon: "▤",
    description: "Plus de produits",
    gridCols: "grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
    gap: "gap-2 sm:gap-3",
    cardSize: "small",
  },
  list: {
    id: "list",
    name: "Liste",
    icon: "☰",
    description: "Vue détaillée",
    gridCols: "grid-cols-1",
    gap: "gap-3 sm:gap-4",
    cardSize: "horizontal",
  },
  bento: {
    id: "bento",
    name: "Bento",
    icon: "⊞",
    description: "Grid asymétrique",
    gridCols: "grid-cols-4",
    gap: "gap-3 sm:gap-4",
    cardSize: "mixed",
  },
  featured: {
    id: "featured",
    name: "Featured",
    icon: "◐",
    description: "Grandes images",
    gridCols: "grid-cols-1 md:grid-cols-2",
    gap: "gap-4 sm:gap-6",
    cardSize: "large",
  },
};

export const displayModeIds = Object.keys(displayModes) as string[];
export const defaultDisplayModeId = "grid";

// Bento grid pattern - which items get special sizing
export function getBentoSpan(index: number): { colSpan: number; rowSpan: number } {
  const pattern = index % 5;
  switch (pattern) {
    case 0:
      return { colSpan: 2, rowSpan: 2 }; // Large featured
    case 1:
      return { colSpan: 2, rowSpan: 1 }; // Wide
    default:
      return { colSpan: 1, rowSpan: 1 }; // Standard
  }
}
