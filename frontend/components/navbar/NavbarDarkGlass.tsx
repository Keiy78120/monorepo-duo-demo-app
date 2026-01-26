"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { IoGridOutline, IoCartOutline, IoStarOutline, IoPersonOutline } from "react-icons/io5";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import { useHapticFeedback } from "@/lib/store/telegram";
import { useAppModeStore } from "@/lib/store/app-mode";

const navItems = [
  {
    href: "/",
    icon: IoGridOutline,
    label: "Catalogue",
  },
  {
    href: "/cart",
    icon: IoCartOutline,
    label: "Panier",
    showBadge: true,
  },
  {
    href: "/reviews",
    icon: IoStarOutline,
    label: "Avis",
  },
  {
    href: "/profile",
    icon: IoPersonOutline,
    label: "Profil",
  },
];

export function NavbarDarkGlass() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { selection } = useHapticFeedback();
  const mode = useAppModeStore((state) => state.mode);
  const isSimple = mode === "simple";
  const visibleItems = isSimple ? navItems.filter((item) => item.href !== "/profile") : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 py-3">
      <div className="dark-glass-nav mx-auto max-w-[320px] flex items-center justify-around px-3 py-2">
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
                "nav-item relative flex flex-col items-center justify-center gap-1 p-2.5 transition-all duration-300",
                isActive && "nav-item-active"
              )}
            >
              <div className="relative">
                <motion.div
                  animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Icon className="w-6 h-6" />
                </motion.div>
                {showBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[#ff3b30] text-[9px] font-bold text-white px-1"
                  >
                    {itemCount > 99 ? "+" : itemCount}
                  </motion.div>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="dark-glass-indicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#4fd1c5]"
                  style={{ boxShadow: "0 0 8px rgba(79, 209, 197, 0.8)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
