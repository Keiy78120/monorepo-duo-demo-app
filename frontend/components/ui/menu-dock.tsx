"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export interface MenuDockItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
  badge?: number;
}

interface MenuDockProps {
  items: MenuDockItem[];
  className?: string;
  onItemClick?: (item: MenuDockItem) => void;
}

export function MenuDock({ items, className, onItemClick }: MenuDockProps) {
  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-1 bg-[var(--color-card)] p-2",
        "border border-[var(--color-border)]",
        className
      )}
      style={{
        borderRadius: 'var(--radius-2xl, 1.5rem)',
        boxShadow: 'var(--shadow-card)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <motion.button
            key={item.label}
            onClick={() => {
              item.onClick?.();
              onItemClick?.(item);
            }}
            className={cn(
              "relative flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-colors min-w-[60px]",
              item.isActive
                ? "bg-[var(--color-muted)] text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/50"
            )}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Icon container */}
            <div className="relative flex items-center justify-center w-7 h-7 mb-1">
              <Icon className="w-6 h-6" />
              {/* Badge */}
              <AnimatePresence mode="wait">
                {item.badge !== undefined && item.badge > 0 && (
                  <motion.span
                    key="badge"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                      duration: 0.15
                    }}
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[var(--color-primary)] text-[9px] font-bold text-white px-1"
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            {/* Label */}
            <span className="text-[11px] font-medium">{item.label}</span>

            {/* Active underline indicator */}
            {item.isActive && (
              <motion.div
                layoutId="menu-dock-underline"
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[var(--color-foreground)]"
                initial={false}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
