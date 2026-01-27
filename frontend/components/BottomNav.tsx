"use client";

import { useNavbarStore } from "@/lib/store/navbar";
import {
  NavbarClassic,
  NavbarGlass,
  NavbarDarkGlass,
  NavbarDock,
  NavbarBubble,
  NavbarMaterial,
  NavbarNeonGlow,
  NavbarLiquidPill,
  NavbarTelegramNative,
} from "./navbar";

export function BottomNav() {
  const style = useNavbarStore((s) => s.style);

  switch (style) {
    case "glass":
      return <NavbarGlass />;
    case "dark-glass":
      return <NavbarDarkGlass />;
    case "ios-dock":
      return <NavbarDock />;
    case "bubble":
      return <NavbarBubble />;
    case "material":
      return <NavbarMaterial />;
    case "neon-glow":
      return <NavbarNeonGlow />;
    case "liquid-pill":
      return <NavbarLiquidPill />;
    // case "telegram-native":
    //   return <NavbarTelegramNative />; // Disabled - not working
    default:
      return <NavbarDock />; // Default to iOS Dock instead of Classic
  }
}
