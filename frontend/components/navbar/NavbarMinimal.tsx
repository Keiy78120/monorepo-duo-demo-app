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

export function NavbarMinimal() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { selection } = useHapticFeedback();
  const mode = useAppModeStore((state) => state.mode);
  const isSimple = mode === "simple";
  const visibleItems = isSimple ? navItems.filter((item) => item.href !== "/profile") : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 py-4">
      <div className="minimal-nav mx-auto max-w-[220px] flex items-center justify-around px-4 py-3">
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
                "relative flex flex-col items-center justify-center gap-1.5 p-2 transition-all duration-300",
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              )}
            >
              <div className="relative">
                <Icon className={cn(
                  "w-6 h-6 transition-transform duration-300",
                  isActive && "scale-110"
                )} />
                {showBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full bg-[var(--color-primary)] text-[8px] font-bold text-white px-0.5"
                  >
                    {itemCount > 99 ? "+" : itemCount}
                  </motion.div>
                )}
              </div>
              {isActive && (
                <motion.div
                  layoutId="minimal-active-dot"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="w-1 h-1 rounded-full bg-[var(--color-primary)]"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
