"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCartStore, formatPrice } from "@/lib/store/cart";
import { useHapticFeedback } from "@/lib/store/telegram";
import { sortTiersByQuantity, calculateDiscountPercentage, calculateTierPriceFromCost } from "@/lib/pricing";
import type { PricingTier, ProductWithPricing, ProductCategory } from "@/lib/db/types";
import { cn } from "@/lib/utils";

interface PricingTierSelectProps {
  product: ProductWithPricing;
  tiers: PricingTier[];
  category?: ProductCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingTierSelect({
  product,
  tiers,
  category,
  open,
  onOpenChange,
}: PricingTierSelectProps) {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(
    tiers.length > 0 ? tiers[0] : null
  );
  const [isAdded, setIsAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { impact, notification } = useHapticFeedback();

  const sortedTiers = sortTiersByQuantity(tiers);

  const handleAddToCart = () => {
    if (!selectedTier) return;

    addItem(product, selectedTier, 1);
    impact("medium");
    notification("success");
    setIsAdded(true);

    setTimeout(() => {
      setIsAdded(false);
      onOpenChange(false);
    }, 1000);
  };

  // Calculate discount for each tier
  const getTierDiscount = (tier: PricingTier): number | null => {
    if (!product.cost_price_per_gram || !product.margin_percentage) return null;
    const calculatedPrice = calculateTierPriceFromCost(
      product.cost_price_per_gram,
      product.margin_percentage,
      tier.quantity_grams
    );
    if (tier.price >= calculatedPrice) return null;
    return calculateDiscountPercentage(tier.price, calculatedPrice);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden flex flex-col" style={{ maxWidth: '24rem', maxHeight: '85vh' }}>
        <DialogHeader className="p-5 pb-4 pr-12 sm:p-6 sm:pb-4">
          <DialogTitle className="text-left leading-tight">
            <span className="text-xs text-[var(--color-muted-foreground)] uppercase tracking-wider block mb-1">
              {category?.name || product.category || "Produit"}
            </span>
            <span className="text-lg sm:text-xl font-bold text-[var(--color-foreground)] break-words">
              {product.variety || product.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-2 sm:px-6">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Choisir la quantité :
          </p>
        </div>

        {/* Tier Options */}
        <div className="px-5 space-y-2 flex-1 overflow-y-auto min-h-0 sm:px-6">
          {sortedTiers.map((tier) => {
            const isSelected = selectedTier?.id === tier.id;
            const discount = getTierDiscount(tier);

            return (
              <motion.button
                key={tier.id}
                onClick={() => setSelectedTier(tier)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 p-4 rounded-xl border-2 transition-all text-left",
                  isSelected
                    ? "border-[var(--color-primary)] bg-[var(--color-secondary)]"
                    : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/50"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                        : "border-[var(--color-muted-foreground)]"
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="font-medium text-[var(--color-foreground)] whitespace-nowrap">
                    {tier.quantity_grams}g
                  </span>
                  {discount && discount > 0 && (
                    <span className="text-xs bg-[var(--color-success)]/20 text-[var(--color-success)] px-2 py-0.5 rounded-full">
                      -{discount}%
                    </span>
                  )}
                </div>
                <span className="font-bold text-[var(--color-foreground)] shrink-0 whitespace-nowrap">
                  {formatPrice(tier.price)}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Add to Cart Button */}
        <div className="p-5 pt-4 border-t border-[var(--color-border)] sm:p-6 sm:pt-4">
          <Button
            onClick={handleAddToCart}
            disabled={!selectedTier || isAdded}
            className={cn(
              "w-full transition-all",
              isAdded && "bg-[var(--color-success)]"
            )}
            size="lg"
          >
            {isAdded ? (
              <>
                <Check className="w-5 h-5 mr-2" />
                Ajouté
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Ajouter au panier
                {selectedTier && (
                  <span className="ml-2 opacity-80">
                    - {formatPrice(selectedTier.price)}
                  </span>
                )}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Compact inline tier select (for product card)
interface InlineTierSelectProps {
  tiers: PricingTier[];
  selectedTier: PricingTier | null;
  onSelect: (tier: PricingTier) => void;
}

export function InlineTierSelect({
  tiers,
  selectedTier,
  onSelect,
}: InlineTierSelectProps) {
  const sortedTiers = sortTiersByQuantity(tiers);

  return (
    <div className="flex flex-wrap gap-1.5">
      {sortedTiers.slice(0, 4).map((tier) => (
        <button
          key={tier.id}
          onClick={() => onSelect(tier)}
          className={cn(
            "px-2 py-1 text-xs rounded-lg transition-all border",
            selectedTier?.id === tier.id
              ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
              : "bg-[var(--color-muted)] text-[var(--color-foreground)] border-[var(--color-border)] hover:border-[var(--color-primary)]"
          )}
        >
          {tier.quantity_grams}g
        </button>
      ))}
    </div>
  );
}
