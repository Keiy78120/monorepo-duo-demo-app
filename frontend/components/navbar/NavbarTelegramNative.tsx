"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { IoHome, IoCart, IoStar, IoPersonCircle } from "react-icons/io5";
import { cn } from "@/lib/utils";
import { useCartStore, formatPrice } from "@/lib/store/cart";
import { useTelegramStore, useHapticFeedback } from "@/lib/store/telegram";
import { useAppModeStore } from "@/lib/store/app-mode";

const navItems = [
  {
    href: "/",
    icon: IoHome,
    label: "Menu",
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

export function NavbarTelegramNative() {
  const pathname = usePathname();
  const router = useRouter();
  const { items, getTotal } = useCartStore();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { webApp, isInTelegram } = useTelegramStore();
  const { selection } = useHapticFeedback();
  const mode = useAppModeStore((state) => state.mode);
  const isSimple = mode === "simple";
  const visibleItems = isSimple ? navItems.filter((item) => item.href !== "/profile") : navItems;

  const total = getTotal();
  const hasItems = items.length > 0;

  // Integrate with Telegram MainButton for cart actions
  useEffect(() => {
    if (!webApp || !isInTelegram) return;

    const isCartPage = pathname === "/cart";
    const isCheckoutPage = pathname === "/checkout";

    // Hide MainButton on checkout page (it has its own submit button)
    if (isCheckoutPage) {
      webApp.MainButton?.hide();
      return;
    }

    // Show MainButton on cart page when there are items
    if (isCartPage && hasItems) {
      webApp.MainButton?.setParams({
        text: `Commander - ${formatPrice(total)}`,
        color: "#22c55e", // Success green
        text_color: "#ffffff",
        has_shine_effect: true, // Liquid glass effect on iOS!
        is_visible: true,
        is_active: true,
      });

      const handleClick = () => {
        router.push("/checkout");
      };

      webApp.MainButton?.onClick(handleClick);

      return () => {
        webApp.MainButton?.offClick(handleClick);
      };
    } else {
      webApp.MainButton?.hide();
    }
  }, [webApp, isInTelegram, pathname, hasItems, total, router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (webApp?.MainButton) {
        webApp.MainButton.hide();
      }
    };
  }, [webApp]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 py-3 flex justify-center">
      <div className="telegram-liquid-nav flex items-center justify-around w-full max-w-sm px-2 py-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showBadge = item.showBadge && itemCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => selection()}
              className="relative flex flex-col items-center justify-center gap-1 py-2 px-4"
            >
              <motion.div
                className="relative"
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div
                  animate={isActive ? {
                    scale: 1.1,
                  } : {
                    scale: 1,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6 transition-colors duration-200",
                      isActive
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-muted-foreground)]"
                    )}
                  />
                </motion.div>
                {showBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--color-destructive)] text-[10px] font-bold text-white px-1"
                  >
                    {itemCount > 99 ? "99+" : itemCount}
                  </motion.div>
                )}
              </motion.div>
              <motion.span
                className={cn(
                  "text-[10px] font-medium transition-colors duration-200",
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)]"
                )}
              >
                {item.label}
              </motion.span>

              {/* Active indicator dot with glow */}
              {isActive && (
                <motion.div
                  layoutId="telegram-nav-indicator"
                  className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[var(--color-primary)]"
                  style={{
                    boxShadow: "0 0 8px var(--color-primary), 0 0 16px var(--color-primary)"
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
