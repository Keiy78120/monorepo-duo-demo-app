"use client";

import { usePathname, useRouter } from "next/navigation";
import { IoHome, IoCart, IoStar, IoPersonCircle } from "react-icons/io5";
import { MenuDock, type MenuDockItem } from "@/components/ui/menu-dock";
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

export function NavbarDock() {
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = useCartStore((state) => state.getItemCount());
  const { selection } = useHapticFeedback();

  const menuItems: MenuDockItem[] = navItems.map((item) => ({
    label: item.label,
    icon: item.icon,
    isActive: pathname === item.href,
    badge: item.showBadge ? itemCount : undefined,
    onClick: () => {
      selection();
      router.push(item.href);
    },
  }));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe px-4 py-3 flex justify-center">
      <MenuDock items={menuItems} />
    </nav>
  );
}
