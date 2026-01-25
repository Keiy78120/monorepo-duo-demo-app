"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { IoGrid, IoCart, IoStar, IoPerson, IoGridOutline, IoCartOutline, IoStarOutline, IoPersonOutline } from "react-icons/io5";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import { useHapticFeedback } from "@/lib/store/telegram";

const navItems = [
  {
    href: "/",
    icon: IoGridOutline,
    iconActive: IoGrid,
    label: "Catalogue",
  },
  {
    href: "/cart",
    icon: IoCartOutline,
    iconActive: IoCart,
    label: "Panier",
    showBadge: true,
  },
  {
    href: "/reviews",
    icon: IoStarOutline,
    iconActive: IoStar,
    label: "Avis",
  },
  {
    href: "/profile",
    icon: IoPersonOutline,
    iconActive: IoPerson,
    label: "Profil",
  },
];

export function NavbarMaterial() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { selection } = useHapticFeedback();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="material-nav mx-4 mb-3 flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = isActive ? item.iconActive : item.icon;
          const showBadge = item.showBadge && itemCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => selection()}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-4 rounded-2xl transition-all duration-200",
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="material-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-[var(--color-primary)]"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                className={cn(
                  "relative p-2 rounded-full transition-colors",
                  isActive && "bg-[var(--color-primary)]/10"
                )}
                animate={isActive ? { scale: 1 } : { scale: 1 }}
              >
                <Icon className="w-6 h-6" />
                {showBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-[var(--color-destructive)] text-[9px] font-bold text-white px-1"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </motion.div>
                )}
              </motion.div>
              <motion.span
                className="text-[10px] font-medium mt-0.5"
                animate={isActive ? { fontWeight: 600 } : { fontWeight: 500 }}
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
