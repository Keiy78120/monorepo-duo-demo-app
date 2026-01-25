"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/store/theme";
import { useFontStore } from "@/lib/store/font";
import { useUIStyleStore } from "@/lib/store/ui-style";
import { themes, defaultThemeId } from "@/lib/themes";
import { fonts, defaultFontId } from "@/lib/fonts";
import { uiStyles, defaultUIStyleId } from "@/lib/ui-styles";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const font = useFontStore((s) => s.font);
  const uiStyle = useUIStyleStore((s) => s.uiStyle);

  // Apply color theme
  useEffect(() => {
    const def = themes[theme] || themes[defaultThemeId];
    if (!def) return;

    const root = document.documentElement;
    root.setAttribute("data-theme", def.id);

    // Apply CSS variables
    root.style.setProperty("--color-background", def.colors.background);
    root.style.setProperty("--color-foreground", def.colors.foreground);
    root.style.setProperty("--color-muted", def.colors.muted);
    root.style.setProperty("--color-muted-foreground", def.colors.mutedForeground);
    root.style.setProperty("--color-card", def.colors.card);
    root.style.setProperty("--color-card-foreground", def.colors.cardForeground);
    root.style.setProperty("--color-popover", def.colors.popover);
    root.style.setProperty("--color-popover-foreground", def.colors.popoverForeground);
    root.style.setProperty("--color-border", def.colors.border);
    root.style.setProperty("--color-input", def.colors.input);
    root.style.setProperty("--color-primary", def.colors.primary);
    root.style.setProperty("--color-primary-foreground", def.colors.primaryForeground);
    root.style.setProperty("--color-secondary", def.colors.secondary);
    root.style.setProperty("--color-secondary-foreground", def.colors.secondaryForeground);
    root.style.setProperty("--color-accent", def.colors.accent);
    root.style.setProperty("--color-accent-foreground", def.colors.accentForeground);
    root.style.setProperty("--color-destructive", def.colors.destructive);
    root.style.setProperty("--color-destructive-foreground", def.colors.destructiveForeground);
    root.style.setProperty("--color-ring", def.colors.ring);
    root.style.setProperty("--color-success", def.colors.success);
    root.style.setProperty("--color-warning", def.colors.warning);
    root.style.setProperty("--color-success-foreground", def.colors.successForeground);
    root.style.setProperty("--color-warning-foreground", def.colors.warningForeground);

    // Sync Telegram WebApp header color
    if (typeof window !== "undefined" && window.Telegram?.WebApp) {
      try {
        window.Telegram.WebApp.setHeaderColor(def.headerColor);
        window.Telegram.WebApp.setBackgroundColor(def.headerColor);
      } catch {
        // Ignore if not supported
      }
    }
  }, [theme]);

  // Apply font
  useEffect(() => {
    const fontDef = fonts[font] || fonts[defaultFontId];
    if (!fontDef) return;

    const body = document.body;

    // Remove all font classes
    body.classList.remove("font-inter", "font-manrope", "font-plus-jakarta", "font-dm-sans", "font-space-grotesk");

    // Add selected font class
    body.classList.add(fontDef.variable);
  }, [font]);

  // Apply UI style
  useEffect(() => {
    const styleDef = uiStyles[uiStyle] || uiStyles[defaultUIStyleId];
    if (!styleDef) return;

    const root = document.documentElement;
    root.setAttribute("data-ui-style", styleDef.id);

    // Apply radius variables
    root.style.setProperty("--radius-sm", styleDef.radiusSm);
    root.style.setProperty("--radius-md", styleDef.radiusMd);
    root.style.setProperty("--radius-lg", styleDef.radiusLg);
    root.style.setProperty("--radius-xl", styleDef.radiusXl);
    root.style.setProperty("--radius-2xl", styleDef.radius2xl);
    root.style.setProperty("--radius-full", styleDef.radiusFull);

    // Apply shadow variables
    root.style.setProperty("--shadow-card", styleDef.shadowCard);
    root.style.setProperty("--shadow-elevated", styleDef.shadowElevated);
    root.style.setProperty("--shadow-soft", styleDef.shadowSoft);

    // Apply spacing variables
    root.style.setProperty("--spacing-card", styleDef.spacingCard);
    root.style.setProperty("--spacing-section", styleDef.spacingSection);

    // Apply border width
    root.style.setProperty("--border-width", styleDef.borderWidth);
  }, [uiStyle]);

  return <>{children}</>;
}
