"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { IoGrid, IoCart, IoStar, IoPerson } from "react-icons/io5";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import { useHapticFeedback } from "@/lib/store/telegram";
import { useAppModeStore } from "@/lib/store/app-mode";

const navItems = [
  {
    href: "/",
    icon: IoGrid,
    label: "Catalogue",
  },
  {
    href: "/cart",
    icon: IoCart,
    label: "Panier",
    showBadge: true,
  },
  {
    href: "/reviews",
    icon: IoStar,
    label: "Avis",
  },
  {
    href: "/profile",
    icon: IoPerson,
    label: "Profil",
  },
];

export function NavbarNeonGlow() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { selection } = useHapticFeedback();
  const mode = useAppModeStore((state) => state.mode);
  const isSimple = mode === "simple";
  const visibleItems = isSimple ? navItems.filter((item) => item.href !== "/profile") : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 py-3">
      <div className="neon-glow-nav mx-auto max-w-[340px] flex items-center justify-around px-4 py-3">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showBadge = item.showBadge && itemCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => selection()}
              className={cn(
                "nav-item relative flex flex-col items-center justify-center gap-1 px-4 py-2 transition-all duration-300",
                isActive && "nav-item-active"
              )}
            >
              <div className="relative">
                <motion.div
                  animate={isActive ? {
                    filter: "drop-shadow(0 0 8px var(--color-primary))",
                    color: "var(--color-primary)"
                  } : {
                    filter: "none",
                    color: "var(--color-muted-foreground)"
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                {showBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[var(--color-accent)] text-[9px] font-bold text-[var(--color-accent-foreground)] px-1 shadow-[0_0_8px_var(--color-accent)]"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </motion.div>
                )}
              </div>
              <motion.span
                className="text-[10px] font-medium"
                animate={isActive ? {
                  textShadow: "0 0 10px var(--color-primary)",
                  color: "var(--color-primary)"
                } : {
                  textShadow: "none",
                  color: "var(--color-muted-foreground)"
                }}
              >
                {item.label}
              </motion.span>
              {isActive && (
                <motion.div
                  layoutId="neon-indicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--color-primary)]"
                  style={{ boxShadow: "0 0 8px var(--color-primary), 0 0 16px var(--color-primary)" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
