"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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

export function NavbarClassic() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { selection } = useHapticFeedback();
  const mode = useAppModeStore((state) => state.mode);
  const isSimple = mode === "simple";
  const visibleItems = isSimple ? navItems.filter((item) => item.href !== "/profile") : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav pb-safe">
      <div className="flex items-center justify-around px-4 h-[var(--spacing-nav-height)]">
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
                "relative flex flex-col items-center justify-center gap-1 px-5 py-2.5 rounded-xl transition-all duration-300 group",
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)] hover:scale-110"
              )}
            >
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute inset-0 rounded-xl glass-pill shadow-[0_0_12px_oklch(0.50_0.12_20_/_0.15)]"
                />
              )}
              {!isActive && (
                <div className="absolute inset-0 rounded-xl bg-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}
              <div className="relative z-10">
                <Icon className={cn(
                  "w-6 h-6 transition-transform duration-300",
                  !isActive && "group-hover:scale-115"
                )} />
                <AnimatePresence mode="wait">
                  {showBadge && (
                    <motion.div
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
                      className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-semibold text-white px-1 shadow-md"
                    >
                      {itemCount > 99 ? "99+" : itemCount}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className={cn(
                "relative z-10 text-[11px] font-medium transition-all duration-300",
                !isActive && "group-hover:text-[var(--color-foreground)]"
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
