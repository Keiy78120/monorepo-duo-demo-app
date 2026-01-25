"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { IoHome, IoCart, IoStar, IoPersonCircle } from "react-icons/io5";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import { useHapticFeedback } from "@/lib/store/telegram";

const navItems = [
  {
    href: "/",
    icon: IoHome,
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
    icon: IoPersonCircle,
    label: "Profil",
  },
];

export function NavbarLiquidPill() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { selection } = useHapticFeedback();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 py-3 flex justify-center">
      <div className="liquid-pill-nav flex items-center gap-1 px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showBadge = item.showBadge && itemCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => selection()}
              className="relative"
            >
              <motion.div
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300",
                  isActive
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]/30"
                )}
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Icon className="w-5 h-5" />
                {isActive && (
                  <motion.span
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="text-xs font-semibold whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
                {showBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1",
                      isActive
                        ? "bg-white text-[var(--color-primary)]"
                        : "bg-[var(--color-destructive)] text-white"
                    )}
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </motion.div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
