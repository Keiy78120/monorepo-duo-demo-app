"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/components/CartItem";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useCartStore, formatPrice } from "@/lib/store/cart";
import { useHapticFeedback } from "@/lib/store/telegram";

export default function CartPage() {
  const router = useRouter();
  const { items, getTotal } = useCartStore();
  const { impact } = useHapticFeedback();

  const total = getTotal();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (items.length === 0) return;
    impact("medium");
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="px-5 pt-6">
        <PageHeader title="Panier" />
        <EmptyState
          icon={ShoppingBag}
          title="Votre panier est vide"
          description="Parcourez notre catalogue et ajoutez des produits à votre panier"
          action={{
            label: "Voir les produits",
            onClick: () => router.push("/"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="px-5 pt-6">
      <PageHeader
        title="Panier"
        subtitle={`${itemCount} ${itemCount === 1 ? "article" : "articles"}`}
      />

      {/* Cart Items */}
      <div className="space-y-3 mb-6">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <CartItem key={item.product.id} item={item} index={index} />
          ))}
        </AnimatePresence>
      </div>

      {/* Order Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 space-y-4"
      >
        <h3 className="font-semibold text-[var(--color-foreground)]">
          Récapitulatif
        </h3>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted-foreground)]">Sous-total</span>
            <span className="text-[var(--color-foreground)]">
              {formatPrice(total)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted-foreground)]">Livraison</span>
            <span className="text-[var(--color-success)]">Gratuite</span>
          </div>
        </div>

        <div className="h-px bg-[var(--color-border)]" />

        <div className="flex justify-between">
          <span className="font-semibold text-[var(--color-foreground)]">Total</span>
          <span className="text-xl font-bold text-[var(--color-foreground)]">
            {formatPrice(total)}
          </span>
        </div>

        <Button
          onClick={handleCheckout}
          className="w-full"
          size="lg"
          variant="success"
        >
          Commander
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
