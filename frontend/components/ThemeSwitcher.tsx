"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Palette, Type, Layers, LayoutGrid, Navigation } from "lucide-react";
import { useThemeStore } from "@/lib/store/theme";
import { useNavbarStore } from "@/lib/store/navbar";
import { useFontStore } from "@/lib/store/font";
import { useUIStyleStore } from "@/lib/store/ui-style";
import { useDisplayModeStore } from "@/lib/store/display-mode";
import { themes, themeIds } from "@/lib/themes";
import { navbarStyles, navbarStyleIds } from "@/lib/navbar-styles";
import { fonts, fontIds } from "@/lib/fonts";
import { uiStyles, uiStyleIds } from "@/lib/ui-styles";
import { displayModes, displayModeIds } from "@/lib/display-modes";
import { useHapticFeedback } from "@/lib/store/telegram";
import { cn } from "@/lib/utils";

// Theme Preview Card Component
function ThemePreviewCard({
  theme,
  isActive,
  onClick,
}: {
  theme: (typeof themes)[string];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-2 rounded-xl border-2 transition-all duration-200",
        isActive
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
          : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]/30"
      )}
    >
      {/* Mini preview with theme colors */}
      <div
        className="h-10 rounded-lg mb-1.5 flex overflow-hidden border border-black/10"
        style={{ background: theme.colors.background }}
      >
        <div
          className="w-1/3 h-full"
          style={{ background: theme.colors.primary }}
        />
        <div
          className="w-1/3 h-full"
          style={{ background: theme.colors.accent }}
        />
        <div
          className="w-1/3 h-full flex items-center justify-center"
          style={{ background: theme.colors.card }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: theme.colors.muted }}
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 justify-center">
        <span className="text-xs font-semibold text-[var(--color-foreground)] truncate text-center w-full">
          {theme.name}
        </span>
        {isActive && (
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] absolute top-1 right-1 shrink-0" />
        )}
      </div>
    </button>
  );
}

// Display Mode Toggle
function DisplayModeToggle({
  currentMode,
  onSelect,
}: {
  currentMode: string;
  onSelect: (mode: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-[var(--color-muted)]/50 rounded-xl">
      {displayModeIds.map((id) => {
        const mode = displayModes[id];
        const isActive = currentMode === id;
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              "flex-1 py-1.5 px-2 rounded-lg text-center transition-all duration-200",
              isActive
                ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
            )}
            title={mode.name}
          >
            <span className="text-sm">{mode.icon}</span>
          </button>
        );
      })}
    </div>
  );
}

