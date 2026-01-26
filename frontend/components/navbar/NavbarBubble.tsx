"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { IoHome, IoCart, IoStar, IoPersonCircle } from "react-icons/io5";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cart";
import { useHapticFeedback } from "@/lib/store/telegram";
import { useAppModeStore } from "@/lib/store/app-mode";

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

export function NavbarBubble() {
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { selection } = useHapticFeedback();
  const mode = useAppModeStore((state) => state.mode);
  const isSimple = mode === "simple";
  const visibleItems = isSimple ? navItems.filter((item) => item.href !== "/profile") : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 py-3">
      <div className="bubble-nav mx-auto max-w-fit flex items-center gap-3 px-4 py-2">
        {visibleItems.map((item) => {
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
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive
                    ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg"
                    : "bg-[var(--color-muted)]/50 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                )}
                whileTap={{ scale: 0.9 }}
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon className="w-5 h-5" />
                {showBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-destructive)] text-[10px] font-bold text-white px-1"
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
