"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutGrid } from "lucide-react";
import { useNavbarStore } from "@/lib/store/navbar";
import { navbarStyles, navbarStyleIds } from "@/lib/navbar-styles";
import { useHapticFeedback } from "@/lib/store/telegram";
import { cn } from "@/lib/utils";

export function NavbarStyleSwitcher() {
  const [open, setOpen] = useState(false);
  const currentStyle = useNavbarStore((s) => s.style);
  const setStyle = useNavbarStore((s) => s.setStyle);
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

  const handleSelect = (id: string) => {
    setStyle(id);
    selection();
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        onClick={() => {
          setOpen(!open);
          selection();
        }}
        className="h-10 w-10 rounded-xl bg-[var(--color-secondary)] flex items-center justify-center shrink-0 transition-colors hover:bg-[var(--color-muted)]"
        whileTap={{ scale: 0.92 }}
      >
        <LayoutGrid className="w-5 h-5 text-[var(--color-foreground)]" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.90, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.90, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-elevated)] overflow-hidden"
          >
            <div className="p-2 space-y-0.5">
              {navbarStyleIds.map((id) => {
                const style = navbarStyles[id];
                const isActive = currentStyle === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleSelect(id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                      isActive
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "hover:bg-[var(--color-muted)]/50 text-[var(--color-foreground)]"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-tight">{style.name}</p>
                      <p className="text-[10px] text-[var(--color-muted-foreground)] leading-tight">
                        {style.description}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