// Navbar Style Preview
function NavbarStylePreview({
  style,
  isActive,
  onClick,
}: {
  style: (typeof navbarStyles)[string];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all w-full",
        isActive
          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
          : "hover:bg-[var(--color-muted)]/50 text-[var(--color-foreground)]"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">{style.name}</p>
        <p className="text-[10px] text-[var(--color-muted-foreground)]">{style.description}</p>
      </div>
      {isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
      )}
    </button>
  );
}

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"themes" | "display" | "style">("themes");
  const currentTheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const currentNavbarStyle = useNavbarStore((s) => s.style);
  const setNavbarStyle = useNavbarStore((s) => s.setStyle);
  const currentFont = useFontStore((s) => s.font);
  const setFont = useFontStore((s) => s.setFont);
  const currentUIStyle = useUIStyleStore((s) => s.uiStyle);
  const setUIStyle = useUIStyleStore((s) => s.setUIStyle);
  const currentDisplayMode = useDisplayModeStore((s) => s.mode);
  const setDisplayMode = useDisplayModeStore((s) => s.setMode);
  const { selection } = useHapticFeedback();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelectTheme = (id: string) => {
    setTheme(id);
    selection();
  };

  const handleSelectNavbarStyle = (id: string) => {
    setNavbarStyle(id);
    selection();
  };

  const handleSelectFont = (id: string) => {
    setFont(id);
    selection();
  };

  const handleSelectUIStyle = (id: string) => {
    setUIStyle(id);
    selection();
  };

  const handleSelectDisplayMode = (id: string) => {
    setDisplayMode(id);
    selection();
  };

  // UI Style preview icons
  const uiStyleIcons: Record<string, string> = {
    rounded: "○",
    sharp: "□",
    minimal: "—",
    brutalist: "■",
    pill: "●",
  };

  // Separate themes into light and dark
  const lightThemes = themeIds.filter(
    (id) =>
      !["dark-navy", "cyberpunk-neon", "midnight-purple", "carbon-black", "blood-moon", "matrix-green"].includes(id)
  );
  const darkThemes = themeIds.filter((id) =>
    ["dark-navy", "cyberpunk-neon", "midnight-purple", "carbon-black", "blood-moon", "matrix-green"].includes(id)
  );

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        onClick={() => {
          setOpen(!open);
          selection();
        }}
        data-tour="theme-switcher"
        className="h-10 w-10 rounded-xl bg-[var(--color-secondary)] flex items-center justify-center shrink-0 transition-colors hover:bg-[var(--color-muted)]"
        whileTap={{ scale: 0.92 }}
      >
        <Palette className="w-5 h-5 text-[var(--color-foreground)]" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.90, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.90, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-elevated)] overflow-hidden"
          >
            {/* Tab Navigation */}
            <div className="flex border-b border-[var(--color-border)]">
              <button
                onClick={() => setActiveTab("themes")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
                  activeTab === "themes"
                    ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] -mb-px"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                )}
              >
                <Palette className="w-3.5 h-3.5" />
                Couleurs
              </button>
              <button
                onClick={() => setActiveTab("display")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
                  activeTab === "display"
                    ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] -mb-px"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Affichage
              </button>
              <button
                onClick={() => setActiveTab("style")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5",
                  activeTab === "style"
                    ? "text-[var(--color-primary)] border-b-2 border-[var(--color-primary)] -mb-px"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                Style
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[65vh] overflow-y-auto">
              {/* Themes Tab */}
              {activeTab === "themes" && (
                <div className="p-3">
                  {/* Light Themes */}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] px-1 mb-2">
                    Clairs
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 mb-4">
                    {lightThemes.map((id) => (
                      <ThemePreviewCard
                        key={id}
                        theme={themes[id]}
                        isActive={currentTheme === id}
                        onClick={() => handleSelectTheme(id)}
                      />
                    ))}
                  </div>

                  {/* Dark Themes */}
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] px-1 mb-2">
                    Sombres
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {darkThemes.map((id) => (
                      <ThemePreviewCard
                        key={id}
                        theme={themes[id]}
                        isActive={currentTheme === id}
                        onClick={() => handleSelectTheme(id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Display Tab */}
              {activeTab === "display" && (
                <div className="p-3 space-y-4">
                  {/* Display Mode */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] px-1 mb-2 flex items-center gap-1.5">
                      <LayoutGrid className="w-3 h-3" />
                      Mode d&apos;affichage
                    </p>
                    <DisplayModeToggle
                      currentMode={currentDisplayMode}
                      onSelect={handleSelectDisplayMode}
                    />
                    <p className="text-[10px] text-[var(--color-muted-foreground)] mt-1.5 px-1">
                      {displayModes[currentDisplayMode]?.description || ""}
                    </p>
                  </div>

                  {/* Navbar Style */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] px-1 mb-2 flex items-center gap-1.5">
                      <Navigation className="w-3 h-3" />
                      Style Navbar
                    </p>
                    <div className="grid grid-cols-2 gap-1">
                      {navbarStyleIds.map((id) => (
                        <NavbarStylePreview
                          key={id}
                          style={navbarStyles[id]}
                          isActive={currentNavbarStyle === id}
                          onClick={() => handleSelectNavbarStyle(id)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Style Tab */}
              {activeTab === "style" && (
                <div className="p-3 space-y-4">
                  {/* UI Style */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] px-1 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3 h-3" />
                      Style UI
                    </p>
                    <div className="space-y-0.5">
                      {uiStyleIds.map((id) => {
                        const s = uiStyles[id];
                        const isActive = currentUIStyle === id;
                        return (
                          <button
                            key={id}
                            onClick={() => handleSelectUIStyle(id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors",
                              isActive
                                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                : "hover:bg-[var(--color-muted)]/50 text-[var(--color-foreground)]"
                            )}
                          >
                            <span className="text-base font-mono w-5 text-center">
                              {uiStyleIcons[id] || "◯"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">{s.name}</p>
                              <p className="text-[10px] text-[var(--color-muted-foreground)]">
                                {s.description}
                              </p>
                            </div>
                            {isActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Font */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)] px-1 mb-2 flex items-center gap-1.5">
                      <Type className="w-3 h-3" />
                      Police
                    </p>
                    <div className="space-y-0.5">
                      {fontIds.map((id) => {
                        const f = fonts[id];
                        const isActive = currentFont === id;
                        return (
                          <button
                            key={id}
                            onClick={() => handleSelectFont(id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors",
                              isActive
                                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                : "hover:bg-[var(--color-muted)]/50 text-[var(--color-foreground)]"
                            )}
                          >
                            <span className={cn("text-base font-semibold w-5 text-center", f.variable)}>
                              Aa
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium">{f.name}</p>
                              <p className="text-[10px] text-[var(--color-muted-foreground)]">
                                {f.description}
                              </p>
                            </div>
                            {isActive && (
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
